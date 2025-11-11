# Sprint 5: Dashboard Redesign - Comprehensive Plan
**Created:** 2025-11-11
**Status:** 📋 PLANNING (Not yet started)
**Estimated Effort:** 10-12 hours (revised from original 8 hours)
**Priority:** OPTIONAL - Consider after user feedback on Sprints 1-4

---

## Executive Summary

Sprint 5 transforms the coaching section from a tab-based interface to a modern dashboard-driven experience, optimizing for both mobile-first usage and administrative efficiency. This is an **optional enhancement** that should only be pursued after validating the improvements from Sprints 1-4.

**Key Goals:**
1. Reduce clicks to complete common tasks
2. Provide glanceable overview of key information
3. Improve information hierarchy
4. Maintain all existing functionality
5. Progressive enhancement (works without JavaScript)

---

## Why Dashboard Redesign?

### Current Pain Points (Post Sprint 1-4)
✅ **SOLVED:** Mobile responsiveness
✅ **SOLVED:** Styling consistency
❓ **REMAINING:** Information density
❓ **REMAINING:** Task completion speed
❓ **REMAINING:** Cognitive load for new users

### Expected Benefits

**For Regular Users (Players):**
- **Faster:** See upcoming sessions + payment status in one glance
- **Clearer:** "What do I need to do?" is immediately obvious
- **Mobile-first:** Card-based layout works better on phones than tabs

**For Admins:**
- **Efficient:** Jump to any task without navigating through tabs
- **Contextual:** See counts/summaries before diving into details
- **Scalable:** Easier to add new features as cards

---

## Design Philosophy

### Principles
1. **Progressive Disclosure:** Show summary → Details on demand
2. **Action-Oriented:** Every card has a clear call-to-action
3. **Mobile-First:** Design for smallest screen, enhance for larger
4. **Consistent:** Use design patterns from Sprints 1-4
5. **Accessible:** Keyboard navigation, screen reader friendly

### Design System (Continuing from Sprints 1-4)
```
Colors:
- Primary: Blue (blue-600, blue-50, etc.)
- Success: Green (green-600, green-50)
- Warning: Yellow (yellow-600, yellow-50)
- Danger: Red (red-600, red-50)
- Neutral: Gray (gray-50 to gray-900)

Typography:
- Headings: font-bold, text-2xl/xl/lg
- Body: text-sm/base
- Labels: text-xs, text-gray-600
- Stats: text-2xl/3xl font-bold

Spacing:
- Card padding: p-4 sm:p-6
- Card gaps: space-y-4 or gap-4
- Section spacing: space-y-6

Responsive:
- Mobile: < 640px (1 column)
- Tablet: 640-1024px (2 columns)
- Desktop: > 1024px (2-3 columns)
```

---

## Part 1: User Dashboard Redesign

### Current Architecture (Post Sprint 1-4)
```
CoachingUserTab.js
├── Tab 1: Upcoming Sessions
│   └── List of sessions with Register/Cancel buttons
└── Tab 2: Payments
    ├── Payment summary (3 cards)
    ├── Unpaid sessions list
    ├── Pending confirmation list
    └── Paid sessions list (last 5)
```

### Proposed Architecture
```
CoachingUserDashboard.js (NEW)
├── Hero Card: Next Session
│   └── Quick action: Register/View Details
├── Payment Status Card
│   └── Quick action: Pay Now
├── Upcoming Sessions Section (Collapsed/Expandable)
│   └── Next 5 sessions
└── Recent Activity Section
    └── Last 5 payments/registrations
```

### Detailed Mockups

#### Mobile View (< 640px)
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  Coaching Dashboard              ┃
┃  Welcome, [Name]                 ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  📅 Next Session                 ┃
┃  ─────────────────────────────── ┃
┃  Adults Coaching                 ┃
┃  Mon 13 Nov • 6:00pm            ┃
┃                                  ┃
┃  8 players registered            ┃
┃                                  ┃
┃  [   Register for Session   ] ✅ ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  💰 Payment Status               ┃
┃  ─────────────────────────────── ┃
┃  You owe: £16.00                ┃
┃  4 unpaid sessions               ┃
┃                                  ┃
┃  Pending: £8.00 (2 sessions)    ┃
┃                                  ┃
┃  [    Review & Pay    ] →       ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  📋 Upcoming Sessions (5) ▼      ┃
┃  ─────────────────────────────── ┃
┃  ⚪ Mon 13 Nov • Adults • 6pm    ┃
┃  ✅ Wed 15 Nov • Adults • 6pm    ┃
┃  ⚪ Mon 20 Nov • Adults • 6pm    ┃
┃  ⚪ Wed 22 Nov • Adults • 6pm    ┃
┃  ⚪ Mon 27 Nov • Adults • 6pm    ┃
┃                                  ┃
┃  [    View All Sessions    ] →  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  🔔 Recent Activity              ┃
┃  ─────────────────────────────── ┃
┃  • Registered for session (2d)   ┃
┃  • Payment confirmed (5d)        ┃
┃  • Marked payment (7d)           ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

