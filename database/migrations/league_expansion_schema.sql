-- League Expansion Database Migration
-- This migration adds support for multiple concurrent seasons, external league matches,
-- and external player tracking while maintaining backward compatibility.

-- 1. Add new columns to seasons table for league support
ALTER TABLE seasons 
ADD COLUMN IF NOT EXISTS season_type VARCHAR(20) DEFAULT 'ladder' 
    CHECK (season_type IN ('ladder', 'league')),
ADD COLUMN IF NOT EXISTS league_info JSONB DEFAULT '{}';

-- Update the status check constraint to allow multiple active seasons
ALTER TABLE seasons 
DROP CONSTRAINT IF EXISTS seasons_status_check;

ALTER TABLE seasons 
ADD CONSTRAINT seasons_status_check 
    CHECK (status IN ('upcoming', 'active', 'completed'));

-- 2. Create external_players table for tracking opposition players
CREATE TABLE IF NOT EXISTS external_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    club_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Stats tracking
    total_rubbers_played INTEGER DEFAULT 0,
    total_games_won INTEGER DEFAULT 0,
    total_games_lost INTEGER DEFAULT 0,
    
    -- Ensure unique player per club
    UNIQUE(name, club_name)
);

-- 3. Add league match support to match_fixtures
ALTER TABLE match_fixtures 
ADD COLUMN IF NOT EXISTS match_type VARCHAR(20) DEFAULT 'ladder' 
    CHECK (match_type IN ('ladder', 'league')),
ADD COLUMN IF NOT EXISTS team VARCHAR(10) 
    CHECK (team IN ('1sts', '2nds')),
ADD COLUMN IF NOT EXISTS opponent_club VARCHAR(255),
ADD COLUMN IF NOT EXISTS week_number INTEGER;

-- 4. Create league_match_rubbers table for detailed league match tracking
CREATE TABLE IF NOT EXISTS league_match_rubbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_fixture_id UUID REFERENCES match_fixtures(id) ON DELETE CASCADE,
    rubber_number INTEGER NOT NULL, -- 1-9 (3 pairs × 3 rubbers each)
    
    -- Cawood pair
    cawood_player1_id UUID REFERENCES profiles(id),
    cawood_player2_id UUID REFERENCES profiles(id),
    
    -- Opposition pair  
    opponent_player1_id UUID REFERENCES external_players(id),
    opponent_player2_id UUID REFERENCES external_players(id),
    
    -- Rubber result
    cawood_games_won INTEGER CHECK (cawood_games_won >= 0),
    opponent_games_won INTEGER CHECK (opponent_games_won >= 0),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_rubber_number CHECK (rubber_number BETWEEN 1 AND 9),
    CONSTRAINT valid_games_total CHECK (cawood_games_won + opponent_games_won = 12),
    CONSTRAINT unique_rubber_per_match UNIQUE(match_fixture_id, rubber_number)
);

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_external_players_club ON external_players(club_name);
CREATE INDEX IF NOT EXISTS idx_external_players_name ON external_players(name);
CREATE INDEX IF NOT EXISTS idx_match_fixtures_type ON match_fixtures(match_type);
CREATE INDEX IF NOT EXISTS idx_match_fixtures_team ON match_fixtures(team);
CREATE INDEX IF NOT EXISTS idx_league_rubbers_fixture ON league_match_rubbers(match_fixture_id);
CREATE INDEX IF NOT EXISTS idx_league_rubbers_cawood_players ON league_match_rubbers(cawood_player1_id, cawood_player2_id);
CREATE INDEX IF NOT EXISTS idx_seasons_type_status ON seasons(season_type, status);

