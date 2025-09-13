# Component Reference Guide

## Core Application Components

### App.js
**Purpose**: Main application entry point that orchestrates the entire application flow
**Key Features**:
- Multi-season management integration
- Authentication state management
- Tab-based navigation system
- Modal management for scheduling and scoring
- Error boundary integration
- Real-time data synchronization

**Dependencies**: 
- useAuth hook for authentication
- useApp hook for application data
- useSeasonManager hook for season management
- ToastContext for notifications

**State Management**:
- `activeTab`: Current active navigation tab
- `showScheduleModal`: Schedule modal visibility
- `showScoreModal`: Score submission modal visibility
- `selectedMatch`: Currently selected match for scoring
- `selectedPlayerId`: Selected player for profile viewing

---

## Authentication Components

### components/Auth/AuthScreen.js
**Purpose**: Handles user authentication including login, registration, and email verification
**Key Features**:
- Email/password authentication
- Account registration with validation
- Email verification flow
- Password reset integration
- Responsive design for mobile and desktop

### components/Auth/PasswordReset.js
**Purpose**: Standalone password reset component
**Key Features**:
- Email-based password reset requests
- Secure token validation
- User-friendly error handling

### components/Auth/PasswordUpdate.js
**Purpose**: Secure password update interface
**Key Features**:
- Current password validation
- New password confirmation
- Security requirements enforcement

---

## Layout Components

### components/Layout/Header.js
**Purpose**: Application header with branding and user controls
**Key Features**:
- Responsive design with mobile-first approach
- Season selector integration
- Sign-out functionality
- Safe area support for mobile devices

### components/Layout/Navigation.js
**Purpose**: Bottom navigation bar for mobile-friendly tab switching
**Key Features**:
- Touch-optimized tab navigation
- Active tab highlighting
- Admin tab conditional display
- Mobile-responsive design

---

## Feature Components

### components/Ladder/LadderTab.js
**Purpose**: Displays the tennis ladder rankings and allows position management
**Key Features**:
- Dynamic ladder ranking display
- Player statistics integration
- Team filtering for league play
- Interactive player selection
- Position update functionality

### components/Matches/MatchesTab.js
**Purpose**: Comprehensive match management interface
**Key Features**:
- Match fixtures and results display
- Score submission interface
- Match generation for new rounds
- Availability statistics
- League match integration

### components/Availability/AvailabilityTab.js
**Purpose**: Player availability management for match scheduling
**Key Features**:
- Calendar-based availability setting
- Bulk availability updates
- Availability statistics tracking
- Season-specific availability management

### components/Profile/ProfileTab.js
**Purpose**: User profile management and player statistics
**Key Features**:
- Personal profile editing
- Multi-season statistics display
- Other player profile viewing
- Match history tracking

### components/Admin/AdminTab.js
**Purpose**: Administrative dashboard for league management
**Key Features**:
- User approval and role management
- Season management
- Match data cleanup
- League import/export functionality
- Player ladder management

---

## Modal Components

### components/Modals/ScheduleModal.js
**Purpose**: Modal for scheduling new matches
**Key Features**:
- Date selection interface
- Match creation workflow
- Validation and error handling

### components/Modals/EnhancedScoreModal.js
**Purpose**: Comprehensive score submission interface
**Key Features**:
- Set-by-set score entry
- Score validation
- Conflict detection and handling
- Score challenge functionality

### components/Modals/ScoreModal.js
**Purpose**: Basic score submission modal (legacy)
**Status**: May be redundant with EnhancedScoreModal

### components/Modals/AddToLadderModal.js
**Purpose**: Modal for adding players to the current season's ladder
**Key Features**:
- Player selection interface
- Ladder position assignment
- Bulk player addition

### components/Modals/DeleteSeasonModal.js
**Purpose**: Confirmation modal for season deletion
**Key Features**:
- Data loss warnings
- Confirmation workflow
- Cascade deletion handling

### components/Modals/DeleteUserModal.js
**Purpose**: Confirmation modal for user account deletion
**Key Features**:
- Account deletion warnings
- Data preservation options
- Admin-only functionality

### components/Modals/UserRoleModal.js
**Purpose**: Modal for updating user roles and permissions
**Key Features**:
- Role selection interface
- Permission level management
- Admin approval workflow

---

## Specialized Components

### components/Season/SeasonSelector.js
**Purpose**: Dropdown selector for switching between seasons
**Key Features**:
- Season list display
- Active season highlighting
- Loading state handling
- Embedded branding integration

### components/Notifications/NotificationSettings.js
**Purpose**: Browser push notification management
**Key Features**:
- Notification permission requests
- Subscription management
- Notification preferences

---

## Shared/Utility Components

### components/shared/LoadingScreen.js
**Purpose**: Full-screen loading indicator with custom messages
**Key Features**:
- Customizable loading messages
- Responsive design
- Smooth transitions

### components/shared/LoadingSpinner.js
**Purpose**: Reusable loading spinner component
**Key Features**:
- Multiple size variants
- Color customization
- Animation optimization

### components/shared/SkeletonLoader.js
**Purpose**: Skeleton loading states for content placeholders
**Key Features**:
- Multiple layout variants
- Smooth placeholder animations
- Responsive design

### components/shared/ErrorBoundary.js
**Purpose**: React error boundary for graceful error handling
**Key Features**:
- Error catching and logging
- User-friendly error display
- Recovery mechanisms

### components/shared/Toast.js
**Purpose**: Toast notification component
**Key Features**:
- Multiple notification types
- Auto-dismiss functionality
- Smooth animations

### components/shared/UpdateNotification.js
**Purpose**: App update notification system
**Key Features**:
- Service worker update detection
- User-friendly update prompts
- Automatic refresh handling

### components/shared/VersionDisplay.js
**Purpose**: Application version display component
**Key Features**:
- Version number display
- Build information
- Positioning options

### components/shared/EmptyState.js
**Purpose**: Empty state placeholder component
**Key Features**:
- Customizable messaging
- Action button integration
- Responsive design

---

## Component Dependencies and Data Flow

### Data Flow Hierarchy:
1. **App.js** - Central state management
2. **Custom Hooks** - Data fetching and state logic
3. **Tab Components** - Feature-specific interfaces
4. **Modal Components** - Action-specific interfaces
5. **Shared Components** - Reusable UI elements

### Key Props Patterns:
- **currentUser**: User authentication data
- **selectedSeason**: Current season context
- **supabase**: Database client instance
- **refetch**: Data refresh functions
- **actions**: CRUD operation functions
- **helpers**: Utility functions for data processing