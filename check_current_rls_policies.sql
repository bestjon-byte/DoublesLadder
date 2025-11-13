-- Check all current RLS policies on key tables
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual::text as using_expression,
  with_check::text as with_check_expression
FROM pg_policies
WHERE tablename IN ('seasons', 'season_players', 'matches', 'profiles', 'availability')
ORDER BY tablename, policyname;
