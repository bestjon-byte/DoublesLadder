// League Match Management for League Expansion
// This module handles league match fixtures and rubber results

import { supabase } from '../supabaseClient';

/**
 * Create a new league match fixture
 * @param {Object} matchData - Match data
 * @returns {Promise<Object>} Created match fixture
 */
export const createLeagueMatch = async (matchData) => {
  try {
    const {
      season_id,
      match_date,
      week_number,
      team, // '1sts' or '2nds'
      opponent_club
    } = matchData;

    // 1. Create the base match record
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .insert({
        season_id,
        week_number,
        match_date
      })
      .select()
      .single();

    if (matchError) throw matchError;

    // 2. Create the match fixture for league format
    const { data: fixture, error: fixtureError } = await supabase
      .from('match_fixtures')
      .insert({
        match_id: match.id,
        match_type: 'league',
        team,
        opponent_club,
        week_number,
        // League matches don't use the old pair structure
        court_number: 1,
        game_number: 1,
        // Set placeholder players (will be replaced by rubber system)
        player1_id: null,
        player2_id: null,
        player3_id: null,
        player4_id: null,
        pair1_player1_id: null,
        pair1_player2_id: null,
        pair2_player1_id: null,
        pair2_player2_id: null
      })
      .select()
      .single();

    if (fixtureError) throw fixtureError;

    return {
      success: true,
      data: {
        match,
        fixture
      }
    };
  } catch (error) {
    console.error('Error creating league match:', error);
    return { success: false, error: error.message || error };
  }
};

/**
 * Submit league match results (all 9 rubbers)
 * @param {Object} matchResults - Complete match results
 * @returns {Promise<Object>} Success status
 */
export const submitLeagueMatchResults = async (matchResults) => {
  try {
    const {
      fixture_id,
      rubbers // Array of 9 rubber results
    } = matchResults;

    if (!rubbers || rubbers.length !== 9) {
      throw new Error('League matches must have exactly 9 rubber results');
    }

    // Validate each rubber
    rubbers.forEach((rubber, index) => {
      if (!rubber.cawood_player1_id || !rubber.cawood_player2_id) {
        throw new Error(`Rubber ${index + 1}: Cawood players are required`);
      }
      if (!rubber.opponent_player1_id || !rubber.opponent_player2_id) {
        throw new Error(`Rubber ${index + 1}: Opponent players are required`);
      }
      if (rubber.cawood_games_won + rubber.opponent_games_won !== 12) {
        throw new Error(`Rubber ${index + 1}: Games must total 12`);
      }
    });

    // Insert all rubbers
    const rubberData = rubbers.map((rubber, index) => ({
      match_fixture_id: fixture_id,
      rubber_number: index + 1,
      cawood_player1_id: rubber.cawood_player1_id,
      cawood_player2_id: rubber.cawood_player2_id,
      opponent_player1_id: rubber.opponent_player1_id,
      opponent_player2_id: rubber.opponent_player2_id,
      cawood_games_won: rubber.cawood_games_won,
      opponent_games_won: rubber.opponent_games_won
    }));

    const { data, error } = await supabase
      .from('league_match_rubbers')
      .insert(rubberData)
      .select();

    if (error) throw error;

    // Update season player stats
    await updateSeasonPlayerStats(fixture_id, rubbers);

    return { success: true, data };
  } catch (error) {
    console.error('Error submitting league match results:', error);
    return { success: false, error: error.message || error };
  }
};

/**
 * Update season player statistics based on league match results
 * @param {string} fixture_id - Match fixture ID
 * @param {Array} rubbers - Rubber results
 */
