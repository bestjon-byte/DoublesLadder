-- Check Sarah's exact attendance record details
-- Run in Supabase SQL Editor

-- Show Sarah's exact coaching_attendance record
SELECT
    'Sarah Attendance Record' as check_type,
    ca.*,
    cs.session_date,
    cs.session_type
FROM coaching_attendance ca
JOIN coaching_sessions cs ON cs.id = ca.session_id
WHERE ca.player_id = '9ee52547-4b38-485a-b321-06bfcdb3c562';

-- Check if payment_status is NULL
SELECT
    'Payment Status Check' as check_type,
    CASE
        WHEN payment_status IS NULL THEN 'NULL - THIS IS THE BUG!'
        ELSE payment_status
    END as status_value
FROM coaching_attendance
WHERE player_id = '9ee52547-4b38-485a-b321-06bfcdb3c562';
