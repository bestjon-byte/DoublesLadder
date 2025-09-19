// Enhanced deletion functionality with ELO restoration
// This should be integrated into your useApp.js deleteSeason function

const deleteSeasonWithEloRestoration = useCallback(async (seasonId, seasonName) => {
  try {
    console.log(`Deleting season ${seasonName} with ELO restoration...`);
    
    // ===== PHASE 1: GET SEASON DATA FOR ELO RESTORATION =====
    
    // Get all season players to potentially restore their ELO ratings
    const { data: seasonPlayers, error: seasonPlayersQueryError } = await supabase
      .from('season_players')
      .select('id, player_id, elo_rating')
      .eq('season_id', seasonId);
      
    if (seasonPlayersQueryError) throw seasonPlayersQueryError;
    
    console.log(`Found ${seasonPlayers?.length || 0} season players to process`);
    
    // ===== PHASE 2: DELETE ELO HISTORY FIRST =====
    
    if (seasonPlayers && seasonPlayers.length > 0) {
      const seasonPlayerIds = seasonPlayers.map(sp => sp.id);
      
      // Delete ELO history for this season
      console.log('Deleting ELO history records...');
      const { error: eloHistoryError } = await supabase
        .from('elo_history')
        .delete()
        .in('season_player_id', seasonPlayerIds);
        
      if (eloHistoryError) throw eloHistoryError;
    }
    
    // ===== PHASE 3: DELETE MATCH RELATED DATA =====
    
    // Get all matches for this season
    const { data: seasonMatches } = await supabase
      .from('matches')
      .select('id, match_date')
      .eq('season_id', seasonId);
      
    if (seasonMatches && seasonMatches.length > 0) {
      const matchIds = seasonMatches.map(m => m.id);
      
      // Get all fixtures for these matches
      const { data: fixtures } = await supabase
        .from('match_fixtures')
        .select('id')
        .in('match_id', matchIds);
        
      if (fixtures && fixtures.length > 0) {
        const fixtureIds = fixtures.map(f => f.id);
        
        // Delete score challenges
        console.log('Deleting score challenges...');
        const { error: challengesError } = await supabase
          .from('score_challenges')
          .delete()
          .in('fixture_id', fixtureIds);
        if (challengesError) throw challengesError;
        
        // Delete score conflicts
        console.log('Deleting score conflicts...');
        const { error: conflictsError } = await supabase
          .from('score_conflicts')
          .delete()
          .in('fixture_id', fixtureIds);
        if (conflictsError) throw conflictsError;
        
        // Delete match results
        console.log('Deleting match results...');
        const { error: resultsError } = await supabase
          .from('match_results')
          .delete()
          .in('fixture_id', fixtureIds);
        if (resultsError) throw resultsError;
      }
      
      // Delete match fixtures
      console.log('Deleting match fixtures...');
      const { error: fixturesError } = await supabase
        .from('match_fixtures')
        .delete()
        .in('match_id', matchIds);
      if (fixturesError) throw fixturesError;
      
      // Delete availability records for these match dates
      const matchDates = seasonMatches.map(m => m.match_date);
      if (matchDates.length > 0) {
        console.log('Deleting availability records...');
        const { error: availabilityError } = await supabase
          .from('availability')
          .delete()
          .in('match_date', matchDates);
        if (availabilityError) throw availabilityError;
      }
      
      // Delete matches
      console.log('Deleting matches...');
      const { error: matchesError } = await supabase
        .from('matches')
        .delete()
        .in('id', matchIds);
      if (matchesError) throw matchesError;
    }
    
    // ===== PHASE 4: ELO RESTORATION LOGIC =====
    
    if (seasonPlayers && seasonPlayers.length > 0) {
      console.log('Starting ELO restoration process...');
      
      for (const seasonPlayer of seasonPlayers) {
        const { player_id } = seasonPlayer;
        
        // Find the most recent ELO rating for this player from other seasons
        // We'll look at all their ELO history across all seasons, find the most recent
        const { data: mostRecentElo, error: eloLookupError } = await supabase
          .from('elo_history')
          .select(`
            new_rating,
            created_at,
            season_player_id,
            season_players!inner(season_id, seasons!inner(name))
          `)
          .eq('season_players.player_id', player_id)
          .neq('season_players.season_id', seasonId) // Exclude the season we're deleting
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (eloLookupError) {
          console.warn(`Error looking up ELO history for player ${player_id}:`, eloLookupError);
          continue;
        }
        
        let restoredRating = null;
        
        if (mostRecentElo && mostRecentElo.length > 0) {
          restoredRating = mostRecentElo[0].new_rating;
          console.log(`Player ${player_id}: Restoring to rating ${restoredRating} from ${mostRecentElo[0].season_players.seasons.name}`);
        } else {
          // No previous ELO history found, check if they have active season players in other seasons
          const { data: otherSeasonPlayers, error: otherSeasonsError } = await supabase
            .from('season_players')
            .select('elo_rating, seasons!inner(name, elo_initial_rating)')
            .eq('player_id', player_id)
            .neq('season_id', seasonId)
            .order('created_at', { ascending: false })
            .limit(1);
            
          if (!otherSeasonsError && otherSeasonPlayers && otherSeasonPlayers.length > 0) {
            restoredRating = otherSeasonPlayers[0].elo_rating;
            console.log(`Player ${player_id}: Restoring to rating ${restoredRating} from current season ${otherSeasonPlayers[0].seasons.name}`);
          } else {
            console.log(`Player ${player_id}: No ELO history found, will not restore rating`);
          }
        }
        
        // Update other active season_players records for this player
        if (restoredRating !== null) {
          const { error: updateError } = await supabase
            .from('season_players')
            .update({ elo_rating: restoredRating })
            .eq('player_id', player_id)
            .neq('season_id', seasonId); // Update all other seasons
            
          if (updateError) {
            console.warn(`Error updating ELO for player ${player_id}:`, updateError);
          } else {
            console.log(`✅ Player ${player_id}: ELO restored to ${restoredRating} in all active seasons`);
          }
        }
      }
    }
    
    // ===== PHASE 5: DELETE SEASON PLAYERS AND SEASON =====
    
    // Delete season players
    console.log('Deleting season players...');
    const { error: seasonPlayersError } = await supabase
      .from('season_players')
      .delete()
      .eq('season_id', seasonId);
    if (seasonPlayersError) throw seasonPlayersError;
    
    // Delete trophy cabinet entries
    console.log('Deleting trophy cabinet entries...');
    const { error: trophyError } = await supabase
      .from('trophy_cabinet')
      .delete()
      .eq('season_id', seasonId);
    if (trophyError) throw trophyError;
    
    // Finally, delete the season itself
    console.log('Deleting season...');
    const { error: seasonError } = await supabase
      .from('seasons')
      .delete()
      .eq('id', seasonId);
    if (seasonError) throw seasonError;
    
    console.log(`✅ Successfully deleted season "${seasonName}" with ELO restoration`);
    
    // Refresh data
    await Promise.all([
      fetchSeasons(),
      fetchUsers(),
      fetchAvailability(),
      fetchMatchFixtures(),
      fetchMatchResults()
    ]);
    
    return { success: true };
    
  } catch (error) {
    console.error('Error deleting season with ELO restoration:', error);
    alert(`Error deleting season: ${error.message}`);
    return { success: false, error };
  }
}, [supabase, fetchSeasons, fetchUsers, fetchAvailability, fetchMatchFixtures, fetchMatchResults]);