#### Desktop View (> 1024px)
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  Coaching Dashboard                                     Welcome, [Name] ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━━━━┓ ┏━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  📅 Next Session       ┃ ┃  💰 Payment Status      ┃
┃  ───────────────────── ┃ ┃  ───────────────────── ┃
┃  Adults Coaching       ┃ ┃  Balance Owed          ┃
┃  Mon 13 Nov at 6:00pm  ┃ ┃  £16.00 (4 sessions)   ┃
┃                        ┃ ┃                        ┃
┃  📍 Court 1            ┃ ┃  Awaiting Confirmation ┃
┃  👥 8 registered       ┃ ┃  £8.00 (2 sessions)    ┃
┃                        ┃ ┃                        ┃
┃  [Register Now] ✅      ┃ ┃  [Review & Pay] →      ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━┛ ┗━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  📋 Upcoming Sessions                           (5) ▼ ┃
┃  ─────────────────────────────────────────────────── ┃
┃  ⚪ Mon 13 Nov • Adults • 6:00pm      [Register]     ┃
┃  ✅ Wed 15 Nov • Adults • 6:00pm      [Registered]   ┃
┃  ⚪ Mon 20 Nov • Adults • 6:00pm      [Register]     ┃
┃  ⚪ Wed 22 Nov • Adults • 6:00pm      [Register]     ┃
┃  ⚪ Mon 27 Nov • Adults • 6:00pm      [Register]     ┃
┃                                                       ┃
┃  [View All Sessions] →                                ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  🔔 Recent Activity                                   ┃
┃  ─────────────────────────────────────────────────── ┃
┃  • Registered for Adults session on Mon 13 Nov (2d)   ┃
┃  • Payment of £12.00 confirmed by admin (5d)          ┃
┃  • Marked 3 sessions as paid (£12.00) (7d)           ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

### Component Breakdown

#### 1. CoachingUserDashboard.js (NEW - ~250 lines)
```javascript
import React, { useState, useEffect } from 'react';
import { useCoaching } from '../../hooks/useCoaching';
import { useAppToast } from '../../contexts/ToastContext';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import NextSessionCard from './Dashboard/NextSessionCard';
import PaymentStatusCard from './Dashboard/PaymentStatusCard';
import UpcomingSessionsList from './Dashboard/UpcomingSessionsList';
import RecentActivityFeed from './Dashboard/RecentActivityFeed';

const CoachingUserDashboard = ({ currentUser }) => {
  // State management
  // Data fetching
  // Event handlers

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900">Coaching Dashboard</h2>
        <p className="text-gray-600">Welcome, {currentUser.name}</p>
      </div>

      {/* Hero Cards Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NextSessionCard
          session={nextSession}
          myAttendance={myAttendanceForNext}
          onRegister={handleRegister}
          onUnregister={handleUnregister}
        />
        <PaymentStatusCard
          summary={paymentSummary}
          onPayNow={() => setShowPaymentView(true)}
        />
      </div>

      {/* Upcoming Sessions */}
      <UpcomingSessionsList
        sessions={upcomingSessions}
        myAttendance={myAttendance}
        onRegister={handleRegister}
        onUnregister={handleUnregister}
        limit={5}
      />

      {/* Recent Activity */}
      <RecentActivityFeed
        activities={recentActivities}
        limit={5}
      />
    </div>
  );
};
```

#### 2. NextSessionCard.js (NEW - ~80 lines)
Hero card showing the very next coaching session.

**Features:**
- Large, prominent display
- Session type badge
- Date/time with icon
- Attendance count
- Location (if available)
- Register/Cancel button
- "No upcoming sessions" empty state

**Props:**
```typescript
{
  session: Session | null,
  myAttendance: Attendance | null,
  onRegister: (sessionId) => void,
  onUnregister: (attendanceId) => void,
  loading?: boolean
}
```

#### 3. PaymentStatusCard.js (NEW - ~100 lines)
Shows payment status with visual indicators.

**Features:**
- Amount owed (prominent if > 0)
- Pending confirmation amount
- Total paid (lifetime)
- Visual progress bar or indicator
- "Pay Now" CTA button
- "All paid up!" success state

**Props:**
```typescript
{
  summary: PaymentSummary,
  onPayNow: () => void,
  loading?: boolean
}
```

#### 4. UpcomingSessionsList.js (NEW - ~120 lines)
Collapsible list of upcoming sessions.

**Features:**
- Show first N sessions (default 5)
- Expandable to show all
- Compact list item design
- Register/Cancel inline
- "View All" link to legacy session list

**Props:**
```typescript
{
  sessions: Session[],
  myAttendance: Attendance[],
  onRegister: (sessionId) => void,
  onUnregister: (attendanceId) => void,
  limit?: number,
  defaultExpanded?: boolean
}
```

