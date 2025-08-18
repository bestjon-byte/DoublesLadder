import React, { useState, useEffect } from 'react';
import { Users, Calendar, Trophy, Settings, Plus, Check, X, ArrowUp, ArrowDown } from 'lucide-react';

// Helper functions moved to top
const getLadderData = (users) => {
  return users
    .filter(user => user.inLadder && user.status === 'approved')
    .sort((a, b) => a.rank - b.rank);
};

const getRankMovementIcon = (movement) => {
  if (movement === 'up') return <ArrowUp className="w-4 h-4 text-green-500" />;
  if (movement === 'down') return <ArrowDown className="w-4 h-4 text-red-500" />;
  return null;
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
  addToLadder 
}) => {
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
                    onClick={() => approveUser(user.id)}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
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
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
          >
            Create New Ladder
          </button>
        </div>
      </div>

      {/* Player Availability Management */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Set Player Availability</h3>
        <p className="text-sm text-gray-600 mb-4">Set availability on behalf of players</p>
        
        {currentSeason?.matches.map((match) => {
          const ladderPlayers = users.filter(u => u.inLadder && u.status === 'approved');
          return (
            <div key={match.id} className="mb-6 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium mb-3">
                Week {match.week} - {new Date(match.date).toLocaleDateString()}
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

      {/* Availability Management */}
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
          {currentSeason?.matches.map((match) => {
            const stats = getAvailabilityStats(match.id);
            return (
              <div key={match.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">Week {match.week} - {new Date(match.date).toLocaleDateString()}</h4>
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

      {/* Add Players to Ladder */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Add Players to Ladder</h3>
        {users.filter(u => u.status === 'approved' && !u.inLadder).length > 0 ? (
          <div className="space-y-3">
            {users.filter(u => u.status === 'approved' && !u.inLadder).map(user => (
              <div key={user.id} className="flex justify-between items-center p-3 border border-gray-200 rounded">
                <p className="font-medium">{user.name}</p>
                <div className="flex items-center space-x-2">
                  <select className="border border-gray-300 rounded px-2 py-1 text-sm">
                    {Array.from({length: users.filter(u => u.inLadder && u.status === 'approved').length + 1}, (_, i) => i + 1).map(rank => (
                      <option key={rank} value={rank}>Rank {rank}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => addToLadder(user.id, 1)}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                  >
                    Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No approved players waiting to join ladder</p>
        )}
      </div>
    </div>
  );
};

// AvailabilityTab Component - handles player availability management
const AvailabilityTab = ({ currentUser, currentSeason, getPlayerAvailability, setPlayerAvailability }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Match Availability</h2>
      <p className="text-gray-600">Please set your availability for upcoming matches</p>
      
      <div className="space-y-4">
        {currentSeason?.matches.map((match) => {
          const userAvailability = getPlayerAvailability(currentUser.id, match.id);
          return (
            <div key={match.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Week {match.week}</h3>
                  <p className="text-gray-600">{new Date(match.date).toLocaleDateString()}</p>
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
                      className="px-4 py-2 rounded-md bg-yellow-200 text-yellow-800 hover:bg-yellow-300 transition-colors"
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
      
      {currentSeason?.matches.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500">No matches scheduled yet.</p>
          {currentUser?.role === 'admin' && (
            <p className="text-sm text-gray-400 mt-2">Click "Add Match" to create your first match.</p>
          )}
        </div>
      ) : (
        currentSeason?.matches.map((match) => {
          const stats = getAvailabilityStats(match.id);
          const matchFixtures = matches.find(m => m.matchId === match.id);
          
          return (
            <div key={match.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Week {match.week}</h3>
                  <p className="text-gray-600">{new Date(match.date).toLocaleDateString()}</p>
                  <div className="mt-2 text-sm text-gray-600">
                    Availability: {stats.available} available, {stats.pending} pending response
                  </div>
                </div>
                {currentUser?.role === 'admin' && (
                  <div className="space-x-2">
                    {match.status === 'pending' && stats.available >= 4 && !matchFixtures && (
                      <button
                        onClick={() => generateMatches(match.id)}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                      >
                        Generate Matches ({stats.available} available)
                      </button>
                    )}
                    {match.status === 'pending' && stats.available < 4 && (
                      <span className="text-gray-500 text-sm">Need 4+ players to generate matches</span>
                    )}
                  </div>
                )}
              </div>

              {matchFixtures && (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <h5 className="font-medium text-green-800 mb-2">✅ Match Generation Complete</h5>
                    <div className="text-sm text-green-700">
                      <div><strong>Available Players:</strong> {
                        users.filter(user => {
                          if (!user.inLadder || user.status !== 'approved') return false;
                          const userAvailability = availability.find(a => a.userId === user.id && a.matchId === match.id);
                          return userAvailability?.available === true;
                        }).map(p => p.name).join(', ')
                      }</div>
                      <div><strong>Courts Created:</strong> {matchFixtures.fixtures.length}</div>
                    </div>
                  </div>
                  
                  {matchFixtures.fixtures.map((court, courtIndex) => (
                    <div key={courtIndex} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold mb-2">Court {court.court}</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Players: {court.players.join(', ')}
                      </p>
                      <div className="space-y-2">
                        {court.matches.map((gameMatch, matchIndex) => {
                          const existingScore = getMatchScore(match.id, court.court, matchIndex);
                          return (
                            <div key={matchIndex} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <div className="flex-1">
                                <span className="text-sm">
                                  {gameMatch.pair1.join(' & ')} vs {gameMatch.pair2.join(' & ')}
                                  {gameMatch.sitting && ` (${gameMatch.sitting} sitting)`}
                                </span>
                                {existingScore && (
                                  <div className="text-xs text-gray-600 mt-1">
                                    Score: {existingScore.pair1Score} - {existingScore.pair2Score}
                                  </div>
                                )}
                              </div>
                              {!existingScore && (
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
                              {existingScore && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                  Complete
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
              {ladderData.map((player, index) => (
                <tr key={player.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{player.rank}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{player.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {player.stats ? `${player.stats.matchesWon}/${player.stats.matchesPlayed}` : '0/0'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {player.stats ? `${player.stats.gamesWon}/${player.stats.gamesPlayed}` : '0/0'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {player.stats ? `${player.stats.winPercentage}%` : '0%'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {player.stats?.rankMovement && getRankMovementIcon(player.stats.rankMovement)}
                  </td>
                </tr>
              ))}
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

// AuthScreen Component - extracted but kept in same file for artifact compatibility
const AuthScreen = ({ users, setUsers, setCurrentUser, setShowAuth }) => {
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    name: ''
  });

  const handleAuth = () => {
    if (authMode === 'login') {
      const user = users.find(u => u.email === authForm.email);
      if (user) {
        setCurrentUser(user);
        setShowAuth(false);
      } else {
        alert('User not found. Try admin@cawood.com for admin access.');
      }
    } else {
      const newUser = {
        id: Date.now(),
        name: authForm.name,
        email: authForm.email,
        role: 'player',
        status: 'pending',
        inLadder: false,
        rank: null
      };
      setUsers([...users, newUser]);
      alert('Registration request submitted. Please wait for admin approval.');
      setAuthMode('login');
    }
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
            className="w-full bg-green-600 text-white py-3 rounded-md hover:bg-green-700 transition-colors font-medium"
          >
            {authMode === 'login' ? 'Sign In' : 'Sign Up'}
          </button>
        </div>

        <div className="mt-4 text-sm text-gray-600 text-center">
          Demo: Use <code className="bg-gray-100 px-2 py-1 rounded">admin@cawood.com</code> for admin access
        </div>
      </div>
    </div>
  );
};

const TennisLadderApp = () => {
  // Core state management
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [currentSeason, setCurrentSeason] = useState(null);
  const [matches, setMatches] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [scores, setScores] = useState([]);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [newMatchDate, setNewMatchDate] = useState('');
  const [activeTab, setActiveTab] = useState('ladder');
  const [showAuth, setShowAuth] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Initialize demo data
  useEffect(() => {
    initializeDemoData();
  }, []);

  const initializeDemoData = () => {
    const demoUsers = [
      { id: 1, name: 'Admin User', email: 'admin@cawood.com', role: 'admin', status: 'approved', inLadder: true, rank: 0 },
      { id: 2, name: 'Alice Johnson', email: 'alice@test.com', role: 'player', status: 'approved', inLadder: true, rank: 1, stats: { matchesPlayed: 8, matchesWon: 6, gamesPlayed: 95, gamesWon: 58, winPercentage: 61.1, rankMovement: 'up' }},
      { id: 3, name: 'Bob Smith', email: 'bob@test.com', role: 'player', status: 'approved', inLadder: true, rank: 2, stats: { matchesPlayed: 8, matchesWon: 5, gamesPlayed: 92, gamesWon: 54, winPercentage: 58.7, rankMovement: 'down' }},
      { id: 4, name: 'Carol Williams', email: 'carol@test.com', role: 'player', status: 'approved', inLadder: true, rank: 3, stats: { matchesPlayed: 7, matchesWon: 4, gamesPlayed: 84, gamesWon: 48, winPercentage: 57.1, rankMovement: 'up' }},
      { id: 5, name: 'David Brown', email: 'david@test.com', role: 'player', status: 'approved', inLadder: true, rank: 4, stats: { matchesPlayed: 8, matchesWon: 4, gamesPlayed: 88, gamesWon: 46, winPercentage: 52.3, rankMovement: 'down' }},
      { id: 6, name: 'Emma Davis', email: 'emma@test.com', role: 'player', status: 'approved', inLadder: true, rank: 5, stats: { matchesPlayed: 6, matchesWon: 2, gamesPlayed: 72, gamesWon: 38, winPercentage: 52.8, rankMovement: 'up' }},
      { id: 7, name: 'Frank Wilson', email: 'frank@test.com', role: 'player', status: 'approved', inLadder: true, rank: 6, stats: { matchesPlayed: 7, matchesWon: 3, gamesPlayed: 78, gamesWon: 39, winPercentage: 50.0, rankMovement: 'down' }},
      { id: 8, name: 'Grace Miller', email: 'grace@test.com', role: 'player', status: 'approved', inLadder: true, rank: 7, stats: { matchesPlayed: 5, matchesWon: 1, gamesPlayed: 45, gamesWon: 20, winPercentage: 44.4, rankMovement: null }},
      { id: 9, name: 'Henry Taylor', email: 'henry@test.com', role: 'player', status: 'approved', inLadder: true, rank: 8, stats: { matchesPlayed: 4, matchesWon: 1, gamesPlayed: 32, gamesWon: 15, winPercentage: 46.9, rankMovement: null }}
    ];

    const demoSeason = {
      id: 1,
      name: 'Summer 2025',
      startDate: '2025-08-01',
      endDate: '2025-09-30',
      matches: [
        { id: 1, date: '2025-08-17', week: 1, status: 'pending' },
        { id: 2, date: '2025-08-24', week: 2, status: 'pending' }
      ]
    };

    setUsers(demoUsers);
    setSeasons([demoSeason]);
    setCurrentSeason(demoSeason);
    
    // Initialize some demo availability for Week 1
    const demoAvailability = [
      { userId: 2, matchId: 1, available: true }, // Alice
      { userId: 3, matchId: 1, available: true }, // Bob
      { userId: 4, matchId: 1, available: true }, // Carol
      { userId: 5, matchId: 1, available: true }, // David
      { userId: 6, matchId: 1, available: false }, // Emma
      { userId: 7, matchId: 1, available: true }, // Frank
      { userId: 8, matchId: 1, available: true }, // Grace
      { userId: 9, matchId: 1, available: true }, // Henry
    ];
    setAvailability(demoAvailability);
  };

  const approveUser = (userId) => {
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, status: 'approved' }
        : user
    ));
  };

  const addToLadder = (userId, rank) => {
    setUsers(users.map(user => {
      if (user.id === userId) {
        return { ...user, inLadder: true, rank: parseInt(rank) };
      } else if (user.inLadder && user.rank >= parseInt(rank)) {
        return { ...user, rank: user.rank + 1 };
      }
      return user;
    }));
  };

  const createNewLadder = () => {
    setShowConfirmModal(true);
  };

  const confirmCreateNewLadder = () => {
    // Remove all users from ladder and clear their stats
    setUsers(users.map(user => ({
      ...user,
      inLadder: false,
      rank: null,
      stats: undefined
    })));
    
    // Clear all related data
    setScores([]);
    setMatches([]);
    setAvailability([]);
    
    // Create a completely new season
    const newSeason = {
      id: Date.now(),
      name: `Season ${new Date().getFullYear()}`,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days from now
      matches: []
    };
    
    setCurrentSeason(newSeason);
    setSeasons([newSeason]);
    setShowConfirmModal(false);
    
    alert('New ladder created successfully! You can now add players to start fresh.');
  };

  const setPlayerAvailability = (matchId, available, userId = currentUser?.id) => {
    setAvailability(prev => {
      if (available === undefined) {
        return prev.filter(a => !(a.userId === userId && a.matchId === matchId));
      }
      
      const existing = prev.find(a => a.userId === userId && a.matchId === matchId);
      if (existing) {
        return prev.map(a => 
          a.userId === userId && a.matchId === matchId 
            ? { ...a, available }
            : a
        );
      } else {
        return [...prev, { userId, matchId, available }];
      }
    });
  };

  const addMatchToSeason = () => {
    if (!newMatchDate) {
      alert('Please select a date for the match');
      return;
    }
    
    const newMatch = {
      id: Date.now(),
      date: newMatchDate,
      week: (currentSeason?.matches.length || 0) + 1,
      status: 'pending'
    };
    
    const updatedSeason = {
      ...currentSeason,
      matches: [...(currentSeason?.matches || []), newMatch]
    };
    
    setCurrentSeason(updatedSeason);
    setSeasons([updatedSeason]);
    setShowScheduleModal(false);
    setNewMatchDate('');
    alert(`Match added for ${new Date(newMatchDate).toLocaleDateString()}`);
  };

  const updateRankings = () => {
    const playerStats = {};
    
    users.filter(u => u.inLadder && u.status === 'approved').forEach(user => {
      playerStats[user.id] = {
        matchesPlayed: 0,
        matchesWon: 0,
        gamesPlayed: 0,
        gamesWon: 0,
        winPercentage: 0,
        rankMovement: null
      };
    });

    scores.forEach(score => {
      const allPlayersInMatch = [...score.pair1, ...score.pair2];
      
      allPlayersInMatch.forEach(playerName => {
        const player = users.find(u => u.name === playerName && u.inLadder);
        if (player && playerStats[player.id]) {
          playerStats[player.id].matchesPlayed += 1;
          playerStats[player.id].gamesPlayed += (score.pair1Score + score.pair2Score);
          
          const isInPair1 = score.pair1.includes(playerName);
          const wonMatch = isInPair1 ? score.pair1Score > score.pair2Score : score.pair2Score > score.pair1Score;
          
          if (wonMatch) {
            playerStats[player.id].matchesWon += 1;
            playerStats[player.id].gamesWon += isInPair1 ? score.pair1Score : score.pair2Score;
          } else {
            playerStats[player.id].gamesWon += isInPair1 ? score.pair1Score : score.pair2Score;
          }
        }
      });
    });

    const updatedUsers = users.map(user => {
      if (user.inLadder && playerStats[user.id]) {
        const stats = playerStats[user.id];
        stats.winPercentage = stats.gamesPlayed > 0 ? 
          Math.round((stats.gamesWon / stats.gamesPlayed) * 100 * 10) / 10 : 0;
        
        return { ...user, stats };
      }
      return user;
    });

    const ladderPlayers = updatedUsers
      .filter(u => u.inLadder && u.status === 'approved')
      .sort((a, b) => {
        if (b.stats.winPercentage !== a.stats.winPercentage) {
          return b.stats.winPercentage - a.stats.winPercentage;
        }
        return b.stats.matchesWon - a.stats.matchesWon;
      });

    const finalUsers = updatedUsers.map(user => {
      if (user.inLadder && user.status === 'approved') {
        const newRank = ladderPlayers.findIndex(p => p.id === user.id) + 1;
        const oldRank = user.rank;
        let rankMovement = null;
        
        if (oldRank && newRank < oldRank) rankMovement = 'up';
        else if (oldRank && newRank > oldRank) rankMovement = 'down';
        
        return {
          ...user,
          rank: newRank,
          stats: {
            ...user.stats,
            rankMovement
          }
        };
      }
      return user;
    });

    setUsers(finalUsers);
    alert('Rankings updated based on submitted scores!');
  };

  const openScoreModal = (matchData) => {
    setSelectedMatch(matchData);
    setShowScoreModal(true);
  };

  const submitScore = (pair1Score, pair2Score) => {
    if (!selectedMatch) return;
    
    const newScore = {
      id: Date.now(),
      matchId: selectedMatch.matchId,
      court: selectedMatch.court,
      gameIndex: selectedMatch.gameIndex,
      pair1: selectedMatch.pair1,
      pair2: selectedMatch.pair2,
      pair1Score: parseInt(pair1Score),
      pair2Score: parseInt(pair2Score),
      submittedBy: currentUser.id,
      submittedAt: new Date().toISOString()
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

  const getPlayerAvailability = (userId, matchId) => {
    const userAvailability = availability.find(a => a.userId === userId && a.matchId === matchId);
    return userAvailability?.available;
  };

  const getAvailabilityStats = (matchId) => {
    const ladderPlayers = users.filter(u => u.inLadder && u.status === 'approved');
    const availableCount = availability.filter(a => a.matchId === matchId && a.available === true).length;
    const respondedCount = availability.filter(a => a.matchId === matchId && (a.available === true || a.available === false)).length;
    
    return {
      total: ladderPlayers.length,
      available: availableCount,
      responded: respondedCount,
      pending: ladderPlayers.length - respondedCount
    };
  };

  const generateMatches = (matchId) => {
    const availablePlayers = users.filter(user => {
      if (!user.inLadder || user.status !== 'approved') return false;
      
      const userAvailability = availability.find(a => a.userId === user.id && a.matchId === matchId);
      return userAvailability?.available === true;
    }).sort((a, b) => a.rank - b.rank);

    const numPlayers = availablePlayers.length;
    
    if (numPlayers < 4) {
      alert('Need at least 4 players to generate matches');
      return;
    }

    const courts = [];

    // Intelligent grouping based on available players
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

    // Generate match fixtures for each court
    const matchFixtures = courts.map((courtPlayers, courtIndex) => {
      if (courtPlayers.length === 5) {
        // Perfect 5-player rotation: everyone plays 4 matches, sits 1
        return {
          court: courtIndex + 1,
          players: courtPlayers.map(p => p.name),
          matches: [
            { pair1: [courtPlayers[0].name, courtPlayers[1].name], pair2: [courtPlayers[2].name, courtPlayers[3].name], sitting: courtPlayers[4].name },
            { pair1: [courtPlayers[0].name, courtPlayers[2].name], pair2: [courtPlayers[1].name, courtPlayers[4].name], sitting: courtPlayers[3].name },
            { pair1: [courtPlayers[0].name, courtPlayers[3].name], pair2: [courtPlayers[2].name, courtPlayers[4].name], sitting: courtPlayers[1].name },
            { pair1: [courtPlayers[0].name, courtPlayers[4].name], pair2: [courtPlayers[1].name, courtPlayers[3].name], sitting: courtPlayers[2].name },
            { pair1: [courtPlayers[1].name, courtPlayers[2].name], pair2: [courtPlayers[3].name, courtPlayers[4].name], sitting: courtPlayers[0].name }
          ]
        };
      } else if (courtPlayers.length === 4) {
        // Standard 4-player format with rank-based pairings
        // Highest&Lowest vs 2nd&3rd, then rotations
        return {
          court: courtIndex + 1,
          players: courtPlayers.map(p => p.name),
          matches: [
            { pair1: [courtPlayers[0].name, courtPlayers[3].name], pair2: [courtPlayers[1].name, courtPlayers[2].name] },
            { pair1: [courtPlayers[0].name, courtPlayers[2].name], pair2: [courtPlayers[1].name, courtPlayers[3].name] },
            { pair1: [courtPlayers[0].name, courtPlayers[1].name], pair2: [courtPlayers[2].name, courtPlayers[3].name] }
          ]
        };
      } else if (courtPlayers.length === 6) {
        // 6-player format: 2 sit out each match
        return {
          court: courtIndex + 1,
          players: courtPlayers.map(p => p.name),
          matches: [
            { pair1: [courtPlayers[0].name, courtPlayers[1].name], pair2: [courtPlayers[2].name, courtPlayers[3].name], sitting: `${courtPlayers[4].name}, ${courtPlayers[5].name}` },
            { pair1: [courtPlayers[0].name, courtPlayers[2].name], pair2: [courtPlayers[4].name, courtPlayers[5].name], sitting: `${courtPlayers[1].name}, ${courtPlayers[3].name}` },
            { pair1: [courtPlayers[0].name, courtPlayers[4].name], pair2: [courtPlayers[1].name, courtPlayers[3].name], sitting: `${courtPlayers[2].name}, ${courtPlayers[5].name}` },
            { pair1: [courtPlayers[0].name, courtPlayers[5].name], pair2: [courtPlayers[2].name, courtPlayers[4].name], sitting: `${courtPlayers[1].name}, ${courtPlayers[3].name}` },
            { pair1: [courtPlayers[1].name, courtPlayers[2].name], pair2: [courtPlayers[3].name, courtPlayers[5].name], sitting: `${courtPlayers[0].name}, ${courtPlayers[4].name}` }
          ]
        };
      } else if (courtPlayers.length === 7) {
        // 7-player format: 3 sit out each match
        return {
          court: courtIndex + 1,
          players: courtPlayers.map(p => p.name),
          matches: [
            { pair1: [courtPlayers[0].name, courtPlayers[1].name], pair2: [courtPlayers[2].name, courtPlayers[3].name], sitting: `${courtPlayers[4].name}, ${courtPlayers[5].name}, ${courtPlayers[6].name}` },
            { pair1: [courtPlayers[0].name, courtPlayers[4].name], pair2: [courtPlayers[1].name, courtPlayers[5].name], sitting: `${courtPlayers[2].name}, ${courtPlayers[3].name}, ${courtPlayers[6].name}` },
            { pair1: [courtPlayers[0].name, courtPlayers[6].name], pair2: [courtPlayers[2].name, courtPlayers[4].name], sitting: `${courtPlayers[1].name}, ${courtPlayers[3].name}, ${courtPlayers[5].name}` },
            { pair1: [courtPlayers[1].name, courtPlayers[2].name], pair2: [courtPlayers[3].name, courtPlayers[6].name], sitting: `${courtPlayers[0].name}, ${courtPlayers[4].name}, ${courtPlayers[5].name}` },
            { pair1: [courtPlayers[1].name, courtPlayers[4].name], pair2: [courtPlayers[3].name, courtPlayers[5].name], sitting: `${courtPlayers[0].name}, ${courtPlayers[2].name}, ${courtPlayers[6].name}` },
            { pair1: [courtPlayers[2].name, courtPlayers[5].name], pair2: [courtPlayers[4].name, courtPlayers[6].name], sitting: `${courtPlayers[0].name}, ${courtPlayers[1].name}, ${courtPlayers[3].name}` }
          ]
        };
      } else if (courtPlayers.length >= 8) {
        // 8+ players: Use first 4 for main matches, rotate others in
        const mainPlayers = courtPlayers.slice(0, 4);
        const extraPlayers = courtPlayers.slice(4);
        return {
          court: courtIndex + 1,
          players: courtPlayers.map(p => p.name),
          matches: [
            { pair1: [mainPlayers[0].name, mainPlayers[3].name], pair2: [mainPlayers[1].name, mainPlayers[2].name], sitting: extraPlayers.map(p => p.name).join(', ') },
            { pair1: [mainPlayers[0].name, mainPlayers[2].name], pair2: [mainPlayers[1].name, mainPlayers[3].name], sitting: extraPlayers.map(p => p.name).join(', ') },
            { pair1: [mainPlayers[0].name, mainPlayers[1].name], pair2: [mainPlayers[2].name, mainPlayers[3].name], sitting: extraPlayers.map(p => p.name).join(', ') }
          ]
        };
      }
      return null;
    }).filter(fixture => fixture !== null);

    setMatches(prev => [
      ...prev.filter(m => m.matchId !== matchId),
      { matchId, fixtures: matchFixtures, generated: true }
    ]);
    
    alert(`Matches generated successfully! Created ${matchFixtures.length} court(s) with ${numPlayers} players.`);
  };

  if (showAuth) {
    return (
      <AuthScreen 
        users={users}
        setUsers={setUsers}
        setCurrentUser={setCurrentUser}
        setShowAuth={setShowAuth}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        currentUser={currentUser}
        onSignOut={() => {
          setCurrentUser(null);
          setShowAuth(true);
        }}
      />

      <Navigation 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
      />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'ladder' && (
          <LadderTab 
            currentUser={currentUser}
            users={users}
            updateRankings={updateRankings}
          />
        )}

        {activeTab === 'availability' && currentUser?.inLadder && (
          <AvailabilityTab 
            currentUser={currentUser}
            currentSeason={currentSeason}
            getPlayerAvailability={getPlayerAvailability}
            setPlayerAvailability={setPlayerAvailability}
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
          />
        )}
      </main>

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