-- ============================================================================
-- COACHING ATTENDANCE SYSTEM - DATABASE MIGRATION
-- ============================================================================
-- This migration adds support for:
-- - Junior player profiles with parent contact details
-- - Schedule enrollment (which players attend which recurring sessions)
-- - Session-level pricing (different costs for different session types)
-- - Coach role enhancements
-- ============================================================================

-- ============================================================================
-- 1. UPDATE PROFILES TABLE - Add junior/parent fields
-- ============================================================================

-- Add is_junior flag to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_junior BOOLEAN DEFAULT false;

-- Add parent contact fields for juniors
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS parent_name TEXT;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS parent_email TEXT;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS parent_phone TEXT;

-- Index for filtering juniors
CREATE INDEX IF NOT EXISTS idx_profiles_is_junior ON profiles(is_junior) WHERE is_junior = true;

COMMENT ON COLUMN profiles.is_junior IS 'True for junior players (children)';
COMMENT ON COLUMN profiles.parent_name IS 'Parent/guardian name for junior players';
COMMENT ON COLUMN profiles.parent_email IS 'Parent/guardian email for junior players';
COMMENT ON COLUMN profiles.parent_phone IS 'Parent/guardian phone for junior players';

-- ============================================================================
-- 2. UPDATE COACHING_SCHEDULES TABLE - Add name and pricing
-- ============================================================================

-- Add schedule_name for human-readable identification
ALTER TABLE coaching_schedules
ADD COLUMN IF NOT EXISTS schedule_name TEXT;

-- Add session_cost for pricing (defaults to £4.00 for backwards compatibility)
ALTER TABLE coaching_schedules
ADD COLUMN IF NOT EXISTS session_cost DECIMAL(10, 2) DEFAULT 4.00;

-- Add is_junior_session flag for filtering
ALTER TABLE coaching_schedules
ADD COLUMN IF NOT EXISTS is_junior_session BOOLEAN DEFAULT false;

-- Update the session_type constraint to include 'Juniors'
ALTER TABLE coaching_schedules
DROP CONSTRAINT IF EXISTS coaching_schedules_session_type_check;

ALTER TABLE coaching_schedules
ADD CONSTRAINT coaching_schedules_session_type_check
CHECK (session_type IN ('Adults', 'Beginners', 'Juniors'));

COMMENT ON COLUMN coaching_schedules.schedule_name IS 'Human-readable name like "Under 10s" or "Adult Improvers"';
COMMENT ON COLUMN coaching_schedules.session_cost IS 'Cost per session in GBP (0.00 for free sessions)';
COMMENT ON COLUMN coaching_schedules.is_junior_session IS 'True if this schedule is for junior players';

-- ============================================================================
-- 3. UPDATE COACHING_SESSIONS TABLE - Add session cost
-- ============================================================================

-- Add session_cost (inherited from schedule, can be overridden)
ALTER TABLE coaching_sessions
ADD COLUMN IF NOT EXISTS session_cost DECIMAL(10, 2);

-- Update the session_type constraint to include 'Juniors'
ALTER TABLE coaching_sessions
DROP CONSTRAINT IF EXISTS coaching_sessions_session_type_check;

ALTER TABLE coaching_sessions
ADD CONSTRAINT coaching_sessions_session_type_check
CHECK (session_type IN ('Adults', 'Beginners', 'Juniors'));

COMMENT ON COLUMN coaching_sessions.session_cost IS 'Cost for this session (inherited from schedule, can override)';

-- ============================================================================
-- 4. CREATE COACHING_SCHEDULE_ENROLLMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS coaching_schedule_enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_id UUID NOT NULL REFERENCES coaching_schedules(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  enrolled_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,

  UNIQUE(schedule_id, player_id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_schedule_enrollments_schedule ON coaching_schedule_enrollments(schedule_id);
CREATE INDEX IF NOT EXISTS idx_schedule_enrollments_player ON coaching_schedule_enrollments(player_id);
CREATE INDEX IF NOT EXISTS idx_schedule_enrollments_active ON coaching_schedule_enrollments(schedule_id, is_active) WHERE is_active = true;

COMMENT ON TABLE coaching_schedule_enrollments IS 'Links players to their enrolled coaching schedules';
COMMENT ON COLUMN coaching_schedule_enrollments.is_active IS 'False to un-enroll without deleting history';
COMMENT ON COLUMN coaching_schedule_enrollments.enrolled_by IS 'Admin who enrolled the player';

-- ============================================================================
-- 5. RLS POLICIES FOR COACHING_SCHEDULE_ENROLLMENTS
-- ============================================================================

ALTER TABLE coaching_schedule_enrollments ENABLE ROW LEVEL SECURITY;

-- Admins can do everything with enrollments
CREATE POLICY coaching_schedule_enrollments_admin_all ON coaching_schedule_enrollments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Coaches can view enrollments (needed for register)
CREATE POLICY coaching_schedule_enrollments_coach_select ON coaching_schedule_enrollments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'coach'
    )
  );

