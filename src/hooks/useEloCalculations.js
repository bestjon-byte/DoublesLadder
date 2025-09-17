import { useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { 
  getMatchPrediction, 
  recalculateSeasonElos,
  updateMatchElos 
} from '../utils/eloCalculator';

export const useEloCalculations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const calculateMatchPrediction = useCallback(async (team1PlayerIds, team2PlayerIds, seasonId) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getMatchPrediction(team1PlayerIds, team2PlayerIds, seasonId);
      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getPlayerEloHistory = useCallback(async (playerId, seasonId, limit = 20) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: seasonPlayer } = await supabase
        .from('season_players')
        .select('id')
        .eq('player_id', playerId)
        .eq('season_id', seasonId)
        .single();

      if (!seasonPlayer) {
        return { success: false, message: 'Player not found in season' };
      }

      const { data: history, error: historyError } = await supabase
        .from('elo_history')
        .select(`
          *,
          match_fixture:match_fixtures(
            id,
            pair1_player1_id,
            pair1_player2_id,
            pair2_player1_id,
            pair2_player2_id,
            match:matches(match_date)
          )
        `)
        .eq('season_player_id', seasonPlayer.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (historyError) throw historyError;

      return { success: true, history };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getSeasonEloStats = useCallback(async (seasonId) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: seasonPlayers, error: playersError } = await supabase
        .from('season_players')
        .select(`
          elo_rating,
          player:profiles(name)
        `)
        .eq('season_id', seasonId)
        .not('elo_rating', 'is', null)
        .order('elo_rating', { ascending: false });

      if (playersError) throw playersError;

      const ratings = seasonPlayers.map(sp => sp.elo_rating).filter(Boolean);
      
      const stats = {
        totalPlayers: seasonPlayers.length,
        highestRating: Math.max(...ratings),
        lowestRating: Math.min(...ratings),
        averageRating: Math.round(ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length),
        topPlayers: seasonPlayers.slice(0, 5)
      };

      const { data: recentMatches, error: matchesError } = await supabase
        .from('elo_history')
        .select(`
          *,
          season_player:season_players(
            player:profiles(name)
          )
        `)
        .in('season_player_id', seasonPlayers.map(sp => sp.id))
        .order('created_at', { ascending: false })
        .limit(10);

      if (matchesError) throw matchesError;

      const biggestUpsets = recentMatches
        .filter(match => Math.abs(match.rating_change) > 30)
        .sort((a, b) => Math.abs(b.rating_change) - Math.abs(a.rating_change))
        .slice(0, 5);

      return { 
        success: true, 
        stats,
        recentMatches,
        biggestUpsets
      };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const triggerEloRecalculation = useCallback(async (seasonId, fromDate = null) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await recalculateSeasonElos(seasonId, fromDate);
      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSeasonEloSettings = useCallback(async (seasonId, settings) => {
    setLoading(true);
    setError(null);
    
    try {
      const { error: updateError } = await supabase
        .from('seasons')
        .update({
          elo_enabled: settings.eloEnabled,
          elo_k_factor: settings.kFactor,
          elo_initial_rating: settings.initialRating
        })
        .eq('id', seasonId);

      if (updateError) throw updateError;

      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const bulkUpdatePlayerElos = useCallback(async (seasonId, playerUpdates) => {
    setLoading(true);
    setError(null);
    
    try {
      for (const update of playerUpdates) {
        const { error: updateError } = await supabase
          .from('season_players')
          .update({ elo_rating: update.eloRating })
          .eq('season_id', seasonId)
          .eq('player_id', update.playerId);
        
        if (updateError) throw updateError;
      }

      return { success: true, updatedCount: playerUpdates.length };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const copyElosFromPreviousSeason = useCallback(async (currentSeasonId, previousSeasonId) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: previousPlayers, error: prevError } = await supabase
        .from('season_players')
        .select('player_id, elo_rating')
        .eq('season_id', previousSeasonId)
        .not('elo_rating', 'is', null);

      if (prevError) throw prevError;

      const { data: currentPlayers, error: currError } = await supabase
        .from('season_players')
        .select('id, player_id')
        .eq('season_id', currentSeasonId);

      if (currError) throw currError;

      let updatedCount = 0;
      
      for (const currentPlayer of currentPlayers) {
        const previousPlayer = previousPlayers.find(p => p.player_id === currentPlayer.player_id);
        
        if (previousPlayer) {
          const { error: updateError } = await supabase
            .from('season_players')
            .update({ elo_rating: previousPlayer.elo_rating })
            .eq('id', currentPlayer.id);
          
          if (updateError) throw updateError;
          updatedCount++;
        }
      }

      return { success: true, updatedCount };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    calculateMatchPrediction,
    getPlayerEloHistory,
    getSeasonEloStats,
    triggerEloRecalculation,
    updateSeasonEloSettings,
    bulkUpdatePlayerElos,
    copyElosFromPreviousSeason
  };
};