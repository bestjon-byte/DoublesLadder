-- Audit ALL player merges to check for lost coaching data
-- Run in Supabase SQL Editor

-- 1. Check for orphaned records in ANY table (these would be merged players)
SELECT
    '1. Orphaned in season_players' as check,
    COUNT(DISTINCT sp.player_id) as orphaned_player_count
FROM season_players sp
LEFT JOIN profiles p ON p.id = sp.player_id
WHERE p.id IS NULL;

-- 2. Check for orphaned in availability
SELECT
    '2. Orphaned in availability' as check,
    COUNT(DISTINCT a.player_id) as orphaned_player_count
FROM availability a
LEFT JOIN profiles p ON p.id = a.player_id
WHERE p.id IS NULL;

-- 3. Check for orphaned in coaching_attendance (should be 0 after Sarah fix)
SELECT
    '3. Orphaned in coaching_attendance' as check,
    COUNT(DISTINCT ca.player_id) as orphaned_player_count
FROM coaching_attendance ca
LEFT JOIN profiles p ON p.id = ca.player_id
WHERE p.id IS NULL;

-- 4. Find profiles that were recently updated (likely merge targets)
SELECT
    '4. Recently updated profiles (merge targets?)' as check,
    id,
    name,
    email,
    created_at,
    updated_at
FROM profiles
WHERE updated_at > created_at + INTERVAL '1 hour'
  AND updated_at > NOW() - INTERVAL '30 days'
ORDER BY updated_at DESC;

-- 5. Check if any imported ghost accounts are still around
-- These would have coaching data but might have been merged
SELECT
    '5. Ghost accounts from import' as check,
    p.id,
    p.name,
    p.email,
    COUNT(ca.id) as coaching_sessions
FROM profiles p
LEFT JOIN coaching_attendance ca ON ca.player_id = p.id
WHERE p.email LIKE '%@coaching-import.example.com'
GROUP BY p.id, p.name, p.email
ORDER BY coaching_sessions DESC;

-- 6. Check for players with suspiciously low session counts
-- (If someone was merged and lost data, they'd have fewer sessions than expected)
SELECT
    '6. Players with only 1-2 sessions (suspicious?)' as check,
    p.name,
    p.email,
    COUNT(ca.id) as total_sessions,
    MIN(cs.session_date) as first_session,
    MAX(cs.session_date) as last_session
FROM profiles p
JOIN coaching_attendance ca ON ca.player_id = p.id
JOIN coaching_sessions cs ON cs.id = ca.session_id
WHERE p.email NOT LIKE '%@coaching-import.example.com'
  AND p.email NOT LIKE '%@example.com'
GROUP BY p.id, p.name, p.email
HAVING COUNT(ca.id) <= 2
ORDER BY total_sessions, p.name;
