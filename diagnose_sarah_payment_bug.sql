-- Diagnose why Sarah Nutbrown doesn't appear in payment summary
-- Run in Supabase SQL Editor

-- 1. Verify Sarah has coaching_attendance records
SELECT
    '1. Sarah Attendance Records' as check_type,
    ca.id,
    ca.player_id,
    ca.session_id,
    ca.payment_status,
    ca.marked_by,
    cs.session_date,
    cs.session_type
FROM coaching_attendance ca
JOIN coaching_sessions cs ON cs.id = ca.session_id
WHERE ca.player_id = '9ee52547-4b38-485a-b321-06bfcdb3c562'
ORDER BY cs.session_date DESC;

-- 2. Manually calculate what Sarah's payment summary SHOULD be
SELECT
    '2. Manual Sarah Summary' as check_type,
    p.id as player_id,
    p.name as player_name,
    p.email as player_email,
    COUNT(ca.id) as total_sessions,
    COUNT(ca.id) FILTER (WHERE ca.payment_status = 'unpaid') as unpaid_sessions,
    COUNT(ca.id) FILTER (WHERE ca.payment_status = 'pending_confirmation') as pending_sessions,
    COUNT(ca.id) FILTER (WHERE ca.payment_status = 'paid') as paid_sessions,
    COUNT(ca.id) FILTER (WHERE ca.payment_status = 'unpaid') * 4.00 as amount_owed
FROM profiles p
LEFT JOIN coaching_attendance ca ON ca.player_id = p.id
WHERE p.id = '9ee52547-4b38-485a-b321-06bfcdb3c562'
GROUP BY p.id, p.name, p.email;

-- 3. Check what get_all_players_payment_summary returns for Sarah
SELECT
    '3. RPC Function Result for Sarah' as check_type,
    *
FROM get_all_players_payment_summary(4.00)
WHERE player_id = '9ee52547-4b38-485a-b321-06bfcdb3c562';

-- 4. Check if there's a coaching_payment_sessions issue
SELECT
    '4. Payment Sessions Junction' as check_type,
    ca.id as attendance_id,
    ca.session_id,
    cs.session_date,
    ca.payment_status,
    cps.id as payment_session_id,
    cps.payment_id,
    cp.status as payment_status
FROM coaching_attendance ca
JOIN coaching_sessions cs ON cs.id = ca.session_id
LEFT JOIN coaching_payment_sessions cps ON cps.session_id = cs.id
LEFT JOIN coaching_payments cp ON cp.id = cps.payment_id
WHERE ca.player_id = '9ee52547-4b38-485a-b321-06bfcdb3c562';

-- 5. Show the RPC function definition to understand the logic
SELECT
    '5. RPC Function Source' as check_type,
    pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'get_all_players_payment_summary';

-- 6. Compare Sarah to a working player (Andrew Bromley who DOES appear)
SELECT
    '6. Comparison - Sarah vs Andrew' as check_type,
    'Sarah' as player,
    COUNT(ca.id) as total_sessions
FROM coaching_attendance ca
WHERE ca.player_id = '9ee52547-4b38-485a-b321-06bfcdb3c562'
UNION ALL
SELECT
    '6. Comparison - Sarah vs Andrew' as check_type,
    'Andrew' as player,
    COUNT(ca.id) as total_sessions
FROM coaching_attendance ca
JOIN profiles p ON p.id = ca.player_id
WHERE p.email = 'arbromley@hotmail.com';
