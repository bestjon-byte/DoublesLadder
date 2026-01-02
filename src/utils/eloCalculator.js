import { supabase } from '../supabaseClient';

export const calculateExpectedScore = (playerRating, opponentRating) => {
  return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
};

export const calculateEloChange = (playerRating, opponentRating, actualScore, kFactor = 32) => {
  const expectedScore = calculateExpectedScore(playerRating, opponentRating);
  return Math.round(kFactor * (actualScore - expectedScore));
};

export const calculateTeamEloChange = (team1Ratings, team2Ratings, team1Score, team2Score, kFactor = 32) => {
  const team1AvgRating = team1Ratings.reduce((sum, rating) => sum + rating, 0) / team1Ratings.length;
  const team2AvgRating = team2Ratings.reduce((sum, rating) => sum + rating, 0) / team2Ratings.length;
  
  const totalGames = team1Score + team2Score;
  const team1ActualScore = team1Score / totalGames;
  const team2ActualScore = team2Score / totalGames;
  
  const team1Change = calculateEloChange(team1AvgRating, team2AvgRating, team1ActualScore, kFactor);
  const team2Change = calculateEloChange(team2AvgRating, team1AvgRating, team2ActualScore, kFactor);
  
  return {
    team1Change,
    team2Change,
    team1AvgRating,
    team2AvgRating,
    team1ActualScore,
    team2ActualScore
  };
};

export const updateMatchElos = async (matchFixtureId, matchResult) => {
  try {
    const { data: fixture, error: fixtureError } = await supabase
      .from('match_fixtures')
      .select(`
        *,
        match:matches(season_id)
      `)
      .eq('id', matchFixtureId)
      .single();

    if (fixtureError) throw fixtureError;

    const { data: season, error: seasonError } = await supabase
      .from('seasons')
      .select('elo_enabled, elo_k_factor, elo_initial_rating')
      .eq('id', fixture.match.season_id)
      .single();

    if (seasonError) throw seasonError;

    if (!season.elo_enabled) {
      return { success: true, message: 'ELO not enabled for this season' };
    }

    const playerIds = [
      fixture.pair1_player1_id,
      fixture.pair1_player2_id,
      fixture.pair2_player1_id,
      fixture.pair2_player2_id
    ].filter(Boolean);

    const { data: seasonPlayers, error: playersError } = await supabase
      .from('season_players')
      .select('*')
      .eq('season_id', fixture.match.season_id)
      .in('player_id', playerIds);

    if (playersError) throw playersError;

    const pair1Players = seasonPlayers.filter(sp => 
      [fixture.pair1_player1_id, fixture.pair1_player2_id].includes(sp.player_id)
    );
    const pair2Players = seasonPlayers.filter(sp => 
      [fixture.pair2_player1_id, fixture.pair2_player2_id].includes(sp.player_id)
    );

    const pair1Ratings = pair1Players.map(p => p.elo_rating || season.elo_initial_rating);
    const pair2Ratings = pair2Players.map(p => p.elo_rating || season.elo_initial_rating);

    const eloChanges = calculateTeamEloChange(
      pair1Ratings,
      pair2Ratings,
      matchResult.pair1_score,
      matchResult.pair2_score,
      season.elo_k_factor
    );

    const updates = [];
    const historyRecords = [];

    pair1Players.forEach((player, index) => {
      const oldRating = player.elo_rating || season.elo_initial_rating;
      const newRating = oldRating + eloChanges.team1Change;
      
      updates.push({
        id: player.id,
        elo_rating: Math.max(500, Math.min(3000, newRating))
      });

      historyRecords.push({
        season_player_id: player.id,
        match_fixture_id: matchFixtureId,
        old_rating: oldRating,
        new_rating: Math.max(500, Math.min(3000, newRating)),
        rating_change: eloChanges.team1Change,
        k_factor: season.elo_k_factor,
        opponent_avg_rating: Math.round(eloChanges.team2AvgRating),
        expected_score: calculateExpectedScore(eloChanges.team1AvgRating, eloChanges.team2AvgRating),
        actual_score: eloChanges.team1ActualScore
      });
    });

    pair2Players.forEach((player, index) => {
      const oldRating = player.elo_rating || season.elo_initial_rating;
      const newRating = oldRating + eloChanges.team2Change;
      
      updates.push({
        id: player.id,
        elo_rating: Math.max(500, Math.min(3000, newRating))
      });

      historyRecords.push({
        season_player_id: player.id,
        match_fixture_id: matchFixtureId,
        old_rating: oldRating,
        new_rating: Math.max(500, Math.min(3000, newRating)),
        rating_change: eloChanges.team2Change,
        k_factor: season.elo_k_factor,
        opponent_avg_rating: Math.round(eloChanges.team1AvgRating),
        expected_score: calculateExpectedScore(eloChanges.team2AvgRating, eloChanges.team1AvgRating),
        actual_score: eloChanges.team2ActualScore
      });
    });

    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('season_players')
        .update({ elo_rating: update.elo_rating })
        .eq('id', update.id);

      if (updateError) throw updateError;
    }

    // Also sync ELO to profiles table (global/permanent player rating)
    // This ensures ELO persists across all seasons
    for (const update of updates) {
      const seasonPlayer = [...pair1Players, ...pair2Players].find(p => p.id === update.id);
      if (seasonPlayer) {
        await supabase
          .from('profiles')
          .update({ elo_rating: update.elo_rating })
          .eq('id', seasonPlayer.player_id);
      }
    }

    const { error: historyError } = await supabase
      .from('elo_history')
      .insert(historyRecords);

    if (historyError) throw historyError;

    return {
      success: true,
      eloChanges,
      updates,
      historyRecords
    };

  } catch (error) {
    console.error('Error updating ELO ratings:', error);
    return { success: false, error: error.message };
  }
};

