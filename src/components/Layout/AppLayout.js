// src/components/Layout/AppLayout.js
import React, { useState, lazy, Suspense } from 'react';
import Header from './Header';
import Navigation from './Navigation';
import { LoadingSpinner } from '../shared/LoadingSpinner';

// Lazy load tabs for better performance
const LadderTab = lazy(() => import('../Ladder/LadderTab'));
const MatchesTab = lazy(() => import('../Matches/MatchesTab'));
const AvailabilityTab = lazy(() => import('../Availability/AvailabilityTab'));
const AdminTab = lazy(() => import('../Admin/AdminTab'));

const TabLoader = () => (
  <div className="flex justify-center items-center py-12">
    <LoadingSpinner size="lg" />
  </div>
);

const AppLayout = ({ 
  user,
  users,
  currentSeason,
  availability,
  matchFixtures,
  matchResults,
  actions,
  helpers,
  refetch,
  onSignOut
}) => {
  const [activeTab, setActiveTab] = useState('ladder');

  // Tab content renderer with lazy loading
  const renderTabContent = () => {
    const commonProps = {
      currentUser: user,
      users,
      currentSeason,
      availability,
      matchFixtures,
      matchResults,
    };

    return (
      <Suspense fallback={<TabLoader />}>
        {activeTab === 'ladder' && (
          <LadderTab 
            {...commonProps}
            updateRankings={actions.updateRankings}
          />
        )}

        {activeTab === 'matches' && (
          <MatchesTab 
            {...commonProps}
            setShowScheduleModal={actions.setShowScheduleModal}
            generateMatches={actions.generateMatches}
            openScoreModal={actions.openScoreModal}
            getAvailabilityStats={helpers.getAvailabilityStats}
            getMatchScore={helpers.getMatchScore}
          />
        )}

        {activeTab === 'availability' && user?.in_ladder && (
          <AvailabilityTab 
            {...commonProps}
            getPlayerAvailability={helpers.getPlayerAvailability}
            setPlayerAvailability={(matchId, available) => 
              actions.setPlayerAvailability(matchId, available, user.id)
            }
            getMatchScore={helpers.getMatchScore}
          />
        )}

        {activeTab === 'admin' && user?.role === 'admin' && (
          <AdminTab 
            {...commonProps}
            approveUser={actions.approveUser}
            addToLadder={actions.addToLadder}
            fetchUsers={refetch.users}
            setPlayerAvailability={actions.setPlayerAvailability}
            getPlayerAvailability={helpers.getPlayerAvailability}
            getAvailabilityStats={helpers.getAvailabilityStats}
            clearOldMatches={actions.clearOldMatches}
          />
        )}
      </Suspense>
    );
  };

  return (
    <>
      <Header currentUser={user} onSignOut={onSignOut} />
      <Navigation 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        currentUser={user} 
      />
      <main className="max-w-7xl mx-auto px-4 py-6">
        {renderTabContent()}
      </main>
    </>
  );
};

export default AppLayout;