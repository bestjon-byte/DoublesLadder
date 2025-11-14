# Cawood Tennis Club Management System

**Version:** 1.0.175
**Status:** ✅ Live in Production
**Last Updated:** 2025-11-13

---

## 🎾 Quick Links

- **Production App:** [https://cawood-tennis.vercel.app](https://cawood-tennis.vercel.app)
- **Supabase Dashboard:** [https://supabase.com/dashboard/project/hwpjrkmplydqaxiikupv](https://supabase.com/dashboard/project/hwpjrkmplydqaxiikupv)
- **GitHub Repository:** [https://github.com/bestjon-byte/DoublesLadder](https://github.com/bestjon-byte/DoublesLadder)
- **Vercel Dashboard:** [https://vercel.com/jons-projects-9634d9db/ladder](https://vercel.com/jons-projects-9634d9db/ladder)

---

## 📖 What Is This?

A comprehensive web application for managing tennis ladder competitions, coaching sessions, payments, and player rankings at Cawood Tennis Club.

**Core Features:**
- 🎯 **Multi-Season Ladder** - Track player rankings with ELO ratings across multiple seasons
- 🎾 **Match Management** - Schedule matches, submit scores, handle conflicts
- 👨‍🏫 **Coaching System** - Session scheduling, attendance tracking, payment management
- 💰 **Payment Reminders** - Automated email reminders with secure payment confirmation
- 🏆 **Trophy Cabinet** - Award system for achievements
- 📱 **WhatsApp Export** - Generate match results and league tables for sharing

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 16+ installed
- npm or yarn

### Setup
```bash
# 1. Clone repository
git clone https://github.com/bestjon-byte/DoublesLadder.git
cd DoublesLadder

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env.local

# 4. Add your Supabase credentials to .env.local
# REACT_APP_SUPABASE_URL=https://hwpjrkmplydqaxiikupv.supabase.co
# REACT_APP_SUPABASE_ANON_KEY=[get from Supabase dashboard]

# 5. Start development server
npm start

# App runs at http://localhost:3000
```

---

## 🏗️ Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18.2.0 (Create React App) |
| **UI Components** | Custom components + Lucide React icons |
| **Styling** | Tailwind CSS utility classes |
| **Backend** | Supabase (PostgreSQL + Auth + Real-time) |
| **Database** | PostgreSQL 15 (via Supabase) |
| **Authentication** | Supabase Auth (email/password) |
| **Edge Functions** | Supabase Edge Functions (Deno) |
| **Email** | Resend API (payment reminders) |
| **Deployment** | Vercel (auto-deploy from main branch) |
| **Version Control** | GitHub |

**Dependencies (Minimal!):**
```json
{
  "@supabase/supabase-js": "^2.39.0",
  "lucide-react": "^0.263.1",
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-scripts": "5.0.1",
  "web-vitals": "^2.1.4"
}
```

---

## 📁 Project Structure

```
├── public/                  # Static assets
├── scripts/                 # Build and deployment scripts
│   ├── inject-version.js    # Auto-inject version into build
│   ├── deploy.sh            # Manual deployment script
│   └── utilities/           # Utility scripts (ELO, migrations, etc.)
├── src/
│   ├── components/          # React components (organized by feature)
│   │   ├── Admin/           # Admin management features
│   │   ├── Auth/            # Authentication screens
│   │   ├── Availability/    # Player availability management
│   │   ├── Coaching/        # Coaching system (sessions, payments)
│   │   ├── Ladder/          # Ranking/ladder display
│   │   ├── Layout/          # Header, navigation
│   │   ├── Matches/         # Match scheduling and results
│   │   ├── Modals/          # Shared modal dialogs
│   │   ├── Profile/         # Player profile and stats
│   │   ├── Season/          # Season selection
│   │   ├── TrophyCabinet/   # Trophy system
│   │   ├── WhatsApp/        # WhatsApp export features
│   │   └── shared/          # Reusable UI components
│   ├── contexts/            # React Context providers
│   │   └── ToastContext.js  # Toast notification system
│   ├── hooks/               # Custom React hooks
│   │   ├── useApp.js        # Main app data management
│   │   ├── useAuth.js       # Authentication logic
│   │   ├── useCoaching.js   # Coaching system logic
│   │   ├── useSeasonManager.js  # Season management
│   │   └── useProfileStats.js   # Player statistics
│   ├── utils/               # Utility functions
│   │   ├── helpers.js       # Ranking calculations
│   │   ├── eloCalculator.js # ELO rating system
│   │   ├── scoreSubmission.js  # Score handling
│   │   └── versionManager.js   # Service worker updates
│   ├── App.js               # Main app component
│   ├── index.js             # React entry point
│   └── supabaseClient.js    # Supabase connection
├── supabase/
│   ├── functions/           # Edge Functions
│   │   └── send-payment-reminders/  # Payment reminder emails
│   └── migrations/          # Database migrations
│       └── applied/         # Applied migrations (archive)
├── .claude/                 # Claude Code integration
│   ├── supabase-query.sh    # Query database from CLI
│   ├── supabase-rpc.sh      # Call RPC functions from CLI
│   └── generate-schema.sh   # Auto-generate SUPABASE_SCHEMA.md
├── .env.local               # Environment variables (NOT in git)
├── .gitignore
├── package.json
├── CLAUDE.md                # Claude Code integration guide
├── SUPABASE_SCHEMA.md       # Auto-generated database schema
└── README.md                # This file
```

---

## 🔧 Common Tasks

### Local Development
```bash
npm start          # Start dev server (localhost:3000)
npm run build      # Production build
npm test           # Run tests (when available)
```

### Deployment
```bash
# Automatic (recommended)
git add .
git commit -m "Description of changes"
git push origin main
# Vercel auto-deploys from main branch

# Manual (using helper script)
./deploy "commit message"
```

### Database Operations

**Query database via CLI:**
```bash
# Get all profiles
./.claude/supabase-query.sh 'profiles?select=name,email,role&limit=10'

# Check payment summary
./.claude/supabase-rpc.sh get_all_players_payment_summary

# Get specific player data
./.claude/supabase-query.sh 'profiles?select=*&name=eq.John Doe'
```

**Access Supabase Dashboard:**
```
https://supabase.com/dashboard/project/hwpjrkmplydqaxiikupv
```

### Deploy Edge Function
```bash
# Set access token (first time only)
export SUPABASE_ACCESS_TOKEN=sbp_1e915da665c3573755dfef9874ab1c93211c1247

# Deploy function
supabase functions deploy send-payment-reminders --project-ref hwpjrkmplydqaxiikupv
```

**Note:** Edge Functions deploy from your LOCAL filesystem, not from git! Pull latest code before deploying.

---

## 💾 Database Schema

**Auto-generated documentation:** See `SUPABASE_SCHEMA.md`

**Key Tables:**
- `profiles` - User accounts (linked to auth.users)
- `seasons` - Tennis seasons (ladder, league, singles championship)
- `season_players` - Player rankings per season (ELO ratings)
- `matches` - Match scheduling
- `match_fixtures` - Player pairings
- `match_results` - Score submissions
- `availability` - Player availability
- `coaching_sessions` - Scheduled coaching sessions
- `coaching_attendance` - Session attendance (includes payment status)
- `coaching_schedules` - Recurring schedule templates
- `coaching_payments` - Payment aggregation
- `payment_reminder_tokens` - Tokenized payment confirmation links

**Important RPC Functions:**
- `generate_coaching_sessions()` - Auto-generate sessions from schedules
- `get_all_players_payment_summary()` - Payment overview for all players
- `validate_payment_token()` - Validate and mark sessions as paid
- `get_player_attendance_stats_by_type()` - Attendance statistics

**Payment Flow:**
```
coaching_attendance.payment_status:
  'unpaid' → 'pending_confirmation' → 'paid'
```

---

## 🔐 Environment Variables

Create `.env.local` in root directory (NOT committed to git):

```env
REACT_APP_SUPABASE_URL=https://hwpjrkmplydqaxiikupv.supabase.co
REACT_APP_SUPABASE_ANON_KEY=[get from Supabase dashboard]
```

**Where to find:**
- Supabase Dashboard → Project Settings → API
- URL: Project URL
- Anon Key: Project API keys → anon/public

---

## 🚨 Troubleshooting

### "Can't connect to database"
- Check `.env.local` exists and has correct values
- Verify Supabase project is active
- Check internet connection

### "Build fails"
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### "Edge Function not updating"
```bash
# Edge Functions deploy from LOCAL files, not git
git pull origin main
supabase functions deploy send-payment-reminders --project-ref hwpjrkmplydqaxiikupv
```

### "Payment emails going to wrong domain"
Check `APP_URL` in `supabase/functions/send-payment-reminders/index.ts`
Should be: `https://cawood-tennis.vercel.app`

---

## 📚 Additional Documentation

- **CLAUDE.md** - Claude Code integration guide (for AI-assisted development)
- **SUPABASE_SCHEMA.md** - Auto-generated database schema (updated on startup)
- **CODEBASE_AUDIT_2025-11-13.md** - Comprehensive code audit and cleanup plan
- **CLEANUP_ACTION_PLAN.md** - Step-by-step cleanup execution plan

---

## 🤝 Development Workflow

### Making Changes
1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes
3. Test locally: `npm start`
4. Commit frequently: `git commit -m "Clear description"`
5. Push to GitHub: `git push origin feature/my-feature`
6. Vercel creates preview deployment automatically
7. Test preview deployment
8. Merge to main when ready (triggers production deploy)

### Code Quality Guidelines
- Keep components under 300 lines
- Keep hooks under 400 lines
- No console.log in production code (use console.error for critical failures only)
- Use React.memo for expensive components
- Use useMemo for expensive calculations
- Prefer Context API over props drilling (3+ levels deep)

---

## 🐛 Known Issues

- None currently (2025-11-13)

See `CODEBASE_AUDIT_2025-11-13.md` for technical debt items and improvement opportunities.

---

## 📞 Support

### For Production Issues
1. Check Vercel deployment logs
2. Check Supabase logs (Dashboard → Logs)
3. Check browser console for errors

### For Development Questions
1. Review this README
2. Check CLAUDE.md for Claude Code integration
3. Review codebase audit for architecture details

---

## 📝 Version History

See git commit history for detailed changes:
```bash
git log --oneline -20
```

**Recent versions:**
- v1.0.175 (2025-11-13) - Current version
- v1.0.164 - Smart attendance sorting
- v1.0.161 - Flexible session generation
- v1.0.49 - League integration

---

## 📄 License

MIT License - See LICENSE file

---

**Built with ❤️ for Cawood Tennis Club**
