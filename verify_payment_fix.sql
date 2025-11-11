-- ============================================
-- VERIFICATION: Check if Payment Reminder Fix is Deployed
-- Run this after deploying the fix
-- ============================================

-- 1. Check if payment_reminder_tokens has player_id column
SELECT
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'payment_reminder_tokens'
            AND column_name = 'player_id'
        ) THEN '✅ PASS: player_id column exists'
        ELSE '❌ FAIL: player_id column missing - run fix_payment_reminder_session_based.sql'
    END as check_1;

-- 2. Check if validate_payment_token function exists
SELECT
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM information_schema.routines
            WHERE routine_schema = 'public'
            AND routine_name = 'validate_payment_token'
        ) THEN '✅ PASS: validate_payment_token function exists'
        ELSE '❌ FAIL: validate_payment_token function missing - run fix_payment_reminder_session_based.sql'
    END as check_2;

-- 3. Check if generate_payment_reminder_token accepts 2 parameters
SELECT
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM information_schema.parameters
            WHERE specific_schema = 'public'
            AND specific_name IN (
                SELECT specific_name
                FROM information_schema.routines
                WHERE routine_name = 'generate_payment_reminder_token'
            )
            GROUP BY specific_name
            HAVING COUNT(*) >= 2
        ) THEN '✅ PASS: generate_payment_reminder_token accepts player_id parameter'
        ELSE '⚠️  WARNING: generate_payment_reminder_token may need update'
    END as check_3;

-- 4. Check if get_payments_for_reminder function exists
SELECT
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM information_schema.routines
            WHERE routine_schema = 'public'
            AND routine_name = 'get_payments_for_reminder'
        ) THEN '✅ PASS: get_payments_for_reminder function exists'
        ELSE '❌ FAIL: get_payments_for_reminder function missing - run fix_payment_reminder_session_based.sql'
    END as check_4;

-- 5. Show current payment status distribution
SELECT
    '📊 Current Session Payment Status' as info,
    payment_status,
    COUNT(*) as session_count,
    COUNT(DISTINCT player_id) as player_count,
    (COUNT(*) * 4.00)::DECIMAL(10,2) as total_amount_gbp
FROM coaching_attendance ca
INNER JOIN coaching_sessions cs ON cs.id = ca.session_id
WHERE cs.status = 'completed'
GROUP BY payment_status
ORDER BY
    CASE payment_status
        WHEN 'unpaid' THEN 1
        WHEN 'pending_confirmation' THEN 2
        WHEN 'paid' THEN 3
    END;

-- 6. Show recent tokens (if any)
SELECT
    '🎫 Recent Payment Tokens' as info,
    COUNT(*) as total_tokens,
    COUNT(*) FILTER (WHERE used_at IS NULL AND expires_at > NOW()) as active_tokens,
    COUNT(*) FILTER (WHERE used_at IS NOT NULL) as used_tokens,
    COUNT(*) FILTER (WHERE expires_at < NOW()) as expired_tokens
FROM payment_reminder_tokens;

-- 7. Summary
SELECT
    '✨ SUMMARY' as final_check,
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_reminder_tokens' AND column_name = 'player_id')
        AND EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'validate_payment_token')
        AND EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_payments_for_reminder')
        THEN '✅ FIX DEPLOYED - Payment reminders should work correctly'
        ELSE '❌ FIX NOT COMPLETE - Please deploy fix_payment_reminder_session_based.sql'
    END as status;
