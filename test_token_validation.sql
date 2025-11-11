-- ============================================
-- TEST: What's failing in validate_payment_token?
-- Run this with the token from your latest email
-- ============================================

-- Replace YOUR_TOKEN_HERE with the actual token from the email URL
-- Example: If URL is ?token=abc-123, use 'abc-123'

-- Step 1: Check if token exists and has player_id
SELECT
    '1. Token Info' as step,
    t.token,
    t.player_id,
    p.name as player_name,
    p.email,
    t.used_at,
    t.expires_at,
    CASE
        WHEN t.player_id IS NULL THEN '❌ NO PLAYER_ID'
        WHEN t.used_at IS NOT NULL THEN '⚠️ ALREADY USED'
        WHEN t.expires_at < NOW() THEN '❌ EXPIRED'
        ELSE '✅ VALID'
    END as status
FROM payment_reminder_tokens t
LEFT JOIN profiles p ON p.id = t.player_id
ORDER BY t.created_at DESC
LIMIT 1;

-- Step 2: Check Jon Best's unpaid sessions
SELECT
    '2. Jon Sessions' as step,
    COUNT(*) as unpaid_sessions,
    STRING_AGG(cs.session_date::text, ', ') as session_dates
FROM coaching_attendance ca
INNER JOIN coaching_sessions cs ON cs.id = ca.session_id
INNER JOIN profiles p ON p.id = ca.player_id
WHERE p.name ILIKE '%Jon%Best%'
AND cs.status = 'completed'
AND ca.payment_status = 'unpaid';

-- Step 3: Check if coaching_attendance table has the payment_status column
SELECT
    '3. Table Structure' as step,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'coaching_attendance'
AND column_name IN ('payment_status', 'user_marked_paid_at', 'admin_confirmed_at')
ORDER BY column_name;

-- Step 4: Manually test validate_payment_token
-- REPLACE THE TOKEN BELOW WITH YOUR ACTUAL TOKEN!
SELECT
    '4. Manual Validation Test' as step,
    valid,
    player_id,
    amount_due,
    error_message
FROM validate_payment_token('YOUR_TOKEN_HERE'::uuid);

-- Instructions:
-- Copy the token from your email URL (the part after ?token=)
-- Replace 'YOUR_TOKEN_HERE' in Step 4 with that token
-- Run all queries together
