// src/components/Modals/AddToLadderModal.js
import React, { useState } from 'react';
import { Users, Trophy } from 'lucide-react';

const AddToLadderModal = ({ 
  showModal, 
  setShowModal, 
  allUsers,
  ladderPlayers,
  addToLadder
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [adding, setAdding] = useState(null);

  if (!showModal) return null;

  // Filter users to only show approved users not already in the ladder
  const availableUsers = allUsers.filter(u => 
    u.status === 'approved' && 
    !ladderPlayers.some(lp => lp.id === u.id) &&
    (u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     u.email?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const maxRank = ladderPlayers.length + 1;

  const handleAddToLadder = async (userId, userName) => {
    const selectedRank = document.getElementById(`rank-${userId}`).value;
    
    if (!selectedRank) {
      alert('Please select a rank for the player.');
      return;
    }

    setAdding(userId);
    try {
      const result = await addToLadder(userId, selectedRank);
      if (result?.success) {
        // Success feedback is handled by the parent component
        // Note: Don't try to reset the form as the user will be filtered out of the list
        // Player successfully added to ladder
      } else {
        alert('Failed to add player to ladder. Please try again.');
      }
    } catch (error) {
      console.error('Error adding to ladder:', error);
      alert('Error adding player to ladder: ' + error.message);
    } finally {
      setAdding(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-gray-900">Add Players to Ladder</h3>
            <button
              onClick={() => setShowModal(false)}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Add approved users to the current season's ladder with their starting rank
          </p>
        </div>

        <div className="p-6">
          {/* Search Bar */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search players by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5D1F1F] focus:border-transparent"
            />
          </div>

          {/* Available Players List */}
          <div className="overflow-y-auto max-h-96">
            {availableUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No players found matching your search.' : 'No approved players waiting to join ladder.'}
              </div>
            ) : (
              <div className="space-y-3">
                {availableUsers.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <Users className="h-6 w-6 text-gray-400" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        <div className="text-xs text-gray-400">
                          Status: <span className="text-green-600 font-semibold">Approved</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <Trophy className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium text-gray-700">Rank:</span>
                        <select 
                          id={`rank-${user.id}`}
                          defaultValue={maxRank}
                          className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-[#5D1F1F] focus:border-transparent"
                        >
                          {Array.from({ length: maxRank }, (_, i) => (
                            <option key={i + 1} value={i + 1}>{i + 1}</option>
                          ))}
                        </select>
                      </div>
                      
                      <button
                        onClick={() => handleAddToLadder(user.id, user.name)}
                        disabled={adding === user.id}
                        className="px-4 py-2 bg-[#5D1F1F] text-white text-sm rounded-md hover:bg-[#4A1818] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {adding === user.id ? 'Adding...' : 'Add to Ladder'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Current Ladder Info */}
          {ladderPlayers.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-800 mb-2">Current Ladder Status:</h4>
              <p className="text-sm text-blue-700">
                {ladderPlayers.length} players currently on the ladder. 
                New players will be added at rank {maxRank} by default, but you can choose any rank.
              </p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => setShowModal(false)}
            className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddToLadderModal;