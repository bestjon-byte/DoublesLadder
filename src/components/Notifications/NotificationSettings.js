// src/components/Notifications/NotificationSettings.js
import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Check, X, Settings } from 'lucide-react';
import { notificationManager } from '../../utils/notificationManager';

const NotificationSettings = ({ currentUser, onSettingsUpdate }) => {
  const [permission, setPermission] = useState(Notification.permission);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    matchScheduled: true,
    availabilityReminder: true,
    matchResults: true,
    rankingUpdates: true,
  });

  useEffect(() => {
    checkSubscriptionStatus();
    loadUserSettings();
  }, [currentUser]);

  const checkSubscriptionStatus = async () => {
    if (!notificationManager.isSupported) return;
    
    await notificationManager.init();
    const subscription = await notificationManager.getSubscription();
    setIsSubscribed(!!subscription);
  };

  const loadUserSettings = () => {
    // In a real app, this would load from your database
    const savedSettings = localStorage.getItem(`notifications_${currentUser?.id}`);
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  };

  const saveSettings = (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem(`notifications_${currentUser?.id}`, JSON.stringify(newSettings));
    if (onSettingsUpdate) {
      onSettingsUpdate(newSettings);
    }
  };

  const handlePermissionRequest = async () => {
    setLoading(true);
    
    try {
      const permissionResult = await notificationManager.requestPermission();
      setPermission(permissionResult);
      
      if (permissionResult === 'granted') {
        const subscription = await notificationManager.subscribe();
        setIsSubscribed(!!subscription);
        
        if (subscription) {
          // Here you would typically send the subscription to your server
          // TODO: Send subscription data to server for storage
          
          // Show success notification
          notificationManager.showLocalNotification(
            '🎾 Tennis Notifications Enabled',
            {
              body: 'You\'ll now receive updates about matches, rankings, and more!',
              tag: 'welcome-notification'
            }
          );
        }
      }
    } catch (error) {
      console.error('Error handling notification permission:', error);
    }
    
    setLoading(false);
  };

  const handleUnsubscribe = async () => {
    setLoading(true);
    
    try {
      await notificationManager.unsubscribe();
      setIsSubscribed(false);
    } catch (error) {
      console.error('Error unsubscribing:', error);
    }
    
    setLoading(false);
  };

  const handleSettingChange = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  const testNotification = () => {
    notificationManager.notifyMatchScheduled({
      id: 'test',
      date: 'Tomorrow 7:00 PM'
    });
  };

  if (!notificationManager.isSupported) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-yellow-700">
          <BellOff className="w-5 h-5" />
          <span className="font-medium">Push notifications not supported</span>
        </div>
        <p className="text-sm text-yellow-600 mt-1">
          Your browser or device doesn't support push notifications.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Permission Status */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {permission === 'granted' && isSubscribed ? (
              <Bell className="w-6 h-6 text-green-600" />
            ) : (
              <BellOff className="w-6 h-6 text-gray-400" />
            )}
            <div>
              <h3 className="font-semibold text-gray-900">Push Notifications</h3>
              <p className="text-sm text-gray-600">
                {permission === 'granted' && isSubscribed
                  ? 'Enabled - You\'ll receive tennis updates'
                  : permission === 'denied'
                  ? 'Blocked - Enable in browser settings'
                  : 'Not enabled - Click to enable notifications'
                }
              </p>
            </div>
          </div>
          
          {permission === 'granted' && isSubscribed ? (
            <button
              onClick={handleUnsubscribe}
              disabled={loading}
              className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-md hover:bg-red-50 disabled:opacity-50"
            >
              {loading ? 'Disabling...' : 'Disable'}
            </button>
          ) : permission !== 'denied' ? (
            <button
              onClick={handlePermissionRequest}
              disabled={loading}
              className="px-4 py-2 text-sm bg-[#5D1F1F] text-white rounded-md hover:bg-[#4A1818] disabled:opacity-50"
            >
              {loading ? 'Enabling...' : 'Enable Notifications'}
            </button>
          ) : null}
        </div>

        {permission === 'granted' && isSubscribed && (
          <button
            onClick={testNotification}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <Settings className="w-4 h-4" />
            Test notification
          </button>
        )}
      </div>

      {/* Notification Preferences */}
      {permission === 'granted' && isSubscribed && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Notification Preferences</h3>
          
          <div className="space-y-4">
            <NotificationToggle
              label="Match Scheduling"
              description="When new matches are scheduled"
              icon="🎾"
              checked={settings.matchScheduled}
              onChange={(checked) => handleSettingChange('matchScheduled', checked)}
            />
            
            <NotificationToggle
              label="Availability Reminders"
              description="Reminders to update your availability"
              icon="⏰"
              checked={settings.availabilityReminder}
              onChange={(checked) => handleSettingChange('availabilityReminder', checked)}
            />
            
            <NotificationToggle
              label="Match Results"
              description="When match results are posted"
              icon="📊"
              checked={settings.matchResults}
              onChange={(checked) => handleSettingChange('matchResults', checked)}
            />
            
            <NotificationToggle
              label="Ranking Updates"
              description="When your ladder position changes"
              icon="📈"
              checked={settings.rankingUpdates}
              onChange={(checked) => handleSettingChange('rankingUpdates', checked)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const NotificationToggle = ({ label, description, icon, checked, onChange }) => {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        <span className="text-xl">{icon}</span>
        <div>
          <div className="font-medium text-gray-900">{label}</div>
          <div className="text-sm text-gray-600">{description}</div>
        </div>
      </div>
      
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-[#5D1F1F]' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
};

export default NotificationSettings;