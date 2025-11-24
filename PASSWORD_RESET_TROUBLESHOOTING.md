# Password Reset Troubleshooting Guide

## Issue
Password reset emails are not branded and pointing to old URL `ladder-beta.vercel.app`

## Root Cause Analysis

The custom password reset system was deployed but Supabase's **default Auth email templates** still have the old URL configured. This causes confusion when testing.

## How the New System Works

### Frontend Flow:
1. User clicks "Forgot your password?" on login page
2. `AuthScreen.js` switches to `authMode='reset'`
3. `PasswordReset.js` component renders
4. User enters email and clicks "Send Reset Email"
5. Component calls custom edge function: `/functions/v1/send-password-reset`
6. Edge function generates token via `generate_password_reset_token()` RPC
7. Edge function sends branded email via Resend API
8. User clicks link in email → `/reset-password?token=UUID`
9. `PasswordUpdate.js` validates token via `validate_password_reset_token()` RPC
10. User sets new password → `update_password_with_token()` RPC updates password

### Key Components:
- **Frontend**: `src/components/Auth/PasswordReset.js` + `PasswordUpdate.js`
- **Edge Function**: `supabase/functions/send-password-reset/index.ts`
- **Database**: `password_reset_tokens` table + RPC functions
- **Email Service**: Resend API (coaching@cawoodtennisclub.co.uk)

## Fix Steps

### Step 1: Update Supabase Auth URL Configuration

Go to: https://supabase.com/dashboard/project/hwpjrkmplydqaxiikupv/auth/url-configuration

**Site URL:**
- ❌ Old: `https://ladder-beta.vercel.app`
- ✅ New: `https://cawood-tennis.vercel.app`

**Redirect URLs (Add these):**
- `https://cawood-tennis.vercel.app/**`
- `http://localhost:3000/**` (for local dev)

**Remove these:**
- `https://ladder-beta.vercel.app/**`

### Step 2: Verify Edge Function Deployment

From your Mac terminal:

```bash
# List deployed functions
supabase functions list --project-ref hwpjrkmplydqaxiikupv

# You should see: send-password-reset
```

If not deployed:
```bash
export SUPABASE_ACCESS_TOKEN=sbp_1e915da665c3573755dfef9874ab1c93211c1247
supabase functions deploy send-password-reset --project-ref hwpjrkmplydqaxiikupv
```

### Step 3: Verify RESEND_API_KEY Secret

Go to: https://supabase.com/dashboard/project/hwpjrkmplydqaxiikupv/settings/functions

Check that `RESEND_API_KEY` is set (should already exist from payment reminders).

### Step 4: Clear Browser Cache and Test

**Important:** Clear ALL browser cache or use Incognito mode!

1. Go to: https://cawood-tennis.vercel.app
2. Click "Forgot your password?"
3. Enter your email
4. Click "Send Reset Email"
5. Check browser console (F12) for errors
6. Check your email inbox (and spam!)

## Expected vs Actual Results

### ✅ Expected (Working System):

**Email:**
- From: `coaching@cawoodtennisclub.co.uk`
- Subject: "Password Reset Request - Cawood Tennis Club"
- Branded HTML template with club colors
- Link: `https://cawood-tennis.vercel.app/reset-password?token=<UUID>`

**Reset Page:**
- Shows "Set New Password" form
- Token validates successfully
- Can set new password
- Redirects to login after success

### ❌ If You're Getting (Old System):

**Email:**
- From: `noreply@mail.app.supabase.io`
- Generic Supabase template
- Link: `https://ladder-beta.vercel.app/...` or similar

**This means:**
- Edge function is NOT being called
- Supabase's default auth is triggering instead
- Need to debug why edge function isn't working

## Debugging Steps

### 1. Check Browser Console

When you click "Send Reset Email", check browser console (F12 → Console tab):

**Look for:**
```
Calling edge function: https://hwpjrkmplydqaxiikupv.supabase.co/functions/v1/send-password-reset
```