#### 5. RecentActivityFeed.js (NEW - ~80 lines)
Timeline of recent coaching-related actions.

**Features:**
- Last N activities (default 5)
- Activity types:
  - Session registration
  - Session cancellation
  - Payment marked
  - Payment confirmed
  - Payment reminder received
- Relative timestamps ("2 days ago")
- Icons for each activity type
- "View All Activity" link (optional)

**Props:**
```typescript
{
  activities: Activity[],
  limit?: number
}
```

**New Data Structure:** `Activity`
```typescript
interface Activity {
  id: string;
  type: 'registration' | 'cancellation' | 'payment_marked' | 'payment_confirmed' | 'reminder_received';
  description: string;
  timestamp: string; // ISO date
  relatedEntity?: {
    type: 'session' | 'payment';
    id: string;
  };
}
```

### Implementation Steps (User Dashboard)

#### Step 1: Create Component Structure (1 hour)
```bash
mkdir -p src/components/Coaching/Dashboard

# Create files:
touch src/components/Coaching/Dashboard/NextSessionCard.js
touch src/components/Coaching/Dashboard/PaymentStatusCard.js
touch src/components/Coaching/Dashboard/UpcomingSessionsList.js
touch src/components/Coaching/Dashboard/RecentActivityFeed.js
touch src/components/Coaching/CoachingUserDashboard.js
```

#### Step 2: Implement NextSessionCard (1.5 hours)
- Fetch next upcoming session
- Handle empty state (no sessions)
- Implement register/cancel logic
- Add loading skeleton
- Mobile responsive design
- Add icons and styling

#### Step 3: Implement PaymentStatusCard (1.5 hours)
- Calculate payment totals
- Visual indicators (color-coded)
- Handle "paid up" state
- Handle "no sessions" state
- Link to payment detail view
- Mobile responsive design

#### Step 4: Implement UpcomingSessionsList (1.5 hours)
- List first 5 sessions
- Collapsible functionality
- Inline register/cancel buttons
- Loading states
- Empty state
- "View All" navigation

#### Step 5: Implement RecentActivityFeed (1 hour)
- Define Activity data structure
- Create activity formatter
- Implement activity types
- Relative time display
- Icons for each type
- Link to related entities

#### Step 6: Integrate Dashboard (1 hour)
- Wire up all cards to useCoaching hook
- Handle loading states
- Add navigation toggle (Dashboard ⇄ Legacy View)
- Test all interactions
- Error handling

---

## Part 2: Admin Dashboard Redesign

### Current Architecture (Post Sprint 1-4)
```
CoachingAdminTab.js
├── Tab Navigation (5 tabs)
├── Tab 1: Schedules
├── Tab 2: Sessions & Attendance
├── Tab 3: Player Payments
├── Tab 4: Coach Payments
└── Tab 5: Access Control
```

### Proposed Architecture
```
CoachingAdminDashboard.js (NEW)
├── Quick Stats Row (4 metrics)
├── Action Cards Grid (6 cards)
│   ├── Manage Sessions
│   ├── Player Payments
│   ├── Coach Payments
│   ├── Schedules
│   ├── Access Control
│   └── Reports (future)
└── Recent Activity Feed
```

**When clicking a card:** Navigate to dedicated detail view with breadcrumbs

### Detailed Mockups

#### Mobile View (< 640px)
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  Admin Dashboard                 ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  12    £245   £640    45         ┃
┃  Sessions  Owed   Due    Players ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  📅 Manage Sessions              ┃
┃  12 upcoming • 3 need attention  ┃
┃  [View Details] →                ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  💰 Player Payments              ┃
┃  £245 owed • 8 players           ┃
┃  [Review] →                      ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  💵 Coach Payments               ┃
┃  £640 due • 16 sessions          ┃
┃  [Pay Coach] →                   ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ⚙️  Schedules & Setup           ┃
┃  3 active schedules              ┃
┃  [Manage] →                      ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  🔐 Access Control               ┃
┃  45 active players               ┃
┃  [Manage] →                      ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

#### Desktop View (> 1024px)
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  Admin Dashboard                                    Last updated: now ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┌─────────────┬─────────────┬─────────────┬─────────────┐
│  12         │  £245       │  £640       │  45         │
│  Upcoming   │  Players    │  Coach      │  Active     │
│  Sessions   │  Owe        │  Payment Due│  Players    │
└─────────────┴─────────────┴─────────────┴─────────────┘

┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  📅 Manage Sessions      ┃ ┃  💰 Player Payments      ┃
┃  ─────────────────────── ┃ ┃  ─────────────────────── ┃
┃  • 12 upcoming           ┃ ┃  • £245 total owed       ┃
┃  • 28 completed          ┃ ┃  • 8 players owe money   ┃
┃  • 3 need attention ⚠️   ┃ ┃  • 3 pending confirm ⏳  ┃
┃                          ┃ ┃                          ┃
┃  [View All Sessions] →   ┃ ┃  [Review Payments] →     ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  💵 Coach Payments       ┃ ┃  ⚙️  Schedules & Setup   ┃
┃  ─────────────────────── ┃ ┃  ─────────────────────── ┃
┃  • £640 owed to coach    ┃ ┃  • 3 active schedules    ┃
┃  • 16 unpaid sessions    ┃ ┃  • Last generated: 2d    ┃
┃  • Balance: -£640        ┃ ┃  • Auto-generate: On ✅   ┃
┃                          ┃ ┃                          ┃
┃  [Pay Coach] →           ┃ ┃  [Manage Schedules] →    ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  🔐 Access Control       ┃ ┃  📊 Reports (Future)     ┃
┃  ─────────────────────── ┃ ┃  ─────────────────────── ┃
┃  • 45 active players     ┃ ┃  Coming soon...          ┃
┃  • 3 pending requests    ┃ ┃                          ┃
┃  • Last granted: 5d      ┃ ┃                          ┃
┃                          ┃ ┃                          ┃
┃  [Manage Access] →       ┃ ┃  [View Roadmap] →        ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  🔔 Recent Admin Activity                                             ┃
┃  ───────────────────────────────────────────────────────────────────  ┃
┃  • Payment of £12.00 confirmed for John Smith (5 min ago)             ┃
┃  • 3 sessions generated from Adults schedule (2 hours ago)            ┃
┃  • Jane Doe marked 2 sessions as paid (£8.00) (3 hours ago)          ┃
┃  • Access granted to Mike Johnson (1 day ago)                         ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

### Breadcrumb Navigation
When clicking into any detail view:

```
Home > Admin Dashboard > Player Payments
[← Back to Dashboard]

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  Player Payments                                    [Send Reminders]  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

[Existing PaymentManagement.js component renders here]
```

### Component Breakdown

#### 1. CoachingAdminDashboard.js (NEW - ~200 lines)
```javascript
import React, { useState, useEffect } from 'react';
import { useCoaching } from '../../hooks/useCoaching';
import QuickStatsBar from './Dashboard/Admin/QuickStatsBar';
import ActionCard from './Dashboard/Admin/ActionCard';
import AdminActivityFeed from './Dashboard/Admin/AdminActivityFeed';

const CoachingAdminDashboard = ({ currentUser, allUsers }) => {
  // State management
  // Data fetching

  const actionCards = [
    {
      id: 'sessions',
      icon: Calendar,
      title: 'Manage Sessions',
      color: 'blue',
      stats: [
        { label: 'Upcoming', value: upcomingCount },
        { label: 'Need Attention', value: attentionCount, alert: attentionCount > 0 }
      ],
      action: () => setView('sessions')
    },
    // ... more cards
  ];

  return (
    <div className="space-y-6">
      <QuickStatsBar stats={quickStats} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {actionCards.map(card => (
          <ActionCard key={card.id} {...card} />
        ))}
      </div>

      <AdminActivityFeed activities={recentAdminActivities} />
    </div>
  );
};
```

#### 2. QuickStatsBar.js (NEW - ~50 lines)
Compact row of key metrics.

**Features:**
- 4 key metrics (upcoming sessions, player debt, coach debt, active players)
- Color-coded
- Responsive (stacks on mobile, row on desktop)
- Click to navigate to detail

#### 3. ActionCard.js (NEW - ~70 lines)
Reusable card for each admin action.

**Features:**
- Icon + title
- 2-3 key stats
- Alert indicator (if action needed)
- CTA button
- Hover effect
- Loading skeleton

#### 4. AdminActivityFeed.js (NEW - ~100 lines)
Shows recent admin actions across the coaching system.

**Features:**
- All activity types from user feed + admin-specific:
  - Payment confirmed by admin
  - Sessions generated
  - Access granted/revoked
  - Reminder sent
- Filterable by type
- Expandable detail

#### 5. Navigation/Routing Updates
```javascript
// In CoachingAdminTab.js (modified)
const CoachingAdminTab = ({ currentUser, allUsers }) => {
  const [view, setView] = useState('dashboard'); // dashboard, sessions, payments, etc.

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      {view !== 'dashboard' && (
        <nav className="flex items-center gap-2 text-sm">
          <button onClick={() => setView('dashboard')} className="text-blue-600">
            Dashboard
          </button>
          <span className="text-gray-400">›</span>
          <span className="text-gray-900">{getViewTitle(view)}</span>
        </nav>
      )}

      {/* View Router */}
      {view === 'dashboard' && <CoachingAdminDashboard onNavigate={setView} />}
      {view === 'sessions' && <UnifiedSessionManagement ... />}
      {view === 'player-payments' && <PaymentManagement ... />}
      {/* ... other views */}
    </div>
  );
};
```

### Implementation Steps (Admin Dashboard)

