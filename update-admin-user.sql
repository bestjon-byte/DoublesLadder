-- =====================================================
-- UPDATE ADMIN USER WITH REAL AUTH UUID
-- Run this AFTER creating the auth user in Supabase
-- =====================================================

-- Step 1: Create the auth user in Supabase Dashboard first
-- Go to Authentication > Users > Create User
-- Email: best.jon@gmail.com
-- Password: (choose a secure password)
-- Copy the generated User ID

-- Step 2: Replace 'YOUR_ACTUAL_AUTH_USER_ID' with the real UUID from step 1
-- Then run this script:

UPDATE profiles 
SET id = 'YOUR_ACTUAL_AUTH_USER_ID'  -- Replace with real UUID
WHERE email = 'best.jon@gmail.com';

-- Also update the season_players record
UPDATE season_players 
SET player_id = 'YOUR_ACTUAL_AUTH_USER_ID'  -- Replace with real UUID  
WHERE player_id = '00000000-0000-0000-0000-000000000001';

-- Verify the update worked
SELECT 
    p.id,
    p.name, 
    p.email, 
    p.role,
    sp.rank
FROM profiles p
LEFT JOIN season_players sp ON p.id = sp.player_id
WHERE p.email = 'best.jon@gmail.com';

SELECT 'Admin user updated successfully! ✅' as status;