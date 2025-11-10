-- ============================================
-- PAYMENT REMINDER DIAGNOSTIC QUERIES
-- Run these to see what data you have
-- ============================================

-- 1. Check what payments exist and their statuses
SELECT
    cp.id,
    cp.player_id,
    p.name as player_name,
    p.email as player_email,
    cp.status,
    cp.amount_due,
    cp.billing_period_start,
    cp.billing_period_end,
    cp.total_sessions,
    cp.created_at
FROM coaching_payments cp
LEFT JOIN profiles p ON p.id = cp.player_id
ORDER BY cp.created_at DESC
LIMIT 20;

-- 2. Count payments by status
SELECT
    status,
    COUNT(*) as count,
    SUM(amount_due) as total_amount
FROM coaching_payments
GROUP BY status
ORDER BY count DESC;

-- 3. Check if there are any payments at all
SELECT COUNT(*) as total_payments FROM coaching_payments;

-- 4. Check what the getAllPlayersPaymentSummary shows
-- (This is what the UI uses to show "Owe Money")
SELECT
    p.id as player_id,
    p.name as player_name,
    p.email as player_email,
    -- Count unpaid sessions (sessions marked as 'to_pay' by players)
    COUNT(DISTINCT CASE WHEN cps.player_payment_status = 'to_pay' THEN cs.id END) as unpaid_sessions,
    -- Sum amount for unpaid sessions
    COALESCE(SUM(CASE WHEN cps.player_payment_status = 'to_pay' THEN 4.00 END), 0) as amount_owed
FROM profiles p
LEFT JOIN coaching_attendance ca ON ca.player_id = p.id
LEFT JOIN coaching_sessions cs ON cs.id = ca.session_id
LEFT JOIN coaching_payment_sessions cps ON cps.session_id = cs.id
WHERE EXISTS (
    SELECT 1 FROM coaching_attendance ca2
    WHERE ca2.player_id = p.id
)
GROUP BY p.id, p.name, p.email
HAVING COUNT(DISTINCT CASE WHEN cps.player_payment_status = 'to_pay' THEN cs.id END) > 0
ORDER BY amount_owed DESC;

-- 5. Check the new payment tracking tables exist
SELECT 'payment_reminder_tokens' as table_name, COUNT(*) as row_count FROM payment_reminder_tokens
UNION ALL
SELECT 'payment_reminder_history', COUNT(*) FROM payment_reminder_history;
