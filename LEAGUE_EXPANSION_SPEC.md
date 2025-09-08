# Cawood Tennis App - League Expansion Specification

## Overview
Expand the Cawood Tennis App from a single ladder system to support multiple concurrent seasons and external league match tracking, while maintaining the existing internal ladder functionality.

## Key Changes Summary

### 1. Multi-Season Support
- **Current**: Single "active" season at a time
- **New**: Multiple concurrent "live" seasons
- Users can be members of multiple seasons simultaneously
- Season selector allows switching between seasons (view one at a time)
- Each season can have ongoing matches/results entry

### 2. Unified League System
- **Rename**: "Ladder Tab" → "League Tab"
- **Functionality**: Display both ladder-style and league-style competitions
- **Table Structure**: Unified ranking system supporting both formats
- **Ordering**: Position-based, ordered by games won percentage

### 3. External League Match Types
- **Purpose**: Track Cawood club members playing in local external leagues
- **Teams**: Cawood 1sts and 2nds (separate teams, same league view)
- **Opposition**: External clubs (non-members) with basic player tracking
- **Match Structure**: Weekly matches between clubs

## Detailed Requirements

### Database Schema Changes

#### Seasons Table
```sql
-- Add season type and status fields
ALTER TABLE seasons ADD COLUMN season_type VARCHAR(20) DEFAULT 'ladder' CHECK (season_type IN ('ladder', 'league'));
ALTER TABLE seasons ADD COLUMN status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived'));
ALTER TABLE seasons ADD COLUMN league_info JSONB; -- Store league-specific data (division, external league name, etc.)
```

#### New External Players Table
```sql
CREATE TABLE external_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    club_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Stats tracking
    total_rubbers_played INTEGER DEFAULT 0,
    total_games_won INTEGER DEFAULT 0,
    total_games_lost INTEGER DEFAULT 0
);
```

#### Enhanced Match Structure
```sql
-- Add match type and team info
ALTER TABLE match_fixtures ADD COLUMN match_type VARCHAR(20) DEFAULT 'ladder' CHECK (match_type IN ('ladder', 'league'));
ALTER TABLE match_fixtures ADD COLUMN team VARCHAR(10) CHECK (team IN ('1sts', '2nds'));
ALTER TABLE match_fixtures ADD COLUMN opponent_club VARCHAR(255);
ALTER TABLE match_fixtures ADD COLUMN week_number INTEGER;

-- League match participants (replaces simple pairs)
CREATE TABLE league_match_rubbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_fixture_id UUID REFERENCES match_fixtures(id) ON DELETE CASCADE,
    rubber_number INTEGER, -- 1-9 (3 pairs × 3 rubbers each)
    
    -- Cawood pair
    cawood_player1_id UUID REFERENCES profiles(id),
    cawood_player2_id UUID REFERENCES profiles(id),
    
    -- Opposition pair  
    opponent_player1_id UUID REFERENCES external_players(id),
    opponent_player2_id UUID REFERENCES external_players(id),
    
    -- Rubber result
    cawood_games_won INTEGER,
    opponent_games_won INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_rubber_number CHECK (rubber_number BETWEEN 1 AND 9),
    CONSTRAINT valid_games_total CHECK (cawood_games_won + opponent_games_won = 12)
);
```

### UI/UX Changes

#### Season Management
1. **Season Selector Enhancement**
   - Show all "active" seasons (not just one)
   - Visual indicators for season type (ladder/league)
   - Allow quick switching between seasons
   - Display current selection clearly

2. **Season Creation**
   - Add season type selection (Ladder/League)
   - League-specific fields (division, external league name, team)
   - Support for multiple concurrent seasons

#### League Tab (Renamed from Ladder)
1. **Unified Display**
   - Dynamic header based on season type
   - Ladder seasons: Traditional ranking display
   - League seasons: Games won % ranking with rubber/games stats

2. **League Season Display**
   ```
   League Position | Player Name | Rubbers Played | Games Won | Games Lost | Win %
   1              | John Smith  | 27            | 195       | 129        | 60.2%
   2              | Jane Doe    | 24            | 167       | 121        | 58.0%
   ```

#### Match Entry System
1. **League Match Entry Form**
   - Week selection
   - Opponent club name
   - Team selection (1sts/2nds)
   - 9 rubber entry grid:
     ```
     Cawood Pair 1 vs Opponent Pair 1: [Score entry]
     Cawood Pair 1 vs Opponent Pair 2: [Score entry]
     Cawood Pair 1 vs Opponent Pair 3: [Score entry]
     ... (repeat for all 9 rubbers)
     ```
   - Auto-complete for external player names
   - Score validation (must total 12 games per rubber)

