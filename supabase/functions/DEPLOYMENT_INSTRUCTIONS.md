# Supabase Edge Function Deployment Instructions

## Prerequisites
1. Install Supabase CLI: `npm install -g supabase`
2. Login to Supabase: `supabase login`
3. Link your project: `supabase link --project-ref hwpjrkmplydqaxiikupv`

## Deploy the Edge Function

### Option 1: Deploy via CLI
```bash
supabase functions deploy send-payment-reminders
```

### Option 2: Deploy via Supabase Dashboard
1. Go to https://supabase.com/dashboard/project/hwpjrkmplydqaxiikupv/functions
2. Click "Create a new function"
3. Name: `send-payment-reminders`
4. Copy and paste the code from `supabase/functions/send-payment-reminders/index.ts`
5. Click "Deploy"

## Set Environment Variables
The function needs these environment variables (auto-configured by Supabase):
- `SUPABASE_URL` (automatically set)
- `SUPABASE_ANON_KEY` (automatically set)

## Test the Function

### Using curl:
```bash
curl -X POST https://hwpjrkmplydqaxiikupv.supabase.co/functions/v1/send-payment-reminders \
  -H "Authorization: Bearer YOUR_USER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "filterType": "all"
  }'
```

### Test with amount threshold:
```json
{
  "filterType": "amount_threshold",
  "threshold": 50
}
```

### Test with age threshold (days):
```json
{
  "filterType": "age_threshold",
  "threshold": 14
}
```

## Function URL
After deployment, the function will be available at:
```
https://hwpjrkmplydqaxiikupv.supabase.co/functions/v1/send-payment-reminders
```

## Important Notes
1. **Resend Domain Verification**: Before the "from" address works properly, you need to verify the domain `cawoodtennis@gmail.com` with Resend or use a verified Resend domain
2. **Alternative**: Use Resend's provided email (e.g., `onboarding@resend.dev`) for testing
3. **Production**: Set up proper domain verification in Resend dashboard

## Resend Domain Setup
1. Go to https://resend.com/domains
2. Add your domain or verify Gmail forwarding
3. Update `FROM_EMAIL` in the Edge Function if needed
