// src/App.js - PRODUCTION VERSION WITH MULTI-SEASON
import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useApp } from './hooks/useApp';
import { useSeasonManager } from './hooks/useSeasonManager';
import { submitScoreWithConflictHandling, submitScoreChallenge } from './utils/scoreSubmission';

// Components
import AuthScreen from './components/Auth/AuthScreen';
import Navigation from './components/Layout/Navigation';
import LeagueTab from './components/Ladder/LadderTab'; // RENAMED: Will be moved to League/LeagueTab later
import MatchesTab from './components/Matches/MatchesTab';
import ProfileTab from './components/Profile/ProfileTab';
import TrophyCabinetTab from './components/TrophyCabinet/TrophyCabinetTab';
import AvailabilityTab from './components/Availability/AvailabilityTab';
import AdminTab from './components/Admin/AdminTab';
import CoachingAdminTab from './components/Coaching/CoachingAdminTab';
import CoachingUserTab from './components/Coaching/CoachingUserTab';
import CoachDashboard from './components/Coaching/CoachDashboard';
import ScheduleModal from './components/Modals/ScheduleModal';
import EnhancedScoreModal from './components/Modals/EnhancedScoreModal';
import PlayersGuideModal from './components/Modals/PlayersGuideModal';
import LoadingScreen from './components/shared/LoadingScreen';
import ErrorBoundary from './components/shared/ErrorBoundary';
import UpdateNotification from './components/shared/UpdateNotification';
import VersionDisplay from './components/shared/VersionDisplay';
import SeasonSelector from './components/Season/SeasonSelector';
import PaymentConfirmation from './components/Public/PaymentConfirmation';
import { ToastProvider } from './contexts/ToastContext';
import './components/TrophyCabinet/TrophyCabinet.css';

