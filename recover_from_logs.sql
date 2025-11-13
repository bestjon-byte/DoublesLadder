-- Attempt to recover Sarah N's deleted coaching records from logs
-- Run in Supabase SQL Editor

-- 1. Check admin_actions table for recent merge activity
SELECT
    'Admin Actions Log' as source,
    id,
    admin_id,
    action_type,
    details,
    timestamp,
    created_at
FROM admin_actions
WHERE action_type ILIKE '%merge%'
   OR details::text ILIKE '%Sarah%'
   OR details::text ILIKE '%merge%'
ORDER BY created_at DESC
LIMIT 20;

-- 2. Check if there's a profiles history/audit table
SELECT
    'Profiles Audit' as source,
    *
FROM profiles_audit
WHERE name ILIKE '%Sarah N%'
   OR email ILIKE '%sarah.n%'
ORDER BY created_at DESC
LIMIT 20;

-- 3. Check for any database triggers or audit tables
SELECT
    'Audit Tables' as source,
    table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND (table_name ILIKE '%audit%'
   OR table_name ILIKE '%history%'
   OR table_name ILIKE '%log%')
ORDER BY table_name;

-- 4. Look for recently deleted profiles that might be Sarah N
-- Check if profiles has a deleted_at column (soft delete)
SELECT
    'Soft Deleted Profiles' as source,
    id,
    name,
    email,
    created_at,
    updated_at
FROM profiles
WHERE name = 'Sarah N'
   OR email ILIKE '%sarah.n%coaching%'
ORDER BY updated_at DESC;

-- 5. Check coaching_attendance for any recent deletions pattern
-- Look at the most recent 50 records to see if there's a gap in IDs
SELECT
    'Recent Attendance Pattern' as source,
    MIN(created_at) as oldest_record,
    MAX(created_at) as newest_record,
    COUNT(*) as total_records,
    COUNT(DISTINCT player_id) as unique_players,
    MAX(created_at) FILTER (WHERE player_id = '9ee52547-4b38-485a-b321-06bfcdb3c562') as sarah_last_record
FROM coaching_attendance;

-- 6. Find when the merge likely happened by checking recent profile updates
SELECT
    'Recent Profile Changes' as source,
    id,
    name,
    email,
    updated_at,
    created_at
FROM profiles
WHERE updated_at > NOW() - INTERVAL '7 days'
ORDER BY updated_at DESC
LIMIT 30;

-- 7. Check if we can see Sarah N's old player_id in any other tables
-- (it might still exist in tables that weren't part of the merge)
SELECT
    'Sarah N in Season Players?' as source,
    sp.*,
    s.name as season_name
FROM season_players sp
JOIN seasons s ON s.id = sp.season_id
WHERE sp.player_id NOT IN (SELECT id FROM profiles)
ORDER BY sp.created_at DESC
LIMIT 10;
