-- ============================================
-- FIX: admin_confirm_payment should prioritize pending_confirmation sessions
-- Date: 2025-11-13
-- Bug: When admin confirms payment, wrong sessions get marked as paid
-- Issue: https://github.com/bestjon-byte/DoublesLadder/issues/partial-payment-bug
-- ============================================

-- Problem:
-- When a player marks specific sessions as paid (status → 'pending_confirmation')
-- and then admin confirms the payment amount, the function would select sessions
-- by date only, potentially confirming old 'unpaid' sessions instead of the
-- sessions the player actually marked.
--
-- Example:
--   Player has 5 sessions (A, B, C, D, E by date)
--   Player marks C and D as paid → 'pending_confirmation'
--   Admin confirms £8 (2 sessions)
--   OLD BEHAVIOR: Confirms A and B (oldest unpaid) ❌
--   NEW BEHAVIOR: Confirms C and D (pending_confirmation) ✅

-- Drop and recreate the function with correct ordering logic
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
  -- PRIORITIZE pending_confirmation sessions first (sessions player marked)
  -- Then fall back to unpaid sessions if payment covers more
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
    ORDER BY
      -- Prioritize pending_confirmation over unpaid
      -- This ensures sessions the player marked get confirmed first
      CASE ca2.payment_status
        WHEN 'pending_confirmation' THEN 1
        WHEN 'unpaid' THEN 2
      END,
      -- Then by oldest session first within each status
      cs.session_date ASC
    LIMIT v_sessions_to_confirm
  );

  RETURN QUERY SELECT
    v_sessions_to_confirm,
    v_amount_allocated,
    p_amount - v_amount_allocated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION admin_confirm_payment IS 'Confirms payment received from player. Prioritizes pending_confirmation sessions (player marked), then auto-allocates to oldest unpaid sessions if payment covers more.';

-- Grant permissions
GRANT EXECUTE ON FUNCTION admin_confirm_payment TO authenticated;

-- Success message
SELECT '✅ Fixed: admin_confirm_payment now prioritizes pending_confirmation sessions' as status;
