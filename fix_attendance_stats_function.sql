-- ============================================================================
-- Fix attendance stats function - correct column types
-- ============================================================================
-- The issue: profiles.name and profiles.email are TEXT, not VARCHAR
-- PostgreSQL is strict about type matching in RETURNS TABLE

DROP FUNCTION IF EXISTS get_player_attendance_stats_by_type(VARCHAR);

CREATE OR REPLACE FUNCTION get_player_attendance_stats_by_type(
  p_session_type VARCHAR DEFAULT NULL
)
RETURNS TABLE (
  player_id UUID,
  player_name TEXT,        -- Changed from VARCHAR to TEXT
  player_email TEXT,       -- Changed from VARCHAR to TEXT
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
  WHERE EXISTS (
    -- Only include players who have coaching access
    SELECT 1 FROM coaching_access
    WHERE coaching_access.player_id = p.id
    AND coaching_access.revoked_at IS NULL
  )
  GROUP BY p.id, p.name, p.email
  ORDER BY attendance_count DESC, p.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_player_attendance_stats_by_type IS 'Returns player attendance statistics filtered by session type, ordered by attendance frequency';
