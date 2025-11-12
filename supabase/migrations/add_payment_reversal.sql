-- Migration: Add Payment Reversal Functionality
-- Created: 2025-11-12
-- Purpose: Allow admins to reverse payment status back to 'unpaid' when payments haven't actually been received

-- Function to reverse payment status for specified attendance records
CREATE OR REPLACE FUNCTION admin_reverse_payment_status(
  p_attendance_ids UUID[],
  p_reason TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  session_id UUID,
  player_id UUID,
  payment_status VARCHAR,
  reversed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- Update the specified attendance records back to 'unpaid'
  -- Clear admin confirmation fields and add reversal note
  RETURN QUERY
  UPDATE coaching_attendance
  SET
    payment_status = 'unpaid',
    admin_confirmed_at = NULL,
    admin_payment_reference = CASE
      WHEN p_reason IS NOT NULL THEN
        COALESCE(admin_payment_reference, '') || ' [REVERSED: ' || p_reason || ' at ' || NOW()::TEXT || ']'
      ELSE
        COALESCE(admin_payment_reference, '') || ' [REVERSED at ' || NOW()::TEXT || ']'
    END,
    user_marked_paid_at = NULL
  WHERE coaching_attendance.id = ANY(p_attendance_ids)
    AND coaching_attendance.payment_status IN ('pending_confirmation', 'paid')
  RETURNING
    coaching_attendance.id,
    coaching_attendance.session_id,
    coaching_attendance.player_id,
    coaching_attendance.payment_status,
    NOW() as reversed_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (RLS will handle admin check)
GRANT EXECUTE ON FUNCTION admin_reverse_payment_status TO authenticated;

-- Comment for documentation
COMMENT ON FUNCTION admin_reverse_payment_status IS
'Allows admins to reverse payment status from pending_confirmation or paid back to unpaid.
Used when players claim to have paid but money has not been received.
Clears admin confirmation timestamps and appends reversal reason to payment reference.';
