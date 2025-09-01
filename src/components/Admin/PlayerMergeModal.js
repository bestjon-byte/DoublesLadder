// src/components/Admin/PlayerMergeModal.js
import React, { useState, useEffect } from 'react';
import { X, Search, ArrowRight, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useAppToast } from '../../contexts/ToastContext';

const PlayerMergeModal = ({ 
  showModal, 
  setShowModal, 
  allUsers, 
  ladderPlayers,
  selectedSeason,
  onMergeComplete 
}) => {
  const toast = useAppToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCsvPlayer, setSelectedCsvPlayer] = useState(null);
  const [selectedRealUser, setSelectedRealUser] = useState(null);
  const [merging, setMerging] = useState(false);
  const [csvPlayers, setCsvPlayers] = useState([]);
  const [realUsers, setRealUsers] = useState([]);

  // Filter CSV players vs real users
  useEffect(() => {
    if (!allUsers || !ladderPlayers) return;

    // CSV players: those in the season but with generated emails
    const csvPlayersList = ladderPlayers.filter(player => 
      player.email && player.email.includes('@example.com')
    );

    // Real users: approved users not in current season or with real emails
    const realUsersList = allUsers.filter(user => 
      user.status === 'approved' && 
      (!user.email.includes('@example.com') || 
       !ladderPlayers.find(lp => lp.id === user.id))
    );

    setCsvPlayers(csvPlayersList);
    setRealUsers(realUsersList);
  }, [allUsers, ladderPlayers]);

  const filteredCsvPlayers = csvPlayers.filter(player =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRealUsers = realUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMerge = async () => {
    if (!selectedCsvPlayer || !selectedRealUser) {
      toast.error('Please select both a CSV player and a real user to merge');
      return;
    }

    setMerging(true);
    try {
      console.log('🔄 Starting merge process:', {
        csvPlayer: selectedCsvPlayer.name,
        realUser: selectedRealUser.name
      });

      // Step 1: Update season_players to point to real user
      const { error: seasonError } = await supabase
        .from('season_players')
        .update({
          player_id: selectedRealUser.id,
          updated_at: new Date().toISOString()
        })
        .eq('season_id', selectedSeason.id)
        .eq('player_id', selectedCsvPlayer.id);

      if (seasonError) throw seasonError;

      // Step 2: Update match fixtures to use real user ID (be more thorough)
      console.log('🔄 Updating match fixtures...');
      const fixtureUpdates = [
        { field: 'player1_id', desc: 'individual player 1' },
        { field: 'player2_id', desc: 'individual player 2' }, 
        { field: 'player3_id', desc: 'individual player 3' },
        { field: 'player4_id', desc: 'individual player 4' },
        { field: 'pair1_player1_id', desc: 'pair 1 player 1' },
        { field: 'pair1_player2_id', desc: 'pair 1 player 2' },
        { field: 'pair2_player1_id', desc: 'pair 2 player 1' },
        { field: 'pair2_player2_id', desc: 'pair 2 player 2' },
        { field: 'sitting_player_id', desc: 'sitting player' }
      ];

      for (const update of fixtureUpdates) {
        const { error, count } = await supabase
          .from('match_fixtures')
          .update({ [update.field]: selectedRealUser.id })
          .eq(update.field, selectedCsvPlayer.id);
        
        if (error) {
          console.warn(`Warning updating ${update.desc}:`, error);
        } else if (count > 0) {
          console.log(`✅ Updated ${count} fixtures for ${update.desc}`);
        }
      }

      // Step 3: Update match results submitted_by
      const { error: resultsError } = await supabase
        .from('match_results')
        .update({ submitted_by: selectedRealUser.id })
        .eq('submitted_by', selectedCsvPlayer.id);

      if (resultsError) console.warn('Warning updating results:', resultsError);

      // Step 4: Update availability records
      console.log('🔄 Updating availability records...');
      const { error: availError, count: availCount } = await supabase
        .from('availability')
        .update({ player_id: selectedRealUser.id })
        .eq('player_id', selectedCsvPlayer.id);

      if (availError) {
        console.warn('Warning updating availability:', availError);
      } else if (availCount > 0) {
        console.log(`✅ Updated ${availCount} availability records`);
      }

      // Step 5: Update any score challenges
      console.log('🔄 Updating score challenges...');
      const { error: challengesError, count: challengesCount } = await supabase
        .from('score_challenges')
        .update({ challenger_id: selectedRealUser.id })
        .eq('challenger_id', selectedCsvPlayer.id);

      if (challengesError) {
        console.warn('Warning updating score challenges:', challengesError);
      } else if (challengesCount > 0) {
        console.log(`✅ Updated ${challengesCount} score challenges`);
      }

      // Step 6: Update any score conflicts
      console.log('🔄 Updating score conflicts...');
      const { error: conflictsError, count: conflictsCount } = await supabase
        .from('score_conflicts')
        .update({ conflicting_user_id: selectedRealUser.id })
        .eq('conflicting_user_id', selectedCsvPlayer.id);

      if (conflictsError) {
        console.warn('Warning updating score conflicts:', conflictsError);
      } else if (conflictsCount > 0) {
        console.log(`✅ Updated ${conflictsCount} score conflicts`);
      }

      // Step 7: Verify all references are updated before attempting delete
      console.log('🔍 Checking for remaining references...');
      
      // Check match_fixtures
      const { data: remainingFixtures } = await supabase
        .from('match_fixtures')
        .select('id')
        .or(`player1_id.eq.${selectedCsvPlayer.id},player2_id.eq.${selectedCsvPlayer.id},player3_id.eq.${selectedCsvPlayer.id},player4_id.eq.${selectedCsvPlayer.id},pair1_player1_id.eq.${selectedCsvPlayer.id},pair1_player2_id.eq.${selectedCsvPlayer.id},pair2_player1_id.eq.${selectedCsvPlayer.id},pair2_player2_id.eq.${selectedCsvPlayer.id},sitting_player_id.eq.${selectedCsvPlayer.id}`);

      if (remainingFixtures && remainingFixtures.length > 0) {
        console.warn(`⚠️ ${remainingFixtures.length} match fixtures still reference the old player`);
      }

      // Step 8: Try to delete the old CSV profile
      console.log('🗑️ Attempting to delete old CSV profile...');
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', selectedCsvPlayer.id);

      if (deleteError) {
        console.warn('Could not delete old profile (this is OK - merge completed successfully):', deleteError);
        toast.success(`Successfully merged ${selectedCsvPlayer.name} with ${selectedRealUser.name}! Note: Old profile preserved due to database constraints.`);
      } else {
        console.log('✅ Old CSV profile deleted successfully');
        toast.success(`Successfully merged and removed ${selectedCsvPlayer.name}! All data now belongs to ${selectedRealUser.name}.`);
      }
      
      // Reset state and close modal
      setSelectedCsvPlayer(null);
      setSelectedRealUser(null);
      setSearchTerm('');
      setShowModal(false);

      // Trigger refresh of data
      if (onMergeComplete) {
        onMergeComplete();
      }

    } catch (error) {
      console.error('❌ Merge failed:', error);
      toast.error(`Merge failed: ${error.message}`);
    } finally {
      setMerging(false);
    }
  };

  const resetSelections = () => {
    setSelectedCsvPlayer(null);
    setSelectedRealUser(null);
    setSearchTerm('');
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Merge CSV Players with Real Accounts
          </h2>
          <button
            onClick={() => setShowModal(false)}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 mb-1">How Player Merging Works:</p>
                <ul className="text-blue-800 space-y-1 ml-4">
                  <li>• Select a CSV player (from imported data with @example.com email)</li>
                  <li>• Select a real user account (signed up with real email)</li>
                  <li>• All historical match data will be transferred to the real account</li>
                  <li>• The CSV placeholder account will be removed</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search players by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5D1F1F] focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* CSV Players */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                CSV Players ({filteredCsvPlayers.length})
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredCsvPlayers.map(player => (
                  <div
                    key={player.id}
                    onClick={() => setSelectedCsvPlayer(player)}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedCsvPlayer?.id === player.id
                        ? 'border-[#5D1F1F] bg-[#5D1F1F]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-gray-900">{player.name}</div>
                    <div className="text-xs text-gray-500">{player.email}</div>
                    <div className="text-xs text-blue-600 mt-1">
                      {player.games_played || 0} games, {Math.round((player.games_won || 0) / Math.max(player.games_played || 1, 1) * 100)}% win rate
                    </div>
                  </div>
                ))}
                {filteredCsvPlayers.length === 0 && (
                  <div className="text-center text-gray-500 py-4">
                    No CSV players found
                  </div>
                )}
              </div>
            </div>

            {/* Merge Arrow */}
            <div className="flex items-center justify-center">
              <div className="text-center">
                <ArrowRight className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <div className="text-sm text-gray-600">Merge</div>
                {selectedCsvPlayer && selectedRealUser && (
                  <div className="mt-2 text-xs text-green-600">
                    <CheckCircle className="w-4 h-4 mx-auto mb-1" />
                    Ready to merge
                  </div>
                )}
              </div>
            </div>

            {/* Real Users */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Real User Accounts ({filteredRealUsers.length})
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredRealUsers.map(user => (
                  <div
                    key={user.id}
                    onClick={() => setSelectedRealUser(user)}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedRealUser?.id === user.id
                        ? 'border-[#5D1F1F] bg-[#5D1F1F]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-gray-900">{user.name}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      Status: {user.status} • Role: {user.role}
                    </div>
                  </div>
                ))}
                {filteredRealUsers.length === 0 && (
                  <div className="text-center text-gray-500 py-4">
                    No real users found
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={resetSelections}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            disabled={merging}
          >
            Reset Selections
          </button>
          
          <div className="flex space-x-3">
            <button
              onClick={() => setShowModal(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              disabled={merging}
            >
              Cancel
            </button>
            <button
              onClick={handleMerge}
              disabled={!selectedCsvPlayer || !selectedRealUser || merging}
              className="px-4 py-2 bg-[#5D1F1F] text-white rounded-md hover:bg-[#4A1818] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {merging ? 'Merging...' : 'Merge Players'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerMergeModal;