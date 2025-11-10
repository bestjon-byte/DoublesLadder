-- ============================================================================
-- REASSIGN LIZ MYERS COACHING SESSIONS TO LIZ
-- ============================================================================
-- Run this in Supabase SQL Editor with admin privileges
-- This will reassign all Beginners coaching attendance from Liz Myers to Liz
-- ============================================================================

-- Step 1: Verify the profiles exist and get their IDs
SELECT
  id,
  name,
  email,
  'Profile found' as status
FROM profiles
WHERE name IN ('Liz Myers', 'Liz')
ORDER BY name;

-- Step 2: Check current Beginners sessions for Liz Myers
SELECT
  ca.id as attendance_id,
  p.name as player_name,
  p.email as player_email,
  cs.session_date,
  cs.session_type,
  cs.session_time,
  ca.payment_status
FROM coaching_attendance ca
JOIN profiles p ON ca.player_id = p.id
JOIN coaching_sessions cs ON ca.session_id = cs.id
WHERE p.name = 'Liz Myers'
  AND cs.session_type = 'Beginners'
ORDER BY cs.session_date;

-- Step 3: Update the attendance records
-- This changes all Beginners coaching attendance from Liz Myers to Liz
UPDATE coaching_attendance
SET
  player_id = (SELECT id FROM profiles WHERE name = 'Liz' LIMIT 1),
  notes = COALESCE(notes || ' | ', '') || 'Reassigned from Liz Myers to Liz profile'
WHERE player_id = (SELECT id FROM profiles WHERE name = 'Liz Myers' LIMIT 1)
  AND session_id IN (
    SELECT cs.id
    FROM coaching_sessions cs
    WHERE cs.session_type = 'Beginners'
  );

-- Step 4: Verify the update worked
SELECT
  ca.id as attendance_id,
  p.name as player_name,
  p.email as player_email,
  cs.session_date,
  cs.session_type,
  cs.session_time,
  ca.payment_status,
  ca.notes
FROM coaching_attendance ca
JOIN profiles p ON ca.player_id = p.id
JOIN coaching_sessions cs ON ca.session_id = cs.id
WHERE p.name = 'Liz'
  AND cs.session_type = 'Beginners'
ORDER BY cs.session_date;

-- Step 5: Confirm Liz Myers has no more Beginners sessions
SELECT
  'Liz Myers remaining Beginners sessions' as check_description,
  COUNT(*) as count
FROM coaching_attendance ca
JOIN profiles p ON ca.player_id = p.id
JOIN coaching_sessions cs ON ca.session_id = cs.id
WHERE p.name = 'Liz Myers'
  AND cs.session_type = 'Beginners';

-- Summary
SELECT
  'Update complete!' as status,
  'All Beginners coaching sessions reassigned from Liz Myers to Liz' as message;
