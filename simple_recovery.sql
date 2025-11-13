-- Simplified recovery query - find Sarah N's old player_id
-- Run in Supabase SQL Editor

-- 1. Check what audit/log tables actually exist
SELECT
    'Available Tables' as check_type,
    table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND (table_name ILIKE '%audit%'
   OR table_name ILIKE '%history%'
   OR table_name ILIKE '%log%'
   OR table_name ILIKE '%deleted%')
ORDER BY table_name;

-- 2. Find orphaned player_id in season_players (merge updated these but didn't delete)
-- This should show Sarah N's OLD player_id if it exists
SELECT
    'Orphaned in season_players' as check_type,
    sp.player_id as old_sarah_n_id,
    sp.season_id,
    s.name as season_name,
    sp.games_played,
    sp.games_won,
    sp.created_at,
    'This might be Sarah N old ID' as note
FROM season_players sp
JOIN seasons s ON s.id = sp.season_id
LEFT JOIN profiles p ON p.id = sp.player_id
WHERE p.id IS NULL
ORDER BY sp.created_at DESC;

-- 3. Check match_fixtures for orphaned player references
SELECT
    'Orphaned in match_fixtures' as check_type,
    DISTINCT unnest(ARRAY[
        player1_id, player2_id, player3_id, player4_id,
        pair1_player1_id, pair1_player2_id, pair2_player1_id, pair2_player2_id
    ]) as orphaned_player_id
FROM match_fixtures mf
WHERE NOT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id IN (
        mf.player1_id, mf.player2_id, mf.player3_id, mf.player4_id,
        mf.pair1_player1_id, mf.pair1_player2_id, mf.pair2_player1_id, mf.pair2_player2_id
    )
);

-- 4. Check availability table for orphaned records
SELECT
    'Orphaned in availability' as check_type,
    a.player_id as old_player_id,
    COUNT(*) as records
FROM availability a
LEFT JOIN profiles p ON p.id = a.player_id
WHERE p.id IS NULL
GROUP BY a.player_id;

-- 5. Look at recent profile updates - Sarah Nutbrown should have been recently updated
SELECT
    'Recent Profile Updates' as check_type,
    id,
    name,
    email,
    updated_at,
    created_at
FROM profiles
WHERE name ILIKE '%sarah%'
   OR email ILIKE '%sarah%'
ORDER BY updated_at DESC;

-- 6. Check if we can infer sessions Sarah N attended from the import data
-- Look for sessions from the coaching-import.sql timeframe with "Sarah N" pattern
SELECT
    'Sessions Sarah N likely attended' as check_type,
    cs.id as session_id,
    cs.session_date,
    cs.session_type,
    cs.session_time,
    cs.notes,
    COUNT(ca.id) as current_attendees
FROM coaching_sessions cs
LEFT JOIN coaching_attendance ca ON ca.session_id = cs.id
WHERE cs.notes ILIKE '%import%'
  AND cs.session_type = 'Adults'
  AND cs.session_date BETWEEN '2025-07-01' AND '2025-09-30'
GROUP BY cs.id, cs.session_date, cs.session_type, cs.session_time, cs.notes
ORDER BY cs.session_date;
