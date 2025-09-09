# Tennis Ladder App - Project Context
*Auto-updated by Claude Code startup hook on 2025-09-09 07:33:33*

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
- Database schema design with multi-season support
- Authentication system implementation
- Match scheduling and result tracking

## Next Steps
- Complete frontend implementation
- Add match scoring interface
- Implement ladder ranking algorithms
- Add email notifications

---
*This file is automatically updated by Claude Code startup hooks to provide current project context.*
