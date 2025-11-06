# Coaching Payment System Restructure

## Overview

The coaching payment system has been completely restructured from a payment-request based system to a **session-level payment tracking system**. This provides a much cleaner and more intuitive workflow for both players and admins.

---

## What Changed?

### Old System (Deprecated)
- Admin created "payment requests" that linked to multiple sessions
- Players marked entire payment requests as paid
- Complex junction tables and relationships

### New System
- Payment status tracked directly on each coaching session attendance record
- Players mark individual sessions as paid (with bulk selection support)
- Admin can confirm payments by entering amount received or selecting specific sessions
- Much simpler data model and clearer user workflow

---

## Database Changes Required

**⚠️ CRITICAL:** You must apply the database migration before deploying the code changes.

### How to Apply:

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Open the file: `coaching_payment_restructure.sql`
4. Copy the entire contents
5. Paste into Supabase SQL Editor
6. Run the query

### What the Migration Does:

1. **Adds payment tracking fields to `coaching_attendance` table:**
   - `payment_status` - 'unpaid' | 'pending_confirmation' | 'paid'
   - `user_marked_paid_at` - When player marked session as paid
   - `user_payment_note` - Player's payment reference note
   - `admin_confirmed_at` - When admin confirmed payment
   - `admin_payment_reference` - Admin's payment reference

2. **Creates database functions:**
   - `player_mark_sessions_paid()` - Players mark sessions as paid
   - `admin_confirm_payment()` - Admin confirms by amount (auto-allocates to oldest sessions)
   - `admin_confirm_sessions()` - Admin confirms specific sessions
   - `get_all_players_payment_summary()` - Summary for all players
   - `get_player_payment_summary()` - Summary for specific player
   - `get_player_sessions_by_payment_status()` - Detailed session list grouped by payment status

3. **Creates indexes for performance:**
   - `idx_coaching_attendance_payment_status`
   - `idx_coaching_attendance_player_payment`

---

## User Interface Changes

### For Admins - Payment Management Tab

**New Player-Centric View:**

1. **Statistics Dashboard**
   - Total Owed (from all players with unpaid sessions)
   - Awaiting Confirmation (sessions players marked as paid)
   - Total Received (all-time confirmed payments)

2. **Player List Table**
   - Shows all players with coaching attendance
   - Columns: Player Info | Sessions Count | Owed | To Confirm | Paid
   - Click any player to see detailed session breakdown

3. **Filters:**
   - All Players
   - Owe Money (players with unpaid sessions)
   - To Confirm (players with pending_confirmation sessions)
   - Paid Up (players with no outstanding payments)

4. **Actions:**
   - **Send Payment Reminders** - Generates emails to players with outstanding payments (email system not yet implemented, placeholder for now)
   - **Refresh** - Reload payment data
   - **View Player Details** - Opens modal with session-level breakdown

### Player Payment Modal (Admin)

When admin clicks on a player, they see:

1. **Summary Cards:**
   - Amount Owed | Awaiting Confirmation | Paid

2. **Confirm Payment by Amount:**
   - Admin enters amount received (e.g., £20)
   - System automatically allocates to oldest unpaid sessions first
   - Shows how many sessions were covered and any remaining amount

3. **Manual Session Selection:**
   - Checkbox selection for unpaid and pending_confirmation sessions
   - "Select All" buttons for each group
   - "Confirm Selected" button

4. **Session Lists (Grouped by Status):**
   - **Unpaid Sessions** (yellow) - Can select and confirm
   - **Awaiting Confirmation** (blue) - Shows player notes, can select and confirm
   - **Paid Sessions** (green) - Shows recent 5 paid sessions

### For Players - Payments Tab

**New Session-Based View:**

1. **Summary Cards:**
   - Amount Owed | Awaiting Confirmation | Total Paid
   - Shows session counts for each status

2. **Unpaid Sessions:**
   - Yellow cards showing sessions they attended but haven't paid for
   - Checkbox selection with "Select All" button
   - Shows session date, time, type, and £4.00 cost

3. **Bulk Mark as Paid:**
   - Select multiple unpaid sessions
   - Click "Mark as Paid" button
   - Enter payment reference note (optional)
   - All selected sessions move to "Awaiting Confirmation" status

4. **Awaiting Confirmation Sessions:**
   - Blue cards showing sessions they marked as paid
   - Displays when they marked it and their payment note
   - Waiting for admin to confirm

5. **Paid Sessions:**
   - Green cards showing confirmed paid sessions
   - Shows most recent 5, with count of additional paid sessions

---

## Workflow Examples

### Player Workflow

1. Player attends several coaching sessions
2. Player goes to Coaching → Payments tab
3. Sees unpaid sessions listed (e.g., 5 sessions = £20)
4. Selects all unpaid sessions (or individual ones)
5. Clicks "Mark as Paid"
6. Enters note: "Bank transfer on 06/11/2025"
7. Sessions move to "Awaiting Confirmation" section
8. Admin confirms payment
9. Sessions move to "Paid" section

