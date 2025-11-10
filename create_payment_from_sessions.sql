-- ============================================
-- CREATE PAYMENT FROM UNPAID SESSIONS
-- Creates a coaching_payment record from unpaid sessions
-- ============================================

-- Function to create a payment record for a player's unpaid sessions
CREATE OR REPLACE FUNCTION create_payment_from_unpaid_sessions(
    p_player_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_payment_id UUID;
    v_session_ids UUID[];
    v_total_sessions INTEGER;
    v_amount_due DECIMAL;
    v_period_start DATE;
    v_period_end DATE;
BEGIN
    -- Get all unpaid session IDs for this player
    SELECT
        array_agg(cs.id),
        COUNT(cs.id)::INTEGER,
        (COUNT(cs.id) * 4.00)::DECIMAL,
        MIN(cs.session_date),
        MAX(cs.session_date)
    INTO
        v_session_ids,
        v_total_sessions,
        v_amount_due,
        v_period_start,
        v_period_end
    FROM coaching_sessions cs
    INNER JOIN coaching_attendance ca ON ca.session_id = cs.id
    LEFT JOIN coaching_payment_sessions cps ON cps.session_id = cs.id
    LEFT JOIN coaching_payments cp ON cp.id = cps.payment_id
    WHERE cs.status = 'completed'
    AND ca.player_id = p_player_id
    -- Exclude sessions that are already in a non-cancelled payment
    AND (cp.id IS NULL OR cp.status = 'cancelled');

    -- If no unpaid sessions, return NULL
    IF v_total_sessions = 0 OR v_total_sessions IS NULL THEN
        RETURN NULL;
    END IF;

    -- Create the payment record
    INSERT INTO coaching_payments (
        player_id,
        amount_due,
        billing_period_start,
        billing_period_end,
        total_sessions,
        status,
        created_at,
        updated_at
    ) VALUES (
        p_player_id,
        v_amount_due,
        v_period_start,
        v_period_end,
        v_total_sessions,
        'pending',
        NOW(),
        NOW()
    )
    RETURNING id INTO v_payment_id;

    -- Link all sessions to this payment
    INSERT INTO coaching_payment_sessions (payment_id, session_id)
    SELECT v_payment_id, unnest(v_session_ids);

    RETURN v_payment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_payment_from_unpaid_sessions IS 'Creates a payment record from a player''s unpaid coaching sessions';

-- Test query (uncomment to test):
-- SELECT create_payment_from_unpaid_sessions('player-uuid-here');

SELECT 'Function create_payment_from_unpaid_sessions created successfully!' as status;
