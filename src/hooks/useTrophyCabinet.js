// src/hooks/useTrophyCabinet.js
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

export const useTrophyCabinet = (currentUserId) => {
  const [trophies, setTrophies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTrophies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('trophy_cabinet')
        .select(`
          *,
          seasons (
            id,
            name,
            season_type
          ),
          winner1:winner_player1_id (
            id,
            name
          ),
          winner2:winner_player2_id (
            id,
            name
          ),
          created_by_user:created_by (
            id,
            name
          )
        `)
        .order('display_order', { ascending: true })
        .order('awarded_date', { ascending: false });

      if (fetchError) throw fetchError;

      // Process the data to add computed fields
      const processedTrophies = data.map(trophy => ({
        ...trophy,
        season_name: trophy.seasons?.name || 'Unknown Season',
        winner1_name: trophy.winner1?.name || 'Unknown Winner',
        winner2_name: trophy.winner2?.name || null,
        created_by_name: trophy.created_by_user?.name || 'Unknown'
      }));

      setTrophies(processedTrophies);
    } catch (err) {
      console.error('Error fetching trophies:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const addTrophy = useCallback(async (trophyData) => {
    try {
      setError(null);

      // Clean the data - convert empty strings to null for UUID fields
      const cleanedData = {
        ...trophyData,
        season_id: trophyData.season_id || null,
        winner_player1_id: trophyData.winner_player1_id || null,
        winner_player2_id: trophyData.winner_player2_id || null,
        created_by: currentUserId
      };

      const { data, error: insertError } = await supabase
        .from('trophy_cabinet')
        .insert([cleanedData])
        .select(`
          *,
          seasons (
            id,
            name,
            season_type
          ),
          winner1:winner_player1_id (
            id,
            name
          ),
          winner2:winner_player2_id (
            id,
            name
          )
        `)
        .single();

      if (insertError) throw insertError;

      // Process the new trophy
      const processedTrophy = {
        ...data,
        season_name: data.seasons?.name || 'Unknown Season',
        winner1_name: data.winner1?.name || 'Unknown Winner',
        winner2_name: data.winner2?.name || null
      };

      setTrophies(prev => [processedTrophy, ...prev]);
      return { success: true, trophy: processedTrophy };
    } catch (err) {
      console.error('Error adding trophy:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [currentUserId]);

  const updateTrophy = useCallback(async (trophyId, updates) => {
    try {
      setError(null);

      // Clean the updates - convert empty strings to null for UUID fields
      const cleanedUpdates = {
        ...updates,
        season_id: updates.season_id || null,
        winner_player1_id: updates.winner_player1_id || null,
        winner_player2_id: updates.winner_player2_id || null
      };

      const { data, error: updateError } = await supabase
        .from('trophy_cabinet')
        .update(cleanedUpdates)
        .eq('id', trophyId)
        .select(`
          *,
          seasons (
            id,
            name,
            season_type
          ),
          winner1:winner_player1_id (
            id,
            name
          ),
          winner2:winner_player2_id (
            id,
            name
          )
        `)
        .single();

      if (updateError) throw updateError;

      // Process the updated trophy
      const processedTrophy = {
        ...data,
        season_name: data.seasons?.name || 'Unknown Season',
        winner1_name: data.winner1?.name || 'Unknown Winner',
        winner2_name: data.winner2?.name || null
      };

      setTrophies(prev =>
        prev.map(trophy =>
          trophy.id === trophyId ? processedTrophy : trophy
        )
      );
      return { success: true, trophy: processedTrophy };
    } catch (err) {
      console.error('Error updating trophy:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, []);

  const deleteTrophy = useCallback(async (trophyId) => {
    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from('trophy_cabinet')
        .delete()
        .eq('id', trophyId);

      if (deleteError) throw deleteError;

      setTrophies(prev => prev.filter(trophy => trophy.id !== trophyId));
      return { success: true };
    } catch (err) {
      console.error('Error deleting trophy:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, []);

  const awardTrophy = useCallback(async (seasonId, trophyData) => {
    // Convenience method for awarding trophies from season results
    const fullTrophyData = {
      season_id: seasonId,
      awarded_date: new Date().toISOString().split('T')[0],
      display_order: 0,
      is_featured: false,
      ...trophyData
    };

    return await addTrophy(fullTrophyData);
  }, [addTrophy]);

  const getTrophiesByPlayer = useCallback((playerId) => {
    return trophies.filter(trophy => 
      trophy.winner_player1_id === playerId || 
      trophy.winner_player2_id === playerId
    );
  }, [trophies]);

  const getTrophiesBySeason = useCallback((seasonId) => {
    return trophies.filter(trophy => trophy.season_id === seasonId);
  }, [trophies]);

  const getFeaturedTrophies = useCallback(() => {
    return trophies.filter(trophy => trophy.is_featured);
  }, [trophies]);

  // Trophy statistics
  const getTrophyStats = useCallback(() => {
    const stats = {
      total: trophies.length,
      byType: {},
      byCompetition: {},
      bySeason: {},
      recent: trophies.slice(0, 5) // Last 5 trophies
    };

    trophies.forEach(trophy => {
      // By trophy type
      stats.byType[trophy.trophy_type] = (stats.byType[trophy.trophy_type] || 0) + 1;
      
      // By competition type
      stats.byCompetition[trophy.competition_type] = (stats.byCompetition[trophy.competition_type] || 0) + 1;
      
      // By season
      stats.bySeason[trophy.season_id] = (stats.bySeason[trophy.season_id] || 0) + 1;
    });

    return stats;
  }, [trophies]);

  useEffect(() => {
    fetchTrophies();
  }, [fetchTrophies]);

  // Listen for real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('trophy_cabinet_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'trophy_cabinet' },
        () => {
          fetchTrophies(); // Refresh when changes occur
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTrophies]);

  return {
    trophies,
    loading,
    error,
    addTrophy,
    updateTrophy,
    deleteTrophy,
    awardTrophy,
    getTrophiesByPlayer,
    getTrophiesBySeason,
    getFeaturedTrophies,
    getTrophyStats,
    refetch: fetchTrophies
  };
};