-- 6. Create trigger to update external_players stats when rubbers are added/updated
CREATE OR REPLACE FUNCTION update_external_player_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle INSERT and UPDATE
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Update opponent player 1 stats
        UPDATE external_players 
        SET 
            total_rubbers_played = (
                SELECT COUNT(*) 
                FROM league_match_rubbers 
                WHERE opponent_player1_id = NEW.opponent_player1_id 
                   OR opponent_player2_id = NEW.opponent_player1_id
            ),
            total_games_won = (
                SELECT COALESCE(SUM(opponent_games_won), 0)
                FROM league_match_rubbers 
                WHERE opponent_player1_id = NEW.opponent_player1_id 
                   OR opponent_player2_id = NEW.opponent_player1_id
            ),
            total_games_lost = (
                SELECT COALESCE(SUM(cawood_games_won), 0)
                FROM league_match_rubbers 
                WHERE opponent_player1_id = NEW.opponent_player1_id 
                   OR opponent_player2_id = NEW.opponent_player1_id
            ),
            updated_at = NOW()
        WHERE id = NEW.opponent_player1_id;
        
        -- Update opponent player 2 stats
        UPDATE external_players 
        SET 
            total_rubbers_played = (
                SELECT COUNT(*) 
                FROM league_match_rubbers 
                WHERE opponent_player1_id = NEW.opponent_player2_id 
                   OR opponent_player2_id = NEW.opponent_player2_id
            ),
            total_games_won = (
                SELECT COALESCE(SUM(opponent_games_won), 0)
                FROM league_match_rubbers 
                WHERE opponent_player1_id = NEW.opponent_player2_id 
                   OR opponent_player2_id = NEW.opponent_player2_id
            ),
            total_games_lost = (
                SELECT COALESCE(SUM(cawood_games_won), 0)
                FROM league_match_rubbers 
                WHERE opponent_player1_id = NEW.opponent_player2_id 
                   OR opponent_player2_id = NEW.opponent_player2_id
            ),
            updated_at = NOW()
        WHERE id = NEW.opponent_player2_id;
        
        RETURN NEW;
    END IF;
    
    -- Handle DELETE
    IF TG_OP = 'DELETE' THEN
        -- Recalculate stats for both opponent players
        UPDATE external_players 
        SET 
            total_rubbers_played = (
                SELECT COUNT(*) 
                FROM league_match_rubbers 
                WHERE opponent_player1_id = OLD.opponent_player1_id 
                   OR opponent_player2_id = OLD.opponent_player1_id
            ),
            total_games_won = (
                SELECT COALESCE(SUM(opponent_games_won), 0)
                FROM league_match_rubbers 
                WHERE opponent_player1_id = OLD.opponent_player1_id 
                   OR opponent_player2_id = OLD.opponent_player1_id
            ),
            total_games_lost = (
                SELECT COALESCE(SUM(cawood_games_won), 0)
                FROM league_match_rubbers 
                WHERE opponent_player1_id = OLD.opponent_player1_id 
                   OR opponent_player2_id = OLD.opponent_player1_id
            ),
            updated_at = NOW()
        WHERE id = OLD.opponent_player1_id;
        
        UPDATE external_players 
        SET 
            total_rubbers_played = (
                SELECT COUNT(*) 
                FROM league_match_rubbers 
                WHERE opponent_player1_id = OLD.opponent_player2_id 
                   OR opponent_player2_id = OLD.opponent_player2_id
            ),
            total_games_won = (
                SELECT COALESCE(SUM(opponent_games_won), 0)
                FROM league_match_rubbers 
                WHERE opponent_player1_id = OLD.opponent_player2_id 
                   OR opponent_player2_id = OLD.opponent_player2_id
            ),
            total_games_lost = (
                SELECT COALESCE(SUM(cawood_games_won), 0)
                FROM league_match_rubbers 
                WHERE opponent_player1_id = OLD.opponent_player2_id 
                   OR opponent_player2_id = OLD.opponent_player2_id
            ),
            updated_at = NOW()
        WHERE id = OLD.opponent_player2_id;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_external_player_stats ON league_match_rubbers;
