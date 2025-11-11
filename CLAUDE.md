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
REACT_APP_SUPABASE_ANON_KEY=[anon key here]
```

---

## Supabase Configuration

### Project Details
- **Project Reference**: `hwpjrkmplydqaxiikupv`
- **Project URL**: https://hwpjrkmplydqaxiikupv.supabase.co
- **Dashboard**: https://supabase.com/dashboard/project/hwpjrkmplydqaxiikupv

### 📖 Database Schema Documentation
**Always read `SUPABASE_SCHEMA.md` first when starting a session!**

This file is auto-generated on every Claude Code startup and contains:
- Complete list of all database tables
- Table structures with key fields
- Relationships between tables
- Important RPC functions
- Payment status workflows

The schema file is your primary reference for understanding the database structure.

### Access Methods

#### 1. **Supabase Dashboard (Preferred for SQL)**
- Go to: https://supabase.com/dashboard/project/hwpjrkmplydqaxiikupv
- SQL Editor → Run queries directly
- Table Editor → View/edit data with UI
- **Best for**: Running migrations, debugging, viewing data

#### 2. **Claude Code with MCP (Automated)**
Claude Code can execute SQL via MCP (Model Context Protocol):
```javascript
// Claude Code can call:
mcp__supabase__execute_sql
mcp__supabase__list_tables
mcp__supabase__get_advisors
```
**Configuration**: `.mcp.json` (in repo root)
**Access Token**: sbp_1e915da665c3573755dfef9874ab1c93211c1247

**Note**: MCP access can be flaky. If queries fail, fall back to Dashboard method.

#### 3. **Supabase CLI (Local Terminal)**
```bash
# Not currently installed - install if needed:
brew install supabase/tap/supabase

# Then login:
supabase login
```

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

# Set access token
export SUPABASE_ACCESS_TOKEN=sbp_1e915da665c3573755dfef9874ab1c93211c1247

# Deploy
supabase functions deploy send-payment-reminders --project-ref hwpjrkmplydqaxiikupv
```

**Important**: Edge Functions deploy from your LOCAL Mac filesystem, not from git!

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
→ Read `SUPABASE_SCHEMA.md` (auto-generated on startup)
→ If file is missing or outdated, run: `./.claude/generate-schema.sh`

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
