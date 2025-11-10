-- Update generate_coaching_sessions function to accept start_date parameter
-- This allows flexible session generation from any date, not just today

CREATE OR REPLACE FUNCTION generate_coaching_sessions(
  weeks_ahead INTEGER DEFAULT 4,
  start_from_date DATE DEFAULT NULL  -- New parameter: if NULL, uses CURRENT_DATE
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
  base_date DATE;
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
      -- If it's the same day of week as base_date and time has passed, skip to next week
      IF days_until_target = 0 AND week_offset = 0 THEN
        IF start_from_date IS NULL AND CURRENT_TIME > schedule.session_time THEN
          -- Only skip if using current date and time has passed
          days_until_target := 7;
        ELSIF days_until_target = 0 THEN
          -- If using custom start date and it's the same day, include it
          days_until_target := 0;
        END IF;
      END IF;

      target_date := base_date + days_until_target + (week_offset * 7);

      -- Only create if doesn't already exist (handles duplicates gracefully)
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
      RETURNING id, session_type, session_date, session_time
      INTO new_session_id, new_session_type, new_session_date, new_session_time;

      -- Return the session info (only if it was actually created)
      IF new_session_id IS NOT NULL THEN
        session_id := new_session_id;
        session_type := new_session_type;
        session_date := new_session_date;
        session_time := new_session_time;
        RETURN NEXT;
      END IF;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_coaching_sessions IS 'Auto-generates coaching sessions from active schedules with flexible start date';

-- Example usage:
-- Generate 4 weeks from today (default behavior):
-- SELECT * FROM generate_coaching_sessions();
-- SELECT * FROM generate_coaching_sessions(4);

-- Generate 6 weeks starting from next Monday:
-- SELECT * FROM generate_coaching_sessions(6, '2025-11-10');

-- Generate 12 weeks starting from a specific date:
-- SELECT * FROM generate_coaching_sessions(12, '2025-12-01');
