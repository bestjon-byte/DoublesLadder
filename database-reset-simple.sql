-- =====================================================
-- SIMPLIFIED TENNIS LADDER DATABASE RESET 
-- This version avoids RLS policy conflicts during setup
-- =====================================================

-- First, clean up existing data and tables
-- =====================================================

-- Drop all tables in reverse dependency order
DROP TABLE IF EXISTS match_results CASCADE;
DROP TABLE IF EXISTS match_fixtures CASCADE; 
DROP TABLE IF EXISTS availability CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS season_players CASCADE;
DROP TABLE IF EXISTS seasons CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- =====================================================
-- Create Tables WITHOUT RLS (we'll add it later)
-- =====================================================

-- Profiles table (links to Supabase auth)
CREATE TABLE profiles (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'suspended')),
    role TEXT DEFAULT 'player' CHECK (role IN ('player', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seasons table
CREATE TABLE seasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    status TEXT DEFAULT 'active' CHECK (status IN ('upcoming', 'active', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Season Players table (many-to-many with rankings)
CREATE TABLE season_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    rank INTEGER,
    previous_rank INTEGER,
    matches_played INTEGER DEFAULT 0,
    matches_won INTEGER DEFAULT 0,
    games_played INTEGER DEFAULT 0,
    games_won INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(season_id, player_id)
);

-- Matches table (individual weeks within seasons)
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
    week_number INTEGER NOT NULL,
    match_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(season_id, week_number)
);

-- Match Fixtures table (individual games within matches)
CREATE TABLE match_fixtures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    court_number INTEGER NOT NULL,
    game_number INTEGER NOT NULL,
    player1_id UUID NOT NULL REFERENCES profiles(id),
    player2_id UUID NOT NULL REFERENCES profiles(id),
    player3_id UUID NOT NULL REFERENCES profiles(id),
    player4_id UUID NOT NULL REFERENCES profiles(id),
    pair1_player1_id UUID NOT NULL REFERENCES profiles(id),
    pair1_player2_id UUID NOT NULL REFERENCES profiles(id),
    pair2_player1_id UUID NOT NULL REFERENCES profiles(id),
    pair2_player2_id UUID NOT NULL REFERENCES profiles(id),
    sitting_player_id UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Match Results table
CREATE TABLE match_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fixture_id UUID NOT NULL REFERENCES match_fixtures(id) ON DELETE CASCADE,
    pair1_score INTEGER NOT NULL CHECK (pair1_score >= 0),
    pair2_score INTEGER NOT NULL CHECK (pair2_score >= 0),
    submitted_by UUID NOT NULL REFERENCES profiles(id),
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Availability table
CREATE TABLE availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    match_date DATE NOT NULL,
    is_available BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(player_id, match_date)
);

-- =====================================================
-- Insert Sample Data (without RLS conflicts)
-- =====================================================

-- Insert Admin User (placeholder UUID - replace after creating auth user)
INSERT INTO profiles (id, name, email, status, role) VALUES 
('00000000-0000-0000-0000-000000000001', 'Jon Best', 'best.jon@gmail.com', 'approved', 'admin');

-- Insert 10 Dummy Test Users
INSERT INTO profiles (id, name, email, status, role) VALUES 
('00000000-0000-0000-0000-000000000002', 'Alice Johnson', 'alice@example.com', 'approved', 'player'),
('00000000-0000-0000-0000-000000000003', 'Bob Smith', 'bob@example.com', 'approved', 'player'),
('00000000-0000-0000-0000-000000000004', 'Carol Davis', 'carol@example.com', 'approved', 'player'),
('00000000-0000-0000-0000-000000000005', 'David Wilson', 'david@example.com', 'approved', 'player'),
('00000000-0000-0000-0000-000000000006', 'Emma Brown', 'emma@example.com', 'approved', 'player'),
('00000000-0000-0000-0000-000000000007', 'Frank Miller', 'frank@example.com', 'approved', 'player'),
('00000000-0000-0000-0000-000000000008', 'Grace Taylor', 'grace@example.com', 'approved', 'player'),
('00000000-0000-0000-0000-000000000009', 'Henry Garcia', 'henry@example.com', 'approved', 'player'),
('00000000-0000-0000-0000-000000000010', 'Iris Martinez', 'iris@example.com', 'approved', 'player'),
('00000000-0000-0000-0000-000000000011', 'Jack Thompson', 'jack@example.com', 'approved', 'player');

-- Create Default Season (using the same UUID as before for consistency)
INSERT INTO seasons (id, name, start_date, status) VALUES 
('0be6fcbe-ed98-4f6d-bc42-463a9de52f76', 'Season 2025', '2025-01-01', 'active');

-- Add all players to the default season with initial rankings
INSERT INTO season_players (season_id, player_id, rank) VALUES 
('0be6fcbe-ed98-4f6d-bc42-463a9de52f76', '00000000-0000-0000-0000-000000000001', 1),
('0be6fcbe-ed98-4f6d-bc42-463a9de52f76', '00000000-0000-0000-000000000002', 2),
('0be6fcbe-ed98-4f6d-bc42-463a9de52f76', '00000000-0000-0000-0000-000000000003', 3),
('0be6fcbe-ed98-4f6d-bc42-463a9de52f76', '00000000-0000-0000-0000-000000000004', 4),
('0be6fcbe-ed98-4f6d-bc42-463a9de52f76', '00000000-0000-0000-0000-000000000005', 5),
('0be6fcbe-ed98-4f6d-bc42-463a9de52f76', '00000000-0000-0000-0000-000000000006', 6),
('0be6fcbe-ed98-4f6d-bc42-463a9de52f76', '00000000-0000-0000-0000-000000000007', 7),
('0be6fcbe-ed98-4f6d-bc42-463a9de52f76', '00000000-0000-0000-0000-000000000008', 8),
('0be6fcbe-ed98-4f6d-bc42-463a9de52f76', '00000000-0000-0000-0000-000000000009', 9),
('0be6fcbe-ed98-4f6d-bc42-463a9de52f76', '00000000-0000-0000-0000-000000000010', 10),
('0be6fcbe-ed98-4f6d-bc42-463a9de52f76', '00000000-0000-0000-0000-000000000011', 11);

-- Create a sample match for testing
INSERT INTO matches (id, season_id, week_number, match_date) VALUES 
('550e8400-e29b-41d4-a716-446655440000', '0be6fcbe-ed98-4f6d-bc42-463a9de52f76', 1, '2025-09-07');

-- =====================================================
-- Create Helpful Views
-- =====================================================

-- View to see current season standings
CREATE OR REPLACE VIEW current_season_standings AS
SELECT 
    p.name,
    p.email,
    sp.rank,
    sp.matches_played,
    sp.matches_won,
    sp.games_played,
    sp.games_won,
    CASE 
        WHEN sp.games_played > 0 
        THEN ROUND((sp.games_won::decimal / sp.games_played) * 100, 2)
        ELSE 0 
    END as win_percentage
FROM season_players sp
JOIN profiles p ON sp.player_id = p.id
JOIN seasons s ON sp.season_id = s.id
WHERE s.status = 'active'
ORDER BY sp.rank ASC;

-- =====================================================
-- Success Message
-- =====================================================

SELECT 'Simplified database reset complete! ✅' as status,
       'RLS policies NOT enabled - add them manually if needed' as note,
       'Remember to update admin user ID after creating auth user' as reminder;