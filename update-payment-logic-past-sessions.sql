-- Update payment logic to only count sessions that have already occurred (past dates)
-- Future sessions don't count towards money owed until the date passes

-- Update get_all_players_payment_summary to only count past sessions
DROP FUNCTION IF EXISTS get_all_players_payment_summary(DECIMAL);
CREATE OR REPLACE FUNCTION get_all_players_payment_summary(
  p_session_cost DECIMAL DEFAULT 4.00
)
RETURNS TABLE (
  player_id UUID,
  player_name TEXT,
  player_email TEXT,
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
    p.name::TEXT as player_name,
    p.email::TEXT as player_email,
    COUNT(ca.id)::INTEGER as total_sessions,
    COUNT(CASE WHEN ca.payment_status = 'unpaid' AND cs.session_date < CURRENT_DATE THEN 1 END)::INTEGER as unpaid_sessions,
    COUNT(CASE WHEN ca.payment_status = 'pending_confirmation' AND cs.session_date < CURRENT_DATE THEN 1 END)::INTEGER as pending_confirmation_sessions,
    COUNT(CASE WHEN ca.payment_status = 'paid' AND cs.session_date < CURRENT_DATE THEN 1 END)::INTEGER as paid_sessions,
    (COUNT(CASE WHEN ca.payment_status = 'unpaid' AND cs.session_date < CURRENT_DATE THEN 1 END) * p_session_cost) as amount_owed,
    (COUNT(CASE WHEN ca.payment_status = 'pending_confirmation' AND cs.session_date < CURRENT_DATE THEN 1 END) * p_session_cost) as amount_pending_confirmation,
    (COUNT(CASE WHEN ca.payment_status = 'paid' AND cs.session_date < CURRENT_DATE THEN 1 END) * p_session_cost) as amount_paid
  FROM profiles p
  INNER JOIN coaching_attendance ca ON ca.player_id = p.id
  INNER JOIN coaching_sessions cs ON ca.session_id = cs.id  -- Join with sessions to get date
  GROUP BY p.id, p.name, p.email
  HAVING COUNT(CASE WHEN ca.payment_status = 'unpaid' AND cs.session_date < CURRENT_DATE THEN 1 END) > 0
      OR COUNT(CASE WHEN ca.payment_status = 'pending_confirmation' AND cs.session_date < CURRENT_DATE THEN 1 END) > 0
      OR COUNT(CASE WHEN ca.payment_status = 'paid' AND cs.session_date < CURRENT_DATE THEN 1 END) > 0
  ORDER BY amount_owed DESC, p.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update get_player_payment_summary to only count past sessions
DROP FUNCTION IF EXISTS get_player_payment_summary(UUID, DECIMAL);
CREATE OR REPLACE FUNCTION get_player_payment_summary(
  p_player_id UUID,
  p_session_cost DECIMAL DEFAULT 4.00
)
RETURNS TABLE (
  player_id UUID,
  player_name TEXT,
  player_email TEXT,
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
    p.name::TEXT as player_name,
    p.email::TEXT as player_email,
    COUNT(ca.id)::INTEGER as total_sessions,
    COUNT(CASE WHEN ca.payment_status = 'unpaid' AND cs.session_date < CURRENT_DATE THEN 1 END)::INTEGER as unpaid_sessions,
    COUNT(CASE WHEN ca.payment_status = 'pending_confirmation' AND cs.session_date < CURRENT_DATE THEN 1 END)::INTEGER as pending_confirmation_sessions,
    COUNT(CASE WHEN ca.payment_status = 'paid' AND cs.session_date < CURRENT_DATE THEN 1 END)::INTEGER as paid_sessions,
    (COUNT(CASE WHEN ca.payment_status = 'unpaid' AND cs.session_date < CURRENT_DATE THEN 1 END) * p_session_cost) as amount_owed,
    (COUNT(CASE WHEN ca.payment_status = 'pending_confirmation' AND cs.session_date < CURRENT_DATE THEN 1 END) * p_session_cost) as amount_pending_confirmation,
    (COUNT(CASE WHEN ca.payment_status = 'paid' AND cs.session_date < CURRENT_DATE THEN 1 END) * p_session_cost) as amount_paid
  FROM profiles p
  LEFT JOIN coaching_attendance ca ON ca.player_id = p.id
  LEFT JOIN coaching_sessions cs ON ca.session_id = cs.id  -- Join with sessions to get date
  WHERE p.id = p_player_id
  GROUP BY p.id, p.name, p.email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update get_player_sessions_by_payment_status to separate future and past sessions
DROP FUNCTION IF EXISTS get_player_sessions_by_payment_status(UUID);
CREATE OR REPLACE FUNCTION get_player_sessions_by_payment_status(
  p_player_id UUID
)
RETURNS TABLE (
  attendance_id UUID,
  session_id UUID,
  session_date DATE,
  session_time TEXT,
  session_type TEXT,
  payment_status TEXT,
  user_marked_paid_at TIMESTAMP WITH TIME ZONE,
  user_payment_note TEXT,
  admin_confirmed_at TIMESTAMP WITH TIME ZONE,
  admin_payment_reference TEXT,
  is_past_session BOOLEAN  -- New field to indicate if session has occurred
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ca.id as attendance_id,
    cs.id as session_id,
    cs.session_date,
    cs.session_time::TEXT,
    cs.session_type::TEXT,
    ca.payment_status::TEXT,
    ca.user_marked_paid_at,
    ca.user_payment_note,
    ca.admin_confirmed_at,
    ca.admin_payment_reference,
    (cs.session_date < CURRENT_DATE) as is_past_session  -- Flag for past sessions
  FROM coaching_attendance ca
  JOIN coaching_sessions cs ON ca.session_id = cs.id
  WHERE ca.player_id = p_player_id
  ORDER BY
    -- Future sessions at the bottom, past sessions at the top
    CASE WHEN cs.session_date >= CURRENT_DATE THEN 1 ELSE 0 END,
    -- Then by payment status (unpaid first for past sessions)
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

-- Verify: Show how many sessions are past vs future
SELECT
  'Total Attendance' as metric,
  COUNT(*)::TEXT as count
FROM coaching_attendance ca
UNION ALL
SELECT
  'Past Sessions (owed)',
  COUNT(*)::TEXT
FROM coaching_attendance ca
JOIN coaching_sessions cs ON ca.session_id = cs.id
WHERE cs.session_date < CURRENT_DATE
  AND ca.payment_status = 'unpaid'
UNION ALL
SELECT
  'Future Sessions (not owed yet)',
  COUNT(*)::TEXT
FROM coaching_attendance ca
JOIN coaching_sessions cs ON ca.session_id = cs.id
WHERE cs.session_date >= CURRENT_DATE
  AND ca.payment_status = 'unpaid';
