import React, { useState, useEffect } from 'react';
import { Users, Calendar, Trophy, Settings, Plus, Check, X, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from './supabaseClient';

// Helper functions
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

// Format date to UK format (DD/MM/YYYY)
const formatDateUK = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-GB');
};

// Auth Component
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

// Admin Component
const AdminTab = ({ users, approveUser, addToLadder, fetchUsers }) => {
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
                <button
                  onClick={() => handleApproveUser(user.id)}
                  disabled={loading}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No pending approvals</p>
        )}
      </div>

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

// Availability Component
const AvailabilityTab = ({ currentUser, currentSeason, getPlayerAvailability, setPlayerAvailability, matchFixtures, matchResults, getMatchScore }) => {
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
    const playerFixtures = matchFixtures.filter(fixture => 
      fixture.match_id === matchId && 
      (fixture.player1_id === currentUser.id || fixture.player2_id === currentUser.id || 
       fixture.player3_id === currentUser.id || fixture.player4_id === currentUser.id)
    );
    
    const playerScores = [];
    playerFixtures.forEach(fixture => {
      const score = getMatchScore(fixture.id);
      if (score) {
        const isInPair1 = (fixture.pair1_player1_id === currentUser.id || fixture.pair1_player2_id === currentUser.id);
        const won = isInPair1 ? score.pair1_score > score.pair2_score : score.pair2_score > score.pair1_score;
        
        let partner, opponent;
        if (isInPair1) {
          partner = fixture.pair1_player1_id === currentUser.id ? fixture.player2?.name : fixture.player1?.name;
          opponent = `${fixture.player3?.name} & ${fixture.player4?.name}`;
        } else {
          partner = fixture.pair2_player1_id === currentUser.id ? fixture.player4?.name : fixture.player3?.name;
          opponent = `${fixture.player1?.name} & ${fixture.player2?.name}`;
        }
        
        playerScores.push({
          opponent: opponent,
          partner: partner,
          score: `${score.pair1_score} - ${score.pair2_score}`,
          won: won
        });
      }
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
                      <h4 className="text-lg font-semibold">Week {match.week_number}</h4>
                      <p className="text-gray-600">{formatDateUK(match.match_date)}</p>
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

      {/* Past Matches - Show as completed */}
      {pastMatches.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Completed Matches</h3>
          <div className="space-y-4">
            {pastMatches.map((match) => {
              const playerScores = getPlayerScoresForMatch(match.id);
              
              return (
                <div key={match.id} className="bg-white rounded-lg shadow p-6">
                  <div className="mb-4">
                    <h4 className="text-lg font-semibold">Week {match.week_number}</h4>
                    <p className="text-gray-600">{formatDateUK(match.match_date)}</p>
                    <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded mt-1">
                      ✅ Completed
                    </span>
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

// Enhanced Matches Component with full functionality
const MatchesTab = ({ 
  currentUser, 
  currentSeason, 
  setShowScheduleModal,
  matchFixtures,
  matchResults,
  availability,
  users,
  generateMatches,
  openScoreModal,
  getAvailabilityStats,
  getMatchScore
}) => {
  // Helper function to determine match status
  const getMatchStatus = (match) => {
    const today = new Date();
    const matchDate = new Date(match.match_date);
    
    const hasFixtures = matchFixtures.some(f => f.match_id === match.id);
    
    if (!hasFixtures) {
      if (matchDate < today) {
        return 'past-no-fixtures';
      }
      return 'future-no-fixtures';
    }
    
    // Count total games and completed games for this match
    const matchGameFixtures = matchFixtures.filter(f => f.match_id === match.id);
    const completedGames = matchGameFixtures.filter(fixture => 
      matchResults.some(result => result.fixture_id === fixture.id)
    ).length;
    
    if (completedGames === 0) {
      return matchDate < today ? 'past-in-progress' : 'future-in-progress';
    } else if (completedGames < matchGameFixtures.length) {
      return 'partially-complete';
    } else {
      return 'completed';
    }
  };

  // Helper function to check if current user can enter scores for a fixture
  const canUserEnterScores = (fixture) => {
    if (currentUser?.role === 'admin') return true;
    
    // Check if current user is in this specific fixture
    return fixture.player1_id === currentUser?.id || 
           fixture.player2_id === currentUser?.id || 
           fixture.player3_id === currentUser?.id || 
           fixture.player4_id === currentUser?.id;
  };

  // Group fixtures by court for display
  const getCourtFixtures = (matchId) => {
    const fixtures = matchFixtures.filter(f => f.match_id === matchId);
    const courtGroups = {};
    
    fixtures.forEach(fixture => {
      if (!courtGroups[fixture.court_number]) {
        courtGroups[fixture.court_number] = [];
      }
      courtGroups[fixture.court_number].push(fixture);
    });
    
    return Object.entries(courtGroups).map(([courtNumber, courtFixtures]) => ({
      court: parseInt(courtNumber),
      fixtures: courtFixtures.sort((a, b) => a.game_number - b.game_number)
    }));
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
        <div className="space-y-4">
          {currentSeason.matches.map((match) => {
            const stats = getAvailabilityStats(match.id);
            const matchStatus = getMatchStatus(match);
            const isAdmin = currentUser?.role === 'admin';
            const courtFixtures = getCourtFixtures(match.id);
            
            return (
              <div key={match.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Week {match.week_number}</h3>
                    <p className="text-gray-600">{formatDateUK(match.match_date)}</p>
                    
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
                  
                  {/* Admin Controls - Only show generate button if NOT completed */}
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
                {courtFixtures.length > 0 && (
                  <div className="space-y-4">
                    {/* Available Players Info (Admin Debug) - Hide if completed */}
                    {isAdmin && matchStatus !== 'completed' && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <h5 className="font-medium text-green-800 mb-2">📋 Match Details</h5>
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
                          <div><strong>Courts Created:</strong> {courtFixtures.length}</div>
                        </div>
                      </div>
                    )}
                    
                    {/* Court Fixtures */}
                    {courtFixtures.map((court) => (
                      <div key={court.court} className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-semibold mb-2">Court {court.court}</h4>
                        <p className="text-sm text-gray-600 mb-3">
                          Players: {[...new Set([
                            ...court.fixtures.map(f => f.player1?.name),
                            ...court.fixtures.map(f => f.player2?.name),
                            ...court.fixtures.map(f => f.player3?.name),
                            ...court.fixtures.map(f => f.player4?.name)
                          ].filter(Boolean))].join(', ')}
                        </p>
                        <div className="space-y-2">
                          {court.fixtures.map((fixture) => {
                            const existingScore = getMatchScore(fixture.id);
                            const canEnterScore = canUserEnterScores(fixture);
                            
                            const pair1Names = [fixture.player1?.name, fixture.player2?.name].filter(Boolean);
                            const pair2Names = [fixture.player3?.name, fixture.player4?.name].filter(Boolean);
                            
                            return (
                              <div key={fixture.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                <div className="flex-1">
                                  <span className="text-sm">
                                    {pair1Names.join(' & ')} vs {pair2Names.join(' & ')}
                                    {fixture.sitting_player && ` (${fixture.sitting_player.name} sitting)`}
                                  </span>
                                  {existingScore && (
                                    <div className="text-xs text-gray-600 mt-1">
                                      Score: {existingScore.pair1_score} - {existingScore.pair2_score}
                                    </div>
                                  )}
                                </div>
                                
                                {/* Score Entry Button */}
                                {!existingScore && canEnterScore && matchStatus !== 'future-no-fixtures' && (
                                  <button 
                                    onClick={() => openScoreModal({
                                      fixtureId: fixture.id,
                                      pair1: pair1Names,
                                      pair2: pair2Names
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