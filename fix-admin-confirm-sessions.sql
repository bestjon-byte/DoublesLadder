-- Fix admin_confirm_sessions function - update return types to TEXT to match other functions
DROP FUNCTION IF EXISTS admin_confirm_sessions(UUID[], TEXT);
CREATE OR REPLACE FUNCTION admin_confirm_sessions(
  p_attendance_ids UUID[],
  p_reference TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  session_id UUID,
  payment_status TEXT,  -- Changed from VARCHAR to TEXT
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
    coaching_attendance.payment_status::TEXT,  -- Cast to TEXT
    coaching_attendance.admin_confirmed_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION admin_confirm_sessions IS 'Admin confirms specific sessions as paid';
GRANT EXECUTE ON FUNCTION admin_confirm_sessions TO authenticated;

-- Also update admin_confirm_payment function
DROP FUNCTION IF EXISTS admin_confirm_payment(UUID, DECIMAL, TEXT, DECIMAL);
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
      AND cs.session_date < CURRENT_DATE  -- Only confirm past sessions
    ORDER BY cs.session_date ASC
    LIMIT v_sessions_to_confirm
  );

  RETURN QUERY SELECT
    v_sessions_to_confirm,
    v_amount_allocated,
    p_amount - v_amount_allocated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION admin_confirm_payment IS 'Confirms payment received from player, auto-allocates to oldest unpaid past sessions';
GRANT EXECUTE ON FUNCTION admin_confirm_payment TO authenticated;

-- Test the function
SELECT 'admin_confirm_sessions function updated successfully' as status;
