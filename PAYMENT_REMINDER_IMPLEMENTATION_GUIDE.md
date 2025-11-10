# Payment Reminder System - Implementation Guide

## 🎯 Overview
Complete email chaser system for outstanding coaching payments with tokenized "I've paid" confirmation links.

## ✅ Features Implemented
- ✅ Admin UI for sending reminders with flexible filters
- ✅ Email sending via Resend API with payment instructions
- ✅ Token-based payment confirmation (no login required)
- ✅ Public redemption page with success/error handling
- ✅ Complete audit trail of sent reminders
- ✅ Bank transfer instructions in every email

---

## 📋 Implementation Steps

### Step 1: Apply Database Migration

Run the SQL file in your Supabase SQL Editor:

```bash
# File location:
payment_reminder_system.sql
```

**What this creates:**
- `payment_reminder_tokens` table - Secure tokens for email links
- `payment_reminder_history` table - Audit log of sent reminders
- Database functions for token generation/validation
- RLS policies for security

**To apply:**
1. Go to https://supabase.com/dashboard/project/hwpjrkmplydqaxiikupv/sql
2. Click "New Query"
3. Copy and paste the entire contents of `payment_reminder_system.sql`
4. Click "Run"

---

### Step 2: Deploy Supabase Edge Function

Deploy the email sending function:

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref hwpjrkmplydqaxiikupv

# Deploy the function
supabase functions deploy send-payment-reminders
```

**Alternative: Manual Deployment**
1. Go to https://supabase.com/dashboard/project/hwpjrkmplydqaxiikupv/functions
2. Click "Create a new function"
3. Name: `send-payment-reminders`
4. Copy code from `supabase/functions/send-payment-reminders/index.ts`
5. Update `APP_URL` constant to your production URL
6. Click "Deploy"

---

### Step 3: Configure Resend Email

#### Option A: Verify Gmail Address (Recommended for Testing)
1. Go to https://resend.com/domains
2. Add `cawoodtennis@gmail.com` for verification
3. Follow Resend's email verification process

#### Option B: Use Resend Sandbox (Immediate Testing)
- Update Edge Function line 7:
  ```typescript
  const FROM_EMAIL = 'onboarding@resend.dev'
  ```
- Emails will only be sent to verified Resend account addresses

#### Option C: Custom Domain (Production)
1. Add your domain in Resend dashboard
2. Configure DNS records (SPF, DKIM, DMARC)
3. Update `FROM_EMAIL` in Edge Function

**API Key:** Already configured (`re_XmpqYGZv_FaXAyDp8n3CDDKWD4qpiC3Qe`)

---

### Step 4: Update Frontend Configuration

Update the Edge Function URL if needed:

```javascript
// File: src/hooks/useCoaching.js
// Line ~858: Verify the Supabase URL is correct

const response = await fetch(
  `${supabase.supabaseUrl}/functions/v1/send-payment-reminders`,
  ...
);
```

---

### Step 5: Deploy Frontend

```bash
# Build and deploy
npm run build
./deploy "Add payment reminder system with email chasers"

# Or deploy via Vercel directly
vercel --prod
```

---

## 🧪 Testing Guide

### Test 1: Database Functions

```sql
-- Test token generation (replace with real payment ID)
SELECT * FROM generate_payment_reminder_token('YOUR_PAYMENT_UUID');

-- Test payment retrieval - All outstanding
SELECT * FROM get_payments_for_reminder('all', NULL);

-- Test payment retrieval - Amount threshold (£20+)
SELECT * FROM get_payments_for_reminder('amount_threshold', 20.00);

