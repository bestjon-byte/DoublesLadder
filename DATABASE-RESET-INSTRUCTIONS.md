# 🏆 Tennis Ladder Database Reset Guide

## 📋 Complete Database Reset & Setup

### Step 1: Clear Existing Auth Users
1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Delete all existing users (or use "Delete all users" if available)
3. This prevents auth/profile mismatches

### Step 2: Run Database Reset Script

**If you get RLS errors, use the simple version:**

**Option A: Full Script (with RLS policies)**
1. Go to **Supabase Dashboard** → **SQL Editor**
2. Create new query
3. Copy and paste the entire content of `database-reset.sql`
4. Click **Run**

**Option B: Simple Script (if RLS errors occur)**
1. Go to **Supabase Dashboard** → **SQL Editor**
2. Create new query  
3. Copy and paste the entire content of `database-reset-simple.sql`
4. Click **Run**

Both will:
   - ✅ Drop all existing tables
   - ✅ Create fresh table structure
   - ✅ Set up proper relationships
   - ✅ Add RLS security policies
   - ✅ Insert 11 test user profiles
   - ✅ Create default season with rankings
   - ✅ Add sample match for testing

### Step 3: Create Admin Auth User
1. Go to **Authentication** → **Users** → **Add User**
2. **Email**: `best.jon@gmail.com`
3. **Password**: Choose a secure password
4. **Email Confirm**: ✅ (checked)
5. Click **Create User**
6. **Copy the generated User ID** (UUID format)

### Step 4: Link Admin Profile
1. Open `update-admin-user.sql`
2. Replace `'YOUR_ACTUAL_AUTH_USER_ID'` with the UUID from Step 3
3. Run the updated script in **SQL Editor**
4. This links your auth user to the admin profile

### Step 5: Test Login
1. Go to your app
2. Log in with `best.jon@gmail.com` + your password
3. You should see:
   - ✅ Login successful
   - ✅ Admin dashboard access
   - ✅ 10 test users ready for ladder
   - ✅ Season 2025 active
   - ✅ Sample match available

## 🧪 Test Users Available

Your database now has these users ready for testing:

| Name | Email | Rank | Status |
|------|-------|------|---------|
| **Jon Best** | best.jon@gmail.com | 1 | Admin |
| Alice Johnson | alice@example.com | 2 | Player |
| Bob Smith | bob@example.com | 3 | Player |
| Carol Davis | carol@example.com | 4 | Player |
| David Wilson | david@example.com | 5 | Player |
| Emma Brown | emma@example.com | 6 | Player |
| Frank Miller | frank@example.com | 7 | Player |
| Grace Taylor | grace@example.com | 8 | Player |
| Henry Garcia | henry@example.com | 9 | Player |
| Iris Martinez | iris@example.com | 10 | Player |
| Jack Thompson | jack@example.com | 11 | Player |

## 🎾 What's Set Up

- **Season 2025** - Active season with all players
- **Week 1 Match** - Sample match on Sept 7th for testing
- **Proper Rankings** - Players ranked 1-11
- **Admin Access** - Full admin controls for Jon Best
- **Clean Database** - No orphaned data or conflicts

## 🔧 If You Need More Test Users

Create additional auth users in Supabase and run:

```sql
INSERT INTO profiles (id, name, email, status, role) VALUES 
('NEW_AUTH_UUID', 'Test User Name', 'email@example.com', 'approved', 'player');

-- Add to current season
INSERT INTO season_players (season_id, player_id, rank) VALUES 
('0be6fcbe-ed98-4f6d-bc42-463a9de52f76', 'NEW_AUTH_UUID', 12);
```

## ✅ Success Indicators

After completing all steps, you should have:
- Clean login with admin account
- Access to all admin functions  
- 10 test users visible in admin panel
- Match creation working
- Player availability setting working
- No "Invalid Date" or "Match not found" errors

Ready to test your multi-season tennis ladder! 🎾