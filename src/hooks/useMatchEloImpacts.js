import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export const useMatchEloImpacts = (fixtureId, seasonId) => {
  const [eloImpacts, setEloImpacts] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!fixtureId || !seasonId) {
      setEloImpacts({});
      return;
    }

    const fetchAllEloImpacts = async () => {
      setLoading(true);
      try {
        // Get all ELO impacts for this specific fixture
        const { data: eloData, error: eloError } = await supabase
          .from('elo_history')
          .select(`
            old_rating,
            new_rating,
            rating_change,
            season_players!inner (
              player_id,
              profiles (
                id,
                name
              )
            )
          `)
          .eq('match_fixture_id', fixtureId);

        if (eloError) {
          console.error('Error fetching ELO impacts:', eloError);
          setEloImpacts({});
          return;
        }

        // Transform into a map by player ID
        const impactMap = {};
        if (eloData) {
          eloData.forEach(entry => {
            const playerId = entry.season_players?.player_id;
            const playerName = entry.season_players?.profiles?.name;
            if (playerId) {
              impactMap[playerId] = {
                change: entry.rating_change,
                oldRating: entry.old_rating,
                newRating: entry.new_rating,
                playerName: playerName
              };
            }
          });
        }

        setEloImpacts(impactMap);
      } catch (error) {
        console.error('Error fetching match ELO impacts:', error);
        setEloImpacts({});
      } finally {
        setLoading(false);
      }
    };

    fetchAllEloImpacts();
  }, [fixtureId, seasonId]);

  return { eloImpacts, loading };
};