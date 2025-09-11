// Version Manager - Handles automatic updates and cache busting
export const APP_VERSION = '1.0.45'; // Should match the version in sw.js

class VersionManager {
  constructor() {
    this.currentVersion = APP_VERSION;
    this.swRegistration = null;
    this.updateAvailable = false;
    this.listeners = new Set();
  }

  // Initialize service worker and version checking
  async init() {
    if ('serviceWorker' in navigator) {
      try {
        console.log('[VM] Registering service worker...');
        this.swRegistration = await navigator.serviceWorker.register('/sw.js');
        
        // Listen for service worker updates
        this.swRegistration.addEventListener('updatefound', () => {
          console.log('[VM] New service worker found, installing...');
          const newWorker = this.swRegistration.installing;
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[VM] New version available!');
              this.updateAvailable = true;
              this.notifyListeners('updateAvailable', { version: this.currentVersion });
            }
          });
        });

        // Listen for service worker messages
        navigator.serviceWorker.addEventListener('message', (event) => {
          console.log('[VM] Received message from SW:', event.data);
          
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
        
        console.log('[VM] Version manager initialized successfully');
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
        console.log('[VM] Checked for updates');
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
        console.log('[VM] Applying update...');
        newWorker.postMessage({ type: 'SKIP_WAITING' });
        
        // Reload page after a short delay
        setTimeout(() => {
          window.location.reload();
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
        messageChannel.port1.onmessage = (event) => {
          if (event.data.type === 'CACHE_CLEARED') {
            console.log('[VM] Cache cleared, reloading...');
            window.location.reload();
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
        window.location.reload();
      }
    } catch (error) {
      console.error('[VM] Failed to clear cache:', error);
      // Force reload anyway
      window.location.reload();
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