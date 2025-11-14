-- ============================================
-- FIX: Ambiguous player_id column reference
-- ============================================

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
    -- FIX: Qualify column name to avoid ambiguity
    UPDATE coaching_attendance
    SET
        payment_status = 'pending_confirmation',
        user_marked_paid_at = NOW()
    WHERE coaching_attendance.player_id = v_player_id  -- FIX: Added table name
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION validate_payment_token(UUID) TO anon;
GRANT EXECUTE ON FUNCTION validate_payment_token(UUID) TO authenticated;

SELECT '✅ Fixed ambiguous column reference - ready to test!' as status;
