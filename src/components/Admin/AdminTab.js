// src/components/Admin/AdminTab.js - COMPLETE FIXED VERSION
import React, { useState } from 'react';
import { Check, Users, ShieldCheck, Trash2 } from 'lucide-react';
import ScoreChallengesSection from './ScoreChallengesSection';
import PlayerMergeModal from './PlayerMergeModal';
import UserRoleModal from '../Modals/UserRoleModal';
import AddToLadderModal from '../Modals/AddToLadderModal';
import DeleteSeasonModal from '../Modals/DeleteSeasonModal';
import DeleteUserModal from '../Modals/DeleteUserModal';

const AdminTab = ({ 
  users, 
  ladderPlayers = [], // NEW: Current season players
  currentUser,
  currentSeason,
  activeSeason, // NEW: Active season for admin controls
  approveUser,
  updateUserRole, // NEW: Function to promote/demote users
  addToLadder, 
  fetchUsers,
  setPlayerAvailability,
  getPlayerAvailability,
  getAvailabilityStats,
  clearOldMatches,
  deleteSeason, // NEW: Function to delete seasons
  deleteUser, // NEW: Function to delete/deactivate users
  matchFixtures,
  matchResults,
  seasonActions,
  // NEW: Season data for DeleteSeasonModal
  selectedSeason,
  seasons
}) => {
  const [loading, setLoading] = useState(false);
  const [showCreateSeason, setShowCreateSeason] = useState(false);
  const [newSeasonName, setNewSeasonName] = useState('');
  const [newSeasonStartDate, setNewSeasonStartDate] = useState('');
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [showUserRoleModal, setShowUserRoleModal] = useState(false);
  const [showAddToLadderModal, setShowAddToLadderModal] = useState(false);
  const [showDeleteSeasonModal, setShowDeleteSeasonModal] = useState(false);
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);

  const handleApproveUser = async (userId) => {
    setLoading(true);
    await approveUser(userId);
    setLoading(false);
  };



  const handleCreateSeason = async () => {
    if (!newSeasonName.trim() || !newSeasonStartDate) {
      alert('Please provide both season name and start date');
      return;
    }
    
    setLoading(true);
    const result = await seasonActions.createNewSeason({
      name: newSeasonName.trim(),
      start_date: newSeasonStartDate,
      carryOverPlayers: false // Start with empty ladder
    });
    
    if (result.success) {
      setShowCreateSeason(false);
      setNewSeasonName('');
      setNewSeasonStartDate('');
      alert(`New season "${newSeasonName}" created successfully!`);
    }
    setLoading(false);
  };

  const handleCompleteSeason = async () => {
    if (!window.confirm(`Are you sure you want to complete the current season "${currentSeason?.name}"? This action cannot be undone.`)) {
      return;
    }
    
    setLoading(true);
    const result = await seasonActions.completeSeason(currentSeason.id);
    if (result.success) {
      alert('Season completed successfully!');
    }
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
      
      {/* Season Management */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Season Management</h3>
        
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-600">
              Current Season: <span className="font-medium">{currentSeason?.name || 'No Active Season'}</span>
            </p>
            {currentSeason && (
              <p className="text-xs text-gray-500">
                Status: {currentSeason.status} • Started: {new Date(currentSeason.start_date).toLocaleDateString()}
                {currentSeason.end_date && ` • Ended: ${new Date(currentSeason.end_date).toLocaleDateString()}`}
              </p>
            )}
          </div>
          
          <div className="flex space-x-2">
            {currentSeason?.status === 'active' && (
              <button
                onClick={handleCompleteSeason}
                disabled={loading}
                className="bg-orange-600 text-white px-3 py-2 rounded-md hover:bg-orange-700 disabled:opacity-50 transition-colors text-sm"
              >
                Complete Season
              </button>
            )}
            <button
              onClick={() => setShowCreateSeason(true)}
              disabled={loading || (activeSeason && activeSeason.status === 'active')}
              className="bg-[#5D1F1F] text-white px-3 py-2 rounded-md hover:bg-[#4A1818] disabled:opacity-50 transition-colors text-sm"
              title={activeSeason?.status === 'active' ? 'Complete the current season before creating a new one' : ''}
            >
              Create New Season
            </button>
          </div>
        </div>
        
        {showCreateSeason && (
          <div className="border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Season Name
                </label>
                <input
                  type="text"
                  value={newSeasonName}
                  onChange={(e) => setNewSeasonName(e.target.value)}
                  placeholder="e.g., Spring 2025"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5D1F1F] focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={newSeasonStartDate}
                  onChange={(e) => setNewSeasonStartDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5D1F1F] focus:border-transparent"
                />
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={handleCreateSeason}
                  disabled={loading || !newSeasonName.trim() || !newSeasonStartDate}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowCreateSeason(false);
                    setNewSeasonName('');
                    setNewSeasonStartDate('');
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Score Challenges and Conflicts Management - THE MAIN NEW FEATURE */}
      <ScoreChallengesSection 
        currentUser={currentUser}
        currentSeason={currentSeason}
        onDataRefresh={() => {
          // Refresh ALL parent data when scores are updated
          console.log('🔄 Admin score updated, refreshing all data...');
          if (fetchUsers) fetchUsers();
          // We need to call the parent's fetchMatchResults function too
          window.dispatchEvent(new CustomEvent('refreshMatchData'));
        }}
      />
      
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

      {/* Admin Tools */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Admin Tools</h3>
        <p className="text-sm text-gray-600 mb-6">Quick access to administrative functions</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* User Role Management */}
          <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center space-x-3 mb-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">User Roles</h4>
                <p className="text-xs text-gray-500">Promote/demote admins</p>
              </div>
            </div>
            <button
              onClick={() => setShowUserRoleModal(true)}
              className="w-full bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              Manage User Roles
            </button>
          </div>

          {/* Add Players to Ladder */}
          <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center space-x-3 mb-3">
              <div className="bg-green-100 p-2 rounded-full">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Add Players</h4>
                <p className="text-xs text-gray-500">Add users to ladder</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddToLadderModal(true)}
              className="w-full bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 transition-colors text-sm"
            >
              Add Players
            </button>
          </div>

          {/* Merge Players */}
          <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center space-x-3 mb-3">
              <div className="bg-purple-100 p-2 rounded-full">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Merge Players</h4>
                <p className="text-xs text-gray-500">Merge duplicate accounts</p>
              </div>
            </div>
            <button
              onClick={() => setShowMergeModal(true)}
              disabled={loading}
              className="w-full bg-purple-600 text-white px-3 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 transition-colors text-sm"
            >
              Merge Players
            </button>
          </div>

          {/* Delete Season */}
          <div className="border border-red-200 rounded-lg p-4 hover:bg-red-50 transition-colors bg-red-50">
            <div className="flex items-center space-x-3 mb-3">
              <div className="bg-red-100 p-2 rounded-full">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h4 className="font-semibold text-red-900">Delete Season</h4>
                <p className="text-xs text-red-600">⚠️ Permanently remove season</p>
              </div>
            </div>
            <button
              onClick={() => setShowDeleteSeasonModal(true)}
              disabled={loading}
              className="w-full bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors text-sm"
            >
              Delete Season
            </button>
          </div>

          {/* Delete User */}
          <div className="border border-orange-200 rounded-lg p-4 hover:bg-orange-50 transition-colors bg-orange-50">
            <div className="flex items-center space-x-3 mb-3">
              <div className="bg-orange-100 p-2 rounded-full">
                <Users className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h4 className="font-semibold text-orange-900">Delete User</h4>
                <p className="text-xs text-orange-600">⚠️ Deactivate user account</p>
              </div>
            </div>
            <button
              onClick={() => setShowDeleteUserModal(true)}
              disabled={loading}
              className="w-full bg-orange-600 text-white px-3 py-2 rounded-md hover:bg-orange-700 disabled:opacity-50 transition-colors text-sm"
            >
              Delete User
            </button>
          </div>
        </div>
      </div>

      {/* Player Availability Management */}
      {currentSeason?.matches && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Set Player Availability</h3>
          <p className="text-sm text-gray-600 mb-4">Set availability on behalf of players</p>
          
          {currentSeason.matches.map((match) => {
            // Use ladderPlayers prop instead of filtering users
            const matchComplete = isMatchComplete(match.id);
            
            return (
              <div key={match.id} className="mb-6 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium mb-3">
                  Week {match.week_number} - {match.match_date ? new Date(match.match_date).toLocaleDateString('en-GB') : 'No date set'}
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

      {/* Availability Overview - FIXED DATE LOGIC */}
      {currentSeason?.matches && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Availability Overview</h3>
          
          <div className="space-y-4">
            {currentSeason.matches.map((match) => {
              const stats = getAvailabilityStats(match.id);
              const matchComplete = isMatchComplete(match.id);
              
              // FIXED: Proper date comparison that treats today as valid
              const today = new Date();
              today.setHours(0, 0, 0, 0); // Reset to start of day
              
              let matchDate, isPast, isToday;
              if (match.match_date) {
                matchDate = new Date(match.match_date);
                matchDate.setHours(0, 0, 0, 0); // Reset to start of day
                isPast = matchDate < today; // Now only truly past dates are considered "past"
                isToday = matchDate.getTime() === today.getTime();
              } else {
                matchDate = null;
                isPast = false;
                isToday = false;
              }
              
              return (
                <div key={match.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium flex items-center space-x-2">
                        <span>Week {match.week_number} - {matchDate ? matchDate.toLocaleDateString('en-GB') : 'No date set'}</span>
                        {isToday && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-normal">
                            📅 Today
                          </span>
                        )}
                      </h4>
                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        <div>Available: <span className="font-medium text-green-600">{stats.available}</span></div>
                        <div>Responded: <span className="font-medium">{stats.responded}/{stats.total}</span></div>
                        <div>Pending: <span className="font-medium text-orange-600">{stats.pending}</span></div>
                      </div>
                    </div>
                    <div className="text-right">
                      {matchComplete ? (
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                          ✅ Match Completed
                        </span>
                      ) : isPast ? (
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                          Match Date Passed
                        </span>
                      ) : stats.available >= 4 ? (
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                          {isToday ? '🎾 Ready to Schedule (Today!)' : 'Ready to Schedule'}
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


      {/* Debug/Maintenance Section */}
      <div className="bg-red-50 border border-red-200 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 text-red-800">⚠️ Admin Maintenance</h3>
        <p className="text-sm text-red-600 mb-4">Use these tools carefully - they will delete data permanently!</p>
        <div className="space-y-2">
          <p className="text-xs text-gray-600">
            This will reset everything except users (profiles). All seasons, matches, results, availability, and ladder data will be permanently deleted.
          </p>
          <button
            onClick={() => {
              if (window.confirm('This will delete ALL seasons, matches, fixtures, results, availability, and ladder data. Only users will be preserved. Are you absolutely sure?')) {
                if (window.confirm('⚠️ FINAL WARNING: This action cannot be undone! Click OK to proceed with complete data reset.')) {
                  clearOldMatches();
                }
              }
            }}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
          >
            🗑️ Clear All Season & Match Data
          </button>
        </div>
      </div>

      {/* Player Merge Modal */}
      <PlayerMergeModal 
        showModal={showMergeModal}
        setShowModal={setShowMergeModal}
        allUsers={users}
        ladderPlayers={ladderPlayers}
        selectedSeason={currentSeason}
        onMergeComplete={() => {
          // Refresh data after merge
          if (fetchUsers) fetchUsers();
        }}
      />

      {/* User Role Management Modal */}
      <UserRoleModal 
        showModal={showUserRoleModal}
        setShowModal={setShowUserRoleModal}
        allUsers={users.filter(u => u.status === 'approved')}
        currentUser={currentUser}
        updateUserRole={updateUserRole}
      />

      {/* Add to Ladder Modal */}
      <AddToLadderModal 
        showModal={showAddToLadderModal}
        setShowModal={setShowAddToLadderModal}
        allUsers={users}
        ladderPlayers={ladderPlayers}
        addToLadder={addToLadder}
      />

      {/* Delete Season Modal */}
      <DeleteSeasonModal 
        showModal={showDeleteSeasonModal}
        setShowModal={setShowDeleteSeasonModal}
        seasons={seasons || []}
        selectedSeason={selectedSeason}
        deleteSeason={deleteSeason}
      />

      {/* Delete User Modal */}
      <DeleteUserModal 
        showModal={showDeleteUserModal}
        setShowModal={setShowDeleteUserModal}
        allUsers={users || []}
        currentUser={currentUser}
        deleteUser={deleteUser}
      />
    </div>
  );
};

export default AdminTab;