const updateSeasonPlayerStats = async (fixture_id, rubbers) => {
  try {
    // Get season ID from fixture
    const { data: fixture, error: fixtureError } = await supabase
      .from('match_fixtures')
      .select(`
        match_id,
        matches!inner(season_id)
      `)
      .eq('id', fixture_id)
      .single();

    if (fixtureError) throw fixtureError;

    const season_id = fixture.matches.season_id;

    // Calculate player stats from rubbers
    const playerStats = {};

    rubbers.forEach(rubber => {
      const cawoodWon = rubber.cawood_games_won > rubber.opponent_games_won;
      
      // Update Cawood player 1 stats
      if (!playerStats[rubber.cawood_player1_id]) {
        playerStats[rubber.cawood_player1_id] = {
          rubbers: 0,
          wins: 0,
          games_won: 0,
          games_lost: 0
        };
      }
      playerStats[rubber.cawood_player1_id].rubbers += 1;
      playerStats[rubber.cawood_player1_id].wins += cawoodWon ? 1 : 0;
      playerStats[rubber.cawood_player1_id].games_won += rubber.cawood_games_won;
      playerStats[rubber.cawood_player1_id].games_lost += rubber.opponent_games_won;

      // Update Cawood player 2 stats
      if (!playerStats[rubber.cawood_player2_id]) {
        playerStats[rubber.cawood_player2_id] = {
          rubbers: 0,
          wins: 0,
          games_won: 0,
          games_lost: 0
        };
      }
      playerStats[rubber.cawood_player2_id].rubbers += 1;
      playerStats[rubber.cawood_player2_id].wins += cawoodWon ? 1 : 0;
      playerStats[rubber.cawood_player2_id].games_won += rubber.cawood_games_won;
      playerStats[rubber.cawood_player2_id].games_lost += rubber.opponent_games_won;
    });

    // Update season_players table
    for (const [playerId, stats] of Object.entries(playerStats)) {
      await supabase.rpc('update_season_player_league_stats', {
        p_season_id: season_id,
        p_player_id: playerId,
        p_additional_rubbers: stats.rubbers,
        p_additional_wins: stats.wins,
        p_additional_games_won: stats.games_won,
        p_additional_games_lost: stats.games_lost
      });
    }

  } catch (error) {
    console.error('Error updating season player stats:', error);
  }
};

/**
 * Get league match results
 * @param {string} fixture_id - Match fixture ID
 * @returns {Promise<Object>} Match results with rubbers
 */
export const getLeagueMatchResults = async (fixture_id) => {
  try {
    const { data: rubbers, error } = await supabase
      .from('league_match_rubbers')
      .select(`
        *,
        cawood_player1:profiles!cawood_player1_id(id, name),
        cawood_player2:profiles!cawood_player2_id(id, name),
        opponent_player1:external_players!opponent_player1_id(id, name, club_name),
        opponent_player2:external_players!opponent_player2_id(id, name, club_name)
      `)
      .eq('match_fixture_id', fixture_id)
      .order('rubber_number');

    if (error) throw error;

    return { success: true, data: rubbers || [] };
  } catch (error) {
    console.error('Error fetching league match results:', error);
    return { success: false, error, data: [] };
  }
};

/**
 * Get all league matches for a season
 * @param {string} season_id - Season ID
 * @param {string} team - Optional team filter ('1sts' or '2nds')
 * @returns {Promise<Array>} League matches
 */
