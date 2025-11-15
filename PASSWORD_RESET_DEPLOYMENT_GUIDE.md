# Password Reset Email Deployment Guide

## Overview
This guide covers deploying the new custom password reset email system that uses Resend for branded, deliverable emails instead of Supabase's default authentication emails.

**Created:** 2025-11-15
**Status:** Ready for deployment

---

## What's Changed

### Before
- Used Supabase's default `resetPasswordForEmail()` function
- Generic, tech-looking emails that could hit spam
- Less control over email design and deliverability

### After
- Custom branded emails via Resend API
- On-brand HTML email template matching club identity
- Token-based system with 1-hour expiry
- Better deliverability from verified domain: `coaching@cawoodtennisclub.co.uk`

---

## Files Created/Modified

### New Files
1. **`supabase/migrations/20250115_password_reset_tokens.sql`**
   - Database migration for password reset tokens table
   - RPC functions for token generation and validation
   - Secure password update function

2. **`supabase/functions/send-password-reset/index.ts`**
   - Edge function for sending password reset emails via Resend
   - Branded email template
   - Security features (no email enumeration)

3. **`PASSWORD_RESET_DEPLOYMENT_GUIDE.md`** (this file)
   - Deployment instructions and documentation

### Modified Files
1. **`src/components/Auth/PasswordReset.js`**
   - Now calls custom edge function instead of Supabase default
   - Better user messaging

2. **`src/components/Auth/PasswordUpdate.js`**
   - Token-based validation instead of Supabase recovery session
   - Calls RPC function to update password securely

---

## Deployment Steps

### Step 1: Run Database Migration

Using Supabase Dashboard SQL Editor (recommended):

1. Go to: https://supabase.com/dashboard/project/hwpjrkmplydqaxiikupv/sql
2. Open the migration file: `supabase/migrations/20250115_password_reset_tokens.sql`
3. Copy the entire SQL content
4. Paste into the SQL Editor
5. Click "Run" to execute

**Verify migration:**
```sql
-- Check that the table was created
SELECT * FROM password_reset_tokens LIMIT 1;

-- Test the token generation function
SELECT * FROM generate_password_reset_token('test@example.com');
```

### Step 2: Deploy Edge Function

From your Mac terminal:

```bash
# Make sure you have the Supabase CLI installed
# (If not: brew install supabase/tap/supabase)

# Set your access token
export SUPABASE_ACCESS_TOKEN=sbp_1e915da665c3573755dfef9874ab1c93211c1247

# Deploy the password reset edge function
supabase functions deploy send-password-reset \
  --project-ref hwpjrkmplydqaxiikupv

# Verify it's deployed
supabase functions list --project-ref hwpjrkmplydqaxiikupv
```

**Set required secrets:**

The edge function needs the `RESEND_API_KEY` secret (should already be set from payment reminders):

```bash
# Check if RESEND_API_KEY is already set
# Go to: https://supabase.com/dashboard/project/hwpjrkmplydqaxiikupv/settings/functions

# If not set, add it via dashboard or CLI
supabase secrets set RESEND_API_KEY=re_... --project-ref hwpjrkmplydqaxiikupv
```

### Step 3: Deploy Frontend Changes

From your project root:

```bash
# Commit changes
git add .
git commit -m "Add custom password reset emails via Resend"

# Push to GitHub (triggers automatic Vercel deployment)
git push origin main

# Or deploy directly with Vercel CLI
vercel --prod
```

### Step 4: Test the Flow

**Important:** Test thoroughly before announcing!

1. **Request Password Reset:**
   - Go to: https://cawood-tennis.vercel.app
   - Click "Forgot your password?"
   - Enter a valid user email
   - Check email inbox (and spam folder)

2. **Verify Email:**
   - Email should come from: `coaching@cawoodtennisclub.co.uk`
   - Subject: "Password Reset Request - Cawood Tennis Club"
   - Should have Cawood Tennis Club branding
   - Reset link should work: `https://cawood-tennis.vercel.app/reset-password?token=UUID`

3. **Reset Password:**
   - Click link in email
   - Should see "Set New Password" form
   - Enter new password (min 6 characters)
   - Should redirect to login after success

4. **Test Edge Cases:**
   - Non-existent email (should still say "email sent" for security)
   - Expired token (wait 1 hour or manually expire in DB)
   - Used token (try clicking link twice)

---

## Testing Checklist