-- Players can view their own enrollments
CREATE POLICY coaching_schedule_enrollments_player_select_own ON coaching_schedule_enrollments
  FOR SELECT
  TO authenticated
  USING (player_id = auth.uid());

-- ============================================================================
-- 6. UPDATE SESSION GENERATION TO INCLUDE COST
-- ============================================================================

-- Update the generate_coaching_sessions function to copy session_cost
CREATE OR REPLACE FUNCTION generate_coaching_sessions(
  weeks_ahead INTEGER DEFAULT 4,
  start_from_date DATE DEFAULT NULL,
  schedule_ids UUID[] DEFAULT NULL
)
RETURNS TABLE (
  session_id UUID,
  session_type VARCHAR,
  session_date DATE,
  session_time TIME
) AS $$
DECLARE
  schedule RECORD;
  target_date DATE;
  days_until_target INTEGER;
  week_offset INTEGER;
  base_date DATE;
BEGIN
  -- Use provided start date or current date
  base_date := COALESCE(start_from_date, CURRENT_DATE);

  -- Loop through active schedules
  FOR schedule IN
    SELECT * FROM coaching_schedules
    WHERE is_active = true
    AND (schedule_ids IS NULL OR id = ANY(schedule_ids))
  LOOP
    -- Generate sessions for the next N weeks
    FOR week_offset IN 0..weeks_ahead-1 LOOP
      -- Calculate next occurrence of this day of week
      days_until_target := (schedule.day_of_week - EXTRACT(DOW FROM base_date)::INTEGER + 7) % 7;
      IF days_until_target = 0 AND week_offset = 0 AND base_date = CURRENT_DATE AND CURRENT_TIME > schedule.session_time THEN
        days_until_target := 7; -- If today but time passed, schedule for next week
      END IF;
      target_date := base_date + days_until_target + (week_offset * 7);

      -- Only create if doesn't already exist
      INSERT INTO coaching_sessions (
        schedule_id,
        session_date,
        session_time,
        session_type,
        session_cost,
        status,
        created_by
      )
      VALUES (
        schedule.id,
        target_date,
        schedule.session_time,
        schedule.session_type,
        schedule.session_cost,  -- Copy cost from schedule
        'scheduled',
        schedule.created_by
      )
      ON CONFLICT (session_date, session_time, session_type) DO NOTHING
      RETURNING id, coaching_sessions.session_type, coaching_sessions.session_date, coaching_sessions.session_time
      INTO session_id, session_type, session_date, session_time;

      IF session_id IS NOT NULL THEN
        RETURN NEXT;
      END IF;
    END LOOP;
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. HELPER FUNCTIONS FOR ENROLLMENT
-- ============================================================================

