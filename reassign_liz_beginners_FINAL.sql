-- ============================================================================
-- REASSIGN LIZ MYERS BEGINNERS SESSIONS TO LIZ
-- ============================================================================
-- This will reassign 6 Beginners coaching sessions from Liz Myers to Liz
-- The 1 Adults session will remain with Liz Myers
-- ============================================================================

-- Step 1: Verify current state - Show what will be updated
SELECT
  'BEFORE UPDATE - Liz Myers Beginners Sessions' as status,
  ca.id as attendance_id,
  p.name as current_player,
  cs.session_date,
  cs.session_type,
  ca.payment_status
FROM coaching_attendance ca
JOIN profiles p ON ca.player_id = p.id
JOIN coaching_sessions cs ON ca.session_id = cs.id
WHERE ca.player_id = '5e53d15f-8e5a-4d1e-b83e-11346f17ebe7'  -- Liz Myers
  AND cs.session_type = 'Beginners'
ORDER BY cs.session_date;

-- Step 2: Perform the update
-- Reassign all 6 Beginners sessions from Liz Myers to Liz
UPDATE coaching_attendance
SET
  player_id = '8ce83e20-11cb-4166-9d42-a517fba483f3',  -- New Liz profile
  notes = COALESCE(notes || ' | ', '') || 'Reassigned from Liz Myers to Liz on 2025-11-10'
WHERE player_id = '5e53d15f-8e5a-4d1e-b83e-11346f17ebe7'  -- Liz Myers
  AND session_id IN (
    SELECT cs.id
    FROM coaching_sessions cs
    WHERE cs.session_type = 'Beginners'
  );

-- Step 3: Verify the update worked
SELECT
  'AFTER UPDATE - Liz now has these Beginners Sessions' as status,
  ca.id as attendance_id,
  p.name as new_player,
  cs.session_date,
  cs.session_type,
  ca.payment_status
FROM coaching_attendance ca
JOIN profiles p ON ca.player_id = p.id
JOIN coaching_sessions cs ON ca.session_id = cs.id
WHERE ca.player_id = '8ce83e20-11cb-4166-9d42-a517fba483f3'  -- Liz
  AND cs.session_type = 'Beginners'
ORDER BY cs.session_date;

-- Step 4: Confirm Liz Myers still has the Adults session
SELECT
  'CONFIRMATION - Liz Myers remaining sessions (Adults only)' as status,
  ca.id as attendance_id,
  p.name as player,
  cs.session_date,
  cs.session_type,
  ca.payment_status
FROM coaching_attendance ca
JOIN profiles p ON ca.player_id = p.id
JOIN coaching_sessions cs ON ca.session_id = cs.id
WHERE ca.player_id = '5e53d15f-8e5a-4d1e-b83e-11346f17ebe7'  -- Liz Myers
ORDER BY cs.session_date;

-- Step 5: Final summary
SELECT
  '=== SUMMARY ===' as status,
  'Total Beginners sessions reassigned from Liz Myers to Liz' as description,
  COUNT(*) as count
FROM coaching_attendance ca
JOIN coaching_sessions cs ON ca.session_id = cs.id
WHERE ca.player_id = '8ce83e20-11cb-4166-9d42-a517fba483f3'  -- Liz
  AND cs.session_type = 'Beginners';
