// src/hooks/useApp.js - ENHANCED FOR MULTI-SEASON
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

export const useApp = (userId, selectedSeasonId) => {
  const [state, setState] = useState({
    users: [],
    currentSeason: null,
    selectedSeason: null,
    seasonPlayers: [],
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

  // Create default season
  const createDefaultSeason = useCallback(async () => {
    try {
      await supabase
        .from('seasons')
        .update({ is_active: false })
        .eq('is_active', true);
      
      const { data: newSeason, error } = await supabase
        .from('seasons')
        .insert({
          name: `Season ${new Date().getFullYear()}`,
          start_date: new Date().toISOString().split('T')[0],
          is_active: true,
          status: 'active'
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

  // Fetch all users (for admin management)
  const fetchUsers = useCallback(async () => {
    setLoading('users', true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('name', { ascending: true }); // Changed from rank to name

      if (error) throw error;
      updateData('users', data || []);
      return data;
    } catch (error) {
      console.error('Error fetching users:', error);
      updateData('error', error);
    } finally {
      setLoading('users', false);
    }
  }, [setLoading, updateData]);

  // Fetch season-specific players (NEW - for ladder display)
  const fetchSeasonPlayers = useCallback(async (seasonId) => {
    if (!seasonId) return [];
    
    setLoading('users', true);
    try {
      const { data, error } = await supabase
        .from('season_players')
        .select(`
          *,
          profile:player_id (
            id,
            name,
            email,
            status,
            role
          )
        `)
        .eq('season_id', seasonId)
        .order('rank', { ascending: true, nullsLast: true });

      if (error) throw error;
      
      // Transform to match existing user structure
      const seasonUsers = data?.map(sp => ({
        ...sp.profile,
        rank: sp.rank,
        matches_played: sp.matches_played,
        matches_won: sp.matches_won,
        games_played: sp.games_played,
        games_won: sp.games_won,
        previous_rank: sp.previous_rank,
        in_ladder: true, // All season players are in ladder
        season_player_id: sp.id
      })) || [];

      updateData('seasonPlayers', seasonUsers);
      return seasonUsers;
    } catch (error) {
      console.error('Error fetching season players:', error);
      updateData('error', error);
      return [];
    } finally {
      setLoading('users', false);
    }
  }, [setLoading, updateData]);

  const fetchSeasons = useCallback(async () => {
    setLoading('seasons', true);
    try {
      // Get the active season
      const { data: activeSeasons, error } = await supabase
        .from('seasons')
        .select('*')
        .eq('status', 'active')
        .limit(1);
      
      if (error) throw error;
      
      let activeSeason = activeSeasons?.[0];
      
      if (!activeSeason) {
        console.log('No active season found, creating default...');
        activeSeason = await createDefaultSeason();
        if (!activeSeason) return;
      }
      
      // Get matches for this season
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
  }, [setLoading, updateData, createDefaultSeason]);

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
  }, [setLoading, updateData]);

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
  }, [setLoading, updateData]);

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
  }, [setLoading, updateData]);

  // Business logic functions
  const approveUser = useCallback(async (userIdToApprove) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'approved' })
        .eq('id', userIdToApprove);

      if (error) throw error;
      await fetchUsers();
      return { success: true };
    } catch (error) {
      console.error('Error approving user:', error);
      return { success: false, error };
    }
  }, [fetchUsers]);

  // Updated addToLadder for season-based system
  const addToLadder = useCallback(async (userIdToAdd, rank) => {
    console.log('🎾 addToLadder called with:', { userIdToAdd, rank, selectedSeasonId });
    
    if (!selectedSeasonId) {
      console.error('❌ No selectedSeasonId provided');
      alert('No season selected to add player to');
      return { success: false };
    }

    try {
      // Check if player already in season
      const { data: existing } = await supabase
        .from('season_players')
        .select('id')
        .eq('season_id', selectedSeasonId)
        .eq('player_id', userIdToAdd)
        .maybeSingle();

      if (existing) {
        alert('Player already in this season');
        return { success: false };
      }

      // Add player to season
      const { error } = await supabase
        .from('season_players')
        .insert({
          season_id: selectedSeasonId,
          player_id: userIdToAdd,
          rank: parseInt(rank) || null
        });

      if (error) throw error;

      await fetchSeasonPlayers(selectedSeasonId);
      await fetchUsers();
      return { success: true };
    } catch (error) {
      console.error('Error adding to season:', error);
      alert('Error: ' + error.message);
      return { success: false, error };
    }
  }, [selectedSeasonId, fetchSeasonPlayers, fetchUsers]);

  const setPlayerAvailability = useCallback(async (matchId, available, playerId) => {
    try {
      const match = state.currentSeason?.matches?.find(m => m.id === matchId);
      if (!match) throw new Error('Match not found');
      
      const matchDate = match.match_date;
      
      if (available === undefined) {
        await supabase
          .from('availability')
          .delete()
          .eq('player_id', playerId)
          .eq('match_date', matchDate);
      } else {
        const { data: existing } = await supabase
          .from('availability')
          .select('*')
          .eq('player_id', playerId)
          .eq('match_date', matchDate)
          .maybeSingle();
        
        if (existing) {
          await supabase
            .from('availability')
            .update({ is_available: available })
            .eq('player_id', playerId)
            .eq('match_date', matchDate);
        } else {
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
    console.log('🗓️ addMatchToSeason called with:', { matchDate, selectedSeasonId });
    
    if (!matchDate) {
      console.error('❌ No match date provided');
      alert('Please select a date for the match');
      return { success: false };
    }
    
    if (!selectedSeasonId) {
      console.error('❌ No selectedSeasonId provided');
      alert('No season selected');
      return { success: false };
    }
    
    // Use selectedSeasonId directly - this comes from the App component
    let activeSeason;
    try {
      const { data: season, error } = await supabase
        .from('seasons')
        .select('*')
        .eq('id', selectedSeasonId)
        .single();
      
      if (error) throw error;
      activeSeason = season;
    } catch (error) {
      console.error('Error fetching season:', error);
      alert('Error finding selected season');
      return { success: false };
    }
    
    if (!activeSeason) {
      alert('Selected season not found');
      return { success: false };
    }
    
    try {
      // Get existing matches for this season to calculate week number
      const { data: existingMatches } = await supabase
        .from('matches')
        .select('week_number')
        .eq('season_id', activeSeason.id)
        .order('week_number', { ascending: false })
        .limit(1);
      
      const weekNumber = (existingMatches?.[0]?.week_number || 0) + 1;
      
      const { error } = await supabase
        .from('matches')
        .insert({
          season_id: activeSeason.id,
          week_number: weekNumber,
          match_date: matchDate
        });

      if (error) throw error;
      
      console.log('✅ Match created successfully for week', weekNumber);
      
      // Refresh both useApp seasons AND useSeasonManager data
      await fetchSeasons(); // Refresh season data
      
      // Also trigger a custom event to refresh season manager
      window.dispatchEvent(new CustomEvent('refreshSeasonData'));
      
      alert(`Match created for Week ${weekNumber}`);
      return { success: true };
    } catch (error) {
      console.error('💥 Error adding match:', error);
      alert('Error: ' + error.message);
      return { success: false, error };
    }
  }, [selectedSeasonId, fetchSeasons]);

  const generateMatches = useCallback(async (matchId) => {
    const match = state.currentSeason?.matches?.find(m => m.id === matchId);
    if (!match) {
      alert('Match not found');
      return { success: false };
    }
    
    // Use seasonPlayers for match generation if viewing current season
    const playersToUse = selectedSeasonId === state.currentSeason?.id 
      ? state.seasonPlayers 
      : state.users;
    
    const availablePlayers = playersToUse.filter(user => {
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
  }, [state.currentSeason, state.seasonPlayers, state.users, state.availability, selectedSeasonId, fetchMatchFixtures, fetchSeasons]);

  // Updated ranking system for season-based stats
  const updateRankings = useCallback(async () => {
    if (!selectedSeasonId) {
      alert('No season selected for ranking update');
      return;
    }

    try {
      console.log('Updating rankings for season:', selectedSeasonId);
      
      // Get all match results for this season
      const { data: resultsData, error } = await supabase
        .from('match_results')
        .select(`
          *,
          fixture:fixture_id (
            *,
            match:match_id (
              season_id
            ),
            player1:player1_id(id, name),
            player2:player2_id(id, name),
            player3:player3_id(id, name),
            player4:player4_id(id, name)
          )
        `)
        .eq('fixture.match.season_id', selectedSeasonId);

      if (error) throw error;

      // Get season players
      const { data: seasonPlayers, error: playersError } = await supabase
        .from('season_players')
        .select('*')
        .eq('season_id', selectedSeasonId);

      if (playersError) throw playersError;

      // Calculate stats
      const playerStats = {};
      seasonPlayers.forEach(player => {
        playerStats[player.player_id] = {
          ...player,
          matches_played: 0,
          matches_won: 0,
          games_played: 0,
          games_won: 0
        };
      });

      // Process results
      resultsData?.forEach(result => {
        const fixture = result.fixture;
        const players = [fixture.player1, fixture.player2, fixture.player3, fixture.player4];
        
        players.forEach(player => {
          if (player && playerStats[player.id]) {
            const stats = playerStats[player.id];
            stats.matches_played += 1;
            stats.games_played += (result.pair1_score + result.pair2_score);
            
            const isInPair1 = (fixture.pair1_player1_id === player.id || fixture.pair1_player2_id === player.id);
            const wonMatch = isInPair1 ? result.pair1_score > result.pair2_score : result.pair2_score > result.pair1_score;
            const gamesWon = isInPair1 ? result.pair1_score : result.pair2_score;
            
            if (wonMatch) stats.matches_won += 1;
            stats.games_won += gamesWon;
          }
        });
      });

      // Sort and update rankings
      const sortedPlayers = Object.values(playerStats)
        .sort((a, b) => {
          const aWinPct = a.games_played > 0 ? a.games_won / a.games_played : 0;
          const bWinPct = b.games_played > 0 ? b.games_won / b.games_played : 0;
          
          if (bWinPct !== aWinPct) return bWinPct - aWinPct;
          if (b.matches_won !== a.matches_won) return b.matches_won - a.matches_won;
          return 0;
        });

      // Update rankings in season_players table
      for (let i = 0; i < sortedPlayers.length; i++) {
        const player = sortedPlayers[i];
        const newRank = i + 1;
        
        await supabase
          .from('season_players')
          .update({
            previous_rank: player.rank,
            rank: newRank,
            matches_played: player.matches_played,
            matches_won: player.matches_won,
            games_played: player.games_played,
            games_won: player.games_won
          })
          .eq('id', player.id);
      }

      // Refresh season players
      await fetchSeasonPlayers(selectedSeasonId);
      alert('Rankings updated successfully!');
      return { success: true };
    } catch (error) {
      console.error('Error updating rankings:', error);
      alert('Error updating rankings: ' + error.message);
      return { success: false, error };
    }
  }, [selectedSeasonId, fetchSeasonPlayers]);

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


  // Helper functions
  const getPlayerAvailability = useCallback((userIdToCheck, matchId) => {
    const match = state.currentSeason?.matches?.find(m => m.id === matchId);
    if (!match) return undefined;
    
    const userAvailability = state.availability.find(
      a => a.player_id === userIdToCheck && a.match_date === match.match_date
    );
    return userAvailability?.is_available;
  }, [state.currentSeason, state.availability]);

  const getAvailabilityStats = useCallback((matchId) => {
    const match = state.currentSeason?.matches?.find(m => m.id === matchId);
    if (!match) return { total: 0, available: 0, responded: 0, pending: 0 };
    
    const ladderPlayers = state.seasonPlayers.length > 0 ? state.seasonPlayers : state.users.filter(u => u.in_ladder && u.status === 'approved');
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
  }, [state.currentSeason, state.seasonPlayers, state.users, state.availability]);

  const getMatchScore = useCallback((fixtureId) => {
    const fixtureResults = state.matchResults.filter(r => r.fixture_id === fixtureId);
    
    // If no results, return null
    if (fixtureResults.length === 0) return null;
    
    // If only one result, return it
    if (fixtureResults.length === 1) return fixtureResults[0];
    
    // Multiple results - prioritize verified results, then most recent
    const verifiedResult = fixtureResults.find(r => r.verified === true);
    if (verifiedResult) return verifiedResult;
    
    // If no verified result, return the most recent
    return fixtureResults.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
  }, [state.matchResults]);

  const getMatchScoreHistory = useCallback((fixtureId) => {
    return state.matchResults
      .filter(r => r.fixture_id === fixtureId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [state.matchResults]);

  // Load season players when selectedSeasonId changes
  useEffect(() => {
    if (selectedSeasonId) {
      fetchSeasonPlayers(selectedSeasonId);
    }
  }, [selectedSeasonId, fetchSeasonPlayers]);

  // Initial load effect
  useEffect(() => {
    if (!userId) {
      setLoading('initial', false);
      return;
    }

    const loadInitialData = async () => {
      console.log('🚀 Loading app data for user:', userId);
      setLoading('initial', true);
      
      try {
        await Promise.all([
          fetchUsers(),
          fetchSeasons(),
        ]);
        
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
  }, [userId]);

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

  // Return everything
  return {
    ...state,
    // NEW: Provide both season players (for ladder) and all users (for admin)
    ladderPlayers: state.seasonPlayers, // Use this for ladder display
    allUsers: state.users, // Use this for admin user management
    actions: {
      approveUser,
      addToLadder,
      setPlayerAvailability,
      addMatchToSeason,
      generateMatches,
      updateRankings,
      clearOldMatches,
    },
    helpers: {
      getPlayerAvailability,
      getAvailabilityStats,
      getMatchScore,
      getMatchScoreHistory,
    },
    refetch: {
      users: fetchUsers,
      seasons: fetchSeasons,
      availability: fetchAvailability,
      fixtures: fetchMatchFixtures,
      results: fetchMatchResults,
      seasonPlayers: () => fetchSeasonPlayers(selectedSeasonId),
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