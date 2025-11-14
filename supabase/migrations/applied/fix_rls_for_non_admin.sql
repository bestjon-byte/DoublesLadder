-- Fix RLS policies to allow all authenticated users to read seasons and season_players
-- Run this in Supabase Dashboard > SQL Editor

-- First, check current policies
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE tablename IN ('seasons', 'season_players')
ORDER BY tablename;

-- Drop any restrictive policies if they exist
DROP POLICY IF EXISTS "Admin only access" ON seasons;
DROP POLICY IF EXISTS "Admin only access" ON season_players;

-- Create read access for ALL authenticated users on seasons table
CREATE POLICY "Anyone can view seasons"
ON seasons FOR SELECT
TO authenticated
USING (true);

-- Create read access for ALL authenticated users on season_players table
CREATE POLICY "Anyone can view season_players"
ON season_players FOR SELECT
TO authenticated
USING (true);

-- Verify RLS is enabled on both tables
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE season_players ENABLE ROW LEVEL SECURITY;

-- Confirm the new policies
SELECT tablename, policyname, cmd, roles, qual
FROM pg_policies
WHERE tablename IN ('seasons', 'season_players')
ORDER BY tablename;
