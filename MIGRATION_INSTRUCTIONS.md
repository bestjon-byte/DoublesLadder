# Database Migration Instructions

## Remove Coaching Access Control Migration

**Migration File**: `migrations/remove_coaching_access_control.sql`

### Steps to Apply Migration

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard/project/hwpjrkmplydqaxiikupv
   - Navigate to: SQL Editor

2. **Backup Current Data (Optional but Recommended)**
   ```sql
   -- Export coaching_access data for records
   SELECT * FROM coaching_access ORDER BY granted_at DESC;
   ```
   - Save the results if you want to keep a record of who had access

3. **Run the Migration**
   - Copy the entire contents of `migrations/remove_coaching_access_control.sql`
   - Paste into Supabase SQL Editor
   - Click "Run" or press Cmd/Ctrl + Enter

4. **Verify Migration Success**
   ```sql
   -- This should error with "relation does not exist"
   SELECT * FROM coaching_access;

   -- This should show the new policies
   SELECT schemaname, tablename, policyname
   FROM pg_policies
   WHERE tablename IN ('coaching_schedules', 'coaching_sessions', 'coaching_attendance')
   ORDER BY tablename, policyname;
   ```

### Expected Results

After migration, you should see these policies:

**coaching_schedules:**
- `coaching_schedules_admin_all` (unchanged)
- `coaching_schedules_authenticated_select` (NEW - replaces player_select)

**coaching_sessions:**
- `coaching_sessions_admin_all` (unchanged)
- `coaching_sessions_authenticated_select` (NEW - replaces player_select)

**coaching_attendance:**
- `coaching_attendance_admin_all` (unchanged)
- `coaching_attendance_authenticated_select` (NEW - replaces player_select)
- `coaching_attendance_user_insert_own` (NEW - replaces player_insert_own)
- `coaching_attendance_user_delete_own` (unchanged)

### What This Changes

- ✅ **Removes** `coaching_access` table
- ✅ **Removes** 7 old RLS policies that checked access
- ✅ **Creates** 6 new simplified RLS policies
- ✅ **Opens** coaching features to all authenticated users

### Rollback (If Needed)

If something goes wrong, you can restore from backup:
1. Re-create `coaching_access` table from `coaching_schema.sql` (lines 65-84)
2. Re-create old RLS policies from `coaching_schema.sql` (old version)
3. Redeploy old frontend code

---

**Status**: Ready to apply ✅
**Last Updated**: 2025-11-13
