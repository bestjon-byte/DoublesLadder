// src/App.js
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

// Component imports
import AuthScreen from './components/Auth/AuthScreen';
import Header from './components/Layout/Header';
import Navigation from './components/Layout/Navigation';
import LadderTab from './components/Ladder/LadderTab';
import MatchesTab from './components/Matches/MatchesTab';
import AvailabilityTab from './components/Availability/AvailabilityTab';
import AdminTab from './components/Admin/AdminTab';
import ScheduleModal from './components/Modals/ScheduleModal';
import ScoreModal from './components/Modals/ScoreModal';

const TennisLadderApp = () => {
  // All your existing state variables
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [currentSeason, setCurrentSeason] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [matchFixtures, setMatchFixtures] = useState([]);
  const [matchResults, setMatchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ladder');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [newMatchDate, setNewMatchDate] = useState('');

  // Copy ALL your existing functions here (useEffect, fetchUsers, etc.)
  // [Copy from line ~1250 to ~1550 of your current App.js]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthScreen onAuthChange={setCurrentUser} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentUser={currentUser} onSignOut={handleSignOut} />
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} currentUser={currentUser} />
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'ladder' && (
          <LadderTab 
            currentUser={currentUser}
            users={users}
            updateRankings={updateRankings}
          />
        )}

        {activeTab === 'matches' && (
          <MatchesTab 
            currentUser={currentUser}
            currentSeason={currentSeason}
            setShowScheduleModal={setShowScheduleModal}
            matchFixtures={matchFixtures}
            matchResults={matchResults}
            availability={availability}
            users={users}
            generateMatches={generateMatches}
            openScoreModal={openScoreModal}
            getAvailabilityStats={getAvailabilityStats}
            getMatchScore={getMatchScore}
          />
        )}

        {activeTab === 'availability' && (
          <AvailabilityTab 
            currentUser={currentUser}
            currentSeason={currentSeason}
            getPlayerAvailability={getPlayerAvailability}
            setPlayerAvailability={setPlayerAvailability}
            matchFixtures={matchFixtures}
            matchResults={matchResults}
            getMatchScore={getMatchScore}
          />
        )}

        {activeTab === 'admin' && currentUser?.role === 'admin' && (
          <AdminTab 
            users={users}
            currentSeason={currentSeason}
            approveUser={approveUser}
            addToLadder={addToLadder}
            fetchUsers={fetchUsers}
            setPlayerAvailability={setPlayerAvailability}
            getPlayerAvailability={getPlayerAvailability}
            getAvailabilityStats={getAvailabilityStats}
            clearOldMatches={clearOldMatches}
          />
        )}
      </main>

      <ScheduleModal 
        showModal={showScheduleModal}
        setShowModal={setShowScheduleModal}
        newMatchDate={newMatchDate}
        setNewMatchDate={setNewMatchDate}
        addMatchToSeason={addMatchToSeason}
      />

      <ScoreModal 
        showModal={showScoreModal}
        setShowModal={setShowScoreModal}
        selectedMatch={selectedMatch}
        setSelectedMatch={setSelectedMatch}
        submitScore={submitScore}
      />
    </div>
  );
};

export default TennisLadderApp;