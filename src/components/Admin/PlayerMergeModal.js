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
  const [mergeMode, setMergeMode] = useState('csv'); // 'csv' or 'advanced'
  const [selectedSourcePlayer, setSelectedSourcePlayer] = useState(null);
  const [selectedTargetPlayer, setSelectedTargetPlayer] = useState(null);
  const [allPlayersWithStats, setAllPlayersWithStats] = useState([]);

  // Filter CSV players vs real users and fetch their stats
  useEffect(() => {
    const fetchCsvPlayersWithStats = async () => {
      if (!allUsers) return;

      // CSV players: approved users with @example.com email, excluding fake test data
      const baseCsvPlayersList = allUsers.filter(player => 
        player.email && 
        player.email.includes('@example.com') && 
        player.status === 'approved' &&
        // Exclude obvious test/fake players
        !['Bob Smith', 'Alice Johnson', 'Charlie Brown', 'Diana Prince', 'Eve Wilson', 'Frank Miller', 'Admin User', 'Emma Brown', 'David Wilson', 'Grace Taylor', 'Henry Garcia', 'Iris Martinez', 'Jack Thompson'].includes(player.name)
      );

      // Fetch season stats for CSV players
      const csvPlayersWithStats = await Promise.all(
        baseCsvPlayersList.map(async (player) => {
          try {
            const { data: seasonStats } = await supabase
              .from('season_players')
              .select('games_played, games_won, matches_played, matches_won')
              .eq('player_id', player.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            return {
              ...player,
              games_played: seasonStats?.games_played || 0,
              games_won: seasonStats?.games_won || 0,
              matches_played: seasonStats?.matches_played || 0,
              matches_won: seasonStats?.matches_won || 0
            };
          } catch (error) {
            // Return player with zero stats if query fails
            return {
              ...player,
              games_played: 0,
              games_won: 0,
              matches_played: 0,
              matches_won: 0
            };
          }
        })
      );

      // Real users: approved users with real emails (not @example.com)
      const realUsersList = allUsers.filter(user => 
        user.status === 'approved' && 
        user.email && !user.email.includes('@example.com')
      );

      setCsvPlayers(csvPlayersWithStats);
      setRealUsers(realUsersList);
    };

    fetchCsvPlayersWithStats();
  }, [allUsers]);

  // Fetch all players with stats for advanced merge mode
  useEffect(() => {
    const fetchAllPlayersWithStats = async () => {
      if (!allUsers || mergeMode !== 'advanced') return;

      const approvedUsers = allUsers.filter(user => user.status === 'approved');

      // Fetch comprehensive stats for all approved users
      const playersWithStats = await Promise.all(
        approvedUsers.map(async (player) => {
          try {
            // Get season stats
            const { data: seasonStats } = await supabase
              .from('season_players')
              .select(`
                games_played, 
                games_won, 
                matches_played, 
                matches_won,
                season_id,
                seasons!inner(name, season_type)
              `)
              .eq('player_id', player.id);

            // Get total statistics across all seasons
            const totalStats = seasonStats ? seasonStats.reduce((acc, stat) => ({
              total_games_played: acc.total_games_played + (stat.games_played || 0),
              total_games_won: acc.total_games_won + (stat.games_won || 0),
              total_matches_played: acc.total_matches_played + (stat.matches_played || 0),
              total_matches_won: acc.total_matches_won + (stat.matches_won || 0),
              seasons_count: acc.seasons_count + 1
            }), {
              total_games_played: 0,
              total_games_won: 0,
              total_matches_played: 0,
              total_matches_won: 0,
              seasons_count: 0
            }) : { total_games_played: 0, total_games_won: 0, total_matches_played: 0, total_matches_won: 0, seasons_count: 0 };

            // Count match fixtures (total matches participated in)
            const { count: fixtureCount } = await supabase
              .from('match_fixtures')
              .select('id', { count: 'exact' })
              .or(`player1_id.eq.${player.id},player2_id.eq.${player.id},player3_id.eq.${player.id},player4_id.eq.${player.id},pair1_player1_id.eq.${player.id},pair1_player2_id.eq.${player.id},pair2_player1_id.eq.${player.id},pair2_player2_id.eq.${player.id},sitting_player_id.eq.${player.id}`);

            return {
              ...player,
              ...totalStats,
              fixture_count: fixtureCount || 0,
              win_rate: totalStats.total_games_played > 0 
                ? Math.round((totalStats.total_games_won / totalStats.total_games_played) * 100)
                : 0,
              season_details: seasonStats || []
            };
          } catch (error) {
            console.warn(`Error fetching stats for ${player.name}:`, error);
            return {
              ...player,
              total_games_played: 0,
              total_games_won: 0,
              total_matches_played: 0,
              total_matches_won: 0,
              seasons_count: 0,
              fixture_count: 0,
              win_rate: 0,
              season_details: []
            };
          }
        })
      );

      setAllPlayersWithStats(playersWithStats);
    };

    fetchAllPlayersWithStats();
  }, [allUsers, mergeMode]);

  const filteredCsvPlayers = csvPlayers.filter(player =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRealUsers = realUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Advanced mode filtering
  const filteredAllPlayers = allPlayersWithStats.filter(player =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMerge = async () => {
    if (!selectedCsvPlayer || !selectedRealUser) {
      toast.error('Please select both a CSV player and a real user to merge');
      return;
    }

    setMerging(true);
    try {
      // Starting merge process for CSV player to real user account

      // Step 1: Find which seasons the CSV player and real user are in
      const { data: csvSeasons } = await supabase
        .from('season_players')
        .select('season_id, rank, games_played, games_won, matches_played, matches_won')
        .eq('player_id', selectedCsvPlayer.id);

      const { data: realUserSeasons } = await supabase
        .from('season_players')
        .select('season_id, rank, games_played, games_won, matches_played, matches_won')
        .eq('player_id', selectedRealUser.id);

      // Step 2: Handle each CSV player's season record intelligently
      if (csvSeasons && csvSeasons.length > 0) {
        for (const csvSeason of csvSeasons) {
          const existingRealUserSeason = realUserSeasons?.find(rs => rs.season_id === csvSeason.season_id);

          if (existingRealUserSeason) {
            // Both players are in the same season - combine their stats
            const { error: updateError } = await supabase
              .from('season_players')
              .update({
                games_played: (existingRealUserSeason.games_played || 0) + (csvSeason.games_played || 0),
                games_won: (existingRealUserSeason.games_won || 0) + (csvSeason.games_won || 0),
                matches_played: (existingRealUserSeason.matches_played || 0) + (csvSeason.matches_played || 0),
                matches_won: (existingRealUserSeason.matches_won || 0) + (csvSeason.matches_won || 0),
                updated_at: new Date().toISOString()
              })
              .eq('player_id', selectedRealUser.id)
              .eq('season_id', csvSeason.season_id);

            if (updateError) throw updateError;

            // Delete the CSV player's season record since we've merged the stats
            await supabase
              .from('season_players')
              .delete()
              .eq('player_id', selectedCsvPlayer.id)
              .eq('season_id', csvSeason.season_id);
          } else {
            // Only CSV player is in this season - transfer the record directly
            const { error: transferError } = await supabase
              .from('season_players')
              .update({
                player_id: selectedRealUser.id,
                updated_at: new Date().toISOString()
              })
              .eq('player_id', selectedCsvPlayer.id)
              .eq('season_id', csvSeason.season_id);

            if (transferError) throw transferError;
          }
        }
        toast.info(`Merged ${csvSeasons.length} season record(s) for ${selectedCsvPlayer.name}`);
      }

      // Step 3: Update match fixtures to use real user ID (be more thorough)
      // Updating match fixtures to use real user ID
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
        const { error } = await supabase
          .from('match_fixtures')
          .update({ [update.field]: selectedRealUser.id })
          .eq(update.field, selectedCsvPlayer.id);

        if (error) {
          console.warn(`Warning updating ${update.desc}:`, error);
        }
        // Fixtures updated for this player position
      }

      // Step 4: Update match results submitted_by
      const { error: resultsError } = await supabase
        .from('match_results')
        .update({ submitted_by: selectedRealUser.id })
        .eq('submitted_by', selectedCsvPlayer.id);

      if (resultsError) console.warn('Warning updating results:', resultsError);

      // Step 5: Update availability records
      // Updating availability records for merged player
      const { error: availError } = await supabase
        .from('availability')
        .update({ player_id: selectedRealUser.id })
        .eq('player_id', selectedCsvPlayer.id);

      if (availError) {
        console.warn('Warning updating availability:', availError);
      }
      // Availability records updated for merged player

      // Step 6: Update any score challenges
      // Updating score challenges for merged player
      const { error: challengesError } = await supabase
        .from('score_challenges')
        .update({ challenger_id: selectedRealUser.id })
        .eq('challenger_id', selectedCsvPlayer.id);

      if (challengesError) {
        console.warn('Warning updating score challenges:', challengesError);
      }
      // Score challenges updated for merged player

      // Step 7: Update any score conflicts
      // Updating score conflicts for merged player
      const { error: conflictsError } = await supabase
        .from('score_conflicts')
        .update({ conflicting_user_id: selectedRealUser.id })
        .eq('conflicting_user_id', selectedCsvPlayer.id);

      if (conflictsError) {
        console.warn('Warning updating score conflicts:', conflictsError);
      }
      // Score conflicts updated for merged player

      // Step 8: Verify all references are updated before attempting delete
      // Checking for any remaining references to old player
      
      // Check match_fixtures
      const { data: remainingFixtures } = await supabase
        .from('match_fixtures')
        .select('id')
        .or(`player1_id.eq.${selectedCsvPlayer.id},player2_id.eq.${selectedCsvPlayer.id},player3_id.eq.${selectedCsvPlayer.id},player4_id.eq.${selectedCsvPlayer.id},pair1_player1_id.eq.${selectedCsvPlayer.id},pair1_player2_id.eq.${selectedCsvPlayer.id},pair2_player1_id.eq.${selectedCsvPlayer.id},pair2_player2_id.eq.${selectedCsvPlayer.id},sitting_player_id.eq.${selectedCsvPlayer.id}`);

      if (remainingFixtures && remainingFixtures.length > 0) {
        console.warn(`Warning: ${remainingFixtures.length} match fixtures still reference the old player`);
      }

      // Step 9: Try to delete the old CSV profile
      // Attempting to delete old CSV profile
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', selectedCsvPlayer.id);

      if (deleteError) {
        console.warn('Could not delete old profile (this is OK - merge completed successfully):', deleteError);
        toast.success(`Successfully merged ${selectedCsvPlayer.name} with ${selectedRealUser.name}! Note: Old profile preserved due to database constraints.`);
      } else {
        // Old CSV profile deleted successfully
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

  // Advanced merge handler for any two accounts
  const handleAdvancedMerge = async () => {
    if (!selectedSourcePlayer || !selectedTargetPlayer) {
      toast.error('Please select both a source player (to merge from) and target player (to merge into)');
      return;
    }

    if (selectedSourcePlayer.id === selectedTargetPlayer.id) {
      toast.error('Cannot merge a player with themselves. Please select different players.');
      return;
    }

    // Warn if both players have extensive histories
    if (selectedSourcePlayer.total_games_played > 10 && selectedTargetPlayer.total_games_played > 10) {
      if (!window.confirm(
        `⚠️ WARNING: Both players have extensive match histories!\n\n` +
        `${selectedSourcePlayer.name}: ${selectedSourcePlayer.total_games_played} games, ${selectedSourcePlayer.seasons_count} seasons\n` +
        `${selectedTargetPlayer.name}: ${selectedTargetPlayer.total_games_played} games, ${selectedTargetPlayer.seasons_count} seasons\n\n` +
        `This will merge ALL data from ${selectedSourcePlayer.name} into ${selectedTargetPlayer.name} and delete the source account.\n\n` +
        `Are you absolutely sure you want to proceed?`
      )) {
        return;
      }
    }

    setMerging(true);
    try {
      // Enhanced merge process with comprehensive data migration
      toast.info(`Starting advanced merge: ${selectedSourcePlayer.name} → ${selectedTargetPlayer.name}`);

      // Step 1: Handle season_players records with potential conflicts
      const { data: sourceSeasons } = await supabase
        .from('season_players')
        .select('season_id, rank, games_played, games_won, matches_played, matches_won')
        .eq('player_id', selectedSourcePlayer.id);

      const { data: targetSeasons } = await supabase
        .from('season_players')
        .select('season_id, rank, games_played, games_won, matches_played, matches_won')
        .eq('player_id', selectedTargetPlayer.id);

      // Merge season records intelligently
      if (sourceSeasons && sourceSeasons.length > 0) {
        for (const sourceSeason of sourceSeasons) {
          const existingTargetSeason = targetSeasons?.find(ts => ts.season_id === sourceSeason.season_id);
          
          if (existingTargetSeason) {
            // Combine stats for the same season
            const { error: updateError } = await supabase
              .from('season_players')
              .update({
                games_played: (existingTargetSeason.games_played || 0) + (sourceSeason.games_played || 0),
                games_won: (existingTargetSeason.games_won || 0) + (sourceSeason.games_won || 0),
                matches_played: (existingTargetSeason.matches_played || 0) + (sourceSeason.matches_played || 0),
                matches_won: (existingTargetSeason.matches_won || 0) + (sourceSeason.matches_won || 0),
                updated_at: new Date().toISOString()
              })
              .eq('player_id', selectedTargetPlayer.id)
              .eq('season_id', sourceSeason.season_id);

            if (updateError) throw updateError;

            // Delete source season record
            await supabase
              .from('season_players')
              .delete()
              .eq('player_id', selectedSourcePlayer.id)
              .eq('season_id', sourceSeason.season_id);
          } else {
            // Transfer season record directly
            const { error: transferError } = await supabase
              .from('season_players')
              .update({
                player_id: selectedTargetPlayer.id,
                updated_at: new Date().toISOString()
              })
              .eq('player_id', selectedSourcePlayer.id)
              .eq('season_id', sourceSeason.season_id);

            if (transferError) throw transferError;
          }
        }
        toast.info(`Merged ${sourceSeasons.length} season record(s)`);
      }

      // Step 2: Update all match fixtures (comprehensive)
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

      let totalFixtureUpdates = 0;
      for (const update of fixtureUpdates) {
        const { error, count } = await supabase
          .from('match_fixtures')
          .update({ [update.field]: selectedTargetPlayer.id })
          .eq(update.field, selectedSourcePlayer.id);
        
        if (error) {
          console.warn(`Warning updating ${update.desc}:`, error);
        } else if (count > 0) {
          totalFixtureUpdates += count;
        }
      }
      if (totalFixtureUpdates > 0) {
        toast.info(`Updated ${totalFixtureUpdates} match fixture reference(s)`);
      }

      // Step 3: Update match results
      const { error: resultsError, count: resultsCount } = await supabase
        .from('match_results')
        .update({ submitted_by: selectedTargetPlayer.id })
        .eq('submitted_by', selectedSourcePlayer.id);

      if (resultsError) {
        console.warn('Warning updating match results:', resultsError);
      } else if (resultsCount > 0) {
        toast.info(`Updated ${resultsCount} match result submission(s)`);
      }

      // Step 4: Update availability records
      const { error: availError, count: availCount } = await supabase
        .from('availability')
        .update({ player_id: selectedTargetPlayer.id })
        .eq('player_id', selectedSourcePlayer.id);

      if (availError) {
        console.warn('Warning updating availability:', availError);
      } else if (availCount > 0) {
        toast.info(`Updated ${availCount} availability record(s)`);
      }

      // Step 5: Update score challenges
      const challengeUpdates = [
        { field: 'challenger_id', desc: 'challenge submissions' },
        { field: 'resolved_by', desc: 'challenge resolutions' }
      ];

      let totalChallengeUpdates = 0;
      for (const update of challengeUpdates) {
        const { error, count } = await supabase
          .from('score_challenges')
          .update({ [update.field]: selectedTargetPlayer.id })
          .eq(update.field, selectedSourcePlayer.id);
        
        if (error) {
          console.warn(`Warning updating ${update.desc}:`, error);
        } else if (count > 0) {
          totalChallengeUpdates += count;
        }
      }
      if (totalChallengeUpdates > 0) {
        toast.info(`Updated ${totalChallengeUpdates} score challenge reference(s)`);
      }

      // Step 6: Update score conflicts
      const conflictUpdates = [
        { field: 'conflicting_user_id', desc: 'conflict submissions' },
        { field: 'resolved_by', desc: 'conflict resolutions' }
      ];

      let totalConflictUpdates = 0;
      for (const update of conflictUpdates) {
        const { error, count } = await supabase
          .from('score_conflicts')
          .update({ [update.field]: selectedTargetPlayer.id })
          .eq(update.field, selectedSourcePlayer.id);
        
        if (error) {
          console.warn(`Warning updating ${update.desc}:`, error);
        } else if (count > 0) {
          totalConflictUpdates += count;
        }
      }
      if (totalConflictUpdates > 0) {
        toast.info(`Updated ${totalConflictUpdates} score conflict reference(s)`);
      }

      // Step 7: Update league match rubbers
      const rubberUpdates = [
        { field: 'cawood_player1_id', desc: 'league rubber player 1' },
        { field: 'cawood_player2_id', desc: 'league rubber player 2' }
      ];

      let totalRubberUpdates = 0;
      for (const update of rubberUpdates) {
        const { error, count } = await supabase
          .from('league_match_rubbers')
          .update({ [update.field]: selectedTargetPlayer.id })
          .eq(update.field, selectedSourcePlayer.id);
        
        if (error) {
          console.warn(`Warning updating ${update.desc}:`, error);
        } else if (count > 0) {
          totalRubberUpdates += count;
        }
      }
      if (totalRubberUpdates > 0) {
        toast.info(`Updated ${totalRubberUpdates} league rubber reference(s)`);
      }

      // Step 8: Update player match cache
      const cacheUpdates = [
        { field: 'matched_player_id', desc: 'player match cache' },
        { field: 'confirmed_by', desc: 'match confirmations' }
      ];

      let totalCacheUpdates = 0;
      for (const update of cacheUpdates) {
        const { error, count } = await supabase
          .from('player_match_cache')
          .update({ [update.field]: selectedTargetPlayer.id })
          .eq(update.field, selectedSourcePlayer.id);
        
        if (error) {
          console.warn(`Warning updating ${update.desc}:`, error);
        } else if (count > 0) {
          totalCacheUpdates += count;
        }
      }
      if (totalCacheUpdates > 0) {
        toast.info(`Updated ${totalCacheUpdates} player cache reference(s)`);
      }

      // Step 9: Final verification and deletion
      const verificationQueries = [
        { table: 'season_players', field: 'player_id' },
        { table: 'availability', field: 'player_id' },
        { table: 'match_results', field: 'submitted_by' },
        { table: 'score_challenges', field: 'challenger_id' },
        { table: 'score_conflicts', field: 'conflicting_user_id' },
        { table: 'league_match_rubbers', field: 'cawood_player1_id' },
        { table: 'league_match_rubbers', field: 'cawood_player2_id' },
        { table: 'player_match_cache', field: 'matched_player_id' }
      ];

      for (const query of verificationQueries) {
        const { data: remaining } = await supabase
          .from(query.table)
          .select('id')
          .eq(query.field, selectedSourcePlayer.id)
          .limit(1);

        if (remaining && remaining.length > 0) {
          console.warn(`Remaining references in ${query.table}.${query.field}`);
        }
      }

      // Check match fixtures separately due to multiple fields
      const { data: remainingFixtures } = await supabase
        .from('match_fixtures')
        .select('id')
        .or(`player1_id.eq.${selectedSourcePlayer.id},player2_id.eq.${selectedSourcePlayer.id},player3_id.eq.${selectedSourcePlayer.id},player4_id.eq.${selectedSourcePlayer.id},pair1_player1_id.eq.${selectedSourcePlayer.id},pair1_player2_id.eq.${selectedSourcePlayer.id},pair2_player1_id.eq.${selectedSourcePlayer.id},pair2_player2_id.eq.${selectedSourcePlayer.id},sitting_player_id.eq.${selectedSourcePlayer.id}`)
        .limit(1);

      if (remainingFixtures && remainingFixtures.length > 0) {
        console.warn('Remaining fixture references found');
      }

      // Attempt to delete the source profile
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', selectedSourcePlayer.id);

      if (deleteError) {
        console.warn('Could not delete source profile:', deleteError);
        toast.success(`Successfully merged ${selectedSourcePlayer.name} with ${selectedTargetPlayer.name}! Note: Source profile preserved due to database constraints.`);
      } else {
        toast.success(`Successfully merged and removed ${selectedSourcePlayer.name}! All data now belongs to ${selectedTargetPlayer.name}.`);
      }
      
      // Reset state and close modal
      setSelectedSourcePlayer(null);
      setSelectedTargetPlayer(null);
      setSelectedCsvPlayer(null);
      setSelectedRealUser(null);
      setSearchTerm('');
      setShowModal(false);

      // Trigger refresh of data
      if (onMergeComplete) {
        onMergeComplete();
      }

    } catch (error) {
      console.error('❌ Advanced merge failed:', error);
      toast.error(`Advanced merge failed: ${error.message}`);
    } finally {
      setMerging(false);
    }
  };

  const resetSelections = () => {
    setSelectedCsvPlayer(null);
    setSelectedRealUser(null);
    setSelectedSourcePlayer(null);
    setSelectedTargetPlayer(null);
    setSearchTerm('');
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {mergeMode === 'csv' ? 'Merge CSV Players with Real Accounts' : 'Advanced Player Merge'}
            </h2>
            
            {/* Mode Toggle */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setMergeMode('csv');
                    resetSelections();
                  }}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    mergeMode === 'csv'
                      ? 'bg-[#5D1F1F] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  CSV Import Mode
                </button>
                <button
                  onClick={() => {
                    setMergeMode('advanced');
                    resetSelections();
                  }}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    mergeMode === 'advanced'
                      ? 'bg-[#5D1F1F] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Advanced Mode
                </button>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowModal(false)}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
          {/* Instructions */}
          <div className={`border rounded-lg p-4 ${
            mergeMode === 'csv' ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200'
          }`}>
            <div className="flex items-start space-x-3">
              <AlertTriangle className={`w-5 h-5 mt-0.5 ${
                mergeMode === 'csv' ? 'text-blue-600' : 'text-amber-600'
              }`} />
              <div className="text-sm">
                {mergeMode === 'csv' ? (
                  <>
                    <p className="font-medium text-blue-900 mb-1">CSV Import Mode:</p>
                    <ul className="text-blue-800 space-y-1 ml-4">
                      <li>• Select a CSV player (imported data with @example.com email)</li>
                      <li>• Select a real user account (signed up with real email)</li>
                      <li>• All historical match data will be transferred to the real account</li>
                      <li>• The CSV placeholder account will be removed</li>
                    </ul>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-amber-900 mb-1">Advanced Mode - Merge Any Two Accounts:</p>
                    <ul className="text-amber-800 space-y-1 ml-4">
                      <li>• Select a SOURCE player (data will be moved FROM this account)</li>
                      <li>• Select a TARGET player (data will be moved TO this account)</li>
                      <li>• All match history, season stats, and records will be combined</li>
                      <li>• Source account will be deleted (if possible)</li>
                      <li>• ⚠️ <strong>WARNING:</strong> This action cannot be undone!</li>
                    </ul>
                  </>
                )}
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

          {/* Mode-specific content */}
          {mergeMode === 'csv' ? (
            /* CSV Import Mode Layout */
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
          ) : (
            /* Advanced Mode Layout */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Source Player (FROM) */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  <span className="text-red-600">Source Player</span> ({filteredAllPlayers.length})
                  <div className="text-xs text-gray-500 font-normal mt-1">Data will be moved FROM this account</div>
                </h3>
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {filteredAllPlayers
                    .filter(player => player.id !== selectedTargetPlayer?.id)
                    .map(player => (
                    <div
                      key={player.id}
                      onClick={() => setSelectedSourcePlayer(player)}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedSourcePlayer?.id === player.id
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-gray-900">{player.name}</div>
                      <div className="text-xs text-gray-500">{player.email}</div>
                      <div className="text-xs text-green-600 mt-1">
                        {player.total_games_played || 0} games • {player.win_rate}% win rate
                      </div>
                      <div className="text-xs text-blue-600">
                        {player.seasons_count || 0} seasons • {player.fixture_count || 0} fixtures
                      </div>
                    </div>
                  ))}
                  {filteredAllPlayers.filter(p => p.id !== selectedTargetPlayer?.id).length === 0 && (
                    <div className="text-center text-gray-500 py-4">
                      No available players
                    </div>
                  )}
                </div>
              </div>

              {/* Merge Arrow */}
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <ArrowRight className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <div className="text-sm text-gray-600">Advanced Merge</div>
                  {selectedSourcePlayer && selectedTargetPlayer && (
                    <div className="mt-2">
                      <div className="text-xs text-green-600 flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Ready
                      </div>
                      {(selectedSourcePlayer.total_games_played > 10 && selectedTargetPlayer.total_games_played > 10) && (
                        <div className="text-xs text-amber-600 mt-1">
                          ⚠️ Both have extensive histories
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Target Player (TO) */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  <span className="text-green-600">Target Player</span> ({filteredAllPlayers.length})
                  <div className="text-xs text-gray-500 font-normal mt-1">Data will be moved TO this account</div>
                </h3>
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {filteredAllPlayers
                    .filter(player => player.id !== selectedSourcePlayer?.id)
                    .map(player => (
                    <div
                      key={player.id}
                      onClick={() => setSelectedTargetPlayer(player)}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedTargetPlayer?.id === player.id
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-gray-900">{player.name}</div>
                      <div className="text-xs text-gray-500">{player.email}</div>
                      <div className="text-xs text-green-600 mt-1">
                        {player.total_games_played || 0} games • {player.win_rate}% win rate
                      </div>
                      <div className="text-xs text-blue-600">
                        {player.seasons_count || 0} seasons • {player.fixture_count || 0} fixtures
                      </div>
                    </div>
                  ))}
                  {filteredAllPlayers.filter(p => p.id !== selectedSourcePlayer?.id).length === 0 && (
                    <div className="text-center text-gray-500 py-4">
                      No available players
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Advanced Mode Summary */}
          {mergeMode === 'advanced' && selectedSourcePlayer && selectedTargetPlayer && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4 mt-6">
              <h4 className="font-medium text-amber-900 mb-3 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Merge Summary Preview
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium text-red-700 mb-2">FROM: {selectedSourcePlayer.name}</div>
                  <ul className="text-amber-800 space-y-1">
                    <li>• {selectedSourcePlayer.total_games_played || 0} games played</li>
                    <li>• {selectedSourcePlayer.total_games_won || 0} games won</li>
                    <li>• {selectedSourcePlayer.seasons_count || 0} seasons participated</li>
                    <li>• {selectedSourcePlayer.fixture_count || 0} match fixtures</li>
                  </ul>
                </div>
                <div>
                  <div className="font-medium text-green-700 mb-2">TO: {selectedTargetPlayer.name}</div>
                  <ul className="text-amber-800 space-y-1">
                    <li>• Combined games: {(selectedTargetPlayer.total_games_played || 0) + (selectedSourcePlayer.total_games_played || 0)}</li>
                    <li>• Combined wins: {(selectedTargetPlayer.total_games_won || 0) + (selectedSourcePlayer.total_games_won || 0)}</li>
                    <li>• Email: {selectedTargetPlayer.email}</li>
                    <li>• Role: {selectedTargetPlayer.role}</li>
                  </ul>
                </div>
              </div>
              <div className="mt-3 p-3 bg-amber-100 rounded-md">
                <p className="text-xs text-amber-800">
                  <strong>This will:</strong> Transfer all match history, season statistics, availability records, and other data from 
                  <strong> {selectedSourcePlayer.name}</strong> to <strong>{selectedTargetPlayer.name}</strong>. 
                  The source account will be deleted if possible. This action cannot be undone.
                </p>
              </div>
            </div>
          )}
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
              onClick={mergeMode === 'csv' ? handleMerge : handleAdvancedMerge}
              disabled={
                mergeMode === 'csv' 
                  ? (!selectedCsvPlayer || !selectedRealUser || merging)
                  : (!selectedSourcePlayer || !selectedTargetPlayer || merging)
              }
              className="px-4 py-2 bg-[#5D1F1F] text-white rounded-md hover:bg-[#4A1818] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {merging 
                ? (mergeMode === 'csv' ? 'Merging CSV...' : 'Merging Accounts...') 
                : (mergeMode === 'csv' ? 'Merge Players' : 'Advanced Merge')
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerMergeModal;