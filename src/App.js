// src/App.js - PRODUCTION VERSION
import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useApp } from './hooks/useApp';
import { submitScoreWithConflictHandling, submitScoreChallenge } from './utils/scoreSubmission';

// Components
import AuthScreen from './components/Auth/AuthScreen';
import Header from './components/Layout/Header';
import Navigation from './components/Layout/Navigation';
import LadderTab from './components/Ladder/LadderTab';
import MatchesTab from './components/Matches/MatchesTab';
import AvailabilityTab from './components/Availability/AvailabilityTab';
import AdminTab from './components/Admin/AdminTab';
import ScheduleModal from './components/Modals/ScheduleModal';
import EnhancedScoreModal from './components/Modals/EnhancedScoreModal';
import LoadingScreen from './components/shared/LoadingScreen';
import ErrorBoundary from './components/shared/ErrorBoundary';

const TennisLadderApp = () => {
  // Authentication hook
  const authData = useAuth();
  const { 
    user = null, 
    loading: authLoading = true, 
    authMode = 'normal', 
    actions: authActions = {}
  } = authData || {};
  
  // App data hook
  const appData = useApp(user?.id);
  const {
    users = [],
    currentSeason = null,
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

  // Check for hook failures
  if (!authData) {
    return <div className="p-4 bg-red-100">Error: Authentication service unavailable</div>;
  }
  
  if (!appData) {
    return <div className="p-4 bg-red-100">Error: Application data service unavailable</div>;
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

  // Loading state
  if (authLoading || dataLoading?.initial) {
    return <LoadingScreen />;
  }

  // Password reset mode
  if (authMode === 'reset') {
    return (
      <AuthScreen 
        onAuthChange={() => {}}
        isPasswordReset={true}
        onPasswordResetComplete={() => {
          if (authActions?.setAuthMode) {
            authActions.setAuthMode('normal');
          }
        }}
      />
    );
  }

  // Not authenticated
  if (!user) {
    return <AuthScreen onAuthChange={() => {}} />;
  }

  // Main app
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <Header 
          currentUser={user} 
          onSignOut={authActions?.signOut || (() => {})} 
        />
        
        <Navigation 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          currentUser={user} 
        />
        
        <main className="max-w-7xl mx-auto px-4 py-6">
          {activeTab === 'ladder' && (
            <LadderTab 
              currentUser={user}
              users={users}
              updateRankings={actions?.updateRankings || (() => alert('Update rankings not available'))}
            />
          )}

          {activeTab === 'matches' && (
            <MatchesTab 
              currentUser={user}
              currentSeason={currentSeason}
              setShowScheduleModal={setShowScheduleModal}
              matchFixtures={matchFixtures}
              matchResults={matchResults}
              availability={availability}
              users={users}
              generateMatches={actions?.generateMatches || (() => alert('Generate matches not available'))}
              openScoreModal={openScoreModal}
              getAvailabilityStats={helpers?.getAvailabilityStats || (() => ({ total: 0, available: 0, responded: 0, pending: 0 }))}
              getMatchScore={helpers?.getMatchScore || (() => null)}
            />
          )}

          {activeTab === 'availability' && (
            <AvailabilityTab 
              currentUser={user}
              currentSeason={currentSeason}
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
              users={users}
              currentUser={user}
              currentSeason={currentSeason}
              approveUser={actions?.approveUser || (() => alert('Approve user not available'))}
              addToLadder={actions?.addToLadder || (() => alert('Add to ladder not available'))}
              fetchUsers={refetch?.users || (() => {})}
              setPlayerAvailability={actions?.setPlayerAvailability || (() => {})}
              getPlayerAvailability={helpers?.getPlayerAvailability || (() => undefined)}
              getAvailabilityStats={helpers?.getAvailabilityStats || (() => ({ total: 0, available: 0, responded: 0, pending: 0 }))}
              clearOldMatches={actions?.clearOldMatches || (() => alert('Clear matches not available'))}
              matchFixtures={matchFixtures}
              matchResults={matchResults}
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
  );
};

export default TennisLadderApp;