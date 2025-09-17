// src/components/Admin/ScoreChallengesSection.js - ENHANCED WITH CHALLENGE REVIEW
import React, { useState, useEffect } from 'react';
import { Flag, Check, X, Edit, AlertTriangle, Clock } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { fetchScoreChallenges, fetchScoreConflicts } from '../../utils/scoreSubmission';
import { updateMatchElos } from '../../utils/eloCalculator';

const ScoreChallengesSection = ({ currentUser, currentSeason, activeSeason, selectedSeason, onDataRefresh }) => {
  const [challenges, setChallenges] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [allResults, setAllResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingScore, setEditingScore] = useState(null);
  const [editForm, setEditForm] = useState({ pair1_score: '', pair2_score: '' });
  const [activeTab, setActiveTab] = useState('challenges'); // challenges, conflicts, results

  useEffect(() => {
    // Fetch challenges, conflicts, and results data for the selected season
    fetchAllData();
  }, [selectedSeason?.id, currentSeason?.id]); // Re-fetch when selected or current season changes

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      // Fetch challenges, conflicts, and results in parallel
      const [challengesData, conflictsData, resultsData] = await Promise.all([
        fetchScoreChallenges(selectedSeason?.id),
        fetchScoreConflicts(selectedSeason?.id), 
        fetchMatchResults(selectedSeason?.id)
      ]);
      
      // Data fetched successfully from all endpoints
      
      setChallenges(challengesData || []);
      setConflicts(conflictsData || []);
      setAllResults(resultsData || []);
      
    } catch (error) {
      console.error('❌ Error fetching data:', error);
      alert('Error loading challenges: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMatchResults = async (seasonId) => {
    // Use the provided seasonId or fall back to current season
    const targetSeasonId = seasonId || currentSeason?.id;
    
    if (!targetSeasonId) {
      // No season available - return empty results
      return [];
    }

    // Check if the target season is completed - if so, return empty (no editing allowed)
    const targetSeason = seasonId ? selectedSeason : currentSeason;
    if (targetSeason?.status === 'completed') {
      // Completed season - no editing allowed
      return [];
    }

    // Fetching match results for current season

    const { data, error } = await supabase
      .from('match_results')
      .select(`
        *,
        fixture:fixture_id(
          *,
          match:match_id(week_number, match_date, season_id),
          player1:player1_id(name),
          player2:player2_id(name),
          player3:player3_id(name),
          player4:player4_id(name)
        )
      `)
      .eq('fixture.match.season_id', targetSeasonId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching match results:', error);
      throw error;
    }
    
    // Match results fetched successfully
    return data || [];
  };

 const resolveChallenge = async (challengeId, decision, newScore = null) => {
    // Prevent resolving challenges for completed seasons
    if (selectedSeason?.status === 'completed') {
      alert('Cannot process challenges for completed seasons. Challenges can only be processed for the current active season.');
      return;
    }
    
    setLoading(true);
    try {
      // Processing challenge resolution
      
      if (decision === 'approved' && newScore) {
        // Create new corrected result record and preserve original
        const challenge = challenges.find(c => c.id === challengeId);
        
        if (challenge?.original_result_id && challenge?.fixture_id) {
          // Creating corrected score record
          
          // Create new result record with corrected score
          const { data: correctedResult, error: createError } = await supabase
            .from('match_results')
            .insert({
              fixture_id: challenge.fixture_id,
              pair1_score: newScore.pair1_score,
              pair2_score: newScore.pair2_score,
              submitted_by: challenge.challenger_id,
              verified: true // Mark as the official/verified score
            })
            .select()
            .single();
            
          if (createError) {
            console.error('❌ Error creating corrected result:', createError);
            alert('Error creating corrected result: ' + createError.message);
            return;
          }
          
          // Mark original result as superseded (unverified)
          const { error: updateError } = await supabase
            .from('match_results')
            .update({ verified: false })
            .eq('id', challenge.original_result_id);
            
          if (updateError) {
            console.error('❌ Error marking original as superseded:', updateError);
            alert('Error updating original result: ' + updateError.message);
            return;
          }
          
          // Corrected result created and original marked as superseded
        }
      }
      
      // Update the challenge status with minimal fields first
      // Updating challenge status in database
      const updateData = {
        status: decision,
        resolved_by: currentUser.id,
        resolved_at: new Date().toISOString()
      };
      
      // Add admin decision separately to avoid potential issues
      if (decision === 'approved') {
        updateData.admin_decision = 'Challenge upheld - score corrected';
      } else {
        updateData.admin_decision = 'Challenge rejected - original score stands';
      }
      
      // Sending challenge update to database
      
      const { data: updateResult, error: challengeError } = await supabase
        .from('score_challenges')
        .update(updateData)
        .eq('id', challengeId)
        .select(); // Add select to see what was updated
      
      if (challengeError) {
        console.error('❌ Challenge update error:', challengeError);
        console.error('Error details:', {
          code: challengeError.code,
          message: challengeError.message,
          details: challengeError.details,
          hint: challengeError.hint
        });
        alert(`Error resolving challenge: ${challengeError.message}\n\nDetails: ${challengeError.details || 'None'}`);
        return;
      }
      
      // Challenge status updated successfully
      alert(`Challenge ${decision} successfully!`);
      
      // Update ELO ratings if score was corrected and ELO is enabled
      if (decision === 'approved' && newScore) {
        const challenge = challenges.find(c => c.id === challengeId);
        if (challenge?.fixture_id) {
          try {
            console.log('🎯 Updating ELO ratings after score correction...');
            const eloResult = await updateMatchElos(challenge.fixture_id, newScore);
            if (eloResult.success) {
              console.log('✅ ELO ratings updated successfully');
            } else {
              console.warn('⚠️ ELO update failed (non-critical):', eloResult.error);
            }
          } catch (eloError) {
            console.warn('⚠️ ELO update failed (non-critical):', eloError);
          }
        }
      }
      
      // Refresh all data
      await fetchAllData();
      if (onDataRefresh) onDataRefresh();
      
    } catch (error) {
      console.error('💥 Unexpected error resolving challenge:', error);
      alert('Unexpected error resolving challenge: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditScore = (result) => {
    // Check if the selected season is completed/closed
    if (selectedSeason?.status === 'completed') {
      alert('Cannot edit scores for completed seasons. Scores can only be edited for the current active season.');
      return;
    }
    
    // Starting score edit mode
    setEditingScore(result.id);
    setEditForm({
      pair1_score: result.pair1_score.toString(),
      pair2_score: result.pair2_score.toString()
    });
  };

  const handleSaveEdit = async (resultId) => {
    setLoading(true);
    try {
      // Saving score edit to database
      
      if (!editForm.pair1_score || !editForm.pair2_score) {
        alert('Please enter both scores');
        return;
      }

      // Get the fixture_id for ELO updates
      const result = allResults.find(r => r.id === resultId);
      const fixtureId = result?.fixture_id;

      const { error } = await supabase
        .from('match_results')
        .update({
          pair1_score: parseInt(editForm.pair1_score),
          pair2_score: parseInt(editForm.pair2_score)
        })
        .eq('id', resultId);

      if (error) {
        console.error('❌ Error updating score:', error);
        alert('Error updating score: ' + error.message);
      } else {
        // Score updated successfully in database
        alert('Score updated successfully!');
        
        // Update ELO ratings if fixture ID is available and ELO is enabled
        if (fixtureId) {
          try {
            console.log('🎯 Updating ELO ratings after score edit...');
            const newScore = {
              pair1_score: parseInt(editForm.pair1_score),
              pair2_score: parseInt(editForm.pair2_score)
            };
            const eloResult = await updateMatchElos(fixtureId, newScore);
            if (eloResult.success) {
              console.log('✅ ELO ratings updated successfully');
            } else {
              console.warn('⚠️ ELO update failed (non-critical):', eloResult.error);
            }
          } catch (eloError) {
            console.warn('⚠️ ELO update failed (non-critical):', eloError);
          }
        }
        
        setEditingScore(null);
        setEditForm({ pair1_score: '', pair2_score: '' });
        await fetchAllData();
        if (onDataRefresh) onDataRefresh();
      }
    } catch (error) {
      console.error('Error in handleSaveEdit:', error);
      alert('Error updating score: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingScore(null);
    setEditForm({ pair1_score: '', pair2_score: '' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">Loading challenges...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Score Management & Challenges</h3>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex flex-col sm:flex-row rounded-lg bg-gray-100 p-1 gap-1 sm:gap-0">
        <button
          className={`flex-1 py-2 px-3 rounded-md text-xs sm:text-sm font-medium transition-colors ${
            activeTab === 'challenges' ? 'bg-white text-gray-900 shadow' : 'text-gray-600'
          }`}
          onClick={() => setActiveTab('challenges')}
        >
          <Flag className="w-4 h-4 inline mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Challenges</span>
          <span className="sm:hidden">Challenges</span>
          <span className="ml-1">({challenges.filter(c => c.status === 'pending').length})</span>
        </button>
        <button
          className={`flex-1 py-2 px-3 rounded-md text-xs sm:text-sm font-medium transition-colors ${
            activeTab === 'conflicts' ? 'bg-white text-gray-900 shadow' : 'text-gray-600'
          }`}
          onClick={() => setActiveTab('conflicts')}
        >
          <AlertTriangle className="w-4 h-4 inline mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Conflicts</span>
          <span className="sm:hidden">Conflicts</span>
          <span className="ml-1">({conflicts.filter(c => !c.resolved).length})</span>
        </button>
        <button
          className={`flex-1 py-2 px-3 rounded-md text-xs sm:text-sm font-medium transition-colors ${
            activeTab === 'results' ? 'bg-white text-gray-900 shadow' : 'text-gray-600'
          }`}
          onClick={() => setActiveTab('results')}
        >
          <Edit className="w-4 h-4 inline mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Edit Results</span>
          <span className="sm:hidden">Edit</span>
          <span className="ml-1">({allResults.length})</span>
        </button>
      </div>

      {/* Challenges Tab */}
      {activeTab === 'challenges' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="font-semibold mb-4 flex items-center">
            <Flag className="w-5 h-5 mr-2 text-orange-500" />
            Score Challenges ({challenges.length})
          </h4>
          
          {/* Show warning for completed seasons */}
          {selectedSeason?.status === 'completed' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-yellow-600 mr-2" />
                <div>
                  <h5 className="font-medium text-yellow-800">Season Completed</h5>
                  <p className="text-sm text-yellow-700">
                    This season has been completed and closed. Score challenges cannot be processed for completed seasons.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {challenges.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No score challenges yet</p>
          ) : (
            <div className="space-y-6">
              {/* Pending Challenges Section */}
              {(() => {
                const pendingChallenges = challenges.filter(c => c.status === 'pending');
                const processedChallenges = challenges.filter(c => c.status !== 'pending');
                
                return (
                  <>
                    {pendingChallenges.length > 0 && (
                      <div>
                        <h5 className="font-medium text-orange-800 mb-3 flex items-center">
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          Pending Challenges ({pendingChallenges.length})
                        </h5>
                        <div className="space-y-4">
                          {pendingChallenges.map((challenge) => (
                            <ChallengeCard 
                              key={challenge.id}
                              challenge={challenge}
                              selectedSeason={selectedSeason}
                              resolveChallenge={resolveChallenge}
                              editingScore={editingScore}
                              setEditingScore={setEditingScore}
                              editForm={editForm}
                              setEditForm={setEditForm}
                              saveScoreEdit={handleSaveEdit}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Processed Challenges Section */}
                    {processedChallenges.length > 0 && (
                      <ProcessedChallengesSection 
                        challenges={processedChallenges}
                      />
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* Conflicts Tab */}
      {activeTab === 'conflicts' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="font-semibold mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
            Score Conflicts ({conflicts.length})
          </h4>
          
          {conflicts.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No score conflicts detected</p>
          ) : (
            <div className="space-y-4">
              {conflicts.map((conflict) => (
                <div key={conflict.id} className="border border-red-200 bg-red-50 rounded-lg p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-800">
                          CONFLICT
                        </span>
                        <span className="text-sm text-gray-600">
                          Detected on submission
                        </span>
                      </div>
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 border">
                      <div className="space-y-2">
                        <div className="font-medium text-gray-900">Conflicting Submissions</div>
                        <div className="text-sm text-gray-700">
                          <div><strong>Original:</strong> {conflict.first_submission?.pair1_score || 'Unknown'} - {conflict.first_submission?.pair2_score || 'Unknown'}</div>
                          <div className="mt-1"><strong>New Submission:</strong> {conflict.conflicting_submission?.pair1_score || 'Unknown'} - {conflict.conflicting_submission?.pair2_score || 'Unknown'}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-400">
                      Detected: {new Date(conflict.created_at).toLocaleString()}
                      {conflict.resolved_at && (
                        <span> • Resolved: {new Date(conflict.resolved_at).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Results Tab */}
      {activeTab === 'results' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="font-semibold mb-4">All Match Results ({allResults.length})</h4>
          
          {allResults.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No match results found</p>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {allResults.map((result) => (
                <div key={result.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 mb-1">
                        {result.fixture?.player1?.name || 'Unknown'} & {result.fixture?.player2?.name || 'Unknown'}
                        <span className="mx-2 text-gray-400">vs</span>
                        {result.fixture?.player3?.name || 'Unknown'} & {result.fixture?.player4?.name || 'Unknown'}
                      </div>
                      <div className="text-xs text-gray-500">
                        Court {result.fixture?.court_number || '?'} • {result.fixture?.match?.match_date ? new Date(result.fixture.match.match_date).toLocaleDateString() : 'Unknown date'}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        {editingScore === result.id ? (
                          <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                min="0"
                                className="w-16 px-2 py-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-[#5D1F1F] focus:border-transparent"
                                value={editForm.pair1_score}
                                onChange={(e) => setEditForm({...editForm, pair1_score: e.target.value})}
                                disabled={loading}
                                placeholder="0"
                              />
                              <span className="text-gray-500">-</span>
                              <input
                                type="number"
                                min="0"
                                className="w-16 px-2 py-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-[#5D1F1F] focus:border-transparent"
                                value={editForm.pair2_score}
                                onChange={(e) => setEditForm({...editForm, pair2_score: e.target.value})}
                                disabled={loading}
                                placeholder="0"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSaveEdit(result.id)}
                                disabled={loading || !editForm.pair1_score || !editForm.pair2_score}
                                className="flex-1 bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                              >
                                <Check className="w-4 h-4" />
                                Save
                              </button>
                              <button
                                onClick={cancelEdit}
                                disabled={loading}
                                className="flex-1 bg-gray-500 text-white px-4 py-2 rounded text-sm hover:bg-gray-600 flex items-center justify-center gap-2 transition-colors"
                              >
                                <X className="w-4 h-4" />
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between w-full">
                            <div className="bg-gray-100 px-4 py-2 rounded-lg border border-gray-200">
                              <span className="font-bold text-xl text-gray-800">
                                {result.pair1_score} - {result.pair2_score}
                              </span>
                            </div>
                            <button 
                              onClick={() => handleEditScore(result)}
                              disabled={loading || selectedSeason?.status === 'completed'}
                              className={`px-3 py-2 rounded text-sm transition-colors flex items-center gap-2 ${
                                selectedSeason?.status === 'completed'
                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  : 'bg-[#5D1F1F] text-white hover:bg-[#4A1818]'
                              }`}
                              title={selectedSeason?.status === 'completed' ? 'Cannot edit scores in completed seasons' : 'Edit score'}
                            >
                              <Edit className="w-4 h-4" />
                              <span className="hidden sm:inline">Edit</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-400 mt-1 pt-1 border-t border-gray-100">
                    Submitted: {result.created_at ? new Date(result.created_at).toLocaleString() : 'Unknown'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Component for individual challenge cards
const ChallengeCard = ({ challenge, selectedSeason, resolveChallenge, editingScore, setEditingScore, editForm, setEditForm, saveScoreEdit }) => (
  <div className="border border-orange-200 bg-orange-50 rounded-lg p-4">
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 text-xs font-medium rounded bg-orange-100 text-orange-800">
            PENDING
          </span>
          <span className="text-sm text-gray-600">
            {challenge.match_date ? new Date(challenge.match_date).toLocaleDateString() : 'Unknown date'} • Court {challenge.court_number || '?'}
          </span>
        </div>
        <Flag className="w-5 h-5 text-orange-500" />
      </div>
      
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="space-y-2">
          <div className="font-medium text-gray-900">Match Details</div>
          <div className="text-sm text-gray-700">
            {challenge.fixture ? (
              <div className="space-y-1">
                <div>
                  <strong>Players:</strong> {challenge.fixture.player1?.name} & {challenge.fixture.player2?.name} vs {challenge.fixture.player3?.name} & {challenge.fixture.player4?.name}
                </div>
                <div>
                  <strong>Original Score:</strong> {challenge.original_result?.pair1_score || '?'} - {challenge.original_result?.pair2_score || '?'}
                </div>
              </div>
            ) : (
              <div>
                <strong>Players:</strong> Unknown
                <br />
                <strong>Original Score:</strong> Unknown
              </div>
            )}
            <div className="mt-1">
              <strong>Challenged By:</strong> {challenge.challenger?.name || 'Unknown'}
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="font-medium text-yellow-800">Disputed Score</div>
            <div className="text-lg font-bold text-yellow-900 mt-1">
              {challenge.challenged_pair1_score} - {challenge.challenged_pair2_score}
            </div>
          </div>
        </div>
        {challenge.challenge_reason && (
          <div className="mt-3">
            <div className="font-medium text-yellow-800 text-sm">Reason:</div>
            <div className="text-sm text-yellow-700">{challenge.challenge_reason}</div>
          </div>
        )}
      </div>

      {/* Score editing form */}
      {editingScore === challenge.id && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h6 className="font-medium text-blue-800 mb-2">Edit Score</h6>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-blue-700">Pair 1:</label>
              <input
                type="number"
                min="0"
                value={editForm.pair1_score}
                onChange={(e) => setEditForm({...editForm, pair1_score: e.target.value})}
                className="w-16 px-2 py-1 border border-blue-300 rounded text-center focus:outline-none focus:border-blue-500"
              />
            </div>
            <span className="text-blue-700">-</span>
            <div className="flex items-center gap-2">
              <label className="text-sm text-blue-700">Pair 2:</label>
              <input
                type="number"
                min="0"
                value={editForm.pair2_score}
                onChange={(e) => setEditForm({...editForm, pair2_score: e.target.value})}
                className="w-16 px-2 py-1 border border-blue-300 rounded text-center focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              onClick={() => saveScoreEdit(challenge.id)}
              className="bg-blue-600 text-white px-4 py-1 rounded text-sm hover:bg-blue-700"
            >
              Save
            </button>
            <button
              onClick={() => setEditingScore(null)}
              className="bg-gray-500 text-white px-4 py-1 rounded text-sm hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {challenge.admin_decision && (
        <div className="mt-2 bg-yellow-50 p-2 rounded">
          <p className="text-xs text-yellow-600 font-medium">Admin Decision:</p>
          <p className="text-sm">{challenge.admin_decision}</p>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <button
          onClick={() => resolveChallenge(challenge.id, 'approved', {
            pair1_score: challenge.challenged_pair1_score,
            pair2_score: challenge.challenged_pair2_score
          })}
          disabled={selectedSeason?.status === 'completed'}
          className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 disabled:opacity-50 transition-colors"
          title={selectedSeason?.status === 'completed' ? 'Cannot process challenges for completed seasons' : 'Approve challenge and update score'}
        >
          <Check className="w-4 h-4" />
          Approve
        </button>
        <button
          onClick={() => resolveChallenge(challenge.id, 'rejected')}
          disabled={selectedSeason?.status === 'completed'}
          className="flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 disabled:opacity-50 transition-colors"
          title={selectedSeason?.status === 'completed' ? 'Cannot process challenges for completed seasons' : 'Reject challenge and keep original score'}
        >
          <X className="w-4 h-4" />
          Reject
        </button>
      </div>
      
      <div className="text-xs text-gray-400">
        Submitted: {new Date(challenge.created_at).toLocaleString()}
      </div>
    </div>
  </div>
);

// Component for processed challenges (collapsed view)
const ProcessedChallengesSection = ({ challenges }) => {
  const [showProcessed, setShowProcessed] = React.useState(false);
  
  return (
    <div>
      <button
        onClick={() => setShowProcessed(!showProcessed)}
        className="flex items-center justify-between w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-gray-600" />
          <span className="font-medium text-gray-700">Processed Challenges ({challenges.length})</span>
        </div>
        <span className="text-gray-500 text-sm">
          {showProcessed ? 'Hide' : 'Show'}
        </span>
      </button>
      
      {showProcessed && (
        <div className="mt-4 space-y-2">
          {challenges.map((challenge) => (
            <div key={challenge.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <div className="flex flex-col gap-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded whitespace-nowrap ${
                      challenge.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {challenge.status.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(challenge.resolved_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-sm text-gray-700">
                    <strong>{challenge.challenger?.name || 'Unknown'}</strong> challenged score: {challenge.challenged_pair1_score}-{challenge.challenged_pair2_score}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400">
                    {challenge.match_date ? new Date(challenge.match_date).toLocaleDateString() : 'Unknown date'} • Court {challenge.court_number || '?'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ScoreChallengesSection;