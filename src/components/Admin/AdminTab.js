// src/components/Admin/AdminTab.js
import React, { useState } from 'react';
import { Check } from 'lucide-react';

const AdminTab = ({ 
  users, 
  currentSeason,
  approveUser, 
  addToLadder, 
  fetchUsers,
  setPlayerAvailability,
  getPlayerAvailability,
  getAvailabilityStats,
  clearOldMatches,
  matchFixtures,
  matchResults,
  requestAvailabilityForAll = () => console.log('Availability requests would be sent to all players')
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

  // Helper to check if a match is complete
  const isMatchComplete = (matchId) => {
    const matchGameFixtures = matchFixtures?.filter(f => f.match_id === matchId) || [];
    if (matchGameFixtures.length === 0) return false;
    
    const completedGames = matchGameFixtures.filter(fixture => 
      matchResults?.some(result => result.fixture_id === fixture.id)
    ).length;
    
    return completedGames === matchGameFixtures.length && matchGameFixtures.length > 0;
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

      {/* Player Availability Management */}
      {currentSeason?.matches && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Set Player Availability</h3>
          <p className="text-sm text-gray-600 mb-4">Set availability on behalf of players</p>
          
          {currentSeason.matches.map((match) => {
            const ladderPlayers = users.filter(u => u.in_ladder && u.status === 'approved');
            const matchComplete = isMatchComplete(match.id);
            
            return (
              <div key={match.id} className="mb-6 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium mb-3">
                  Week {match.week_number} - {new Date(match.match_date).toLocaleDateString('en-GB')}
                  {matchComplete && (
                    <span className="ml-2 text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                      ✅ Completed
                    </span>
                  )}
                </h4>
                {matchComplete ? (
                  <div className="text-sm text-gray-600 italic">
                    All results have been entered for this match. Availability cannot be changed.
                  </div>
                ) : (
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
                                className="px-2 py-1 text-xs rounded bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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
                      <h4 className="font-medium">Week {match.week_number} - {new Date(match.match_date).toLocaleDateString('en-GB')}</h4>
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

      {/* Debug/Maintenance Section */}
      <div className="bg-red-50 border border-red-200 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 text-red-800">⚠️ Admin Maintenance</h3>
        <p className="text-sm text-red-600 mb-4">Use these tools carefully - they will delete data permanently!</p>
        <button
          onClick={() => {
            if (window.confirm('This will delete ALL matches, fixtures, results, and availability data. Are you absolutely sure?')) {
              clearOldMatches();
            }
          }}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
        >
          Clear All Match Data
        </button>
      </div>
    </div>
  );
};

export default AdminTab;