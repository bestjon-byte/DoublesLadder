-- ============================================
-- FIX: Ensure validate_payment_token function is deployed
-- Run this in your Supabase SQL Editor
-- ============================================

-- First, drop the existing function if it exists (to ensure clean deployment)
DROP FUNCTION IF EXISTS validate_payment_token(UUID);

-- Recreate the validate_payment_token function
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
    v_payment_record RECORD;
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

    -- Get payment details
    SELECT * INTO v_payment_record
    FROM coaching_payments
    WHERE id = v_token_record.payment_id;

    -- Payment not found or already confirmed
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, NULL::UUID, NULL::UUID, NULL::DECIMAL, 'Payment not found'::TEXT;
        RETURN;
    END IF;

    -- Mark token as used
    UPDATE payment_reminder_tokens
    SET used_at = NOW()
    WHERE token = p_token;

    -- Update payment status to 'pending' (awaiting admin confirmation)
    UPDATE coaching_payments
    SET
        status = 'pending',
        updated_at = NOW()
    WHERE id = v_token_record.payment_id
    AND status != 'paid'; -- Don't update if already paid

    -- Return success
    RETURN QUERY SELECT
        true,
        v_payment_record.id,
        v_payment_record.player_id,
        v_payment_record.amount_due,
        'Success'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION validate_payment_token IS 'Validates token and moves payment to pending confirmation status';

-- Grant execute permission to anonymous users (for public token validation)
GRANT EXECUTE ON FUNCTION validate_payment_token(UUID) TO anon;
GRANT EXECUTE ON FUNCTION validate_payment_token(UUID) TO authenticated;

-- Test that the function exists
SELECT
    'validate_payment_token function deployed successfully!' as status,
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'validate_payment_token';
