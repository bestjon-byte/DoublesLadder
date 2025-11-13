-- ============================================================================
-- MIGRATION: Remove Coaching Access Control
-- ============================================================================
-- Purpose: Open coaching features to all authenticated users
-- Date: 2025-11-13
--
-- Changes:
-- 1. Drop coaching_access table (no longer needed)
-- 2. Replace access-checking RLS policies with simpler authenticated-only policies
-- 3. Result: All authenticated users can access coaching features
-- ============================================================================

-- ============================================================================
-- STEP 1: DROP OLD RLS POLICIES (that check coaching_access table)
-- ============================================================================

-- Drop old schedule policies that check coaching_access
DROP POLICY IF EXISTS coaching_schedules_player_select ON coaching_schedules;

-- Drop old session policies that check coaching_access
DROP POLICY IF EXISTS coaching_sessions_player_select ON coaching_sessions;

-- Drop old attendance policies that check coaching_access
DROP POLICY IF EXISTS coaching_attendance_player_select ON coaching_attendance;
DROP POLICY IF EXISTS coaching_attendance_player_insert_own ON coaching_attendance;
DROP POLICY IF EXISTS coaching_attendance_player_delete_own ON coaching_attendance;

-- Drop access table policies (table will be dropped next)
DROP POLICY IF EXISTS coaching_access_admin_all ON coaching_access;
DROP POLICY IF EXISTS coaching_access_player_select_own ON coaching_access;

-- ============================================================================
-- STEP 2: DROP coaching_access TABLE
-- ============================================================================

DROP TABLE IF EXISTS coaching_access CASCADE;

-- ============================================================================
-- STEP 3: CREATE NEW SIMPLIFIED RLS POLICIES (all authenticated users)
-- ============================================================================

-- SCHEDULES: All authenticated users can view active schedules
CREATE POLICY coaching_schedules_authenticated_select ON coaching_schedules
  FOR SELECT
  TO authenticated
  USING (is_active = true);

COMMENT ON POLICY coaching_schedules_authenticated_select ON coaching_schedules IS
  'All authenticated users can view active coaching schedules';

-- SESSIONS: All authenticated users can view sessions
CREATE POLICY coaching_sessions_authenticated_select ON coaching_sessions
  FOR SELECT
  TO authenticated
  USING (true);

COMMENT ON POLICY coaching_sessions_authenticated_select ON coaching_sessions IS
  'All authenticated users can view coaching sessions';

-- ATTENDANCE: All authenticated users can view attendance records
CREATE POLICY coaching_attendance_authenticated_select ON coaching_attendance
  FOR SELECT
  TO authenticated
  USING (true);

COMMENT ON POLICY coaching_attendance_authenticated_select ON coaching_attendance IS
  'All authenticated users can view coaching attendance';

-- ATTENDANCE: Users can register themselves for sessions
CREATE POLICY coaching_attendance_user_insert_own ON coaching_attendance
  FOR INSERT
  TO authenticated
  WITH CHECK (
    player_id = auth.uid()
    AND marked_by = auth.uid()
    AND self_registered = true
  );

COMMENT ON POLICY coaching_attendance_user_insert_own ON coaching_attendance IS
  'Users can self-register for coaching sessions';

-- ATTENDANCE: Users can unregister themselves (delete own attendance)
CREATE POLICY coaching_attendance_user_delete_own ON coaching_attendance
  FOR DELETE
  TO authenticated
  USING (
    player_id = auth.uid()
    AND self_registered = true
  );

COMMENT ON POLICY coaching_attendance_user_delete_own ON coaching_attendance IS
  'Users can cancel their own self-registered attendance';

-- ============================================================================
-- STEP 4: RECORD MIGRATION
-- ============================================================================

INSERT INTO schema_versions (version, description) VALUES
  ('1.1.0-coaching', 'Removed coaching access control - open to all authenticated users');

-- ============================================================================
-- VERIFICATION QUERIES (Run these after migration to verify)
-- ============================================================================

-- Verify coaching_access table is gone
-- SELECT * FROM coaching_access; -- Should error with "relation does not exist"

-- Verify new policies exist
-- SELECT schemaname, tablename, policyname
-- FROM pg_policies
-- WHERE tablename IN ('coaching_schedules', 'coaching_sessions', 'coaching_attendance')
-- ORDER BY tablename, policyname;

-- Expected policies after migration:
-- coaching_attendance:
--   - coaching_attendance_admin_all (unchanged)
--   - coaching_attendance_authenticated_select (NEW)
--   - coaching_attendance_user_insert_own (NEW)
--   - coaching_attendance_user_delete_own (NEW)
-- coaching_schedules:
--   - coaching_schedules_admin_all (unchanged)
--   - coaching_schedules_authenticated_select (NEW)
-- coaching_sessions:
--   - coaching_sessions_admin_all (unchanged)
--   - coaching_sessions_authenticated_select (NEW)

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
