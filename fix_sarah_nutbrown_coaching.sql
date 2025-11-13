-- Fix Sarah Nutbrown's Orphaned Coaching Records
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/hwpjrkmplydqaxiikupv/sql

-- Sarah Nutbrown's current profile ID
-- 9ee52547-4b38-485a-b321-06bfcdb3c562 (sarahnutbrown@yahoo.co.uk)

-- Step 1: Find any orphaned coaching_attendance records
-- These are records where player_id points to a deleted profile
SELECT
    ca.id,
    ca.player_id as orphaned_player_id,
    ca.session_id,
    ca.payment_status,
    cs.session_date,
    cs.session_type,
    'ORPHANED - No matching profile' as status
FROM coaching_attendance ca
LEFT JOIN profiles p ON p.id = ca.player_id
JOIN coaching_sessions cs ON cs.id = ca.session_id
WHERE p.id IS NULL
ORDER BY cs.session_date DESC;

-- Step 2: Get the old "Sarah N" player_id from orphaned records
-- (We'll use this to identify which records to fix)
WITH orphaned_sarah AS (
    SELECT DISTINCT ca.player_id
    FROM coaching_attendance ca
    LEFT JOIN profiles p ON p.id = ca.player_id
    WHERE p.id IS NULL
    LIMIT 1
)
SELECT
    'Old Sarah N player_id:' as label,
    player_id
FROM orphaned_sarah;

-- Step 3: Check how many coaching records need to be fixed
WITH orphaned_sarah AS (
    SELECT DISTINCT ca.player_id as old_player_id
    FROM coaching_attendance ca
    LEFT JOIN profiles p ON p.id = ca.player_id
    WHERE p.id IS NULL
    LIMIT 1
)
SELECT
    COUNT(*) as total_orphaned_sessions,
    COUNT(*) FILTER (WHERE ca.payment_status = 'unpaid') as unpaid_sessions,
    COUNT(*) FILTER (WHERE ca.payment_status = 'pending_confirmation') as pending_sessions,
    COUNT(*) FILTER (WHERE ca.payment_status = 'paid') as paid_sessions
FROM coaching_attendance ca
WHERE ca.player_id IN (SELECT old_player_id FROM orphaned_sarah);

-- Step 4: FIX THE ORPHANED RECORDS
-- Update all orphaned coaching_attendance records to point to Sarah Nutbrown
WITH orphaned_sarah AS (
    SELECT DISTINCT ca.player_id as old_player_id
    FROM coaching_attendance ca
    LEFT JOIN profiles p ON p.id = ca.player_id
    WHERE p.id IS NULL
    LIMIT 1
)
UPDATE coaching_attendance
SET player_id = '9ee52547-4b38-485a-b321-06bfcdb3c562'  -- Sarah Nutbrown's ID
WHERE player_id IN (SELECT old_player_id FROM orphaned_sarah);

-- Step 5: Also fix any orphaned coaching_payments records
WITH orphaned_sarah AS (
    SELECT DISTINCT cp.player_id as old_player_id
    FROM coaching_payments cp
    LEFT JOIN profiles p ON p.id = cp.player_id
    WHERE p.id IS NULL
    LIMIT 1
)
UPDATE coaching_payments
SET player_id = '9ee52547-4b38-485a-b321-06bfcdb3c562'  -- Sarah Nutbrown's ID
WHERE player_id IN (SELECT old_player_id FROM orphaned_sarah);

-- Step 6: Verify the fix - Sarah Nutbrown should now see all her sessions
SELECT
    p.name,
    p.email,
    COUNT(*) as total_coaching_sessions,
    COUNT(*) FILTER (WHERE ca.payment_status = 'unpaid') as unpaid,
    COUNT(*) FILTER (WHERE ca.payment_status = 'pending_confirmation') as pending,
    COUNT(*) FILTER (WHERE ca.payment_status = 'paid') as paid,
    SUM(CASE WHEN ca.payment_status = 'unpaid' THEN 4.00 ELSE 0 END) as amount_owed
FROM profiles p
JOIN coaching_attendance ca ON ca.player_id = p.id
JOIN coaching_sessions cs ON cs.id = ca.session_id
WHERE p.id = '9ee52547-4b38-485a-b321-06bfcdb3c562'
GROUP BY p.name, p.email;

-- Step 7: Check there are no more orphaned records
SELECT
    COUNT(*) as remaining_orphaned_records
FROM coaching_attendance ca
LEFT JOIN profiles p ON p.id = ca.player_id
WHERE p.id IS NULL;
