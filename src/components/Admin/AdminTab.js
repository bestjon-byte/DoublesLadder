// src/components/Admin/AdminTab.js - FIXED VERSION
import React, { useState } from 'react';
import { Check, Edit, X } from 'lucide-react';
import { supabase } from '../../supabaseClient';

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
  const [editingScore, setEditingScore] = useState(null);
  const [editForm, setEditForm] = useState({ pair1_score: '', pair2_score: '' });

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

  const handleEditScore = (result) => {
    console.log('✏️ Starting score edit for:', result.id);
    setEditingScore(result.id);
    setEditForm({
      pair1_score: result.pair1_score.toString(),
      pair2_score: result.pair2_score.toString()
    });
  };

  const handleSaveEdit = async (resultId) => {
    setLoading(true);
    try {
      console.log('💾 Saving score edit:', { resultId, editForm });
      
      if (!editForm.pair1_score || !editForm.pair2_score) {
        alert('Please enter both scores');
        return;
      }

      const { error } = await supabase
        .from('match_results')
        .update({
          pair1_score: parseInt(editForm.pair1_score),
          pair2_score: parseInt(editForm.pair2_score)
        })
        .eq('id', resultId);

      if (error) throw error;

      console.log('✅ Score updated successfully');
      alert('Score updated successfully!');
      setEditingScore(null);
      setEditForm({ pair1_score: '', pair2_score: '' });
      
      // Refresh data if possible
      if (fetchUsers) fetchUsers();
    } catch (error) {
      console.error('💥 Error updating score:', error);
      alert('Error updating score: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingScore(null);
    setEditForm({ pair1_score: '', pair2_score: '' });
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
      
      {/* Recent Match Results - Admin Edit */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">🎾 Recent Match Results - Admin Edit</h3>
        {matchResults && matchResults.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {matchResults.slice(0, 10).map((result) => (
              <div key={result.id} className="border border-gray-200 rounded p-3 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      {editingScore === result.id ? (
                        // Edit mode
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min="0"
                            max="20"
                            value={editForm.pair1_score}
                            onChange={(e) => setEditForm({...editForm, pair1_score: e.target.value})}
                            className="w-12 p-1 border border-gray-300 rounded text-center text-sm"
                            disabled={loading}
                          />
                          <span className="text-gray-500">-</span>
                          <input
                            type="number"
                            min="0"
                            max="20"
                            value={editForm.pair2_score}
                            onChange={(e) => setEditForm({...editForm, pair2_score: e.target.value})}
                            className="w-12 p-1 border border-gray-300 rounded text-center text-sm"
                            disabled={loading}
                          />
                          <button
                            onClick={() => handleSaveEdit(result.id)}
                            disabled={loading || !editForm.pair1_score || !editForm.pair2_score}
                            className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 disabled:opacity-50"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            disabled={loading}
                            className="bg-gray-500 text-white px-2 py-1 rounded text-xs hover:bg-gray-600 disabled:opacity-50"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        // Display mode
                        <div className="flex items-center space-x-4">
                          <span className="font-bold text-lg text-gray-800">
                            {result.pair1_score} - {result.pair2_score}
                          </span>
                          <span className="text-xs text-gray-500">
                            {result.created_at ? new Date(result.created_at).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            }) : 'Unknown date'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {editingScore !== result.id && (
                    <button 
                      onClick={() => handleEditScore(result)}
                      disabled={loading}
                      className="bg-[#5D1F1F] text-white p-1 rounded text-xs hover:bg-[#4A1818] disabled:opacity-50"
                      title="Edit score"
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                  )}
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