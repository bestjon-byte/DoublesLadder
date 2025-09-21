# Tennis Ladder App - Project Context
*Auto-updated by Claude Code startup hook on 2025-09-21 13:40:00*

## Project Overview
- **Name**: Tennis Ladder App
- **Type**: Web application for managing tennis ladder competitions
- **Current Status**: In development
- **Framework**: "react"

## Code Location
- **Primary Repository**: /Users/jonbest/Documents/GitHub/DoublesLadder.Old
- **Working Directory**: /Users/jonbest/claude-code-test/

## Technology Stack
- **Backend**: Supabase
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Frontend**: React 18.2.0
- **Deployment**: Vercel (with MCP integration)
- **Build Tool**: Create React App

## Supabase Implementation Details
- **Project URL**: [Configured via environment variables]
- **Project Reference**: [Configured via environment variables]
- **Anonymous Key**: [Configured via environment variables]
- **Database Schema Files**: 
  - /Users/jonbest/Documents/GitHub/DoublesLadder.Old/elo_management_functions.sql

## Key Database Tables
- **profiles**: User profiles linked to Supabase auth
- **seasons**: Tennis seasons with start/end dates  
- **season_players**: Player rankings per season
- **matches**: Match scheduling and management
- **match_results**: Match outcomes and scores
- **availability**: Player availability tracking

## Development Commands
- **Install**: `npm install`
- **Dev Server**: `npm run dev`
- **Build**: `npm run build`
- **Test**: `npm test`
- **Deploy**: `./deploy`

## Deployment Configuration
- **Platform**: Vercel (https://tennis-ladder-llw0ervod-jons-projects-9634d9db.vercel.app)
- **Project Name**: tennis-ladder-app
- **Account**: bestjon-byte (jons-projects-9634d9db)
- **Auto-Deploy**: When work is completed and tested successfully, automatically deploy via MCP
- **Deploy Commands**:
  - Local: `./deploy` (Git + Vercel CLI)
  - Direct: Vercel MCP integration (preferred)
- **Deploy Criteria**: Only auto-deploy when compilation is successful and functionality is verified
- **Build Settings**: ESLint disabled in production (`DISABLE_ESLINT_PLUGIN=true`)

## Key Files & Components
- **Supabase Client**: src/supabaseClient.js
- **Authentication**: src/hooks/useAuth.js
- **Season Management**: src/hooks/useSeasonManager.js
- **Database Schema**: database-reset.sql

## MCP Integration
### Supabase MCP Server
- **Status**: Configured and active
- **Project Reference**: hwpjrkmplydqaxiikupv
- **Available Tools**: Database queries, schema inspection, project management
- **Access Token**: Configured in .mcp.json (sbp_1e915da665c3573755dfef9874ab1c93211c1247)

### Vercel MCP Server
- **Status**: Configured and active
- **Account**: bestjon-byte
- **Project**: tennis-ladder-app
- **Available Tools**: Direct deployment, log access, build monitoring, project management
- **Access Token**: Configured in .mcp.json (JJQekziXC51YlFBhIK1RKPZE)
- **Production URL**: https://tennis-ladder-llw0ervod-jons-projects-9634d9db.vercel.app

### MCP Commands Available to Claude
- **Supabase**: Database operations, schema queries, project management
- **Vercel**: Deploy, check logs, monitor builds, inspect deployments
- **Setup Script**: ./scripts/setup-vercel-mcp.sh (for re-configuration)
- **Helper Script**: ./scripts/vercel-helper.sh (for manual operations)

## Code Quality Status
- **Console Statements**: ✅ Removed from production (199+ statements cleaned)
- **ESLint Warnings**: ⚠️ Present but non-blocking (unused variables, dependency arrays)
- **Build Status**: ✅ Successful with ESLint disabled in production
- **Production Ready**: ✅ Clean, optimized build (158.61 kB gzipped)

## Security Issues (CRITICAL - Address Before Multi-User Launch)
1. **Environment Variables**: ❌ .env.local exposed in repo (contains Supabase credentials)
2. **Database Security**: ❌ 19 security warnings from Supabase advisors
3. **RLS Policies**: ❌ Need Row Level Security implementation
4. **Auth Settings**: ❌ OTP expiry too long, password leak protection disabled

## Performance Optimization Needed
- **Database Indexes**: Missing on frequently queried columns
- **Query Optimization**: Complex joins need performance tuning
- **Data Validation**: Database constraints need strengthening

## Recent Work
- ✅ Code quality improvements (console cleanup, ESLint fixes)
- ✅ Vercel MCP integration for seamless deployment
- ✅ Production deployment workflow established
- Database schema design with multi-season support
- Authentication system implementation
- Match scheduling and result tracking

## Next Steps (Priority Order)
1. **SECURITY FIXES** - Address critical security issues before multi-user launch
2. **Database Performance** - Add indexes and optimize queries
3. Complete frontend implementation
4. Add match scoring interface
5. Implement ladder ranking algorithms
6. Add email notifications

---
*This file is automatically updated by Claude Code startup hooks to provide current project context.*
