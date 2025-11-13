-- Simple diagnostic to find Sarah's data
-- Run in Supabase SQL Editor

-- 1. Does Sarah's profile exist?
SELECT '1. Profile exists?' as step, COUNT(*) as count
FROM profiles
WHERE id = '9ee52547-4b38-485a-b321-06bfcdb3c562';

-- 2. How many coaching_attendance records does she have?
SELECT '2. Attendance count' as step, COUNT(*) as count
FROM coaching_attendance
WHERE player_id = '9ee52547-4b38-485a-b321-06bfcdb3c562';

-- 3. Check if there are ANY orphaned records left
SELECT '3. Orphaned records' as step, COUNT(*) as count
FROM coaching_attendance ca
LEFT JOIN profiles p ON p.id = ca.player_id
WHERE p.id IS NULL;

-- 4. Show last 10 coaching_attendance records with player names
SELECT
    '4. Recent attendance' as step,
    p.name,
    ca.player_id,
    cs.session_date,
    ca.payment_status
FROM coaching_attendance ca
JOIN coaching_sessions cs ON cs.id = ca.session_id
LEFT JOIN profiles p ON p.id = ca.player_id
ORDER BY cs.session_date DESC
LIMIT 10;

-- 5. Check if Sarah N profile still exists somewhere
SELECT '5. Sarah profiles' as step, id, name, email, status
FROM profiles
WHERE name ILIKE '%sarah%' AND name ILIKE '%n%';