// ===== ALTERNATIVE: RECALCULATE ELO FROM SCRATCH =====

const recalculateEloFromScratch = useCallback(async (seasonId) => {
  try {
    console.log('Recalculating ELO from scratch for season...');
    
    // This function would:
    // 1. Reset all players to their starting ELO rating for the season
    // 2. Clear all ELO history for the season
    // 3. Process all match results in chronological order
    // 4. Recreate ELO history records
    
    // Get season settings
    const { data: season, error: seasonError } = await supabase
      .from('seasons')
      .select('elo_initial_rating, elo_k_factor')
      .eq('id', seasonId)
      .single();
      
    if (seasonError) throw seasonError;
    
    // Reset all players to initial rating
    const { error: resetError } = await supabase
      .from('season_players')
      .update({ elo_rating: season.elo_initial_rating })
      .eq('season_id', seasonId);
      
    if (resetError) throw resetError;
    
    // Clear ELO history
    const { error: clearHistoryError } = await supabase
      .from('elo_history')
      .delete()
      .in('season_player_id', 
        supabase
          .from('season_players')
          .select('id')
          .eq('season_id', seasonId)
      );
      
    if (clearHistoryError) throw clearHistoryError;
    
    // Now you would call your ELO calculation logic here
    // This could be the same logic used in the backdating script
    
    console.log('✅ ELO recalculation completed');
    
  } catch (error) {
    console.error('Error recalculating ELO:', error);
    throw error;
  }
}, [supabase]);

export { deleteSeasonWithEloRestoration, recalculateEloFromScratch };