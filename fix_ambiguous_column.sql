-- Fix ambiguous column reference in generate_coaching_sessions
-- The issue is in the RETURNING clause where column names conflict with the RETURNS TABLE columns

DROP FUNCTION IF EXISTS generate_coaching_sessions(INTEGER, DATE);

CREATE OR REPLACE FUNCTION generate_coaching_sessions(
  weeks_ahead INTEGER DEFAULT 4,
  start_from_date DATE DEFAULT NULL
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
  inserted_session RECORD;
BEGIN
  -- Use provided start date or default to current date
  base_date := COALESCE(start_from_date, CURRENT_DATE);

  -- Loop through active schedules
  FOR schedule IN
    SELECT * FROM coaching_schedules
    WHERE is_active = true
  LOOP
    -- Generate sessions for the next N weeks
    FOR week_offset IN 0..weeks_ahead-1 LOOP
      -- Calculate next occurrence of this day of week from the base date
      days_until_target := (schedule.day_of_week - EXTRACT(DOW FROM base_date)::INTEGER + 7) % 7;

      -- Special handling for first week:
      IF days_until_target = 0 AND week_offset = 0 THEN
        IF start_from_date IS NULL AND CURRENT_TIME > schedule.session_time THEN
          -- Only skip if using current date and time has passed
          days_until_target := 7;
        END IF;
      END IF;

      target_date := base_date + days_until_target + (week_offset * 7);

      -- Insert and capture the result in a RECORD to avoid ambiguity
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
        schedule.id,
        target_date,
        schedule.session_time,
        schedule.session_type,
        'scheduled',
        schedule.created_by,
        'Auto-generated from schedule',
        NOW(),
        NOW()
      )
      ON CONFLICT (session_date, session_time, session_type) DO NOTHING
      RETURNING
        coaching_sessions.id,
        coaching_sessions.session_type,
        coaching_sessions.session_date,
        coaching_sessions.session_time
      INTO inserted_session;

      -- Return the session info (only if it was actually created)
      IF inserted_session.id IS NOT NULL THEN
        session_id := inserted_session.id;
        session_type := inserted_session.session_type;
        session_date := inserted_session.session_date;
        session_time := inserted_session.session_time;
        RETURN NEXT;
      END IF;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_coaching_sessions IS 'Auto-generates coaching sessions from active schedules with flexible start date';

-- Verify the function
SELECT 'Function updated successfully!' as status;
