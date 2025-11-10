-- ============================================
-- CHECK PAYMENT TRACKING SYSTEM
-- ============================================

-- 1. See what columns exist in coaching_sessions
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'coaching_sessions'
ORDER BY ordinal_position;

-- 2. Check if coaching_payments table has any records
SELECT
    status,
    COUNT(*) as count,
    SUM(amount_due) as total_amount
FROM coaching_payments
GROUP BY status;

-- 3. Check if there are any sessions with attendance
SELECT
    cs.id,
    cs.session_date,
    cs.session_type,
    cs.status,
    COUNT(ca.id) as attendance_count,
    STRING_AGG(p.name, ', ') as attendees
FROM coaching_sessions cs
LEFT JOIN coaching_attendance ca ON ca.session_id = cs.id
LEFT JOIN profiles p ON p.id = ca.player_id
WHERE cs.status = 'completed'
GROUP BY cs.id, cs.session_date, cs.session_type, cs.status
ORDER BY cs.session_date DESC
LIMIT 10;

-- 4. Check the Payment Management summary that UI shows
-- This is from getAllPlayersPaymentSummary
SELECT
    p.id,
    p.name,
    p.email,
    -- Count unpaid payments
    COUNT(cp.id) FILTER (WHERE cp.status = 'pending') as pending_payments,
    COALESCE(SUM(cp.amount_due) FILTER (WHERE cp.status = 'pending'), 0) as amount_owed
FROM profiles p
LEFT JOIN coaching_payments cp ON cp.player_id = p.id
WHERE EXISTS (
    SELECT 1 FROM coaching_attendance ca
    WHERE ca.player_id = p.id
)
GROUP BY p.id, p.name, p.email
HAVING COUNT(cp.id) FILTER (WHERE cp.status = 'pending') > 0
ORDER BY amount_owed DESC;

-- 5. Show ALL coaching_payments regardless of status
SELECT
    cp.id,
    p.name as player_name,
    p.email,
    cp.status,
    cp.amount_due,
    cp.total_sessions,
    cp.billing_period_start,
    cp.billing_period_end,
    cp.created_at
FROM coaching_payments cp
INNER JOIN profiles p ON p.id = cp.player_id
ORDER BY cp.created_at DESC
LIMIT 20;
