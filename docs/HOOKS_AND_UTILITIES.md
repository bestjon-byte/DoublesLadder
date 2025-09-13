# Hooks and Utilities Reference

## Custom React Hooks

### useAuth.js
**Purpose**: Manages all authentication-related state and operations
**Key Features**:
- User session management with Supabase Auth
- Profile data loading with timeout protection
- Password reset functionality
- Multi-mode authentication (normal/reset)
- Automatic session recovery and fallbacks

**State**:
- `user`: Current user profile data
- `loading`: Authentication loading state
- `authMode`: Current authentication mode ('normal' or 'reset')
- `error`: Authentication error state

**Actions**:
- `signIn(email, password)`: User login
- `signUp(email, password, name)`: User registration
- `signOut()`: User logout
- `requestPasswordReset(email)`: Password reset request
- `updatePassword(newPassword)`: Password update
- `setAuthMode(mode)`: Change authentication mode

**Error Handling**:
- Profile loading timeout protection (2 seconds)
- Fallback to auth metadata when profile unavailable
- Background profile synchronization
- Session recovery mechanisms

---

### useApp.js
**Purpose**: Central application data management with multi-season support
**Key Features**:
- Season-based data management
- Player statistics tracking
- Match and fixture management
- Availability tracking
- Comprehensive CRUD operations

**State Management**:
- `users`: All user profiles
- `currentSeason`: Currently active season
- `selectedSeason`: User-selected season for viewing
- `seasonPlayers`: Players participating in selected season
- `availability`: Player availability for matches
- `matchFixtures`: Generated match pairings
- `matchResults`: Submitted match scores
- `loading`: Granular loading states

**Core Functions**:

#### Data Fetching:
- `fetchUsers()`: Load all user profiles
- `fetchSeasonPlayers(seasonId)`: Load season-specific players
- `fetchSelectedSeasonData(seasonId)`: Load comprehensive season data
- `fetchAvailability()`: Load player availability records
- `fetchMatchFixtures()`: Load match pairings
- `fetchMatchResults()`: Load match scores

#### User Management:
- `approveUser(userId)`: Approve pending user registration
- `updateUserRole(userId, role)`: Update user permissions
- `addToLadder(userId, rank)`: Add player to season ladder
- `deleteUser(userId, name, email)`: Deactivate user account

#### Match Management:
- `addMatchToSeason(matchDate)`: Create new match for season
- `generateMatches(matchId)`: Generate player pairings for match
- `setPlayerAvailability(matchId, available, playerId)`: Set availability

#### Ranking System:
- `updateRankings()`: Update player rankings (detects league vs ladder)
- `updateLeagueRankings()`: League-specific ranking calculation
- `updateLadderRankings()`: Ladder-specific ranking calculation

#### Data Management:
- `clearOldMatches()`: Clear all historical match data
- `deleteSeason(seasonId, name)`: Delete season and related data

**Helper Functions**:
- `getPlayerAvailability(userId, matchId)`: Check player availability
- `getAvailabilityStats(matchId)`: Calculate availability statistics
- `getMatchScore(fixtureId)`: Get latest verified match score
- `getMatchScoreHistory(fixtureId)`: Get all score submissions

---

### useSeasonManager.js
**Purpose**: Manages season selection and seasonal data operations
**Key Features**:
- Multi-season support
- Season creation and management
- Active/selected season tracking
- Season type differentiation (ladder vs league)

**State**:
- `seasons`: All available seasons
- `activeSeason`: Currently active season
- `selectedSeason`: User-selected season for viewing
- `loading`: Season loading state
- `error`: Season error state

**Actions**:
- `setSelectedSeason(season)`: Change selected season
- `createSeason(seasonData)`: Create new season
- `updateSeason(seasonId, data)`: Update season details
- `setSeasonStatus(seasonId, status)`: Change season status

---

### useProfileStats.js
**Purpose**: Calculates and manages player statistics across seasons
**Key Features**:
- Multi-season statistics aggregation
- Performance metrics calculation
- Historical data analysis
- Ranking change tracking

**Calculated Metrics**:
- Matches played/won
- Games played/won
- Win percentages
- Ranking changes
- Season participation

---

## Utility Functions

### utils/scoreSubmission.js
**Purpose**: Handles match score submission with conflict resolution
**Key Functions**:
- `submitScoreWithConflictHandling()`: Main score submission with validation
- `submitScoreChallenge()`: Handle score disputes
- Conflict detection and resolution
- Score verification workflow

### utils/helpers.js
**Purpose**: General utility functions for the application
**Common Functions**:
- Date formatting and manipulation
- String utilities
- Validation helpers
- Data transformation functions

### utils/notificationManager.js
**Purpose**: Manages browser push notifications
**Key Features**:
- Service worker integration
- Subscription management
- Notification scheduling
- Permission handling

### utils/pushNotificationTriggers.js
**Purpose**: Triggers for automated push notifications
**Trigger Events**:
- Match scheduling
- Score submissions
- Availability reminders
- Season changes

### utils/versionManager.js
**Purpose**: Application version management and updates
**Key Features**:
- Version comparison
- Update notifications
- Changelog display
- Force refresh handling

### utils/haptics.js
**Purpose**: Mobile haptic feedback integration
**Features**:
- Touch feedback for interactions
- Platform-specific implementations
- Accessibility considerations

### utils/swipeActions.js
**Purpose**: Mobile swipe gesture handling
**Features**:
- Swipe gesture detection
- Action mapping
- Touch event management

### utils/leagueTextParser.js
**Purpose**: Parses league match data from text formats
**Features**:
- Text-to-data conversion
- Match result extraction
- Player name matching
- Score parsing

### utils/leagueURLParser.js
**Purpose**: Extracts league data from external URLs
**Features**:
- URL content fetching
- HTML parsing
- Data normalization
- Error handling

### utils/playerMatcher.js
**Purpose**: Matches external player names to internal profiles
**Features**:
- Fuzzy name matching
- Alias handling
- Confidence scoring
- Manual override support

---

## Context Providers

### contexts/ToastContext.js
**Purpose**: Global toast notification system
**Features**:
- Centralized notification management
- Multiple notification types (success, error, info, warning)
- Auto-dismiss functionality
- Queue management for multiple notifications

**Usage Pattern**:
```javascript
const { addToast } = useToast();
addToast('Success message', 'success');
```

---

## Data Flow Architecture

### Primary Data Flow:
1. **Authentication**: `useAuth` → User session
2. **Season Management**: `useSeasonManager` → Season context
3. **Application Data**: `useApp` → Feature data (users, matches, availability)
4. **Component Rendering**: Props flow to UI components

### State Synchronization:
- Real-time Supabase subscriptions for live updates
- Manual refresh triggers for data consistency
- Error boundaries for graceful failure handling
- Loading states for user experience

### Error Handling Strategy:
- Timeout protection for slow networks
- Fallback data for offline scenarios
- User-friendly error messages
- Automatic retry mechanisms

---

## Performance Considerations

### Optimization Techniques:
- Memoized callback functions to prevent re-renders
- Granular loading states to avoid blocking UI
- Selective data fetching based on user context
- Background data synchronization

### Memory Management:
- Cleanup functions in useEffect hooks
- Subscription management
- Event listener cleanup
- State reset on component unmount

### Network Efficiency:
- Batched API calls where possible
- Conditional data fetching
- Caching strategies for frequently accessed data
- Optimistic UI updates for better UX