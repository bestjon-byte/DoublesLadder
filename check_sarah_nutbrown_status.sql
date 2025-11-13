-- Check Sarah Nutbrown's Current Status
-- Run in Supabase SQL Editor

-- Step 1: Verify Sarah Nutbrown's profile exists
SELECT
    'Profile Check' as check_type,
    id,
    name,
    email,
    status,
    role
FROM profiles
WHERE id = '9ee52547-4b38-485a-b321-06bfcdb3c562';

-- Step 2: Check her coaching_attendance records
SELECT
    'Attendance Records' as check_type,
    ca.id,
    ca.player_id,
    ca.session_id,
    ca.payment_status,
    ca.marked_by,
    cs.session_date,
    cs.session_type,
    cs.status as session_status
FROM coaching_attendance ca
JOIN coaching_sessions cs ON cs.id = ca.session_id
WHERE ca.player_id = '9ee52547-4b38-485a-b321-06bfcdb3c562'
ORDER BY cs.session_date DESC;

-- Step 3: Count her sessions by payment status
SELECT
    'Payment Status Summary' as check_type,
    payment_status,
    COUNT(*) as count,
    COUNT(*) * 4.00 as total_amount
FROM coaching_attendance ca
WHERE ca.player_id = '9ee52547-4b38-485a-b321-06bfcdb3c562'
GROUP BY payment_status;

-- Step 4: Check coaching_payments table
SELECT
    'Coaching Payments Table' as check_type,
    cp.*
FROM coaching_payments cp
WHERE cp.player_id = '9ee52547-4b38-485a-b321-06bfcdb3c562';

-- Step 5: Check what get_all_players_payment_summary returns for Sarah
-- This is what the UI uses to display the payments list
SELECT
    'Payment Summary (What UI Shows)' as check_type,
    *
FROM get_all_players_payment_summary(4.00)
WHERE player_id = '9ee52547-4b38-485a-b321-06bfcdb3c562';

-- Step 6: Check if there are ANY coaching_payment_sessions linked to her sessions
SELECT
    'Payment Sessions Junction' as check_type,
    cps.*,
    cs.session_date,
    cs.session_type
FROM coaching_attendance ca
JOIN coaching_sessions cs ON cs.id = ca.session_id
LEFT JOIN coaching_payment_sessions cps ON cps.session_id = cs.id
WHERE ca.player_id = '9ee52547-4b38-485a-b321-06bfcdb3c562'
ORDER BY cs.session_date DESC
LIMIT 20;

-- Step 7: Show ALL players in the payment summary for comparison
SELECT
    'All Players Payment Summary' as check_type,
    player_name,
    player_email,
    total_sessions,
    unpaid_sessions,
    pending_confirmation_sessions,
    paid_sessions,
    amount_owed
FROM get_all_players_payment_summary(4.00)
ORDER BY player_name;
