-- ============================================================================
-- ADD JUNIOR PROFILES
-- Run this migration in Supabase Dashboard SQL Editor:
-- https://supabase.com/dashboard/project/hwpjrkmplydqaxiikupv/sql
-- ============================================================================
-- Schedules already exist:
-- - "Juniors Red Ball" (Thursdays 4pm)
-- - "Juniors Green Ball" (Thursdays 5pm)
-- ============================================================================

-- 1. Add coaching_group column to profiles if it doesn't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS coaching_group VARCHAR(50);

-- ============================================================================
-- CREATE JUNIOR PROFILES
-- ============================================================================

-- Update existing accounts to be juniors (Noah Nutbrown, Samuel Best)
UPDATE profiles SET
  is_junior = true,
  coaching_group = 'Juniors Green Ball',
  parent_name = 'Sarah Nutbrown',
  parent_email = 'sarahnutbrown@yahoo.co.uk',
  parent_phone = '07708321267'
WHERE name ILIKE '%Noah Nutbrown%';

UPDATE profiles SET
  is_junior = true,
  coaching_group = 'Juniors Green Ball',
  parent_name = 'Jon Best',
  parent_email = 'best.jon@gmail.com',
  parent_phone = '07878260301'
WHERE name ILIKE '%Samuel Best%';

-- Create new junior profiles
-- Juniors Red Ball group (ages 6-11, Thursdays 4pm)
INSERT INTO profiles (id, name, email, status, role, is_junior, coaching_group, parent_name, parent_email, parent_phone)
VALUES
  (gen_random_uuid(), 'Elijah Baker Cowling', 'elijah.bakercowling@junior.cawood.tennis', 'approved', 'player', true, 'Juniors Red Ball', 'Katie Baker Cowling', 'katiebethcowling@hotmail.co.uk', '07817173179'),
  (gen_random_uuid(), 'Teddy Lunn', 'teddy.lunn@junior.cawood.tennis', 'approved', 'player', true, 'Juniors Red Ball', 'Sarah Lunn', 'sbestwick@gmail.com', '07793540765'),
  (gen_random_uuid(), 'Eddie Smith', 'eddie.smith@junior.cawood.tennis', 'approved', 'player', true, 'Juniors Red Ball', 'Hannah Smith', 'Hannah-j-smith@hotmail.co.uk', '07717203761'),
  (gen_random_uuid(), 'Sophia Smith', 'sophia.smith@junior.cawood.tennis', 'approved', 'player', true, 'Juniors Red Ball', 'Hannah Smith', 'Hannah-j-smith@hotmail.co.uk', '07717203761'),
  (gen_random_uuid(), 'Kei Goto', 'kei.goto@junior.cawood.tennis', 'approved', 'player', true, 'Juniors Red Ball', 'Sophie Goto', 'sophiegoto1807@gmail.com', '07988700224'),
  (gen_random_uuid(), 'Joshua Best', 'joshua.best@junior.cawood.tennis', 'approved', 'player', true, 'Juniors Red Ball', 'Jon Best', 'best.jon@gmail.com', '07878260301'),
  (gen_random_uuid(), 'Martha Metcalfe', 'martha.metcalfe@junior.cawood.tennis', 'approved', 'player', true, 'Juniors Red Ball', 'Janet Metcalfe', 'janet.r.metcalfe@gmail.com', '07780787287'),
  (gen_random_uuid(), 'Hanna Gledhill', 'hanna.gledhill@junior.cawood.tennis', 'approved', 'player', true, 'Juniors Red Ball', 'Barbara Gledhill', 'basiapyka@op.pl', '07736107878'),
  (gen_random_uuid(), 'Ewa Gledhill', 'ewa.gledhill@junior.cawood.tennis', 'approved', 'player', true, 'Juniors Red Ball', 'Barbara Gledhill', 'basiapyka@op.pl', '07736107878'),
  (gen_random_uuid(), 'William Andrew Garner', 'william.garner@junior.cawood.tennis', 'approved', 'player', true, 'Juniors Red Ball', 'Sam Garner', 'samanthagarner91@outlook.com', '07887493638'),
  (gen_random_uuid(), 'Daniel Taylor', 'daniel.taylor@junior.cawood.tennis', 'approved', 'player', true, 'Juniors Red Ball', 'Nicola Cleghorn', 'nicki142@yahoo.com', '07894166400'),
  (gen_random_uuid(), 'Alex Taylor', 'alex.taylor@junior.cawood.tennis', 'approved', 'player', true, 'Juniors Red Ball', 'Nicola Cleghorn', 'nicki142@yahoo.com', '07894166400'),
  (gen_random_uuid(), 'Grace Evelyn Stones', 'grace.stones@junior.cawood.tennis', 'approved', 'player', true, 'Juniors Red Ball', 'Samantha Stones', 'Sam.carlton1988@gmail.com', '07541063512'),
  (gen_random_uuid(), 'Joey Astin', 'joey.astin@junior.cawood.tennis', 'approved', 'player', true, 'Juniors Red Ball', 'Vicki Astin', 'vicki.astin@bodge.it', '07719502910'),
  (gen_random_uuid(), 'Nicole Astin', 'nicole.astin@junior.cawood.tennis', 'approved', 'player', true, 'Juniors Red Ball', 'Vicki Astin', 'vicki.astin@bodge.it', '07719502910'),
  (gen_random_uuid(), 'Jemma Richmond', 'jemma.richmond@junior.cawood.tennis', 'approved', 'player', true, 'Juniors Red Ball', 'Jen Richmond', 'rollason_60@hotmail.com', '07540866315'),
  (gen_random_uuid(), 'Leo Richmond', 'leo.richmond@junior.cawood.tennis', 'approved', 'player', true, 'Juniors Red Ball', 'Jen Richmond', 'rollason_60@hotmail.com', '07540866315'),
  (gen_random_uuid(), 'Max Willis', 'max.willis@junior.cawood.tennis', 'approved', 'player', true, 'Juniors Red Ball', 'John Willis', 'willisinoz@hotmail.com', '07568140135'),
  (gen_random_uuid(), 'Leo Willis', 'leo.willis@junior.cawood.tennis', 'approved', 'player', true, 'Juniors Red Ball', 'John Willis', 'willisinoz@hotmail.com', '07568140135'),
  (gen_random_uuid(), 'Alaric Ballard', 'alaric.ballard@junior.cawood.tennis', 'approved', 'player', true, 'Juniors Red Ball', 'Sophie Ballard', 'sophieballard1004@gmail.com', '07943751071'),
  (gen_random_uuid(), 'Jack Bruce', 'jack.bruce@junior.cawood.tennis', 'approved', 'player', true, 'Juniors Red Ball', 'Daniel Bruce', 'dan.bruce@northscout.co.uk', '07875639032'),
  (gen_random_uuid(), 'Scarlett Jevens', 'scarlett.jevens@junior.cawood.tennis', 'approved', 'player', true, 'Juniors Red Ball', 'Vicky Jevens', 'jevensv@setschools.uk', '07743650177'),
  (gen_random_uuid(), 'Noah Davenport', 'noah.davenport@junior.cawood.tennis', 'approved', 'player', true, 'Juniors Red Ball', 'Vickie Davenport', 'vickiedavenport82@googlemail.com', '07766083825'),
  (gen_random_uuid(), 'Nicholas Joseph Savvaidis-Green', 'nicholas.savvaidis@junior.cawood.tennis', 'approved', 'player', true, 'Juniors Red Ball', 'Emma Savvaidis', 'evsavv@yahoo.co.uk', '07532828229');

