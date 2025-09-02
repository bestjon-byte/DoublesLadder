// src/components/Admin/ScoreChallengesSection.js - ENHANCED WITH CHALLENGE REVIEW
import React, { useState, useEffect } from 'react';
import { Flag, Check, X, Edit, AlertTriangle, Clock } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { fetchScoreChallenges, fetchScoreConflicts } from '../../utils/scoreSubmission';

const ScoreChallengesSection = ({ currentUser, currentSeason, activeSeason, selectedSeason, onDataRefresh }) => {
  const [challenges, setChallenges] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [allResults, setAllResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingScore, setEditingScore] = useState(null);
  const [editForm, setEditForm] = useState({ pair1_score: '', pair2_score: '' });
  const [activeTab, setActiveTab] = useState('challenges'); // challenges, conflicts, results

  useEffect(() => {
    console.log('🔍 ScoreChallengesSection mounted, fetching all data...');
    fetchAllData();
  }, [selectedSeason?.id]); // Re-fetch when selected season changes

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      // Fetch challenges, conflicts, and results in parallel
      const [challengesData, conflictsData, resultsData] = await Promise.all([
        fetchScoreChallenges(selectedSeason?.id),
        fetchScoreConflicts(selectedSeason?.id), 
        fetchMatchResults(selectedSeason?.id)
      ]);
      
      console.log('✅ Fetched data:', {
        challenges: challengesData?.length || 0,
        conflicts: conflictsData?.length || 0,
        results: resultsData?.length || 0
      });
      
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
    if (!seasonId) {
      console.log('No season selected, returning empty results');
      return [];
    }

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
      .eq('fixture.match.season_id', seasonId)
      .order('created_at', { ascending: false });

    if (error) throw error;
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
      console.log(`🏆 Resolving challenge ${challengeId} with decision: ${decision}`);
      
      if (decision === 'approved' && newScore) {
        // Create new corrected result record and preserve original
        const challenge = challenges.find(c => c.id === challengeId);
        
        if (challenge?.original_result_id && challenge?.fixture_id) {
          console.log('📝 Creating corrected score record...');
          
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
          
          console.log('✅ Created corrected result:', correctedResult.id, 'and marked original as superseded');
        }
      }
      
      // Update the challenge status with minimal fields first
      console.log('🔄 Updating challenge status...');
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
      
      console.log('📤 Sending update:', updateData);
      
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
      
      console.log('✅ Challenge updated successfully:', updateResult);
      alert(`Challenge ${decision} successfully!`);
      
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
    
    console.log('✏️ Starting score edit for:', result.id);
    setEditingScore(result.id);
    setEditForm({
      pair1_score: result.pair1_score.toString(),
      pair2_score: result.pair2_score.toString()
    });
  };

  const handleSaveEdit = async (resultId) => {
    setLoading(true);
    try {
      console.log('💾 Saving score edit:', { resultId, editForm });
      
      if (!editForm.pair1_score || !editForm.pair2_score) {
        alert('Please enter both scores');
        return;
      }

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
        console.log('✅ Score updated successfully');
        alert('Score updated successfully!');
        setEditingScore(null);
        setEditForm({ pair1_score: '', pair2_score: '' });
        await fetchAllData();
        if (onDataRefresh) onDataRefresh();
      }
    } catch (error) {
      console.error('💥 Error in handleSaveEdit:', error);
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
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Score Management & Challenges</h3>
        <button 
          onClick={fetchAllData}
          className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 flex items-center space-x-2"
          title="Refresh challenges, conflicts, and match results"
        >
          <span>🔄</span>
          <span>Refresh Data</span>
        </button>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex rounded-lg bg-gray-100 p-1">
        <button
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'challenges' ? 'bg-white text-gray-900 shadow' : 'text-gray-600'
          }`}
          onClick={() => setActiveTab('challenges')}
        >
          <Flag className="w-4 h-4 inline mr-2" />
          Challenges ({challenges.filter(c => c.status === 'pending').length})
        </button>
        <button
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'conflicts' ? 'bg-white text-gray-900 shadow' : 'text-gray-600'
          }`}
          onClick={() => setActiveTab('conflicts')}
        >
          <AlertTriangle className="w-4 h-4 inline mr-2" />
          Conflicts ({conflicts.filter(c => !c.resolved).length})
        </button>
        <button
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'results' ? 'bg-white text-gray-900 shadow' : 'text-gray-600'
          }`}
          onClick={() => setActiveTab('results')}
        >
          <Edit className="w-4 h-4 inline mr-2" />
          Edit Results ({allResults.length})
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
            <div className="space-y-4">
              {challenges.map((challenge) => {
                const isResolved = challenge.status !== 'pending';
                return (
                <div key={challenge.id} className={`border rounded-lg transition-all duration-200 ${
                  challenge.status === 'pending' ? 'border-orange-200 bg-orange-50 p-4' : 'border-gray-200 p-2 hover:p-4'
                }`}>
                  {isResolved ? (
                    // Collapsed view for resolved challenges
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-3 flex-1">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          challenge.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {challenge.status.toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-700 truncate">
                          {challenge.fixture ? 
                            `${challenge.fixture.player1?.name} & ${challenge.fixture.player2?.name} vs ${challenge.fixture.player3?.name} & ${challenge.fixture.player4?.name}` 
                            : 'Match details unavailable'
                          }
                        </span>
                        <span className="text-xs text-gray-500">
                          {challenge.original_result?.pair1_score} - {challenge.original_result?.pair2_score} → {challenge.challenged_pair1_score} - {challenge.challenged_pair2_score}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(challenge.resolved_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ) : (
                    // Expanded view for pending challenges  
                    <>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          challenge.status === 'pending' 
                            ? 'bg-orange-100 text-orange-800' 
                            : challenge.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {challenge.status.toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-500">
                          by {challenge.challenger?.name || 'Unknown'}
                        </span>
                      </div>
                      
                      {challenge.fixture && (
                        <div className="mb-2">
                          <p className="font-medium text-sm">
                            {challenge.fixture.player1?.name} & {challenge.fixture.player2?.name} 
                            <span className="text-gray-500 mx-2">vs</span>
                            {challenge.fixture.player3?.name} & {challenge.fixture.player4?.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            Week {challenge.fixture.match?.week_number} - Court {challenge.fixture.court_number}
                          </p>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div className="bg-red-50 p-2 rounded">
                          <p className="text-xs text-red-600 font-medium">Original Score:</p>
                          <p className="font-bold text-red-800">
                            {challenge.original_result?.pair1_score} - {challenge.original_result?.pair2_score}
                          </p>
                        </div>
                        <div className="bg-blue-50 p-2 rounded">
                          <p className="text-xs text-blue-600 font-medium">Challenged Score:</p>
                          <p className="font-bold text-blue-800">
                            {challenge.challenged_pair1_score} - {challenge.challenged_pair2_score}
                          </p>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-xs text-gray-600 font-medium">Reason:</p>
                        <p className="text-sm">{challenge.challenge_reason}</p>
                      </div>
                      
                      {challenge.admin_decision && (
                        <div className="mt-2 bg-yellow-50 p-2 rounded">
                          <p className="text-xs text-yellow-600 font-medium">Admin Decision:</p>
                          <p className="text-sm">{challenge.admin_decision}</p>
                        </div>
                      )}
                    </div>
                    
                    {challenge.status === 'pending' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => resolveChallenge(challenge.id, 'approved', {
                            pair1_score: challenge.challenged_pair1_score,
                            pair2_score: challenge.challenged_pair2_score
                          })}
                          disabled={loading || selectedSeason?.status === 'completed'}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                          title={selectedSeason?.status === 'completed' ? 'Cannot process challenges for completed seasons' : 'Approve challenge and update score'}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => resolveChallenge(challenge.id, 'rejected')}
                          disabled={loading || selectedSeason?.status === 'completed'}
                          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 disabled:opacity-50"
                          title={selectedSeason?.status === 'completed' ? 'Cannot process challenges for completed seasons' : 'Reject challenge and keep original score'}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-xs text-gray-400">
                    Submitted: {new Date(challenge.created_at).toLocaleString()}
                    {challenge.resolved_at && (
                      <span> • Resolved: {new Date(challenge.resolved_at).toLocaleString()}</span>
                    )}
                  </div>
                  </>
                  )}
                </div>
                );
              })}
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
              <p className="text-sm text-gray-600">
                Conflicts occur when two players submit different scores for the same match simultaneously.
              </p>
              {conflicts.map((conflict) => (
                <div key={conflict.id} className="border border-red-200 bg-red-50 rounded-lg p-4">
                  <p className="text-sm text-red-800">
                    Conflict detected for fixture {conflict.fixture_id}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {new Date(conflict.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Results Tab */}
      {activeTab === 'results' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="font-semibold mb-4 flex items-center">
            <Edit className="w-5 h-5 mr-2" />
            Edit Match Results ({allResults.length})
          </h4>
          
          {/* Show warning for completed seasons */}
          {selectedSeason?.status === 'completed' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-yellow-600 mr-2" />
                <div>
                  <h5 className="font-medium text-yellow-800">Season Completed</h5>
                  <p className="text-sm text-yellow-700">
                    This season has been completed and closed. Match scores can no longer be edited. 
                    Only scores from the current active season can be modified.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {allResults.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {selectedSeason?.status === 'completed' 
                  ? 'No results available for editing in completed seasons'
                  : 'No results to display'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {allResults.slice(0, 20).map((result) => (
                <div key={result.id} className="border border-gray-200 rounded p-3 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      {result.fixture ? (
                        <div className="mb-2">
                          <p className="font-medium text-sm text-gray-800">
                            {result.fixture.player1?.name || 'Player 1'} & {result.fixture.player2?.name || 'Player 2'} 
                            <span className="text-gray-500 mx-2">vs</span>
                            {result.fixture.player3?.name || 'Player 3'} & {result.fixture.player4?.name || 'Player 4'}
                          </p>
                          <p className="text-xs text-gray-500">
                            Week {result.fixture.match?.week_number || '?'} - Court {result.fixture.court_number || '?'}
                          </p>
                        </div>
                      ) : (
                        <div className="mb-2">
                          <p className="text-sm text-gray-500 italic">Match details loading...</p>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-4">
                        {editingScore === result.id ? (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">Score:</span>
                            <input
                              type="number"
                              min="0"
                              max="20"
                              value={editForm.pair1_score}
                              onChange={(e) => setEditForm({...editForm, pair1_score: e.target.value})}
                              className="w-14 p-2 border border-gray-300 rounded text-center"
                              disabled={loading}
                            />
                            <span className="text-gray-500">-</span>
                            <input
                              type="number"
                              min="0"
                              max="20"
                              value={editForm.pair2_score}
                              onChange={(e) => setEditForm({...editForm, pair2_score: e.target.value})}
                              className="w-14 p-2 border border-gray-300 rounded text-center"
                              disabled={loading}
                            />
                            <button
                              onClick={() => handleSaveEdit(result.id)}
                              disabled={loading || !editForm.pair1_score || !editForm.pair2_score}
                              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              disabled={loading}
                              className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-4">
                            <div className="bg-gray-100 px-3 py-1 rounded">
                              <span className="font-bold text-lg text-gray-800">
                                {result.pair1_score} - {result.pair2_score}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {editingScore !== result.id && (
                      <button 
                        onClick={() => handleEditScore(result)}
                        disabled={loading || selectedSeason?.status === 'completed'}
                        className={`p-1 rounded text-xs transition-colors ${
                          selectedSeason?.status === 'completed'
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-[#5D1F1F] text-white hover:bg-[#4A1818]'
                        }`}
                        title={selectedSeason?.status === 'completed' ? 'Cannot edit scores in completed seasons' : 'Edit score'}
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                    )}
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

export default ScoreChallengesSection;