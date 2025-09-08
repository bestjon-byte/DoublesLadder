# Cawood Tennis App - Project Context
*Auto-updated by Claude Code startup hook on 2025-09-08 08:57:16*

## Project Overview
- **Name**: Cawood Tennis App (rebranded from Tennis Ladder App)
- **Type**: Web application for managing tennis competitions (ladders and leagues)
- **Current Status**: Production (v1.0.6) - Recently rebranded, League expansion planned
- **Framework**: "react"

## Code Location
- **Primary Repository**: /Users/jonbest/Documents/GitHub/DoublesLadder.Old
- **Working Directory**: /Users/jonbest/claude-code-test/

## Technology Stack
- **Backend**: Supabase
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Frontend**: "react"

## Supabase Implementation Details
- **Project URL**: https://hwpjrkmplydqaxiikupv.supabase.co
- **Project Reference**: hwpjrkmplydqaxiikupv
- **Anonymous Key**: eyJhbGciOiJIUzI1NiIs... (truncated for security)
- **Database Schema Files**: 
  - /Users/jonbest/Documents/GitHub/DoublesLadder.Old/database/migrations/create_notification_events.sql

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

## Key Files & Components
- **Supabase Client**: src/supabaseClient.js
- **Authentication**: src/hooks/useAuth.js
- **Season Management**: src/hooks/useSeasonManager.js
- **Database Schema**: database-reset.sql

## MCP Integration
- **Supabase MCP Server**: Configured for read-only access
- **Available Tools**: Database queries, schema inspection, project management
- **Access Token**: Configured in .mcp.json

## Recent Work
- **v1.0.6 Rebranding**: Complete rebrand from "Tennis Ladder App" to "Cawood Tennis App"
  - Updated all titles, metadata, and branding while preserving ladder functionality
  - Login screen now shows "Cawood Tennis Club" without "Doubles Ladder" subtitle
  - Component renamed from `TennisLadderApp` to `CawoodTennisApp`
- Database schema design with multi-season support
- Authentication system implementation
- Match scheduling and result tracking

## Planned League Expansion (Major Feature)
**Full specification available in: `/LEAGUE_EXPANSION_SPEC.md`**

### Key Expansion Goals:
1. **Multi-Season Support**: Multiple concurrent active seasons (not just one)
2. **League Tab**: Rename "Ladder Tab" to "League Tab" supporting both formats
3. **External League Matches**: Track Cawood members playing in local leagues
   - 3 Cawood pairs vs 3 opponent pairs
   - 9 rubbers per match (each pair plays 3 rubbers of 12 games)
   - Track external club players (non-members) for stats/nemesis features

### Implementation Phases:
- **Phase 1**: Database & backend changes (multi-season, league match structure)
- **Phase 2**: UI components (league match entry, enhanced displays)
- **Phase 3**: Integration & testing (stats, admin tools, validation)

### Database Schema Additions Needed:
- `seasons.season_type` ('ladder'/'league') and `seasons.status`
- `external_players` table for opponent club players
- `league_match_rubbers` table for detailed match tracking
- Enhanced match fixtures for team info (1sts/2nds) and opponent clubs

## Next Steps
- Begin League Expansion Phase 1 (use LEAGUE_EXPANSION_SPEC.md as implementation guide)
- Complete multi-season backend support
- Implement external player management
- Create league match entry system

---
*This file is automatically updated by Claude Code startup hooks to provide current project context.*
