-- ============================================
-- PAYMENT REMINDER - SESSION-BASED VERSION
-- Query sessions directly instead of coaching_payments table
-- ============================================

-- Drop old function
DROP FUNCTION IF EXISTS get_payments_for_reminder(VARCHAR, DECIMAL);

-- New function that queries sessions directly (matches the UI)
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
    WITH player_sessions AS (
        -- Get all completed sessions that each player attended and hasn't paid for
        SELECT
            p.id as ps_player_id,
            p.name as ps_player_name,
            p.email as ps_player_email,
            cs.id as ps_session_id,
            cs.session_date as ps_session_date,
            cs.created_at as ps_session_created_at,
            4.00 as ps_session_cost -- £4 per session
        FROM profiles p
        INNER JOIN coaching_attendance ca ON ca.player_id = p.id
        INNER JOIN coaching_sessions cs ON cs.id = ca.session_id
        LEFT JOIN coaching_payment_sessions cps ON cps.session_id = cs.id
        LEFT JOIN coaching_payments cp ON cp.id = cps.payment_id
        WHERE cs.status = 'completed'
        -- Exclude sessions that are already in a non-cancelled payment
        AND (cp.id IS NULL OR cp.status = 'cancelled')
    ),
    player_totals AS (
        -- Aggregate by player
        SELECT
            ps_player_id as player_id,
            ps_player_name as player_name,
            ps_player_email as player_email,
            COUNT(DISTINCT ps_session_id)::INTEGER as total_sessions,
            SUM(ps_session_cost) as amount_due,
            MIN(ps_session_date) as billing_period_start,
            MAX(ps_session_date) as billing_period_end,
            MIN(ps_session_created_at) as first_session_created,
            EXTRACT(DAY FROM NOW() - MIN(ps_session_date))::INTEGER as days_outstanding
        FROM player_sessions
        GROUP BY ps_player_id, ps_player_name, ps_player_email
    )
    SELECT
        gen_random_uuid() as payment_id, -- Generate a temporary ID for tracking
        pt.player_id,
        pt.player_name::TEXT,
        pt.player_email::TEXT,
        pt.amount_due,
        pt.billing_period_start,
        pt.billing_period_end,
        pt.total_sessions,
        pt.first_session_created,
        pt.days_outstanding,
        NULL::TIMESTAMP WITH TIME ZONE as last_reminder_sent -- No history yet for session-based
    FROM player_totals pt
    WHERE pt.total_sessions > 0
    AND (
        -- Filter: All outstanding
        (p_filter_type = 'all') OR

        -- Filter: Amount threshold (e.g., more than £50)
        (p_filter_type = 'amount_threshold' AND pt.amount_due >= p_threshold) OR

        -- Filter: Age threshold (e.g., older than 2 weeks)
        (p_filter_type = 'age_threshold' AND pt.days_outstanding >= p_threshold)
    )
    ORDER BY pt.first_session_created ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_payments_for_reminder IS 'Gets list of players with unpaid sessions (session-based, not coaching_payments table)';

-- Test queries
-- SELECT * FROM get_payments_for_reminder('all', NULL);
-- SELECT * FROM get_payments_for_reminder('amount_threshold', 20.00);
-- SELECT * FROM get_payments_for_reminder('age_threshold', 7);

SELECT 'Session-based payment reminder function created successfully!' as status;
