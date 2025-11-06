-- Coaching Payment Restructure
-- Moves payment tracking from separate payment requests to session-level tracking

-- Add payment tracking fields to coaching_attendance
ALTER TABLE coaching_attendance
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'pending_confirmation', 'paid')),
ADD COLUMN IF NOT EXISTS user_marked_paid_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS user_payment_note TEXT,
ADD COLUMN IF NOT EXISTS admin_confirmed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS admin_payment_reference TEXT;

COMMENT ON COLUMN coaching_attendance.payment_status IS 'Payment status for this session: unpaid, pending_confirmation (player marked), paid (admin confirmed)';
COMMENT ON COLUMN coaching_attendance.user_marked_paid_at IS 'When player marked this session as paid';
COMMENT ON COLUMN coaching_attendance.user_payment_note IS 'Note from player about payment (e.g., transfer reference)';
COMMENT ON COLUMN coaching_attendance.admin_confirmed_at IS 'When admin confirmed payment received for this session';
COMMENT ON COLUMN coaching_attendance.admin_payment_reference IS 'Admin reference for payment confirmation';

-- Create index for payment queries
CREATE INDEX IF NOT EXISTS idx_coaching_attendance_payment_status ON coaching_attendance(payment_status);
CREATE INDEX IF NOT EXISTS idx_coaching_attendance_player_payment ON coaching_attendance(player_id, payment_status);

-- Function for player to mark session(s) as paid
CREATE OR REPLACE FUNCTION player_mark_sessions_paid(
  p_attendance_ids UUID[],
  p_player_id UUID,
  p_note TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  session_id UUID,
  payment_status VARCHAR,
  user_marked_paid_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  UPDATE coaching_attendance
  SET
    payment_status = 'pending_confirmation',
    user_marked_paid_at = NOW(),
    user_payment_note = p_note
  WHERE coaching_attendance.id = ANY(p_attendance_ids)
    AND player_id = p_player_id
    AND payment_status = 'unpaid'
  RETURNING
    coaching_attendance.id,
    coaching_attendance.session_id,
    coaching_attendance.payment_status,
    coaching_attendance.user_marked_paid_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION player_mark_sessions_paid IS 'Allows player to mark their session(s) as paid, setting status to pending_confirmation';

-- Function for admin to confirm payment received
-- Allocates payment to oldest unpaid/pending sessions first
CREATE OR REPLACE FUNCTION admin_confirm_payment(
  p_player_id UUID,
  p_amount DECIMAL,
  p_reference TEXT DEFAULT NULL,
  p_session_cost DECIMAL DEFAULT 4.00
)
RETURNS TABLE (
  sessions_confirmed INTEGER,
  amount_allocated DECIMAL,
  remaining_amount DECIMAL
) AS $$
DECLARE
  v_sessions_to_confirm INTEGER;
  v_amount_allocated DECIMAL;
BEGIN
  -- Calculate how many sessions this payment covers
  v_sessions_to_confirm := FLOOR(p_amount / p_session_cost)::INTEGER;
  v_amount_allocated := v_sessions_to_confirm * p_session_cost;

  -- Mark the oldest unpaid/pending sessions as paid
  UPDATE coaching_attendance ca
  SET
    payment_status = 'paid',
    admin_confirmed_at = NOW(),
    admin_payment_reference = p_reference
  WHERE ca.id IN (
    SELECT ca2.id
    FROM coaching_attendance ca2
    JOIN coaching_sessions cs ON ca2.session_id = cs.id
    WHERE ca2.player_id = p_player_id
      AND ca2.payment_status IN ('unpaid', 'pending_confirmation')
    ORDER BY cs.session_date ASC
    LIMIT v_sessions_to_confirm
  );

  RETURN QUERY SELECT
    v_sessions_to_confirm,
    v_amount_allocated,
    p_amount - v_amount_allocated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION admin_confirm_payment IS 'Confirms payment received from player, auto-allocates to oldest unpaid sessions';

-- Function to confirm specific sessions as paid (for manual admin confirmation)
CREATE OR REPLACE FUNCTION admin_confirm_sessions(
  p_attendance_ids UUID[],
  p_reference TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  session_id UUID,
  payment_status VARCHAR,
  admin_confirmed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  UPDATE coaching_attendance
  SET
    payment_status = 'paid',
    admin_confirmed_at = NOW(),
    admin_payment_reference = p_reference
  WHERE coaching_attendance.id = ANY(p_attendance_ids)
    AND payment_status IN ('unpaid', 'pending_confirmation')
  RETURNING
    coaching_attendance.id,
    coaching_attendance.session_id,
    coaching_attendance.payment_status,
    coaching_attendance.admin_confirmed_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION admin_confirm_sessions IS 'Admin confirms specific sessions as paid';

-- Function to get payment summary for all players
CREATE OR REPLACE FUNCTION get_all_players_payment_summary(
  p_session_cost DECIMAL DEFAULT 4.00
)
RETURNS TABLE (
  player_id UUID,
  player_name VARCHAR,
  player_email VARCHAR,
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
    p.name as player_name,
    p.email as player_email,
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

COMMENT ON FUNCTION get_all_players_payment_summary IS 'Returns payment summary for all players with coaching attendance';

-- Function to get payment summary for a specific player
CREATE OR REPLACE FUNCTION get_player_payment_summary(
  p_player_id UUID,
  p_session_cost DECIMAL DEFAULT 4.00
)
RETURNS TABLE (
  player_id UUID,
  player_name VARCHAR,
  player_email VARCHAR,
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
    p.name as player_name,
    p.email as player_email,
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

COMMENT ON FUNCTION get_player_payment_summary IS 'Returns payment summary for a specific player';

-- Function to get detailed session list for a player (grouped by payment status)
CREATE OR REPLACE FUNCTION get_player_sessions_by_payment_status(
  p_player_id UUID
)
RETURNS TABLE (
  attendance_id UUID,
  session_id UUID,
  session_date DATE,
  session_time VARCHAR,
  session_type VARCHAR,
  payment_status VARCHAR,
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
    cs.session_time,
    cs.session_type,
    ca.payment_status,
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

COMMENT ON FUNCTION get_player_sessions_by_payment_status IS 'Returns all sessions for a player grouped by payment status';

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION player_mark_sessions_paid TO authenticated;
GRANT EXECUTE ON FUNCTION admin_confirm_payment TO authenticated;
GRANT EXECUTE ON FUNCTION admin_confirm_sessions TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_players_payment_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_player_payment_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_player_sessions_by_payment_status TO authenticated;
