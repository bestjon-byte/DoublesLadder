-- Fix: Resolve ambiguous column references in player_mark_sessions_paid function
-- Bug: "column reference 'payment_status' is ambiguous" error when marking sessions as paid
-- Date: 2025-11-12
-- Issue: Function has RETURNS TABLE with column names that match table columns,
--        causing ambiguity in SET and WHERE clauses

-- Drop and recreate the function with fully qualified column names
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
    -- SET clause cannot have table qualifiers
    payment_status = 'pending_confirmation',
    user_marked_paid_at = NOW(),
    user_payment_note = p_note
  WHERE coaching_attendance.id = ANY(p_attendance_ids)
    AND coaching_attendance.player_id = p_player_id
    AND coaching_attendance.payment_status = 'unpaid'
  RETURNING
    coaching_attendance.id,
    coaching_attendance.session_id,
    coaching_attendance.payment_status,
    coaching_attendance.user_marked_paid_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION player_mark_sessions_paid IS 'Allows player to mark their session(s) as paid, setting status to pending_confirmation';

-- Ensure permissions are set
GRANT EXECUTE ON FUNCTION player_mark_sessions_paid TO authenticated;
