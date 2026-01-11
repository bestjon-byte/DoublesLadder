-- ============================================================================
-- EMERGENCY FIX: Remove recursive RLS policy on profiles
-- ============================================================================
-- The profiles_coach_select policy caused infinite recursion because it
-- queries the profiles table from within a policy on profiles.
-- ============================================================================

-- Drop the problematic policy
DROP POLICY IF EXISTS profiles_coach_select ON profiles;

-- ============================================================================
-- END OF FIX
-- ============================================================================
