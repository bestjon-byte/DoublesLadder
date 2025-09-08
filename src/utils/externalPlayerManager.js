// External Player Management for League Expansion
// This module handles CRUD operations for external players (opposition clubs)

import { supabase } from '../supabaseClient';

/**
 * Get all external players, optionally filtered by club
 * @param {string} clubName - Optional club name filter
 * @returns {Promise<Array>} Array of external players
 */
export const getExternalPlayers = async (clubName = null) => {
  try {
    let query = supabase
      .from('external_players')
      .select('*')
      .order('name', { ascending: true });

    if (clubName) {
      query = query.eq('club_name', clubName);
    }

    const { data, error } = await query;
    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error fetching external players:', error);
    return { success: false, error, data: [] };
  }
};

/**
 * Get all external clubs (unique club names)
 * @returns {Promise<Array>} Array of club names
 */
export const getExternalClubs = async () => {
  try {
    const { data, error } = await supabase
      .from('external_players')
      .select('club_name')
      .not('club_name', 'is', null)
      .order('club_name');

    if (error) throw error;

    // Get unique club names
    const clubs = [...new Set(data?.map(p => p.club_name) || [])];
    return { success: true, data: clubs };
  } catch (error) {
    console.error('Error fetching external clubs:', error);
    return { success: false, error, data: [] };
  }
};

/**
 * Create a new external player
 * @param {Object} playerData - Player data {name, club_name}
 * @returns {Promise<Object>} Created player or error
 */
export const createExternalPlayer = async (playerData) => {
  try {
    const { name, club_name } = playerData;
    
    if (!name || !club_name) {
      throw new Error('Player name and club name are required');
    }

    const { data, error } = await supabase
      .from('external_players')
      .insert({
        name: name.trim(),
        club_name: club_name.trim(),
        total_rubbers_played: 0,
        total_games_won: 0,
        total_games_lost: 0
      })
      .select()
      .single();

    if (error) {
      // Handle unique constraint violation
      if (error.code === '23505') {
        throw new Error(`Player "${name}" already exists for club "${club_name}"`);
      }
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error creating external player:', error);
    return { success: false, error: error.message || error };
  }
};

/**
 * Update an external player
 * @param {string} playerId - Player UUID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated player or error
 */
export const updateExternalPlayer = async (playerId, updates) => {
  try {
    const { data, error } = await supabase
      .from('external_players')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', playerId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error updating external player:', error);
    return { success: false, error: error.message || error };
  }
};

/**
 * Delete an external player
 * @param {string} playerId - Player UUID
 * @returns {Promise<Object>} Success status
 */
export const deleteExternalPlayer = async (playerId) => {
  try {
    // Check if player has any match history first
    const { data: rubbers, error: rubbersError } = await supabase
      .from('league_match_rubbers')
      .select('id')
      .or(`opponent_player1_id.eq.${playerId},opponent_player2_id.eq.${playerId}`)
      .limit(1);

    if (rubbersError) throw rubbersError;

    if (rubbers && rubbers.length > 0) {
      throw new Error('Cannot delete player with existing match history');
    }

    const { error } = await supabase
      .from('external_players')
      .delete()
      .eq('id', playerId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error deleting external player:', error);
    return { success: false, error: error.message || error };
  }
};

/**
 * Search external players by name (auto-complete support)
 * @param {string} searchTerm - Search term
 * @param {string} clubName - Optional club filter
 * @param {number} limit - Max results (default 10)
 * @returns {Promise<Array>} Matching players
 */
export const searchExternalPlayers = async (searchTerm, clubName = null, limit = 10) => {
  try {
    let query = supabase
      .from('external_players')
      .select('*')
      .ilike('name', `%${searchTerm}%`)
      .order('name')
      .limit(limit);

    if (clubName) {
      query = query.eq('club_name', clubName);
    }

    const { data, error } = await query;
    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error searching external players:', error);
    return { success: false, error, data: [] };
  }
};

/**
 * Get external player statistics
 * @param {string} playerId - Player UUID
 * @returns {Promise<Object>} Player stats
 */
export const getExternalPlayerStats = async (playerId) => {
  try {
    const { data: player, error } = await supabase
      .from('external_players')
      .select('*')
      .eq('id', playerId)
      .single();

    if (error) throw error;

    // Calculate win percentage
    const totalGames = player.total_games_won + player.total_games_lost;
    const winPercentage = totalGames > 0 ? (player.total_games_won / totalGames * 100) : 0;

    return {
      success: true,
      data: {
        ...player,
        win_percentage: winPercentage.toFixed(1),
        total_games: totalGames
      }
    };
  } catch (error) {
    console.error('Error fetching external player stats:', error);
    return { success: false, error };
  }
};

/**
 * Bulk create external players (for importing teams)
 * @param {Array} playersData - Array of player objects
 * @returns {Promise<Object>} Results of bulk creation
 */
export const bulkCreateExternalPlayers = async (playersData) => {
  try {
    const { data, error } = await supabase
      .from('external_players')
      .insert(playersData.map(player => ({
        name: player.name.trim(),
        club_name: player.club_name.trim(),
        total_rubbers_played: 0,
        total_games_won: 0,
        total_games_lost: 0
      })))
      .select();

    if (error) throw error;

    return { success: true, data, created: data?.length || 0 };
  } catch (error) {
    console.error('Error bulk creating external players:', error);
    return { success: false, error: error.message || error };
  }
};

/**
 * Get external players with their recent match history
 * @param {string} clubName - Optional club filter
 * @param {number} limit - Max recent matches to include
 * @returns {Promise<Array>} Players with match history
 */
export const getExternalPlayersWithHistory = async (clubName = null, matchLimit = 5) => {
  try {
    let query = supabase
      .from('external_players')
      .select(`
        *,
        opponent_rubbers_1:league_match_rubbers!opponent_player1_id(
          id,
          rubber_number,
          cawood_games_won,
          opponent_games_won,
          created_at,
          match_fixture:match_fixtures(
            id,
            match_id,
            opponent_club,
            team
          )
        ),
        opponent_rubbers_2:league_match_rubbers!opponent_player2_id(
          id,
          rubber_number,
          cawood_games_won,
          opponent_games_won,
          created_at,
          match_fixture:match_fixtures(
            id,
            match_id,
            opponent_club,
            team
          )
        )
      `)
      .order('name');

    if (clubName) {
      query = query.eq('club_name', clubName);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Process the data to combine match history and limit results
    const processedData = data?.map(player => {
      const allRubbers = [
        ...(player.opponent_rubbers_1 || []),
        ...(player.opponent_rubbers_2 || [])
      ];

      // Sort by date and limit
      const recentMatches = allRubbers
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, matchLimit);

      return {
        ...player,
        recent_matches: recentMatches,
        total_matches: allRubbers.length
      };
    }) || [];

    return { success: true, data: processedData };
  } catch (error) {
    console.error('Error fetching external players with history:', error);
    return { success: false, error, data: [] };
  }
};