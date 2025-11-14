-- ============================================
-- PAYMENT REMINDER SYSTEM - TYPE FIX
-- Quick fix for VARCHAR/TEXT type mismatch
-- Run this in Supabase SQL Editor
-- ============================================

-- Drop existing functions first
DROP FUNCTION IF EXISTS get_payments_for_reminder(VARCHAR, DECIMAL);
DROP FUNCTION IF EXISTS get_reminder_history(INTEGER);
DROP FUNCTION IF EXISTS record_reminder_sent(UUID, UUID, VARCHAR, VARCHAR, TEXT);
DROP FUNCTION IF EXISTS record_reminder_sent(UUID, UUID, TEXT, TEXT, TEXT);

-- Fix get_payments_for_reminder function
CREATE OR REPLACE FUNCTION get_payments_for_reminder(
    p_filter_type VARCHAR,
    p_threshold DECIMAL DEFAULT NULL
)
RETURNS TABLE (
    payment_id UUID,
    player_id UUID,
    player_name TEXT,
    player_email TEXT,
    amount_due DECIMAL,
    billing_period_start DATE,
    billing_period_end DATE,
    total_sessions INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    days_outstanding INTEGER,
    last_reminder_sent TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        cp.id as payment_id,
        cp.player_id,
        p.name::TEXT as player_name,
        p.email::TEXT as player_email,
        cp.amount_due,
        cp.billing_period_start,
        cp.billing_period_end,
        cp.total_sessions,
        cp.created_at,
        EXTRACT(DAY FROM NOW() - cp.created_at)::INTEGER as days_outstanding,
        (
            SELECT MAX(prh.sent_at)
            FROM payment_reminder_history prh
            WHERE prh.payment_id = cp.id
        ) as last_reminder_sent
    FROM coaching_payments cp
    INNER JOIN profiles p ON p.id = cp.player_id
    WHERE cp.status = 'pending'
    AND (
        (p_filter_type = 'all') OR
        (p_filter_type = 'amount_threshold' AND cp.amount_due >= p_threshold) OR
        (p_filter_type = 'age_threshold' AND EXTRACT(DAY FROM NOW() - cp.created_at) >= p_threshold)
    )
    ORDER BY cp.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix get_reminder_history function
CREATE OR REPLACE FUNCTION get_reminder_history(
    p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
    history_id UUID,
    payment_id UUID,
    player_name TEXT,
    player_email TEXT,
    amount_owed DECIMAL,
    sent_at TIMESTAMP WITH TIME ZONE,
    sent_by_name TEXT,
    email_status TEXT,
    filter_criteria TEXT,
    error_message TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        prh.id as history_id,
        prh.payment_id,
        p.name::TEXT as player_name,
        prh.player_email::TEXT,
        prh.amount_owed,
        prh.sent_at,
        sent_by.name::TEXT as sent_by_name,
        prh.email_status::TEXT,
        prh.filter_criteria::TEXT,
        prh.error_message
    FROM payment_reminder_history prh
    INNER JOIN profiles p ON p.id = prh.player_id
    LEFT JOIN profiles sent_by ON sent_by.id = prh.sent_by
    ORDER BY prh.sent_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix record_reminder_sent function
CREATE OR REPLACE FUNCTION record_reminder_sent(
    p_payment_id UUID,
    p_sent_by UUID,
    p_filter_criteria TEXT,
    p_email_status TEXT DEFAULT 'sent',
    p_error_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_history_id UUID;
    v_player_id UUID;
    v_player_email TEXT;
    v_amount_owed DECIMAL;
BEGIN
    SELECT player_id, amount_due
    INTO v_player_id, v_amount_owed
    FROM coaching_payments
    WHERE id = p_payment_id;

    SELECT email::TEXT
    INTO v_player_email
    FROM profiles
    WHERE id = v_player_id;

    INSERT INTO payment_reminder_history (
        payment_id,
        player_id,
        player_email,
        amount_owed,
        filter_criteria,
        sent_by,
        email_status,
        error_message
    ) VALUES (
        p_payment_id,
        v_player_id,
        v_player_email,
        v_amount_owed,
        p_filter_criteria,
        p_sent_by,
        p_email_status,
        p_error_message
    )
    RETURNING id INTO v_history_id;

    UPDATE coaching_payments
    SET
        reminder_sent_at = NOW(),
        updated_at = NOW()
    WHERE id = p_payment_id;

    RETURN v_history_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Done!
SELECT 'Payment reminder functions updated successfully!' as status;
