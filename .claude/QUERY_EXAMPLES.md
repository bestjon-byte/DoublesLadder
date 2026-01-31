# Supabase Admin Query Examples
*Full CRUD access using secret key*

## Admin Scripts (Full Access)

### Read Data
```bash
# Get all profiles
./.claude/supabase-admin.sh GET 'profiles'

# Select specific columns
./.claude/supabase-admin.sh GET 'profiles?select=name,email,role'

# Filter by role
./.claude/supabase-admin.sh GET 'profiles?role=eq.admin'

# Limit results
./.claude/supabase-admin.sh GET 'profiles?limit=10'

# Join tables (embedding)
./.claude/supabase-admin.sh GET 'coaching_attendance?select=*,profiles(name,email)&payment_status=eq.unpaid'
```

### Update Data
```bash
# Update a record
./.claude/supabase-admin.sh PATCH 'profiles?id=eq.UUID' '{"name":"New Name"}'

# Update payment status
./.claude/supabase-admin.sh PATCH 'coaching_attendance?id=eq.UUID' '{"payment_status":"paid"}'

# Mark multiple sessions as paid (by player)
./.claude/supabase-admin.sh PATCH 'coaching_attendance?player_id=eq.UUID&payment_status=eq.unpaid' '{"payment_status":"paid"}'
```

### Insert Data
```bash
# Insert a new record
./.claude/supabase-admin.sh POST 'coaching_sessions' '{"session_date":"2025-01-31","status":"confirmed"}'
```

### Delete Data
```bash
# Delete a record
./.claude/supabase-admin.sh DELETE 'coaching_attendance?id=eq.UUID'
```

---

## RPC Functions
```bash
# Get all players payment summary
./.claude/supabase-admin-rpc.sh get_all_players_payment_summary

# Get specific player payment summary
./.claude/supabase-admin-rpc.sh get_player_payment_summary '{"p_player_id":"uuid-here","p_session_cost":4.00}'

# Validate payment token
./.claude/supabase-admin-rpc.sh validate_payment_token '{"p_token":"token-uuid-here"}'

# Create payment from unpaid sessions
./.claude/supabase-admin-rpc.sh create_payment_from_unpaid_sessions '{"p_player_id":"uuid-here"}'
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
./.claude/supabase-admin.sh GET 'coaching_attendance?select=payment_status,coaching_sessions(session_date)&player_id=eq.UUID'
```

### "Who owes money?"
```bash
./.claude/supabase-admin-rpc.sh get_all_players_payment_summary
# Look for amount_owed > 0
```

### "Mark player's sessions as paid"
```bash
./.claude/supabase-admin.sh PATCH 'coaching_attendance?player_id=eq.UUID&payment_status=eq.unpaid' '{"payment_status":"paid"}'
```

### "What payments are pending confirmation?"
```bash
./.claude/supabase-admin.sh GET 'coaching_attendance?select=*,profiles(name),coaching_sessions(session_date)&payment_status=eq.pending_confirmation'
```

---

## Key Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User accounts (name, email, role) |
| `coaching_sessions` | Scheduled sessions |
| `coaching_attendance` | Who attended, payment status |
| `coaching_payments` | Payment aggregation records |
| `seasons` | Tennis seasons |
| `season_players` | Player rankings per season |
| `matches` | Match scheduling |
