// src/components/Admin/AdminTab.js - MODERN REDESIGN
import React, { useState } from 'react';
import { Check, Users, Calendar, Plus, Globe, Trash2, Trophy, UserPlus, Shield } from 'lucide-react';
import { APP_VERSION } from '../../utils/versionManager';
import ScoreChallengesSection from './ScoreChallengesSection';
import PlayerManagementModal from './PlayerManagementModal';
import AddToLadderModal from '../Modals/AddToLadderModal';
import DeleteSeasonModal from '../Modals/DeleteSeasonModal';
import LeagueImportModal from './LeagueImportModal';
import AddExternalPlayerModal from './AddExternalPlayerModal';

const AdminTab = ({
  users,
  ladderPlayers = [],
  currentUser,
  currentSeason,
  activeSeason,
  approveUser,
  updateUserRole,
  addToLadder,
  fetchUsers,
  deleteSeason,
  matchFixtures,
  matchResults,
  seasonActions,
  selectedSeason,
  seasons,
  supabase,
  setShowScheduleModal,
  addMatchToSeason,
  refetch
}) => {
  const [activeTab, setActiveTab] = useState('players'); // 'players', 'seasons', 'matches', 'scores'
  const [loading, setLoading] = useState(false);

  // Season Creation
  const [showCreateSeason, setShowCreateSeason] = useState(false);
  const [newSeasonName, setNewSeasonName] = useState('');
  const [newSeasonStartDate, setNewSeasonStartDate] = useState('');
  const [newSeasonType, setNewSeasonType] = useState('ladder');
  const [newSeasonEloEnabled, setNewSeasonEloEnabled] = useState(false);
  const [newSeasonKFactor, setNewSeasonKFactor] = useState(32);
  const [newSeasonInitialRating, setNewSeasonInitialRating] = useState(1200);

  // Modals
  const [showPlayerManagement, setShowPlayerManagement] = useState(false);
  const [showAddToLadderModal, setShowAddToLadderModal] = useState(false);
  const [showDeleteSeasonModal, setShowDeleteSeasonModal] = useState(false);
  const [showLeagueImporter, setShowLeagueImporter] = useState(false);
  const [showAddExternalPlayer, setShowAddExternalPlayer] = useState(false);

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
      carryOverPlayers: false,
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

  const pendingApprovals = users.filter(u => u.status === 'pending');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-xl p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold mb-2">Admin Dashboard</h2>
            <p className="text-indigo-100">Complete system administration</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
              <span className="text-sm font-mono font-semibold">v{APP_VERSION}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Approvals - Always visible */}
      {pendingApprovals.length > 0 && (
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-yellow-400 p-2 rounded-xl">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Pending Approvals ({pendingApprovals.length})</h3>
          </div>
          <div className="space-y-3">
            {pendingApprovals.map(user => (
              <div key={user.id} className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm">
                <div>
                  <p className="font-semibold text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
                <button
                  onClick={() => handleApproveUser(user.id)}
                  disabled={loading}
                  className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 transition-all shadow-md flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Approve
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="border-b-2 border-gray-200">
          <div className="flex overflow-x-auto">
            <button
              onClick={() => setActiveTab('players')}
              className={`flex-1 min-w-[120px] px-6 py-4 font-bold transition-all relative ${
                activeTab === 'players'
                  ? 'text-indigo-600 bg-indigo-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Users className="w-5 h-5" />
                <span className="hidden sm:inline">Players</span>
              </div>
              {activeTab === 'players' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('seasons')}
              className={`flex-1 min-w-[120px] px-6 py-4 font-bold transition-all relative ${
                activeTab === 'seasons'
                  ? 'text-indigo-600 bg-indigo-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Calendar className="w-5 h-5" />
                <span className="hidden sm:inline">Seasons</span>
              </div>
              {activeTab === 'seasons' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('matches')}
              className={`flex-1 min-w-[120px] px-6 py-4 font-bold transition-all relative ${
                activeTab === 'matches'
                  ? 'text-indigo-600 bg-indigo-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Trophy className="w-5 h-5" />
                <span className="hidden sm:inline">Matches</span>
              </div>
              {activeTab === 'matches' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('scores')}
              className={`flex-1 min-w-[120px] px-6 py-4 font-bold transition-all relative ${
                activeTab === 'scores'
                  ? 'text-indigo-600 bg-indigo-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Check className="w-5 h-5" />
                <span className="hidden sm:inline">Scores</span>
              </div>
              {activeTab === 'scores' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600" />
              )}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* PLAYERS TAB */}
          {activeTab === 'players' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-indigo-200 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Player Management</h3>
                <p className="text-gray-700 mb-4">
                  Comprehensive player administration - edit profiles, manage roles, set ELO ratings, merge accounts, and more.
                </p>
                <button
                  onClick={() => setShowPlayerManagement(true)}
                  className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <Users className="w-5 h-5" />
                  Manage Players
                </button>
              </div>
            </div>
          )}

          {/* SEASONS TAB */}
          {activeTab === 'seasons' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Create Season */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-green-500 p-3 rounded-xl">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">Create Season</h4>
                      <p className="text-sm text-gray-600">Start new ladder or league</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCreateSeason(true)}
                    disabled={loading}
                    className="w-full bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 transition-all shadow-md"
                  >
                    Create New Season
                  </button>
                </div>

                {/* Delete Season */}
                <div className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-red-500 p-3 rounded-xl">
                      <Trash2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">Delete Season</h4>
                      <p className="text-sm text-gray-600">⚠️ Permanently remove</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDeleteSeasonModal(true)}
                    disabled={loading}
                    className="w-full bg-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50 transition-all shadow-md"
                  >
                    Delete Season
                  </button>
                </div>
              </div>

              {/* Complete Active Season */}
              {activeSeason?.status === 'active' && (
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-300 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-orange-500 p-3 rounded-xl">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">Complete Season</h4>
                      <p className="text-sm text-gray-600">End current season: {activeSeason.name}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleCompleteSeason}
                    disabled={loading}
                    className="w-full bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-orange-700 disabled:opacity-50 transition-all shadow-md"
                  >
                    Complete "{activeSeason.name}"
                  </button>
                </div>
              )}
            </div>
          )}

          {/* MATCHES TAB */}
          {activeTab === 'matches' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Add Players to Season */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-green-500 p-3 rounded-xl">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">Add to Season</h4>
                      <p className="text-sm text-gray-600">Add players to ladder</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAddToLadderModal(true)}
                    className="w-full bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-all shadow-md"
                  >
                    Add Players
                  </button>
                </div>

                {/* Add External Player */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-purple-500 p-3 rounded-xl">
                      <UserPlus className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">External Player</h4>
                      <p className="text-sm text-gray-600">Create guest account</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAddExternalPlayer(true)}
                    className="w-full bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-all shadow-md"
                  >
                    Add External Player
                  </button>
                </div>

                {/* Add Ladder Match */}
                {activeSeason?.season_type === 'ladder' && activeSeason?.status === 'active' && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-blue-500 p-3 rounded-xl">
                        <Plus className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-lg">Ladder Match</h4>
                        <p className="text-sm text-gray-600">Schedule new week</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowScheduleModal && setShowScheduleModal(true)}
                      disabled={!setShowScheduleModal}
                      className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md"
                    >
                      Add Match Week
                    </button>
                  </div>
                )}

                {/* League Import */}
                <div className="bg-gradient-to-br from-cyan-50 to-blue-50 border-2 border-cyan-200 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-cyan-500 p-3 rounded-xl">
                      <Globe className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">League Import</h4>
                      <p className="text-sm text-gray-600">Import from URL</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowLeagueImporter(true)}
                    className="w-full bg-cyan-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-cyan-700 transition-all shadow-md"
                  >
                    Import Match
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SCORES TAB */}
          {activeTab === 'scores' && (
            <ScoreChallengesSection
              currentUser={currentUser}
              currentSeason={currentSeason}
              onDataRefresh={() => {
                if (fetchUsers) fetchUsers();
                window.dispatchEvent(new CustomEvent('refreshMatchData'));
              }}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <PlayerManagementModal
        isOpen={showPlayerManagement}
        onClose={() => setShowPlayerManagement(false)}
        allUsers={users}
        currentUser={currentUser}
        activeSeason={activeSeason}
        onDataRefresh={async () => {
          await fetchUsers();
          if (refetch?.seasonPlayers) {
            await refetch.seasonPlayers();
          }
        }}
      />

      <AddToLadderModal
        showModal={showAddToLadderModal}
        setShowModal={setShowAddToLadderModal}
        allUsers={users}
        ladderPlayers={ladderPlayers}
        addToLadder={addToLadder}
      />

      <DeleteSeasonModal
        showModal={showDeleteSeasonModal}
        setShowModal={setShowDeleteSeasonModal}
        seasons={seasons || []}
        selectedSeason={selectedSeason}
        deleteSeason={deleteSeason}
      />

      <LeagueImportModal
        isOpen={showLeagueImporter}
        onClose={() => setShowLeagueImporter(false)}
        supabase={supabase}
        selectedSeason={selectedSeason}
      />

      <AddExternalPlayerModal
        isOpen={showAddExternalPlayer}
        onClose={() => setShowAddExternalPlayer(false)}
        supabase={supabase}
        onPlayerAdded={() => {
          if (fetchUsers) fetchUsers();
        }}
      />

      {/* Create Season Modal */}
      {showCreateSeason && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white rounded-t-2xl">
              <h3 className="text-2xl font-bold">Create New Season</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Season Type</label>
                <select
                  value={newSeasonType}
                  onChange={(e) => setNewSeasonType(e.target.value)}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="ladder">Ladder (Internal Competition)</option>
                  <option value="league">League (External Matches)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Season Name</label>
                <input
                  type="text"
                  value={newSeasonName}
                  onChange={(e) => setNewSeasonName(e.target.value)}
                  placeholder={newSeasonType === 'ladder' ? 'e.g., Spring Ladder 2025' : 'e.g., Winter League 2025'}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={newSeasonStartDate}
                  onChange={(e) => setNewSeasonStartDate(e.target.value)}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {newSeasonType === 'ladder' && (
                <div className="border-t-2 border-gray-200 pt-4 space-y-4">
                  <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
                    <h4 className="text-sm font-bold text-yellow-800 mb-2">ELO Rating System</h4>
                    <p className="text-sm text-yellow-700">
                      Enable for skill-based rankings instead of simple win percentage
                    </p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="eloEnabled"
                      checked={newSeasonEloEnabled}
                      onChange={(e) => setNewSeasonEloEnabled(e.target.checked)}
                      className="w-5 h-5 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                    />
                    <label htmlFor="eloEnabled" className="text-sm font-semibold text-gray-700">
                      Enable ELO rating system
                    </label>
                  </div>

                  {newSeasonEloEnabled && (
                    <div className="grid grid-cols-2 gap-4 pl-2">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">K-Factor</label>
                        <select
                          value={newSeasonKFactor}
                          onChange={(e) => setNewSeasonKFactor(parseInt(e.target.value))}
                          className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        >
                          <option value={16}>16 (Stable)</option>
                          <option value={32}>32 (Standard)</option>
                          <option value={48}>48 (Volatile)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Initial Rating</label>
                        <input
                          type="number"
                          min="800"
                          max="1600"
                          step="50"
                          value={newSeasonInitialRating}
                          onChange={(e) => setNewSeasonInitialRating(parseInt(e.target.value) || 1200)}
                          className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t-2 border-gray-200 bg-gray-50 rounded-b-2xl flex gap-3">
              <button
                onClick={handleCreateSeason}
                disabled={loading || !newSeasonName.trim() || !newSeasonStartDate}
                className="flex-1 bg-green-600 text-white py-3 px-4 rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold shadow-md"
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
                className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-xl hover:bg-gray-300 disabled:opacity-50 transition-all font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTab;