2. **Player Selection**
   - Cawood players: Dropdown from season members
   - External players: Auto-complete with "Add new player" option
   - Pair validation (no player duplicates within a match)

#### Enhanced Player Profiles
1. **Multi-Season Stats**
   - Season selector within profile
   - Season-specific statistics display
   - Combined view across all seasons option

2. **League-Specific Stats**
   - Rubbers played, games won/lost, win percentage
   - Performance by opponent club
   - Performance by team (1sts vs 2nds)
   - Head-to-head vs specific external players

### Technical Implementation Plan

#### Phase 1: Database & Backend (Foundation)
**Tasks:**
1. Create database migration for new tables and columns
2. Update season management functions to support multiple active seasons
3. Create external player management functions
4. Implement league match rubber tracking
5. Update season selector logic
6. Create league match entry API endpoints
7. Update stats calculation functions for league format

**Key Files to Modify:**
- Database migration files
- `src/hooks/useSeasonManager.js` - Multi-season support
- `src/hooks/useApp.js` - Season data loading logic
- `src/utils/helpers.js` - Stats calculations
- Supabase functions for league match handling

#### Phase 2: UI Components (User Interface)
**Tasks:**
1. Rename Ladder Tab to League Tab
2. Update season selector component for multi-season display  
3. Create league match entry form component
4. Update league table display for different season types
5. Enhance player profile displays
6. Create external player management interface
7. Update navigation and routing

**Key Files to Modify:**
- `src/components/Layout/Navigation.js` - Tab rename
- `src/components/Season/SeasonSelector.js` - Multi-season support
- `src/components/Ladder/LadderTab.js` - Rename and enhance to LeagueTab
- `src/components/Matches/MatchesTab.js` - League match entry
- `src/components/Profile/ProfileTab.js` - Multi-season stats
- Create: `src/components/League/LeagueMatchEntry.js`
- Create: `src/components/League/LeagueRubberGrid.js`

#### Phase 3: Integration & Testing (Polish)
**Tasks:**
1. Integrate league match results with player statistics
2. Implement external player stats tracking
3. Add match history views for league matches
4. Create admin tools for managing external players
5. Update availability system for league matches
6. Add data validation and error handling
7. Testing and bug fixes

**Key Files to Modify:**
- `src/components/Admin/AdminTab.js` - External player management
- `src/components/Availability/AvailabilityTab.js` - League match availability
- All stats calculation functions
- Error handling and validation

### Data Flow Examples

#### League Match Entry Flow
1. Admin selects league season
2. Admin clicks "Enter League Match Results"
3. Form shows:
   - Week number
   - Opponent club name (auto-complete)
   - Team selection (1sts/2nds)
   - 9 rubber result grid
4. For each rubber:
   - Select 2 Cawood players
   - Enter/select 2 opponent players
   - Enter games won for each side (must total 12)
5. Submit saves all rubbers and updates player stats

#### Multi-Season Display Flow
1. User opens app, sees season selector with all active seasons
2. User selects a season (ladder or league type)
3. League tab displays appropriate format:
   - Ladder season: Traditional ranking table
   - League season: Games won % table
4. User switches season, display updates accordingly
5. All other tabs (Profile, Matches, etc.) filter by selected season

### Migration Strategy
1. **Backward Compatibility**: Existing ladder seasons continue to work unchanged
2. **Data Preservation**: All current season data remains intact
3. **Gradual Rollout**: New features can be enabled per season
4. **Admin Control**: Season type set during creation, cannot be changed later

### Testing Requirements
1. **Multi-Season Testing**: Verify users can be in multiple seasons simultaneously
2. **League Match Testing**: Complete league match entry and stats calculation
3. **External Player Testing**: Create, manage, and track external players
4. **Stats Accuracy**: Verify all calculations are correct for both formats
5. **UI Responsiveness**: Ensure all new components work on mobile/desktop
6. **Data Integrity**: Verify no existing functionality is broken

## Implementation Priority
1. **High Priority**: Multi-season support, League tab rename, basic league match entry
2. **Medium Priority**: External player management, detailed league stats
3. **Low Priority**: Advanced analytics, enhanced UI polish

## Future Considerations
- Tournament format support
- Inter-club challenge matches
- Historical season archiving
- Advanced analytics dashboard
- Mobile app optimizations

---

This specification provides a complete roadmap for implementing the league expansion while maintaining all existing functionality. Each phase can be developed and tested independently, allowing for staged deployment and risk mitigation.