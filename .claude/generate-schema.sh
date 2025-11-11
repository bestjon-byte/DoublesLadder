#!/bin/bash
# Generate Supabase Schema Documentation
# This script runs automatically when Claude Code starts

set -e

SCHEMA_FILE="SUPABASE_SCHEMA.md"
PROJECT_REF="hwpjrkmplydqaxiikupv"
SUPABASE_URL="https://${PROJECT_REF}.supabase.co"
ANON_KEY="${REACT_APP_SUPABASE_ANON_KEY}"

# Try to get anon key from .env.local if not in environment
if [ -z "$ANON_KEY" ] && [ -f ".env.local" ]; then
    ANON_KEY=$(grep REACT_APP_SUPABASE_ANON_KEY .env.local | cut -d '=' -f2)
fi

echo "# Supabase Database Schema" > "$SCHEMA_FILE"
echo "*Auto-generated on $(date)*" >> "$SCHEMA_FILE"
echo "" >> "$SCHEMA_FILE"
echo "**Project**: hwpjrkmplydqaxiikupv" >> "$SCHEMA_FILE"
echo "**URL**: https://hwpjrkmplydqaxiikupv.supabase.co" >> "$SCHEMA_FILE"
echo "" >> "$SCHEMA_FILE"
echo "---" >> "$SCHEMA_FILE"
echo "" >> "$SCHEMA_FILE"

# Always use manual schema documentation (more reliable than API)
echo "## Database Tables" >> "$SCHEMA_FILE"
echo "" >> "$SCHEMA_FILE"

# Manual table list (most reliable approach)
    cat >> "$SCHEMA_FILE" << 'EOF'
### Core Tables

**Authentication & Users:**
- `profiles` - User profiles (id, name, email, role, created_at)
  - Links to auth.users via id
  - Roles: admin, player, coach

**Ladder System:**
- `seasons` - Tennis seasons (id, name, start_date, end_date, is_active, season_type)
  - season_type: 'ladder' | 'league'
- `season_players` - Player rankings per season (id, season_id, player_id, elo_rating, rank)
- `matches` - Match records (id, season_id, match_date, status, court_assignment)
- `availability` - Player availability (id, player_id, season_id, is_available)

**Coaching System:**
- `coaching_sessions` - Scheduled sessions (id, session_date, start_time, status, max_players)
  - status: 'draft', 'confirmed', 'completed', 'cancelled'
- `coaching_attendance` - Session attendance (id, session_id, player_id, payment_status)
  - payment_status: 'unpaid', 'pending_confirmation', 'paid'
- `coaching_schedules` - Recurring schedules (id, day_of_week, start_time, max_players)
- `coaching_payments` - Payment aggregations (id, player_id, amount_due, status, total_sessions)
- `payment_reminder_tokens` - Payment confirmation tokens (id, token, player_id, payment_id, used_at)

**Trophies:**
- `trophies` - Trophy definitions (id, name, description, season_id)
- `trophy_winners` - Trophy awards (id, trophy_id, player_id, season_id, date_awarded)

**Admin:**
- `admin_actions` - Audit log (id, admin_id, action_type, details, timestamp)

### Key Relationships

```
profiles (player_id)
  ├── season_players (player stats per season)
  ├── matches (as player_1 or player_2)
  ├── coaching_attendance (session attendance)
  └── coaching_payments (payment records)

seasons (season_id)
  ├── season_players (rankings)
  ├── matches (season matches)
  └── trophies (season trophies)

coaching_sessions (session_id)
  └── coaching_attendance (who attended)
      └── profiles (player info)
```

### Important Fields

**Payment Status Flow:**
```
coaching_attendance.payment_status:
  unpaid → pending_confirmation → paid
```

**Session Status Flow:**
```
coaching_sessions.status:
  draft → confirmed → completed
```

### Functions & RPCs

**Payment System:**
- `create_payment_from_unpaid_sessions(p_player_id)` - Creates payment record
- `generate_payment_reminder_token(p_payment_id, p_player_id)` - Creates token
- `validate_payment_token(p_token)` - Validates and marks sessions
- `get_player_payment_summary(p_player_id, p_session_cost)` - Payment overview
- `get_all_players_payment_summary()` - All players payment status

**Coaching:**
- `generate_sessions_for_schedule(p_schedule_id, p_start_date, p_end_date)` - Auto-generate sessions

**ELO System:**
- Various ELO calculation functions for ranking updates

EOF

echo "" >> "$SCHEMA_FILE"
echo "---" >> "$SCHEMA_FILE"
echo "" >> "$SCHEMA_FILE"
echo "*For detailed schema: https://supabase.com/dashboard/project/hwpjrkmplydqaxiikupv/editor*" >> "$SCHEMA_FILE"
echo "" >> "$SCHEMA_FILE"
echo "**Last Updated**: $(date)" >> "$SCHEMA_FILE"

echo "✅ Schema documentation generated: $SCHEMA_FILE"
