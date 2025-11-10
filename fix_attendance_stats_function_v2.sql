-- ============================================================================
-- Fix attendance stats function - remove coaching_access restriction
-- ============================================================================
-- The issue: Function filters to only players with coaching_access records
-- But players can attend sessions without being in coaching_access table
-- (admin can manually add anyone to a session)
--
-- Solution: Return ALL players who have actually attended at least one session

DROP FUNCTION IF EXISTS get_player_attendance_stats_by_type(VARCHAR);

CREATE OR REPLACE FUNCTION get_player_attendance_stats_by_type(
  p_session_type VARCHAR DEFAULT NULL
)
RETURNS TABLE (
  player_id UUID,
  player_name TEXT,
  player_email TEXT,
  attendance_count BIGINT,
  last_attended_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS player_id,
    p.name AS player_name,
    p.email AS player_email,
    COUNT(ca.id) AS attendance_count,
    MAX(cs.session_date) AS last_attended_date
  FROM profiles p
  LEFT JOIN coaching_attendance ca ON ca.player_id = p.id
  LEFT JOIN coaching_sessions cs ON cs.id = ca.session_id
    AND (p_session_type IS NULL OR cs.session_type = p_session_type)
  -- Changed: Include all players who have attended at least one session
  -- This way players who were manually added to sessions will appear
  WHERE EXISTS (
    SELECT 1 FROM coaching_attendance
    WHERE coaching_attendance.player_id = p.id
  )
  GROUP BY p.id, p.name, p.email
  ORDER BY attendance_count DESC, p.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_player_attendance_stats_by_type IS 'Returns attendance statistics for players who have attended at least one session, filtered by session type';
