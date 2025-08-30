// src/hooks/useApp.js
// This hook extracts ALL the data fetching logic from App.js

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

export const useApp = (userId) => {
  // State management
  const [state, setState] = useState({
    users: [],
    currentSeason: null,
    availability: [],
    matchFixtures: [],
    matchResults: [],
    loading: {
      initial: true,
      users: false,
      seasons: false,
      availability: false,
      fixtures: false,
      results: false
    },
    error: null
  });

  // Helper to update loading state
  const setLoading = useCallback((key, value) => {
    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, [key]: value }
    }));
  }, []);

  // Helper to update data
  const updateData = useCallback((key, value) => {
    setState(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  // ====================
  // Data Fetching Methods
  // ====================

  const fetchUsers = useCallback(async () => {
    setLoading('users', true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('rank', { ascending: true, nullsLast: true });

      if (error) throw error;
      updateData('users', data || []);
      return data;
    } catch (error) {
      console.error('Error fetching users:', error);
      updateData('error', error);
    } finally {
      setLoading('users', false);
    }
  }, []);

  const createDefaultSeason = useCallback(async () => {
    try {
      // Deactivate all existing seasons
      await supabase
        .from('seasons')
        .update({ is_active: false })
        .eq('is_active', true);
      
      const { data: newSeason, error } = await supabase
        .from('seasons')
        .insert({
          name: `Season ${new Date().getFullYear()}`,
          start_date: new Date().toISOString().split('T')[0],
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      return newSeason;
    } catch (error) {
      console.error('Error creating season:', error);
      return null;
    }
  }, []);

  const fetchSeasons = useCallback(async () => {
    setLoading('seasons', true);
    try {
      const { data: activeSeasons, error } = await supabase
        .from('seasons')
        .select('*')
        .eq('is_active', true)
        .limit(1);
      
      if (error) throw error;
      
      let activeSeason = activeSeasons?.[0];
      
      if (!activeSeason) {
        console.log('No active season found, creating default...');
        activeSeason = await createDefaultSeason();
        if (!activeSeason) return;
      }
      
      const { data: matches } = await supabase
        .from('matches')
        .select('*')
        .eq('season_id', activeSeason.id)
        .order('week_number', { ascending: true });
      
      const seasonWithMatches = {
        ...activeSeason,
        matches: matches || []
      };
      
      updateData('currentSeason', seasonWithMatches);
      return seasonWithMatches;
    } catch (error) {
      console.error('Error fetching seasons:', error);
      updateData('error', error);
    } finally {
      setLoading('seasons', false);
    }
  }, [createDefaultSeason]);

  const fetchAvailability = useCallback(async () => {
    setLoading('availability', true);
    try {
      const { data, error } = await supabase
        .from('availability')
        .select('*');
      
      if (error) throw error;
      updateData('availability', data || []);
      return data;
    } catch (error) {
      console.error('Error fetching availability:', error);
    } finally {
      setLoading('availability', false);
    }
  }, []);

  const fetchMatchFixtures = useCallback(async () => {
    setLoading('fixtures', true);
    try {
      const { data, error } = await supabase
        .from('match_fixtures')
        .select(`
          *,
          player1:player1_id(name),
          player2:player2_id(name),
          player3:player3_id(name),
          player4:player4_id(name),
          sitting_player:sitting_player_id(name)
        `);
      
      if (error) throw error;
      updateData('matchFixtures', data || []);
      return data;
    } catch (error) {
      console.error('Error fetching fixtures:', error);
    } finally {
      setLoading('fixtures', false);
    }
  }, []);

  const fetchMatchResults = useCallback(async () => {
    setLoading('results', true);
    try {
      const { data, error } = await supabase
        .from('match_results')
        .select('*');
      
      if (error) throw error;
      updateData('matchResults', data || []);
      return data;
    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      setLoading('results', false);
    }
  }, []);

  // ====================
  // Business Logic Methods
  // ====================

  const approveUser = useCallback(async (userId) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'approved' })
        .eq('id', userId);

      if (error) throw error;
      await fetchUsers();
      return { success: true };
    } catch (error) {
      console.error('Error approving user:', error);
      return { success: false, error };
    }
  }, [fetchUsers]);

  const addToLadder = useCallback(async (userId, rank) => {
    try {
      const targetRank = parseInt(rank);
      
      // Get players that need to shift
      const { data: playersToShift, error: getError } = await supabase
        .from('profiles')
        .select('id, rank')
        .gte('rank', targetRank)
        .eq('in_ladder', true)
        .order('rank', { ascending: true });

      if (getError) throw getError;

      // Shift players down
      if (playersToShift?.length > 0) {
        for (const player of playersToShift) {
          await supabase
            .from('profiles')
            .update({ rank: player.rank + 1 })
            .eq('id', player.id);
        }
      }

      // Add player to ladder
      const { error } = await supabase
        .from('profiles')
        .update({ 
          in_ladder: true, 
          rank: targetRank
        })
        .eq('id', userId);

      if (error) throw error;
      await fetchUsers();
      return { success: true };
    } catch (error) {
      console.error('Error adding to ladder:', error);
      alert('Error: ' + error.message);
      return { success: false, error };
    }
  }, [fetchUsers]);

  const setPlayerAvailability = useCallback(async (matchId, available, playerId) => {
    try {
      const match = state.currentSeason?.matches?.find(m => m.id === matchId);
      if (!match) throw new Error('Match not found');
      
      const matchDate = match.match_date;
      
      if (available === undefined) {
        // Remove availability record
        await supabase
          .from('availability')
          .delete()
          .eq('player_id', playerId)
          .eq('match_date', matchDate);
      } else {
        // Check if record exists
        const { data: existing } = await supabase
          .from('availability')
          .select('*')
          .eq('player_id', playerId)
          .eq('match_date', matchDate)
          .maybeSingle();
        
        if (existing) {
          // Update existing
          await supabase
            .from('availability')
            .update({ is_available: available })
            .eq('player_id', playerId)
            .eq('match_date', matchDate);
        } else {
          // Insert new
          await supabase
            .from('availability')
            .insert({
              player_id: playerId,
              match_date: matchDate,
              is_available: available
            });
        }
      }
      
      await fetchAvailability();
      return { success: true };
    } catch (error) {
      console.error('Error setting availability:', error);
      alert('Error: ' + error.message);
      return { success: false, error };
    }
  }, [state.currentSeason, fetchAvailability]);

  const addMatchToSeason = useCallback(async (matchDate) => {
    if (!matchDate) throw new Error('Match date required');
    if (!state.currentSeason) throw new Error('No active season');
    
    try {
      const weekNumber = (state.currentSeason?.matches?.length || 0) + 1;
      
      const { error } = await supabase
        .from('matches')
        .insert({
          season_id: state.currentSeason.id,
          week_number: weekNumber,
          match_date: matchDate
        })
        .select();

      if (error) throw error;
      await fetchSeasons();
      return { success: true };
    } catch (error) {
      console.error('Error adding match:', error);
      alert('Error: ' + error.message);
      return { success: false, error };
    }
  }, [state.currentSeason, fetchSeasons]);

  const generateMatches = useCallback(async (matchId) => {
    const match = state.currentSeason?.matches?.find(m => m.id === matchId);
    if (!match) {
      alert('Match not found');
      return { success: false };
    }
    
    // Get available players
    const availablePlayers = state.users.filter(user => {
      if (!user.in_ladder || user.status !== 'approved') return false;
      const userAvailability = state.availability.find(
        a => a.player_id === user.id && a.match_date === match.match_date
      );
      return userAvailability?.is_available === true;
    }).sort((a, b) => (a.rank || 999) - (b.rank || 999));

    const numPlayers = availablePlayers.length;
    
    if (numPlayers < 4) {
      alert(`Need at least 4 players. Found ${numPlayers}.`);
      return { success: false };
    }

    const courts = [];

    // Court allocation logic
    if (numPlayers % 4 === 0) {
      for (let i = 0; i < numPlayers; i += 4) {
        courts.push(availablePlayers.slice(i, i + 4));
      }
    } else if (numPlayers === 5) {
      courts.push(availablePlayers);
    } else if (numPlayers === 9) {
      courts.push(availablePlayers.slice(0, 4));
      courts.push(availablePlayers.slice(4, 9));
    } else if (numPlayers === 10) {
      courts.push(availablePlayers.slice(0, 5));
      courts.push(availablePlayers.slice(5, 10));
    } else {
      const groups = Math.floor(numPlayers / 4);
      for (let i = 0; i < groups; i++) {
        courts.push(availablePlayers.slice(i * 4, (i + 1) * 4));
      }
      if (numPlayers % 4 > 0) {
        courts.push(availablePlayers.slice(groups * 4));
      }
    }

    try {
      const fixturesToInsert = [];

      courts.forEach((courtPlayers, courtIndex) => {
        const courtNumber = courtIndex + 1;
        let gameNumber = 1;

        if (courtPlayers.length === 5) {
          // 5-player rotation
          const rotations = [
            { pair1: [0, 1], pair2: [2, 3], sitting: 4 },
            { pair1: [0, 2], pair2: [1, 4], sitting: 3 },
            { pair1: [0, 3], pair2: [2, 4], sitting: 1 },
            { pair1: [0, 4], pair2: [1, 3], sitting: 2 },
            { pair1: [1, 2], pair2: [3, 4], sitting: 0 }
          ];

          rotations.forEach(rotation => {
            fixturesToInsert.push({
              match_id: matchId,
              court_number: courtNumber,
              game_number: gameNumber++,
              player1_id: courtPlayers[rotation.pair1[0]].id,
              player2_id: courtPlayers[rotation.pair1[1]].id,
              player3_id: courtPlayers[rotation.pair2[0]].id,
              player4_id: courtPlayers[rotation.pair2[1]].id,
              pair1_player1_id: courtPlayers[rotation.pair1[0]].id,
              pair1_player2_id: courtPlayers[rotation.pair1[1]].id,
              pair2_player1_id: courtPlayers[rotation.pair2[0]].id,
              pair2_player2_id: courtPlayers[rotation.pair2[1]].id,
              sitting_player_id: courtPlayers[rotation.sitting].id
            });
          });
        } else if (courtPlayers.length === 4) {
          // Standard 4-player format
          const rotations = [
            { pair1: [0, 3], pair2: [1, 2] },
            { pair1: [0, 2], pair2: [1, 3] },
            { pair1: [0, 1], pair2: [2, 3] }
          ];

          rotations.forEach(rotation => {
            fixturesToInsert.push({
              match_id: matchId,
              court_number: courtNumber,
              game_number: gameNumber++,
              player1_id: courtPlayers[rotation.pair1[0]].id,
              player2_id: courtPlayers[rotation.pair1[1]].id,
              player3_id: courtPlayers[rotation.pair2[0]].id,
              player4_id: courtPlayers[rotation.pair2[1]].id,
              pair1_player1_id: courtPlayers[rotation.pair1[0]].id,
              pair1_player2_id: courtPlayers[rotation.pair1[1]].id,
              pair2_player1_id: courtPlayers[rotation.pair2[0]].id,
              pair2_player2_id: courtPlayers[rotation.pair2[1]].id,
              sitting_player_id: null
            });
          });
        }
      });

      const { error } = await supabase
        .from('match_fixtures')
        .insert(fixturesToInsert);

      if (error) throw error;

      await Promise.all([
        fetchMatchFixtures(),
        fetchSeasons()
      ]);

      alert(`Matches generated! Created ${courts.length} court(s) with ${numPlayers} players.`);
      return { success: true };
    } catch (error) {
      console.error('Error generating matches:', error);
      alert('Error: ' + error.message);
      return { success: false, error };
    }
  }, [state.currentSeason, state.users, state.availability, fetchMatchFixtures, fetchSeasons]);

  const updateRankings = useCallback(async () => {
    try {
      console.log('Updating rankings...');
      
      // Get all match results with fixture data
      const { data: resultsData, error } = await supabase
        .from('match_results')
        .select(`
          *,
          fixture:fixture_id (
            *,
            player1:player1_id(id, name),
            player2:player2_id(id, name),
            player3:player3_id(id, name),
            player4:player4_id(id, name)
          )
        `);

      if (error) throw error;

      // Calculate stats for each ladder player
      const ladderPlayers = state.users.filter(u => u.in_ladder && u.status === 'approved');
      const playerStats = {};
      
      // Initialize stats
      ladderPlayers.forEach(player => {
        playerStats[player.id] = {
          name: player.name,
          matchesPlayed: 0,
          matchesWon: 0,
          gamesPlayed: 0,
          gamesWon: 0,
          winPercentage: 0
        };
      });

      // Process results
      resultsData.forEach(result => {
        const fixture = result.fixture;
        const players = [fixture.player1, fixture.player2, fixture.player3, fixture.player4];
        
        players.forEach(player => {
          if (player && playerStats[player.id]) {
            const stats = playerStats[player.id];
            stats.matchesPlayed += 1;
            stats.gamesPlayed += (result.pair1_score + result.pair2_score);
            
            const isInPair1 = (fixture.pair1_player1_id === player.id || fixture.pair1_player2_id === player.id);
            const wonMatch = isInPair1 ? result.pair1_score > result.pair2_score : result.pair2_score > result.pair1_score;
            const gamesWon = isInPair1 ? result.pair1_score : result.pair2_score;
            
            if (wonMatch) stats.matchesWon += 1;
            stats.gamesWon += gamesWon;
          }
        });
      });

      // Calculate win percentages
      Object.values(playerStats).forEach(stats => {
        stats.winPercentage = stats.gamesPlayed > 0 ? 
          Math.round((stats.gamesWon / stats.gamesPlayed) * 100 * 10) / 10 : 0;
      });

      // Sort players
      const sortedPlayers = ladderPlayers
        .map(player => ({
          ...player,
          calculatedStats: playerStats[player.id]
        }))
        .sort((a, b) => {
          const aStats = a.calculatedStats;
          const bStats = b.calculatedStats;
          
          if (bStats.winPercentage !== aStats.winPercentage) {
            return bStats.winPercentage - aStats.winPercentage;
          }
          
          if (bStats.matchesWon !== aStats.matchesWon) {
            return bStats.matchesWon - aStats.matchesWon;
          }
          
          return a.name.localeCompare(b.name);
        });

      // Update database
      for (let i = 0; i < sortedPlayers.length; i++) {
        const player = sortedPlayers[i];
        const stats = player.calculatedStats;
        const newRank = i + 1;
        const previousRank = player.rank;
        
        await supabase
          .from('profiles')
          .update({
            previous_rank: previousRank,
            rank: newRank,
            matches_played: stats.matchesPlayed,
            matches_won: stats.matchesWon,
            games_played: stats.gamesPlayed,
            games_won: stats.gamesWon
          })
          .eq('id', player.id);
      }

      await fetchUsers();
      alert('Rankings updated successfully!');
      return { success: true };
    } catch (error) {
      console.error('Error updating rankings:', error);
      alert('Error: ' + error.message);
      return { success: false, error };
    }
  }, [state.users, fetchUsers]);

  const clearOldMatches = useCallback(async () => {
    try {
      await supabase.from('match_results').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('match_fixtures').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('availability').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('matches').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      alert('All match data cleared!');
      await fetchSeasons();
      return { success: true };
    } catch (error) {
      console.error('Error clearing data:', error);
      alert('Error: ' + error.message);
      return { success: false, error };
    }
  }, [fetchSeasons]);

  // ====================
  // Helper Methods
  // ====================

  const getPlayerAvailability = useCallback((userId, matchId) => {
    const match = state.currentSeason?.matches?.find(m => m.id === matchId);
    if (!match) return undefined;
    
    const userAvailability = state.availability.find(
      a => a.player_id === userId && a.match_date === match.match_date
    );
    return userAvailability?.is_available;
  }, [state.currentSeason, state.availability]);

  const getAvailabilityStats = useCallback((matchId) => {
    const match = state.currentSeason?.matches?.find(m => m.id === matchId);
    if (!match) return { total: 0, available: 0, responded: 0, pending: 0 };
    
    const ladderPlayers = state.users.filter(u => u.in_ladder && u.status === 'approved');
    const availableCount = state.availability.filter(
      a => a.match_date === match.match_date && a.is_available === true
    ).length;
    const respondedCount = state.availability.filter(
      a => a.match_date === match.match_date && (a.is_available === true || a.is_available === false)
    ).length;
    
    return {
      total: ladderPlayers.length,
      available: availableCount,
      responded: respondedCount,
      pending: ladderPlayers.length - respondedCount
    };
  }, [state.currentSeason, state.users, state.availability]);

  const getMatchScore = useCallback((fixtureId) => {
    return state.matchResults.find(r => r.fixture_id === fixtureId);
  }, [state.matchResults]);

  // ====================
  // Initial Load
  // ====================

  useEffect(() => {
    if (!userId) {
      setLoading('initial', false);
      return;
    }

    const loadInitialData = async () => {
      console.log('🚀 Loading app data for user:', userId);
      setLoading('initial', true);
      
      try {
        // Load critical data first (what user sees immediately)
        await Promise.all([
          fetchUsers(),
          fetchSeasons(),
        ]);
        
        // Then load secondary data in parallel
        await Promise.all([
          fetchAvailability(),
          fetchMatchFixtures(),
          fetchMatchResults(),
        ]);
      } catch (error) {
        console.error('Error loading initial data:', error);
        updateData('error', error);
      } finally {
        setLoading('initial', false);
      }
    };

    loadInitialData();
  }, [userId]); // Only reload when userId changes

  // Listen for refresh events
  useEffect(() => {
    const handleRefreshMatchData = () => {
      console.log('📡 Refreshing match data...');
      Promise.all([
        fetchMatchResults(),
        fetchMatchFixtures(),
        fetchSeasons()
      ]);
    };

    window.addEventListener('refreshMatchData', handleRefreshMatchData);
    return () => window.removeEventListener('refreshMatchData', handleRefreshMatchData);
  }, [fetchMatchResults, fetchMatchFixtures, fetchSeasons]);

  return {
    // State
    ...state,
    
    // Actions
    actions: {
      approveUser,
      addToLadder,
      setPlayerAvailability,
      addMatchToSeason,
      generateMatches,
      updateRankings,
      clearOldMatches,
    },
    
    // Helpers
    helpers: {
      getPlayerAvailability,
      getAvailabilityStats,
      getMatchScore,
    },
    
    // Refetch functions
    refetch: {
      users: fetchUsers,
      seasons: fetchSeasons,
      availability: fetchAvailability,
      fixtures: fetchMatchFixtures,
      results: fetchMatchResults,
      all: () => Promise.all([
        fetchUsers(),
        fetchSeasons(),
        fetchAvailability(),
        fetchMatchFixtures(),
        fetchMatchResults(),
      ])
    }
  };
};