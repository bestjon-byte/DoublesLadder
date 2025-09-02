// src/utils/pushNotificationTriggers.js
// This file contains utilities to trigger push notifications from your app logic
import { notificationManager } from './notificationManager';

export class PushNotificationTriggers {
  constructor(supabaseClient, currentUser) {
    this.supabase = supabaseClient;
    this.currentUser = currentUser;
  }

  // Check if user has notifications enabled for a specific type
  async shouldSendNotification(userId, notificationType) {
    try {
      const settings = localStorage.getItem(`notifications_${userId}`);
      if (!settings) return true; // Default to enabled
      
      const parsed = JSON.parse(settings);
      return parsed[notificationType] !== false;
    } catch (error) {
      console.error('Error checking notification settings:', error);
      return true; // Default to enabled on error
    }
  }

  // Trigger when a new match is scheduled
  async onMatchScheduled(matchData) {
    console.log('🎾 Match scheduled trigger:', matchData);
    
    // Get all players in the match
    const playerIds = [
      ...matchData.pair1_players || [],
      ...matchData.pair2_players || []
    ].filter(Boolean);

    // Send notifications to each player
    for (const playerId of playerIds) {
      if (await this.shouldSendNotification(playerId, 'matchScheduled')) {
        // In a real app, you'd send this to your server to push to that user
        console.log(`Would send match scheduled notification to user ${playerId}`);
        
        // For demo purposes, if it's the current user, show local notification
        if (playerId === this.currentUser?.id) {
          notificationManager.notifyMatchScheduled({
            id: matchData.id,
            date: new Date(matchData.match_date).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short', 
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit'
            })
          });
        }
      }
    }

    // Store notification in database for server-side processing
    await this.logNotificationEvent('match_scheduled', {
      matchId: matchData.id,
      playerIds,
      matchDate: matchData.match_date
    });
  }

  // Trigger when availability is needed
  async onAvailabilityNeeded(matchIds) {
    console.log('⏰ Availability needed trigger:', matchIds);
    
    if (await this.shouldSendNotification(this.currentUser?.id, 'availabilityReminder')) {
      notificationManager.notifyAvailabilityNeeded();
      
      await this.logNotificationEvent('availability_needed', {
        matchIds,
        userId: this.currentUser?.id
      });
    }
  }

  // Trigger when match result is posted
  async onMatchResultPosted(matchResult) {
    console.log('📊 Match result posted trigger:', matchResult);
    
    // Get all players involved
    const playerIds = [
      ...matchResult.pair1_players || [],
      ...matchResult.pair2_players || []
    ].filter(Boolean);

    for (const playerId of playerIds) {
      if (await this.shouldSendNotification(playerId, 'matchResults')) {
        console.log(`Would send match result notification to user ${playerId}`);
        
        // For demo purposes, if it's the current user, show local notification
        if (playerId === this.currentUser?.id) {
          notificationManager.notifyMatchResult({
            id: matchResult.id,
            winner: matchResult.winner_pair_names || 'Someone',
            score: matchResult.score || 'Unknown score'
          });
        }
      }
    }

    await this.logNotificationEvent('match_result', {
      matchId: matchResult.id,
      playerIds,
      winner: matchResult.winner_pair_names
    });
  }

  // Trigger when rankings are updated
  async onRankingUpdate(rankingUpdates) {
    console.log('📈 Ranking update trigger:', rankingUpdates);
    
    for (const update of rankingUpdates) {
      if (await this.shouldSendNotification(update.playerId, 'rankingUpdates')) {
        console.log(`Would send ranking update notification to user ${update.playerId}`);
        
        // For demo purposes, if it's the current user, show local notification
        if (update.playerId === this.currentUser?.id) {
          notificationManager.notifyRankingUpdate(update.newRank, update.oldRank);
        }
      }
    }

    await this.logNotificationEvent('ranking_update', {
      updates: rankingUpdates
    });
  }

  // Log notification events for server-side processing
  async logNotificationEvent(type, data) {
    try {
      const { error } = await this.supabase
        .from('notification_events')
        .insert({
          event_type: type,
          event_data: data,
          created_by: this.currentUser?.id,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error logging notification event:', error);
      } else {
        console.log(`✅ Logged notification event: ${type}`);
      }
    } catch (error) {
      console.error('Error logging notification event:', error);
    }
  }

  // Test notification system
  async testNotifications() {
    console.log('🧪 Testing notification system...');
    
    // Test different notification types
    await this.onMatchScheduled({
      id: 'test-match',
      match_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      pair1_players: [this.currentUser?.id],
      pair2_players: ['other-player-id']
    });

    setTimeout(() => {
      this.onAvailabilityNeeded(['test-match']);
    }, 2000);

    setTimeout(() => {
      this.onMatchResultPosted({
        id: 'test-result',
        pair1_players: [this.currentUser?.id],
        pair2_players: ['other-player-id'],
        winner_pair_names: 'Test Winners',
        score: '6-4, 6-2'
      });
    }, 4000);

    setTimeout(() => {
      this.onRankingUpdate([{
        playerId: this.currentUser?.id,
        oldRank: 5,
        newRank: 3
      }]);
    }, 6000);
  }
}

// Export utility function to create triggers instance
export const createNotificationTriggers = (supabaseClient, currentUser) => {
  return new PushNotificationTriggers(supabaseClient, currentUser);
};

export default PushNotificationTriggers;