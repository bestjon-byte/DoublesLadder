// src/App.js - DEBUG VERSION TO FIND THE ERROR
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

// TEMPORARY: Simple fallback components if the shared ones don't exist yet
const LoadingScreen = () => (
  <div className="min-h-screen bg-gradient-to-br from-[#5D1F1F] to-[#8B3A3A] flex items-center justify-center">
    <div className="bg-white rounded-lg shadow-xl p-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading...</h2>
    </div>
  </div>
);

const ErrorBoundary = ({ children }) => children;

const TennisLadderApp = () => {
  // DEBUG: Log everything to find the error
  console.log('🚀 App.js starting...');
  
  // Authentication - with debug logging
  console.log('📍 Calling useAuth...');
  const authData = useAuth();
  console.log('✅ Auth data received:', authData);
  
  // Check if auth hook returned something
  if (!authData) {
    console.error('❌ useAuth returned undefined or null!');
    return <div className="p-4 bg-red-100">Error: useAuth hook failed</div>;
  }
  
  const { 
    user = null, 
    loading: authLoading = true, 
    authMode = 'normal', 
    actions: authActions = {}
  } = authData;
  
  console.log('👤 User:', user);
  console.log('⏳ Auth loading:', authLoading);
  
  // App data and business logic - with debug logging
  console.log('📍 Calling useApp with userId:', user?.id);
  const appData = useApp(user?.id);
  console.log('✅ App data received:', appData);
  
  // Check if app hook returned something
  if (!appData) {
    console.error('❌ useApp returned undefined or null!');
    return <div className="p-4 bg-red-100">Error: useApp hook failed</div>;
  }
  
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
  } = appData;
  
  console.log('👥 Users count:', users.length);
  console.log('📅 Current season:', currentSeason);
  console.log('⏳ Data loading:', dataLoading);

  // UI State
  const [activeTab, setActiveTab] = useState('ladder');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [newMatchDate, setNewMatchDate] = useState('');

  // Score submission handler
  const submitScore = async (pair1Score, pair2Score) => {
    if (!selectedMatch) return;
    
    try {
      console.log('🎾 Submitting score...');
      
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
      console.error('💥 Score submission failed:', error);
      throw error;
    }
  };

  // Score challenge handler
  const handleScoreChallenge = async (challengeData) => {
    try {
      console.log('🚩 Submitting challenge...');
      
      await submitScoreChallenge({
        ...challengeData,
        challengerId: user.id
      });
      
      // Refresh data
      if (refetch?.results) await refetch.results();
      
      return { success: true };
    } catch (error) {
      console.error('💥 Challenge submission failed:', error);
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
    console.log('🔄 Showing loading screen...');
    return <LoadingScreen />;
  }

  // Password reset mode
  if (authMode === 'reset') {
    console.log('🔑 Password reset mode');
    return (
      <AuthScreen 
        onAuthChange={(profile) => {
          console.log('Auth change:', profile);
        }}
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
    console.log('🔒 Not authenticated, showing login');
    return (
      <AuthScreen 
        onAuthChange={(profile) => {
          console.log('Auth change:', profile);
        }}
      />
    );
  }

  console.log('✨ Rendering main app');

  // Main app
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <Header 
          currentUser={user} 
          onSignOut={authActions?.signOut || (() => console.log('Sign out not available'))} 
        />
        
        <Navigation 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          currentUser={user} 
        />
        
        <main className="max-w-7xl mx-auto px-4 py-6">
          {/* Ladder Tab */}
          {activeTab === 'ladder' && (
            <LadderTab 
              currentUser={user}
              users={users}
              updateRankings={actions?.updateRankings || (() => alert('Update rankings not available'))}
            />
          )}

          {/* Matches Tab */}
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

          {/* Availability Tab */}
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

          {/* Admin Tab */}
          {activeTab === 'admin' && user?.role === 'admin' && (
            <AdminTab 
              users={users}
              currentUser={user}
              currentSeason={currentSeason}
              approveUser={actions?.approveUser || (() => alert('Approve user not available'))}
              addToLadder={actions?.addToLadder || (() => alert('Add to ladder not available'))}
              fetchUsers={refetch?.users || (() => console.log('Fetch users not available'))}
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