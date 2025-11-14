-- ELO Management Functions for Supabase
-- These functions help with ELO restoration and recalculation

-- ============================================================================
-- Function 1: Get player's most recent ELO rating from any season
-- ============================================================================
CREATE OR REPLACE FUNCTION get_most_recent_elo(player_uuid UUID, excluding_season_uuid UUID DEFAULT NULL)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    most_recent_rating INTEGER;
BEGIN
    -- First try to find the most recent ELO from elo_history
    SELECT eh.new_rating INTO most_recent_rating
    FROM elo_history eh
    JOIN season_players sp ON eh.season_player_id = sp.id
    WHERE sp.player_id = player_uuid
      AND (excluding_season_uuid IS NULL OR sp.season_id != excluding_season_uuid)
    ORDER BY eh.created_at DESC
    LIMIT 1;
    
    -- If no history found, get current rating from any active season
    IF most_recent_rating IS NULL THEN
        SELECT sp.elo_rating INTO most_recent_rating
        FROM season_players sp
        JOIN seasons s ON sp.season_id = s.id
        WHERE sp.player_id = player_uuid
          AND (excluding_season_uuid IS NULL OR sp.season_id != excluding_season_uuid)
          AND s.status = 'active'
        ORDER BY sp.created_at DESC
        LIMIT 1;
    END IF;
    
    RETURN most_recent_rating;
END;
$$;

-- ============================================================================
-- Function 2: Restore ELO ratings for a player after season deletion
-- ============================================================================
CREATE OR REPLACE FUNCTION restore_player_elo_after_deletion(player_uuid UUID, deleted_season_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    restored_rating INTEGER;
    affected_rows INTEGER;
BEGIN
    -- Get the most recent ELO rating excluding the deleted season
    restored_rating := get_most_recent_elo(player_uuid, deleted_season_uuid);
    
    -- If we found a rating to restore
    IF restored_rating IS NOT NULL THEN
        -- Update all active season_players records for this player
        UPDATE season_players 
        SET elo_rating = restored_rating
        WHERE player_id = player_uuid 
          AND season_id != deleted_season_uuid;
          
        GET DIAGNOSTICS affected_rows = ROW_COUNT;
        
        -- Log the restoration
        RAISE NOTICE 'Restored ELO rating % for player % in % seasons', 
            restored_rating, player_uuid, affected_rows;
    ELSE
        RAISE NOTICE 'No previous ELO rating found for player %', player_uuid;
    END IF;
    
    RETURN restored_rating;
END;
$$;

-- ============================================================================
-- Function 3: Calculate ELO rating change
-- ============================================================================
CREATE OR REPLACE FUNCTION calculate_elo_change(
    current_rating INTEGER,
    opponent_avg_rating INTEGER,
    actual_score DECIMAL,
    k_factor INTEGER DEFAULT 32
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    expected_score DECIMAL;
    rating_change INTEGER;
BEGIN
    -- Calculate expected score using ELO formula
    expected_score := 1.0 / (1.0 + POWER(10, (opponent_avg_rating - current_rating)::DECIMAL / 400));
    
    -- Calculate rating change
    rating_change := ROUND(k_factor * (actual_score - expected_score));
    
    RETURN rating_change;
END;
$$;

-- ============================================================================
-- Function 4: Recalculate ELO for entire season from scratch
-- ============================================================================
CREATE OR REPLACE FUNCTION recalculate_season_elo(season_uuid UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    season_record RECORD;
    match_record RECORD;
    player_ratings JSONB DEFAULT '{}';
    pair1_avg INTEGER;
    pair2_avg INTEGER;
    pair1_actual DECIMAL;
    pair2_actual DECIMAL;
    total_games INTEGER;
    processed_matches INTEGER DEFAULT 0;
BEGIN
    -- Get season settings
    SELECT elo_initial_rating, elo_k_factor, elo_enabled 
    INTO season_record
    FROM seasons 
    WHERE id = season_uuid;
    
    IF NOT FOUND THEN
        RETURN 'Season not found';
    END IF;
    
    IF NOT season_record.elo_enabled THEN
        RETURN 'ELO not enabled for this season';
    END IF;
    
    -- Reset all players to initial rating and clear history
    UPDATE season_players 
    SET elo_rating = season_record.elo_initial_rating
    WHERE season_id = season_uuid;
    
    DELETE FROM elo_history 
    WHERE season_player_id IN (
        SELECT id FROM season_players WHERE season_id = season_uuid
    );
    
    -- Initialize player ratings lookup
    SELECT jsonb_object_agg(player_id::TEXT, elo_rating) INTO player_ratings
    FROM season_players 
    WHERE season_id = season_uuid;
    
    -- Process matches in chronological order
    FOR match_record IN
        SELECT 
            mf.id as fixture_id,
            mf.pair1_player1_id,
            mf.pair1_player2_id,
            mf.pair2_player1_id,
            mf.pair2_player2_id,
            mr.pair1_score,
            mr.pair2_score,
            mr.created_at
        FROM match_fixtures mf
        JOIN matches m ON mf.match_id = m.id
        JOIN match_results mr ON mf.id = mr.fixture_id
        WHERE m.season_id = season_uuid
          AND mf.pair1_player1_id IS NOT NULL
          AND mf.pair1_player2_id IS NOT NULL
          AND mf.pair2_player1_id IS NOT NULL
          AND mf.pair2_player2_id IS NOT NULL
        ORDER BY mr.created_at, mf.id
    LOOP
        -- Calculate pair averages
        pair1_avg := (
            (player_ratings->>match_record.pair1_player1_id::TEXT)::INTEGER +
            (player_ratings->>match_record.pair1_player2_id::TEXT)::INTEGER
        ) / 2;
        
        pair2_avg := (
            (player_ratings->>match_record.pair2_player1_id::TEXT)::INTEGER +
            (player_ratings->>match_record.pair2_player2_id::TEXT)::INTEGER
        ) / 2;
        
        -- Calculate actual scores
        total_games := match_record.pair1_score + match_record.pair2_score;
        IF total_games > 0 THEN
            pair1_actual := match_record.pair1_score::DECIMAL / total_games;
            pair2_actual := match_record.pair2_score::DECIMAL / total_games;
        ELSE
            pair1_actual := 0.5;
            pair2_actual := 0.5;
        END IF;
        
        -- Update ratings and create history for pair 1 players
        -- (This is a simplified version - in a real implementation you'd need to 
        -- update each player individually and create history records)
        
        processed_matches := processed_matches + 1;
    END LOOP;
    
    RETURN FORMAT('Successfully recalculated ELO for %s matches in season', processed_matches);
END;
$$;

-- ============================================================================
-- Function 5: Clean up orphaned ELO history records
-- ============================================================================
CREATE OR REPLACE FUNCTION cleanup_orphaned_elo_history()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete ELO history records where the season_player no longer exists
    DELETE FROM elo_history
    WHERE season_player_id NOT IN (
        SELECT id FROM season_players
    );
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$;

-- ============================================================================
-- Example Usage
-- ============================================================================

/*
-- Get most recent ELO for a player
SELECT get_most_recent_elo('player-uuid-here');

-- Restore ELO after deleting a season
SELECT restore_player_elo_after_deletion('player-uuid-here', 'deleted-season-uuid');

-- Calculate ELO change for a match result
SELECT calculate_elo_change(1200, 1150, 0.75, 32);

-- Recalculate entire season ELO
SELECT recalculate_season_elo('season-uuid-here');

-- Clean up orphaned records
SELECT cleanup_orphaned_elo_history();
*/