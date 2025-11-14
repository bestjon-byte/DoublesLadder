// src/utils/scoreSubmission.js
import { supabase } from '../supabaseClient';
import { updateMatchElos } from './eloCalculator';

export const submitScoreWithConflictHandling = async (fixtureId, pair1Score, pair2Score, currentUserId) => {
  try {
    
    // Start a transaction-like approach by checking for existing score first
    const { data: existingResult, error: checkError } = await supabase
      .from('match_results')
      .select('*')
      .eq('fixture_id', fixtureId)
      .maybeSingle();

    if (checkError) {
      throw new Error(`Error checking existing result: ${checkError.message}`);
    }

    // If a score already exists, create a conflict record
    if (existingResult) {
      
      // Create conflict record
      const { error: conflictError } = await supabase
        .from('score_conflicts')
        .insert({
          fixture_id: fixtureId,
          first_submission_id: existingResult.id,
          conflicting_submission: {
            pair1_score: parseInt(pair1Score),
            pair2_score: parseInt(pair2Score),
            submitted_at: new Date().toISOString()
          },
          conflicting_user_id: currentUserId
        });

      if (conflictError) {
        throw new Error(`Error creating conflict record: ${conflictError.message}`);
      }

      // Conflict record created
      return {
        conflict: true,
        winningScore: existingResult,
        conflictingScore: {
          pair1_score: parseInt(pair1Score),
          pair2_score: parseInt(pair2Score)
        }
      };
    }

    // No existing score, insert the new one
    const { data: newResult, error: insertError } = await supabase
      .from('match_results')
      .insert({
        fixture_id: fixtureId,
        pair1_score: parseInt(pair1Score),
        pair2_score: parseInt(pair2Score),
        submitted_by: currentUserId,
        verified: true // Mark new scores as verified by default
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error inserting result:', insertError);
      
      // Check if this is a unique constraint violation (someone beat us to it)
      if (insertError.code === '23505' || insertError.message.includes('duplicate')) {
        
        // Fetch the winning submission
        const { data: winningResult } = await supabase
          .from('match_results')
          .select('*')
          .eq('fixture_id', fixtureId)
          .single();

        if (winningResult) {
          // Create conflict record
          await supabase
            .from('score_conflicts')
            .insert({
              fixture_id: fixtureId,
              first_submission_id: winningResult.id,
              conflicting_submission: {
                pair1_score: parseInt(pair1Score),
                pair2_score: parseInt(pair2Score),
                submitted_at: new Date().toISOString()
              },
              conflicting_user_id: currentUserId
            });

          return {
            conflict: true,
            winningScore: winningResult,
            conflictingScore: {
              pair1_score: parseInt(pair1Score),
              pair2_score: parseInt(pair2Score)
            }
          };
        }
      }
      
      throw new Error(`Error inserting result: ${insertError.message}`);
    }

    // Score submitted successfully - now update ELO ratings
    try {
      const eloResult = await updateMatchElos(fixtureId, {
        pair1_score: parseInt(pair1Score),
        pair2_score: parseInt(pair2Score)
      });
      
    } catch (eloError) {
      console.warn('⚠️ ELO update failed (non-critical):', eloError);
      // Don't fail the score submission if ELO update fails
    }

    return {
      success: true,
      result: newResult
    };

  } catch (error) {
    console.error('💥 Error in submitScoreWithConflictHandling:', error);
    throw error;
  }
};

export const submitScoreChallenge = async (challengeData) => {
  try {
    
    const { error } = await supabase
      .from('score_challenges')
      .insert({
        fixture_id: challengeData.fixtureId,
        original_result_id: challengeData.originalResultId,
        challenger_id: challengeData.challengerId,
        challenged_pair1_score: challengeData.challengedPair1Score,
        challenged_pair2_score: challengeData.challengedPair2Score,
        challenge_reason: challengeData.reason
      });

    if (error) {
      console.error('❌ Error submitting challenge:', error);
      throw new Error(`Error submitting challenge: ${error.message}`);
    }

    // Challenge submitted successfully
    return { success: true };
  } catch (error) {
    console.error('💥 Error in submitScoreChallenge:', error);
    throw error;
  }
};

export const fetchScoreChallenges = async (seasonId = null) => {
  try {
    // Fetch score challenges without relationships first
    const { data: challenges, error } = await supabase
      .from('score_challenges')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error fetching challenges: ${error.message}`);
    }

    if (!challenges || challenges.length === 0) {
      return [];
    }

    // Manually fetch related data
    const fixtureIds = [...new Set(challenges.map(c => c.fixture_id).filter(Boolean))];
    const resultIds = [...new Set(challenges.map(c => c.original_result_id).filter(Boolean))];
    const userIds = [...new Set([
      ...challenges.map(c => c.challenger_id).filter(Boolean),
      ...challenges.map(c => c.resolved_by).filter(Boolean)
    ])];

    // Fetch fixtures with their related data
    const { data: fixtures } = await supabase
      .from('match_fixtures')
      .select(`
        *,
        match:match_id(week_number, match_date, season_id),
        player1:player1_id(name),
        player2:player2_id(name),
        player3:player3_id(name),
        player4:player4_id(name)
      `)
      .in('id', fixtureIds);

    // Fetch results
    const { data: results } = await supabase
      .from('match_results')
      .select('*')
      .in('id', resultIds);

    // Fetch users
    const { data: users } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', userIds);

    // Combine the data
    const enrichedChallenges = challenges.map(challenge => ({
      ...challenge,
      fixture: fixtures?.find(f => f.id === challenge.fixture_id) || null,
      original_result: results?.find(r => r.id === challenge.original_result_id) || null,
      challenger: users?.find(u => u.id === challenge.challenger_id) || null,
      resolver: users?.find(u => u.id === challenge.resolved_by) || null
    }));

    // Filter by season if provided
    const filteredChallenges = seasonId 
      ? enrichedChallenges.filter(challenge => challenge.fixture?.match?.season_id === seasonId)
      : enrichedChallenges;

    return filteredChallenges;
  } catch (error) {
    console.error('Error in fetchScoreChallenges:', error);
    throw error;
  }
};

export const fetchScoreConflicts = async (seasonId = null) => {
  try {
    // Fetch score conflicts without relationships first
    const { data: conflicts, error } = await supabase
      .from('score_conflicts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error fetching conflicts: ${error.message}`);
    }

    if (!conflicts || conflicts.length === 0) {
      return [];
    }

    // Manually fetch related data
    const fixtureIds = [...new Set(conflicts.map(c => c.fixture_id).filter(Boolean))];
    const resultIds = [...new Set(conflicts.map(c => c.first_submission_id).filter(Boolean))];
    const userIds = [...new Set([
      ...conflicts.map(c => c.conflicting_user_id).filter(Boolean),
      ...conflicts.map(c => c.resolved_by).filter(Boolean)
    ])];

    // Fetch fixtures with their related data
    const { data: fixtures } = await supabase
      .from('match_fixtures')
      .select(`
        *,
        match:match_id(week_number, match_date, season_id),
        player1:player1_id(name),
        player2:player2_id(name),
        player3:player3_id(name),
        player4:player4_id(name)
      `)
      .in('id', fixtureIds);

    // Fetch results
    const { data: results } = await supabase
      .from('match_results')
      .select('*')
      .in('id', resultIds);

    // Fetch users
    const { data: users } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', userIds);

    // Combine the data
    const enrichedConflicts = conflicts.map(conflict => ({
      ...conflict,
      fixture: fixtures?.find(f => f.id === conflict.fixture_id) || null,
      first_submission: results?.find(r => r.id === conflict.first_submission_id) || null,
      conflicting_user: users?.find(u => u.id === conflict.conflicting_user_id) || null,
      resolver: users?.find(u => u.id === conflict.resolved_by) || null
    }));

    // Filter by season if provided
    const filteredConflicts = seasonId 
      ? enrichedConflicts.filter(conflict => conflict.fixture?.match?.season_id === seasonId)
      : enrichedConflicts;

    return filteredConflicts;
  } catch (error) {
    console.error('Error in fetchScoreConflicts:', error);
    throw error;
  }
};