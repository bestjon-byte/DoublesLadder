-- Fix for skeleton account functions
-- Run this in Supabase Dashboard SQL Editor: https://supabase.com/dashboard/project/hwpjrkmplydqaxiikupv/sql

-- Ensure admin_notifications table exists
CREATE TABLE IF NOT EXISTS admin_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    related_id UUID,
    related_type TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ,
    read_by UUID REFERENCES profiles(id)
);

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
        'approved',
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

-- Function to get skeleton accounts pending completion (with correct type casts)
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
        p.name::TEXT,
        p.skeleton_created_at as created_at,
        creator.name::TEXT as created_by_name,
        cs.session_date,
        cs.session_type::TEXT
    FROM profiles p
    LEFT JOIN profiles creator ON p.skeleton_created_by = creator.id
    LEFT JOIN coaching_sessions cs ON p.skeleton_session_id = cs.id
    WHERE p.is_skeleton = TRUE
    ORDER BY p.skeleton_created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_skeleton_profile TO authenticated;
GRANT EXECUTE ON FUNCTION complete_skeleton_profile TO authenticated;
GRANT EXECUTE ON FUNCTION get_skeleton_accounts TO authenticated;
