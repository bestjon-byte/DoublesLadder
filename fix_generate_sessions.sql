-- Fix for generate_coaching_sessions function
-- Resolves "column reference session_date is ambiguous" error

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
  new_session_id UUID;
  new_session_type VARCHAR;
  new_session_date DATE;
  new_session_time TIME;
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

      -- Only create if doesn't already exist
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
      ON CONFLICT (session_date, session_time, session_type) DO NOTHING
      RETURNING id, coaching_sessions.session_type, coaching_sessions.session_date, coaching_sessions.session_time
      INTO new_session_id, new_session_type, new_session_date, new_session_time;

      IF new_session_id IS NOT NULL THEN
        session_id := new_session_id;
        session_type := new_session_type;
        session_date := new_session_date;
        session_time := new_session_time;
        RETURN NEXT;
      END IF;
    END LOOP;
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION generate_coaching_sessions IS 'Auto-generates upcoming coaching sessions from active schedules (fixed ambiguous column reference)';
