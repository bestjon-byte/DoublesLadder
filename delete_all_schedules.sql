-- Emergency cleanup: Delete all schedules to start fresh
-- This avoids the unique constraint issue

DELETE FROM coaching_schedules;

SELECT 'All schedules deleted - you can create new ones now' as status;
