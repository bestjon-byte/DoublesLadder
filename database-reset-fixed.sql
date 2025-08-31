-- =====================================================
-- TENNIS LADDER DATABASE RESET - FIXED UUID VERSION
-- Fixes PostgreSQL UUID validation errors
-- =====================================================

-- Drop existing tables
DROP TABLE IF EXISTS match_results CASCADE;
DROP TABLE IF EXISTS match_fixtures CASCADE; 
DROP TABLE IF EXISTS availability CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS season_players CASCADE;
DROP TABLE IF EXISTS seasons CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Create Tables
CREATE TABLE profiles (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'suspended')),
    role TEXT DEFAULT 'player' CHECK (role IN ('player', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE seasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    status TEXT DEFAULT 'active' CHECK (status IN ('upcoming', 'active', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
    week_number INTEGER NOT NULL,
    match_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(season_id, week_number)
);

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

CREATE TABLE availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    match_date DATE NOT NULL,
    is_available BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(player_id, match_date)
);

-- Insert Sample Data with PROPER UUIDs
INSERT INTO profiles (id, name, email, status, role) VALUES 
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Jon Best', 'best.jon@gmail.com', 'approved', 'admin'),
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Alice Johnson', 'alice@example.com', 'approved', 'player'),
('b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Bob Smith', 'bob@example.com', 'approved', 'player'),
('b3eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'Carol Davis', 'carol@example.com', 'approved', 'player'),
('b4eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'David Wilson', 'david@example.com', 'approved', 'player'),
('b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'Emma Brown', 'emma@example.com', 'approved', 'player'),
('b6eebc99-9c0b-4ef8-bb6d-6bb9bd380a17', 'Frank Miller', 'frank@example.com', 'approved', 'player'),
('b7eebc99-9c0b-4ef8-bb6d-6bb9bd380a18', 'Grace Taylor', 'grace@example.com', 'approved', 'player'),
('b8eebc99-9c0b-4ef8-bb6d-6bb9bd380a19', 'Henry Garcia', 'henry@example.com', 'approved', 'player'),
('b9eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', 'Iris Martinez', 'iris@example.com', 'approved', 'player'),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', 'Jack Thompson', 'jack@example.com', 'approved', 'player');

-- Create Default Season
INSERT INTO seasons (id, name, start_date, status) VALUES 
('0be6fcbe-ed98-4f6d-bc42-463a9de52f76', 'Season 2025', '2025-01-01', 'active');

-- Add players to season with rankings
INSERT INTO season_players (season_id, player_id, rank) VALUES 
('0be6fcbe-ed98-4f6d-bc42-463a9de52f76', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 1),
('0be6fcbe-ed98-4f6d-bc42-463a9de52f76', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 2),
('0be6fcbe-ed98-4f6d-bc42-463a9de52f76', 'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 3),
('0be6fcbe-ed98-4f6d-bc42-463a9de52f76', 'b3eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 4),
('0be6fcbe-ed98-4f6d-bc42-463a9de52f76', 'b4eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 5),
('0be6fcbe-ed98-4f6d-bc42-463a9de52f76', 'b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 6),
('0be6fcbe-ed98-4f6d-bc42-463a9de52f76', 'b6eebc99-9c0b-4ef8-bb6d-6bb9bd380a17', 7),
('0be6fcbe-ed98-4f6d-bc42-463a9de52f76', 'b7eebc99-9c0b-4ef8-bb6d-6bb9bd380a18', 8),
('0be6fcbe-ed98-4f6d-bc42-463a9de52f76', 'b8eebc99-9c0b-4ef8-bb6d-6bb9bd380a19', 9),
('0be6fcbe-ed98-4f6d-bc42-463a9de52f76', 'b9eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', 10),
('0be6fcbe-ed98-4f6d-bc42-463a9de52f76', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', 11);

-- Create sample match
INSERT INTO matches (id, season_id, week_number, match_date) VALUES 
('550e8400-e29b-41d4-a716-446655440000', '0be6fcbe-ed98-4f6d-bc42-463a9de52f76', 1, '2025-09-07');

-- Success message
SELECT 'Database reset complete with valid UUIDs! ✅' as status;