const CawoodTennisApp = () => {
  // Authentication hook
  const authData = useAuth();
  const {
    user = null,
    loading: authLoading = true,
    authMode = 'normal',
    actions: authActions = {}
  } = authData || {};

  // NEW: Season management hook - only load seasons when authenticated
  const isAuthenticated = !!user;
  const seasonData = useSeasonManager(isAuthenticated);
  const {
    seasons = [],
    activeSeason = null,
    selectedSeason = null,
    loading: seasonLoading = true,
    actions: seasonActions = {}
  } = seasonData || {};
  
  // App data hook - NOW INCLUDES selectedSeason.id
  const appData = useApp(user?.id, selectedSeason?.id);
  const {
    ladderPlayers = [], // NEW: Season-specific players for ladder
    allUsers = [], // NEW: All users for admin management
    selectedSeason: selectedSeasonData = null, // Selected season data with matches
    availability = [],
    matchFixtures = [],
    matchResults = [],
    loading: dataLoading = { initial: true },
    error = null,
    actions = {},
    helpers = {},
    refetch = {},
    supabase = null // Add supabase instance
  } = appData || {};

  // UI State
  const [activeTab, setActiveTab] = useState('ladder');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [showPlayersGuide, setShowPlayersGuide] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [newMatchDate, setNewMatchDate] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState(null); // For viewing other players' profiles

  // Set default tab for coaches to coaching
  useEffect(() => {
    if (user?.role === 'coach') {
      setActiveTab('coaching');
    }
  }, [user?.role]);

  // Check for hook failures
  if (!authData || !seasonData || !appData) {
    return <div className="p-4 bg-red-100">Error: Service unavailable</div>;
  }

  // Show error state if any hook has an error (but not if still loading)
  if (!authLoading && !seasonLoading && !dataLoading?.initial && (error || seasonData?.error || authData?.error)) {
    const handleRetry = async () => {
      // Retry connection by refetching all data
      if (refetch?.all) {
        try {
          await refetch.all();
        } catch (error) {
          // Error will be handled by hooks
        }
      }
    };

    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
          <h2 className="text-xl font-bold text-red-600 mb-4">Connection Error</h2>
          <p className="text-gray-700 mb-4">
            There was a problem connecting to the server. This may be temporary.
          </p>
          <button
            onClick={handleRetry}
            className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // Check for payment confirmation token (public access - no auth required)
  const urlParams = new URLSearchParams(window.location.search);
  const paymentToken = urlParams.get('token');
  if (paymentToken) {
    return <PaymentConfirmation />;
  }

  // Score submission handler
  const submitScore = async (pair1Score, pair2Score) => {
    if (!selectedMatch) return;
    
    try {
      const result = await submitScoreWithConflictHandling(
        selectedMatch.fixtureId,
        pair1Score,
        pair2Score,
        user.id
      );
      
      // Refresh data
      if (refetch?.results) await refetch.results();
      if (refetch?.seasons) await refetch.seasons();
      
      return result;
    } catch (error) {
      throw error;
    }
  };

  // Score challenge handler
  const handleScoreChallenge = async (challengeData) => {
    try {
      await submitScoreChallenge({
        ...challengeData,
        challengerId: user.id
      });
      
      // Refresh data
      if (refetch?.results) await refetch.results();
      
      return { success: true };
    } catch (error) {
      throw error;
    }
  };

  // Player profile navigation handler
  const handlePlayerSelect = (playerId) => {
    setSelectedPlayerId(playerId);
    setActiveTab('profile'); // Switch to profile tab when selecting a player
  };

  // Modal handlers
  const openScoreModal = (matchData) => {
    setSelectedMatch(matchData);
    setShowScoreModal(true);
  };

  const handleAddMatch = async () => {
    if (actions?.addMatchToSeason) {
      const result = await actions.addMatchToSeason(newMatchDate);
      if (result?.success) {
        setShowScheduleModal(false);
        setNewMatchDate('');
      }
    }
  };

  // Loading state with manual override after timeout
  if (authLoading || seasonLoading || dataLoading?.initial) {
    const loadingMessage = authLoading ? 'Authenticating...' :
                          seasonLoading ? 'Loading seasons...' :
                          'Loading app data...';
    return <LoadingScreen message={loadingMessage} onRetry={refetch?.all} />;
  }

  // Main app - MOVED ToastProvider to wrap everything
  return (
    <ToastProvider>
      {/* Password reset mode */}
      {authMode === 'reset' && (
        <AuthScreen 
          onAuthChange={() => {}}
          isPasswordReset={true}
          onPasswordResetComplete={() => {
            if (authActions?.setAuthMode) {
              authActions.setAuthMode('normal');
            }
          }}
        />
      )}

      {/* Not authenticated */}
      {!user && authMode !== 'reset' && (
        <AuthScreen onAuthChange={() => {}} />
      )}

      {/* Authenticated app */}
      {user && (
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-50" style={{ minHeight: '100dvh' }}>
        {/* Ultra Compact Header - Logo embedded in season selector */}
        <header className="bg-[#5D1F1F] text-white shadow-sm" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <div className="max-w-7xl mx-auto px-3 py-3 pb-4">
            <div className="flex items-center justify-between h-12">
              {/* Left: Season Selector with embedded logo */}
              <div className="flex-1 max-w-[280px] sm:max-w-[320px]">
                <SeasonSelector 
                  seasons={seasons}
                  selectedSeason={selectedSeason}
                  onSeasonSelect={seasonActions?.setSelectedSeason}
                  loading={seasonLoading}
                />
              </div>
              
              {/* Right: Guide and Sign Out */}
              <div className="flex items-center space-x-2">
                {selectedSeason?.season_type === 'ladder' && (
                  <button
                    onClick={() => setShowPlayersGuide(true)}
                    className="bg-[#4A1818] hover:bg-[#6B2424] text-white px-3 py-1.5 rounded transition-colors min-h-[44px] flex items-center text-sm"
                    style={{ touchAction: 'manipulation' }}
                    title="Players Guide"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="hidden sm:inline">Guide</span>
                    <span className="sm:hidden">?</span>
                  </button>
                )}
                <button
                  onClick={async () => {
                    if (authActions?.signOut) {
                      try {
                        await authActions.signOut();
                      } catch (error) {
                        alert('Error signing out. Please try again.');
                      }
                    }
                  }}
                  className="bg-[#4A1818] hover:bg-[#6B2424] text-white px-3 py-1.5 rounded transition-colors min-h-[44px] flex items-center text-sm"
                  style={{ touchAction: 'manipulation' }}
                  title={`Sign out ${user?.name || ''}`}
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="hidden sm:inline">Sign Out</span>
                  <span className="sm:hidden">Out</span>
                </button>
              </div>
            </div>
          </div>
        </header>
        
        <Navigation 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          currentUser={user}
          ladderPlayers={ladderPlayers}
          selectedSeason={selectedSeason}
        />
        
        <main className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-6 pb-20 sm:pb-6">
          {activeTab === 'ladder' && (
            <LeagueTab 
              currentUser={user}
              users={ladderPlayers} // CHANGED: Use ladderPlayers
              updateRankings={actions?.updateRankings || (() => alert('Update rankings not available'))}
              selectedSeason={selectedSeason} // NEW: Pass selected season
              onPlayerSelect={handlePlayerSelect} // NEW: Player selection handler
              supabase={supabase} // NEW: Pass supabase for team filtering
              matchFixtures={matchFixtures} // NEW: Pass matchFixtures for league team filtering
            />
          )}

          {activeTab === 'matches' && (
            <MatchesTab
              currentUser={user}
              currentSeason={selectedSeasonData || selectedSeason} // CHANGED: Use selected season data with matches
              selectedSeason={selectedSeason} // NEW: Pass selected season for read-only checks
              matchFixtures={matchFixtures}
              matchResults={matchResults}
              availability={availability}
              users={ladderPlayers} // CHANGED: Use ladderPlayers for match generation (season-specific players)
              generateMatches={actions?.generateMatches || (() => alert('Generate matches not available'))}
              undoGenerateMatches={actions?.undoGenerateMatches || (() => alert('Undo matches not available'))}
              openScoreModal={openScoreModal}
              getAvailabilityStats={helpers?.getAvailabilityStats || (() => ({ total: 0, available: 0, responded: 0, pending: 0 }))}
              getMatchScore={helpers?.getMatchScore || (() => null)}
              supabase={supabase} // NEW: Pass supabase for league match details
              refetch={refetch} // NEW: Pass refetch functions for data refresh
              reorderMatchFixtures={actions?.reorderMatchFixtures || (() => alert('Reorder matches not available'))}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileTab 
              currentUser={user}
              seasons={seasons}
              selectedSeason={selectedSeason}
              allUsers={allUsers}
              selectedPlayerId={selectedPlayerId} // NEW: Selected player for profile viewing
              onPlayerSelect={setSelectedPlayerId} // NEW: Player selection handler
              onPlayerClear={() => setSelectedPlayerId(null)} // NEW: Clear selection handler
            />
          )}

          {activeTab === 'trophies' && (
            <TrophyCabinetTab 
              currentUser={user}
              seasons={seasons}
              selectedSeason={selectedSeason}
              allUsers={allUsers}
            />
          )}

          {activeTab === 'availability' && (
            <AvailabilityTab 
              currentUser={user}
              currentSeason={selectedSeasonData || selectedSeason} // CHANGED: Use selected season data with matches
              selectedSeason={selectedSeason} // NEW: Pass selected season for status checks
              ladderPlayers={ladderPlayers} // NEW: Pass ladder players to check membership
              getPlayerAvailability={helpers?.getPlayerAvailability || (() => undefined)}
              setPlayerAvailability={(matchId, available, playerId) => {
                if (actions?.setPlayerAvailability) {
                  // Use provided playerId (for admin mode) or default to current user
                  const targetPlayerId = playerId || user.id;
                  actions.setPlayerAvailability(matchId, available, targetPlayerId);
                }
              }}
              matchFixtures={matchFixtures}
              matchResults={matchResults}
              getMatchScore={helpers?.getMatchScore || (() => null)}
            />
          )}

          {activeTab === 'admin' && user?.role === 'admin' && (
            <AdminTab
              users={allUsers} // CHANGED: Use allUsers
              ladderPlayers={ladderPlayers} // NEW: Add ladder players for filtering
              currentUser={user}
              currentSeason={selectedSeasonData || selectedSeason} // CHANGED: Use selected season data
              activeSeason={activeSeason} // NEW: Pass active season for admin controls
              approveUser={actions?.approveUser || (() => alert('Approve user not available'))}
              updateUserRole={actions?.updateUserRole || (() => alert('Update user role not available'))}
              addToLadder={actions?.addToLadder || (() => alert('Add to ladder not available'))}
              fetchUsers={refetch?.users || (() => {})}
              setPlayerAvailability={actions?.setPlayerAvailability || (() => {})}
              getPlayerAvailability={helpers?.getPlayerAvailability || (() => undefined)}
              getAvailabilityStats={helpers?.getAvailabilityStats || (() => ({ total: 0, available: 0, responded: 0, pending: 0 }))}
              clearOldMatches={actions?.clearOldMatches || (() => alert('Clear matches not available'))}
              deleteSeason={actions?.deleteSeason || (() => alert('Delete season not available'))}
              deleteUser={actions?.deleteUser || (() => alert('Delete user not available'))}
              matchFixtures={matchFixtures}
              matchResults={matchResults}
              // NEW: Season management props
              selectedSeason={selectedSeason}
              seasonActions={seasonActions}
              seasons={seasons}
              // NEW: Supabase instance for LeagueImportModal
              supabase={supabase}
              // NEW: Match management props for ladder matches
              setShowScheduleModal={setShowScheduleModal}
              addMatchToSeason={handleAddMatch}
              // NEW: Refetch functions for data refresh
              refetch={refetch}
            />
          )}

          {activeTab === 'coaching' && (
            user?.role === 'admin' ? (
              <CoachingAdminTab
                currentUser={user}
                allUsers={allUsers}
              />
            ) : user?.role === 'coach' ? (
              <CoachDashboard
                currentUser={user}
              />
            ) : (
              <CoachingUserTab
                currentUser={user}
              />
            )
          )}
        </main>

        {/* Modals */}
        <ScheduleModal 
          showModal={showScheduleModal}
          setShowModal={setShowScheduleModal}
          newMatchDate={newMatchDate}
          setNewMatchDate={setNewMatchDate}
          addMatchToSeason={handleAddMatch}
        />

        <EnhancedScoreModal
          showModal={showScoreModal}
          setShowModal={setShowScoreModal}
          selectedMatch={selectedMatch}
          setSelectedMatch={setSelectedMatch}
          submitScore={submitScore}
          currentUser={user}
          getMatchScore={helpers?.getMatchScore || (() => null)}
          onChallengeScore={handleScoreChallenge}
        />

        <PlayersGuideModal
          showModal={showPlayersGuide}
          setShowModal={setShowPlayersGuide}
        />
        </div>
      </ErrorBoundary>
      )}
      
      {/* Update Notification - Available globally */}
      <UpdateNotification />
      
      {/* Version Display - Shows current version */}
      <VersionDisplay position="bottom-right" />
    </ToastProvider>
  );
};

export default CawoodTennisApp;