#### Step 1: Create Component Structure (30 min)
```bash
mkdir -p src/components/Coaching/Dashboard/Admin

touch src/components/Coaching/Dashboard/Admin/QuickStatsBar.js
touch src/components/Coaching/Dashboard/Admin/ActionCard.js
touch src/components/Coaching/Dashboard/Admin/AdminActivityFeed.js
touch src/components/Coaching/CoachingAdminDashboard.js
```

#### Step 2: Implement QuickStatsBar (45 min)
- Calculate key metrics from useCoaching data
- Responsive grid layout
- Color-coded based on values
- Click handlers

#### Step 3: Implement ActionCard (1 hour)
- Reusable component
- Icon + stats display
- Alert indicator
- Loading state
- Hover/active states

#### Step 4: Implement AdminActivityFeed (1.5 hours)
- Extend Activity data structure
- Admin-specific activity types
- Filtering
- Expandable details
- Real-time updates (optional)

#### Step 5: Implement CoachingAdminDashboard (1 hour)
- Wire up all cards
- Calculate stats
- Handle navigation
- Loading states
- Error handling

#### Step 6: Update Navigation & Routing (1 hour)
- Modify CoachingAdminTab.js
- Add view state management
- Implement breadcrumb navigation
- Add back button
- Test all navigation paths

---

## Database Considerations

### New Table: coaching_activity_log (Optional)
For tracking admin activities (if not already tracked):

```sql
CREATE TABLE coaching_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_type TEXT NOT NULL, -- 'registration', 'payment_confirmed', 'access_granted', etc.
  user_id UUID REFERENCES profiles(id), -- Who did the action
  target_user_id UUID REFERENCES profiles(id), -- Who was affected (if applicable)
  session_id UUID REFERENCES coaching_sessions(id), -- Related session (if applicable)
  payment_id UUID REFERENCES coaching_payments(id), -- Related payment (if applicable)
  description TEXT NOT NULL,
  metadata JSONB, -- Additional context
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_log_created ON coaching_activity_log(created_at DESC);
CREATE INDEX idx_activity_log_user ON coaching_activity_log(user_id);
CREATE INDEX idx_activity_log_target ON coaching_activity_log(target_user_id);
```

**Alternative:** Derive activities from existing tables (no new table needed)
- Registrations: `coaching_attendance` (created_at)
- Payments: `coaching_attendance` (payment_status changes)
- Access: `coaching_access` (created_at)

**Recommendation:** Start without new table, derive from existing data. Add dedicated table only if performance issues arise or richer activity tracking needed.

### RPC Functions (Optional Additions)

#### get_recent_coaching_activities
```sql
CREATE OR REPLACE FUNCTION get_recent_coaching_activities(
  p_user_id UUID DEFAULT NULL,
  p_limit INT DEFAULT 10,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  activity_type TEXT,
  description TEXT,
  timestamp TIMESTAMPTZ,
  related_entity JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Combine data from multiple tables
  -- coaching_attendance, coaching_access, etc.
  -- ORDER BY timestamp DESC
  -- LIMIT p_limit OFFSET p_offset
END;
$$;
```

---

## Testing Strategy

### Unit Tests
**New Components to Test:**
- NextSessionCard.js
- PaymentStatusCard.js
- UpcomingSessionsList.js
- RecentActivityFeed.js
- QuickStatsBar.js
- ActionCard.js
- AdminActivityFeed.js

**Test Cases:**
- Rendering with data
- Empty states
- Loading states
- Error states
- User interactions (clicks, expand/collapse)
- Responsive behavior (snapshot tests at different widths)

### Integration Tests
- User dashboard flow: View next session → Register → Check payment status
- Admin dashboard flow: View card → Navigate to detail → Perform action → Return
- Navigation: Dashboard ⇄ Detail views
- Breadcrumb navigation
- Activity feed updates after actions

### User Acceptance Testing
**User Dashboard:**
1. Can I see my next session at a glance?
2. Can I see if I owe money immediately?
3. Can I register for a session in 2 clicks?
4. Does the "Recent Activity" make sense?

**Admin Dashboard:**
5. Can I see what needs attention immediately?
6. Can I navigate to any section in 1 click?
7. Is the breadcrumb navigation intuitive?
8. Do the stats match reality?

### Device Testing Matrix
| Device | Width | Test User Dashboard | Test Admin Dashboard |
|--------|-------|---------------------|----------------------|
| iPhone SE | 375px | ✅ All cards stack | ✅ Cards stack, stats readable |
| iPhone 12 | 390px | ✅ | ✅ |
| iPad | 768px | ✅ 2-column layout | ✅ 2-column grid |
| Desktop | 1440px | ✅ 2-column layout | ✅ 3-column grid |

---

## Risk Assessment

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Performance degradation** (too many components) | Low | Medium | Lazy load dashboard, memoize calculations |
| **Navigation complexity** | Medium | Medium | Clear breadcrumbs, "Back" button, persist state |
| **Activity feed performance** | Low | Low | Limit to recent N, pagination if needed |
| **Breaking existing functionality** | Low | High | Feature flag, A/B test, gradual rollout |
| **User confusion** | Medium | Medium | Provide toggle to legacy view, user guide |

