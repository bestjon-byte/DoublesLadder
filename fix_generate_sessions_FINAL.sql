-- ============================================================================
-- FINAL FIX: Generate Coaching Sessions with Custom Start Date
-- ============================================================================
-- This fixes the column ambiguity issue by using distinct output parameter names
-- that don't conflict with table column names.
--
-- Key changes from previous attempts:
-- 1. Output columns renamed: out_session_id, out_type, out_date, out_time
-- 2. All variables use v_ prefix for clarity
-- 3. Supports custom start_from_date parameter (optional)
-- 4. Defaults to CURRENT_DATE if start_from_date is NULL
-- ============================================================================

-- Drop any existing versions of this function
DROP FUNCTION IF EXISTS generate_coaching_sessions(INTEGER, DATE);
DROP FUNCTION IF EXISTS generate_coaching_sessions(INTEGER);

-- Create the new function with proper naming to avoid ambiguity
CREATE OR REPLACE FUNCTION generate_coaching_sessions(
  weeks_ahead INTEGER DEFAULT 4,
  start_from_date DATE DEFAULT NULL
)
RETURNS TABLE (
  out_session_id UUID,
  out_type VARCHAR,
  out_date DATE,
  out_time TIME
) AS $$
DECLARE
  v_schedule RECORD;
  v_target_date DATE;
  v_days_until_target INTEGER;
  v_week_offset INTEGER;
  v_base_date DATE;
  v_end_date DATE;
BEGIN
  -- Use provided start date or default to current date
  v_base_date := COALESCE(start_from_date, CURRENT_DATE);
  v_end_date := v_base_date + (weeks_ahead * 7);

  -- Loop through active schedules
  FOR v_schedule IN
    SELECT * FROM coaching_schedules
    WHERE is_active = true
  LOOP
    -- Generate sessions for the next N weeks
    FOR v_week_offset IN 0..weeks_ahead-1 LOOP
      -- Calculate next occurrence of this day of week from the base date
      v_days_until_target := (v_schedule.day_of_week - EXTRACT(DOW FROM v_base_date)::INTEGER + 7) % 7;

      -- Special handling for first occurrence:
      -- If it's the same day and using current date (not custom), check if time has passed
      IF v_days_until_target = 0 AND v_week_offset = 0 THEN
        IF start_from_date IS NULL AND CURRENT_TIME > v_schedule.session_time THEN
          -- Time has passed today, schedule for next week instead
          v_days_until_target := 7;
        END IF;
      END IF;

      v_target_date := v_base_date + v_days_until_target + (v_week_offset * 7);

      -- Insert session (ignore if already exists due to unique constraint)
      INSERT INTO coaching_sessions (
        schedule_id,
        session_date,
        session_time,
        session_type,
        status,
        created_by
      )
      VALUES (
        v_schedule.id,
        v_target_date,
        v_schedule.session_time,
        v_schedule.session_type,
        'scheduled',
        v_schedule.created_by
      )
      ON CONFLICT (session_date, session_time, session_type) DO NOTHING;

    END LOOP;
  END LOOP;

  -- Return all scheduled sessions in the generated range
  -- Using different column names in RETURNS TABLE eliminates ambiguity
  RETURN QUERY
  SELECT
    cs.id AS out_session_id,
    cs.session_type AS out_type,
    cs.session_date AS out_date,
    cs.session_time AS out_time
  FROM coaching_sessions cs
  WHERE cs.session_date >= v_base_date
    AND cs.session_date < v_end_date
    AND cs.status = 'scheduled'
  ORDER BY cs.session_date, cs.session_time;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION generate_coaching_sessions IS 'Auto-generates coaching sessions from active schedules with optional custom start date';

-- ============================================================================
-- Verification Query (uncomment to test)
-- ============================================================================
-- SELECT * FROM generate_coaching_sessions(4, '2025-11-11');
-- SELECT * FROM generate_coaching_sessions(4); -- Uses CURRENT_DATE
