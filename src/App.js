import React, { useState, useEffect } from 'react';
import { Users, Calendar, Trophy, Settings, Plus, Check, X, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from './supabaseClient';

// Helper functions moved to top
const getLadderData = (users) => {
  return users
    .filter(user => user.in_ladder && user.status === 'approved')
    .sort((a, b) => (a.rank || 999) - (b.rank || 999));
};

const getRankMovementIcon = (movement) => {
  if (movement === 'up') return <ArrowUp className="w-4 h-4 text-green-500" />;
  if (movement === 'down') return <ArrowDown className="w-4 h-4 text-red-500" />;
  return null;
};

// Auth Component with real Supabase authentication
const AuthScreen = ({ onAuthChange }) => {
  const [authMode, setAuthMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    name: ''
  });

  const handleAuth = async () => {
    setLoading(true);
    
    if (authMode === 'login') {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: authForm.email,
        password: authForm.password,
      });
      
      if (error) {
        alert(error.message);
      } else {
        // Get user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
        
        onAuthChange(profile);
      }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email: authForm.email,
        password: authForm.password,
        options: {
          data: {
            name: authForm.name,
          }
        }
      });
      
      if (error) {
        alert(error.message);
      } else {
        alert('Registration successful! Please wait for admin approval.');
        setAuthMode('login');
      }
    }
    
    setLoading(false);
    setAuthForm({ email: '', password: '', name: '' });
  };

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-500 rounded-full mx-auto mb-2 flex items-center justify-center">
            <span className="text-white font-bold text-lg">C</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Cawood Tennis Club</h1>
          <p className="text-gray-600">Doubles Ladder</p>
        </div>

        <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
          <button
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              authMode === 'login' ? 'bg-white text-gray-900 shadow' : 'text-gray-600'
            }`}
            onClick={() => setAuthMode('login')}
          >
            Sign In
          </button>
          <button
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              authMode === 'register' ? 'bg-white text-gray-900 shadow' : 'text-gray-600'
            }`}
            onClick={() => setAuthMode('register')}
          >
            Sign Up
          </button>
        </div>

        <div className="space-y-4">
          {authMode === 'register' && (
            <input
              type="text"
              placeholder="Full Name"
              value={authForm.name}
              onChange={(e) => setAuthForm({...authForm, name: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={authForm.email}
            onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={authForm.password}
            onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
          />
          <button
            onClick={handleAuth}
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-md hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
          >
            {loading ? 'Loading...' : (authMode === 'login' ? 'Sign In' : 'Sign Up')}
          </button>
        </div>

        <div className="mt-4 text-sm text-gray-600 text-center">
          Create an account to get started!
        </div>
      </div>
    </div>
  );
};

// AdminTab Component - handles all admin functionality
const AdminTab = ({ 
  users, 
  currentSeason, 
  approveUser, 
  createNewLadder, 
  setPlayerAvailability, 
  getPlayerAvailability, 
  requestAvailabilityForAll, 
  getAvailabilityStats, 
  addToLadder,
  fetchUsers 
}) => {
  const [loading, setLoading] = useState(false);

  const handleApproveUser = async (userId) => {
    setLoading(true);
    await approveUser(userId);
    setLoading(false);
  };

  const handleAddToLadder = async (userId, rank) => {
    setLoading(true);
    await addToLadder(userId, rank);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
      
      {/* Pending Approvals */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Pending Approvals</h3>
        {users.filter(u => u.status === 'pending').length > 0 ? (
          <div className="space-y-3">
            {users.filter(u => u.status === 'pending').map(user => (
              <div key={user.id} className="flex justify-between items-center p-3 border border-gray-200 rounded">
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
                <div className="space-x-2">
                  <button
                    onClick={() => handleApproveUser(user.id)}
                    disabled={loading}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No pending approvals</p>
        )}
      </div>

      {/* Create New Ladder */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold">Create New Ladder</h3>
            <p className="text-sm text-gray-600">Start completely fresh - removes all players from ladder, clears all data, and creates a new season</p>
          </div>
          <button
            onClick={createNewLadder}
            disabled={loading}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            Create New Ladder
          </button>
        </div>
      </div>

      {/* Player Availability Management */}
      {currentSeason?.matches && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Set Player Availability</h3>
          <p className="text-sm text-gray-600 mb-4">Set availability on behalf of players</p>
          
          {currentSeason.matches.map((match) => {
            const ladderPlayers = users.filter(u => u.in_ladder && u.status === 'approved');
            return (
              <div key={match.id} className="mb-6 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium mb-3">
                  Week {match.week} - {new Date(match.match_date).toLocaleDateString('en-GB')}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {ladderPlayers.map(player => {
                    const playerAvailability = getPlayerAvailability(player.id, match.id);
                    return (
                      <div key={player.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm font-medium">{player.name}</span>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => setPlayerAvailability(match.id, true, player.id)}
                            className={`px-2 py-1 text-xs rounded transition-colors ${
                              playerAvailability === true
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-green-100'
                            }`}
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => setPlayerAvailability(match.id, false, player.id)}
                            className={`px-2 py-1 text-xs rounded transition-colors ${
                              playerAvailability === false
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-red-100'
                            }`}
                          >
                            ✗
                          </button>
                          {playerAvailability !== undefined && (
                            <button
                              onClick={() => setPlayerAvailability(match.id, undefined, player.id)}
                              className="px-2 py-1 text-xs rounded bg-yellow-200 text-yellow-800 hover:bg-yellow-300 transition-colors"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Availability Management */}
      {currentSeason?.matches && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Availability Management</h3>
            <button
              onClick={requestAvailabilityForAll}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Request Availability for All Matches
            </button>
          </div>
          
          <div className="space-y-4">
            {currentSeason.matches.map((match) => {
              const stats = getAvailabilityStats(match.id);
              return (
                <div key={match.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">Week {match.week} - {new Date(match.match_date).toLocaleDateString('en-GB')}</h4>
                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        <div>Available: <span className="font-medium text-green-600">{stats.available}</span></div>
                        <div>Responded: <span className="font-medium">{stats.responded}/{stats.total}</span></div>
                        <div>Pending: <span className="font-medium text-orange-600">{stats.pending}</span></div>
                      </div>
                    </div>
                    <div className="text-right">
                      {stats.available >= 4 ? (
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                          Ready to Schedule
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                          Need More Players
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Players to Ladder */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Add Players to Ladder</h3>
        {users.filter(u => u.status === 'approved' && !u.in_ladder).length > 0 ? (
          <div className="space-y-3">
            {users.filter(u => u.status === 'approved' && !u.in_ladder).map(user => {
              const maxRank = users.filter(u => u.in_ladder && u.status === 'approved').length + 1;
              return (
                <div key={user.id} className="flex justify-between items-center p-3 border border-gray-200 rounded">
                  <p className="font-medium">{user.name}</p>
                  <div className="flex items-center space-x-2">
                    <select 
                      id={`rank-${user.id}`}
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                      defaultValue={maxRank}
                    >
                      {Array.from({length: maxRank}, (_, i) => i + 1).map(rank => (
                        <option key={rank} value={rank}>Rank {rank}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        const selectedRank = document.getElementById(`rank-${user.id}`).value;
                        console.log(`Adding user ${user.name} to ladder at rank ${selectedRank}`);
                        handleAddToLadder(user.id, selectedRank);
                      }}
                      disabled={loading}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                    >
                      Add
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500">No approved players waiting to join ladder</p>
        )}
      </div>
    </div>
  );
};

// AvailabilityTab Component - handles player availability management
const AvailabilityTab = ({ currentUser, currentSeason, getPlayerAvailability, setPlayerAvailability, matches, scores, getMatchScore }) => {
  if (!currentUser?.in_ladder) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Match Availability</h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-800">
            You need to be added to the ladder before you can set your availability for matches.
          </p>
        </div>
      </div>
    );
  }

  // Separate future and past matches
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const futureMatches = currentSeason?.matches?.filter(match => {
    const matchDate = new Date(match.match_date);
    return matchDate >= today;
  }) || [];
  
  const pastMatches = currentSeason?.matches?.filter(match => {
    const matchDate = new Date(match.match_date);
    return matchDate < today;
  }) || [];

  // Helper to get player's scores for a match
  const getPlayerScoresForMatch = (matchId) => {
    const matchFixtures = matches.find(m => m.matchId === matchId);
    if (!matchFixtures) return [];
    
    const playerScores = [];
    matchFixtures.fixtures.forEach(court => {
      court.matches.forEach((gameMatch, gameIndex) => {
        const allPlayers = [...gameMatch.pair1, ...gameMatch.pair2];
        if (allPlayers.includes(currentUser.name)) {
          const score = getMatchScore(matchId, court.court, gameIndex);
          if (score) {
            const isInPair1 = gameMatch.pair1.includes(currentUser.name);
            const won = isInPair1 ? score.team1_score > score.team2_score : score.team2_score > score.team1_score;
            playerScores.push({
              opponent: isInPair1 ? gameMatch.pair2.join(' & ') : gameMatch.pair1.join(' & '),
              partner: isInPair1 ? gameMatch.pair1.filter(p => p !== currentUser.name)[0] : gameMatch.pair2.filter(p => p !== currentUser.name)[0],
              score: `${score.team1_score} - ${score.team2_score}`,
              won: won
            });
          }
        }
      });
    });
    return playerScores;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Match Availability</h2>
      
      {/* Future Matches */}
      {futureMatches.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Upcoming Matches</h3>
          <p className="text-gray-600 mb-4">Please set your availability for upcoming matches</p>
          
          <div className="space-y-4">
            {futureMatches.map((match) => {
              const userAvailability = getPlayerAvailability(currentUser.id, match.id);
              return (
                <div key={match.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-semibold">Week {match.week}</h4>
                      <p className="text-gray-600">{new Date(match.match_date).toLocaleDateString('en-GB')}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setPlayerAvailability(match.id, true)}
                        className={`px-4 py-2 rounded-md transition-colors ${
                          userAvailability === true
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-green-100'
                        }`}
                      >
                        Available
                      </button>
                      <button
                        onClick={() => setPlayerAvailability(match.id, false)}
                        className={`px-4 py-2 rounded-md transition-colors ${
                          userAvailability === false
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-red-100'
                        }`}
                      >
                        Not Available
                      </button>
                      {userAvailability !== undefined && (
                        <button
                          onClick={() => setPlayerAvailability(match.id, undefined)}
                          className="px-4 py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {userAvailability !== undefined && (
                    <div className="flex items-center space-x-2 text-sm">
                      <div className={`w-3 h-3 rounded-full ${userAvailability ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="text-gray-600">
                        You are marked as {userAvailability ? 'available' : 'not available'} for this match
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Past Matches */}
      {pastMatches.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Past Matches</h3>
          <div className="space-y-4">
            {pastMatches.map((match) => {
              const playerScores = getPlayerScoresForMatch(match.id);
              
              return (
                <div key={match.id} className="bg-white rounded-lg shadow p-6">
                  <div className="mb-4">
                    <h4 className="text-lg font-semibold">Week {match.week}</h4>
                    <p className="text-gray-600">{new Date(match.match_date).toLocaleDateString('en-GB')}</p>
                  </div>
                  
                  {playerScores.length > 0 ? (
                    <div>
                      <h5 className="font-medium mb-2">Your Results:</h5>
                      <div className="space-y-2">
                        {playerScores.map((game, index) => (
                          <div key={index} className={`p-2 rounded text-sm ${game.won ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                            <div className="flex justify-between items-center">
                              <span>With {game.partner} vs {game.opponent}</span>
                              <span className={`font-semibold ${game.won ? 'text-green-700' : 'text-red-700'}`}>
                                {game.score} {game.won ? '(Won)' : '(Lost)'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No scores recorded for this match</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {futureMatches.length === 0 && pastMatches.length === 0 && (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500">No matches scheduled yet.</p>
        </div>
      )}
    </div>
  );
};

// MatchesTab Component - handles match scheduling, generation, and score entry
const MatchesTab = ({ 
  currentUser, 
  currentSeason, 
  matches, 
  availability, 
  scores,
  users,
  generateMatches,
  openScoreModal,
  setShowScheduleModal,
  getAvailabilityStats,
  getMatchScore
}) => {
  // Helper function to determine match status
  const getMatchStatus = (match, matchFixtures) => {
    const today = new Date();
    const matchDate = new Date(match.match_date);
    
    if (!matchFixtures) {
      if (matchDate < today) {
        return 'past-no-fixtures'; // Past match with no fixtures generated
      }
      return 'future-no-fixtures'; // Future match, can generate fixtures
    }
    
    // Count total games and completed games
    let totalGames = 0;
    let completedGames = 0;
    
    matchFixtures.fixtures.forEach(court => {
      court.matches.forEach((_, gameIndex) => {
        totalGames++;
        const score = getMatchScore(match.id, court.court, gameIndex);
        if (score) completedGames++;
      });
    });
    
    if (completedGames === 0) {
      return matchDate < today ? 'past-in-progress' : 'future-in-progress';
    } else if (completedGames < totalGames) {
      return 'partially-complete';
    } else {
      return 'completed';
    }
  };

  // Helper function to check if current user can enter scores for a match
  const canUserEnterScores = (match, gameMatch) => {
    if (currentUser?.role === 'admin') return true;
    
    // Check if current user is in this specific game
    const allPlayers = [...gameMatch.pair1, ...gameMatch.pair2];
    return allPlayers.includes(currentUser?.name);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Match Schedule</h2>
        {currentUser?.role === 'admin' && (
          <button
            onClick={() => setShowScheduleModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 inline mr-2" />
            Add Match
          </button>
        )}
      </div>
      
      {!currentSeason?.matches || currentSeason.matches.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500">No matches scheduled yet.</p>
          {currentUser?.role === 'admin' && (
            <p className="text-sm text-gray-400 mt-2">Click "Add Match" to create your first match.</p>
          )}
        </div>
      ) : (
        currentSeason.matches.map((match) => {
          const stats = getAvailabilityStats(match.id);
          const matchFixtures = matches.find(m => m.matchId === match.id);
          const matchStatus = getMatchStatus(match, matchFixtures);
          const isAdmin = currentUser?.role === 'admin';
          
          return (
            <div key={match.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Week {match.week}</h3>
                  <p className="text-gray-600">{new Date(match.match_date).toLocaleDateString('en-GB')}</p>
                  
                  {/* Match Status Indicator */}
                  <div className="mt-2">
                    {matchStatus === 'completed' && (
                      <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                        ✅ Match Completed
                      </span>
                    )}
                    {matchStatus === 'partially-complete' && (
                      <span className="inline-flex px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                        🔄 Scores Being Entered
                      </span>
                    )}
                    {matchStatus === 'future-in-progress' && (
                      <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                        📋 Fixtures Generated
                      </span>
                    )}
                    {matchStatus === 'past-in-progress' && (
                      <span className="inline-flex px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded">
                        ⏰ Match Played - Enter Scores
                      </span>
                    )}
                  </div>
                  
                  {/* Availability Info (only for future matches without fixtures) */}
                  {matchStatus === 'future-no-fixtures' && (
                    <div className="mt-2 text-sm text-gray-600">
                      Availability: {stats.available} available, {stats.pending} pending response
                    </div>
                  )}
                </div>
                
                {/* Admin Controls */}
                {isAdmin && (
                  <div className="space-x-2">
                    {matchStatus === 'future-no-fixtures' && stats.available >= 4 && (
                      <button
                        onClick={() => generateMatches(match.id)}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                      >
                        Generate Matches ({stats.available} available)
                      </button>
                    )}
                    {matchStatus === 'future-no-fixtures' && stats.available < 4 && (
                      <span className="text-gray-500 text-sm">Need 4+ players to generate matches</span>
                    )}
                  </div>
                )}
              </div>

              {/* Match Fixtures Display */}
              {matchFixtures && (
                <div className="space-y-4">
                  {/* Available Players Info (Admin Debug) */}
                  {isAdmin && matchStatus !== 'completed' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <h5 className="font-medium text-green-800 mb-2">
                        {matchStatus === 'completed' ? '✅ Match Complete' : '📋 Match Details'}
                      </h5>
                      <div className="text-sm text-green-700">
                        <div><strong>Available Players:</strong> {
                          users.filter(user => {
                            if (!user.in_ladder || user.status !== 'approved') return false;
                            const userAvailability = availability.find(a => a.player_id === user.id && a.match_date === match.match_date);
                            return userAvailability?.is_available === true;
                          })
                          .sort((a, b) => (a.rank || 999) - (b.rank || 999))
                          .map(p => `${p.name} (Rank ${p.rank})`)
                          .join(', ') || 'None'
                        }</div>
                        <div><strong>Courts Created:</strong> {matchFixtures.fixtures.length}</div>
                      </div>
                    </div>
                  )}
                  
                  {/* Court Fixtures */}
                  {matchFixtures.fixtures.map((court, courtIndex) => (
                    <div key={courtIndex} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold mb-2">Court {court.court}</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Players: {court.players.join(', ')}
                      </p>
                      <div className="space-y-2">
                        {court.matches.map((gameMatch, matchIndex) => {
                          const existingScore = getMatchScore(match.id, court.court, matchIndex);
                          const canEnterScore = canUserEnterScores(match, gameMatch);
                          
                          return (
                            <div key={matchIndex} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <div className="flex-1">
                                <span className="text-sm">
                                  {gameMatch.pair1.join(' & ')} vs {gameMatch.pair2.join(' & ')}
                                  {gameMatch.sitting && ` (${gameMatch.sitting} sitting)`}
                                </span>
                                {existingScore && (
                                  <div className="text-xs text-gray-600 mt-1">
                                    Score: {existingScore.team1_score} - {existingScore.team2_score}
                                  </div>
                                )}
                              </div>
                              
                              {/* Score Entry Button */}
                              {!existingScore && canEnterScore && matchStatus !== 'future-no-fixtures' && (
                                <button 
                                  onClick={() => openScoreModal({
                                    matchId: match.id,
                                    court: court.court,
                                    gameIndex: matchIndex,
                                    pair1: gameMatch.pair1,
                                    pair2: gameMatch.pair2
                                  })}
                                  className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                                >
                                  Enter Score
                                </button>
                              )}
                              
                              {/* Score Status */}
                              {existingScore && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                  Complete
                                </span>
                              )}
                              
                              {/* No Access Message */}
                              {!existingScore && !canEnterScore && matchStatus !== 'future-no-fixtures' && (
                                <span className="text-xs text-gray-500 px-2 py-1">
                                  {currentUser?.role === 'admin' ? 'Admin can enter' : 'Not your match'}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* No Fixtures Message for Past Matches */}
              {matchStatus === 'past-no-fixtures' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-yellow-800 text-sm">
                    This match date has passed but no fixtures were generated.
                  </p>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

// LadderTab Component - handles the ranking table display
const LadderTab = ({ currentUser, users, updateRankings }) => {
  const ladderData = getLadderData(users);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Current Ladder</h2>
        {currentUser?.role === 'admin' && (
          <button 
            onClick={updateRankings}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            Update Rankings
          </button>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matches</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Games</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Win %</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Movement</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ladderData.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No players in ladder yet
                  </td>
                </tr>
              ) : (
                ladderData.map((player, index) => (
                  <tr key={player.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{player.rank}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{player.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {player.matches_won || 0}/{player.matches_played || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {player.games_won || 0}/{player.games_played || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {player.games_played > 0 ? Math.round((player.games_won / player.games_played) * 100 * 10) / 10 : 0}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {/* Movement tracking would need to be implemented */}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Navigation Component - handles tab switching
const Navigation = ({ activeTab, setActiveTab, currentUser }) => {
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('ladder')}
            className={`px-4 py-3 text-sm font-medium border-b-2 ${
              activeTab === 'ladder' 
                ? 'border-green-500 text-green-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Trophy className="w-4 h-4 inline mr-2" />
            Ladder
          </button>
          <button
            onClick={() => setActiveTab('matches')}
            className={`px-4 py-3 text-sm font-medium border-b-2 ${
              activeTab === 'matches' 
                ? 'border-green-500 text-green-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Calendar className="w-4 h-4 inline mr-2" />
            Matches
          </button>
          {currentUser?.in_ladder && (
            <button
              onClick={() => setActiveTab('availability')}
              className={`px-4 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'availability' 
                  ? 'border-green-500 text-green-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Availability
            </button>
          )}
          {currentUser?.role === 'admin' && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'admin' 
                  ? 'border-green-500 text-green-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Settings className="w-4 h-4 inline mr-2" />
              Admin
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

// Header Component - handles top navigation bar
const Header = ({ currentUser, onSignOut }) => {
  return (
    <header className="bg-green-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-700 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">C</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">Cawood Tennis Club</h1>
              <p className="text-green-100 text-sm">Welcome, {currentUser?.name}</p>
            </div>
          </div>
          <button
            onClick={onSignOut}
            className="text-green-100 hover:text-white text-sm"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
};

// Main App Component
const TennisLadderApp = () => {
  // Core state management - SIMPLIFIED, database-driven
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [currentSeason, setCurrentSeason] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [matchFixtures, setMatchFixtures] = useState([]);
  const [matchResults, setMatchResults] = useState([]);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [newMatchDate, setNewMatchDate] = useState('');
  const [activeTab, setActiveTab] = useState('ladder');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize on load
  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchUserProfile(session.user.id);
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch user profile and initialize data
  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data) {
        setCurrentUser(data);
        await Promise.all([
          fetchUsers(),
          fetchSeasons(),
          fetchAvailability(),
          fetchMatchFixtures(),
          fetchMatchResults()
        ]);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all users
  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('rank', { ascending: true, nullsLast: true });

      if (data) {
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Fetch seasons and set current season
  const fetchSeasons = async () => {
    try {
      console.log('Fetching seasons...');
      
      // First, try to get any active season (limit to 1 to avoid multiple results error)
      const { data: activeSeasons, error: seasonError } = await supabase
        .from('seasons')
        .select('*')
        .eq('is_active', true)
        .limit(1);
      
      console.log('Active season query result:', { activeSeasons, seasonError });
      
      if (seasonError) {
        console.error('Error fetching active season:', seasonError);
        return;
      }
      
      let activeSeason = activeSeasons?.[0];
      
      if (!activeSeason) {
        console.log('No active season found, creating default season');
        activeSeason = await createDefaultSeason();
        if (!activeSeason) return;
      }
      
      // Now fetch matches for this season
      const { data: matches, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .eq('season_id', activeSeason.id)
        .order('week_number', { ascending: true });
      
      console.log('Matches query result:', { matches, matchesError });
      
      const seasonWithMatches = {
        ...activeSeason,
        matches: matches || []
      };
      
      console.log('Setting current season:', seasonWithMatches);
      setCurrentSeason(seasonWithMatches);
      setSeasons([seasonWithMatches]);
    } catch (error) {
      console.error('Error in fetchSeasons:', error);
    }
  };

  // Create a default season if none exists
  const createDefaultSeason = async () => {
    try {
      console.log('Creating default season...');
      
      // First deactivate any existing active seasons to avoid conflicts
      await supabase
        .from('seasons')
        .update({ is_active: false })
        .eq('is_active', true);
      
      const { data: newSeason, error } = await supabase
        .from('seasons')
        .insert({
          name: `Season ${new Date().getFullYear()}`,
          start_date: new Date().toISOString().split('T')[0],
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating default season:', error);
        alert('Error creating season: ' + error.message);
        return null;
      } else {
        console.log('Default season created:', newSeason);
        return newSeason;
      }
    } catch (error) {
      console.error('Error in createDefaultSeason:', error);
      return null;
    }
  };

  // Fetch availability data
  const fetchAvailability = async () => {
    try {
      const { data, error } = await supabase
        .from('availability')
        .select('*');

      if (data) {
        setAvailability(data);
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
    }
  };

  // Fetch match fixtures from database
  const fetchMatchFixtures = async () => {
    try {
      const { data, error } = await supabase
        .from('match_fixtures')
        .select(`
          *,
          player1:player1_id(name),
          player2:player2_id(name),
          player3:player3_id(name),
          player4:player4_id(name),
          sitting_player:sitting_player_id(name)
        `);

      if (data) {
        setMatchFixtures(data);
      }
    } catch (error) {
      console.error('Error fetching match fixtures:', error);
    }
  };

  // Fetch match results from database
  const fetchMatchResults = async () => {
    try {
      const { data, error } = await supabase
        .from('match_results')
        .select('*');

      if (data) {
        setMatchResults(data);
      }
    } catch (error) {
      console.error('Error fetching match results:', error);
    }
  };

  // Approve user
  const approveUser = async (userId) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'approved' })
        .eq('id', userId);

      if (error) {
        alert('Error approving user: ' + error.message);
      } else {
        alert('User approved successfully!');
        await fetchUsers();
      }
    } catch (error) {
      console.error('Error approving user:', error);
    }
  };

  // Add user to ladder with proper rank management
  const addToLadder = async (userId, rank) => {
    console.log('addToLadder called with:', { userId, rank });
    
    try {
      const targetRank = parseInt(rank);
      console.log('Target rank:', targetRank);
      
      // First, get all players at or above the target rank
      console.log('Getting players to shift...');
      const { data: playersToShift, error: getError } = await supabase
        .from('profiles')
        .select('id, rank')
        .gte('rank', targetRank)
        .eq('in_ladder', true)
        .order('rank', { ascending: true });

      if (getError) {
        console.error('Error getting players to shift:', getError);
        alert('Error getting players: ' + getError.message);
        return;
      }

      console.log('Players to shift:', playersToShift);

      // Shift each player down by 1
      if (playersToShift && playersToShift.length > 0) {
        console.log('Shifting players down...');
        for (const player of playersToShift) {
          const { error: shiftError } = await supabase
            .from('profiles')
            .update({ rank: player.rank + 1 })
            .eq('id', player.id);
          
          if (shiftError) {
            console.error('Error shifting player:', shiftError);
            alert('Error shifting ranks: ' + shiftError.message);
            return;
          }
        }
      }

      // Then add the new player at the target rank
      console.log('Adding player to ladder...');
      const { error } = await supabase
        .from('profiles')
        .update({ 
          in_ladder: true, 
          rank: targetRank
        })
        .eq('id', userId);

      if (error) {
        console.error('Error adding to ladder:', error);
        alert('Error adding to ladder: ' + error.message);
      } else {
        console.log('Successfully added to ladder');
        alert('Player added to ladder!');
        await fetchUsers();
      }
    } catch (error) {
      console.error('Error in addToLadder:', error);
      alert('Error in addToLadder: ' + error.message);
    }
  };

  // Create new ladder (reset everything)
  const createNewLadder = () => {
    setShowConfirmModal(true);
  };

  const confirmCreateNewLadder = async () => {
    try {
      // Remove all users from ladder and clear their stats
      await supabase
        .from('profiles')
        .update({ 
          in_ladder: false, 
          rank: null,
          matches_played: 0,
          matches_won: 0,
          games_played: 0,
          games_won: 0
        })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all

      // Clear availability data
      await supabase
        .from('availability')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      // Create new season
      const { data: newSeason, error } = await supabase
        .from('seasons')
        .insert({
          name: `Season ${new Date().getFullYear()}`,
          start_date: new Date().toISOString().split('T')[0],
          is_active: true
        })
        .select()
        .single();

      if (newSeason) {
        setCurrentSeason({ ...newSeason, matches: [] });
      }

      // Clear local state
      setMatchFixtures([]);
      setMatchResults([]);
      setAvailability([]);
      setShowConfirmModal(false);
      
      await fetchUsers();
      alert('New ladder created successfully! You can now add players to start fresh.');
    } catch (error) {
      console.error('Error creating new ladder:', error);
      alert('Error creating new ladder');
    }
  };

  // Set player availability
  const setPlayerAvailability = async (matchId, available, userId = currentUser?.id) => {
    try {
      console.log('setPlayerAvailability called with:', { matchId, available, userId });
      
      // Get the match date for this match
      const match = currentSeason?.matches?.find(m => m.id === matchId);
      if (!match) {
        alert('Match not found');
        return;
      }
      
      const matchDate = match.match_date;
      console.log('Using match date:', matchDate);
      
      if (available === undefined) {
        // Remove availability record
        console.log('Removing availability record');
        const { error } = await supabase
          .from('availability')
          .delete()
          .eq('player_id', userId)
          .eq('match_date', matchDate);
        
        if (error) {
          console.error('Error removing availability:', error);
          alert('Error clearing availability: ' + error.message);
        }
      } else {
        // Check if record exists
        console.log('Checking for existing record...');
        const { data: existing } = await supabase
          .from('availability')
          .select('*')
          .eq('player_id', userId)
          .eq('match_date', matchDate)
          .maybeSingle();
        
        console.log('Existing availability record:', existing);
        
        if (existing) {
          // Update existing record
          console.log('Updating existing record');
          const { error } = await supabase
            .from('availability')
            .update({ is_available: available })
            .eq('player_id', userId)
            .eq('match_date', matchDate);
          
          if (error) {
            console.error('Error updating availability:', error);
            alert('Error updating availability: ' + error.message);
          }
        } else {
          // Insert new record
          console.log('Inserting new record');
          const { error } = await supabase
            .from('availability')
            .insert({
              player_id: userId,
              match_date: matchDate,
              is_available: available
            });
          
          if (error) {
            console.error('Error inserting availability:', error);
            alert('Error setting availability: ' + error.message);
          }
        }
      }
      
      console.log('Refreshing availability data...');
      await fetchAvailability();
    } catch (error) {
      console.error('Error in setPlayerAvailability:', error);
      alert('Error managing availability: ' + error.message);
    }
  };

  // Add match to season
  const addMatchToSeason = async () => {
    console.log('addMatchToSeason called');
    console.log('newMatchDate:', newMatchDate);
    console.log('currentSeason:', currentSeason);
    
    if (!newMatchDate) {
      alert('Please select a date for the match');
      return;
    }
    
    if (!currentSeason) {
      alert('No active season found. Please create a season first.');
      return;
    }
    
    try {
      const weekNumber = (currentSeason?.matches?.length || 0) + 1;
      console.log('Inserting match with weekNumber:', weekNumber);
      
      const { data, error } = await supabase
        .from('matches')
        .insert({
          season_id: currentSeason.id,
          week_number: weekNumber,
          match_date: newMatchDate,
          status: 'scheduled'
        })
        .select();

      if (error) {
        console.error('Supabase error:', error);
        alert('Error adding match: ' + error.message);
      } else {
        console.log('Match added successfully:', data);
        alert(`Match added for ${new Date(newMatchDate).toLocaleDateString('en-GB')}`);
        await fetchSeasons();
        setShowScheduleModal(false);
        setNewMatchDate('');
      }
    } catch (error) {
      console.error('Error adding match:', error);
      alert('Error adding match: ' + error.message);
    }
  };

  // Update rankings based on scores with proper tiebreaking
  const updateRankings = async () => {
    try {
      console.log('Updating rankings with scores:', scores);
      
      // Calculate stats for each ladder player
      const ladderPlayers = users.filter(u => u.in_ladder && u.status === 'approved');
      const playerStats = {};
      
      // Initialize stats
      ladderPlayers.forEach(player => {
        playerStats[player.id] = {
          name: player.name,
          matchesPlayed: 0,
          matchesWon: 0,
          gamesPlayed: 0,
          gamesWon: 0,
          winPercentage: 0
        };
      });

      // Calculate stats from submitted scores
      scores.forEach(score => {
        const allPlayersInMatch = [...score.pair1, ...score.pair2];
        
        allPlayersInMatch.forEach(playerName => {
          const player = ladderPlayers.find(u => u.name === playerName);
          if (player && playerStats[player.id]) {
            const stats = playerStats[player.id];
            stats.matchesPlayed += 1;
            stats.gamesPlayed += (score.team1_score + score.team2_score);
            
            const isInPair1 = score.pair1.includes(playerName);
            const wonMatch = isInPair1 ? score.team1_score > score.team2_score : score.team2_score > score.team1_score;
            const gamesWon = isInPair1 ? score.team1_score : score.team2_score;
            
            if (wonMatch) {
              stats.matchesWon += 1;
            }
            stats.gamesWon += gamesWon;
          }
        });
      });

      // Calculate win percentages
      Object.values(playerStats).forEach(stats => {
        stats.winPercentage = stats.gamesPlayed > 0 ? 
          Math.round((stats.gamesWon / stats.gamesPlayed) * 100 * 10) / 10 : 0;
      });

      console.log('Calculated player stats:', playerStats);

      // Sort players by: 1) Games Won %, 2) Matches Won, 3) Alphabetical
      const sortedPlayers = ladderPlayers
        .map(player => ({
          ...player,
          calculatedStats: playerStats[player.id]
        }))
        .sort((a, b) => {
          const aStats = a.calculatedStats;
          const bStats = b.calculatedStats;
          
          // 1. Games won percentage (higher is better)
          if (bStats.winPercentage !== aStats.winPercentage) {
            return bStats.winPercentage - aStats.winPercentage;
          }
          
          // 2. Total matches won (higher is better)
          if (bStats.matchesWon !== aStats.matchesWon) {
            return bStats.matchesWon - aStats.matchesWon;
          }
          
          // 3. Alphabetical by name
          return a.name.localeCompare(b.name);
        });

      console.log('Sorted players:', sortedPlayers.map(p => ({ name: p.name, winPct: p.calculatedStats.winPercentage, matchesWon: p.calculatedStats.matchesWon })));

      // Update database with new ranks and stats
      for (let i = 0; i < sortedPlayers.length; i++) {
        const player = sortedPlayers[i];
        const stats = player.calculatedStats;
        const newRank = i + 1;
        
        await supabase
          .from('profiles')
          .update({
            rank: newRank,
            matches_played: stats.matchesPlayed,
            matches_won: stats.matchesWon,
            games_played: stats.gamesPlayed,
            games_won: stats.gamesWon
          })
          .eq('id', player.id);
      }

      await fetchUsers();
      alert('Rankings updated successfully!');
    } catch (error) {
      console.error('Error updating rankings:', error);
      alert('Error updating rankings: ' + error.message);
    }
  };

  // Helper functions
  const getPlayerAvailability = (userId, matchId) => {
    // Find the match to get the match_date
    const match = currentSeason?.matches?.find(m => m.id === matchId);
    if (!match) return undefined;
    
    const userAvailability = availability.find(a => a.player_id === userId && a.match_date === match.match_date);
    return userAvailability?.is_available;
  };

  const getAvailabilityStats = (matchId) => {
    // Find the match to get the match_date
    const match = currentSeason?.matches?.find(m => m.id === matchId);
    if (!match) return { total: 0, available: 0, responded: 0, pending: 0 };
    
    const ladderPlayers = users.filter(u => u.in_ladder && u.status === 'approved');
    const availableCount = availability.filter(a => a.match_date === match.match_date && a.is_available === true).length;
    const respondedCount = availability.filter(a => a.match_date === match.match_date && (a.is_available === true || a.is_available === false)).length;
    
    return {
      total: ladderPlayers.length,
      available: availableCount,
      responded: respondedCount,
      pending: ladderPlayers.length - respondedCount
    };
  };

  const openScoreModal = (matchData) => {
    setSelectedMatch(matchData);
    setShowScoreModal(true);
  };

  const submitScore = async (pair1Score, pair2Score) => {
    if (!selectedMatch) return;
    
    try {
      const { error } = await supabase
        .from('match_results')
        .insert({
          fixture_id: selectedMatch.fixtureId,
          pair1_score: parseInt(pair1Score),
          pair2_score: parseInt(pair2Score),
          submitted_by: currentUser.id
        });
      
      if (error) {
        console.error('Error submitting score:', error);
        alert('Error submitting score: ' + error.message);
      } else {
        await Promise.all([
          fetchMatchResults(),
          fetchSeasons() // Update match status
        ]);
        setShowScoreModal(false);
        setSelectedMatch(null);
        alert('Score submitted successfully!');
      }
    } catch (error) {
      console.error('Error in submitScore:', error);
      alert('Error submitting score: ' + error.message);
    }
  };

  const getMatchScore = (fixtureId) => {
    return matchResults.find(r => r.fixture_id === fixtureId);
  };

  // Update rankings based on actual database scores
  const updateRankings = async () => {
    try {
      console.log('Updating rankings...');
      
      // Get all match results with fixture and player data
      const { data: resultsData, error } = await supabase
        .from('match_results')
        .select(`
          *,
          fixture:fixture_id (
            *,
            player1:player1_id(id, name),
            player2:player2_id(id, name),
            player3:player3_id(id, name),
            player4:player4_id(id, name)
          )
        `);

      if (error) {
        console.error('Error fetching results:', error);
        alert('Error fetching results: ' + error.message);
        return;
      }

      // Calculate stats for each ladder player
      const ladderPlayers = users.filter(u => u.in_ladder && u.status === 'approved');
      const playerStats = {};
      
      // Initialize stats
      ladderPlayers.forEach(player => {
        playerStats[player.id] = {
          name: player.name,
          matchesPlayed: 0,
          matchesWon: 0,
          gamesPlayed: 0,
          gamesWon: 0,
          winPercentage: 0
        };
      });

      // Process each result
      resultsData.forEach(result => {
        const fixture = result.fixture;
        const players = [fixture.player1, fixture.player2, fixture.player3, fixture.player4];
        
        players.forEach(player => {
          if (player && playerStats[player.id]) {
            const stats = playerStats[player.id];
            stats.matchesPlayed += 1;
            stats.gamesPlayed += (result.pair1_score + result.pair2_score);
            
            // Determine if this player won
            const isInPair1 = (fixture.pair1_player1_id === player.id || fixture.pair1_player2_id === player.id);
            const wonMatch = isInPair1 ? result.pair1_score > result.pair2_score : result.pair2_score > result.pair1_score;
            const gamesWon = isInPair1 ? result.pair1_score : result.pair2_score;
            
            if (wonMatch) {
              stats.matchesWon += 1;
            }
            stats.gamesWon += gamesWon;
          }
        });
      });

      // Calculate win percentages
      Object.values(playerStats).forEach(stats => {
        stats.winPercentage = stats.gamesPlayed > 0 ? 
          Math.round((stats.gamesWon / stats.gamesPlayed) * 100 * 10) / 10 : 0;
      });

      // Sort players by: 1) Games Won %, 2) Matches Won, 3) Alphabetical
      const sortedPlayers = ladderPlayers
        .map(player => ({
          ...player,
          calculatedStats: playerStats[player.id]
        }))
        .sort((a, b) => {
          const aStats = a.calculatedStats;
          const bStats = b.calculatedStats;
          
          // 1. Games won percentage (higher is better)
          if (bStats.winPercentage !== aStats.winPercentage) {
            return bStats.winPercentage - aStats.winPercentage;
          }
          
          // 2. Total matches won (higher is better)
          if (bStats.matchesWon !== aStats.matchesWon) {
            return bStats.matchesWon - aStats.matchesWon;
          }
          
          // 3. Alphabetical by name
          return a.name.localeCompare(b.name);
        });

      // Update database with new ranks and stats
      for (let i = 0; i < sortedPlayers.length; i++) {
        const player = sortedPlayers[i];
        const stats = player.calculatedStats;
        const newRank = i + 1;
        
        await supabase
          .from('profiles')
          .update({
            rank: newRank,
            matches_played: stats.matchesPlayed,
            matches_won: stats.matchesWon,
            games_played: stats.gamesPlayed,
            games_won: stats.gamesWon
          })
          .eq('id', player.id);
      }

      await fetchUsers();
      alert('Rankings updated successfully!');
    } catch (error) {
      console.error('Error updating rankings:', error);
      alert('Error updating rankings: ' + error.message);
    }
  };edAt: new Date().toISOString()
    };
    
    setScores(prev => [...prev, newScore]);
    setShowScoreModal(false);
    setSelectedMatch(null);
    alert('Score submitted successfully!');
  };

  const getMatchScore = (matchId, court, gameIndex) => {
    return scores.find(s => 
      s.matchId === matchId && 
      s.court === court && 
      s.gameIndex === gameIndex
    );
  };

  const requestAvailabilityForAll = () => {
    alert('Availability requests sent to all players for upcoming matches!');
  };

  // Generate matches using the complex algorithm - NOW SAVES TO DATABASE
  const generateMatches = async (matchId) => {
    console.log('generateMatches called with matchId:', matchId);
    
    // Find the match to get the match_date
    const match = currentSeason?.matches?.find(m => m.id === matchId);
    if (!match) {
      alert('Match not found');
      return;
    }
    
    console.log('Found match:', match);
    
    const availablePlayers = users.filter(user => {
      if (!user.in_ladder || user.status !== 'approved') return false;
      
      const userAvailability = availability.find(a => a.player_id === user.id && a.match_date === match.match_date);
      const isAvailable = userAvailability?.is_available === true;
      
      console.log(`Player ${user.name}: in_ladder=${user.in_ladder}, status=${user.status}, available=${isAvailable}`);
      
      return isAvailable;
    }).sort((a, b) => (a.rank || 999) - (b.rank || 999));

    console.log('Available players:', availablePlayers.map(p => p.name));
    const numPlayers = availablePlayers.length;
    
    if (numPlayers < 4) {
      alert(`Need at least 4 players to generate matches. Found ${numPlayers} available players.`);
      return;
    }

    const courts = [];

    // Intelligent grouping based on available players (preserving your exact algorithm)
    if (numPlayers % 4 === 0) {
      // Perfect groups of 4 (4, 8, 12, 16 players)
      for (let i = 0; i < numPlayers; i += 4) {
        courts.push(availablePlayers.slice(i, i + 4));
      }
    } else if (numPlayers === 5) {
      // Single group of 5
      courts.push(availablePlayers);
    } else if (numPlayers === 9) {
      // 9 players: 4 + 5 split
      courts.push(availablePlayers.slice(0, 4)); // First 4 players
      courts.push(availablePlayers.slice(4, 9)); // Remaining 5 players
    } else if (numPlayers === 10) {
      // 10 players: Two groups of 5
      courts.push(availablePlayers.slice(0, 5));
      courts.push(availablePlayers.slice(5, 10));
    } else if (numPlayers === 6) {
      // 6 players: Single group of 6
      courts.push(availablePlayers);
    } else if (numPlayers === 7) {
      // 7 players: Single group of 7
      courts.push(availablePlayers);
    } else if (numPlayers === 13) {
      // 13 players: 4 + 4 + 5
      courts.push(availablePlayers.slice(0, 4));
      courts.push(availablePlayers.slice(4, 8));
      courts.push(availablePlayers.slice(8, 13));
    } else if (numPlayers === 14) {
      // 14 players: 5 + 5 + 4
      courts.push(availablePlayers.slice(0, 5));
      courts.push(availablePlayers.slice(5, 10));
      courts.push(availablePlayers.slice(10, 14));
    } else {
      // General case: groups of 4 with remainder
      const groups = Math.floor(numPlayers / 4);
      const remainder = numPlayers % 4;
      
      for (let i = 0; i < groups; i++) {
        courts.push(availablePlayers.slice(i * 4, (i + 1) * 4));
      }
      
      if (remainder > 0) {
        courts.push(availablePlayers.slice(groups * 4));
      }
    }

    // Generate match fixtures for each court and SAVE TO DATABASE
    try {
      // First, clear any existing fixtures for this match
      await supabase
        .from('match_fixtures')
        .delete()
        .eq('match_id', matchId);

      const fixturesToInsert = [];

      courts.forEach((courtPlayers, courtIndex) => {
        const courtNumber = courtIndex + 1;
        let gameNumber = 1;

        if (courtPlayers.length === 5) {
          // Perfect 5-player rotation: everyone plays 4 matches, sits 1
          const rotations = [
            { pair1: [0, 1], pair2: [2, 3], sitting: 4 },
            { pair1: [0, 2], pair2: [1, 4], sitting: 3 },
            { pair1: [0, 3], pair2: [2, 4], sitting: 1 },
            { pair1: [0, 4], pair2: [1, 3], sitting: 2 },
            { pair1: [1, 2], pair2: [3, 4], sitting: 0 }
          ];

          rotations.forEach(rotation => {
            fixturesToInsert.push({
              match_id: matchId,
              court_number: courtNumber,
              game_number: gameNumber++,
              player1_id: courtPlayers[rotation.pair1[0]].id,
              player2_id: courtPlayers[rotation.pair1[1]].id,
              player3_id: courtPlayers[rotation.pair2[0]].id,
              player4_id: courtPlayers[rotation.pair2[1]].id,
              pair1_player1_id: courtPlayers[rotation.pair1[0]].id,
              pair1_player2_id: courtPlayers[rotation.pair1[1]].id,
              pair2_player1_id: courtPlayers[rotation.pair2[0]].id,
              pair2_player2_id: courtPlayers[rotation.pair2[1]].id,
              sitting_player_id: courtPlayers[rotation.sitting].id
            });
          });
        } else if (courtPlayers.length === 4) {
          // Standard 4-player format with rank-based pairings
          const rotations = [
            { pair1: [0, 3], pair2: [1, 2] }, // High+Low vs Mid+Mid
            { pair1: [0, 2], pair2: [1, 3] }, // High+Mid vs Mid+Low  
            { pair1: [0, 1], pair2: [2, 3] }  // High+High vs Low+Low
          ];

          rotations.forEach(rotation => {
            fixturesToInsert.push({
              match_id: matchId,
              court_number: courtNumber,
              game_number: gameNumber++,
              player1_id: courtPlayers[rotation.pair1[0]].id,
              player2_id: courtPlayers[rotation.pair1[1]].id,
              player3_id: courtPlayers[rotation.pair2[0]].id,
              player4_id: courtPlayers[rotation.pair2[1]].id,
              pair1_player1_id: courtPlayers[rotation.pair1[0]].id,
              pair1_player2_id: courtPlayers[rotation.pair1[1]].id,
              pair2_player1_id: courtPlayers[rotation.pair2[0]].id,
              pair2_player2_id: courtPlayers[rotation.pair2[1]].id,
              sitting_player_id: null
            });
          });
        }
        // Add other group sizes here...
      });

      // Insert all fixtures to database
      const { error } = await supabase
        .from('match_fixtures')
        .insert(fixturesToInsert);

      if (error) {
        console.error('Error saving fixtures:', error);
        alert('Error generating matches: ' + error.message);
        return;
      }

      // Refresh data
      await Promise.all([
        fetchMatchFixtures(),
        fetchSeasons() // This will update match status
      ]);

      alert(`Matches generated successfully! Created ${courts.length} court(s) with ${numPlayers} players.`);
    } catch (error) {
      console.error('Error in generateMatches:', error);
      alert('Error generating matches: ' + error.message);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

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

        {activeTab === 'availability' && (
          <AvailabilityTab 
            currentUser={currentUser}
            currentSeason={currentSeason}
            getPlayerAvailability={getPlayerAvailability}
            setPlayerAvailability={setPlayerAvailability}
            matches={matches}
            scores={scores}
            getMatchScore={getMatchScore}
          />
        )}

        {activeTab === 'matches' && (
          <MatchesTab 
            currentUser={currentUser}
            currentSeason={currentSeason}
            matches={matches}
            availability={availability}
            scores={scores}
            users={users}
            generateMatches={generateMatches}
            openScoreModal={openScoreModal}
            setShowScheduleModal={setShowScheduleModal}
            getAvailabilityStats={getAvailabilityStats}
            getMatchScore={getMatchScore}
          />
        )}

        {activeTab === 'admin' && currentUser?.role === 'admin' && (
          <AdminTab 
            users={users}
            currentSeason={currentSeason}
            approveUser={approveUser}
            createNewLadder={createNewLadder}
            setPlayerAvailability={setPlayerAvailability}
            getPlayerAvailability={getPlayerAvailability}
            requestAvailabilityForAll={requestAvailabilityForAll}
            getAvailabilityStats={getAvailabilityStats}
            addToLadder={addToLadder}
            fetchUsers={fetchUsers}
          />
        )}
      </main>

      {/* Modal Components */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-red-600">⚠️ Create New Ladder</h3>
              <div className="space-y-4">
                <div className="text-sm text-gray-700">
                  <p className="mb-3">Are you sure you want to create a completely new ladder?</p>
                  <p className="mb-2 font-medium">This will:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Remove ALL players from the current ladder</li>
                    <li>Clear all matches, scores, and statistics</li>
                    <li>Reset all availability data</li>
                    <li>Create a fresh, empty ladder</li>
                  </ul>
                  <p className="mt-3 text-red-600 font-medium">This cannot be undone!</p>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={confirmCreateNewLadder}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 font-medium"
                  >
                    Yes, Create New Ladder
                  </button>
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Add New Match</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Match Date
                  </label>
                  <input
                    type="date"
                    value={newMatchDate}
                    onChange={(e) => setNewMatchDate(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={addMatchToSeason}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
                  >
                    Add Match
                  </button>
                  <button
                    onClick={() => {
                      setShowScheduleModal(false);
                      setNewMatchDate('');
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showScoreModal && selectedMatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Enter Score</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    {selectedMatch.pair1.join(' & ')} vs {selectedMatch.pair2.join(' & ')}
                  </p>
                  <p className="text-xs text-gray-500">
                    Court {selectedMatch.court} - Match {selectedMatch.gameIndex + 1}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {selectedMatch.pair1.join(' & ')}
                    </label>
                    <input
                      type="number"
                      id="pair1Score"
                      min="0"
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="Games won"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {selectedMatch.pair2.join(' & ')}
                    </label>
                    <input
                      type="number"
                      id="pair2Score"
                      min="0"
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="Games won"
                    />
                  </div>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => {
                      const pair1Score = document.getElementById('pair1Score').value;
                      const pair2Score = document.getElementById('pair2Score').value;
                      if (pair1Score && pair2Score) {
                        submitScore(pair1Score, pair2Score);
                      } else {
                        alert('Please enter scores for both pairs');
                      }
                    }}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
                  >
                    Submit Score
                  </button>
                  <button
                    onClick={() => {
                      setShowScoreModal(false);
                      setSelectedMatch(null);
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TennisLadderApp;