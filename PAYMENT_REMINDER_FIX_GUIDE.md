# Payment Reminder Bug Fix Guide

## Problem Summary
The payment reminder emails were sending successfully, but clicking the link didn't update the database. This was because:

1. **The email system** was designed to update the `coaching_payments` table
2. **The UI** displays data from `coaching_attendance.payment_status`
3. These are two different tables, so updates weren't visible in the app!

## The Fix
The fix updates the payment reminder system to work with the **session-based payment tracking** that your UI uses:
- Token validation now updates `coaching_attendance.payment_status` to `'pending_confirmation'`
- This matches what the admin sees in "Awaiting Confirmation"

## Deployment Steps

### 1. Deploy the Database Changes

**Option A: Using Supabase Dashboard (Recommended)**
1. Open your Supabase project: https://supabase.com/dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy the contents of `fix_payment_reminder_session_based.sql`
5. Paste and click **Run**
6. You should see: "Payment reminder system updated for session-based payments!"

**Option B: Using Supabase CLI** (if you have it installed)
```bash
supabase db execute -f fix_payment_reminder_session_based.sql
```

### 2. Deploy the Edge Function Update

The email sending function has been updated locally. Deploy it:

```bash
# Deploy the updated edge function
supabase functions deploy send-payment-reminders
```

**OR if using Supabase dashboard:**
1. Go to **Edge Functions** in your Supabase dashboard
2. Find `send-payment-reminders`
3. Update the code with the changes from `supabase/functions/send-payment-reminders/index.ts`

### 3. Test the Fix

#### Test 1: Check Functions Exist
Run this in Supabase SQL Editor:
```sql
-- Should return 3 functions
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('validate_payment_token', 'generate_payment_reminder_token', 'get_payments_for_reminder');
```

#### Test 2: Check Token Table Structure
```sql
-- Should include player_id column
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'payment_reminder_tokens';
```

#### Test 3: Send Test Reminder (Optional)
1. Go to your app's Coaching > Payment Management
2. Click "Send Payment Reminders"
3. Select a test player who owes money
4. Send the reminder
5. Check the email link
6. Click the link
7. Verify in admin panel that amount moves to "Awaiting Confirmation"

## How It Works Now

### Flow:
1. **Admin sends reminder** → `get_payments_for_reminder()` finds players with unpaid sessions
2. **Token generated** → `generate_payment_reminder_token()` creates token linked to player_id
3. **Email sent** → Player receives email with link containing token
4. **Player clicks link** → App loads `PaymentConfirmation` component
5. **Token validated** → `validate_payment_token()` marks sessions as 'pending_confirmation'
6. **Admin sees update** → Amount appears in "Awaiting Confirmation" in Payment Management

### Database Changes:
- `coaching_attendance.payment_status` transitions: `'unpaid'` → `'pending_confirmation'` → `'paid'`
- Admin can then confirm the payment using the existing UI controls

## Troubleshooting

### Issue: "Function does not exist"
- Make sure you ran the SQL fix script in Supabase SQL Editor
- Check functions exist with Test 1 query above

### Issue: Token validation fails
- Check browser console for errors
- Verify token hasn't expired (30 day limit)
- Check token hasn't already been used

### Issue: Sessions don't update
- Verify the player has sessions with `payment_status = 'unpaid'`
- Check RLS policies allow updates to coaching_attendance
- Look for errors in Supabase logs

### Issue: Edge function deployment fails
- Make sure you have Supabase CLI installed and logged in
- Verify you're in the correct project directory
- Check that SUPABASE_URL and SUPABASE_ANON_KEY are set

## Verification Query

After deploying, run this to see the current payment status breakdown:

```sql
SELECT
    payment_status,
    COUNT(*) as session_count,
    COUNT(DISTINCT player_id) as player_count,
    SUM(4.00) as total_amount
FROM coaching_attendance ca
INNER JOIN coaching_sessions cs ON cs.id = ca.session_id
WHERE cs.status = 'completed'
GROUP BY payment_status
ORDER BY payment_status;
```

## Files Changed
- ✅ `fix_payment_reminder_session_based.sql` - New database functions (NEEDS DEPLOYMENT)
- ✅ `supabase/functions/send-payment-reminders/index.ts` - Updated to pass player_id
- 📝 `PAYMENT_REMINDER_FIX_GUIDE.md` - This guide

## Need Help?
If you encounter issues:
1. Check Supabase logs: Dashboard → Logs → Database / Edge Functions
2. Check browser console for JavaScript errors
3. Run the diagnostic queries in `diagnose_payment_token_issue.sql`
