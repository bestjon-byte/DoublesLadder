// src/components/Admin/PlayerManagementModal.js
// Unified Player Management - One modal for all player admin tasks
import React, { useState, useEffect, useCallback } from 'react';
import { X, Search, User, Mail, Shield, AlertTriangle, Trash2, Users, ArrowRight, Save, CheckCircle, Trophy, Edit3, DollarSign } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useAppToast } from '../../contexts/ToastContext';
import { getEloRankLabel, getEloRankColor } from '../../utils/eloCalculator';

const PlayerManagementModal = ({
  isOpen,
  onClose,
  allUsers,
  currentUser,
  activeSeason,
  onDataRefresh
}) => {
  const toast = useAppToast();

  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'merge', 'delete'

  // Profile Edit State
  const [editedName, setEditedName] = useState('');
  const [editedEmail, setEditedEmail] = useState('');
  const [editedRole, setEditedRole] = useState('player');
  const [editedStatus, setEditedStatus] = useState('approved');

  // ELO State
  const [editedElo, setEditedElo] = useState(null);
  const [playerSeasonData, setPlayerSeasonData] = useState(null);

  // Merge State
  const [mergeTargetId, setMergeTargetId] = useState('');
  const [mergeSearchTerm, setMergeSearchTerm] = useState('');

  // Delete State
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Player Stats State
  const [playerStats, setPlayerStats] = useState(null);

  // Load player data when selected
  useEffect(() => {
    if (selectedPlayer) {
      setEditedName(selectedPlayer.name || '');
      setEditedEmail(selectedPlayer.email || '');
      setEditedRole(selectedPlayer.role || 'player');
      setEditedStatus(selectedPlayer.status || 'approved');
      fetchPlayerStats(selectedPlayer.id);
      if (activeSeason?.elo_enabled) {
        fetchPlayerElo(selectedPlayer.id);
      }
    } else {
      resetPlayerData();
    }
  }, [selectedPlayer, activeSeason]);

  const resetPlayerData = () => {
    setEditedName('');
    setEditedEmail('');
    setEditedRole('player');
    setEditedStatus('approved');
    setEditedElo(null);
    setPlayerSeasonData(null);
    setPlayerStats(null);
    setMergeTargetId('');
    setMergeSearchTerm('');
    setDeleteConfirmText('');
    setActiveTab('profile');
  };

  const fetchPlayerStats = async (playerId) => {
    try {
      // Get season stats
      const { data: seasonStats } = await supabase
        .from('season_players')
        .select(`
          games_played,
          games_won,
          matches_played,
          matches_won,
          elo_rating,
          season_id,
          seasons!inner(name, season_type)
        `)
        .eq('player_id', playerId)
        .order('created_at', { ascending: false });

      // Get coaching attendance count
      const { count: coachingCount } = await supabase
        .from('coaching_attendance')
        .select('id', { count: 'exact' })
        .eq('player_id', playerId);

      // Get unpaid coaching sessions
      const { data: unpaidSessions } = await supabase
        .from('coaching_attendance')
        .select('id, session_id, payment_status')
        .eq('player_id', playerId)
        .eq('payment_status', 'unpaid');

      setPlayerStats({
        seasonStats: seasonStats || [],
        coachingCount: coachingCount || 0,
        unpaidCount: unpaidSessions?.length || 0
      });
    } catch (error) {
      console.error('Error fetching player stats:', error);
    }
  };

  const fetchPlayerElo = async (playerId) => {
    if (!activeSeason?.id) return;

    try {
      const { data, error } = await supabase
        .from('season_players')
        .select('id, elo_rating, matches_played, matches_won')
        .eq('season_id', activeSeason.id)
        .eq('player_id', playerId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPlayerSeasonData(data);
        setEditedElo(data.elo_rating || activeSeason.elo_initial_rating || 1200);
      }
    } catch (error) {
      console.error('Error fetching player ELO:', error);
    }
  };

  // Filter players based on search
  const filteredPlayers = allUsers?.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower)
    );
  }).sort((a, b) => a.name?.localeCompare(b.name)) || [];

  // Filter merge targets
  const mergeTargets = allUsers?.filter(user => {
    if (!selectedPlayer || user.id === selectedPlayer.id) return false;
    const searchLower = mergeSearchTerm.toLowerCase();
    return (
      user.name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower)
    );
  }).sort((a, b) => a.name?.localeCompare(b.name)) || [];

  const handleClose = () => {
    setSelectedPlayer(null);
    setSearchTerm('');
    resetPlayerData();
    onClose();
  };

  const handleSaveProfile = async () => {
    if (!selectedPlayer) return;

    // Validation
    if (!editedName.trim()) {
      toast.error('Name is required');
      return;
    }

    if (!editedEmail.trim() || !isValidEmail(editedEmail)) {
      toast.error('Valid email is required');
      return;
    }

    // Prevent self-demotion
    if (selectedPlayer.id === currentUser?.id && editedRole !== 'admin') {
      toast.error('You cannot remove your own admin privileges');
      return;
    }

    setLoading(true);
    try {
      // Check if email already exists (if changed)
      if (editedEmail !== selectedPlayer.email) {
        const { data: existing } = await supabase
          .from('profiles')
          .select('id, name')
          .eq('email', editedEmail.trim())
          .neq('id', selectedPlayer.id);

        if (existing && existing.length > 0) {
          toast.error(`Email already in use by ${existing[0].name}`);
          setLoading(false);
          return;
        }
      }

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({
          name: editedName.trim(),
          email: editedEmail.trim(),
          role: editedRole,
          status: editedStatus
        })
        .eq('id', selectedPlayer.id);

      if (error) throw error;

      toast.success(`Profile updated for ${editedName}`);

      // Refresh and update local state
      if (onDataRefresh) onDataRefresh();
      setSelectedPlayer({ ...selectedPlayer, name: editedName, email: editedEmail, role: editedRole, status: editedStatus });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveElo = async () => {
    if (!selectedPlayer || !playerSeasonData || !editedElo) return;

    const rating = Math.max(500, Math.min(3000, parseInt(editedElo) || 1200));

    setLoading(true);
    try {
      // Update season_players for current season
      const { error } = await supabase
        .from('season_players')
        .update({ elo_rating: rating })
        .eq('id', playerSeasonData.id);

      if (error) throw error;

      // Also update profiles table (global/permanent ELO)
      await supabase
        .from('profiles')
        .update({ elo_rating: rating })
        .eq('id', selectedPlayer.id);

      toast.success(`ELO rating updated to ${rating}`);
      setPlayerSeasonData({ ...playerSeasonData, elo_rating: rating });
      if (onDataRefresh) onDataRefresh();
    } catch (error) {
      console.error('Error updating ELO:', error);
      toast.error('Failed to update ELO rating');
    } finally {
      setLoading(false);
    }
  };

  const handleMerge = async () => {
    if (!selectedPlayer || !mergeTargetId) {
      toast.error('Please select a target player to merge into');
      return;
    }

    const targetPlayer = allUsers.find(u => u.id === mergeTargetId);
    if (!targetPlayer) return;

    if (!window.confirm(
      `⚠️ MERGE PLAYERS\n\n` +
      `This will merge ALL data from:\n` +
      `  ${selectedPlayer.name} (${selectedPlayer.email})\n\n` +
      `INTO:\n` +
      `  ${targetPlayer.name} (${targetPlayer.email})\n\n` +
      `This includes:\n` +
      `• All match history and results\n` +
      `• Season statistics\n` +
      `• Coaching attendance and payments\n` +
      `• Availability records\n\n` +
      `The source account will be deleted.\n` +
      `This CANNOT be undone!\n\n` +
      `Continue?`
    )) return;

    setLoading(true);
    try {
      // Step 1: Merge season_players records
      const { data: sourceSeasons } = await supabase
        .from('season_players')
        .select('*')
        .eq('player_id', selectedPlayer.id);

      const { data: targetSeasons } = await supabase
        .from('season_players')
        .select('*')
        .eq('player_id', mergeTargetId);

      for (const sourceSeason of (sourceSeasons || [])) {
        const existingTarget = targetSeasons?.find(t => t.season_id === sourceSeason.season_id);

        if (existingTarget) {
          // Combine stats
          await supabase
            .from('season_players')
            .update({
              games_played: (existingTarget.games_played || 0) + (sourceSeason.games_played || 0),
              games_won: (existingTarget.games_won || 0) + (sourceSeason.games_won || 0),
              matches_played: (existingTarget.matches_played || 0) + (sourceSeason.matches_played || 0),
              matches_won: (existingTarget.matches_won || 0) + (sourceSeason.matches_won || 0)
            })
            .eq('id', existingTarget.id);

          await supabase.from('season_players').delete().eq('id', sourceSeason.id);
        } else {
          // Transfer record
          await supabase
            .from('season_players')
            .update({ player_id: mergeTargetId })
            .eq('id', sourceSeason.id);
        }
      }

      // Step 2: Update all match fixtures
      const fixtureFields = [
        'player1_id', 'player2_id', 'player3_id', 'player4_id',
        'pair1_player1_id', 'pair1_player2_id', 'pair2_player1_id', 'pair2_player2_id',
        'sitting_player_id'
      ];

      for (const field of fixtureFields) {
        await supabase
          .from('match_fixtures')
          .update({ [field]: mergeTargetId })
          .eq(field, selectedPlayer.id);
      }

      // Step 3: Update match results
      await supabase
        .from('match_results')
        .update({ submitted_by: mergeTargetId })
        .eq('submitted_by', selectedPlayer.id);

      // Step 4: Update availability
      await supabase
        .from('availability')
        .update({ player_id: mergeTargetId })
        .eq('player_id', selectedPlayer.id);

      // Step 5: Update coaching attendance
      await supabase
        .from('coaching_attendance')
        .update({ player_id: mergeTargetId })
        .eq('player_id', selectedPlayer.id);

      // Step 6: Update coaching payments
      await supabase
        .from('coaching_payments')
        .update({ player_id: mergeTargetId })
        .eq('player_id', selectedPlayer.id);

      // Step 7: Update score challenges
      await supabase.from('score_challenges').update({ challenger_id: mergeTargetId }).eq('challenger_id', selectedPlayer.id);
      await supabase.from('score_challenges').update({ resolved_by: mergeTargetId }).eq('resolved_by', selectedPlayer.id);

      // Step 8: Update score conflicts
      await supabase.from('score_conflicts').update({ conflicting_user_id: mergeTargetId }).eq('conflicting_user_id', selectedPlayer.id);
      await supabase.from('score_conflicts').update({ resolved_by: mergeTargetId }).eq('resolved_by', selectedPlayer.id);

      // Step 9: Delete source profile
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', selectedPlayer.id);

      if (deleteError) {
        console.warn('Could not delete source profile:', deleteError);
        toast.success(`Merged ${selectedPlayer.name} into ${targetPlayer.name}! (Source profile preserved due to constraints)`);
      } else {
        toast.success(`Successfully merged ${selectedPlayer.name} into ${targetPlayer.name}!`);
      }

      if (onDataRefresh) onDataRefresh();
      handleClose();
    } catch (error) {
      console.error('Merge failed:', error);
      toast.error(`Merge failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPlayer) return;

    const confirmText = `DELETE ${selectedPlayer.name}`;
    if (deleteConfirmText !== confirmText) {
      toast.error(`Please type exactly: ${confirmText}`);
      return;
    }

    if (!window.confirm(
      `⚠️ FINAL CONFIRMATION\n\n` +
      `This will SUSPEND the account for:\n` +
      `${selectedPlayer.name} (${selectedPlayer.email})\n\n` +
      `Their account will be deactivated and anonymized,\n` +
      `but match history will be preserved.\n\n` +
      `Continue?`
    )) return;

    setLoading(true);
    try {
      // Anonymize and suspend
      const anonymizedName = `[Deleted User ${selectedPlayer.id.substring(0, 8)}]`;
      const anonymizedEmail = `deleted_${selectedPlayer.id}@deleted.local`;

      const { error } = await supabase
        .from('profiles')
        .update({
          name: anonymizedName,
          email: anonymizedEmail,
          status: 'suspended'
        })
        .eq('id', selectedPlayer.id);

      if (error) throw error;

      // Remove from current seasons
      await supabase
        .from('season_players')
        .delete()
        .eq('player_id', selectedPlayer.id);

      // Clear future availability
      await supabase
        .from('availability')
        .delete()
        .eq('player_id', selectedPlayer.id);

      toast.success(`User ${selectedPlayer.name} has been suspended`);
      if (onDataRefresh) onDataRefresh();
      handleClose();
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to suspend user');
    } finally {
      setLoading(false);
    }
  };

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (!isOpen) return null;

  const hasProfileChanges = selectedPlayer && (
    editedName !== selectedPlayer.name ||
    editedEmail !== selectedPlayer.email ||
    editedRole !== selectedPlayer.role ||
    editedStatus !== selectedPlayer.status
  );

  const hasEloChanges = playerSeasonData && editedElo && editedElo !== playerSeasonData.elo_rating;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Player Management</h2>
                <p className="text-indigo-100 text-sm">Complete player administration</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={loading}
              className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Player Search */}
            {!selectedPlayer && (
              <div>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search players by name or email..."
                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-lg"
                    autoFocus
                  />
                </div>

                {/* Player List */}
                {searchTerm && (
                  <div className="mt-4 border-2 border-gray-200 rounded-xl max-h-96 overflow-y-auto">
                    {filteredPlayers.length > 0 ? (
                      <div className="divide-y divide-gray-100">
                        {filteredPlayers.map(player => (
                          <button
                            key={player.id}
                            onClick={() => setSelectedPlayer(player)}
                            className="w-full p-4 hover:bg-indigo-50 transition-colors text-left flex items-center justify-between group"
                          >
                            <div>
                              <p className="font-semibold text-gray-900 group-hover:text-indigo-600">{player.name}</p>
                              <p className="text-sm text-gray-600">{player.email}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  player.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {player.role || 'player'}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  player.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {player.status}
                                </span>
                              </div>
                            </div>
                            <Edit3 className="w-5 h-5 text-gray-400 group-hover:text-indigo-600" />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-gray-500">
                        No players found matching "{searchTerm}"
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Selected Player Management */}
            {selectedPlayer && (
              <div>
                {/* Player Header */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-100 rounded-xl p-6 mb-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{selectedPlayer.name}</h3>
                      <p className="text-indigo-600">{selectedPlayer.email}</p>
                    </div>
                    <button
                      onClick={() => setSelectedPlayer(null)}
                      className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                    >
                      Change Player
                    </button>
                  </div>

                  {/* Player Stats */}
                  {playerStats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3">
                        <p className="text-xs text-gray-600 mb-1">Seasons</p>
                        <p className="text-2xl font-bold text-indigo-600">{playerStats.seasonStats.length}</p>
                      </div>
                      <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3">
                        <p className="text-xs text-gray-600 mb-1">Coaching</p>
                        <p className="text-2xl font-bold text-purple-600">{playerStats.coachingCount}</p>
                      </div>
                      <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3">
                        <p className="text-xs text-gray-600 mb-1">Unpaid</p>
                        <p className="text-2xl font-bold text-orange-600">{playerStats.unpaidCount}</p>
                      </div>
                      {playerSeasonData && (
                        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3">
                          <p className="text-xs text-gray-600 mb-1">Current ELO</p>
                          <p className={`text-2xl font-bold ${getEloRankColor(playerSeasonData.elo_rating)}`}>
                            {playerSeasonData.elo_rating || '—'}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Tabs */}
                <div className="flex border-b-2 border-gray-200 mb-6">
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`px-6 py-3 font-semibold transition-colors relative ${
                      activeTab === 'profile'
                        ? 'text-indigo-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Profile & Role
                    {activeTab === 'profile' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('merge')}
                    className={`px-6 py-3 font-semibold transition-colors relative ${
                      activeTab === 'merge'
                        ? 'text-indigo-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Merge Player
                    {activeTab === 'merge' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('delete')}
                    className={`px-6 py-3 font-semibold transition-colors relative ${
                      activeTab === 'delete'
                        ? 'text-red-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Delete
                    {activeTab === 'delete' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600" />
                    )}
                  </button>
                </div>

                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <div className="space-y-6">
                    {/* Profile Edit */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <User className="w-4 h-4 inline mr-1" />
                            Display Name
                          </label>
                          <input
                            type="text"
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            disabled={loading}
                            className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <Mail className="w-4 h-4 inline mr-1" />
                            Email Address
                          </label>
                          <input
                            type="email"
                            value={editedEmail}
                            onChange={(e) => setEditedEmail(e.target.value)}
                            disabled={loading}
                            className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <Shield className="w-4 h-4 inline mr-1" />
                            Role
                          </label>
                          <select
                            value={editedRole}
                            onChange={(e) => setEditedRole(e.target.value)}
                            disabled={loading || selectedPlayer.id === currentUser?.id}
                            className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
                          >
                            <option value="player">Player</option>
                            <option value="admin">Admin</option>
                          </select>
                          {selectedPlayer.id === currentUser?.id && (
                            <p className="text-xs text-gray-500 mt-1">Cannot change your own role</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Status
                          </label>
                          <select
                            value={editedStatus}
                            onChange={(e) => setEditedStatus(e.target.value)}
                            disabled={loading}
                            className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          >
                            <option value="approved">Approved</option>
                            <option value="pending">Pending</option>
                          </select>
                        </div>
                      </div>

                      {hasProfileChanges && (
                        <button
                          onClick={handleSaveProfile}
                          disabled={loading}
                          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all shadow-lg flex items-center justify-center gap-2"
                        >
                          <Save className="w-5 h-5" />
                          {loading ? 'Saving...' : 'Save Profile Changes'}
                        </button>
                      )}
                    </div>

                    {/* ELO Rating */}
                    {activeSeason?.elo_enabled && playerSeasonData && (
                      <div className="border-t-2 border-gray-200 pt-6">
                        <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <Trophy className="w-5 h-5 text-yellow-600" />
                          ELO Rating - {activeSeason.name}
                        </h4>
                        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
                          <div className="flex items-center gap-4">
                            <div className="flex-1">
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Current Rating
                              </label>
                              <input
                                type="number"
                                min="500"
                                max="3000"
                                value={editedElo || ''}
                                onChange={(e) => setEditedElo(parseInt(e.target.value) || null)}
                                disabled={loading}
                                className="w-full p-3 border-2 border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                              />
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-gray-600 mb-1">Rank</p>
                              <p className={`text-lg font-bold ${getEloRankColor(editedElo || 1200)}`}>
                                {getEloRankLabel(editedElo || 1200)}
                              </p>
                            </div>
                          </div>
                          {hasEloChanges && (
                            <button
                              onClick={handleSaveElo}
                              disabled={loading}
                              className="mt-4 w-full bg-yellow-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-yellow-700 disabled:opacity-50 transition-all"
                            >
                              {loading ? 'Updating...' : 'Update ELO Rating'}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Merge Tab */}
                {activeTab === 'merge' && (
                  <div className="space-y-6">
                    <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                        <div className="text-sm text-amber-800">
                          <p className="font-semibold mb-1">Advanced Player Merge</p>
                          <p>This will merge ALL data from <strong>{selectedPlayer.name}</strong> into another player account. This includes match history, season stats, coaching records, and more. The source account will be deleted. This cannot be undone.</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Search Target Player (merge INTO)
                      </label>
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={mergeSearchTerm}
                          onChange={(e) => setMergeSearchTerm(e.target.value)}
                          placeholder="Search for target player..."
                          className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {mergeSearchTerm && (
                      <div className="border-2 border-gray-200 rounded-xl max-h-64 overflow-y-auto">
                        {mergeTargets.length > 0 ? (
                          <div className="divide-y divide-gray-100">
                            {mergeTargets.map(player => (
                              <button
                                key={player.id}
                                onClick={() => setMergeTargetId(player.id)}
                                className={`w-full p-4 transition-colors text-left ${
                                  mergeTargetId === player.id
                                    ? 'bg-green-50 border-l-4 border-green-600'
                                    : 'hover:bg-gray-50'
                                }`}
                              >
                                <p className="font-semibold text-gray-900">{player.name}</p>
                                <p className="text-sm text-gray-600">{player.email}</p>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="p-8 text-center text-gray-500">
                            No players found
                          </div>
                        )}
                      </div>
                    )}

                    {mergeTargetId && (
                      <div className="bg-gradient-to-r from-red-50 to-green-50 border-2 border-gray-300 rounded-xl p-4">
                        <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                          <ArrowRight className="w-5 h-5" />
                          Merge Preview
                        </h4>
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="font-semibold text-red-700 mb-1">FROM (will be deleted):</p>
                            <p className="text-gray-800">{selectedPlayer.name}</p>
                            <p className="text-gray-600">{selectedPlayer.email}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-green-700 mb-1">TO (will receive all data):</p>
                            <p className="text-gray-800">{allUsers.find(u => u.id === mergeTargetId)?.name}</p>
                            <p className="text-gray-600">{allUsers.find(u => u.id === mergeTargetId)?.email}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleMerge}
                      disabled={loading || !mergeTargetId}
                      className="w-full bg-amber-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                    >
                      {loading ? 'Merging Players...' : 'Merge Players'}
                    </button>
                  </div>
                )}

                {/* Delete Tab */}
                {activeTab === 'delete' && (
                  <div className="space-y-6">
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <Trash2 className="w-5 h-5 text-red-600 mt-0.5" />
                        <div className="text-sm text-red-800">
                          <p className="font-semibold mb-1">⚠️ Delete/Suspend User</p>
                          <p className="mb-2">This will:</p>
                          <ul className="list-disc list-inside space-y-1 ml-2">
                            <li>Set account status to "suspended"</li>
                            <li>Anonymize name and email</li>
                            <li>Remove from all current seasons</li>
                            <li>Clear future availability</li>
                            <li><strong>Preserve all match history and coaching records</strong></li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Type exactly: <span className="font-mono text-red-600">DELETE {selectedPlayer.name}</span>
                      </label>
                      <input
                        type="text"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder={`DELETE ${selectedPlayer.name}`}
                        className="w-full p-3 border-2 border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono"
                      />
                      {deleteConfirmText && deleteConfirmText === `DELETE ${selectedPlayer.name}` && (
                        <p className="text-green-600 text-sm mt-1 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          Confirmation text matches
                        </p>
                      )}
                    </div>

                    <button
                      onClick={handleDelete}
                      disabled={loading || deleteConfirmText !== `DELETE ${selectedPlayer.name}`}
                      className="w-full bg-red-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-5 h-5" />
                      {loading ? 'Suspending User...' : 'SUSPEND USER'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-gray-200 p-4 bg-gray-50">
          <button
            onClick={handleClose}
            disabled={loading}
            className="w-full py-3 px-6 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 disabled:opacity-50 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlayerManagementModal;