export const recalculateSeasonElos = async (seasonId, fromDate = null) => {
  try {
    const { data: season, error: seasonError } = await supabase
      .from('seasons')
      .select('elo_enabled, elo_k_factor, elo_initial_rating')
      .eq('id', seasonId)
      .single();

    if (seasonError) throw seasonError;

    if (!season.elo_enabled) {
      return { success: false, message: 'ELO not enabled for this season' };
    }

    const { error: resetError } = await supabase
      .from('season_players')
      .update({ elo_rating: season.elo_initial_rating })
      .eq('season_id', seasonId);

    if (resetError) throw resetError;

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

    let query = supabase
      .from('match_fixtures')
      .select(`
        id,
        pair1_score:match_results(pair1_score),
        pair2_score:match_results(pair2_score),
        match:matches!inner(season_id, match_date)
      `)
      .eq('match.season_id', seasonId)
      .not('match_results', 'is', null)
      .order('match.match_date', { ascending: true });

    if (fromDate) {
      query = query.gte('match.match_date', fromDate);
    }

    const { data: matches, error: matchesError } = await query;

    if (matchesError) throw matchesError;

    for (const match of matches) {
      if (match.pair1_score && match.pair2_score) {
        await updateMatchElos(match.id, {
          pair1_score: match.pair1_score[0].pair1_score,
          pair2_score: match.pair2_score[0].pair2_score
        });
      }
    }

    // After recalculation, sync all season player ratings to profiles
    const { data: finalRatings } = await supabase
      .from('season_players')
      .select('player_id, elo_rating')
      .eq('season_id', seasonId);

    if (finalRatings) {
      for (const sp of finalRatings) {
        await supabase
          .from('profiles')
          .update({ elo_rating: sp.elo_rating })
          .eq('id', sp.player_id);
      }
    }

    return { success: true, processedMatches: matches.length };

  } catch (error) {
    console.error('Error recalculating season ELOs:', error);
    return { success: false, error: error.message };
  }
};

export const getMatchPrediction = async (team1PlayerIds, team2PlayerIds, seasonId) => {
  try {
    const { data: season, error: seasonError } = await supabase
      .from('seasons')
      .select('elo_enabled, elo_initial_rating')
      .eq('id', seasonId)
      .single();

    if (seasonError) throw seasonError;

    if (!season.elo_enabled) {
      return { success: false, message: 'ELO not enabled for this season' };
    }

    const allPlayerIds = [...team1PlayerIds, ...team2PlayerIds];
    
    const { data: seasonPlayers, error: playersError } = await supabase
      .from('season_players')
      .select('player_id, elo_rating')
      .eq('season_id', seasonId)
      .in('player_id', allPlayerIds);

    if (playersError) throw playersError;

    const getPlayerRating = (playerId) => {
      const player = seasonPlayers.find(sp => sp.player_id === playerId);
      return player?.elo_rating || season.elo_initial_rating;
    };

    const team1Ratings = team1PlayerIds.map(getPlayerRating);
    const team2Ratings = team2PlayerIds.map(getPlayerRating);

    const team1AvgRating = team1Ratings.reduce((sum, rating) => sum + rating, 0) / team1Ratings.length;
    const team2AvgRating = team2Ratings.reduce((sum, rating) => sum + rating, 0) / team2Ratings.length;

    const team1WinProbability = calculateExpectedScore(team1AvgRating, team2AvgRating);
    const team2WinProbability = 1 - team1WinProbability;

    const ratingDifference = Math.abs(team1AvgRating - team2AvgRating);
    
    let matchType = 'balanced';
    if (ratingDifference > 150) {
      matchType = 'upset_alert';
    } else if (ratingDifference < 50) {
      matchType = 'very_balanced';
    }

    return {
      success: true,
      team1AvgRating: Math.round(team1AvgRating),
      team2AvgRating: Math.round(team2AvgRating),
      team1WinProbability: Math.round(team1WinProbability * 100),
      team2WinProbability: Math.round(team2WinProbability * 100),
      ratingDifference: Math.round(ratingDifference),
      matchType
    };

  } catch (error) {
    console.error('Error calculating match prediction:', error);
    return { success: false, error: error.message };
  }
};

export const getEloRankColor = (rating) => {
  if (rating >= 1400) return 'text-red-600'; // Elite
  if (rating >= 1300) return 'text-yellow-600'; // Strong
  if (rating >= 1200) return 'text-blue-600'; // Good
  if (rating >= 1100) return 'text-green-600'; // Developing
  return 'text-gray-600'; // Beginner
};

export const getEloRankLabel = (rating) => {
  if (rating >= 1400) return '🔥 Elite';
  if (rating >= 1300) return '🌟 Strong';
  if (rating >= 1200) return '⭐ Good';
  if (rating >= 1100) return '📈 Developing';
  return '🆕 Beginner';
};