- [ ] Database migration runs without errors
- [ ] Edge function deploys successfully
- [ ] Edge function has RESEND_API_KEY secret set
- [ ] Frontend deploys to Vercel successfully
- [ ] Can request password reset for valid email
- [ ] Email arrives in inbox (not spam)
- [ ] Email has proper branding and formatting
- [ ] Reset link opens correct page
- [ ] Can set new password successfully
- [ ] Can log in with new password
- [ ] Non-existent emails don't reveal error
- [ ] Expired tokens show proper error
- [ ] Used tokens can't be reused

---

## Rollback Plan

If something goes wrong, you can revert:

### Frontend Rollback
```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or deploy previous Vercel deployment via dashboard
# https://vercel.com/jons-projects-9634d9db/ladder/deployments
```

### Edge Function Rollback
```bash
# Delete the edge function
supabase functions delete send-password-reset --project-ref hwpjrkmplydqaxiikupv
```

### Database Rollback
```sql
-- Drop the new table and functions
DROP TABLE IF EXISTS password_reset_tokens CASCADE;
DROP FUNCTION IF EXISTS generate_password_reset_token;
DROP FUNCTION IF EXISTS validate_password_reset_token;
DROP FUNCTION IF EXISTS update_password_with_token;
DROP FUNCTION IF EXISTS cleanup_expired_reset_tokens;
```

**Note:** The old password reset flow will continue to work if you rollback, as we haven't disabled Supabase's default email system.

---

## Environment Variables

Ensure these are set in your environment:

### Frontend (.env.local)
```
REACT_APP_SUPABASE_URL=https://hwpjrkmplydqaxiikupv.supabase.co
REACT_APP_SUPABASE_ANON_KEY=[your-anon-key]
```

### Supabase Edge Functions (via Secrets)
```
RESEND_API_KEY=[your-resend-api-key]
SUPABASE_URL=[auto-set]
SUPABASE_ANON_KEY=[auto-set]
SUPABASE_SERVICE_ROLE_KEY=[auto-set]
```

---

## Monitoring & Maintenance

### Monitor Email Deliverability

1. **Resend Dashboard:** https://resend.com/emails
   - Check email sent status
   - Monitor bounce rates
   - Watch for spam complaints

2. **Supabase Logs:**
   ```bash
   # View edge function logs
   supabase functions logs send-password-reset --project-ref hwpjrkmplydqaxiikupv
   ```

### Clean Up Expired Tokens

Run this periodically (or set up a cron job):

```sql
-- Remove tokens older than 7 days
SELECT cleanup_expired_reset_tokens();
```

### Common Issues

**Issue:** Emails going to spam
- **Solution:** Check Resend domain authentication, add SPF/DKIM records

**Issue:** Edge function timeout
- **Solution:** Check RESEND_API_KEY is set correctly, verify Resend API status

**Issue:** Token validation failing
- **Solution:** Check database migration ran successfully, verify RPC functions exist

---

## Security Considerations

✅ **Email Enumeration Protection:** System doesn't reveal if email exists
✅ **Token Expiry:** 1-hour expiration for reset links
✅ **One-Time Use:** Tokens marked as used after password reset
✅ **Secure Password Update:** Uses SECURITY DEFINER function with proper access control
✅ **HTTPS Only:** All links use https://cawood-tennis.vercel.app

---

## Support & Troubleshooting

### Useful Commands

```bash
# Check edge function deployment
supabase functions list --project-ref hwpjrkmplydqaxiikupv

# View edge function logs
supabase functions logs send-password-reset --project-ref hwpjrkmplydqaxiikupv

# Test email sending manually (from Supabase SQL editor)
SELECT * FROM generate_password_reset_token('test@example.com');

# Check token status
SELECT * FROM password_reset_tokens ORDER BY created_at DESC LIMIT 5;
```

### Links

- **Supabase Dashboard:** https://supabase.com/dashboard/project/hwpjrkmplydqaxiikupv
- **Resend Dashboard:** https://resend.com
- **Production App:** https://cawood-tennis.vercel.app
- **Vercel Deployments:** https://vercel.com/jons-projects-9634d9db/ladder

---

## Next Steps (Optional Improvements)

1. **Add Email Rate Limiting:** Prevent abuse by limiting reset requests per IP/email
2. **Email Templates in DB:** Store email templates in database for easy updates
3. **Multi-language Support:** Add support for different languages
4. **SMS Backup:** Add SMS option for users without email access
5. **Audit Logging:** Track all password reset attempts

---

**Deployment completed by:** Claude Code
**Deployment date:** [To be filled when deployed]
**Deployed by:** [Your name]
