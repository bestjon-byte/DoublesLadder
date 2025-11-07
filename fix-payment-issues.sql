-- Fix 1: Grant coaching access to all players who have attendance records
-- This allows them to see their own payments
INSERT INTO coaching_access (player_id, granted_by, notes)
SELECT DISTINCT
  ca.player_id,
  ca.player_id, -- Self-granted for now
  'Auto-granted for existing attendance'
FROM coaching_attendance ca
WHERE NOT EXISTS (
  SELECT 1 FROM coaching_access
  WHERE coaching_access.player_id = ca.player_id
  AND coaching_access.revoked_at IS NULL
)
ON CONFLICT DO NOTHING;

-- Fix 2: Fix the type mismatch in payment functions
-- The issue is VARCHAR vs TEXT mismatch
-- Recreate the functions with correct types
DROP FUNCTION IF EXISTS get_all_players_payment_summary(DECIMAL);
CREATE OR REPLACE FUNCTION get_all_players_payment_summary(
  p_session_cost DECIMAL DEFAULT 4.00
)
RETURNS TABLE (
  player_id UUID,
  player_name TEXT,  -- Changed from VARCHAR to TEXT
  player_email TEXT,  -- Changed from VARCHAR to TEXT
  total_sessions INTEGER,
  unpaid_sessions INTEGER,
  pending_confirmation_sessions INTEGER,
  paid_sessions INTEGER,
  amount_owed DECIMAL,
  amount_pending_confirmation DECIMAL,
  amount_paid DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id as player_id,
    p.name::TEXT as player_name,  -- Cast to TEXT
    p.email::TEXT as player_email,  -- Cast to TEXT
    COUNT(ca.id)::INTEGER as total_sessions,
    COUNT(CASE WHEN ca.payment_status = 'unpaid' THEN 1 END)::INTEGER as unpaid_sessions,
    COUNT(CASE WHEN ca.payment_status = 'pending_confirmation' THEN 1 END)::INTEGER as pending_confirmation_sessions,
    COUNT(CASE WHEN ca.payment_status = 'paid' THEN 1 END)::INTEGER as paid_sessions,
    (COUNT(CASE WHEN ca.payment_status = 'unpaid' THEN 1 END) * p_session_cost) as amount_owed,
    (COUNT(CASE WHEN ca.payment_status = 'pending_confirmation' THEN 1 END) * p_session_cost) as amount_pending_confirmation,
    (COUNT(CASE WHEN ca.payment_status = 'paid' THEN 1 END) * p_session_cost) as amount_paid
  FROM profiles p
  INNER JOIN coaching_attendance ca ON ca.player_id = p.id
  GROUP BY p.id, p.name, p.email
  ORDER BY amount_owed DESC, p.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS get_player_payment_summary(UUID, DECIMAL);
CREATE OR REPLACE FUNCTION get_player_payment_summary(
  p_player_id UUID,
  p_session_cost DECIMAL DEFAULT 4.00
)
RETURNS TABLE (
  player_id UUID,
  player_name TEXT,  -- Changed from VARCHAR to TEXT
  player_email TEXT,  -- Changed from VARCHAR to TEXT
  total_sessions INTEGER,
  unpaid_sessions INTEGER,
  pending_confirmation_sessions INTEGER,
  paid_sessions INTEGER,
  amount_owed DECIMAL,
  amount_pending_confirmation DECIMAL,
  amount_paid DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id as player_id,
    p.name::TEXT as player_name,  -- Cast to TEXT
    p.email::TEXT as player_email,  -- Cast to TEXT
    COUNT(ca.id)::INTEGER as total_sessions,
    COUNT(CASE WHEN ca.payment_status = 'unpaid' THEN 1 END)::INTEGER as unpaid_sessions,
    COUNT(CASE WHEN ca.payment_status = 'pending_confirmation' THEN 1 END)::INTEGER as pending_confirmation_sessions,
    COUNT(CASE WHEN ca.payment_status = 'paid' THEN 1 END)::INTEGER as paid_sessions,
    (COUNT(CASE WHEN ca.payment_status = 'unpaid' THEN 1 END) * p_session_cost) as amount_owed,
    (COUNT(CASE WHEN ca.payment_status = 'pending_confirmation' THEN 1 END) * p_session_cost) as amount_pending_confirmation,
    (COUNT(CASE WHEN ca.payment_status = 'paid' THEN 1 END) * p_session_cost) as amount_paid
  FROM profiles p
  LEFT JOIN coaching_attendance ca ON ca.player_id = p.id
  WHERE p.id = p_player_id
  GROUP BY p.id, p.name, p.email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS get_player_sessions_by_payment_status(UUID);
CREATE OR REPLACE FUNCTION get_player_sessions_by_payment_status(
  p_player_id UUID
)
RETURNS TABLE (
  attendance_id UUID,
  session_id UUID,
  session_date DATE,
  session_time TEXT,  -- Changed from VARCHAR to TEXT
  session_type TEXT,  -- Changed from VARCHAR to TEXT
  payment_status TEXT,  -- Changed from VARCHAR to TEXT
  user_marked_paid_at TIMESTAMP WITH TIME ZONE,
  user_payment_note TEXT,
  admin_confirmed_at TIMESTAMP WITH TIME ZONE,
  admin_payment_reference TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ca.id as attendance_id,
    cs.id as session_id,
    cs.session_date,
    cs.session_time::TEXT,  -- Cast to TEXT
    cs.session_type::TEXT,  -- Cast to TEXT
    ca.payment_status::TEXT,  -- Cast to TEXT
    ca.user_marked_paid_at,
    ca.user_payment_note,
    ca.admin_confirmed_at,
    ca.admin_payment_reference
  FROM coaching_attendance ca
  JOIN coaching_sessions cs ON ca.session_id = cs.id
  WHERE ca.player_id = p_player_id
  ORDER BY
    CASE ca.payment_status
      WHEN 'unpaid' THEN 1
      WHEN 'pending_confirmation' THEN 2
      WHEN 'paid' THEN 3
    END,
    cs.session_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-grant permissions
GRANT EXECUTE ON FUNCTION get_all_players_payment_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_player_payment_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_player_sessions_by_payment_status TO authenticated;

-- Verify the fixes
SELECT
  'Coaching Access Records' as check_type,
  COUNT(*)::TEXT as result
FROM coaching_access
WHERE revoked_at IS NULL
UNION ALL
SELECT
  'Attendance Records',
  COUNT(*)::TEXT
FROM coaching_attendance
UNION ALL
SELECT
  'Players with Unpaid Sessions',
  COUNT(DISTINCT player_id)::TEXT
FROM coaching_attendance
WHERE payment_status = 'unpaid';
