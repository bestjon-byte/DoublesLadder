-- ============================================
-- CHECK: What happened when Jon clicked the link?
-- ============================================

-- 1. Did the token get created with player_id?
SELECT
    '1. Latest Token Created' as check_step,
    t.token,
    t.player_id,
    p.name as player_name,
    t.created_at,
    t.used_at,
    t.expires_at,
    CASE
        WHEN t.used_at IS NOT NULL THEN '✅ Token WAS clicked/used'
        ELSE '❌ Token NOT clicked yet'
    END as click_status
FROM payment_reminder_tokens t
LEFT JOIN profiles p ON p.id = t.player_id
ORDER BY t.created_at DESC
LIMIT 1;

-- 2. What are Jon Best's current session payment statuses?
SELECT
    '2. Jon Best Session Status' as check_step,
    ca.payment_status,
    COUNT(*) as session_count,
    MIN(cs.session_date) as earliest_session,
    MAX(cs.session_date) as latest_session
FROM coaching_attendance ca
INNER JOIN coaching_sessions cs ON cs.id = ca.session_id
INNER JOIN profiles p ON p.id = ca.player_id
WHERE p.name ILIKE '%Jon%Best%'
AND cs.status = 'completed'
GROUP BY ca.payment_status
ORDER BY ca.payment_status;

-- 3. Show the actual sessions with details
SELECT
    '3. Jon Best Session Details' as check_step,
    cs.session_date,
    cs.session_type,
    ca.payment_status,
    ca.user_marked_paid_at,
    ca.admin_confirmed_at
FROM coaching_attendance ca
INNER JOIN coaching_sessions cs ON cs.id = ca.session_id
INNER JOIN profiles p ON p.id = ca.player_id
WHERE p.name ILIKE '%Jon%Best%'
AND cs.status = 'completed'
ORDER BY cs.session_date DESC
LIMIT 10;

-- 4. Check if validate_payment_token function worked
-- Look for any errors in the logs
SELECT
    '4. Token Validation' as check_step,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM payment_reminder_tokens
            WHERE player_id = (SELECT id FROM profiles WHERE name ILIKE '%Jon%Best%' LIMIT 1)
            AND used_at IS NOT NULL
        ) THEN '✅ Token was marked as used'
        ELSE '❌ Token was NOT marked as used - validation may have failed'
    END as validation_status;

-- 5. What does the UI see? (This is what getAllPlayersPaymentSummary returns)
SELECT
    '5. What UI Shows' as check_step,
    player_name,
    total_sessions,
    unpaid_sessions,
    pending_confirmation_sessions,
    paid_sessions,
    amount_owed,
    amount_pending_confirmation,
    amount_paid
FROM get_all_players_payment_summary()
WHERE player_name ILIKE '%Jon%Best%';
