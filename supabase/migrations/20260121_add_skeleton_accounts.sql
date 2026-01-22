-- Migration: Add skeleton account support for new attendees
-- Created: 2026-01-21
-- Purpose: Allow coaches to register new people at sessions with minimal info

-- Add skeleton account fields to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_skeleton BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS skeleton_created_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS skeleton_session_id UUID REFERENCES coaching_sessions(id),
ADD COLUMN IF NOT EXISTS skeleton_created_at TIMESTAMPTZ;

-- Create index for quick lookup of skeleton accounts
CREATE INDEX IF NOT EXISTS idx_profiles_is_skeleton ON profiles(is_skeleton) WHERE is_skeleton = TRUE;

-- Create admin_notifications table for tracking notifications
CREATE TABLE IF NOT EXISTS admin_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_type TEXT NOT NULL, -- 'skeleton_account', 'payment_confirmed', etc.
    title TEXT NOT NULL,
    message TEXT,
    related_id UUID, -- ID of related record (e.g., skeleton profile id)
    related_type TEXT, -- Type of related record ('profile', 'payment', etc.)
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ,
    read_by UUID REFERENCES profiles(id)
);

-- Create index for unread notifications
CREATE INDEX IF NOT EXISTS idx_admin_notifications_unread
ON admin_notifications(is_read, created_at DESC)
WHERE is_read = FALSE;

-- RLS policies for admin_notifications
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Admins can view all notifications
CREATE POLICY admin_notifications_select_policy ON admin_notifications
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Admins can update notifications (mark as read)
CREATE POLICY admin_notifications_update_policy ON admin_notifications
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- System can insert notifications (via service role or triggers)
CREATE POLICY admin_notifications_insert_policy ON admin_notifications
    FOR INSERT
    TO authenticated
    WITH CHECK (TRUE);

-- Function to create a skeleton profile
CREATE OR REPLACE FUNCTION create_skeleton_profile(
    p_name TEXT,
    p_created_by UUID,
    p_session_id UUID
) RETURNS UUID AS $$
DECLARE
    v_profile_id UUID;
BEGIN
    -- Generate a new UUID for the profile
    v_profile_id := gen_random_uuid();

    -- Insert the skeleton profile
    INSERT INTO profiles (
        id,
        name,
        role,
        status,
        is_skeleton,
        skeleton_created_by,
        skeleton_session_id,
        skeleton_created_at,
        created_at
    ) VALUES (
        v_profile_id,
        p_name,
        'player',
        'approved', -- Approved so they can be added to attendance
        TRUE,
        p_created_by,
        p_session_id,
        NOW(),
        NOW()
    );

    -- Create admin notification
    INSERT INTO admin_notifications (
        notification_type,
        title,
        message,
        related_id,
        related_type
    ) VALUES (
        'skeleton_account',
        'New attendee registered: ' || p_name,
        'A new person was registered at a coaching session. Please complete their profile with contact details.',
        v_profile_id,
        'profile'
    );

    RETURN v_profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete a skeleton profile
CREATE OR REPLACE FUNCTION complete_skeleton_profile(
    p_profile_id UUID,
    p_email TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL,
    p_parent_name TEXT DEFAULT NULL,
    p_parent_email TEXT DEFAULT NULL,
    p_parent_phone TEXT DEFAULT NULL,
    p_is_junior BOOLEAN DEFAULT FALSE,
    p_notes TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
    -- Update the profile
    UPDATE profiles SET
        email = COALESCE(p_email, email),
        phone = COALESCE(p_phone, phone),
        parent_name = p_parent_name,
        parent_email = p_parent_email,
        parent_phone = p_parent_phone,
        is_junior = p_is_junior,
        notes = p_notes,
        is_skeleton = FALSE,
        updated_at = NOW()
    WHERE id = p_profile_id AND is_skeleton = TRUE;

    -- Mark related notifications as read
    UPDATE admin_notifications
    SET is_read = TRUE, read_at = NOW(), read_by = auth.uid()
    WHERE related_id = p_profile_id
    AND related_type = 'profile'
    AND notification_type = 'skeleton_account';

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get skeleton accounts pending completion
CREATE OR REPLACE FUNCTION get_skeleton_accounts()
RETURNS TABLE (
    id UUID,
    name TEXT,
    created_at TIMESTAMPTZ,
    created_by_name TEXT,
    session_date DATE,
    session_type TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.name,
        p.skeleton_created_at as created_at,
        creator.name as created_by_name,
        cs.session_date,
        cs.session_type
    FROM profiles p
    LEFT JOIN profiles creator ON p.skeleton_created_by = creator.id
    LEFT JOIN coaching_sessions cs ON p.skeleton_session_id = cs.id
    WHERE p.is_skeleton = TRUE
    ORDER BY p.skeleton_created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add parent fields to profiles if they don't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS parent_name TEXT,
ADD COLUMN IF NOT EXISTS parent_email TEXT,
ADD COLUMN IF NOT EXISTS parent_phone TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_skeleton_profile TO authenticated;
GRANT EXECUTE ON FUNCTION complete_skeleton_profile TO authenticated;
GRANT EXECUTE ON FUNCTION get_skeleton_accounts TO authenticated;
