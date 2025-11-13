# Bug Report: Partial Payment Handling Issues
**Date**: 2025-11-13
**Severity**: HIGH
**Status**: Identified - Fix Required

---

## Executive Summary

The payment system has a **critical bug** in how it handles partial payment confirmations. When a player marks specific sessions as paid and the admin confirms the payment, the system confirms the **wrong sessions**, leaving the player's marked sessions still pending. This causes incorrect accounting where the system thinks more money has been paid/pending than actually has been.

---

## Bug Details

### Bug #1: `admin_confirm_payment` Confirms Wrong Sessions (PRIMARY BUG)

**Location**: `coaching_payment_restructure.sql` lines 75-89

**Problem**: When admin confirms a payment, the function selects sessions to mark as paid by ordering ONLY by `session_date ASC` (oldest first). It does NOT prioritize `pending_confirmation` sessions over `unpaid` sessions.

**Current Code** (INCORRECT):
```sql
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
  ORDER BY cs.session_date ASC  -- ❌ ONLY orders by date, not status!
  LIMIT v_sessions_to_confirm
);
```

**Why This Is Wrong**:
When admin confirms a payment, they're typically confirming the sessions that the player explicitly marked. But this query might select completely different (older) unpaid sessions instead.

**Example Scenario**:
1. Player has 5 sessions (by date: A=Jan, B=Feb, C=Mar, D=Apr, E=May)
2. All sessions are `unpaid` = £20 owed
3. Player logs in, marks sessions C and D as paid (£8) → C, D become `pending_confirmation`
4. Admin confirms £8 payment
5. Function calculates: FLOOR(8/4) = 2 sessions to confirm
6. Function selects 2 oldest sessions where status IN ('unpaid', 'pending_confirmation')
7. **Sessions A and B get confirmed** (oldest by date, both unpaid)
8. **Sessions C and D remain `pending_confirmation`** (not confirmed!)

**Result**:
- Sessions A, B: `paid` = £8 ✓
- Sessions C, D: `pending_confirmation` = £8 ❌ (should be paid)
- Session E: `unpaid` = £4 ✓
- **System shows £16 as "paid + pending" when only £8 was actually confirmed**

---

## Real-World Impact: Michael Brennan Case

**Initial State**:
- 5 sessions unpaid = £20 owed

**Step 1**: Michael marks £8 as paid
- 2 sessions → `pending_confirmation` (£8)
- 3 sessions → `unpaid` (£12)

**Step 2**: Admin confirms £8 payment
- Due to Bug #1, 2 oldest unpaid sessions get marked as `paid`
- Original 2 pending sessions **remain pending**
- Result: £8 paid + £8 pending + £4 unpaid = £20 total

**Step 3**: Reminder sent for £4 (the remaining unpaid session)
- Michael clicks "I've Paid"
- Remaining unpaid session (£4) → `pending_confirmation`
- Result: £8 paid + **£12 pending** (£8 old + £4 new) + £0 unpaid

**Final Problem**: System shows £12 "to confirm" but admin only saw Michael pay £8 + £4 = £12 total, not £8 + £12 = £20. The accounting is wrong.

---

## Root Cause Analysis

The `admin_confirm_payment` function was designed to auto-allocate payments to oldest sessions, which makes sense for:
- Walk-up payments where player didn't pre-mark sessions
- Bulk payments where admin enters total amount

But it BREAKS when:
- Player pre-marks specific sessions via the UI (using "I've Paid" button)
- Admin then confirms that specific amount
- System confirms different sessions than what the player marked

**The Logic Should Be**:
When confirming a payment, **prioritize `pending_confirmation` sessions first**, then fall back to `unpaid` sessions if there's extra money. This ensures that sessions the player explicitly marked get confirmed first.

---

## Recommended Fix

### Fix for Bug #1: Prioritize `pending_confirmation` Sessions

**File to modify**: `coaching_payment_restructure.sql` (or create new migration)

**Change the ORDER BY clause** in the `admin_confirm_payment` function:

```sql
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
    -- ✅ Prioritize pending_confirmation over unpaid
    CASE ca2.payment_status
      WHEN 'pending_confirmation' THEN 1
      WHEN 'unpaid' THEN 2
    END,
    -- Then order by oldest session first
    cs.session_date ASC
  LIMIT v_sessions_to_confirm
);
```

**What This Does**:
1. First selects all `pending_confirmation` sessions (oldest first)
2. Then selects `unpaid` sessions (oldest first) if more payment needs to be allocated
3. Ensures that sessions the player explicitly marked get confirmed first

---

## Migration Script

Create: `supabase/migrations/fix_admin_confirm_payment_priority.sql`

