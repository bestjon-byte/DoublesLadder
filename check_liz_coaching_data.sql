-- ============================================================================
-- CHECK LIZ COACHING DATA
-- ============================================================================
-- Run this in Supabase SQL Editor to see all Liz-related coaching data
-- This will show profiles and all coaching sessions/attendance
-- ============================================================================

-- Step 1: Find all Liz profiles
SELECT
  '=== LIZ PROFILES ===' as section,
  id,
  name,
  email,
  status,
  role,
  created_at
FROM profiles
WHERE name ILIKE '%liz%'
ORDER BY name;

-- Step 2: Check coaching_attendance for both Liz profiles
SELECT
  '=== LIZ MYERS ATTENDANCE ===' as section,
  ca.id as attendance_id,
  p.name as player_name,
  p.email as player_email,
  cs.id as session_id,
  cs.session_date,
  cs.session_type,
  cs.session_time,
  cs.status as session_status,
  ca.payment_status,
  ca.created_at as attendance_created
FROM coaching_attendance ca
JOIN profiles p ON ca.player_id = p.id
JOIN coaching_sessions cs ON ca.session_id = cs.id
WHERE p.name = 'Liz Myers'
ORDER BY cs.session_date, cs.session_time;

SELECT
  '=== LIZ ATTENDANCE ===' as section,
  ca.id as attendance_id,
  p.name as player_name,
  p.email as player_email,
  cs.id as session_id,
  cs.session_date,
  cs.session_type,
  cs.session_time,
  cs.status as session_status,
  ca.payment_status,
  ca.created_at as attendance_created
FROM coaching_attendance ca
JOIN profiles p ON ca.player_id = p.id
JOIN coaching_sessions cs ON ca.session_id = cs.id
WHERE p.name = 'Liz'
ORDER BY cs.session_date, cs.session_time;

-- Step 3: Summary counts
SELECT
  '=== SUMMARY ===' as section,
  'Liz Myers' as profile_name,
  (SELECT COUNT(*) FROM coaching_attendance ca
   JOIN profiles p ON ca.player_id = p.id
   WHERE p.name = 'Liz Myers') as total_sessions,
  (SELECT COUNT(*) FROM coaching_attendance ca
   JOIN profiles p ON ca.player_id = p.id
   JOIN coaching_sessions cs ON ca.session_id = cs.id
   WHERE p.name = 'Liz Myers' AND cs.session_type = 'Beginners') as beginners_sessions,
  (SELECT COUNT(*) FROM coaching_attendance ca
   JOIN profiles p ON ca.player_id = p.id
   JOIN coaching_sessions cs ON ca.session_id = cs.id
   WHERE p.name = 'Liz Myers' AND cs.session_type = 'Adults') as adults_sessions
UNION ALL
SELECT
  '=== SUMMARY ===' as section,
  'Liz' as profile_name,
  (SELECT COUNT(*) FROM coaching_attendance ca
   JOIN profiles p ON ca.player_id = p.id
   WHERE p.name = 'Liz') as total_sessions,
  (SELECT COUNT(*) FROM coaching_attendance ca
   JOIN profiles p ON ca.player_id = p.id
   JOIN coaching_sessions cs ON ca.session_id = cs.id
   WHERE p.name = 'Liz' AND cs.session_type = 'Beginners') as beginners_sessions,
  (SELECT COUNT(*) FROM coaching_attendance ca
   JOIN profiles p ON ca.player_id = p.id
   JOIN coaching_sessions cs ON ca.session_id = cs.id
   WHERE p.name = 'Liz' AND cs.session_type = 'Adults') as adults_sessions;

-- Step 4: List all Beginners sessions to see the full picture
SELECT
  '=== ALL BEGINNERS SESSIONS ===' as section,
  cs.id as session_id,
  cs.session_date,
  cs.session_time,
  cs.status,
  COUNT(ca.id) as total_attendees
FROM coaching_sessions cs
LEFT JOIN coaching_attendance ca ON cs.id = ca.session_id
WHERE cs.session_type = 'Beginners'
GROUP BY cs.id, cs.session_date, cs.session_time, cs.status
ORDER BY cs.session_date, cs.session_time;
