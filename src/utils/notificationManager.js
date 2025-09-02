// src/utils/notificationManager.js
class NotificationManager {
  constructor() {
    this.swRegistration = null;
    this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
  }

  async init() {
    if (!this.isSupported) {
      return false;
    }

    try {
      this.swRegistration = await navigator.serviceWorker.ready;
      return true;
    } catch (error) {
      console.error('Service worker not ready:', error);
      return false;
    }
  }

  async requestPermission() {
    if (!this.isSupported) return 'denied';
    
    const permission = await Notification.requestPermission();
    return permission;
  }

  async getSubscription() {
    if (!this.swRegistration) {
      await this.init();
    }

    try {
      return await this.swRegistration.pushManager.getSubscription();
    } catch (error) {
      console.error('Error getting subscription:', error);
      return null;
    }
  }

  async subscribe() {
    if (!this.swRegistration) {
      await this.init();
    }

    try {
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          // You'll need to generate VAPID keys for production
          'BEl62iUYgUivxIkv69yViEuiBIa40HI0PiQXjbllIDC4ScGPTfAlQCinFYKlD8Z_aPnYqE0_wUuYmVrPHiPIXwY'
        )
      });

      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  async unsubscribe() {
    const subscription = await this.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      return true;
    }
    return false;
  }

  // Convert VAPID key for subscription
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Show local notification (for testing)
  showLocalNotification(title, options = {}) {
    if (!this.isSupported) return;

    const defaultOptions = {
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      },
      actions: [
        {
          action: 'view',
          title: 'View',
          icon: '/icon-192.png'
        },
        {
          action: 'close',
          title: 'Close',
          icon: '/icon-192.png'
        }
      ]
    };

    this.swRegistration.showNotification(title, { ...defaultOptions, ...options });
  }

  // Tennis-specific notification types
  notifyMatchScheduled(matchDetails) {
    this.showLocalNotification(
      '🎾 New Match Scheduled',
      {
        body: `Match scheduled for ${matchDetails.date}. Check your availability!`,
        tag: 'match-scheduled',
        data: { type: 'match-scheduled', matchId: matchDetails.id }
      }
    );
  }

  notifyAvailabilityNeeded() {
    this.showLocalNotification(
      '⏰ Availability Required',
      {
        body: 'Please update your availability for upcoming matches',
        tag: 'availability-needed',
        data: { type: 'availability-needed' }
      }
    );
  }

  notifyMatchResult(result) {
    this.showLocalNotification(
      '📊 Match Result Posted',
      {
        body: `${result.winner} won! Check the updated ladder standings.`,
        tag: 'match-result',
        data: { type: 'match-result', resultId: result.id }
      }
    );
  }

  notifyRankingUpdate(newRank, oldRank) {
    const movement = newRank < oldRank ? 'up' : newRank > oldRank ? 'down' : 'same';
    const emoji = movement === 'up' ? '📈' : movement === 'down' ? '📉' : '🔄';
    
    this.showLocalNotification(
      `${emoji} Ranking Update`,
      {
        body: `You moved ${movement === 'same' ? 'to' : movement} to position #${newRank}!`,
        tag: 'ranking-update',
        data: { type: 'ranking-update', newRank, oldRank }
      }
    );
  }
}

// Export singleton instance
export const notificationManager = new NotificationManager();
export default notificationManager;