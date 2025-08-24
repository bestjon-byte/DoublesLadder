// src/utils/scoreSubmission.js
import { supabase } from '../supabaseClient';

export const submitScoreWithConflictHandling = async (fixtureId, pair1Score, pair2Score, currentUserId) => {
  try {
    console.log('🎾 Submitting score:', { fixtureId, pair1Score, pair2Score, currentUserId });
    
    // Start a transaction-like approach by checking for existing score first
    const { data: existingResult, error: checkError } = await supabase
      .from('match_results')
      .select('*')
      .eq('fixture_id', fixtureId)
      .maybeSingle();

    if (checkError) {
      console.error('❌ Error checking existing result:', checkError);
      throw new Error(`Error checking existing result: ${checkError.message}`);
    }

    // If a score already exists, create a conflict record
    if (existingResult) {
      console.log('🚨 Score conflict detected! Existing score:', existingResult);
      
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
        console.error('❌ Error creating conflict record:', conflictError);
        throw new Error(`Error creating conflict record: ${conflictError.message}`);
      }

      console.log('✅ Conflict record created');
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
    console.log('📝 Inserting new score...');
    const { data: newResult, error: insertError } = await supabase
      .from('match_results')
      .insert({
        fixture_id: fixtureId,
        pair1_score: parseInt(pair1Score),
        pair2_score: parseInt(pair2Score),
        submitted_by: currentUserId
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error inserting result:', insertError);
      
      // Check if this is a unique constraint violation (someone beat us to it)
      if (insertError.code === '23505' || insertError.message.includes('duplicate')) {
        console.log('🚨 Race condition detected - someone submitted first!');
        
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

    console.log('✅ Score submitted successfully:', newResult);
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
    console.log('🚩 Submitting score challenge:', challengeData);
    
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

    console.log('✅ Challenge submitted successfully');
    return { success: true };
  } catch (error) {
    console.error('💥 Error in submitScoreChallenge:', error);
    throw error;
  }
};

export const fetchScoreChallenges = async () => {
  try {
    const { data, error } = await supabase
      .from('score_challenges')
      .select(`
        *,
        challenger:challenger_id(name),
        fixture:fixture_id(
          *,
          match:match_id(week_number, match_date),
          player1:player1_id(name),
          player2:player2_id(name),
          player3:player3_id(name),
          player4:player4_id(name)
        ),
        original_result:original_result_id(*),
        resolver:resolved_by(name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error fetching challenges: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchScoreChallenges:', error);
    throw error;
  }
};

export const fetchScoreConflicts = async () => {
  try {
    const { data, error } = await supabase
      .from('score_conflicts')
      .select(`
        *,
        fixture:fixture_id(
          *,
          match:match_id(week_number, match_date),
          player1:player1_id(name),
          player2:player2_id(name),
          player3:player3_id(name),
          player4:player4_id(name)
        ),
        first_submission:first_submission_id(*),
        conflicting_user:conflicting_user_id(name),
        resolver:resolved_by(name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error fetching conflicts: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchScoreConflicts:', error);
    throw error;
  }
};