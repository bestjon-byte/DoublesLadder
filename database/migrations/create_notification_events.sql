-- Create notification events table for push notification tracking
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS notification_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  processed_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notification_events_type ON notification_events(event_type);
CREATE INDEX IF NOT EXISTS idx_notification_events_created_by ON notification_events(created_by);
CREATE INDEX IF NOT EXISTS idx_notification_events_processed ON notification_events(processed_at) WHERE processed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notification_events_created_at ON notification_events(created_at);

-- Create user push subscriptions table
CREATE TABLE IF NOT EXISTS user_push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  subscription_data JSONB NOT NULL,
  device_info JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, subscription_data)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON user_push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON user_push_subscriptions(is_active) WHERE is_active = true;

-- Create notification preferences table
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  match_scheduled BOOLEAN DEFAULT true,
  availability_reminder BOOLEAN DEFAULT true,
  match_results BOOLEAN DEFAULT true,
  ranking_updates BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON user_notification_preferences(user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_user_push_subscriptions_updated_at 
    BEFORE UPDATE ON user_push_subscriptions 
    FOR EACH ROW 
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_user_notification_preferences_updated_at 
    BEFORE UPDATE ON user_notification_preferences 
    FOR EACH ROW 
    EXECUTE PROCEDURE update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE notification_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- notification_events: users can only see their own events
CREATE POLICY "Users can view own notification events" ON notification_events
  FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can create notification events" ON notification_events
  FOR INSERT WITH CHECK (created_by = auth.uid());

-- user_push_subscriptions: users can manage their own subscriptions
CREATE POLICY "Users can view own push subscriptions" ON user_push_subscriptions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own push subscriptions" ON user_push_subscriptions
  FOR ALL USING (user_id = auth.uid());

-- user_notification_preferences: users can manage their own preferences
CREATE POLICY "Users can view own notification preferences" ON user_notification_preferences
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own notification preferences" ON user_notification_preferences
  FOR ALL USING (user_id = auth.uid());

-- Grant permissions (if needed)
-- GRANT USAGE ON SCHEMA public TO authenticated;
-- GRANT ALL ON notification_events TO authenticated;
-- GRANT ALL ON user_push_subscriptions TO authenticated;
-- GRANT ALL ON user_notification_preferences TO authenticated;