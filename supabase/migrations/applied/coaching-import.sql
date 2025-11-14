-- Coaching Data Import SQL Script
-- Run this as a database admin to bypass RLS

-- Step 1: Clear all coaching test data (preserve ladder data)
DELETE FROM coaching_attendance;
DELETE FROM coaching_payment_sessions;
DELETE FROM coaching_payments;
DELETE FROM coaching_sessions;
DELETE FROM coaching_access;
DELETE FROM coaching_schedules;

-- Step 2: Create ghost accounts for players not in the system
INSERT INTO profiles (id, name, email, status, role, created_at, updated_at)
VALUES
  -- From Adults
  (gen_random_uuid(), 'Andrew D', 'andrew.d@coaching-import.example.com', 'approved', 'player', NOW(), NOW()),
  (gen_random_uuid(), 'Honor R', 'honor.r@coaching-import.example.com', 'approved', 'player', NOW(), NOW()),
  (gen_random_uuid(), 'Nick', 'nick@coaching-import.example.com', 'approved', 'player', NOW(), NOW()),
  (gen_random_uuid(), 'Peter V', 'peter.v@coaching-import.example.com', 'approved', 'player', NOW(), NOW()),
  (gen_random_uuid(), 'Sarah N', 'sarah.n@coaching-import.example.com', 'approved', 'player', NOW(), NOW()),
  (gen_random_uuid(), 'Dave S', 'dave.s@coaching-import.example.com', 'approved', 'player', NOW(), NOW()),

  -- From Beginners
  (gen_random_uuid(), 'Aidan', 'aidan@coaching-import.example.com', 'approved', 'player', NOW(), NOW()),
  (gen_random_uuid(), 'Di', 'di@coaching-import.example.com', 'approved', 'player', NOW(), NOW()),
  (gen_random_uuid(), 'Edward F', 'edward.f@coaching-import.example.com', 'approved', 'player', NOW(), NOW()),
  (gen_random_uuid(), 'Emily F', 'emily.f@coaching-import.example.com', 'approved', 'player', NOW(), NOW()),
  (gen_random_uuid(), 'Holly L', 'holly.l@coaching-import.example.com', 'approved', 'player', NOW(), NOW()),
  (gen_random_uuid(), 'Jock', 'jock@coaching-import.example.com', 'approved', 'player', NOW(), NOW()),
  (gen_random_uuid(), 'Julie S', 'julie.s@coaching-import.example.com', 'approved', 'player', NOW(), NOW()),
  (gen_random_uuid(), 'Karen', 'karen@coaching-import.example.com', 'approved', 'player', NOW(), NOW()),
  (gen_random_uuid(), 'Liv W', 'liv.w@coaching-import.example.com', 'approved', 'player', NOW(), NOW()),
  (gen_random_uuid(), 'Monty H', 'monty.h@coaching-import.example.com', 'approved', 'player', NOW(), NOW()),
  (gen_random_uuid(), 'Sal', 'sal@coaching-import.example.com', 'approved', 'player', NOW(), NOW()),
  (gen_random_uuid(), 'Sarah', 'sarah@coaching-import.example.com', 'approved', 'player', NOW(), NOW()),
  (gen_random_uuid(), 'Sarah B', 'sarah.b@coaching-import.example.com', 'approved', 'player', NOW(), NOW()),
  (gen_random_uuid(), 'Shani', 'shani@coaching-import.example.com', 'approved', 'player', NOW(), NOW()),
  (gen_random_uuid(), 'Tom', 'tom@coaching-import.example.com', 'approved', 'player', NOW(), NOW()),
  (gen_random_uuid(), 'Claire B', 'claire.b@coaching-import.example.com', 'approved', 'player', NOW(), NOW()),
  (gen_random_uuid(), 'Elle S', 'elle.s@coaching-import.example.com', 'approved', 'player', NOW(), NOW()),
  (gen_random_uuid(), 'Lucy D', 'lucy.d@coaching-import.example.com', 'approved', 'player', NOW(), NOW()),
  (gen_random_uuid(), 'Marthe', 'marthe@coaching-import.example.com', 'approved', 'player', NOW(), NOW()),
  (gen_random_uuid(), 'Diccon', 'diccon@coaching-import.example.com', 'approved', 'player', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Step 3: Create temporary helper function to get player ID by name or email
CREATE OR REPLACE FUNCTION get_player_id(player_name TEXT, player_email TEXT DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
  player_uuid UUID;
BEGIN
  IF player_email IS NOT NULL THEN
    SELECT id INTO player_uuid FROM profiles WHERE email = player_email LIMIT 1;
  ELSE
    SELECT id INTO player_uuid FROM profiles WHERE name = player_name LIMIT 1;
  END IF;
  RETURN player_uuid;
END;
$$ LANGUAGE plpgsql;

-- Get admin user ID (Jon Best)
DO $$
DECLARE
  admin_id UUID := (SELECT id FROM profiles WHERE email = 'best.jon@gmail.com');

  -- Adults sessions
  adults_session_1 UUID; adults_session_2 UUID; adults_session_3 UUID; adults_session_4 UUID;
  adults_session_5 UUID; adults_session_6 UUID; adults_session_7 UUID; adults_session_8 UUID;

  -- Beginners sessions
  beginners_session_1 UUID; beginners_session_2 UUID; beginners_session_3 UUID;

BEGIN
  -- Step 4: Create Adults coaching sessions (6pm)
  INSERT INTO coaching_sessions (id, session_date, session_time, session_type, status, created_by, notes, created_at, updated_at)
  VALUES
    (gen_random_uuid(), '2025-07-09', '18:00:00', 'Adults', 'completed', admin_id, 'Imported from historical coaching data', NOW(), NOW()),
    (gen_random_uuid(), '2025-07-16', '18:00:00', 'Adults', 'completed', admin_id, 'Imported from historical coaching data', NOW(), NOW()),
    (gen_random_uuid(), '2025-07-23', '18:00:00', 'Adults', 'completed', admin_id, 'Imported from historical coaching data', NOW(), NOW()),
    (gen_random_uuid(), '2025-07-30', '18:00:00', 'Adults', 'completed', admin_id, 'Imported from historical coaching data', NOW(), NOW()),
    (gen_random_uuid(), '2025-08-06', '18:00:00', 'Adults', 'completed', admin_id, 'Imported from historical coaching data', NOW(), NOW()),
    (gen_random_uuid(), '2025-08-13', '18:00:00', 'Adults', 'completed', admin_id, 'Imported from historical coaching data', NOW(), NOW()),
    (gen_random_uuid(), '2025-08-20', '18:00:00', 'Adults', 'completed', admin_id, 'Imported from historical coaching data', NOW(), NOW()),
    (gen_random_uuid(), '2025-08-27', '18:00:00', 'Adults', 'completed', admin_id, 'Imported from historical coaching data', NOW(), NOW());

  -- Get session IDs for Adults
  SELECT id INTO adults_session_1 FROM coaching_sessions WHERE session_date = '2025-07-09' AND session_type = 'Adults';
  SELECT id INTO adults_session_2 FROM coaching_sessions WHERE session_date = '2025-07-16' AND session_type = 'Adults';
  SELECT id INTO adults_session_3 FROM coaching_sessions WHERE session_date = '2025-07-23' AND session_type = 'Adults';
  SELECT id INTO adults_session_4 FROM coaching_sessions WHERE session_date = '2025-07-30' AND session_type = 'Adults';
  SELECT id INTO adults_session_5 FROM coaching_sessions WHERE session_date = '2025-08-06' AND session_type = 'Adults';
  SELECT id INTO adults_session_6 FROM coaching_sessions WHERE session_date = '2025-08-13' AND session_type = 'Adults';
  SELECT id INTO adults_session_7 FROM coaching_sessions WHERE session_date = '2025-08-20' AND session_type = 'Adults';
  SELECT id INTO adults_session_8 FROM coaching_sessions WHERE session_date = '2025-08-27' AND session_type = 'Adults';

  -- Step 5: Create Beginners coaching sessions (7pm)
  INSERT INTO coaching_sessions (id, session_date, session_time, session_type, status, created_by, notes, created_at, updated_at)
  VALUES
    (gen_random_uuid(), '2025-08-14', '19:00:00', 'Beginners', 'completed', admin_id, 'Imported from historical coaching data', NOW(), NOW()),
    (gen_random_uuid(), '2025-08-21', '19:00:00', 'Beginners', 'completed', admin_id, 'Imported from historical coaching data', NOW(), NOW()),
    (gen_random_uuid(), '2025-08-28', '19:00:00', 'Beginners', 'completed', admin_id, 'Imported from historical coaching data', NOW(), NOW());

  -- Get session IDs for Beginners
  SELECT id INTO beginners_session_1 FROM coaching_sessions WHERE session_date = '2025-08-14' AND session_type = 'Beginners';
  SELECT id INTO beginners_session_2 FROM coaching_sessions WHERE session_date = '2025-08-21' AND session_type = 'Beginners';
  SELECT id INTO beginners_session_3 FROM coaching_sessions WHERE session_date = '2025-08-28' AND session_type = 'Beginners';

  -- Step 6: Insert Adults attendance (with payment status = 'paid')
  -- Session 1: 2025-07-09
  INSERT INTO coaching_attendance (session_id, player_id, marked_by, self_registered, payment_status, admin_confirmed_at, admin_payment_reference, notes, created_at)
  SELECT adults_session_1, id, admin_id, false, 'paid', '2025-07-09', 'Historical import - paid up to date', 'Imported from historical coaching data', NOW()
  FROM profiles WHERE email IN ('cpmeach@gmail.com', 'achrisjo@aol.com', 'honor.r@coaching-import.example.com', 'joanneabbott19@gmail.com', 'markamy@lineone.net', 'markus727@hotmail.co.uk');

  -- Session 2: 2025-07-16
  INSERT INTO coaching_attendance (session_id, player_id, marked_by, self_registered, payment_status, admin_confirmed_at, admin_payment_reference, notes, created_at)
  SELECT adults_session_2, id, admin_id, false, 'paid', '2025-07-16', 'Historical import - paid up to date', 'Imported from historical coaching data', NOW()
  FROM profiles WHERE email IN ('andrew.d@coaching-import.example.com', 'cpmeach@gmail.com', 'markamy@lineone.net', 'peter.v@coaching-import.example.com', 'sarah.n@coaching-import.example.com');

  -- Session 3: 2025-07-23
  INSERT INTO coaching_attendance (session_id, player_id, marked_by, self_registered, payment_status, admin_confirmed_at, admin_payment_reference, notes, created_at)
  SELECT adults_session_3, id, admin_id, false, 'paid', '2025-07-23', 'Historical import - paid up to date', 'Imported from historical coaching data', NOW()
  FROM profiles WHERE email IN ('markamy@lineone.net', 'markus727@hotmail.co.uk', 'mickbrennan6@yahoo.com', 'oxy.abc931be@example.com', 'peter.v@coaching-import.example.com');

  -- Session 4: 2025-07-30
  INSERT INTO coaching_attendance (session_id, player_id, marked_by, self_registered, payment_status, admin_confirmed_at, admin_payment_reference, notes, created_at)
  SELECT adults_session_4, id, admin_id, false, 'paid', '2025-07-30', 'Historical import - paid up to date', 'Imported from historical coaching data', NOW()
  FROM profiles WHERE email IN ('bendrummond470@gmail.com', 'cpmeach@gmail.com', 'markamy@lineone.net', 'mickbrennan6@yahoo.com');

  -- Session 5: 2025-08-06
  INSERT INTO coaching_attendance (session_id, player_id, marked_by, self_registered, payment_status, admin_confirmed_at, admin_payment_reference, notes, created_at)
  SELECT adults_session_5, id, admin_id, false, 'paid', '2025-08-06', 'Historical import - paid up to date', 'Imported from historical coaching data', NOW()
  FROM profiles WHERE email IN ('jamesmurph117@gmail.com', 'markus727@hotmail.co.uk', 'mickbrennan6@yahoo.com', 'peter.v@coaching-import.example.com');

  -- Session 6: 2025-08-13
  INSERT INTO coaching_attendance (session_id, player_id, marked_by, self_registered, payment_status, admin_confirmed_at, admin_payment_reference, notes, created_at)
  SELECT adults_session_6, id, admin_id, false, 'paid', '2025-08-13', 'Historical import - paid up to date', 'Imported from historical coaching data', NOW()
  FROM profiles WHERE email IN ('cpmeach@gmail.com', 'honor.r@coaching-import.example.com', 'best.jon@gmail.com', 'markamy@lineone.net', 'mickbrennan6@yahoo.com', 'peter.v@coaching-import.example.com', 'swb12@icloud.com', 'stephen.parkin@sjpfs.uk.com');

  -- Session 7: 2025-08-20
  INSERT INTO coaching_attendance (session_id, player_id, marked_by, self_registered, payment_status, admin_confirmed_at, admin_payment_reference, notes, created_at)
  SELECT adults_session_7, id, admin_id, false, 'paid', '2025-08-20', 'Historical import - paid up to date', 'Imported from historical coaching data', NOW()
  FROM profiles WHERE email IN ('bev.2447e434@example.com', 'cpmeach@gmail.com', 'best.jon@gmail.com', 'markamy@lineone.net', 'mickbrennan6@yahoo.com', 'oxy.abc931be@example.com');

  -- Session 8: 2025-08-27
  INSERT INTO coaching_attendance (session_id, player_id, marked_by, self_registered, payment_status, admin_confirmed_at, admin_payment_reference, notes, created_at)
  SELECT adults_session_8, id, admin_id, false, 'paid', '2025-08-27', 'Historical import - paid up to date', 'Imported from historical coaching data', NOW()
  FROM profiles WHERE email IN ('bendrummond470@gmail.com', 'bev.2447e434@example.com', 'markus727@hotmail.co.uk', 'markamy@lineone.net', 'oxy.abc931be@example.com');

  -- Step 7: Insert Beginners attendance (with payment status = 'paid')
  -- Session 1: 2025-08-14
  INSERT INTO coaching_attendance (session_id, player_id, marked_by, self_registered, payment_status, admin_confirmed_at, admin_payment_reference, notes, created_at)
  SELECT beginners_session_1, id, admin_id, false, 'paid', '2025-08-14', 'Historical import - paid up to date', 'Imported from historical coaching data', NOW()
  FROM profiles WHERE email IN ('aidan@coaching-import.example.com', 'edward.f@coaching-import.example.com', 'emily.f@coaching-import.example.com', 'holly.l@coaching-import.example.com', 'jock@coaching-import.example.com', 'karen@coaching-import.example.com', 'liz.5e53d15f@example.com', 'sarah@coaching-import.example.com', 'shani@coaching-import.example.com', 'tom@coaching-import.example.com', 'diccon@coaching-import.example.com');

  -- Session 2: 2025-08-21
  INSERT INTO coaching_attendance (session_id, player_id, marked_by, self_registered, payment_status, admin_confirmed_at, admin_payment_reference, notes, created_at)
  SELECT beginners_session_2, id, admin_id, false, 'paid', '2025-08-21', 'Historical import - paid up to date', 'Imported from historical coaching data', NOW()
  FROM profiles WHERE email IN ('aidan@coaching-import.example.com', 'di@coaching-import.example.com', 'emily.f@coaching-import.example.com', 'holly.l@coaching-import.example.com', 'julie.s@coaching-import.example.com', 'liv.w@coaching-import.example.com', 'liz.5e53d15f@example.com', 'monty.h@coaching-import.example.com', 'sal@coaching-import.example.com', 'sarah@coaching-import.example.com', 'sarah.b@coaching-import.example.com', 'tom@coaching-import.example.com');

  -- Session 3: 2025-08-28
  INSERT INTO coaching_attendance (session_id, player_id, marked_by, self_registered, payment_status, admin_confirmed_at, admin_payment_reference, notes, created_at)
  SELECT beginners_session_3, id, admin_id, false, 'paid', '2025-08-28', 'Historical import - paid up to date', 'Imported from historical coaching data', NOW()
  FROM profiles WHERE email IN ('aidan@coaching-import.example.com', 'di@coaching-import.example.com', 'edward.f@coaching-import.example.com', 'holly.l@coaching-import.example.com', 'jock@coaching-import.example.com', 'julie.s@coaching-import.example.com', 'liv.w@coaching-import.example.com', 'liz.5e53d15f@example.com', 'monty.h@coaching-import.example.com', 'sal@coaching-import.example.com', 'sarah@coaching-import.example.com', 'sarah.b@coaching-import.example.com', 'shani@coaching-import.example.com');

END $$;

-- Clean up helper function
DROP FUNCTION get_player_id(TEXT, TEXT);

-- Verification queries
SELECT 'Ghost accounts created:' as step, COUNT(*) as count FROM profiles WHERE email LIKE '%@coaching-import.example.com';
SELECT 'Total sessions created:' as step, COUNT(*) as count FROM coaching_sessions;
SELECT 'Adults sessions:' as step, COUNT(*) as count FROM coaching_sessions WHERE session_type = 'Adults';
SELECT 'Beginners sessions:' as step, COUNT(*) as count FROM coaching_sessions WHERE session_type = 'Beginners';
SELECT 'Total attendance records:' as step, COUNT(*) as count FROM coaching_attendance;
SELECT 'Paid attendance records:' as step, COUNT(*) as count FROM coaching_attendance WHERE payment_status = 'paid';

-- Detailed session summary
SELECT
  session_type,
  session_date,
  session_time,
  COUNT(ca.id) as attendees
FROM coaching_sessions cs
LEFT JOIN coaching_attendance ca ON cs.id = ca.session_id
GROUP BY session_type, session_date, session_time
ORDER BY session_date, session_time;