### Admin Workflow - Confirm by Amount

1. Admin receives bank transfer from John Smith for £20
2. Goes to Coaching → Payments tab
3. Sees John Smith owes £20 (5 unpaid sessions)
4. Clicks on John Smith's row
5. Clicks "Confirm Payment by Amount"
6. Enters: £20
7. Enters reference (optional): "Bank transfer 06/11/2025"
8. System automatically marks John's 5 oldest unpaid sessions as paid

### Admin Workflow - Confirm Specific Sessions

1. Admin sees Sarah Jones has 3 sessions in "Awaiting Confirmation"
2. Clicks on Sarah Jones
3. Sees her sessions with her notes: "Cash payment to coach"
4. Selects all 3 pending sessions
5. Clicks "Confirm Selected"
6. Sessions marked as paid

---

## Migration Strategy

The old payment system (`coaching_payments` table) is still in the database and can be kept for historical records. The new system works independently.

### Recommended Approach:

1. **Apply database migration** (coaching_payment_restructure.sql)
2. **Deploy new code** (already built and ready)
3. **Test with a few sessions** to ensure payment workflow works
4. **Existing payment requests** in the old system will still be visible to admins but won't be used for new sessions

### Data Migration (Optional):

If you have existing unpaid payment requests you want to migrate to the new system, we can create a migration script. However, starting fresh with the new system is recommended since:
- All new sessions will use new system automatically
- Old payment requests can remain for historical reference
- Cleaner separation between old and new data

---

## Future Enhancements (Not Yet Implemented)

### Email Reminder System

**To Do:**
- Create email templates for payment reminders
- Integrate with email service (SendGrid, AWS SES, etc.)
- Track when reminders were sent
- Include session list and total owed in email

The "Send Payment Reminders" button currently shows a placeholder message. When clicked, it will:
1. Find all players with unpaid sessions
2. Generate personalized emails with:
   - Player name
   - List of unpaid sessions (dates, types)
   - Total amount owed
   - Payment instructions
   - Bank transfer details
3. Log reminder sent to database

**Next Steps for Email:**
1. Choose email service provider
2. Create email templates
3. Add email credentials to environment variables
4. Implement email sending function
5. Update "Send Payment Reminders" handler

---

## Files Changed

### Database:
- ✅ `coaching_payment_restructure.sql` - New migration file

### Backend (useCoaching hook):
- ✅ `src/hooks/useCoaching.js` - Added 6 new payment functions

### Admin Components:
- ✅ `src/components/Coaching/Admin/PaymentManagement.js` - Complete rewrite (player-centric table view)
- ✅ `src/components/Coaching/Modals/PlayerPaymentModal.js` - New modal for player payment details

### Player Components:
- ✅ `src/components/Coaching/CoachingUserTab.js` - Restructured payments tab (session-based)

### Build Status:
- ✅ Compiled successfully
- ✅ No errors or warnings
- ✅ Bundle size: 184.07 kB (gzipped)

---

## Testing Checklist

Before going live, test these scenarios:

### As Player:
- [ ] View unpaid sessions in Payments tab
- [ ] Select and mark single session as paid
- [ ] Select and mark multiple sessions as paid (bulk)
- [ ] Verify sessions appear in "Awaiting Confirmation"
- [ ] Check payment summary cards update correctly

### As Admin:
- [ ] View all players payment summary
- [ ] Filter by "Owe Money", "To Confirm", "Paid Up"
- [ ] Click player to see session breakdown
- [ ] Confirm payment by amount (test with £12 = 3 sessions)
- [ ] Confirm specific sessions manually
- [ ] Verify player summary updates after confirmation

### Edge Cases:
- [ ] Player with no sessions (should show empty state)
- [ ] Player marks sessions paid, admin confirms some but not all
- [ ] Admin enters amount that doesn't divide evenly (e.g., £18 = 4.5 sessions → confirms 4 sessions, £2 remaining)

---

## Deployment Instructions

1. ✅ **Apply Database Migration** (Run coaching_payment_restructure.sql in Supabase)
2. ✅ **Code is Already Built** (npm run build completed successfully)
3. **Deploy to Vercel:**
   ```bash
   ./deploy "Restructure coaching payments - session-level tracking with player and admin workflows"
   ```
4. **Test immediately after deployment** (use checklist above)
5. **Monitor for errors** in first few hours

---

## Support Notes

If you encounter issues:

1. **Build fails:** Check that all new files are committed
2. **Database errors:** Verify migration was applied successfully
3. **Missing functions:** Check Supabase logs for function execution errors
4. **Performance issues:** Indexes should handle queries, but monitor if player count grows large

---

## Summary

This restructure provides a much cleaner payment workflow:
- **Players:** See exactly which sessions they haven't paid for, mark them individually or in bulk
- **Admins:** See who owes money at a glance, confirm payments easily by amount or specific sessions
- **System:** Simpler data model, better performance, clearer audit trail

The old payment request system is deprecated but still accessible for historical data.
