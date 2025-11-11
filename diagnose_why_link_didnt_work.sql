-- ============================================
-- DIAGNOSE: Why did the token click not work?
-- Run this after clicking the email link
-- ============================================

-- 1. Check recent tokens - see if one was created for Jon Best
SELECT
    'Recent Tokens' as info,
    t.token,
    t.player_id,
    p.name as player_name,
    p.email,
    t.created_at,
    t.used_at,
    t.expires_at,
    CASE
        WHEN t.used_at IS NOT NULL THEN '✅ Token was used'
        WHEN t.expires_at < NOW() THEN '❌ Token expired'
        ELSE '⏳ Token not yet used'
    END as token_status
FROM payment_reminder_tokens t
LEFT JOIN profiles p ON p.id = t.player_id
ORDER BY t.created_at DESC
LIMIT 5;

-- 2. Check Jon Best's coaching_attendance payment statuses
SELECT
    'Jon Best Sessions' as info,
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

-- 3. Check if player_id is NULL in recent tokens (this would be the problem!)
SELECT
    'Token Player ID Check' as info,
    COUNT(*) as total_tokens,
    COUNT(*) FILTER (WHERE player_id IS NULL) as tokens_without_player_id,
    COUNT(*) FILTER (WHERE player_id IS NOT NULL) as tokens_with_player_id
FROM payment_reminder_tokens
WHERE created_at > NOW() - INTERVAL '1 hour';

-- 4. Check payment reminder history for Jon Best
SELECT
    'Recent Reminders' as info,
    prh.sent_at,
    prh.player_email,
    prh.amount_owed,
    prh.email_status
FROM payment_reminder_history prh
INNER JOIN profiles p ON p.id = prh.player_id
WHERE p.name ILIKE '%Jon%Best%'
ORDER BY prh.sent_at DESC
LIMIT 3;

-- 5. Manual check - what does get_payments_for_reminder return?
SELECT
    'Current Unpaid Sessions' as info,
    player_name,
    player_email,
    total_sessions,
    amount_due
FROM get_payments_for_reminder('all', NULL)
WHERE player_name ILIKE '%Jon%Best%';
