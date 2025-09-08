// External Player Management Component
// This component allows admins to manage external players (opposition clubs)

import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Users, Trophy, X } from 'lucide-react';
import { 
  getExternalPlayers, 
  getExternalClubs, 
  createExternalPlayer, 
  updateExternalPlayer, 
  deleteExternalPlayer,
  getExternalPlayerStats 
} from '../../utils/externalPlayerManager';

const ExternalPlayerManager = ({ isOpen, onClose }) => {
  const [players, setPlayers] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClub, setSelectedClub] = useState('');
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);

  // New player form
  const [newPlayer, setNewPlayer] = useState({
    name: '',
    club_name: ''
  });

  // Load players and clubs
  const loadData = async () => {
    setLoading(true);
    try {
      const [playersResult, clubsResult] = await Promise.all([
        getExternalPlayers(selectedClub || null),
        getExternalClubs()
      ]);
      
      if (playersResult.success) {
        setPlayers(playersResult.data);
      }
      
      if (clubsResult.success) {
        setClubs(clubsResult.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load data when component opens or filters change
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, selectedClub]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setSelectedClub('');
      setShowAddPlayer(false);
      setEditingPlayer(null);
      setNewPlayer({ name: '', club_name: '' });
    }
  }, [isOpen]);

  // Handle add player
  const handleAddPlayer = async (e) => {
    e.preventDefault();
    if (!newPlayer.name.trim() || !newPlayer.club_name.trim()) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const result = await createExternalPlayer(newPlayer);
      if (result.success) {
        setNewPlayer({ name: '', club_name: '' });
        setShowAddPlayer(false);
        loadData();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit player
  const handleEditPlayer = async (e) => {
    e.preventDefault();
    if (!editingPlayer.name.trim() || !editingPlayer.club_name.trim()) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const result = await updateExternalPlayer(editingPlayer.id, {
        name: editingPlayer.name,
        club_name: editingPlayer.club_name
      });
      if (result.success) {
        setEditingPlayer(null);
        loadData();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete player
  const handleDeletePlayer = async (player) => {
    if (!window.confirm(`Are you sure you want to delete ${player.name}? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    try {
      const result = await deleteExternalPlayer(player.id);
      if (result.success) {
        loadData();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Filter players based on search
  const filteredPlayers = players.filter(player => 
    player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.club_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <Users className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">External Player Management</h2>
              <p className="text-sm text-gray-600">Manage players from opposition clubs</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Filters and Actions */}
        <div className="p-6 border-b bg-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search players..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Club Filter */}
              <select
                value={selectedClub}
                onChange={(e) => setSelectedClub(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Clubs</option>
                {clubs.map(club => (
                  <option key={club} value={club}>{club}</option>
                ))}
              </select>
            </div>

            {/* Add Player Button */}
            <button
              onClick={() => setShowAddPlayer(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Player</span>
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Add Player Form */}
          {showAddPlayer && (
            <div className="p-6 border-b bg-blue-50">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Player</h3>
              <form onSubmit={handleAddPlayer} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Player Name
                  </label>
                  <input
                    type="text"
                    value={newPlayer.name}
                    onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter player name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Club Name
                  </label>
                  <input
                    type="text"
                    value={newPlayer.club_name}
                    onChange={(e) => setNewPlayer({ ...newPlayer, club_name: e.target.value })}
                    list="clubs-list"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter club name"
                    required
                  />
                  <datalist id="clubs-list">
                    {clubs.map(club => (
                      <option key={club} value={club} />
                    ))}
                  </datalist>
                </div>

                <div className="flex space-x-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddPlayer(false);
                      setNewPlayer({ name: '', club_name: '' });
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Players List */}
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-3 text-gray-600">Loading players...</span>
              </div>
            ) : filteredPlayers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No players found</h3>
                <p className="text-gray-600">
                  {searchTerm || selectedClub ? 'Try adjusting your filters' : 'Add some external players to get started'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPlayers.map(player => (
                  <div key={player.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                    {editingPlayer?.id === player.id ? (
                      // Edit Form
                      <form onSubmit={handleEditPlayer} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Player Name
                          </label>
                          <input
                            type="text"
                            value={editingPlayer.name}
                            onChange={(e) => setEditingPlayer({ ...editingPlayer, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Club Name
                          </label>
                          <input
                            type="text"
                            value={editingPlayer.club_name}
                            onChange={(e) => setEditingPlayer({ ...editingPlayer, club_name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>

                        <div className="col-span-2 flex space-x-2">
                          <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingPlayer(null)}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      // Display View
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h4 className="font-medium text-gray-900">{player.name}</h4>
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                              {player.club_name}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                            <span className="flex items-center space-x-1">
                              <Trophy className="w-3 h-3" />
                              <span>{player.total_rubbers_played} rubbers</span>
                            </span>
                            <span>{player.total_games_won} wins</span>
                            <span>{player.total_games_lost} losses</span>
                            {(player.total_games_won + player.total_games_lost) > 0 && (
                              <span className="font-medium">
                                {(player.total_games_won / (player.total_games_won + player.total_games_lost) * 100).toFixed(1)}% win rate
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => setEditingPlayer(player)}
                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Edit player"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePlayer(player)}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete player"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Total: {filteredPlayers.length} players{selectedClub && ` from ${selectedClub}`}</span>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExternalPlayerManager;