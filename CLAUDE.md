# Tennis Ladder App - Complete Project Documentation
*Last updated: 2025-11-11*

## Project Overview
**Cawood Tennis Club Management System** - A comprehensive web application for managing tennis ladder competitions, coaching sessions, payments, and player rankings.

- **Live Production**: https://cawood-tennis.vercel.app
- **Framework**: React 18.2.0 (Create React App)
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel
- **Status**: Live in production with active users

---

## Development Environment

### Local Setup (Mac)
```
Working Directory: /Users/macbook/Library/Mobile Documents/com~apple~CloudDocs/GitHub/DoublesLadder.Old
Git Repository: https://github.com/bestjon-byte/DoublesLadder
User: macbook
```

### Essential Commands
```bash
npm install              # Install dependencies
npm start               # Start dev server (localhost:3000)
npm run build           # Production build
npm test                # Run tests

# Deployment
./deploy "commit message"  # Deploy to production
vercel                     # Deploy via Vercel CLI
```

### Environment Variables
Located in `.env.local` (NOT in git - sensitive):
```
REACT_APP_SUPABASE_URL=https://hwpjrkmplydqaxiikupv.supabase.co
REACT_APP_SUPABASE_ANON_KEY=[anon key - for client-side app]
SUPABASE_SECRET_KEY=[secret key - for Claude Code admin access]
```

**Note:** The `SUPABASE_SECRET_KEY` (starts with `sb_secret_`) gives Claude Code full CRUD access to the database, bypassing Row Level Security.

---

## Supabase Configuration

### Project Details
- **Project Reference**: `hwpjrkmplydqaxiikupv`
- **Project URL**: https://hwpjrkmplydqaxiikupv.supabase.co
- **Dashboard**: https://supabase.com/dashboard/project/hwpjrkmplydqaxiikupv

### 📖 Database Access
**Query the live database directly - no static schema files!**

Use the admin scripts (below) to query tables and understand the schema in real-time.
This ensures you always have accurate, up-to-date information rather than stale documentation.

**Quick schema discovery:**
```bash
# List all tables
./.claude/supabase-admin.sh GET 'profiles?limit=1'  # See profile columns
./.claude/supabase-admin.sh GET 'coaching_sessions?limit=1'  # See session columns
```

### Access Methods

#### 1. **Admin Scripts (Full CRUD Access)** ⭐ PRIMARY METHOD
**Use these for ALL database operations - full read/write access!**

```bash
# Read, Update, Insert, Delete - full access
./.claude/supabase-admin.sh GET 'profiles?select=name,email&limit=5'
./.claude/supabase-admin.sh PATCH 'profiles?id=eq.UUID' '{"name":"New Name"}'
./.claude/supabase-admin.sh POST 'coaching_sessions' '{"session_date":"2025-01-31"}'
./.claude/supabase-admin.sh DELETE 'coaching_attendance?id=eq.UUID'

# Call RPC functions with admin access
./.claude/supabase-admin-rpc.sh get_all_players_payment_summary '{}'
```

**Common operations:**
```bash
# Who owes money?
./.claude/supabase-admin-rpc.sh get_all_players_payment_summary '{}'

# Update payment status
./.claude/supabase-admin.sh PATCH 'coaching_attendance?id=eq.UUID' '{"payment_status":"paid"}'

# Get profiles
./.claude/supabase-admin.sh GET 'profiles?select=name,email,role&limit=10'
```

**Why use this**: Uses `SUPABASE_SECRET_KEY` from `.env.local` - bypasses RLS for full CRUD access.

#### 2. **Read-Only Scripts (Legacy - uses anon key)**
These only have read access due to RLS restrictions:
```bash
./.claude/supabase-query.sh 'table_name?filters'
./.claude/supabase-rpc.sh function_name '{"param":"value"}'
```

#### 3. **Supabase Dashboard (For SQL/Migrations)**
- Go to: https://supabase.com/dashboard/project/hwpjrkmplydqaxiikupv
- SQL Editor → Run queries directly
- Table Editor → View/edit data with UI
- **Best for**: Schema changes, complex migrations, debugging

#### 4. **MCP Server (Deprecated - Unreliable)**
Configuration in `.mcp.json` - often fails. Use admin scripts instead.

### Key Database Tables

**Player & Auth:**
- `profiles` - User profiles (links to auth.users)
- `auth.users` - Supabase authentication (managed by Supabase)

**Ladder System:**
- `seasons` - Tennis seasons with start/end dates
- `season_players` - Player rankings per season with ELO scores
- `matches` - Match scheduling and results
- `availability` - Player availability for matches

**Coaching System:**
- `coaching_sessions` - Scheduled coaching sessions
- `coaching_attendance` - Who attended which session (payment tracking here)
- `coaching_schedules` - Recurring schedule templates
- `coaching_payments` - Payment aggregation records
- `payment_reminder_tokens` - Tokenized payment confirmation links

**Key Insight**: Payment status is tracked in `coaching_attendance.payment_status` field:
- `unpaid` → Player owes money
- `pending_confirmation` → Player clicked "I've paid" link
- `paid` → Admin confirmed payment

### Edge Functions (Deployed to Supabase)
Located in: `supabase/functions/`

**Active Functions:**
- `send-payment-reminders` - Sends payment reminder emails via Resend API

**Deploy Edge Functions:**
```bash
# Install Supabase CLI first (if not installed)
brew install supabase/tap/supabase

# Set access token (valid token stored in .mcp.json)
export SUPABASE_ACCESS_TOKEN=sbp_e11296817ca547c235805e3a19b09af84fee13d1

# Deploy
supabase functions deploy send-payment-reminders --project-ref hwpjrkmplydqaxiikupv
```

**Important**: Edge Functions deploy from your LOCAL Mac filesystem, not from git!
**Note**: The access token is also stored in `.mcp.json` for MCP server access.

---

## Vercel Deployment Structure

### Current Configuration (As of 2025-11-11)

**Project**: `ladder` (project ID: prj_H3i3puw9cEvj7PLdwSlAV3qwSwTo)
**Account**: bestjon-byte (team_bhsQHzAUDesfAY00NIC25iap)

### Production Domains
1. **Primary**: `https://cawood-tennis.vercel.app` ✅ (MAIN - used in all emails)
2. **Beta**: `https://ladder-beta.vercel.app`
3. **Auto-generated**: `https://ladder-jons-projects-9634d9db.vercel.app`
4. **Git branch**: `https://ladder-git-main-jons-projects-9634d9db.vercel.app`

**Note**: Domains 3 & 4 are automatically created by Vercel and cannot be removed.

### Deployment Workflow

#### Method 1: Automatic Git Deploy (Recommended)
```bash
git add .
git commit -m "Your message"
git push origin main
# Vercel automatically deploys from GitHub
```

#### Method 2: Vercel CLI
```bash
vercel                    # Deploy to preview
vercel --prod             # Deploy to production
```

#### Method 3: Deploy Script
```bash
./deploy "commit message"
# Commits to git AND deploys to Vercel
```

### Vercel CLI Setup
```bash
# Install (if not installed)
npm install -g vercel

# Login
vercel login

# Link to project
vercel link --project=ladder --yes

# Check current project
vercel project ls
```

### Important: Project Link
Your local directory is linked to the `ladder` project via `.vercel/project.json`:
```json
{
  "projectId": "prj_H3i3puw9cEvj7PLdwSlAV3qwSwTo",
  "orgId": "team_bhsQHzAUDesfAY00NIC25iap",
  "projectName": "ladder"
}
```

**If deployments go to wrong project**:
```bash
rm -rf .vercel
vercel link --project=ladder --yes
```

---

## Working with Claude (CLI vs Web)

### Claude Code (CLI) - Primary Tool ✅
- Works directly on your Mac filesystem
- Files appear instantly in VSCode
- Can run local dev server
- Commits and pushes to git
- **Use this for main development work**

### Claude Web (claude.ai) - Occasional Use
- Works in cloud workspace
- Creates branches directly on GitHub
- Files don't appear locally until you `git pull`
- **Use for quick fixes when away from Mac**

