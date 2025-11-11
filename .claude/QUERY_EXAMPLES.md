# Supabase Query Examples
*Reliable alternatives to MCP - using direct PostgREST API*

## Quick Reference

### Query Tables (supabase-query.sh)

**Basic queries:**
```bash
# Get all profiles
./.claude/supabase-query.sh profiles

# Select specific columns
./.claude/supabase-query.sh 'profiles?select=name,email,role'

# Filter by role
./.claude/supabase-query.sh 'profiles?role=eq.admin'

# Limit results
./.claude/supabase-query.sh 'profiles?limit=10'
```

**Payment queries:**
```bash
# See who owes money
./.claude/supabase-query.sh 'coaching_attendance?select=*,profiles(name,email)&payment_status=eq.unpaid'

# See pending confirmations
./.claude/supabase-query.sh 'coaching_attendance?select=*,profiles(name,email)&payment_status=eq.pending_confirmation'

# Check specific player's sessions
./.claude/supabase-query.sh 'coaching_attendance?select=*,coaching_sessions(session_date)&player_id=eq.YOUR-UUID-HERE'
```

**Coaching queries:**
```bash
# Upcoming sessions
./.claude/supabase-query.sh 'coaching_sessions?status=eq.confirmed&order=session_date.asc&limit=10'

# Sessions with attendance
./.claude/supabase-query.sh 'coaching_sessions?select=*,coaching_attendance(player_id,payment_status)'
```

---

### Call RPC Functions (supabase-rpc.sh)

**Payment functions:**
```bash
# Get all players payment summary
./.claude/supabase-rpc.sh get_all_players_payment_summary

# Get specific player payment summary
./.claude/supabase-rpc.sh get_player_payment_summary '{"p_player_id":"uuid-here","p_session_cost":4.00}'

# Validate payment token
./.claude/supabase-rpc.sh validate_payment_token '{"p_token":"token-uuid-here"}'

# Create payment from unpaid sessions
./.claude/supabase-rpc.sh create_payment_from_unpaid_sessions '{"p_player_id":"uuid-here"}'
```

**Other functions:**
```bash
# Generate sessions for schedule
./.claude/supabase-rpc.sh generate_sessions_for_schedule '{"p_schedule_id":"uuid-here","p_start_date":"2025-01-01","p_end_date":"2025-01-31"}'
```

---

## PostgREST Filter Syntax

### Comparison operators:
- `eq` - Equal: `?age=eq.18`
- `neq` - Not equal: `?age=neq.18`
- `gt` - Greater than: `?age=gt.18`
- `gte` - Greater than or equal: `?age=gte.18`
- `lt` - Less than: `?age=lt.18`
- `lte` - Less than or equal: `?age=lte.18`

### Text operators:
- `like` - Pattern matching: `?name=like.*john*`
- `ilike` - Case-insensitive like: `?name=ilike.*john*`

### Array operators:
- `in` - In list: `?role=in.(admin,coach)`

### Modifiers:
- `select` - Choose columns: `?select=name,email`
- `order` - Sort results: `?order=name.asc`
- `limit` - Limit results: `?limit=10`
- `offset` - Skip results: `?offset=20`

### Resource embedding (joins):
- `profiles(*)` - Join profiles table
- Example: `coaching_attendance?select=*,profiles(name,email)`

---

## Common Use Cases

### "Has this player paid?"
```bash
./.claude/supabase-query.sh 'coaching_attendance?select=payment_status,coaching_sessions(session_date)&player_id=eq.UUID'
```

### "Who owes money?"
```bash
./.claude/supabase-rpc.sh get_all_players_payment_summary
# Look for amount_owed > 0
```

### "What payments are pending confirmation?"
```bash
./.claude/supabase-query.sh 'coaching_attendance?select=*,profiles(name),coaching_sessions(session_date)&payment_status=eq.pending_confirmation'
```

### "How many sessions next week?"
```bash
./.claude/supabase-query.sh 'coaching_sessions?session_date=gte.2025-11-18&session_date=lt.2025-11-25&status=eq.confirmed'
```

---

## Tips

1. **Always quote complex queries**: Shell needs quotes for special characters
2. **Use select to reduce data**: Only fetch columns you need
3. **Join with embedding**: Use `table(columns)` syntax for related data
4. **Debug with curl**: If script fails, try curl directly to see error message
5. **Check RLS policies**: If you get no results, might be Row Level Security

---

## Direct curl (if scripts fail)

```bash
# Read ANON_KEY from .env.local
ANON_KEY=$(grep REACT_APP_SUPABASE_ANON_KEY .env.local | cut -d '=' -f2)

# Query
curl "https://hwpjrkmplydqaxiikupv.supabase.co/rest/v1/TABLE?FILTERS" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY"

# RPC
curl "https://hwpjrkmplydqaxiikupv.supabase.co/rest/v1/rpc/FUNCTION" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"param":"value"}'
```