### UX Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Users prefer tab navigation** | Medium | Medium | Provide toggle, gather feedback |
| **Information overload** | Low | Low | Progressive disclosure, collapsible sections |
| **Mobile cards too small** | Low | Medium | Minimum touch target 44px, test on device |
| **Admin finds dashboard slower** | Low | High | Optimize for 1-click access to common tasks |

### Deployment Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Bundle size increase** | Low | Low | Code split, lazy load dashboard |
| **Backward compatibility** | Very Low | High | Feature flag, can toggle back to tabs |
| **Data migration needed** | Very Low | High | No data changes required |

---

## Timeline & Milestones

### Week 1 (User Dashboard)
**Day 1 (2 hours):**
- ✅ Create component structure
- ✅ Implement NextSessionCard
- ✅ Implement PaymentStatusCard

**Day 2 (2 hours):**
- ✅ Implement UpcomingSessionsList
- ✅ Implement RecentActivityFeed

**Day 3 (2 hours):**
- ✅ Integrate all cards into CoachingUserDashboard
- ✅ Wire up to useCoaching hook
- ✅ Add loading/error states
- ✅ Add toggle to legacy view

**Day 4 (1 hour):**
- ✅ User testing on mobile devices
- ✅ Fix bugs
- ✅ Polish UI

**Milestone:** User dashboard complete and functional

### Week 2 (Admin Dashboard)
**Day 5 (1.5 hours):**
- ✅ Implement QuickStatsBar
- ✅ Implement ActionCard
- ✅ Implement AdminActivityFeed

**Day 6 (1.5 hours):**
- ✅ Implement CoachingAdminDashboard
- ✅ Calculate all stats
- ✅ Wire up navigation

**Day 7 (1.5 hours):**
- ✅ Update CoachingAdminTab with routing
- ✅ Implement breadcrumb navigation
- ✅ Add "Back to Dashboard" button
- ✅ Add toggle to legacy view

**Day 8 (1 hour):**
- ✅ Admin testing
- ✅ Fix bugs
- ✅ Polish UI
- ✅ Documentation

**Milestone:** Admin dashboard complete and functional

### Week 3 (Polish & Deploy)
**Day 9 (1 hour):**
- ✅ Cross-browser testing
- ✅ Accessibility audit
- ✅ Performance testing

**Day 10 (1 hour):**
- ✅ Create feature flag
- ✅ Deploy to preview
- ✅ User acceptance testing

**Milestone:** Ready for production deployment

---

## Feature Flag Implementation

### Purpose
Allow gradual rollout and easy rollback if issues arise.

### Implementation
```javascript
// src/config/features.js
export const FEATURES = {
  COACHING_DASHBOARD: process.env.REACT_APP_COACHING_DASHBOARD === 'true' || false,
};

// Usage in CoachingUserTab.js
import { FEATURES } from '../../config/features';

const CoachingUserTab = ({ currentUser }) => {
  const [useDashboard, setUseDashboard] = useState(FEATURES.COACHING_DASHBOARD);

  return (
    <div className="space-y-6">
      {/* Toggle */}
      <div className="flex justify-end">
        <button onClick={() => setUseDashboard(!useDashboard)}>
          {useDashboard ? 'Switch to Classic View' : 'Try New Dashboard'}
        </button>
      </div>

      {useDashboard ? (
        <CoachingUserDashboard currentUser={currentUser} />
      ) : (
        </* Existing tab-based view */>
      )}
    </div>
  );
};
```

### Environment Variables
```bash
# .env.local (development - test new dashboard)
REACT_APP_COACHING_DASHBOARD=true

# .env.production (production - gradual rollout)
REACT_APP_COACHING_DASHBOARD=false  # Start with false
```

### Rollout Strategy
1. **Week 1:** Deploy with flag OFF, gather feedback on preview
2. **Week 2:** Enable for 10% of users (A/B test)
3. **Week 3:** Enable for 50% if positive feedback
4. **Week 4:** Enable for 100% if no issues
5. **Week 5:** Remove toggle, make dashboard default

---

## Success Metrics

### Quantitative Metrics
**User Engagement:**
- Time to complete registration: Target < 10 seconds (currently ~15-20s)
- Time to check payment status: Target < 5 seconds (currently ~10s)
- Number of clicks to register: Target 2 clicks (currently 3+)

**Admin Efficiency:**
- Time to navigate to player payments: Target 1 click (currently 2 clicks)
- Time to confirm payment: Target < 30 seconds (currently ~45s)
- Number of clicks to send reminders: Target 2 clicks (currently 3)

**Technical:**
- Page load time: Target < 1.5s (same or better than current)
- Largest Contentful Paint (LCP): Target < 2.5s
- First Input Delay (FID): Target < 100ms

