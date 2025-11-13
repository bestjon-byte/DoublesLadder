-- Find Sarah N's old player_id - FIXED VERSION
-- Run in Supabase SQL Editor

-- 1. Find orphaned player_ids in season_players (merge updated these)
SELECT
    'Orphaned in season_players' as check_type,
    sp.player_id as potential_old_sarah_id,
    COUNT(*) as occurrences,
    STRING_AGG(s.name, ', ') as seasons
FROM season_players sp
JOIN seasons s ON s.id = sp.season_id
LEFT JOIN profiles p ON p.id = sp.player_id
WHERE p.id IS NULL
GROUP BY sp.player_id
ORDER BY COUNT(*) DESC;

-- 2. Find orphaned in availability
SELECT
    'Orphaned in availability' as check_type,
    a.player_id as potential_old_sarah_id,
    COUNT(*) as occurrences
FROM availability a
LEFT JOIN profiles p ON p.id = a.player_id
WHERE p.id IS NULL
GROUP BY a.player_id
ORDER BY COUNT(*) DESC;

-- 3. Check recent Sarah profile updates
SELECT
    'Sarah Nutbrown Profile' as check_type,
    id,
    name,
    email,
    created_at,
    updated_at
FROM profiles
WHERE name = 'Sarah Nutbrown'
   OR email = 'sarahnutbrown@yahoo.co.uk';

-- 4. Count total coaching_attendance records
SELECT
    'Total coaching attendance' as check_type,
    COUNT(*) as total_records
FROM coaching_attendance;

-- 5. Check if Sarah Nutbrown has any attendance records
SELECT
    'Sarah Nutbrown attendance' as check_type,
    COUNT(*) as sarah_records
FROM coaching_attendance
WHERE player_id = '9ee52547-4b38-485a-b321-06bfcdb3c562';

-- 6. Look at which Adults sessions were imported (Sarah N was in Adults)
SELECT
    'Imported Adults Sessions' as check_type,
    cs.id,
    cs.session_date,
    cs.session_type,
    COUNT(ca.id) as current_attendees
FROM coaching_sessions cs
LEFT JOIN coaching_attendance ca ON ca.session_id = cs.id
WHERE cs.notes ILIKE '%import%'
  AND cs.session_type = 'Adults'
  AND cs.session_date BETWEEN '2025-07-01' AND '2025-09-30'
GROUP BY cs.id, cs.session_date, cs.session_type
ORDER BY cs.session_date;

-- 7. Show a sample of who IS in those Adults sessions
SELECT
    'Sample Adults Attendees' as check_type,
    p.name,
    cs.session_date,
    ca.payment_status
FROM coaching_attendance ca
JOIN coaching_sessions cs ON cs.id = ca.session_id
JOIN profiles p ON p.id = ca.player_id
WHERE cs.session_type = 'Adults'
  AND cs.notes ILIKE '%import%'
  AND cs.session_date = '2025-07-09'
ORDER BY p.name;
