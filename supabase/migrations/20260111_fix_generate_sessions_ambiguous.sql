-- ============================================================================
-- FIX: Ambiguous column reference in generate_coaching_sessions
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_coaching_sessions(
  weeks_ahead INTEGER DEFAULT 4,
  start_from_date DATE DEFAULT NULL,
  schedule_ids UUID[] DEFAULT NULL
)
RETURNS TABLE (
  out_session_id UUID,
  out_session_type VARCHAR,
  out_session_date DATE,
  out_session_time TIME
) AS $$
DECLARE
  schedule RECORD;
  target_date DATE;
  days_until_target INTEGER;
  week_offset INTEGER;
  base_date DATE;
  new_id UUID;
  new_type VARCHAR;
  new_date DATE;
  new_time TIME;
BEGIN
  -- Use provided start date or current date
  base_date := COALESCE(start_from_date, CURRENT_DATE);

  -- Loop through active schedules
  FOR schedule IN
    SELECT * FROM coaching_schedules cs
    WHERE cs.is_active = true
    AND (schedule_ids IS NULL OR cs.id = ANY(schedule_ids))
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
        schedule.session_cost,
        'scheduled',
        schedule.created_by
      )
      ON CONFLICT (session_date, session_time, session_type) DO NOTHING
      RETURNING id, coaching_sessions.session_type, coaching_sessions.session_date, coaching_sessions.session_time
      INTO new_id, new_type, new_date, new_time;

      IF new_id IS NOT NULL THEN
        out_session_id := new_id;
        out_session_type := new_type;
        out_session_date := new_date;
        out_session_time := new_time;
        RETURN NEXT;
      END IF;
    END LOOP;
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION generate_coaching_sessions IS 'Auto-generates upcoming coaching sessions from active schedules';
