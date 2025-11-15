# Supabase Auth URL Configuration Fix

## Problem
Password reset emails are pointing to the old URL `ladder-beta.vercel.app` instead of the production URL `https://cawood-tennis.vercel.app`.

## Solution
Update Supabase Auth URL configuration to use the correct production domain.

### Steps to Fix:

1. **Go to Supabase Auth Settings:**
   https://supabase.com/dashboard/project/hwpjrkmplydqaxiikupv/auth/url-configuration

2. **Update Site URL:**
   - Change from: `https://ladder-beta.vercel.app`
   - Change to: `https://cawood-tennis.vercel.app`

3. **Update Redirect URLs:**
   - Remove: `https://ladder-beta.vercel.app/**`
   - Add: `https://cawood-tennis.vercel.app/**`
   - Keep: `http://localhost:3000/**` (for local development)

4. **Verify Email Templates:**
   Go to: https://supabase.com/dashboard/project/hwpjrkmplydqaxiikupv/auth/templates

   Check these templates and ensure they reference the correct URL:
   - Confirm signup
   - Invite user
   - Magic Link
   - Change Email Address
   - **Reset Password** ← This is the important one!

5. **Save Changes**

## Testing After Fix:

1. Clear browser cache (or use incognito mode)
2. Go to: https://cawood-tennis.vercel.app
3. Click "Forgot your password?"
4. Enter your email
5. Check your inbox for the branded email from `coaching@cawoodtennisclub.co.uk`
6. Verify the link points to `cawood-tennis.vercel.app` (not ladder-beta)
7. Click the link and verify you can reset your password

## Expected Results:

✅ Email comes from: `coaching@cawoodtennisclub.co.uk`
✅ Email has Cawood Tennis Club branding
✅ Link points to: `https://cawood-tennis.vercel.app/reset-password?token=...`
✅ Password reset flow works end-to-end

## If This Doesn't Fix It:

If you're still getting old emails after this fix, check:
1. Browser cache - clear it completely
2. Edge function logs - verify it's deployed and working
3. Resend dashboard - check email delivery status

---

**Created:** 2025-11-15
**Status:** Ready to deploy
