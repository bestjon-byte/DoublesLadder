-- ============================================================================
-- CHECK LIZ ATTENDANCE - SIMPLE SINGLE QUERY
-- ============================================================================
-- This returns everything in a single result set
-- ============================================================================

SELECT
  p.id as player_id,
  p.name as player_name,
  p.email as player_email,
  ca.id as attendance_id,
  cs.id as session_id,
  cs.session_date,
  cs.session_type,
  cs.session_time,
  cs.status as session_status,
  ca.payment_status,
  ca.created_at as attendance_created_at
FROM coaching_attendance ca
JOIN profiles p ON ca.player_id = p.id
JOIN coaching_sessions cs ON ca.session_id = cs.id
WHERE p.name IN ('Liz Myers', 'Liz')
ORDER BY p.name, cs.session_date, cs.session_time;
