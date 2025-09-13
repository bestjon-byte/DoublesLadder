# Database Schema Documentation

## Overview
The Tennis Ladder application uses a PostgreSQL database hosted on Supabase with comprehensive tables supporting multi-season ladder management, league integration, and advanced scoring features.

## Core Tables

### profiles
**Purpose**: Central user management table for all registered players
**Rows**: 31 users
**Key Features**:
- UUID-based primary keys for security
- User status management (pending/approved/suspended)
- Role-based permissions (player/admin)
- Email uniqueness constraints

**Columns**:
- `id` (UUID): Unique user identifier
- `name` (TEXT): Player display name
- `email` (TEXT): Unique email address
- `status` (TEXT): Account status with constraints
- `role` (TEXT): User role with admin/player options
- `created_at`, `updated_at`: Timestamp tracking

---

### seasons
**Purpose**: Multi-season support for organizing play periods
**Rows**: 3 seasons
**Key Features**:
- Support for both ladder and league season types
- Flexible status management (upcoming/active/completed)
- JSON storage for league-specific information

**Columns**:
- `id` (UUID): Unique season identifier
- `name` (TEXT): Season display name
- `start_date`, `end_date` (DATE): Season duration
- `status` (TEXT): Current season state
- `season_type` (VARCHAR): 'ladder' or 'league'
- `league_info` (JSONB): Additional league metadata

---

### season_players
**Purpose**: Player participation in specific seasons
**Rows**: 49 season participations
**Key Features**:
- Season-specific player statistics
- Dynamic ranking system with history
- Performance metrics tracking

**Columns**:
- `id` (UUID): Unique participation record
- `season_id`, `player_id` (UUID): Foreign key relationships
- `rank`, `previous_rank` (INTEGER): Position tracking
- `matches_played`, `matches_won` (INTEGER): Match statistics
- `games_played`, `games_won` (INTEGER): Game statistics

---

### matches
**Purpose**: Individual match events within seasons
**Rows**: 35 matches
**Key Features**:
- Week-based organization
- Season association
- Date-based scheduling

**Columns**:
- `id` (UUID): Unique match identifier
- `season_id` (UUID): Associated season
- `week_number` (INTEGER): Sequential week numbering
- `match_date` (DATE): Scheduled match date

---

### match_fixtures
**Purpose**: Generated player pairings for matches
**Rows**: 82 fixtures
**Key Features**:
- Court and game organization
- Support for 4-player and 5-player rotations
- Dual match type support (ladder/league)
- Team designation for league matches

**Columns**:
- `id` (UUID): Unique fixture identifier
- `match_id` (UUID): Parent match
- `court_number`, `game_number` (INTEGER): Organization
- `player1_id` through `player4_id` (UUID): Player assignments
- `pair1_player1_id`, `pair1_player2_id` (UUID): Explicit pairing
- `pair2_player1_id`, `pair2_player2_id` (UUID): Explicit pairing
- `sitting_player_id` (UUID): 5-player rotation support
- `match_type` (VARCHAR): 'ladder' or 'league'
- `team` (VARCHAR): '1sts' or '2nds' for league
- `opponent_club` (VARCHAR): External club name

---

### match_results
**Purpose**: Score submissions and verification
**Rows**: 56 results
**Key Features**:
- Score conflict detection
- Verification workflow
- Audit trail for submissions

**Columns**:
- `id` (UUID): Unique result identifier
- `fixture_id` (UUID): Associated fixture
- `pair1_score`, `pair2_score` (INTEGER): Game scores
- `submitted_by` (UUID): Submitting user
- `verified` (BOOLEAN): Verification status

---

### availability
**Purpose**: Player availability tracking for match scheduling
**Rows**: 9 availability records
**Key Features**:
- Date-specific availability
- Boolean availability state
- Update tracking

**Columns**:
- `id` (UUID): Unique availability record
- `player_id` (UUID): Associated player
- `match_date` (DATE): Specific match date
- `is_available` (BOOLEAN): Availability status

---

## Score Management System

### score_conflicts
**Purpose**: Automatic detection of conflicting score submissions
**Rows**: 0 current conflicts
**Key Features**:
- JSON storage of conflicting data
- Administrative resolution workflow
- Audit trail

### score_challenges
**Purpose**: Manual score dispute system
**Rows**: 1 challenge record
**Key Features**:
- Formal challenge process
- Administrative decision tracking
- Challenge reason documentation

---

## League Integration Tables

### external_players
**Purpose**: Players from opposing clubs in league matches
**Rows**: 123 external players
**Key Features**:
- Club association
- Cross-season statistics tracking
- Opponent player management

**Columns**:
- `id` (UUID): Unique external player ID
- `name` (VARCHAR): Player name
- `club_name` (VARCHAR): Associated club
- `total_rubbers_played`, `total_games_won`, `total_games_lost` (INTEGER): Statistics

---

### league_match_rubbers
**Purpose**: Individual rubber results for league matches
**Rows**: 243 rubber records
**Key Features**:
- 9-rubber match structure
- Cawood vs opponent scoring
- Detailed game-level tracking

**Columns**:
- `id` (UUID): Unique rubber identifier
- `match_fixture_id` (UUID): Parent fixture
- `rubber_number` (INTEGER): 1-9 rubber position
- `cawood_player1_id`, `cawood_player2_id` (UUID): Cawood pair
- `opponent_player1_id`, `opponent_player2_id` (UUID): Opponent pair
- `cawood_games_won`, `opponent_games_won` (INTEGER): Game scores

---

### player_match_cache
**Purpose**: Caching for player name matching in league imports
**Rows**: 20 cached matches
**Key Features**:
- Fuzzy name matching optimization
- Administrative confirmation
- Import efficiency

---

## Legacy Tables (Deprecated)

### players, ladders, ladder_players
**Purpose**: Original single-season system (now deprecated)
**Status**: Replaced by multi-season system
**Recommendation**: Can be safely removed after data migration confirmation

---

## Database Relationships

### Primary Relationships:
1. **User Management**: `profiles` → `season_players` → `seasons`
2. **Match Organization**: `seasons` → `matches` → `match_fixtures`
3. **Score Tracking**: `match_fixtures` → `match_results`
4. **League Integration**: `match_fixtures` → `league_match_rubbers`
5. **Availability**: `profiles` → `availability` (by match_date)

### Constraint Highlights:
- All score values have non-negative constraints
- Status fields use strict enumeration constraints
- Unique email enforcement in profiles
- Rubber number constraints (1-9) for league matches

---

## Row-Level Security (RLS)

### Enabled Tables:
- `score_challenges`: Protects challenge data
- `score_conflicts`: Secures conflict information
- `player_match_cache`: Restricts cache access

### Security Considerations:
- Most tables rely on application-level security
- Sensitive operations use UUID-based access control
- Admin-only functions protected through role checks

---

## Performance Considerations

### Indexing Strategy:
- Primary keys (UUID) automatically indexed
- Foreign key relationships indexed
- Date-based queries on availability and matches
- Season-based filtering optimization

### Data Volume:
- 31 active users with room for growth
- 3 seasons supporting historical data
- 243+ match rubbers demonstrating league integration
- Efficient storage with minimal redundancy

---

## Cleanup Opportunities

### Potential Removals:
1. **Legacy Tables**: `players`, `ladders`, `ladder_players` (if migration complete)
2. **Empty Tables**: Tables with 0 rows that may no longer be needed
3. **Unused Columns**: Review for deprecated fields

### Data Integrity:
- Comprehensive foreign key constraints maintain referential integrity
- Check constraints prevent invalid data entry
- Timestamp tracking enables audit capabilities