### Workflow Tips
**Before switching tools:**
```bash
# Before using Claude Code (when coming from Claude Web):
git pull origin main

# Before using Claude Web (when working locally):
git push origin main
```

---

## Key Features & Systems

### 1. Payment Reminder System
- **Function**: `send-payment-reminders` (Supabase Edge Function)
- **Email Service**: Resend API
- **From Email**: cawoodtennis@gmail.com
- **Token Expiry**: 30 days
- **Session Cost**: £4.00

**Flow**:
1. Admin sends reminder → Email with tokenized link
2. Player clicks "I've Made the Payment" → `cawood-tennis.vercel.app/?token=UUID`
3. Token validates → Sessions change to `pending_confirmation`
4. Admin confirms → Sessions marked as `paid`

**Recent Fix** (2025-11-11): Payment system now works with session-based tracking. See `PAYMENT_REMINDER_BUG_RESOLVED.md` for details.

### 2. WhatsApp Export
Components generate WhatsApp-friendly text exports:
- `WhatsAppPostGenerator.js` - Match results
- `WhatsAppLeagueExporter.js` - League tables
- Uses: `https://cawood-tennis.vercel.app` as app URL

### 3. ELO Ranking System
- Dynamic player rankings
- Adjusts based on match results
- Stored in `season_players.elo_rating`

---

## Recent Changes & Status

### ✅ Recently Completed
- Payment reminder bug fixes (2025-11-11)
- Merged Claude web branch with session-based payment tracking
- Cleaned up Vercel projects (removed duplicate `tennis-ladder-app`)
- Consolidated to single production domain

### ⚠️ Known Issues
- Supabase MCP access can be unreliable (use Dashboard as fallback)
- Multiple npm start processes sometimes run in background (kill before starting new)

### 🔐 Security Notes
- `.env.local` is NOT in git (contains sensitive keys)
- RLS policies are configured on Supabase
- Payment tokens expire after 30 days

---

## Troubleshooting

### "Can't find table structure" or "Need database schema"
→ Query the live database: `./.claude/supabase-admin.sh GET 'table_name?limit=1'`
→ See `.claude/QUERY_EXAMPLES.md` for common queries

### "Supabase query failed"
→ Use Supabase Dashboard SQL Editor instead: https://supabase.com/dashboard/project/hwpjrkmplydqaxiikupv/sql

### "Deployment went to wrong URL"
→ Check `.vercel/project.json` - should say `"projectName": "ladder"`
→ If wrong, run: `rm -rf .vercel && vercel link --project=ladder --yes`

### "Edge Function not updating"
→ Edge Functions deploy from LOCAL Mac files, not git
→ Pull latest code to Mac first, then: `supabase functions deploy <name>`

### "Payment emails going to wrong domain"
→ Check `APP_URL` in `supabase/functions/send-payment-reminders/index.ts`
→ Should be: `https://cawood-tennis.vercel.app`

### "Files created by Claude Web not showing in VSCode"
→ Run: `git fetch --all && git pull origin main`

---

## Quick Reference

### Important URLs
- **Production App**: https://cawood-tennis.vercel.app
- **Supabase Dashboard**: https://supabase.com/dashboard/project/hwpjrkmplydqaxiikupv
- **GitHub Repo**: https://github.com/bestjon-byte/DoublesLadder
- **Vercel Dashboard**: https://vercel.com/jons-projects-9634d9db/ladder

### Important Files
- `src/supabaseClient.js` - Database connection
- `src/hooks/useAuth.js` - Authentication
- `supabase/functions/send-payment-reminders/index.ts` - Payment emails
- `.env.local` - Environment variables (NOT in git)
- `.vercel/project.json` - Vercel project link

### Support Contacts
- **Email Service (Resend)**: cawoodtennis@gmail.com
- **Supabase Project**: hwpjrkmplydqaxiikupv
- **Vercel Account**: bestjon-byte

---

*This document should be updated whenever major infrastructure changes occur.*
