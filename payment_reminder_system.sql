-- ============================================
-- PAYMENT REMINDER SYSTEM
-- Email chaser system for outstanding coaching payments
-- ============================================

-- 1. PAYMENT REMINDER TOKENS TABLE
-- Stores secure tokens for "I've paid" email links
CREATE TABLE IF NOT EXISTS payment_reminder_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES coaching_payments(id) ON DELETE CASCADE,
    token UUID NOT NULL DEFAULT uuid_generate_v4(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(token)
);

-- Index for token lookup
CREATE INDEX IF NOT EXISTS idx_payment_reminder_tokens_token ON payment_reminder_tokens(token) WHERE used_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_payment_reminder_tokens_payment ON payment_reminder_tokens(payment_id);

COMMENT ON TABLE payment_reminder_tokens IS 'Secure tokens for no-login payment confirmation links';
COMMENT ON COLUMN payment_reminder_tokens.token IS 'UUID token included in email link (single-use, expires in 30 days)';
COMMENT ON COLUMN payment_reminder_tokens.used_at IS 'Timestamp when token was redeemed (NULL = not yet used)';

-- 2. PAYMENT REMINDER HISTORY TABLE
-- Tracks all sent payment reminders
CREATE TABLE IF NOT EXISTS payment_reminder_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES coaching_payments(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    player_email TEXT NOT NULL,
    amount_owed DECIMAL(10, 2) NOT NULL,
    filter_criteria TEXT, -- 'all', 'amount_threshold:50', 'age_threshold:2'
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    email_status TEXT DEFAULT 'sent' CHECK (email_status IN ('sent', 'failed', 'bounced')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for querying reminder history
CREATE INDEX IF NOT EXISTS idx_payment_reminder_history_payment ON payment_reminder_history(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_reminder_history_player ON payment_reminder_history(player_id);
CREATE INDEX IF NOT EXISTS idx_payment_reminder_history_sent_at ON payment_reminder_history(sent_at DESC);

COMMENT ON TABLE payment_reminder_history IS 'Audit log of all payment reminder emails sent';
COMMENT ON COLUMN payment_reminder_history.filter_criteria IS 'Filter used when sending (for tracking/reporting)';
COMMENT ON COLUMN payment_reminder_history.email_status IS 'Email delivery status';

-- ============================================
-- FUNCTIONS
-- ============================================

-- FUNCTION: Generate a payment reminder token
CREATE OR REPLACE FUNCTION generate_payment_reminder_token(
    p_payment_id UUID
)
RETURNS TABLE (
    token UUID,
    expires_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    v_token UUID;
    v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Generate new token
    INSERT INTO payment_reminder_tokens (payment_id)
    VALUES (p_payment_id)
    RETURNING payment_reminder_tokens.token, payment_reminder_tokens.expires_at
    INTO v_token, v_expires_at;

    RETURN QUERY SELECT v_token, v_expires_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION generate_payment_reminder_token IS 'Creates a new reminder token for a payment';

-- FUNCTION: Validate and redeem a payment token
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

-- FUNCTION: Get payments eligible for reminders based on filters
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
    WHERE cp.status = 'pending' -- Only pending payments (not paid, not cancelled)
    AND (
        -- Filter: All outstanding
        (p_filter_type = 'all') OR

        -- Filter: Amount threshold (e.g., more than £50)
        (p_filter_type = 'amount_threshold' AND cp.amount_due >= p_threshold) OR

        -- Filter: Age threshold (e.g., older than 2 weeks)
        (p_filter_type = 'age_threshold' AND EXTRACT(DAY FROM NOW() - cp.created_at) >= p_threshold)
    )
    ORDER BY cp.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_payments_for_reminder IS 'Gets list of payments matching reminder filter criteria';

-- FUNCTION: Record reminder sent
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
    -- Get payment details
    SELECT player_id, amount_due
    INTO v_player_id, v_amount_owed
    FROM coaching_payments
    WHERE id = p_payment_id;

    -- Get player email
    SELECT email::TEXT
    INTO v_player_email
    FROM profiles
    WHERE id = v_player_id;

    -- Insert history record
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

    -- Update payment reminder_sent_at
    UPDATE coaching_payments
    SET
        reminder_sent_at = NOW(),
        updated_at = NOW()
    WHERE id = p_payment_id;

    RETURN v_history_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION record_reminder_sent IS 'Records that a reminder email was sent for a payment';

-- FUNCTION: Get reminder history for admin view
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

COMMENT ON FUNCTION get_reminder_history IS 'Gets history of sent reminders for admin tracking';

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on new tables
ALTER TABLE payment_reminder_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_reminder_history ENABLE ROW LEVEL SECURITY;

-- Admin full access to tokens
CREATE POLICY "Admin full access to payment_reminder_tokens"
    ON payment_reminder_tokens
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Admin full access to reminder history
CREATE POLICY "Admin full access to payment_reminder_history"
    ON payment_reminder_history
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Public can validate tokens (for redemption page - no auth required)
CREATE POLICY "Anyone can validate tokens"
    ON payment_reminder_tokens
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT ALL ON payment_reminder_tokens TO authenticated;
GRANT ALL ON payment_reminder_history TO authenticated;
GRANT SELECT ON payment_reminder_tokens TO anon; -- For token redemption

-- ============================================
-- CLEANUP OLD TOKENS (Optional periodic job)
-- ============================================

-- Function to clean up expired tokens (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS INTEGER AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    DELETE FROM payment_reminder_tokens
    WHERE expires_at < NOW() - INTERVAL '7 days'; -- Keep for 7 days after expiry for audit

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_expired_tokens IS 'Cleans up tokens expired more than 7 days ago (run periodically)';

-- ============================================
-- SAMPLE DATA / TESTING (Comment out for production)
-- ============================================

-- Uncomment to test token generation:
-- SELECT * FROM generate_payment_reminder_token('your-payment-uuid-here');

-- Uncomment to test payment retrieval:
-- SELECT * FROM get_payments_for_reminder('all', NULL);
-- SELECT * FROM get_payments_for_reminder('amount_threshold', 50.00);
-- SELECT * FROM get_payments_for_reminder('age_threshold', 14); -- 14 days

-- ============================================
-- END OF SCHEMA
-- ============================================
