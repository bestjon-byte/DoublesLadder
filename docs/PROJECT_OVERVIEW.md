# Tennis Ladder App - Project Overview

## Project Description
A comprehensive React-based web application for managing tennis doubles ladder competitions. The application enables players to join ladders, schedule matches, submit scores, track availability, and view league standings across multiple seasons.

## Technology Stack
- **Frontend**: React 18.2.0 with functional components and hooks
- **Backend**: Supabase (PostgreSQL database with real-time features)
- **UI Components**: Lucide React icons
- **Styling**: CSS with modern responsive design
- **Build Tool**: Create React App (React Scripts 5.0.1)
- **Authentication**: Supabase Auth
- **Real-time Features**: Supabase subscriptions

## Core Features
1. **Multi-Season Management**: Support for multiple tennis seasons with separate ladders
2. **Player Authentication**: Secure login/registration with email verification
3. **Ladder System**: Dynamic ranking system with match-based position changes
4. **Match Scheduling**: Calendar-based match scheduling with availability tracking
5. **Score Submission**: Comprehensive score entry with validation and challenges
6. **League Integration**: Import/export functionality for external league systems
7. **Admin Dashboard**: Full administrative controls for league management
8. **Real-time Updates**: Live updates across all connected clients
9. **Progressive Web App**: Mobile-friendly with offline capabilities
10. **Push Notifications**: Browser-based notifications for match updates

## Project Structure
```
src/
├── components/           # React components organized by feature
│   ├── Admin/           # Administrative functionality
│   ├── Auth/            # Authentication components
│   ├── Availability/    # Player availability management
│   ├── Ladder/          # Ladder display and management
│   ├── Layout/          # Header, navigation, and layout components
│   ├── Matches/         # Match display and management
│   ├── Modals/          # Modal dialogs for various actions
│   ├── Notifications/   # Notification settings and display
│   ├── Profile/         # User profile management
│   ├── Season/          # Season selection and management
│   └── shared/          # Reusable UI components
├── contexts/            # React context providers
├── hooks/               # Custom React hooks
├── utils/               # Utility functions and helpers
├── App.js              # Main application component
├── index.js            # Application entry point
└── supabaseClient.js   # Supabase configuration and client
```

## Database Schema Overview
- **Players**: User profiles and authentication data
- **Seasons**: Tennis seasons with start/end dates and settings
- **Ladder_Entries**: Player positions in seasonal ladders
- **Matches**: Match records with scores and metadata
- **Availability**: Player availability for scheduling
- **Match_Challenges**: Score dispute system
- **Push_Subscriptions**: Browser push notification endpoints

## Key Application States
1. **Authentication State**: Login/logout status and user profile
2. **Season State**: Current active season and available seasons
3. **Ladder State**: Current ladder positions and player rankings
4. **Match State**: Scheduled and completed matches
5. **Availability State**: Player availability for match scheduling

## Development Status
- **Version**: 1.0.49
- **Status**: Production ready
- **Last Updated**: Active development with regular updates
- **Deployment**: Configured for live deployment with automated scripts

## Browser Support
- Modern browsers (Chrome, Firefox, Safari)
- Mobile responsive design
- Progressive Web App capabilities
- Offline functionality where applicable