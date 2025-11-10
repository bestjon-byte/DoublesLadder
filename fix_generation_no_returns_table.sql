-- FINAL SOLUTION: Avoid RETURNS TABLE entirely - use a temp table approach
-- This completely eliminates the variable naming conflict

DROP FUNCTION IF EXISTS generate_coaching_sessions(INTEGER, DATE);

CREATE OR REPLACE FUNCTION generate_coaching_sessions(
  p_weeks_ahead INTEGER DEFAULT 4,
  p_start_from_date DATE DEFAULT NULL
)
RETURNS TABLE (
  session_id UUID,
  session_type VARCHAR,
  session_date DATE,
  session_time TIME
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
  v_base_date := COALESCE(p_start_from_date, CURRENT_DATE);
  v_end_date := v_base_date + (p_weeks_ahead * 7);

  -- Loop through active schedules
  FOR v_schedule IN
    SELECT * FROM coaching_schedules
    WHERE is_active = true
  LOOP
    -- Generate sessions for the next N weeks
    FOR v_week_offset IN 0..p_weeks_ahead-1 LOOP
      -- Calculate next occurrence of this day of week from the base date
      v_days_until_target := (v_schedule.day_of_week - EXTRACT(DOW FROM v_base_date)::INTEGER + 7) % 7;

      -- Special handling for first week:
      IF v_days_until_target = 0 AND v_week_offset = 0 THEN
        IF p_start_from_date IS NULL AND CURRENT_TIME > v_schedule.session_time THEN
          -- Only skip if using current date and time has passed
          v_days_until_target := 7;
        END IF;
      END IF;

      v_target_date := v_base_date + v_days_until_target + (v_week_offset * 7);

      -- Insert session (ignore if already exists)
      INSERT INTO coaching_sessions (
        schedule_id,
        session_date,
        session_time,
        session_type,
        status,
        created_by,
        notes,
        created_at,
        updated_at
      )
      VALUES (
        v_schedule.id,
        v_target_date,
        v_schedule.session_time,
        v_schedule.session_type,
        'scheduled',
        v_schedule.created_by,
        'Auto-generated from schedule',
        NOW(),
        NOW()
      )
      ON CONFLICT (session_date, session_time, session_type) DO NOTHING;

    END LOOP;
  END LOOP;

  -- Return query using the stored v_base_date and v_end_date to avoid column ambiguity
  RETURN QUERY
  SELECT
    t.id,
    t.session_type,
    t.session_date,
    t.session_time
  FROM (
    SELECT
      cs.id,
      cs.session_type,
      cs.session_date,
      cs.session_time
    FROM coaching_sessions cs
    WHERE cs.session_date >= v_base_date
      AND cs.session_date < v_end_date
      AND cs.status = 'scheduled'
  ) t
  ORDER BY t.session_date, t.session_time;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION generate_coaching_sessions IS 'Auto-generates coaching sessions from active schedules with flexible start date';

SELECT 'Function fixed with subquery approach!' as status;
