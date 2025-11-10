-- ROLLBACK: Restore original working generate_coaching_sessions function
-- This version only takes weeks_ahead parameter

DROP FUNCTION IF EXISTS generate_coaching_sessions(INTEGER, DATE);
DROP FUNCTION IF EXISTS generate_coaching_sessions(INTEGER);

CREATE OR REPLACE FUNCTION generate_coaching_sessions(
  weeks_ahead INTEGER DEFAULT 4
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
BEGIN
  -- Loop through active schedules
  FOR schedule IN
    SELECT * FROM coaching_schedules
    WHERE is_active = true
  LOOP
    -- Generate sessions for the next N weeks
    FOR week_offset IN 0..weeks_ahead-1 LOOP
      -- Calculate next occurrence of this day of week
      days_until_target := (schedule.day_of_week - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 7) % 7;
      IF days_until_target = 0 AND week_offset = 0 AND CURRENT_TIME > schedule.session_time THEN
        days_until_target := 7; -- If today but time passed, schedule for next week
      END IF;
      target_date := CURRENT_DATE + days_until_target + (week_offset * 7);

      -- Insert session (ignore if already exists)
      INSERT INTO coaching_sessions (
        schedule_id,
        session_date,
        session_time,
        session_type,
        status,
        created_by
      )
      VALUES (
        schedule.id,
        target_date,
        schedule.session_time,
        schedule.session_type,
        'scheduled',
        schedule.created_by
      )
      ON CONFLICT (session_date, session_time, session_type) DO NOTHING;

    END LOOP;
  END LOOP;

  -- Return all newly created or existing sessions
  RETURN QUERY
  SELECT
    cs.id,
    cs.session_type,
    cs.session_date,
    cs.session_time
  FROM coaching_sessions cs
  WHERE cs.session_date >= CURRENT_DATE
    AND cs.session_date <= CURRENT_DATE + (weeks_ahead * 7)
    AND cs.status = 'scheduled'
  ORDER BY cs.session_date, cs.session_time;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION generate_coaching_sessions IS 'Auto-generates upcoming coaching sessions from active schedules';

SELECT 'Original function restored!' as status;
