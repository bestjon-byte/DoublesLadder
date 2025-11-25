# DMARC Setup Instructions for cawoodtennisclub.co.uk

## Problem
Emails are going to spam because DMARC is not configured.

## Solution
Add a DMARC DNS record to your domain.

---

## DNS Record to Add

Log into your DNS provider for `cawoodtennisclub.co.uk` and add:

### Starting Record (Monitoring Mode)
Use this initially to monitor without affecting delivery:

```
Type:  TXT
Name:  _dmarc.cawoodtennisclub.co.uk
Value: v=DMARC1; p=none; rua=mailto:cawoodtennis@gmail.com;
TTL:   3600 (or Auto)
```

**What this does:**
- `v=DMARC1` - Protocol version
- `p=none` - **Monitor only** - doesn't affect delivery, just reports
- `rua=mailto:cawoodtennis@gmail.com` - Where to send weekly reports

---

## Testing Phase (1-2 weeks)

1. **Add the record above** and wait 24-48 hours for DNS propagation
2. **Send test emails** from your app:
   - Payment reminders
   - User approval notifications
   - Password resets
3. **Check if emails go to inbox** (not spam)
4. **Review DMARC reports** sent to cawoodtennis@gmail.com (weekly XML files)

---

## Step 2: Upgrade to Production (After Testing)

Once you confirm emails are being delivered properly, upgrade to a stricter policy:

```
Type:  TXT
Name:  _dmarc.cawoodtennisclub.co.uk
Value: v=DMARC1; p=quarantine; pct=100; rua=mailto:cawoodtennis@gmail.com;
TTL:   3600 (or Auto)
```

**What changed:**
- `p=quarantine` - **Actively protects** - sends unauthorized emails to spam
- `pct=100` - Apply to 100% of emails

---

## Common DNS Provider Instructions

### Cloudflare
1. Log in → Select domain → DNS
2. Add record → Type: TXT
3. Name: `_dmarc` (it auto-adds the domain)
4. Content: `v=DMARC1; p=none; rua=mailto:cawoodtennis@gmail.com;`
5. Save

### GoDaddy
1. Log in → My Products → DNS
2. Add → Type: TXT
3. Name: `_dmarc`
4. Value: `v=DMARC1; p=none; rua=mailto:cawoodtennis@gmail.com;`
5. Save

### Namecheap
1. Log in → Domain List → Manage → Advanced DNS
2. Add New Record → Type: TXT Record
3. Host: `_dmarc`
4. Value: `v=DMARC1; p=none; rua=mailto:cawoodtennis@gmail.com;`
5. Save

---

## Verify It's Working

After 24-48 hours, check the record is live:

1. **Online Tool**: https://mxtoolbox.com/dmarc.aspx
   - Enter: `cawoodtennisclub.co.uk`
   - Should show your DMARC record

2. **Command Line** (Mac Terminal):
   ```bash
   dig TXT _dmarc.cawoodtennisclub.co.uk +short
   ```
   Should return: `"v=DMARC1; p=none; rua=mailto:cawoodtennis@gmail.com;"`

---

## Expected Timeline

- **Day 0**: Add DNS record
- **Day 1-2**: DNS propagates globally
- **Week 1-2**: Monitor delivery and check DMARC reports
- **Week 2**: Upgrade to `p=quarantine` if everything looks good
- **Result**: Emails go to inbox instead of spam ✅

---

## Troubleshooting

**Q: Emails still going to spam after adding DMARC?**
- Wait 48 hours for DNS to propagate fully
- Check record is correct using mxtoolbox.com
- Ensure no typos in the TXT value

**Q: Not receiving DMARC reports?**
- Reports are sent weekly (XML files)
- Check spam folder
- Verify email address in `rua=` is correct

**Q: Want to skip monitoring phase?**
- If you're confident, you can start with `p=quarantine`
- BUT recommended to use `p=none` first to catch any issues

---

## Current Status
- ✅ SPF: Configured (verified by Resend)
- ✅ DKIM: Configured (verified by Resend)
- ❌ DMARC: **NEEDS TO BE ADDED** ← You are here

Once DMARC is added, your email authentication will be complete and emails should go to inbox.
