-- Fix Sarah's NULL payment_status and add default for future records
-- Run in Supabase SQL Editor

-- 1. Fix Sarah's record if payment_status is NULL
UPDATE coaching_attendance
SET payment_status = 'unpaid'
WHERE player_id = '9ee52547-4b38-485a-b321-06bfcdb3c562'
  AND payment_status IS NULL;

-- 2. Fix ANY other records with NULL payment_status
UPDATE coaching_attendance
SET payment_status = 'unpaid'
WHERE payment_status IS NULL;

-- 3. Add DEFAULT constraint so future records always have 'unpaid'
ALTER TABLE coaching_attendance
ALTER COLUMN payment_status SET DEFAULT 'unpaid';

-- 4. Make payment_status NOT NULL (after fixing existing NULLs)
ALTER TABLE coaching_attendance
ALTER COLUMN payment_status SET NOT NULL;

-- 5. Verify Sarah now appears in payment summary
SELECT * FROM get_all_players_payment_summary(4.00)
WHERE player_name = 'Sarah Nutbrown';
