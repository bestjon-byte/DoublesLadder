-- Fix: Allow anonymous (non-logged-in) users to view seasons and season_players
-- This is needed because the app loads season data on the login screen

-- Drop the old policy that only allows authenticated users
DROP POLICY IF EXISTS "Anyone can view seasons" ON seasons;
DROP POLICY IF EXISTS "Anyone can view season_players" ON season_players;

-- Create new policies that allow BOTH authenticated AND anonymous users to read
CREATE POLICY "Allow all users to view seasons"
ON seasons FOR SELECT
USING (true);  -- No restriction - anyone can view

CREATE POLICY "Allow all users to view season_players"
ON season_players FOR SELECT
USING (true);  -- No restriction - anyone can view

-- Verify the policies were created
SELECT tablename, policyname, cmd, roles, qual::text
FROM pg_policies
WHERE tablename IN ('seasons', 'season_players')
ORDER BY tablename;
