// src/components/Admin/AdminTab.js - SAFE VERSION
import React, { useState } from 'react';
import { Check } from 'lucide-react';

const AdminTab = ({ 
  users, 
  currentUser,
  currentSeason,
  approveUser, 
  addToLadder, 
  fetchUsers,
  setPlayerAvailability,
  getPlayerAvailability,
  getAvailabilityStats,
  clearOldMatches,
  matchFixtures,
  matchResults
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
      
      {/* TEST: Basic Score Management Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">🎾 Recent Match Results - Admin Edit</h3>
        {matchResults && matchResults.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {matchResults.slice(0, 10).map((result, index) => (
              <div key={index} className="border border-gray-200 rounded p-3 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-bold text-lg text-gray-800">
                      {result.pair1_score} - {result.pair2_score}
                    </span>
                    <span className="text-xs text-gray-500 ml-3">
                      {new Date(result.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <button className="bg-[#5D1F1F] text-white p-1 rounded text-xs hover:bg-[#4A1818]">
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No match results to display (Total: {matchResults?.length || 0})</p>
        )}
      </div>

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
                  className="bg-[#5D1F1F] text-white px-3 py-1 rounded text-sm hover:bg-[#4A1818] disabled:opacity-50"
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
                        handleAddToLadder(user.id, selectedRank);
                      }}
                      disabled={loading}
                      className="bg-[#5D1F1F] text-white px-3 py-1 rounded text-sm hover:bg-[#4A1818] disabled:opacity-50"
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