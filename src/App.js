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

// Matches Component
const MatchesTab = ({ 
  currentUser, 
  currentSeason, 
  setShowScheduleModal 
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
      
      {!currentSeason?.matches || currentSeason.matches.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500">No matches scheduled yet.</p>
          {currentUser?.role === 'admin' && (
            <p className="text-sm text-gray-400 mt-2">Click "Add Match" to create your first match.</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {currentSeason.matches.map((match) => (
            <div key={match.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">Week {match.week_number}</h3>
                  <p className="text-gray-600">{new Date(match.match_date).toLocaleDateString('en-GB')}</p>
                  <p className="text-sm text-gray-500 mt-1">Status: {match.status}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Ladder Component
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

// Navigation Component
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

// Header Component
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
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [currentSeason, setCurrentSeason] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ladder');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [newMatchDate, setNewMatchDate] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

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
          fetchSeasons()
        ]);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const fetchSeasons = async () => {
    try {
      console.log('Fetching seasons...');
      
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

  const createDefaultSeason = async () => {
    try {
      console.log('Creating default season...');
      
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

  const addToLadder = async (userId, rank) => {
    console.log('addToLadder called with:', { userId, rank });
    
    try {
      const targetRank = parseInt(rank);
      console.log('Target rank:', targetRank);
      
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

  const updateRankings = async () => {
    alert('Rankings will be updated based on match results!');
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

        {activeTab === 'matches' && (
          <MatchesTab 
            currentUser={currentUser}
            currentSeason={currentSeason}
            setShowScheduleModal={setShowScheduleModal}
          />
        )}

        {activeTab === 'admin' && currentUser?.role === 'admin' && (
          <AdminTab 
            users={users}
            approveUser={approveUser}
            addToLadder={addToLadder}
            fetchUsers={fetchUsers}
          />
        )}
      </main>

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
    </div>
  );
};

export default TennisLadderApp;