**Error messages:**
- `404 Not Found` → Edge function not deployed
- `401 Unauthorized` → SUPABASE_ANON_KEY issue
- `500 Internal Server Error` → Edge function crashed
- `CORS error` → CORS headers issue

### 2. Check Edge Function Logs

From Mac terminal:
```bash
# View recent logs
supabase functions logs send-password-reset --project-ref hwpjrkmplydqaxiikupv

# Or view in dashboard:
# https://supabase.com/dashboard/project/hwpjrkmplydqaxiikupv/functions/send-password-reset/logs
```

**Look for:**
- Token generation errors
- Resend API errors
- Database RPC errors

### 3. Test Edge Function Directly

```bash
curl -X POST \
  https://hwpjrkmplydqaxiikupv.supabase.co/functions/v1/send-password-reset \
  -H "Authorization: Bearer <SUPABASE_ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"email":"your-test-email@example.com"}'
```

**Expected response:**
```json
{
  "success": true,
  "message": "If an account exists with that email, a password reset link has been sent."
}
```

### 4. Check Database Migration

In Supabase SQL Editor:
```sql
-- Check table exists
SELECT COUNT(*) FROM password_reset_tokens;

-- Check functions exist
SELECT proname FROM pg_proc WHERE proname LIKE '%password_reset%';

-- Expected functions:
-- - generate_password_reset_token
-- - validate_password_reset_token
-- - update_password_with_token
-- - cleanup_expired_reset_tokens
```

### 5. Test Token Generation Manually

```sql
-- Test token generation
SELECT * FROM generate_password_reset_token('your-email@example.com');

-- Should return: { token: UUID, expires_at: timestamp }

-- Check token was created
SELECT * FROM password_reset_tokens ORDER BY created_at DESC LIMIT 5;
```

## Common Issues & Solutions

### Issue: Getting old Supabase email
**Cause:** Supabase Auth URL config not updated OR edge function failing
**Fix:** Follow Step 1 above + check edge function logs

### Issue: "No reset token found" error
**Cause:** Token doesn't exist in database OR token expired
**Fix:**
- Check token exists: `SELECT * FROM password_reset_tokens WHERE token = '<token-from-url>'`
- Check token hasn't expired: `expires_at > NOW()`
- Check token hasn't been used: `used_at IS NULL`

### Issue: Edge function returns 404
**Cause:** Edge function not deployed
**Fix:** Deploy edge function (see Step 2)

### Issue: Edge function returns 500
**Cause:** RESEND_API_KEY missing OR RPC functions don't exist
**Fix:**
- Check secrets (Step 3)
- Run database migration (check Step 4 in troubleshooting)

### Issue: Email not arriving
**Cause:** Resend API issue OR email going to spam
**Fix:**
- Check Resend dashboard: https://resend.com/emails
- Check spam folder
- Check edge function logs for Resend errors

## Manual Testing Checklist

- [ ] Supabase Auth URLs updated to cawood-tennis.vercel.app
- [ ] Edge function deployed and listed
- [ ] RESEND_API_KEY secret configured
- [ ] Database migration run successfully
- [ ] Browser cache cleared
- [ ] Password reset request from app login page
- [ ] Browser console shows no errors
- [ ] Email received from coaching@cawoodtennisclub.co.uk
- [ ] Email has branded template
- [ ] Link points to cawood-tennis.vercel.app
- [ ] Token validates successfully
- [ ] Can set new password
- [ ] Can log in with new password

## Need Help?

**Useful Links:**
- Supabase Dashboard: https://supabase.com/dashboard/project/hwpjrkmplydqaxiikupv
- Edge Function Logs: https://supabase.com/dashboard/project/hwpjrkmplydqaxiikupv/functions
- Resend Dashboard: https://resend.com/emails
- Production App: https://cawood-tennis.vercel.app

**Files to Check:**
- Frontend: `src/components/Auth/PasswordReset.js`
- Frontend: `src/components/Auth/PasswordUpdate.js`
- Edge Function: `supabase/functions/send-password-reset/index.ts`
- Migration: `supabase/migrations/20250115_password_reset_tokens.sql`

---

**Last Updated:** 2025-11-15
