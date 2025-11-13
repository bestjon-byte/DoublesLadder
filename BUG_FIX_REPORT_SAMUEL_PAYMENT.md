# Bug Fix Report: Player Cannot Mark Sessions as Paid

**Date**: 2025-11-12
**Reporter**: Jon (Samuel Best's father)
**Affected User**: Samuel Best (swb12@icloud.com)
**Player ID**: `b456cc6f-a808-46dd-94e2-dd0817147501`

---

## Bug Description

When Samuel Best logs in and tries to mark his unpaid coaching session (6 Nov beginners) as paid, he receives an error:

> "Failed to mark session as paid"

---

## Root Cause Analysis

### Investigation Steps

1. **Checked code flow**:
   - User clicks "Mark as Paid" → `CoachingUserTab.js:handleMarkSessionsPaid()` (line 78)
   - Calls `coaching.actions.playerMarkSessionsPaid()` → `useCoaching.js:playerMarkSessionsPaid()` (line 587)
   - Executes RPC function `player_mark_sessions_paid` in database

2. **Verified RPC function exists**:
   - Function defined in `coaching_payment_restructure.sql` (line 23-50)
   - Function is marked `SECURITY DEFINER`
   - Grants exist: `GRANT EXECUTE ON FUNCTION player_mark_sessions_paid TO authenticated` (line 252)

3. **Checked database records**:
   - Samuel Best's profile found: `b456cc6f-a808-46dd-94e2-dd0817147501`
   - Query for his coaching_attendance records returned empty array via API

4. **Identified RLS policy gap**:
   - File: `coaching_schema.sql` (lines 256-301)
   - Policies found:
     - ✅ `coaching_attendance_player_select` - Players can SELECT
     - ✅ `coaching_attendance_player_insert_own` - Players can INSERT own
     - ✅ `coaching_attendance_player_delete_own` - Players can DELETE own
     - ❌ **MISSING**: No UPDATE policy for players!

### The Problem

The `player_mark_sessions_paid` RPC function attempts to UPDATE the `coaching_attendance` table:

```sql
UPDATE coaching_attendance
SET
  payment_status = 'pending_confirmation',
  user_marked_paid_at = NOW(),
  user_payment_note = p_note
WHERE coaching_attendance.id = ANY(p_attendance_ids)
  AND player_id = p_player_id
  AND payment_status = 'unpaid'
```

Even though the function is `SECURITY DEFINER`, Supabase's RLS policies still apply. Without an UPDATE policy allowing players to modify their attendance records, the UPDATE statement fails silently (returns 0 rows affected), causing the error message.

---

## Solution

**TWO fixes are required** (both SQL files created):

### Fix 1: Add Missing RLS UPDATE Policy

**File**: `fix_player_mark_payment_rls.sql`

This migration adds a new RLS policy to allow players to update their attendance records:

```sql
CREATE POLICY coaching_attendance_player_update_payment ON coaching_attendance
  FOR UPDATE
  TO authenticated
  USING (
    -- Can only update their own records
    player_id = auth.uid()
    AND EXISTS (
      -- Must have coaching access
      SELECT 1 FROM coaching_access
      WHERE coaching_access.player_id = auth.uid()
      AND coaching_access.revoked_at IS NULL
    )
  )
  WITH CHECK (
    -- Can only update their own records
    player_id = auth.uid()
  );
```

### Fix 2: Resolve Ambiguous Column References

**File**: `fix_player_mark_payment_ambiguous_columns.sql`

**Console Error Discovered**: `column reference "payment_status" is ambiguous`

The `player_mark_sessions_paid` function has ambiguous column names. The RETURNS TABLE declares columns (`payment_status`, etc.) that match table column names, causing PostgreSQL to not know which one you're referring to in the WHERE and SET clauses.

The fix fully qualifies all column references:

```sql
-- BEFORE (ambiguous):
WHERE ... AND payment_status = 'unpaid'

-- AFTER (explicit):
WHERE ... AND coaching_attendance.payment_status = 'unpaid'
```

### Security Notes

This policy ensures:
- ✅ Players can only update their own attendance records (`player_id = auth.uid()`)
- ✅ Players must have active coaching access
- ✅ The actual field restrictions (only updating payment fields) are enforced by the RPC function logic
- ✅ Status transitions (unpaid → pending_confirmation) are enforced by the RPC function WHERE clause

---

## How to Apply the Fix

**IMPORTANT: Both SQL files must be run in order!**

### Option 1: Supabase Dashboard (Recommended)

**Step 1: Apply RLS Policy Fix**
1. Go to: https://supabase.com/dashboard/project/hwpjrkmplydqaxiikupv/sql
2. Open `fix_player_mark_payment_rls.sql` in this repository
3. Copy the entire SQL content
4. Paste into the SQL Editor
5. Click "Run" to execute
6. Verify: Check the output shows the policy was created successfully

**Step 2: Apply Function Fix**
1. Still in the SQL Editor
2. Open `fix_player_mark_payment_ambiguous_columns.sql` in this repository
3. Copy the entire SQL content
4. Paste into the SQL Editor (you can clear the previous query)
5. Click "Run" to execute
6. Verify: Check the output shows "CREATE FUNCTION" was successful

### Option 2: Using psql (if you have direct access)

```bash
# Apply both fixes in order
psql "$DATABASE_URL" < fix_player_mark_payment_rls.sql
psql "$DATABASE_URL" < fix_player_mark_payment_ambiguous_columns.sql
```

---

## Testing the Fix

After applying the migration:

1. **Have Samuel test directly**:
   - Log in as Samuel Best
   - Go to Coaching → Payments tab
   - Select the unpaid session (6 Nov)
   - Click "Mark as Paid"
   - Should see success message: "Marked X session(s) as paid - awaiting admin confirmation"

2. **Verify in database**:
   ```sql
   SELECT id, payment_status, user_marked_paid_at, user_payment_note
   FROM coaching_attendance
   WHERE player_id = 'b456cc6f-a808-46dd-94e2-dd0817147501'
     AND payment_status = 'pending_confirmation';
   ```
   Should return the updated record(s).

---

## Impact

- **Affected users**: ALL players who have tried to mark sessions as paid
- **Severity**: HIGH - Core payment functionality broken for all non-admin users
- **Scope**: This affects any player using the "Mark as Paid" feature in the Coaching portal

### Likely Other Affected Users

Any player who tried to mark sessions as paid since the payment restructure was deployed would have experienced this bug.

---

## Related Files

- **Bug fixes** (NEW):
  - `fix_player_mark_payment_rls.sql` - Adds missing UPDATE policy
  - `fix_player_mark_payment_ambiguous_columns.sql` - Fixes ambiguous column references
- **Original schema**: `coaching_schema.sql` (lines 256-301)
- **Payment system**: `coaching_payment_restructure.sql` (line 23-52)
- **Frontend code**:
  - `src/components/Coaching/CoachingUserTab.js` (line 78-101)
  - `src/hooks/useCoaching.js` (line 587-603)

---

## Recommendations

1. **Apply fix immediately** - This is blocking all players from marking payments
2. **Review all RLS policies** - Check if other tables have similar gaps
3. **Add integration tests** - Test RLS policies with non-admin users
4. **Consider notifications** - Let players know if their previous payment attempts failed

---

## Status

- [x] Root cause identified (2 issues found)
- [x] Fix #1 created: RLS policy for UPDATE
- [x] Fix #2 created: Ambiguous column references resolved
- [ ] **Both migrations applied to production** ← NEEDS TO BE DONE
  - [ ] Run fix_player_mark_payment_rls.sql
  - [ ] Run fix_player_mark_payment_ambiguous_columns.sql
- [ ] Fix verified with Samuel Best
- [ ] Consider notifying other affected users
