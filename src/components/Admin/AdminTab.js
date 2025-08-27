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
        setLoading(false);
        return;
      }

      const newPair1Score = parseInt(editForm.pair1_score);
      const newPair2Score = parseInt(editForm.pair2_score);

      console.log('🎯 About to update with scores:', { newPair1Score, newPair2Score });

      const { data, error } = await supabase
        .from('match_results')
        .update({
          pair1_score: newPair1Score,
          pair2_score: newPair2Score
        })
        .eq('id', resultId)
        .select(); // This returns the updated data

      if (error) {
        console.error('❌ Database update failed:', error);
        alert('Failed to update score: ' + error.message);
        setLoading(false);
        return;
      }

      console.log('✅ Database update successful:', data);

      // Clear the edit state
      setEditingScore(null);
      setEditForm({ pair1_score: '', pair2_score: '' });
      
      // Force a page refresh to see the changes (temporary solution)
      alert('Score updated successfully! Refreshing page to show changes...');
      window.location.reload();
      
    } catch (error) {
      console.error('💥 Unexpected error updating score:', error);
      alert('Unexpected error: ' + error.message);
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
        <h3 className="text-lg font-semibold mb-4">🎾 Recent Match Results - Admin Edit ({matchResults?.length || 0})</h3>
        {matchResults && matchResults.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {matchResults.slice(0, 15).map((result) => {
              // Find the fixture to get player names
              const fixture = matchFixtures?.find(f => f.id === result.fixture_id);
              
              return (
                <div key={result.id} className="border border-gray-200 rounded p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      {/* Match context - who was playing */}
                      {fixture ? (
                        <div className="mb-2">
                          <p className="font-medium text-sm text-gray-800">
                            {fixture.player1?.name || 'Player 1'} & {fixture.player2?.name || 'Player 2'} 
                            <span className="text-gray-500 mx-2">vs</span>
                            {fixture.player3?.name || 'Player 3'} & {fixture.player4?.name || 'Player 4'}
                          </p>
                          <p className="text-xs text-gray-500">
                            Week {fixture.match?.week_number || '?'} - Court {fixture.court_number || '?'}
                          </p>
                        </div>
                      ) : (
                        <div className="mb-2">
                          <p className="text-sm text-gray-500 italic">Match details unavailable</p>
                        </div>
                      )}
                      
                      {/* Score editing */}
                      <div className="flex items-center space-x-4">
                        {editingScore === result.id ? (
                          // Edit mode
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center space-x-1">
                              <span className="text-sm text-gray-600">Score:</span>
                              <input
                                type="number"
                                min="0"
                                max="20"
                                value={editForm.pair1_score}
                                onChange={(e) => setEditForm({...editForm, pair1_score: e.target.value})}
                                className="w-14 p-2 border border-gray-300 rounded text-center font-semibold"
                                disabled={loading}
                                placeholder="0"
                              />
                              <span className="text-gray-500 font-bold">-</span>
                              <input
                                type="number"
                                min="0"
                                max="20"
                                value={editForm.pair2_score}
                                onChange={(e) => setEditForm({...editForm, pair2_score: e.target.value})}
                                className="w-14 p-2 border border-gray-300 rounded text-center font-semibold"
                                disabled={loading}
                                placeholder="0"
                              />
                            </div>
                            <button
                              onClick={() => handleSaveEdit(result.id)}
                              disabled={loading || !editForm.pair1_score || !editForm.pair2_score}
                              className="bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 disabled:opacity-50 flex items-center"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Save
                            </button>
                            <button
                              onClick={cancelEdit}
                              disabled={loading}
                              className="bg-gray-500 text-white px-3 py-2 rounded text-sm hover:bg-gray-600 disabled:opacity-50 flex items-center"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Cancel
                            </button>
                          </div>
                        ) : (
                          // Display mode
                          <div className="flex items-center space-x-4">
                            <div className="bg-gray-100 px-4 py-2 rounded-lg">
                              <span className="text-lg font-bold text-gray-800">
                                {result.pair1_score} - {result.pair2_score}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              Submitted: {result.created_at ? new Date(result.created_at).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
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
                        className="bg-[#5D1F1F] text-white px-3 py-2 rounded text-sm hover:bg-[#4A1818] disabled:opacity-50 flex items-center"
                        title="Edit this score"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </button>
                    )}
                  </div>
                  
                  {/* Show who submitted this score */}
                  <div className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-100">
                    Result ID: {result.id} | Submitted by: User {result.submitted_by}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No match results found</p>
            <p className="text-xs text-gray-400 mt-1">Total results: {matchResults?.length || 0}</p>
          </div>
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
