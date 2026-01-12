-- Fix: Update admin_confirm_payment to handle both coaching sessions and match fees
-- This allocates payment to oldest unpaid items first (coaching + match fees combined)

DROP FUNCTION IF EXISTS admin_confirm_payment(UUID, DECIMAL, TEXT, DECIMAL);

CREATE OR REPLACE FUNCTION admin_confirm_payment(
  p_player_id UUID,
  p_amount DECIMAL,
  p_reference TEXT DEFAULT '',
  p_session_cost DECIMAL DEFAULT 4.00
)
RETURNS TABLE (
  sessions_confirmed INT,
  match_fees_confirmed INT,
  amount_allocated DECIMAL,
  remaining_amount DECIMAL
) AS $$
DECLARE
  v_remaining DECIMAL := p_amount;
  v_sessions_count INT := 0;
  v_fees_count INT := 0;
  v_item RECORD;
BEGIN
  -- Get all unpaid items (coaching + match fees) ordered by date (oldest first)
  FOR v_item IN (
    -- Coaching sessions
    SELECT
      'coaching' as item_type,
      ca.id as item_id,
      cs.session_date as item_date,
      4.00 as item_cost
    FROM coaching_attendance ca
    JOIN coaching_sessions cs ON ca.session_id = cs.id
    WHERE ca.player_id = p_player_id
      AND ca.payment_status IN ('unpaid', 'pending_confirmation')
      AND cs.status = 'completed'

    UNION ALL

    -- Match fees
    SELECT
      'match_fee' as item_type,
      mf.id as item_id,
      mf.match_date as item_date,
      mf.fee_amount as item_cost
    FROM match_fees mf
    WHERE mf.player_id = p_player_id
      AND mf.payment_status IN ('unpaid', 'pending_confirmation')

    ORDER BY item_date ASC
  )
  LOOP
    -- Check if we have enough remaining to cover this item
    IF v_remaining >= v_item.item_cost THEN
      -- Mark as paid
      IF v_item.item_type = 'coaching' THEN
        UPDATE coaching_attendance
        SET payment_status = 'paid',
            admin_confirmed_at = NOW(),
            admin_payment_reference = p_reference,
            updated_at = NOW()
        WHERE id = v_item.item_id;

        v_sessions_count := v_sessions_count + 1;
      ELSE
        UPDATE match_fees
        SET payment_status = 'paid',
            updated_at = NOW()
        WHERE id = v_item.item_id;

        v_fees_count := v_fees_count + 1;
      END IF;

      v_remaining := v_remaining - v_item.item_cost;
    END IF;
  END LOOP;

  RETURN QUERY SELECT
    v_sessions_count,
    v_fees_count,
    (p_amount - v_remaining)::DECIMAL,
    v_remaining::DECIMAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
