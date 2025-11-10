-- Fix ambiguous column reference - Use column aliases in RETURN QUERY
-- Based on the working fix_generate_sessions_v2.sql approach

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
  date_range_start DATE;
  date_range_end DATE;
BEGIN
  -- Use provided start date or default to current date
  base_date := COALESCE(start_from_date, CURRENT_DATE);

  -- Calculate the date range we're generating for
  date_range_start := base_date;
  date_range_end := base_date + (weeks_ahead * 7);

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
      ON CONFLICT (session_date, session_time, session_type) DO NOTHING;

    END LOOP;
  END LOOP;

  -- Return all sessions in the generated date range
  -- Use explicit column aliases to avoid ambiguity
  RETURN QUERY
  SELECT
    cs.id AS session_id,
    cs.session_type AS session_type,
    cs.session_date AS session_date,
    cs.session_time AS session_time
  FROM coaching_sessions cs
  WHERE cs.session_date >= date_range_start
    AND cs.session_date < date_range_end
    AND cs.status = 'scheduled'
  ORDER BY cs.session_date, cs.session_time;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION generate_coaching_sessions IS 'Auto-generates coaching sessions from active schedules with flexible start date';

-- Verify the function
SELECT 'Function updated successfully!' as status;
