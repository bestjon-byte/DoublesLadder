// src/App.js - PRODUCTION VERSION WITH MULTI-SEASON
import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useApp } from './hooks/useApp';
import { useSeasonManager } from './hooks/useSeasonManager';
import { submitScoreWithConflictHandling, submitScoreChallenge } from './utils/scoreSubmission';

// Components
import AuthScreen from './components/Auth/AuthScreen';
import Navigation from './components/Layout/Navigation';
import LadderTab from './components/Ladder/LadderTab';
import MatchesTab from './components/Matches/MatchesTab';
import ProfileTab from './components/Profile/ProfileTab';
import AvailabilityTab from './components/Availability/AvailabilityTab';
import AdminTab from './components/Admin/AdminTab';
import ScheduleModal from './components/Modals/ScheduleModal';
import EnhancedScoreModal from './components/Modals/EnhancedScoreModal';
import LoadingScreen from './components/shared/LoadingScreen';
import ErrorBoundary from './components/shared/ErrorBoundary';
import SeasonSelector from './components/Season/SeasonSelector';
import { ToastProvider } from './contexts/ToastContext';

const TennisLadderApp = () => {
  // Authentication hook
  const authData = useAuth();
  const { 
    user = null, 
    loading: authLoading = true, 
    authMode = 'normal', 
    actions: authActions = {}
  } = authData || {};
  
  // NEW: Season management hook
  const seasonData = useSeasonManager();
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
    refetch = {}
  } = appData || {};

  // UI State
  const [activeTab, setActiveTab] = useState('ladder');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [newMatchDate, setNewMatchDate] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState(null); // For viewing other players' profiles

  // Check for hook failures
  if (!authData || !seasonData || !appData) {
    return <div className="p-4 bg-red-100">Error: Service unavailable</div>;
  }

  // Show error state if any hook has an error (but not if still loading)
  if (!authLoading && !seasonLoading && !dataLoading?.initial && (error || seasonData?.error || authData?.error)) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
          <h2 className="text-xl font-bold text-red-600 mb-4">Connection Error</h2>
          <p className="text-gray-700 mb-4">
            There was a problem connecting to the server. This may be temporary.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
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
    } else {
      console.error('❌ No addMatchToSeason action available');
    }
  };

  // Loading state with manual override after timeout
  if (authLoading || seasonLoading || dataLoading?.initial) {
    const loadingMessage = authLoading ? 'Authenticating...' : 
                          seasonLoading ? 'Loading seasons...' : 
                          'Loading app data...';
    return <LoadingScreen message={loadingMessage} />;
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
        <div className="min-h-screen bg-gray-50">
        {/* UPDATED Header with SeasonSelector */}
        <header className="bg-[#5D1F1F] text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-4">
            {/* Mobile Layout - Stack vertically */}
            <div className="sm:hidden">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <img 
                    src="/c-ball.png" 
                    alt="Cawood Tennis Club" 
                    className="w-8 h-8 shadow object-contain flex-shrink-0"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="w-8 h-8 bg-[#4A1818] rounded-full flex items-center justify-center shadow" style={{display: 'none'}}>
                    <span className="text-white font-bold text-sm">C</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-sm font-bold truncate">Cawood Tennis Club</h1>
                    <p className="text-red-100 text-xs truncate">Welcome, {user?.name}</p>
                  </div>
                </div>
                
                {/* Mobile Sign Out - Right side */}
                <button
                  onClick={async () => {
                    if (authActions?.signOut) {
                      try {
                        await authActions.signOut();
                      } catch (error) {
                        console.error('❌ Logout failed:', error);
                        alert('Error signing out. Please try again.');
                      }
                    }
                  }}
                  className="bg-[#4A1818] hover:bg-[#6B2424] text-white px-4 py-3 rounded text-sm transition-colors flex-shrink-0 ml-2 min-h-[44px]"
                  style={{ touchAction: 'manipulation' }}
                >
                  Sign Out
                </button>
              </div>
              
              {/* Mobile Season Selector - Full width below */}
              <div className="w-full">
                <SeasonSelector 
                  seasons={seasons}
                  selectedSeason={selectedSeason}
                  onSeasonSelect={seasonActions?.setSelectedSeason}
                  loading={seasonLoading}
                />
              </div>
            </div>

            {/* Desktop Layout - Single row */}
            <div className="hidden sm:flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-shrink-0">
                <img 
                  src="/c-ball.png" 
                  alt="Cawood Tennis Club" 
                  className="w-10 h-10 shadow object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="w-10 h-10 bg-[#4A1818] rounded-full flex items-center justify-center shadow" style={{display: 'none'}}>
                  <span className="text-white font-bold text-lg">C</span>
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl font-bold truncate">Cawood Tennis Club</h1>
                  <p className="text-red-100 text-sm truncate">Welcome, {user?.name}</p>
                </div>
              </div>
              
              {/* Desktop right side */}
              <div className="flex items-center space-x-4">
                <div className="max-w-xs">
                  <SeasonSelector 
                    seasons={seasons}
                    selectedSeason={selectedSeason}
                    onSeasonSelect={seasonActions?.setSelectedSeason}
                    loading={seasonLoading}
                  />
                </div>
                
                <button
                  onClick={async () => {
                    if (authActions?.signOut) {
                      try {
                        await authActions.signOut();
                      } catch (error) {
                        console.error('❌ Logout failed:', error);
                        alert('Error signing out. Please try again.');
                      }
                    }
                  }}
                  className="bg-[#4A1818] hover:bg-[#6B2424] text-white px-4 py-3 rounded text-sm transition-colors flex-shrink-0 min-h-[44px]"
                  style={{ touchAction: 'manipulation' }}
                >
                  Sign Out
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
        />
        
        <main className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-6 pb-20 sm:pb-6">
          {activeTab === 'ladder' && (
            <LadderTab 
              currentUser={user}
              users={ladderPlayers} // CHANGED: Use ladderPlayers
              updateRankings={actions?.updateRankings || (() => alert('Update rankings not available'))}
              selectedSeason={selectedSeason} // NEW: Pass selected season
              onPlayerSelect={handlePlayerSelect} // NEW: Player selection handler
            />
          )}

          {activeTab === 'matches' && (
            <MatchesTab 
              currentUser={user}
              currentSeason={selectedSeasonData || selectedSeason} // CHANGED: Use selected season data with matches
              selectedSeason={selectedSeason} // NEW: Pass selected season for read-only checks
              setShowScheduleModal={setShowScheduleModal}
              matchFixtures={matchFixtures}
              matchResults={matchResults}
              availability={availability}
              users={allUsers} // CHANGED: Use allUsers for match generation
              generateMatches={actions?.generateMatches || (() => alert('Generate matches not available'))}
              openScoreModal={openScoreModal}
              getAvailabilityStats={helpers?.getAvailabilityStats || (() => ({ total: 0, available: 0, responded: 0, pending: 0 }))}
              getMatchScore={helpers?.getMatchScore || (() => null)}
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

          {activeTab === 'availability' && (
            <AvailabilityTab 
              currentUser={user}
              currentSeason={selectedSeasonData || selectedSeason} // CHANGED: Use selected season data with matches
              selectedSeason={selectedSeason} // NEW: Pass selected season for status checks
              ladderPlayers={ladderPlayers} // NEW: Pass ladder players to check membership
              getPlayerAvailability={helpers?.getPlayerAvailability || (() => undefined)}
              setPlayerAvailability={(matchId, available) => {
                if (actions?.setPlayerAvailability) {
                  actions.setPlayerAvailability(matchId, available, user.id);
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
            />
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
        </div>
      </ErrorBoundary>
      )}
    </ToastProvider>
  );
};

export default TennisLadderApp;