### Qualitative Metrics
**User Satisfaction (Survey after 2 weeks):**
- Do you prefer the dashboard or classic view? (5-point scale)
- Is it easier to see what you need to do? (Yes/No/Same)
- Would you recommend the new design? (NPS score)

**Admin Feedback:**
- Is the dashboard helping you work faster? (5-point scale)
- Do you miss any features from the tab view? (Free text)
- Suggestions for improvement? (Free text)

### Acceptance Criteria
**Must Have (MVP):**
- ✅ User dashboard shows next session
- ✅ User dashboard shows payment status
- ✅ Admin dashboard shows all key metrics
- ✅ All existing functionality preserved
- ✅ No performance regression
- ✅ Mobile responsive on all devices

**Should Have:**
- ✅ Recent activity feed
- ✅ Collapsible upcoming sessions list
- ✅ Breadcrumb navigation for admin
- ✅ Toggle between dashboard/classic view
- ✅ Loading skeletons

**Nice to Have:**
- ⚪ Real-time activity updates
- ⚪ Keyboard shortcuts
- ⚪ Customizable dashboard (drag/drop cards)
- ⚪ Export/print dashboard view

---

## Accessibility Checklist

### Keyboard Navigation
- [ ] All cards focusable with Tab
- [ ] Enter/Space activates CTA buttons
- [ ] Escape closes expanded sections
- [ ] Arrow keys navigate within lists

### Screen Readers
- [ ] All cards have descriptive aria-labels
- [ ] Loading states announced
- [ ] Error states announced
- [ ] Success states announced
- [ ] Activity feed has proper structure (list with items)

### Visual
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] Focus indicators visible (2px outline)
- [ ] No information conveyed by color alone
- [ ] Text scalable to 200% without breaking layout

### Motion
- [ ] Respect prefers-reduced-motion
- [ ] Collapsible animations can be disabled
- [ ] Loading spinners have accessible alternatives

---

## Documentation Requirements

### User Documentation
**"Getting Started with the New Dashboard"**
- What's changed?
- How to navigate
- Finding your next session
- Checking payment status
- Switching back to classic view

### Admin Documentation
**"Admin Dashboard Guide"**
- Overview of action cards
- Understanding quick stats
- Navigating to detail views
- Using breadcrumbs
- Recent activity feed

### Developer Documentation
**"Dashboard Architecture"**
- Component structure
- Data flow
- Adding new cards
- Modifying stats
- Activity feed implementation

---

## Migration Path

### Phase 1: Soft Launch (Week 1)
- Deploy with feature flag OFF
- Allow users to opt-in via toggle
- Gather feedback
- Fix critical bugs

### Phase 2: A/B Test (Week 2-3)
- Enable for 10% of users
- Monitor metrics
- Compare engagement
- Iterate based on feedback

### Phase 3: Gradual Rollout (Week 4)
- Enable for 50% of users
- Continue monitoring
- Address any issues
- Refine based on usage patterns

### Phase 4: Full Rollout (Week 5)
- Enable for 100% of users
- Keep toggle for 2 weeks (safety net)
- Gather final feedback

### Phase 5: Cleanup (Week 6+)
- Remove feature flag
- Remove classic view toggle
- Remove legacy tab navigation code (optional)
- Update documentation

---

## Cost-Benefit Analysis

### Costs

**Development Time:**
- User Dashboard: 7 hours
- Admin Dashboard: 5 hours
- Testing & Polish: 2 hours
- Documentation: 1 hour
- **Total:** 15 hours (revised from original 8 hours)

**Ongoing Maintenance:**
- Dashboard components to maintain
- Potential bugs to fix
- User support for new interface

### Benefits

**User Experience:**
- **Faster task completion** - Fewer clicks for common actions
- **Better information hierarchy** - Most important info first
- **Reduced cognitive load** - Clear "what to do next"
- **Improved mobile UX** - Cards work better than tabs on small screens

**Business Value:**
- **Increased engagement** - Easier access = more usage
- **Reduced support burden** - Clearer UI = fewer questions
- **Scalability** - Easier to add new features as cards
- **Modern appearance** - Looks professional, builds trust

**Technical:**
- **Better architecture** - Component-based, easier to extend
- **Performance** - Can lazy load, better code splitting
- **Maintainability** - Smaller components, clear responsibilities

### ROI Estimate
**Break-even:** ~20 hours of saved admin time over 6 months
- Current: 15 min/day on coaching admin tasks × 180 days = 45 hours
- With dashboard: 10 min/day × 180 days = 30 hours
- **Savings: 15 hours** in 6 months

**User Satisfaction:** Estimated 30% improvement in user ratings
- Current NPS: ~40 (assumed)
- Target NPS: ~55 (with better UX)

**Conclusion:** **WORTH IT** if you value modern UX and plan to add more coaching features. **NOT WORTH IT** if current interface is "good enough" and no future expansion planned.

---

## Alternatives Considered

