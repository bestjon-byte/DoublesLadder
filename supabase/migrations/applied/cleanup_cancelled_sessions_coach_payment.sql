-- ============================================
-- CLEANUP: Set cancelled Beginners/Adults sessions to no coach payment
-- ============================================

-- First, let's see what we're about to update
SELECT
    id,
    session_date,
    session_time,
    session_type,
    status,
    coach_payment_status,
    coach_payment_amount,
    cancellation_reason
FROM coaching_sessions
WHERE status = 'cancelled'
AND session_type IN ('Beginners', 'Adults')
AND (coach_payment_status = 'to_pay' OR coach_payment_status IS NULL)
ORDER BY session_date DESC;

-- Show counts by session type
SELECT
    session_type,
    COUNT(*) as cancelled_sessions_to_update
FROM coaching_sessions
WHERE status = 'cancelled'
AND session_type IN ('Beginners', 'Adults')
AND (coach_payment_status = 'to_pay' OR coach_payment_status IS NULL)
GROUP BY session_type;

-- ============================================
-- UNCOMMENT THE SECTION BELOW TO APPLY THE UPDATE
-- ============================================

/*
-- Update all cancelled Beginners and Adults sessions to no payment
UPDATE coaching_sessions
SET
    coach_payment_status = 'no_payment',
    coach_payment_notes = COALESCE(
        coach_payment_notes || ' | ',
        ''
    ) || 'Bulk update: cancelled sessions set to no payment',
    updated_at = NOW()
WHERE status = 'cancelled'
AND session_type IN ('Beginners', 'Adults')
AND (coach_payment_status = 'to_pay' OR coach_payment_status IS NULL);

-- Show summary of what was updated
SELECT
    session_type,
    COUNT(*) as updated_count
FROM coaching_sessions
WHERE status = 'cancelled'
AND session_type IN ('Beginners', 'Adults')
AND coach_payment_status = 'no_payment'
GROUP BY session_type;

-- Verify the update
SELECT
    id,
    session_date,
    session_time,
    session_type,
    status,
    coach_payment_status,
    coach_payment_amount,
    cancellation_reason,
    coach_payment_notes
FROM coaching_sessions
WHERE status = 'cancelled'
AND session_type IN ('Beginners', 'Adults')
ORDER BY session_date DESC
LIMIT 20;
*/
