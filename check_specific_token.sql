-- Check the specific token from the URL
SELECT
    'Token Details' as info,
    t.token,
    t.player_id,
    p.name as player_name,
    p.email,
    t.created_at,
    t.used_at,
    t.expires_at,
    CASE
        WHEN t.expires_at < NOW() THEN '❌ EXPIRED'
        WHEN t.used_at IS NOT NULL THEN '✅ Already Used'
        WHEN t.player_id IS NULL THEN '❌ No Player ID!'
        ELSE '✅ Valid - Should Work'
    END as token_status
FROM payment_reminder_tokens t
LEFT JOIN profiles p ON p.id = t.player_id
WHERE t.token = 'df4a03a2-9635-46cb-a3ff-28d41887e108';

-- Manually test the validate function with this token
SELECT
    'Validation Test' as info,
    valid,
    player_id,
    amount_due,
    error_message
FROM validate_payment_token('df4a03a2-9635-46cb-a3ff-28d41887e108'::uuid);