```sql
-- ============================================
-- FIX: admin_confirm_payment should prioritize pending_confirmation sessions
-- Date: 2025-11-13
-- Bug: When admin confirms payment, wrong sessions get marked as paid
-- ============================================

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
      CASE ca2.payment_status
        WHEN 'pending_confirmation' THEN 1
        WHEN 'unpaid' THEN 2
      END,
      -- Then by oldest session first
      cs.session_date ASC
    LIMIT v_sessions_to_confirm
  );

  RETURN QUERY SELECT
    v_sessions_to_confirm,
    v_amount_allocated,
    p_amount - v_amount_allocated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION admin_confirm_payment IS 'Confirms payment received from player, prioritizes pending_confirmation sessions, then auto-allocates to oldest unpaid sessions';

-- Grant permissions
GRANT EXECUTE ON FUNCTION admin_confirm_payment TO authenticated;

-- Success message
SELECT '✅ Fixed: admin_confirm_payment now prioritizes pending_confirmation sessions' as status;
```

---

## Testing Plan

### Test Case 1: Partial Payment (Primary Bug)
**Setup**:
1. Create player with 5 unpaid sessions (dates: Jan 1, Feb 1, Mar 1, Apr 1, May 1)
2. Player marks Mar 1 and Apr 1 as paid (£8) → 2 sessions become `pending_confirmation`

**Test**: Admin confirms £8 payment

**Expected Result**:
- Mar 1 session: `paid` ✓
- Apr 1 session: `paid` ✓
- Jan 1, Feb 1, May 1: `unpaid` ✓

**Before Fix (WRONG)**:
- Jan 1 session: `paid` ❌ (oldest unpaid)
- Feb 1 session: `paid` ❌ (second oldest unpaid)
- Mar 1, Apr 1: `pending_confirmation` ❌ (still pending!)
- May 1: `unpaid` ✓

### Test Case 2: Overpayment
**Setup**:
1. Player has 5 unpaid sessions
2. Player marks 2 sessions as paid (£8) → `pending_confirmation`

**Test**: Admin confirms £16 payment (more than marked)

**Expected Result**:
- 2 pending_confirmation sessions: `paid` ✓ (marked sessions confirmed first)
- 2 oldest unpaid sessions: `paid` ✓ (remaining £8 allocated to oldest unpaid)
- 1 unpaid session: `unpaid` ✓

### Test Case 3: Full Payment
**Setup**:
1. Player has 3 unpaid sessions
2. Player doesn't mark any sessions (all remain `unpaid`)

**Test**: Admin confirms £12 payment

**Expected Result**:
- All 3 sessions: `paid` ✓

---

## Deployment Instructions

1. **Review the fix**:
   - Review the migration script above
   - Test in a staging environment if available

2. **Deploy to Supabase**:
   ```bash
   # Option A: Via Supabase Dashboard
   # - Go to SQL Editor
   # - Copy the migration script
   # - Run it

   # Option B: Via Supabase CLI
   # Save as: supabase/migrations/YYYYMMDDHHMMSS_fix_admin_confirm_payment_priority.sql
   # Then push to Supabase
   ```

3. **Verify deployment**:
   ```sql
   -- Check if function has correct parameters
   SELECT routine_name, routine_definition
   FROM information_schema.routines
   WHERE routine_name = 'admin_confirm_payment';

   -- Look for "CASE ca2.payment_status" in the definition
   ```

4. **Test with real data**:
   - Use Michael Brennan's case or similar scenario
   - Mark sessions as paid
   - Confirm payment via admin UI
   - Verify correct sessions are marked as paid

---

## Additional Recommendations

### 1. UI Enhancement: Show Which Sessions Are Pending
In `PlayerPaymentModal.js`, consider highlighting which sessions are in `pending_confirmation` vs `unpaid` to make it clearer for admins.

### 2. Admin Confirmation Message
When admin confirms a payment, show which specific sessions were marked as paid:
```javascript
// In PlayerPaymentModal.js handleConfirmByAmount
success(
  `Confirmed £${amountAllocated.toFixed(2)} for ${sessionsConfirmed} session(s):` +
  `\n- ${pendingConfirmedCount} pending sessions` +
  `\n- ${unpaidConfirmedCount} unpaid sessions` +
  (remaining > 0 ? `\n£${remaining.toFixed(2)} remaining` : '')
);
```

### 3. Payment Audit Log
Consider adding a `payment_audit_log` table to track:
- When sessions change status
- Which admin confirmed them
- What amount was entered
- What sessions were affected

This would help diagnose issues like this in the future.

---

## Conclusion

**Primary Bug**: `admin_confirm_payment` doesn't prioritize `pending_confirmation` sessions, causing wrong sessions to be marked as paid when players pre-mark their payments.

**Fix**: Change ORDER BY clause to prioritize `pending_confirmation` over `unpaid` sessions.

**Impact**: Critical for partial payment accuracy. Without this fix, the payment tracking system will continue to show incorrect amounts owed/pending/paid.

**Status**: Fix ready to deploy. Migration script provided above.

---

**Report by**: Claude Code
**Investigation Date**: 2025-11-13
**Files Analyzed**:
- `coaching_payment_restructure.sql`
- `fix_payment_reminder_session_based.sql`
- `src/components/Coaching/Modals/PlayerPaymentModal.js`
- `src/hooks/useCoaching.js`
