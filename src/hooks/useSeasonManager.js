import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

export const useSeasonManager = () => {
  const [seasons, setSeasons] = useState([]);
  const [activeSeason, setActiveSeason] = useState(null);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all seasons
  const fetchSeasons = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('seasons')
        .select(`
          *,
          season_players(count),
          matches(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process the data to add counts and matches
      const processedSeasons = data?.map(season => ({
        ...season,
        player_count: season.season_players?.[0]?.count || 0,
        match_count: season.matches?.length || 0,
        matches: season.matches || [] // Include actual matches data
      })) || [];

      console.log('📊 Processed seasons data:', processedSeasons.map(s => ({ 
        id: s.id, 
        name: s.name, 
        matchCount: s.matches?.length,
        matches: s.matches?.map(m => ({ id: m.id, week: m.week_number, date: m.match_date }))
      })));

      setSeasons(processedSeasons);
      
      // Find and set active season
      const active = processedSeasons.find(s => s.status === 'active');
      setActiveSeason(active);
      
      console.log('🎯 Setting activeSeason:', active ? { id: active.id, matchCount: active.matches?.length } : 'null');
      
      // Set selected season to active if none selected  
      if (!selectedSeason && active) {
        setSelectedSeason(active);
        console.log('🎯 Auto-selected season:', active.name);
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

  // Create new season
  const createNewSeason = useCallback(async (seasonData) => {
    try {
      setLoading(true);
      
      // 1. Mark current season as completed
      if (activeSeason) {
        await supabase
          .from('seasons')
          .update({ 
            status: 'completed',
            end_date: new Date().toISOString().split('T')[0]
          })
          .eq('id', activeSeason.id);
      }

      // 2. Create new season
      const { data: newSeason, error: seasonError } = await supabase
        .from('seasons')
        .insert({
          name: seasonData.name,
          start_date: seasonData.start_date,
          status: 'active'
        })
        .select()
        .single();

      if (seasonError) throw seasonError;

      // 3. Copy players from previous season if requested
      if (seasonData.carryOverPlayers && activeSeason) {
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
            previous_rank: null
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

  // Initialize on mount
  useEffect(() => {
    const initializeSeasons = async () => {
      // Set timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.warn('⏰ Season initialization timeout - forcing loading to false');
        setLoading(false);
        setError(new Error('Season loading timeout - please refresh the page'));
      }, 8000); // 8 second timeout
      
      try {
        await fetchSeasons();
        clearTimeout(timeoutId);
      } catch (error) {
        console.error('💥 Season initialization failed:', error);
        setError(error);
        clearTimeout(timeoutId);
        setLoading(false);
      }
    };
    
    // Start immediately - no need to wait for auth
    initializeSeasons();
  }, [fetchSeasons]);

  // Listen for refresh events from other components
  useEffect(() => {
    const handleRefreshSeasonData = () => {
      console.log('🔄 Refreshing season data...');
      fetchSeasons().then(() => {
        console.log('✅ Season data refreshed');
      });
    };

    window.addEventListener('refreshSeasonData', handleRefreshSeasonData);
    return () => window.removeEventListener('refreshSeasonData', handleRefreshSeasonData);
  }, [fetchSeasons]);

  return {
    seasons,
    activeSeason,
    selectedSeason,
    loading,
    error,
    actions: {
      createNewSeason,
      completeSeason,
      setSelectedSeason,
      fetchSeasons
    }
  };
};