-- Function to get enrolled players for a schedule
CREATE OR REPLACE FUNCTION get_schedule_enrolled_players(p_schedule_id UUID)
RETURNS TABLE (
  player_id UUID,
  player_name TEXT,
  is_junior BOOLEAN,
  enrolled_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    COALESCE(p.is_junior, false),
    cse.enrolled_at
  FROM coaching_schedule_enrollments cse
  JOIN profiles p ON p.id = cse.player_id
  WHERE cse.schedule_id = p_schedule_id
  AND cse.is_active = true
  ORDER BY p.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_schedule_enrolled_players IS 'Returns all active enrolled players for a schedule';

-- Function to get enrolled players for a session (via its schedule)
CREATE OR REPLACE FUNCTION get_session_enrolled_players(p_session_id UUID)
RETURNS TABLE (
  player_id UUID,
  player_name TEXT,
  is_junior BOOLEAN,
  has_attended BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    COALESCE(p.is_junior, false),
    EXISTS (
      SELECT 1 FROM coaching_attendance ca
      WHERE ca.session_id = p_session_id
      AND ca.player_id = p.id
    ) as has_attended
  FROM coaching_sessions cs
  JOIN coaching_schedule_enrollments cse ON cse.schedule_id = cs.schedule_id
  JOIN profiles p ON p.id = cse.player_id
  WHERE cs.id = p_session_id
  AND cse.is_active = true
  ORDER BY p.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_session_enrolled_players IS 'Returns enrolled players for a session with attendance status';

-- ============================================================================
-- 8. UPDATE RLS FOR COACH ROLE
-- ============================================================================

-- Coaches can view all sessions (needed for dashboard)
DROP POLICY IF EXISTS coaching_sessions_coach_select ON coaching_sessions;
CREATE POLICY coaching_sessions_coach_select ON coaching_sessions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'coach'
    )
  );

-- Coaches can view all attendance records (needed for register)
DROP POLICY IF EXISTS coaching_attendance_coach_select ON coaching_attendance;
CREATE POLICY coaching_attendance_coach_select ON coaching_attendance
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'coach'
    )
  );

-- Coaches can INSERT attendance records (marking register)
DROP POLICY IF EXISTS coaching_attendance_coach_insert ON coaching_attendance;
CREATE POLICY coaching_attendance_coach_insert ON coaching_attendance
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'coach'
    )
  );

-- Coaches can DELETE attendance records (unmarking from register)
DROP POLICY IF EXISTS coaching_attendance_coach_delete ON coaching_attendance;
CREATE POLICY coaching_attendance_coach_delete ON coaching_attendance
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'coach'
    )
  );

-- Coaches can view schedules
DROP POLICY IF EXISTS coaching_schedules_coach_select ON coaching_schedules;
CREATE POLICY coaching_schedules_coach_select ON coaching_schedules
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'coach'
    )
  );

-- Coaches can view profiles (needed to see player names in register)
-- Note: This may already exist, using IF NOT EXISTS pattern
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'profiles_coach_select'
    AND tablename = 'profiles'
  ) THEN
    CREATE POLICY profiles_coach_select ON profiles
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid()
          AND p.role = 'coach'
        )
      );
  END IF;
END $$;

-- ============================================================================
-- 9. ATTENDANCE PAYMENT STATUS HANDLING FOR FREE SESSIONS
-- ============================================================================

-- Function to mark attendance with proper payment status based on session cost
CREATE OR REPLACE FUNCTION mark_attendance_with_payment_status(
  p_session_id UUID,
  p_player_id UUID,
  p_marked_by UUID,
  p_self_registered BOOLEAN DEFAULT false
)
RETURNS coaching_attendance AS $$
DECLARE
  v_session_cost DECIMAL(10,2);
  v_payment_status TEXT;
  v_result coaching_attendance;
BEGIN
  -- Get session cost
  SELECT COALESCE(session_cost, 4.00) INTO v_session_cost
  FROM coaching_sessions
  WHERE id = p_session_id;

  -- Determine payment status: free sessions are auto-marked as paid
  IF v_session_cost = 0 OR v_session_cost IS NULL THEN
    v_payment_status := 'paid';
  ELSE
    v_payment_status := 'unpaid';
  END IF;

  -- Insert attendance record
  INSERT INTO coaching_attendance (
    session_id,
    player_id,
    marked_by,
    self_registered,
    payment_status
  )
  VALUES (
    p_session_id,
    p_player_id,
    p_marked_by,
    p_self_registered,
    v_payment_status
  )
  ON CONFLICT (session_id, player_id) DO UPDATE
  SET marked_by = p_marked_by,
      self_registered = p_self_registered
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION mark_attendance_with_payment_status IS 'Marks attendance and sets payment_status based on session cost (free=paid, paid=unpaid)';

-- ============================================================================
-- 10. SCHEMA VERSION
-- ============================================================================

INSERT INTO schema_versions (version, description) VALUES
  ('2.0.0-coaching-attendance', 'Added junior profiles, schedule enrollments, session pricing, and coach role enhancements');

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
