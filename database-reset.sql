-- =====================================================
-- TENNIS LADDER DATABASE RESET SCRIPT
-- Complete database reset with multi-season support
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

-- Clear Supabase Auth users (this will cascade delete auth users)
-- Note: This requires superuser privileges, might need to do manually
-- DELETE FROM auth.users;

-- =====================================================
-- Create Tables with Proper Structure
-- =====================================================

-- Profiles table (links to Supabase auth)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
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
-- Enable Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE season_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_fixtures ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (allow authenticated users to read, admins to modify)
-- You might want to adjust these based on your specific requirements

-- Profiles - users can read all, only update their own
CREATE POLICY "Anyone can view profiles" ON profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can do anything with profiles" ON profiles FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Seasons - read for all authenticated, admin only modify
CREATE POLICY "Anyone can view seasons" ON seasons FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage seasons" ON seasons FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Season players - read for all, admin/own record modify
CREATE POLICY "Anyone can view season players" ON season_players FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage season players" ON season_players FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Matches - read for all, admin only modify  
CREATE POLICY "Anyone can view matches" ON matches FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage matches" ON matches FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Match fixtures - read for all, admin only modify
CREATE POLICY "Anyone can view match fixtures" ON match_fixtures FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage match fixtures" ON match_fixtures FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Match results - read for all, players can submit own results
CREATE POLICY "Anyone can view match results" ON match_results FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Players can submit match results" ON match_results FOR INSERT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage match results" ON match_results FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Availability - read for all, users can manage their own
CREATE POLICY "Anyone can view availability" ON availability FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can manage own availability" ON availability FOR ALL USING (auth.uid() = player_id);
CREATE POLICY "Admins can manage all availability" ON availability FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- =====================================================
-- Create Sample Data
-- =====================================================

-- Insert Admin User (you'll need to create the auth user manually in Supabase)
-- Note: The UUID here is a placeholder - replace with actual auth user ID from Supabase
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

-- Create Default Season
INSERT INTO seasons (id, name, start_date, status) VALUES 
('0be6fcbe-ed98-4f6d-bc42-463a9de52f76', 'Season 2025', '2025-01-01', 'active');

-- Add all players to the default season with initial rankings
INSERT INTO season_players (season_id, player_id, rank) VALUES 
('0be6fcbe-ed98-4f6d-bc42-463a9de52f76', '00000000-0000-0000-0000-000000000001', 1),
('0be6fcbe-ed98-4f6d-bc42-463a9de52f76', '00000000-0000-0000-0000-000000000002', 2),
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
-- Create Helpful Views for Development
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
-- Database Setup Complete!
-- =====================================================

-- To complete the setup, you need to:
-- 1. Run this script in Supabase SQL Editor
-- 2. Go to Authentication > Users in Supabase Dashboard
-- 3. Create a new user with email: best.jon@gmail.com
-- 4. Copy the generated User ID and update the admin user record:
--    UPDATE profiles SET id = 'ACTUAL_USER_ID' WHERE email = 'best.jon@gmail.com';
-- 5. Test login with the admin account

SELECT 'Database reset complete! ✅' as status;