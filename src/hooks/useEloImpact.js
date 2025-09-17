import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export const useEloImpact = (fixtureId, playerId, seasonId) => {
  const [eloImpact, setEloImpact] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!fixtureId || !playerId || !seasonId) {
      setEloImpact(null);
      return;
    }

    const fetchEloImpact = async () => {
      setLoading(true);
      try {
        // First get the season_player_id
        const { data: seasonPlayerData, error: seasonPlayerError } = await supabase
          .from('season_players')
          .select('id')
          .eq('player_id', playerId)
          .eq('season_id', seasonId)
          .single();

        if (seasonPlayerError || !seasonPlayerData) {
          setEloImpact(null);
          return;
        }

        // Get ELO impact for this specific fixture and player
        const { data: eloData, error: eloError } = await supabase
          .from('elo_history')
          .select('old_rating, new_rating, rating_change')
          .eq('season_player_id', seasonPlayerData.id)
          .eq('match_fixture_id', fixtureId)
          .single();

        if (eloError || !eloData) {
          setEloImpact(null);
        } else {
          setEloImpact({
            change: eloData.rating_change,
            oldRating: eloData.old_rating,
            newRating: eloData.new_rating
          });
        }
      } catch (error) {
        console.error('Error fetching ELO impact:', error);
        setEloImpact(null);
      } finally {
        setLoading(false);
      }
    };

    fetchEloImpact();
  }, [fixtureId, playerId, seasonId]);

  return { eloImpact, loading };
};