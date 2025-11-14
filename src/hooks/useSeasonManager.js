import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

export const useSeasonManager = (isAuthenticated = false) => {
  const [seasons, setSeasons] = useState([]);
  const [activeSeason, setActiveSeason] = useState(null);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all seasons (NEW: includes league expansion support)
  const fetchSeasons = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('seasons')
        .select(`
          *,
          season_players(count)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [useSeasonManager] Database error:', error);
        throw error;
      }

      // Process the data to add counts and league info
      const processedSeasons = data?.map(season => ({
        ...season,
        player_count: season.season_players?.[0]?.count || 0,
        // NEW: Parse league_info JSON and add season type
        season_type: season.season_type || 'ladder',
        league_info: season.league_info || {},
        // NEW: Helper properties for UI display
        display_name: season.name + (season.season_type === 'league' ? ` (${season.season_type})` : ''),
        is_league: season.season_type === 'league'
      })) || [];

      setSeasons(processedSeasons);
      
      // NEW: Find all active seasons (multiple allowed now)
      const activeSeasons = processedSeasons.filter(s => s.status === 'active');
      
      // Keep track of the "primary" active season for backward compatibility
      const primaryActive = activeSeasons.length > 0 ? activeSeasons[0] : null;
      setActiveSeason(primaryActive);
      
      // Set selected season to primary active if none selected  
      if (!selectedSeason && primaryActive) {
        setSelectedSeason(primaryActive);
      }

      return processedSeasons;
    } catch (error) {
      console.error('Error fetching seasons:', error);
      setError(error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [selectedSeason]);

  // Create new season (NEW: supports league seasons and multiple active seasons)
  const createNewSeason = useCallback(async (seasonData) => {
    try {
      setLoading(true);
      
      // NEW: Don't auto-complete existing seasons - allow multiple active seasons
      // Only complete if explicitly requested for ladder seasons
      if (seasonData.completeExistingSeason && activeSeason && seasonData.season_type === 'ladder') {
        await supabase
          .from('seasons')
          .update({ 
            status: 'completed',
            end_date: new Date().toISOString().split('T')[0]
          })
          .eq('id', activeSeason.id);
      }

      // Create new season with league expansion support
      const { data: newSeason, error: seasonError } = await supabase
        .from('seasons')
        .insert({
          name: seasonData.name,
          start_date: seasonData.start_date,
          status: 'active',
          // NEW: League expansion fields
          season_type: seasonData.season_type || 'ladder',
          league_info: seasonData.league_info || {},
          // NEW: ELO rating system fields
          elo_enabled: seasonData.elo_enabled || false,
          elo_k_factor: seasonData.elo_k_factor || 32,
          elo_initial_rating: seasonData.elo_initial_rating || 1200
        })
        .select()
        .single();

      if (seasonError) throw seasonError;

      // Copy players from previous season if requested (only for ladder seasons)
      if (seasonData.carryOverPlayers && seasonData.season_type === 'ladder' && activeSeason) {
        const { data: previousPlayers, error: playersError } = await supabase
          .from('season_players')
          .select('*')
          .eq('season_id', activeSeason.id)
          .order('rank', { ascending: true });

        if (playersError) throw playersError;

        if (previousPlayers.length > 0) {
          const newSeasonPlayers = previousPlayers.map(player => ({
            season_id: newSeason.id,
            player_id: player.player_id,
            rank: player.rank,
            matches_played: 0,
            matches_won: 0,
            games_played: 0,
            games_won: 0,
            previous_rank: null,
            // NEW: Set ELO rating based on new season settings
            elo_rating: newSeason.elo_enabled ? (player.elo_rating || newSeason.elo_initial_rating) : null
          }));

          const { error: insertError } = await supabase
            .from('season_players')
            .insert(newSeasonPlayers);

          if (insertError) throw insertError;
        }
      }

      await fetchSeasons();
      setSelectedSeason(newSeason);
      
      return { success: true, season: newSeason };
    } catch (error) {
      console.error('Error creating season:', error);
      setError(error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [activeSeason, fetchSeasons]);

  // Complete current season
  const completeSeason = useCallback(async (seasonId) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('seasons')
        .update({ 
          status: 'completed',
          end_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', seasonId);

      if (error) throw error;

      await fetchSeasons();
      return { success: true };
    } catch (error) {
      console.error('Error completing season:', error);
      setError(error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [fetchSeasons]);

  // Initialize on mount - but ONLY if authenticated
  useEffect(() => {
    // Don't load seasons until user is authenticated
    if (!isAuthenticated) {
      setLoading(false); // Set loading to false so app doesn't hang
      return;
    }

    const initializeSeasons = async () => {

      // Set timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.error('❌ [useSeasonManager] TIMEOUT: Season initialization timeout (8s) - forcing loading to false');
        setLoading(false);
        setError(new Error('Season loading timeout - please refresh the page'));
      }, 8000); // 8 second timeout

      try {
        await fetchSeasons();
        clearTimeout(timeoutId);
      } catch (error) {
        console.error('❌ [useSeasonManager] Season initialization failed:', error);
        setError(error);
        clearTimeout(timeoutId);
        setLoading(false);
      }
    };

    initializeSeasons();
  }, [isAuthenticated, fetchSeasons]);

  // Listen for refresh events from other components
  useEffect(() => {
    const handleRefreshSeasonData = () => {
      // Refresh season data on external request
      fetchSeasons();
    };

    window.addEventListener('refreshSeasonData', handleRefreshSeasonData);
    return () => window.removeEventListener('refreshSeasonData', handleRefreshSeasonData);
  }, [fetchSeasons]);

  // NEW: Get active seasons (multiple allowed now)
  const getActiveSeasons = useCallback(() => {
    return seasons.filter(s => s.status === 'active');
  }, [seasons]);

  // NEW: Get seasons by type
  const getSeasonsByType = useCallback((type) => {
    return seasons.filter(s => s.season_type === type);
  }, [seasons]);

  // NEW: Check if season is league type
  const isLeagueSeason = useCallback((season) => {
    return season?.season_type === 'league';
  }, []);

  return {
    seasons,
    activeSeason,
    selectedSeason,
    loading,
    error,
    // NEW: Additional data for league expansion
    activeSeasons: getActiveSeasons(),
    ladderSeasons: getSeasonsByType('ladder'),
    leagueSeasons: getSeasonsByType('league'),
    actions: {
      createNewSeason,
      completeSeason,
      setSelectedSeason,
      fetchSeasons,
      // NEW: Helper functions
      getActiveSeasons,
      getSeasonsByType,
      isLeagueSeason
    }
  };
};