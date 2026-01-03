// Version Manager - Handles automatic updates and cache busting
// Version is auto-injected from package.json during build
export const APP_VERSION = '1.0.180'; // Auto-updated by build script

class VersionManager {
  constructor() {
    this.currentVersion = APP_VERSION;
    this.swRegistration = null;
    this.updateAvailable = false;
    this.listeners = new Set();
    this.preReloadCallbacks = new Set();
  }

  // Add callback to execute before reload (for saving state)
  addPreReloadCallback(callback) {
    this.preReloadCallbacks.add(callback);
    return () => this.preReloadCallbacks.delete(callback);
  }

  // Execute all pre-reload callbacks and then reload
  async gracefulReload(reason = 'update') {
    // Notify all pre-reload callbacks
    const promises = [];
    this.preReloadCallbacks.forEach(callback => {
      try {
        const result = callback(reason);
        if (result instanceof Promise) {
          promises.push(result);
        }
      } catch (error) {
        console.error('[VM] Pre-reload callback error:', error);
      }
    });

    // Wait for all callbacks to complete (with timeout)
    if (promises.length > 0) {
      try {
        await Promise.race([
          Promise.all(promises),
          new Promise(resolve => setTimeout(resolve, 1000)) // 1s timeout
        ]);
      } catch (error) {
        console.error('[VM] Pre-reload promises failed:', error);
      }
    }

    // Now perform the reload
    window.location.reload();
  }

  // Initialize service worker and version checking
  async init() {
    if ('serviceWorker' in navigator) {
      try {
        this.swRegistration = await navigator.serviceWorker.register('/sw.js');
        
        // Listen for service worker updates
        this.swRegistration.addEventListener('updatefound', () => {
          const newWorker = this.swRegistration.installing;
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.updateAvailable = true;
              this.notifyListeners('updateAvailable', { version: this.currentVersion });
            }
          });
        });

        // Listen for service worker messages
        navigator.serviceWorker.addEventListener('message', (event) => {
          
          if (event.data.type === 'NEW_VERSION_ACTIVE') {
            this.notifyListeners('newVersionActive', event.data);
          }
        });

        // Check for updates periodically (every 5 minutes)
        setInterval(() => {
          this.checkForUpdates();
        }, 5 * 60 * 1000);

        // Initial check
        this.checkForUpdates();
        
        return true;
      } catch (error) {
        console.error('[VM] Service worker registration failed:', error);
        return false;
      }
    } else {
      console.warn('[VM] Service workers not supported');
      return false;
    }
  }

  // Check for service worker updates
  async checkForUpdates() {
    if (this.swRegistration) {
      try {
        await this.swRegistration.update();
      } catch (error) {
        console.error('[VM] Update check failed:', error);
      }
    }
  }

  // Force update to new version
  async applyUpdate() {
    if (this.swRegistration && this.updateAvailable) {
      const newWorker = this.swRegistration.waiting;
      if (newWorker) {
        newWorker.postMessage({ type: 'SKIP_WAITING' });

        // Gracefully reload page after a short delay
        setTimeout(async () => {
          await this.gracefulReload('serviceWorkerUpdate');
        }, 500);

        return true;
      }
    }
    return false;
  }

  // Clear all caches and reload
  async clearCacheAndReload() {
    try {
      // Clear service worker cache
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = async (event) => {
          if (event.data.type === 'CACHE_CLEARED') {
            await this.gracefulReload('cacheCleared');
          }
        };

        navigator.serviceWorker.controller.postMessage(
          { type: 'CLEAR_CACHE' },
          [messageChannel.port2]
        );
      } else {
        // Fallback: clear browser cache and reload
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(name => caches.delete(name)));
        }
        await this.gracefulReload('cacheClearedFallback');
      }
    } catch (error) {
      console.error('[VM] Failed to clear cache:', error);
      // Gracefully reload anyway
      await this.gracefulReload('cacheClearError');
    }
  }

  // Add cache-busting parameters to important requests
  bustCache(url) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}v=${this.currentVersion}&t=${Date.now()}`;
  }

  // Add event listener for version updates
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify all listeners
  notifyListeners(type, data) {
    this.listeners.forEach(callback => {
      try {
        callback(type, data);
      } catch (error) {
        console.error('[VM] Listener error:', error);
      }
    });
  }

  // Get current version info
  getVersionInfo() {
    return {
      version: this.currentVersion,
      updateAvailable: this.updateAvailable,
      swRegistered: !!this.swRegistration
    };
  }
}

// Create singleton instance
export const versionManager = new VersionManager();

// Auto-initialize when imported
if (typeof window !== 'undefined') {
  // Initialize after a short delay to ensure DOM is ready
  setTimeout(() => {
    versionManager.init();
  }, 1000);
}

export default versionManager;