### Alternative 1: Keep Tab-Based, Just Improve Tabs
**Pros:**
- Less work (2 hours vs 15 hours)
- No user re-training
- Lower risk

**Cons:**
- Still tab-based (inherently more clicks)
- Harder to show overview information
- Limited mobile optimization

**Decision:** Rejected. Tabs are fundamentally limiting for information density.

### Alternative 2: Hybrid Approach (Tabs + Dashboard)
**Pros:**
- Dashboard for overview, tabs for details
- Best of both worlds
- Gradual transition

**Cons:**
- More complex
- Confusing navigation
- Harder to maintain

**Decision:** Rejected. Too complex, confusing for users.

### Alternative 3: Full Single-Page App (No Tabs, No Dashboard)
**Pros:**
- Modern SPA feel
- Infinite scrolling
- Rich interactions

**Cons:**
- Major rewrite (40+ hours)
- High risk
- Overkill for current needs

**Decision:** Rejected. Too much work for incremental benefit.

---

## Conclusion & Recommendation

### Summary
Sprint 5 proposes a dashboard-driven redesign of the coaching section, building on the solid mobile-responsive foundation from Sprints 1-4. The dashboard provides:
- **Glanceable overview** of key information
- **Faster task completion** through reduced clicks
- **Better mobile experience** with card-based layout
- **Scalability** for future feature additions

### Effort vs. Value
| Aspect | Score (1-10) | Notes |
|--------|--------------|-------|
| Development Effort | 7 | 15 hours is significant |
| Technical Complexity | 6 | Moderate - new components, routing |
| User Impact | 8 | High - better UX for all users |
| Admin Impact | 9 | Very high - major efficiency gains |
| Risk Level | 4 | Low - can rollback with feature flag |
| **Overall Value** | **8/10** | **Recommended** |

### My Recommendation

**PROCEED WITH SPRINT 5** if:
1. ✅ Sprints 1-4 improvements validated positively by users
2. ✅ You have 15+ hours available for development
3. ✅ You plan to add more coaching features in future
4. ✅ User feedback indicates desire for "easier" or "clearer" interface
5. ✅ Mobile usage is significant (> 30% of traffic)

**DEFER SPRINT 5** if:
1. ❌ Sprints 1-4 revealed issues that need addressing first
2. ❌ Current interface is "good enough" for your needs
3. ❌ Limited development time available
4. ❌ Users are happy with current tab-based navigation
5. ❌ Mostly desktop usage

### Suggested Approach
1. **Deploy Sprints 1-4** to production
2. **Gather feedback** for 2-4 weeks
3. **Review metrics** (session length, task completion time)
4. **Survey users** about pain points
5. **Decide** on Sprint 5 based on data

If you proceed:
1. Start with **user dashboard only** (7 hours) - bigger impact
2. Test and validate
3. Then proceed with **admin dashboard** (5 hours) if successful
4. This staged approach reduces risk

---

## Files to Create (Sprint 5)

### User Dashboard (7 files)
```
src/components/Coaching/
├── CoachingUserDashboard.js                 (NEW - 250 lines)
└── Dashboard/
    ├── NextSessionCard.js                   (NEW - 80 lines)
    ├── PaymentStatusCard.js                 (NEW - 100 lines)
    ├── UpcomingSessionsList.js              (NEW - 120 lines)
    └── RecentActivityFeed.js                (NEW - 80 lines)

src/utils/
└── activityHelpers.js                       (NEW - 50 lines)
                                             Optional utilities

src/config/
└── features.js                              (NEW - 10 lines)
                                             Feature flags
```

### Admin Dashboard (4 files)
```
src/components/Coaching/
├── CoachingAdminDashboard.js                (NEW - 200 lines)
└── Dashboard/Admin/
    ├── QuickStatsBar.js                     (NEW - 50 lines)
    ├── ActionCard.js                        (NEW - 70 lines)
    └── AdminActivityFeed.js                 (NEW - 100 lines)
```

### Modified Files (2 files)
```
src/components/Coaching/
├── CoachingUserTab.js                       (MODIFIED - add toggle/routing)
└── CoachingAdminTab.js                      (MODIFIED - add routing/breadcrumbs)
```

**Total New Code:** ~1,200 lines across 13 new files, 2 modified files

---

## Questions to Answer Before Starting

1. **User Feedback:** Have users expressed frustration with current navigation?
2. **Usage Patterns:** Which sections do users/admins access most frequently?
3. **Mobile Percentage:** What % of traffic is mobile? (if < 20%, lower priority)
4. **Future Plans:** Do you plan to add more coaching features? (if yes, dashboard scales better)
5. **Development Time:** Can you commit 15 hours over 2-3 weeks?
6. **Testing Resources:** Can you recruit 5-10 users for beta testing?

---

**Ready to proceed?** Let me know and I'll start with the user dashboard implementation!

---

*Sprint 5 Plan created by Claude Code*
*Comprehensive planning complete - ready for execution when approved*