CREATE TRIGGER trigger_update_external_player_stats
    AFTER INSERT OR UPDATE OR DELETE ON league_match_rubbers
    FOR EACH ROW EXECUTE FUNCTION update_external_player_stats();

-- 7. Add comment documentation
COMMENT ON TABLE external_players IS 'External players from other clubs for league matches';
COMMENT ON TABLE league_match_rubbers IS 'Individual rubber results for league matches (9 rubbers per match)';
COMMENT ON COLUMN seasons.season_type IS 'Type of season: ladder (internal) or league (external clubs)';
COMMENT ON COLUMN seasons.league_info IS 'JSON object storing league-specific information like division, external league name, etc.';
COMMENT ON COLUMN match_fixtures.match_type IS 'Type of match: ladder (internal pairs) or league (vs external club)';
COMMENT ON COLUMN match_fixtures.team IS 'Cawood team: 1sts or 2nds (for league matches only)';
COMMENT ON COLUMN match_fixtures.opponent_club IS 'Name of opposing club (for league matches only)';
COMMENT ON COLUMN match_fixtures.week_number IS 'Week number in the league season (for league matches only)';

-- 8. Create function to update season player stats for league matches
CREATE OR REPLACE FUNCTION update_season_player_league_stats(
    p_season_id UUID,
    p_player_id UUID,
    p_additional_rubbers INTEGER,
    p_additional_wins INTEGER,
    p_additional_games_won INTEGER,
    p_additional_games_lost INTEGER
)
RETURNS VOID AS $$
BEGIN
    -- Insert or update season_players record
    INSERT INTO season_players (
        season_id,
        player_id,
        matches_played,
        matches_won,
        games_played,
        games_won,
        created_at,
        updated_at
    )
    VALUES (
        p_season_id,
        p_player_id,
        p_additional_rubbers,
        p_additional_wins,
        p_additional_games_won + p_additional_games_lost,
        p_additional_games_won,
        NOW(),
        NOW()
    )
    ON CONFLICT (season_id, player_id) 
    DO UPDATE SET
        matches_played = season_players.matches_played + p_additional_rubbers,
        matches_won = season_players.matches_won + p_additional_wins,
        games_played = season_players.games_played + p_additional_games_won + p_additional_games_lost,
        games_won = season_players.games_won + p_additional_games_won,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- 9. Create function to calculate league season rankings
CREATE OR REPLACE FUNCTION calculate_league_rankings(p_season_id UUID)
RETURNS TABLE (
    player_id UUID,
    player_name TEXT,
    rank INTEGER,
    rubbers_played INTEGER,
    rubbers_won INTEGER,
    games_won INTEGER,
    games_lost INTEGER,
    games_played INTEGER,
    win_percentage NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sp.player_id,
        p.name as player_name,
        ROW_NUMBER() OVER (
            ORDER BY 
                CASE 
                    WHEN sp.games_played > 0 THEN 
                        CAST(sp.games_won AS NUMERIC) / CAST(sp.games_played AS NUMERIC) 
                    ELSE 0 
                END DESC,
                sp.games_won DESC,
                sp.matches_played DESC
        )::INTEGER as rank,
        sp.matches_played as rubbers_played,
        sp.matches_won as rubbers_won,
        sp.games_won,
        (sp.games_played - sp.games_won) as games_lost,
        sp.games_played,
        CASE 
            WHEN sp.games_played > 0 THEN 
                ROUND(CAST(sp.games_won AS NUMERIC) / CAST(sp.games_played AS NUMERIC) * 100, 1)
            ELSE 0 
        END as win_percentage
    FROM season_players sp
    JOIN profiles p ON sp.player_id = p.id
    WHERE sp.season_id = p_season_id
    AND sp.games_played > 0  -- Only include players who have played games
    ORDER BY win_percentage DESC, sp.games_won DESC, sp.matches_played DESC;
END;
$$ LANGUAGE plpgsql;

-- Migration completed successfully