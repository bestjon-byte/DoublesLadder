-- ============================================
-- DIAGNOSTIC: Check Payment Token System
-- ============================================

-- 1. Check if validate_payment_token function exists
SELECT
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%payment%token%'
ORDER BY routine_name;

-- 2. Check if payment_reminder_tokens table exists
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE '%payment%token%';

-- 3. Check if there are any tokens in the database
SELECT COUNT(*) as token_count FROM payment_reminder_tokens;

-- 4. Check if there are any unused tokens
SELECT
    t.id,
    t.token,
    t.payment_id,
    t.created_at,
    t.expires_at,
    t.used_at,
    CASE
        WHEN t.used_at IS NOT NULL THEN 'USED'
        WHEN t.expires_at < NOW() THEN 'EXPIRED'
        ELSE 'VALID'
    END as token_status,
    cp.status as payment_status,
    cp.amount_due,
    p.name as player_name,
    p.email as player_email
FROM payment_reminder_tokens t
LEFT JOIN coaching_payments cp ON cp.id = t.payment_id
LEFT JOIN profiles p ON p.id = cp.player_id
ORDER BY t.created_at DESC
LIMIT 10;

-- 5. Check recent payment reminder history
SELECT
    prh.sent_at,
    prh.email_status,
    prh.player_email,
    prh.amount_owed,
    prh.error_message
FROM payment_reminder_history prh
ORDER BY prh.sent_at DESC
LIMIT 5;
