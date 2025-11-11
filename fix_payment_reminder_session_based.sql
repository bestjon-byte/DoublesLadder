-- ============================================
-- FIX: Payment Reminder Token System for Session-Based Payments
-- This updates the system to work with coaching_attendance.payment_status
-- instead of the coaching_payments table
-- ============================================

-- Step 1: Add player_id to payment_reminder_tokens if it doesn't exist
ALTER TABLE payment_reminder_tokens
ADD COLUMN IF NOT EXISTS player_id UUID REFERENCES profiles(id) ON DELETE CASCADE;

-- Step 2: Create an index for player_id lookups
CREATE INDEX IF NOT EXISTS idx_payment_reminder_tokens_player ON payment_reminder_tokens(player_id);

-- Step 3: Drop and recreate generate_payment_reminder_token to include player_id
DROP FUNCTION IF EXISTS generate_payment_reminder_token(UUID);

CREATE OR REPLACE FUNCTION generate_payment_reminder_token(
    p_payment_id UUID,
    p_player_id UUID DEFAULT NULL
)
RETURNS TABLE (
    token UUID,
    expires_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    v_token UUID;
    v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Generate new token with player_id
    INSERT INTO payment_reminder_tokens (payment_id, player_id)
    VALUES (p_payment_id, p_player_id)
    RETURNING payment_reminder_tokens.token, payment_reminder_tokens.expires_at
    INTO v_token, v_expires_at;

    RETURN QUERY SELECT v_token, v_expires_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION generate_payment_reminder_token IS 'Creates a new reminder token for a payment (with optional player_id)';

-- Step 4: Drop and recreate validate_payment_token to work with session-based system
DROP FUNCTION IF EXISTS validate_payment_token(UUID);

CREATE OR REPLACE FUNCTION validate_payment_token(
    p_token UUID
)
RETURNS TABLE (
    valid BOOLEAN,
    payment_id UUID,
    player_id UUID,
    amount_due DECIMAL,
    error_message TEXT
) AS $$
DECLARE
    v_token_record RECORD;
    v_player_id UUID;
    v_sessions_marked INTEGER;
    v_amount DECIMAL;
BEGIN
    -- Check if token exists and is valid
    SELECT * INTO v_token_record
    FROM payment_reminder_tokens
    WHERE token = p_token;

    -- Token not found
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, NULL::UUID, NULL::UUID, NULL::DECIMAL, 'Invalid token'::TEXT;
        RETURN;
    END IF;

    -- Token already used
    IF v_token_record.used_at IS NOT NULL THEN
        RETURN QUERY SELECT false, NULL::UUID, NULL::UUID, NULL::DECIMAL, 'Token already used'::TEXT;
        RETURN;
    END IF;

    -- Token expired
    IF v_token_record.expires_at < NOW() THEN
        RETURN QUERY SELECT false, NULL::UUID, NULL::UUID, NULL::DECIMAL, 'Token expired'::TEXT;
        RETURN;
    END IF;

    -- Get player_id from token
    v_player_id := v_token_record.player_id;

    IF v_player_id IS NULL THEN
        RETURN QUERY SELECT false, NULL::UUID, NULL::UUID, NULL::DECIMAL, 'Invalid token - no player associated'::TEXT;
        RETURN;
    END IF;

    -- Mark token as used
    UPDATE payment_reminder_tokens
    SET used_at = NOW()
    WHERE token = p_token;

    -- Update all unpaid sessions for this player to 'pending_confirmation'
    -- This matches the UI's expectation (coaching_attendance.payment_status)
    UPDATE coaching_attendance
    SET
        payment_status = 'pending_confirmation',
        user_marked_paid_at = NOW()
    WHERE player_id = v_player_id
    AND payment_status = 'unpaid';

    -- Get count of sessions marked and calculate amount
    GET DIAGNOSTICS v_sessions_marked = ROW_COUNT;
    v_amount := v_sessions_marked * 4.00; -- £4 per session

    -- Return success
    RETURN QUERY SELECT
        true,
        v_token_record.payment_id,
        v_player_id,
        v_amount,
        format('Success - marked %s sessions as pending confirmation', v_sessions_marked)::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION validate_payment_token IS 'Validates token and marks player sessions as pending_confirmation';

-- Step 5: Update get_payments_for_reminder to work with session-based system
DROP FUNCTION IF EXISTS get_payments_for_reminder(VARCHAR, DECIMAL);

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
    WITH player_unpaid_sessions AS (
        -- Get all unpaid sessions per player
        SELECT
            p.id as ps_player_id,
            p.name as ps_player_name,
            p.email as ps_player_email,
            cs.session_date as ps_session_date,
            cs.created_at as ps_session_created_at,
            4.00 as ps_session_cost
        FROM profiles p
        INNER JOIN coaching_attendance ca ON ca.player_id = p.id
        INNER JOIN coaching_sessions cs ON cs.id = ca.session_id
        WHERE cs.status = 'completed'
        AND ca.payment_status = 'unpaid' -- Only unpaid sessions
    ),
    player_totals AS (
        -- Aggregate by player
        SELECT
            ps_player_id as player_id,
            ps_player_name as player_name,
            ps_player_email as player_email,
            COUNT(*)::INTEGER as total_sessions,
            SUM(ps_session_cost) as amount_due,
            MIN(ps_session_date) as billing_period_start,
            MAX(ps_session_date) as billing_period_end,
            MIN(ps_session_created_at) as first_session_created,
            EXTRACT(DAY FROM NOW() - MIN(ps_session_date))::INTEGER as days_outstanding
        FROM player_unpaid_sessions
        GROUP BY ps_player_id, ps_player_name, ps_player_email
    )
    SELECT
        pt.player_id as payment_id, -- Use player_id as payment_id for tracking
        pt.player_id,
        pt.player_name::TEXT,
        pt.player_email::TEXT,
        pt.amount_due,
        pt.billing_period_start,
        pt.billing_period_end,
        pt.total_sessions,
        pt.first_session_created,
        pt.days_outstanding,
        (
            SELECT MAX(prh.sent_at)
            FROM payment_reminder_history prh
            WHERE prh.player_id = pt.player_id
        ) as last_reminder_sent
    FROM player_totals pt
    WHERE pt.total_sessions > 0
    AND (
        (p_filter_type = 'all') OR
        (p_filter_type = 'amount_threshold' AND pt.amount_due >= p_threshold) OR
        (p_filter_type = 'age_threshold' AND pt.days_outstanding >= p_threshold)
    )
    ORDER BY pt.first_session_created ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_payments_for_reminder IS 'Gets list of players with unpaid sessions (session-based)';

-- Step 6: Grant permissions
GRANT EXECUTE ON FUNCTION generate_payment_reminder_token(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_payment_token(UUID) TO anon;
GRANT EXECUTE ON FUNCTION validate_payment_token(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_payments_for_reminder(VARCHAR, DECIMAL) TO authenticated;

-- Success message
SELECT 'Payment reminder system updated for session-based payments!' as status;

-- Test query to verify (uncomment to test):
-- SELECT * FROM get_payments_for_reminder('all', NULL);