-- Juniors Green Ball group (ages 11+, Thursdays 5pm)
INSERT INTO profiles (id, name, email, status, role, is_junior, coaching_group, parent_name, parent_email, parent_phone)
VALUES
  (gen_random_uuid(), 'Ivy Rose Garner', 'ivy.garner@junior.cawood.tennis', 'approved', 'player', true, 'Juniors Green Ball', 'Sam Garner', 'samanthagarner91@outlook.com', '07887493638'),
  (gen_random_uuid(), 'Andriy', 'andriy@junior.cawood.tennis', 'approved', 'player', true, 'Juniors Green Ball', 'Uliana', 'guruljana8421@gmail.com', '07835364341'),
  (gen_random_uuid(), 'Isaac Nutbrown', 'isaac.nutbrown@junior.cawood.tennis', 'approved', 'player', true, 'Juniors Green Ball', 'Sarah Nutbrown', 'sarahnutbrown@yahoo.co.uk', '07708321267'),
  (gen_random_uuid(), 'George Richmond', 'george.richmond@junior.cawood.tennis', 'approved', 'player', true, 'Juniors Green Ball', 'Jen Richmond', 'rollason_60@hotmail.com', '07540866315'),
  (gen_random_uuid(), 'Jack Jollands', 'jack.jollands@junior.cawood.tennis', 'approved', 'player', true, 'Juniors Green Ball', 'Helen Darley', 'darleyhelen80@yahoo.com', '07841758739');

-- ============================================================================
-- ENROLL JUNIORS IN THEIR COACHING SCHEDULES
-- ============================================================================

-- Enroll all Red Ball juniors in the "Juniors Red Ball" schedule
INSERT INTO coaching_schedule_enrollments (schedule_id, player_id, is_active)
SELECT
  (SELECT id FROM coaching_schedules WHERE session_type = 'Juniors Red Ball' LIMIT 1),
  p.id,
  true
FROM profiles p
WHERE p.coaching_group = 'Juniors Red Ball'
  AND p.is_junior = true
ON CONFLICT (schedule_id, player_id) DO UPDATE SET is_active = true;

-- Enroll all Green Ball juniors in the "Juniors Green Ball" schedule
INSERT INTO coaching_schedule_enrollments (schedule_id, player_id, is_active)
SELECT
  (SELECT id FROM coaching_schedules WHERE session_type = 'Juniors Green Ball' LIMIT 1),
  p.id,
  true
FROM profiles p
WHERE p.coaching_group = 'Juniors Green Ball'
  AND p.is_junior = true
ON CONFLICT (schedule_id, player_id) DO UPDATE SET is_active = true;

-- ============================================================================
-- VERIFY MIGRATION
-- ============================================================================
SELECT 'Junior profiles created:' as info;
SELECT name, coaching_group, parent_name FROM profiles WHERE is_junior = true ORDER BY coaching_group, name;

SELECT 'Enrollments created:' as info;
SELECT
  cs.session_type,
  COUNT(*) as enrolled_count
FROM coaching_schedule_enrollments cse
JOIN coaching_schedules cs ON cs.id = cse.schedule_id
WHERE cse.is_active = true
  AND cs.session_type LIKE 'Juniors%'
GROUP BY cs.session_type;
