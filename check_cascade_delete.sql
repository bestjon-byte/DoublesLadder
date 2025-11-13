-- Check if coaching_attendance has cascade delete and look for Sarah's data
-- Run in Supabase SQL Editor

-- 1. Check foreign key constraints on coaching_attendance
SELECT
    'FK Constraints' as check_type,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.table_name = 'coaching_attendance'
  AND tc.constraint_type = 'FOREIGN KEY';

-- 2. Count total coaching_attendance records
SELECT
    'Total Records' as check_type,
    COUNT(*) as total_attendance_records
FROM coaching_attendance;

-- 3. Explicitly check Sarah Nutbrown's attendance count
SELECT
    'Sarah Attendance' as check_type,
    COUNT(*) as sarah_records
FROM coaching_attendance
WHERE player_id = '9ee52547-4b38-485a-b321-06bfcdb3c562';

-- 4. Check if "tonight's session" exists and if Sarah is in it
SELECT
    'Tonights Session' as check_type,
    cs.id,
    cs.session_date,
    cs.session_type,
    cs.session_time,
    COUNT(ca.id) as total_attendees,
    COUNT(ca.id) FILTER (WHERE ca.player_id = '9ee52547-4b38-485a-b321-06bfcdb3c562') as sarah_attended
FROM coaching_sessions cs
LEFT JOIN coaching_attendance ca ON ca.session_id = cs.id
WHERE cs.session_date = CURRENT_DATE
  OR cs.session_date = CURRENT_DATE - INTERVAL '1 day'
  OR cs.session_date = CURRENT_DATE + INTERVAL '1 day'
GROUP BY cs.id, cs.session_date, cs.session_type, cs.session_time
ORDER BY cs.session_date DESC;

-- 5. Show who IS in tonight's session
SELECT
    'Tonights Attendees' as check_type,
    p.name,
    p.email,
    ca.payment_status,
    cs.session_date,
    cs.session_type
FROM coaching_sessions cs
JOIN coaching_attendance ca ON ca.session_id = cs.id
JOIN profiles p ON p.id = ca.player_id
WHERE cs.session_date >= CURRENT_DATE - INTERVAL '1 day'
  AND cs.session_date <= CURRENT_DATE + INTERVAL '1 day'
ORDER BY cs.session_date DESC, p.name;
