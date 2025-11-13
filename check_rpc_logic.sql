-- Simple check - what does the RPC return for Sarah?
-- Run in Supabase SQL Editor

-- 1. What does RPC return for Sarah? (probably nothing)
SELECT 'Sarah RPC Result' as test, *
FROM get_all_players_payment_summary(4.00)
WHERE player_name ILIKE '%sarah%nutbrown%'
   OR player_email = 'sarahnutbrown@yahoo.co.uk';

-- 2. What does manual query return? (should show 1 session, £4 owed)
SELECT
    'Sarah Manual Calc' as test,
    p.name,
    p.email,
    COUNT(ca.id) as total_sessions,
    COUNT(*) FILTER (WHERE ca.payment_status = 'unpaid') as unpaid,
    COUNT(*) FILTER (WHERE ca.payment_status = 'unpaid') * 4.00 as amount_owed
FROM profiles p
JOIN coaching_attendance ca ON ca.player_id = p.id
WHERE p.id = '9ee52547-4b38-485a-b321-06bfcdb3c562'
GROUP BY p.id, p.name, p.email;

-- 3. Check if there's a coaching_payment_sessions requirement
SELECT
    'Payment Sessions Check' as test,
    ca.session_id,
    cs.session_date,
    cps.id as has_payment_session_record
FROM coaching_attendance ca
JOIN coaching_sessions cs ON cs.id = ca.session_id
LEFT JOIN coaching_payment_sessions cps ON cps.session_id = cs.id
WHERE ca.player_id = '9ee52547-4b38-485a-b321-06bfcdb3c562';
