// src/components/Admin/AdminTab.js - COMPLETE FIXED VERSION
import React, { useState } from 'react';
import { Check, Users, ShieldCheck, Trash2, Calendar, Plus, Globe } from 'lucide-react';
import { APP_VERSION } from '../../utils/versionManager';
import ScoreChallengesSection from './ScoreChallengesSection';
import PlayerMergeModal from './PlayerMergeModal';
import UserRoleModal from '../Modals/UserRoleModal';
import AddToLadderModal from '../Modals/AddToLadderModal';
import DeleteSeasonModal from '../Modals/DeleteSeasonModal';
import DeleteUserModal from '../Modals/DeleteUserModal';
import LeagueImportModal from './LeagueImportModal';
import SinglesImportModal from './SinglesImportModal';
import AddExternalPlayerModal from './AddExternalPlayerModal';
import EloSeedingModal from './EloSeedingModal';

const AdminTab = ({
  users,
  ladderPlayers = [], // Current season players
  currentUser,
  currentSeason,
  activeSeason, // Active season for admin controls
  approveUser,
  updateUserRole, // Function to promote/demote users
  addToLadder,
  fetchUsers,
  deleteSeason, // Function to delete seasons
  deleteUser, // Function to delete/deactivate users
  matchFixtures,
  matchResults,
  seasonActions,
  // Season data for DeleteSeasonModal
  selectedSeason,
  seasons,
  // Supabase instance for LeagueImportModal
  supabase,
  // Match management functions
  setShowScheduleModal,
  addMatchToSeason,
  // Refetch functions for data refresh
  refetch
}) => {
  const [loading, setLoading] = useState(false);
  const [showCreateSeason, setShowCreateSeason] = useState(false);
  const [newSeasonName, setNewSeasonName] = useState('');
  const [newSeasonStartDate, setNewSeasonStartDate] = useState('');
  const [newSeasonType, setNewSeasonType] = useState('ladder');
  const [newSeasonEloEnabled, setNewSeasonEloEnabled] = useState(false);
  const [newSeasonKFactor, setNewSeasonKFactor] = useState(32);
  const [newSeasonInitialRating, setNewSeasonInitialRating] = useState(1200);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [showUserRoleModal, setShowUserRoleModal] = useState(false);
  const [showAddToLadderModal, setShowAddToLadderModal] = useState(false);
  const [showDeleteSeasonModal, setShowDeleteSeasonModal] = useState(false);
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
  const [showLeagueImporter, setShowLeagueImporter] = useState(false);
  const [showSinglesImporter, setShowSinglesImporter] = useState(false);
  const [showAddExternalPlayer, setShowAddExternalPlayer] = useState(false);
  const [showEloSeeding, setShowEloSeeding] = useState(false);

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
      season_type: newSeasonType,
      carryOverPlayers: false, // Start with empty ladder/league
      elo_enabled: newSeasonEloEnabled && newSeasonType === 'ladder',
      elo_k_factor: newSeasonKFactor,
      elo_initial_rating: newSeasonInitialRating
    });
    
    if (result.success) {
      setShowCreateSeason(false);
      setNewSeasonName('');
      setNewSeasonStartDate('');
      setNewSeasonType('ladder');
      setNewSeasonEloEnabled(false);
      setNewSeasonKFactor(32);
      setNewSeasonInitialRating(1200);
      alert(`New ${newSeasonType} season "${newSeasonName}" created successfully!`);
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
        <div className="flex items-center gap-3">
          <div className="bg-gray-100 px-3 py-1 rounded-full">
            <span className="text-sm font-mono text-gray-600">v{APP_VERSION}</span>
          </div>
        </div>
      </div>
      
      {/* Score Challenges and Conflicts Management - THE MAIN NEW FEATURE */}
      <ScoreChallengesSection 
        currentUser={currentUser}
        currentSeason={currentSeason}
        onDataRefresh={() => {
          // Refresh ALL parent data when scores are updated
          // Trigger data refresh after admin score updates
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
                  className="bg-[#5D1F1F] text-white px-4 py-3 rounded text-sm hover:bg-[#4A1818] disabled:opacity-50 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  style={{ touchAction: 'manipulation' }}
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
          {/* Create New Season */}
          <div className="border border-green-200 rounded-lg p-4 hover:bg-green-50 transition-colors">
            <div className="flex items-center space-x-3 mb-3">
              <div className="bg-green-100 p-2 rounded-full">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Create Season</h4>
                <p className="text-xs text-gray-500">Start new ladder/league season</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateSeason(true)}
              disabled={loading}
              className="w-full bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors text-sm"
            >
              Create New Season
            </button>
          </div>

          {/* Complete Season */}
          {activeSeason?.status === 'active' && (
            <div className="border border-orange-200 rounded-lg p-4 hover:bg-orange-50 transition-colors bg-orange-50">
              <div className="flex items-center space-x-3 mb-3">
                <div className="bg-orange-100 p-2 rounded-full">
                  <Calendar className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Complete Season</h4>
                  <p className="text-xs text-gray-500">End: {activeSeason.name}</p>
                </div>
              </div>
              <button
                onClick={handleCompleteSeason}
                disabled={loading}
                className="w-full bg-orange-600 text-white px-3 py-2 rounded-md hover:bg-orange-700 disabled:opacity-50 transition-colors text-sm"
              >
                Complete Season
              </button>
            </div>
          )}

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

          {/* ELO Rating Management - Only show for active ladder seasons with ELO enabled */}
          {activeSeason?.season_type === 'ladder' && activeSeason?.elo_enabled && (
            <div className="border border-yellow-200 rounded-lg p-4 hover:bg-yellow-50 transition-colors">
              <div className="flex items-center space-x-3 mb-3">
                <div className="bg-yellow-100 p-2 rounded-full">
                  <Check className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">ELO Ratings</h4>
                  <p className="text-xs text-gray-500">Seed and manage ELO ratings</p>
                </div>
              </div>
              <button
                onClick={() => setShowEloSeeding(true)}
                className="w-full bg-yellow-600 text-white px-3 py-2 rounded-md hover:bg-yellow-700 transition-colors text-sm"
              >
                Manage ELO Ratings
              </button>
            </div>
          )}

          {/* Add External Player */}
          <div className="border border-purple-200 rounded-lg p-4 hover:bg-purple-50 transition-colors">
            <div className="flex items-center space-x-3 mb-3">
              <div className="bg-purple-100 p-2 rounded-full">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">External Player</h4>
                <p className="text-xs text-gray-500">Create skeleton user for results</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddExternalPlayer(true)}
              className="w-full bg-purple-600 text-white px-3 py-2 rounded-md hover:bg-purple-700 transition-colors text-sm"
            >
              Add External Player
            </button>
          </div>

          {/* Add Ladder Match - Only show for active ladder seasons */}
          {activeSeason?.season_type === 'ladder' && activeSeason?.status === 'active' && (
            <div className="border border-purple-200 rounded-lg p-4 hover:bg-purple-50 transition-colors">
              <div className="flex items-center space-x-3 mb-3">
                <div className="bg-purple-100 p-2 rounded-full">
                  <Plus className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Add Ladder Match</h4>
                  <p className="text-xs text-gray-500">Schedule new match week</p>
                </div>
              </div>
              <button
                onClick={() => setShowScheduleModal && setShowScheduleModal(true)}
                disabled={!setShowScheduleModal}
                className="w-full bg-purple-600 text-white px-3 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 transition-colors text-sm"
              >
                Add Match
              </button>
            </div>
          )}

          {/* League Import */}
          <div className="border border-blue-200 rounded-lg p-4 hover:bg-blue-50 transition-colors">
            <div className="flex items-center space-x-3 mb-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <Globe className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">League Import</h4>
                <p className="text-xs text-gray-500">Import match from URL</p>
              </div>
            </div>
            <button
              onClick={() => setShowLeagueImporter(true)}
              className="w-full bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              Import Match
            </button>
          </div>

          {/* Singles Import */}
          <div className="border border-orange-200 rounded-lg p-4 hover:bg-orange-50 transition-colors">
            <div className="flex items-center space-x-3 mb-3">
              <div className="bg-orange-100 p-2 rounded-full">
                <Users className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Singles Import</h4>
                <p className="text-xs text-gray-500">Import completed singles match</p>
              </div>
            </div>
            <button
              onClick={() => setShowSinglesImporter(true)}
              className="w-full bg-orange-600 text-white px-3 py-2 rounded-md hover:bg-orange-700 transition-colors text-sm"
            >
              Import Singles Match
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

      {/* Player Merge Modal */
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

      {/* Create Season Modal */}
      {showCreateSeason && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Create New Season</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Season Type
                  </label>
                  <select
                    value={newSeasonType}
                    onChange={(e) => setNewSeasonType(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5D1F1F] focus:border-transparent"
                  >
                    <option value="ladder">Ladder (Internal Competition)</option>
                    <option value="league">League (External Matches)</option>
                    <option value="singles_championship">Singles Championship (Stats Tracking)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Season Name
                  </label>
                  <input
                    type="text"
                    value={newSeasonName}
                    onChange={(e) => setNewSeasonName(e.target.value)}
                    placeholder={newSeasonType === 'ladder' ? 'e.g., Spring Ladder 2025' : 'e.g., Winter League 2025'}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5D1F1F] focus:border-transparent"
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
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5D1F1F] focus:border-transparent"
                  />
                </div>

                {/* ELO Rating Configuration - Only for Ladder Seasons */}
                {newSeasonType === 'ladder' && (
                  <div className="border-t pt-4 space-y-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                      <h4 className="text-sm font-medium text-yellow-800 mb-2">ELO Rating System</h4>
                      <p className="text-sm text-yellow-700">
                        Enable ELO ratings for skill-based rankings instead of simple win percentage
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="eloEnabled"
                        checked={newSeasonEloEnabled}
                        onChange={(e) => setNewSeasonEloEnabled(e.target.checked)}
                        className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                      />
                      <label htmlFor="eloEnabled" className="text-sm font-medium text-gray-700">
                        Enable ELO rating system for this season
                      </label>
                    </div>
                    
                    {newSeasonEloEnabled && (
                      <div className="grid grid-cols-2 gap-4 pl-7">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            K-Factor
                          </label>
                          <select
                            value={newSeasonKFactor}
                            onChange={(e) => setNewSeasonKFactor(parseInt(e.target.value))}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                          >
                            <option value={16}>16 (Stable)</option>
                            <option value={32}>32 (Standard)</option>
                            <option value={48}>48 (Volatile)</option>
                          </select>
                          <p className="text-xs text-gray-500 mt-1">Higher = more rating change per match</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Initial Rating
                          </label>
                          <input
                            type="number"
                            min="800"
                            max="1600"
                            step="50"
                            value={newSeasonInitialRating}
                            onChange={(e) => setNewSeasonInitialRating(parseInt(e.target.value) || 1200)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                          />
                          <p className="text-xs text-gray-500 mt-1">Starting rating for new players</p>
                        </div>
                      </div>
                    )}
                    
                    {!newSeasonEloEnabled && (
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                        <p className="text-sm text-blue-700">
                          <strong>Ladder Season:</strong> For internal club competitions with ranking system
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {newSeasonType === 'league' && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-md p-3">
                    <p className="text-sm text-emerald-700">
                      <strong>League Season:</strong> For matches against external clubs
                    </p>
                  </div>
                )}

                {newSeasonType === 'singles_championship' && (
                  <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
                    <p className="text-sm text-orange-700">
                      <strong>Singles Championship:</strong> For tracking singles match stats (no availability/scheduling)
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex space-x-3">
                <button
                  onClick={handleCreateSeason}
                  disabled={loading || !newSeasonName.trim() || !newSeasonStartDate}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Create Season
                </button>
                <button
                  onClick={() => {
                    setShowCreateSeason(false);
                    setNewSeasonName('');
                    setNewSeasonStartDate('');
                    setNewSeasonType('ladder');
                    setNewSeasonEloEnabled(false);
                    setNewSeasonKFactor(32);
                    setNewSeasonInitialRating(1200);
                  }}
                  disabled={loading}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* League Import Modal */}
      <LeagueImportModal 
        isOpen={showLeagueImporter}
        onClose={() => setShowLeagueImporter(false)}
        supabase={supabase}
        selectedSeason={selectedSeason}
      />

      {/* Singles Import Modal */}
      <SinglesImportModal 
        isOpen={showSinglesImporter}
        onClose={() => setShowSinglesImporter(false)}
        supabase={supabase}
        seasons={seasons}
        currentUser={currentUser}
      />

      {/* Add External Player Modal */}
      <AddExternalPlayerModal 
        isOpen={showAddExternalPlayer}
        onClose={() => setShowAddExternalPlayer(false)}
        supabase={supabase}
        onPlayerAdded={(player) => {
          // Refresh users list if callback is available
          if (fetchUsers) fetchUsers();
        }}
      />

      {/* ELO Seeding Modal */}
      <EloSeedingModal 
        isOpen={showEloSeeding}
        onClose={() => setShowEloSeeding(false)}
        season={activeSeason}
        onSuccess={(message) => {
          alert(message);
          // Refresh season players data to update ELO ratings in ladder
          if (refetch?.seasonPlayers) refetch.seasonPlayers();
          // Also refresh users list if callback is available
          if (fetchUsers) fetchUsers();
        }}
      />

    </div>
  );
};

export default AdminTab;