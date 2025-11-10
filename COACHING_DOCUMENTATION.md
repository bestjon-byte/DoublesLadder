# Coaching Feature Documentation
**Last Updated**: 2025-11-10

## Overview

The coaching feature provides complete session management, attendance tracking, and payment processing for tennis coaching sessions.

---

## Key Features

### 1. **Flexible Session Generation**
Generate coaching sessions with custom start dates and week ranges.

**Database Function**: `coaching_session_generation_function.sql`
- Choose custom start date (defaults to next Monday)
- Select number of weeks ahead (1-12 weeks)
- Automatically creates sessions based on active schedules
- Supports both Adults and Beginners session types

**Usage**:
- Admin → Coaching → Schedule Management → Generate Sessions
- Select start date and number of weeks
- Preview sessions before creation

### 2. **Smart Attendance Tracking**
Intelligent player sorting based on attendance history by session type.

**Database Function**: `coaching_attendance_stats_function.sql`
- Players sorted by attendance frequency (most frequent first)
- Session-type specific (Adults vs Beginners have separate rankings)
- Visual indicators show attendance count (e.g., "5x", "3x")
- TrendingUp icons for players with attendance history

**Usage**:
- Admin → Coaching → Sessions & Attendance
- Click "Add" on any session to mark attendance
- Frequent attendees appear at top of list
- Green badges show attendance count

**Key Insight**: Function includes all players who have attended at least one session, regardless of formal `coaching_access` grants. This allows admins to manually add any player to sessions.

### 3. **Payment Management**
Session-level payment tracking with player and admin workflows.

**Database Schema**: `coaching_payment_restructure.sql`
- Players mark sessions as paid via bank transfer
- Admins confirm payment receipts
- Payment statuses: Unpaid, Pending Confirmation, Paid
- Payment summary per player showing all unpaid/pending sessions

---

## Database Functions

### Session Generation
**File**: `coaching_session_generation_function.sql`

```sql
-- Generate sessions with custom date and week range
SELECT * FROM generate_coaching_sessions(
  weeks_ahead := 4,
  start_from_date := '2025-11-11'
);
```

**Returns**: Generated session details (ID, type, date, time)

### Attendance Statistics
**File**: `coaching_attendance_stats_function.sql`

```sql
-- Get attendance stats for Beginners sessions
SELECT * FROM get_player_attendance_stats_by_type('Beginners');

-- Get stats for all sessions
SELECT * FROM get_player_attendance_stats_by_type(NULL);
```

**Returns**: Player ID, name, email, attendance count, last attended date

**Important**: Includes all players with attendance records, not just those with `coaching_access` grants.

---

## Core Database Schema

### Main Tables

**coaching_schedules**
- Recurring schedule definitions (e.g., "Every Monday 7pm - Adults")
- Admin can activate/deactivate schedules
- Used as templates for session generation

**coaching_sessions**
- Individual session instances with specific dates
- Statuses: scheduled, completed, cancelled
- Linked to coaching_schedules

**coaching_attendance**
- Attendance records linking players to sessions
- Tracks self-registration vs admin-added
- Payment status per attendance record

**coaching_access**
- Optional formal access grants for players
- Used for registration portals (future feature)
- Not required for admin-added attendance

**coaching_payments** (Legacy - being phased out)
- Old payment system before session-level tracking

---

## Common Workflows

### Admin: Generate Sessions
1. Navigate to Coaching → Schedule Management
2. Click "Generate Sessions"
3. Choose start date (defaults to next Monday)
4. Select weeks ahead (1-12)
5. Review preview
6. Confirm generation

### Admin: Mark Attendance
1. Navigate to Coaching → Sessions & Attendance
2. Filter to "Past" or "Upcoming"
3. Click "Add" button on session
4. Modal shows players sorted by attendance frequency
5. Select players (frequent attendees at top with badges)
6. Click "Mark X Players"

### Admin: Manage Payments
1. Navigate to Coaching → Payments
2. View all players with payment summaries
3. See pending confirmations (yellow badges)
4. Click player to see detailed payment history
5. Confirm payments as received

### Player: Register Payment
1. Navigate to Coaching (player view)
2. See list of unpaid sessions
3. Select sessions paid via bank transfer
4. Click "Mark as Paid"
5. Status changes to "Pending Confirmation"
6. Wait for admin confirmation

---

## Troubleshooting

### Stats Not Showing?

**Symptom**: Attendance badges not visible when marking attendance

**Cause**: Database function may be filtering incorrectly

**Solution**: Ensure `coaching_attendance_stats_function.sql` is applied to database. The function should filter by `coaching_attendance` records, NOT `coaching_access` records.

**Test**:
```sql
-- Should return all players who have attended sessions
SELECT * FROM get_player_attendance_stats_by_type('Beginners');
```

See `ATTENDANCE_STATS_ISSUE_RESOLVED.md` for detailed troubleshooting history.

### Session Generation Failing?

**Symptom**: PostgreSQL errors when generating sessions

**Cause**: Column name ambiguity in RETURNS TABLE

**Solution**: Ensure `coaching_session_generation_function.sql` is applied. The function uses `out_` prefixed column names to avoid conflicts.

### No Sessions Generated?

**Symptom**: Generate function succeeds but creates no sessions

**Causes**:
1. No active schedules exist
2. Start date is too far in past
3. Schedules don't match selected session type

**Check**:
```sql
-- View active schedules
SELECT * FROM coaching_schedules WHERE is_active = true;
```

---

## File Reference

### SQL Functions (Apply to Supabase)
- `coaching_schema.sql` - Main database schema and RLS policies
- `coaching_session_generation_function.sql` - Session generation with flexible dates
- `coaching_attendance_stats_function.sql` - Attendance statistics by session type
- `coaching_payment_restructure.sql` - Session-level payment system
- `coaching-import.sql` - Historical data import scripts

### Frontend Components
- `src/hooks/useCoaching.js` - Main coaching hook with all actions
- `src/components/Coaching/` - All coaching UI components
  - `Admin/ScheduleManagement.js` - Session generation interface
  - `Modals/GenerateSessionsModal.js` - Date picker for generation
  - `Modals/MarkAttendanceModal.js` - Multi-select attendance marking
  - `Modals/SessionDetailsModal.js` - Individual session management

### Documentation
- `COACHING_DOCUMENTATION.md` - This file (main reference)
- `ATTENDANCE_STATS_ISSUE_RESOLVED.md` - Troubleshooting reference
- `COACHING_PAYMENT_RESTRUCTURE_README.md` - Payment system details
- `COACHING_IMPORT_COMPLETE.md` - Historical data import notes

---

## Version History

### v1.0.164 (Current)
- ✅ Smart attendance sorting by session type
- ✅ Flexible session generation with custom dates
- ✅ Visual attendance indicators (badges, icons)
- ✅ Fixed attendance stats to include all attendees

### v1.0.162
- ✅ Initial attendance stats implementation
- ❌ Had bug excluding players without coaching_access

### v1.0.161
- ✅ Flexible session generation
- ✅ Custom start dates and week ranges

---

## Future Enhancements

Potential improvements:
- **Bulk WhatsApp Import**: Paste names from WhatsApp poll, auto-select matching players
- **Visual Grouping**: Separator between "Regular Attendees" and "Others"
- **Last Attended Tooltip**: Show date of last attendance on hover
- **Session Type Toggle**: Switch between viewing all stats vs session-specific
- **Registration Portal**: Let players self-register for upcoming sessions (requires coaching_access)
- **Payment Reminders**: Automated email/SMS for unpaid sessions

---

**Generated**: 2025-11-10
**Maintained by**: Tennis Ladder Development Team
