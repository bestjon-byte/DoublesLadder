-- Reassign coaching sessions from Liz Myers to Liz profile
-- Find and update beginner coaching sessions

-- Step 1: Find the profile IDs
-- This will help us identify both profiles
SELECT id, name, email
FROM profiles
WHERE name ILIKE '%liz%'
ORDER BY name;

-- Step 2: Check current attendance records for Liz Myers (beginner sessions)
SELECT
    ca.id as attendance_id,
    ca.player_id,
    p.name as player_name,
    cs.session_date,
    cs.session_type,
    cs.session_time
FROM coaching_attendance ca
JOIN profiles p ON ca.player_id = p.id
JOIN coaching_sessions cs ON ca.session_id = cs.id
WHERE p.name = 'Liz Myers'
  AND cs.session_type = 'Beginners'
ORDER BY cs.session_date;

-- Step 3: Update the attendance records
-- Replace 'OLD_LIZ_MYERS_ID' and 'NEW_LIZ_ID' with actual UUIDs from Step 1
-- Uncomment and run after confirming IDs:
/*
UPDATE coaching_attendance
SET player_id = 'NEW_LIZ_ID'
WHERE player_id = 'OLD_LIZ_MYERS_ID'
  AND session_id IN (
    SELECT cs.id
    FROM coaching_sessions cs
    WHERE cs.session_type = 'Beginners'
  );
*/

-- Step 4: Verify the update
-- Uncomment after running update:
/*
SELECT
    ca.id as attendance_id,
    ca.player_id,
    p.name as player_name,
    cs.session_date,
    cs.session_type,
    cs.session_time
FROM coaching_attendance ca
JOIN profiles p ON ca.player_id = p.id
JOIN coaching_sessions cs ON ca.session_id = cs.id
WHERE p.name = 'Liz'
  AND cs.session_type = 'Beginners'
ORDER BY cs.session_date;
*/