-- Test payment retrieval - Age threshold (7+ days)
SELECT * FROM get_payments_for_reminder('age_threshold', 7);
```

### Test 2: Send Reminder Email (via Admin UI)

1. Log in as admin
2. Go to Coaching → Payments tab
3. Click "Send Payment Reminders"
4. Select filter (e.g., "All Outstanding")
5. Preview recipients
6. Click "Send X Reminders"
7. Check your email (or Resend logs)

### Test 3: Token Redemption

1. Open email reminder
2. Click "I've Made the Payment" button
3. Verify you see success page
4. Check database:
   ```sql
   SELECT * FROM payment_reminder_tokens WHERE used_at IS NOT NULL;
   SELECT * FROM coaching_payments WHERE status = 'pending';
   ```

### Test 4: Edge Function (Manual)

```bash
# Get your JWT token (from browser dev tools → Application → Local Storage)
curl -X POST https://hwpjrkmplydqaxiikupv.supabase.co/functions/v1/send-payment-reminders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"filterType": "all"}'
```

---

## 📧 Email Template Details

Each reminder email includes:

✅ Player name and personalized greeting
✅ Amount owed and session count
✅ Date range of sessions
✅ **Bank transfer details:**
   - Bank: Cawood Tennis Club
   - Sort Code: 05-07-62
   - Account: 25134464
   - Reference: [Player Name] Coaching
✅ One-click "I've paid" button (tokenized link)
✅ Alternative login link
✅ Professional club branding

---

## 🔐 Security Features

- ✅ Admin-only access to send reminders (JWT + RLS)
- ✅ Single-use tokens (marked as used after redemption)
- ✅ 30-day token expiration
- ✅ Public token redemption (no auth required)
- ✅ Complete audit trail
- ✅ Rate limiting via Supabase Edge Functions

---

## 🎨 Filter Options

### 1. All Outstanding
Sends to everyone with `status = 'pending'` payments

### 2. Amount Threshold
Example: Send to players owing £50 or more
```javascript
{ filterType: 'amount_threshold', threshold: 50 }
```

### 3. Age Threshold
Example: Send to payments older than 14 days
```javascript
{ filterType: 'age_threshold', threshold: 14 }
```

---

## 📊 Admin Tracking

View reminder history:
```sql
SELECT * FROM get_reminder_history(100);
```

Or in the admin UI:
- Go to Coaching → Payments
- Each player row shows payment status
- Click player to see full payment history

---

## 🔧 Troubleshooting

### Emails Not Sending

1. **Check Edge Function logs:**
   ```bash
   supabase functions logs send-payment-reminders
   ```

2. **Verify Resend API key:**
   - Check if `RESEND_API_KEY` is correct in Edge Function
   - Test API key at https://resend.com/api-keys

3. **Check email status in database:**
   ```sql
   SELECT * FROM payment_reminder_history
   WHERE email_status = 'failed'
   ORDER BY sent_at DESC;
   ```

### Token Not Working

1. **Check token validity:**
   ```sql
   SELECT * FROM payment_reminder_tokens
   WHERE token = 'YOUR_TOKEN_UUID';
   ```

2. **Common issues:**
   - Token already used (`used_at` is not NULL)
   - Token expired (check `expires_at`)
   - Payment already confirmed by admin

### Preview Shows No Recipients

- Verify filter criteria matches your data
- Check that payments exist with `status = 'pending'`
- Run manual SQL query to debug:
  ```sql
  SELECT * FROM coaching_payments WHERE status = 'pending';
  ```

---

## 🚀 Production Checklist

Before launching to users:

- [ ] Database migration applied
- [ ] Edge Function deployed
- [ ] Resend domain verified (or using sandbox)
- [ ] `APP_URL` updated in Edge Function
- [ ] `FROM_EMAIL` configured correctly
- [ ] Frontend deployed
- [ ] Test email sent and received
- [ ] Token redemption tested
- [ ] Admin can view reminder history
- [ ] Bank details correct in email template

---

## 📝 Future Enhancements

Ideas for future improvements:

1. **Scheduled Reminders**
   - Automatic weekly reminders for overdue payments
   - Use Supabase pg_cron or external cron service

2. **Email Customization**
   - Admin UI to edit email templates
   - Personalized message field

3. **SMS Reminders**
   - Integration with Twilio for SMS
   - Fallback if email bounces

4. **Payment Links**
   - Integration with Stripe Payment Links
   - Direct online payment from email

5. **Reminder History UI**
   - Admin page showing all sent reminders
   - Filter by player, date, status

---

## 🆘 Support

Questions or issues?

- **Email:** cawoodtennis@gmail.com
- **Documentation:** This file
- **Database Functions:** See inline comments in `payment_reminder_system.sql`
- **Edge Function:** See inline comments in `supabase/functions/send-payment-reminders/index.ts`

---

## 📄 File Reference

| File | Purpose |
|------|---------|
| `payment_reminder_system.sql` | Database schema, functions, RLS policies |
| `supabase/functions/send-payment-reminders/index.ts` | Email sending Edge Function |
| `src/components/Coaching/Modals/SendReminderModal.js` | Admin UI for sending reminders |
| `src/components/Public/PaymentConfirmation.js` | Public token redemption page |
| `src/hooks/useCoaching.js` | React hooks for reminder functions |
| `src/components/Coaching/Admin/PaymentManagement.js` | Admin payment management UI |

---

**Version:** 1.0.0
**Last Updated:** 2025-11-10
**Status:** Ready for Testing 🎉
