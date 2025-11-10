-- Update generate_coaching_sessions to accept optional schedule IDs
CREATE OR REPLACE FUNCTION generate_coaching_sessions(
    weeks_ahead INT DEFAULT 4,
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
    v_start_date DATE;
    v_end_date DATE;
    v_schedule RECORD;
    v_current_date DATE;
    v_session_id UUID;
BEGIN
    -- Set start date (use provided date or current date)
    v_start_date := COALESCE(start_from_date, CURRENT_DATE);

    -- Calculate end date
    v_end_date := v_start_date + (weeks_ahead * 7);

    -- Loop through all active schedules (filtered by schedule_ids if provided)
    FOR v_schedule IN
        SELECT * FROM coaching_schedules
        WHERE is_active = true
        AND (schedule_ids IS NULL OR id = ANY(schedule_ids))
    LOOP
        -- Find the first occurrence of this day of week from start date
        v_current_date := v_start_date;

        -- Adjust to the first matching day of week
        WHILE EXTRACT(DOW FROM v_current_date) != v_schedule.day_of_week LOOP
            v_current_date := v_current_date + 1;
        END LOOP;

        -- Generate sessions for each occurrence of this day until end date
        WHILE v_current_date < v_end_date LOOP
            -- Check if session already exists for this schedule, date and time
            IF NOT EXISTS (
                SELECT 1 FROM coaching_sessions cs
                WHERE cs.schedule_id = v_schedule.id
                AND cs.session_date = v_current_date
                AND cs.session_time = v_schedule.session_time
            ) THEN
                -- Insert new session
                INSERT INTO coaching_sessions (
                    schedule_id,
                    session_type,
                    session_date,
                    session_time,
                    status,
                    created_by
                ) VALUES (
                    v_schedule.id,
                    v_schedule.session_type,
                    v_current_date,
                    v_schedule.session_time,
                    'scheduled',
                    v_schedule.created_by
                )
                RETURNING id INTO v_session_id;

                -- Return the created session info
                RETURN QUERY
                SELECT
                    v_session_id,
                    v_schedule.session_type,
                    v_current_date,
                    v_schedule.session_time;
            END IF;

            -- Move to next week (same day)
            v_current_date := v_current_date + 7;
        END LOOP;
    END LOOP;

    RETURN;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_coaching_sessions(INT, DATE, UUID[]) IS 'Generate coaching sessions from active schedules. Optionally filter by schedule IDs.';