export const getLeagueMatches = async (season_id, team = null) => {
  try {
    let query = supabase
      .from('match_fixtures')
      .select(`
        *,
        matches!inner(
          id,
          season_id,
          match_date,
          week_number
        ),
        league_match_rubbers(
          id,
          rubber_number,
          cawood_games_won,
          opponent_games_won
        )
      `)
      .eq('matches.season_id', season_id)
      .eq('match_type', 'league')
      .order('matches.week_number', { ascending: true });

    if (team) {
      query = query.eq('team', team);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Process results to add match totals
    const processedMatches = data?.map(match => {
      const rubbers = match.league_match_rubbers || [];
      const cawoodRubberWins = rubbers.filter(r => r.cawood_games_won > r.opponent_games_won).length;
      const opponentRubberWins = rubbers.filter(r => r.opponent_games_won > r.cawood_games_won).length;
      const totalCawoodGames = rubbers.reduce((sum, r) => sum + r.cawood_games_won, 0);
      const totalOpponentGames = rubbers.reduce((sum, r) => sum + r.opponent_games_won, 0);

      return {
        ...match,
        match_date: match.matches.match_date,
        week_number: match.matches.week_number,
        rubbers_played: rubbers.length,
        cawood_rubber_wins: cawoodRubberWins,
        opponent_rubber_wins: opponentRubberWins,
        cawood_games_won: totalCawoodGames,
        opponent_games_won: totalOpponentGames,
        match_complete: rubbers.length === 9
      };
    }) || [];

    return { success: true, data: processedMatches };
  } catch (error) {
    console.error('Error fetching league matches:', error);
    return { success: false, error, data: [] };
  }
};

/**
 * Delete league match and all its rubbers
 * @param {string} fixture_id - Match fixture ID
 * @returns {Promise<Object>} Success status
 */
export const deleteLeagueMatch = async (fixture_id) => {
  try {
    // Rubbers will be deleted automatically due to CASCADE constraint
    const { error } = await supabase
      .from('match_fixtures')
      .delete()
      .eq('id', fixture_id);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error deleting league match:', error);
    return { success: false, error: error.message || error };
  }
};

/**
 * Update a single rubber result
 * @param {string} rubber_id - Rubber ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated rubber
 */
export const updateLeagueRubber = async (rubber_id, updates) => {
  try {
    // Validate game totals if scores are being updated
    if (updates.cawood_games_won !== undefined && updates.opponent_games_won !== undefined) {
      if (updates.cawood_games_won + updates.opponent_games_won !== 12) {
        throw new Error('Games must total 12');
      }
    }

    const { data, error } = await supabase
      .from('league_match_rubbers')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', rubber_id)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error updating league rubber:', error);
    return { success: false, error: error.message || error };
  }
};

/**
 * Get league statistics for a season
 * @param {string} season_id - Season ID
 * @returns {Promise<Object>} League statistics
 */
export const getLeagueSeasonStats = async (season_id) => {
  try {
    // Get all league matches for the season
    const matchesResult = await getLeagueMatches(season_id);
    if (!matchesResult.success) {
      throw new Error('Failed to fetch league matches');
    }

    const matches = matchesResult.data;
    const stats = {
      total_matches: matches.length,
      completed_matches: matches.filter(m => m.match_complete).length,
      teams: {
        '1sts': matches.filter(m => m.team === '1sts').length,
        '2nds': matches.filter(m => m.team === '2nds').length
      },
      rubber_stats: {
        total_rubbers: matches.reduce((sum, m) => sum + m.rubbers_played, 0),
        cawood_rubber_wins: matches.reduce((sum, m) => sum + m.cawood_rubber_wins, 0),
        opponent_rubber_wins: matches.reduce((sum, m) => sum + m.opponent_rubber_wins, 0)
      },
      game_stats: {
        cawood_games_won: matches.reduce((sum, m) => sum + m.cawood_games_won, 0),
        opponent_games_won: matches.reduce((sum, m) => sum + m.opponent_games_won, 0)
      },
      opponents: [...new Set(matches.map(m => m.opponent_club))].sort()
    };

    // Calculate percentages
    stats.rubber_stats.cawood_win_percentage = stats.rubber_stats.total_rubbers > 0 
      ? (stats.rubber_stats.cawood_rubber_wins / stats.rubber_stats.total_rubbers * 100).toFixed(1)
      : '0.0';

    stats.game_stats.cawood_win_percentage = (stats.game_stats.cawood_games_won + stats.game_stats.opponent_games_won) > 0
      ? (stats.game_stats.cawood_games_won / (stats.game_stats.cawood_games_won + stats.game_stats.opponent_games_won) * 100).toFixed(1)
      : '0.0';

    return { success: true, data: stats };
  } catch (error) {
    console.error('Error calculating league season stats:', error);
    return { success: false, error: error.message || error };
  }
};