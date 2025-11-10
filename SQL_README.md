# SQL Files Reference

This directory contains the core database functions and schemas for the Tennis Ladder app.

## Coaching System

### Core Schema
- **`coaching_schema.sql`** - Main database schema with all tables and RLS policies
  - Tables: coaching_schedules, coaching_sessions, coaching_attendance, coaching_access
  - Row Level Security policies for admin and player access
  - Indexes for performance optimization

### Functions
- **`coaching_session_generation_function.sql`** - Generate sessions with flexible dates
  - Supports custom start dates and week ranges
  - Apply: Copy contents to Supabase SQL Editor → Run

- **`coaching_attendance_stats_function.sql`** - Get attendance statistics by session type
  - Returns players sorted by attendance frequency
  - Filters by session type (Adults/Beginners/All)
  - Apply: Copy contents to Supabase SQL Editor → Run

### Payment System
- **`coaching_payment_restructure.sql`** - Session-level payment tracking
  - Player marks sessions as paid
  - Admin confirms payment receipts
  - Payment statuses: Unpaid, Pending, Paid

### Data Import
- **`coaching-import.sql`** - Historical data import scripts
  - Import past sessions and attendance from CSV
  - Used for initial system setup

## ELO Rating System

- **`elo_management_functions.sql`** - ELO rating calculations for ladder
  - Player ranking algorithms
  - Match result processing
  - Season management

## Usage

### Apply a Function to Supabase

1. Go to: https://supabase.com/dashboard/project/hwpjrkmplydqaxiikupv/sql/new
2. Open the SQL file
3. Copy entire contents
4. Paste into Supabase SQL Editor
5. Click "Run"

### Test a Function

```sql
-- Test session generation
SELECT * FROM generate_coaching_sessions(
  weeks_ahead := 4,
  start_from_date := '2025-11-11'
);

-- Test attendance stats
SELECT * FROM get_player_attendance_stats_by_type('Beginners');
```

## Documentation

For detailed coaching feature documentation, see:
- `COACHING_DOCUMENTATION.md` - Complete feature guide
- `COACHING_PAYMENT_RESTRUCTURE_README.md` - Payment system details
- `COACHING_IMPORT_COMPLETE.md` - Data import notes

---

**Note**: All SQL files in this directory are production-ready. Temporary/debugging files have been removed. All changes are tracked in git history if needed.
