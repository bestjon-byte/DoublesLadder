-- Coaching Payment Enhancements
-- Adds user payment confirmation workflow and session deletion

-- Add field for user to mark payment as paid (pending admin confirmation)
ALTER TABLE coaching_payments
ADD COLUMN IF NOT EXISTS user_marked_paid_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS user_payment_note TEXT;

-- Update the status check to include pending_confirmation
ALTER TABLE coaching_payments
DROP CONSTRAINT IF EXISTS coaching_payments_status_check;

ALTER TABLE coaching_payments
ADD CONSTRAINT coaching_payments_status_check
CHECK (status IN ('pending', 'pending_confirmation', 'paid', 'overdue', 'cancelled'));

COMMENT ON COLUMN coaching_payments.user_marked_paid_at IS 'When user marked payment as paid (pending admin confirmation)';
COMMENT ON COLUMN coaching_payments.user_payment_note IS 'Note from user about their payment (e.g., transfer reference)';

-- Function to mark payment as paid by user (sets status to pending_confirmation)
CREATE OR REPLACE FUNCTION user_mark_payment_paid(
  p_payment_id UUID,
  p_user_id UUID,
  p_note TEXT DEFAULT NULL
)
RETURNS coaching_payments AS $$
DECLARE
  v_payment coaching_payments;
BEGIN
  -- Update payment
  UPDATE coaching_payments
  SET
    user_marked_paid_at = NOW(),
    user_payment_note = p_note,
    status = 'pending_confirmation'
  WHERE id = p_payment_id
    AND player_id = p_user_id
    AND status = 'pending'
  RETURNING * INTO v_payment;

  IF v_payment IS NULL THEN
    RAISE EXCEPTION 'Payment not found or already processed';
  END IF;

  RETURN v_payment;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION user_mark_payment_paid IS 'Allows user to mark their payment as paid, setting status to pending_confirmation';

-- Function to get payment statistics
CREATE OR REPLACE FUNCTION get_payment_statistics()
RETURNS TABLE (
  total_owed DECIMAL,
  total_pending_confirmation DECIMAL,
  total_received DECIMAL,
  pending_count INTEGER,
  pending_confirmation_count INTEGER,
  paid_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN status = 'pending' THEN amount_due ELSE 0 END), 0) as total_owed,
    COALESCE(SUM(CASE WHEN status = 'pending_confirmation' THEN amount_due ELSE 0 END), 0) as total_pending_confirmation,
    COALESCE(SUM(CASE WHEN status = 'paid' THEN amount_due ELSE 0 END), 0) as total_received,
    COUNT(CASE WHEN status = 'pending' THEN 1 END)::INTEGER as pending_count,
    COUNT(CASE WHEN status = 'pending_confirmation' THEN 1 END)::INTEGER as pending_confirmation_count,
    COUNT(CASE WHEN status = 'paid' THEN 1 END)::INTEGER as paid_count
  FROM coaching_payments;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_payment_statistics IS 'Returns summary statistics for all coaching payments';

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION user_mark_payment_paid TO authenticated;
GRANT EXECUTE ON FUNCTION get_payment_statistics TO authenticated;
