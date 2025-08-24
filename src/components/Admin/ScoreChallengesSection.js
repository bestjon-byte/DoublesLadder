// src/components/Admin/ScoreChallengesSection.js
import React, { useState, useEffect } from 'react';
import { Flag, Check, X, Edit, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '../../supabaseClient';

const ScoreChallengesSection = ({ currentUser, onDataRefresh }) => {
  const [challenges, setChallenges] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [allResults, setAllResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingScore, setEditingScore] = useState(null);
  const [editForm, setEditForm] = useState({ pair1_score: '', pair2_score: '' });

  useEffect(() => {
    fetchChallengesAndConflicts();
    fetchAllResults();
  }, []);

  const fetchChallengesAndConflicts = async () => {
    try {
      console.log('📋 Fetching challenges and conflicts...');
      
      // Fetch challenges with related data
      const { data: challengesData, error: challengesError } = await supabase
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

      // Fetch conflicts
      const { data: conflictsData, error: conflictsError } = await supabase
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

      if (challengesError) console.error('❌ Error fetching challenges:', challengesError);
      if (conflictsError) console.error('❌ Error fetching conflicts:', conflictsError);

      console.log('✅ Fetched challenges:', challengesData?.length || 0);
      console.log('✅ Fetched conflicts:', conflictsData?.length || 0);

      setChallenges(challengesData || []);
      setConflicts(conflictsData || []);
    } catch (error) {
      console.error('💥 Error fetching challenges/conflicts:', error);
    }
  };

  const fetchAllResults = async () => {
    try {
      console.log('📊 Fetching all results for admin editing...');
      
      const { data, error } = await supabase
        .from('match_results')
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
          submitted_by_user:submitted_by(name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching results:', error);
      } else {
        console.log('✅ Fetched results:', data?.length || 0);
        setAllResults(data || []);
      }
    } catch (error) {
      console.error('💥 Error fetching all results:', error);
    }
  };

  const handleResolveChallenge = async (challengeId, decision, newScore = null) => {
    setLoading(true);
    try {
      console.log('⚖️ Resolving challenge:', { challengeId, decision, newScore });
      
      const challenge = challenges.find(c => c.id === challengeId);
      if (!challenge) {
        throw new Error('Challenge not found');
      }
      
      if (decision === 'approve' && newScore) {
        console.log('✏️ Updating original result with challenged score...');
        // Update the original result with the challenged score
        const { error: updateError } = await supabase
          .from('match_results')
          .update({
            pair1_score: newScore.pair1_score,
            pair2_score: newScore.pair2_score
          })
          .eq('id', challenge.original_result_id);

        if (updateError) throw updateError;
        console.log('✅ Original result updated');
      }

      // Mark challenge as resolved
      console.log('📝 Marking challenge as resolved...');
      const { error: challengeError } = await supabase
        .from('score_challenges')
        .update({
          status: decision === 'approve' ? 'resolved' : 'rejected',
          admin_decision: decision === 'approve' ? 'Challenge upheld - score corrected' : 'Challenge rejected - original score stands',
          resolved_by: currentUser.id,
          resolved_at: new Date().toISOString()
        })
        .eq('id', challengeId);

      if (challengeError) throw challengeError;

      console.log('✅ Challenge resolved successfully');
      alert(`Challenge ${decision === 'approve' ? 'approved' : 'rejected'} successfully!`);
      
      await Promise.all([fetchChallengesAndConflicts(), fetchAllResults()]);
      if (onDataRefresh) onDataRefresh();
    } catch (error) {
      console.error('💥 Error resolving challenge:', error);
      alert('Error resolving challenge: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveConflict = async (conflictId, keepOriginal) => {
    setLoading(true);
    try {
      console.log('🤝 Resolving conflict:', { conflictId, keepOriginal });
      
      const conflict = conflicts.find(c => c.id === conflictId);
      if (!conflict) {
        throw new Error('Conflict not found');
      }
      
      if (!keepOriginal) {
        console.log('🔄 Replacing original with conflicting score...');
        // Replace original with conflicting score
        const conflictingScore = conflict.conflicting_submission;
        
        const { error: updateError } = await supabase
          .from('match_results')
          .update({
            pair1_score: conflictingScore.pair1_score,
            pair2_score: conflictingScore.pair2_score,
            submitted_by: conflict.conflicting_user_id
          })
          .eq('id', conflict.first_submission_id);

        if (updateError) throw updateError;
        console.log('✅ Score replaced with conflicting submission');
      } else {
        console.log('✅ Keeping original score');
      }

      // Mark conflict as resolved
      const { error: conflictError } = await supabase
        .from('score_conflicts')
        .update({
          status: 'resolved',
          resolved_by: currentUser.id,
          resolved_at: new Date().toISOString()
        })
        .eq('id', conflictId);

      if (conflictError) throw conflictError;

      alert(`Conflict resolved successfully! ${keepOriginal ? 'Original score kept.' : 'Score updated to conflicting submission.'}`);
      await Promise.all([fetchChallengesAndConflicts(), fetchAllResults()]);
      if (onDataRefresh) onDataRefresh();
    } catch (error) {
      console.error('💥 Error resolving conflict:', error);
      alert('Error resolving conflict: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditScore = (result) => {
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

      if (error) throw error;

      console.log('✅ Score updated successfully');
      alert('Score updated successfully!');
      setEditingScore(null);
      setEditForm({ pair1_score: '', pair2_score: '' });
      await fetchAllResults();
      if (onDataRefresh) onDataRefresh();
    } catch (error) {
      console.error('💥 Error updating score:', error);
      alert('Error updating score: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const pendingChallenges = challenges.filter(c => c.status === 'pending');
  const pendingConflicts = conflicts.filter(c => c.status === 'pending');
  const recentResults = allResults.slice(0, 20); // Show last 20 results

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <h3 className="text-lg font-semibold">Score Management</h3>
        {(pendingChallenges.length > 0 || pendingConflicts.length > 0) && (
          <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm font-medium">
            {pendingChallenges.length + pendingConflicts.length} pending
          </span>
        )}
      </div>
      
      {/* Pending Challenges */}
      {pendingChallenges.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-semibold text-red-800 mb-3 flex items-center">
            <Flag className="w-5 h-5 mr-2" />
            Pending Score Challenges ({pendingChallenges.length})
          </h4>
          
          <div className="space-y-4">
            {pendingChallenges.map((challenge) => (
              <div key={challenge.id} className="bg-white rounded-lg p-4 border border-red-300">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-medium">
                      Week {challenge.fixture.match.week_number} - {challenge.fixture.court_number ? `Court ${challenge.fixture.court_number}` : 'Match'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {challenge.fixture.player1.name} & {challenge.fixture.player2.name} vs{' '}
                      {challenge.fixture.player3.name} & {challenge.fixture.player4.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Challenged by {challenge.challenger.name} on {new Date(challenge.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div className="bg-gray-100 p-3 rounded">
                    <p className="font-medium text-sm text-gray-700">Current Score</p>
                    <p className="text-lg font-bold">{challenge.original_result.pair1_score} - {challenge.original_result.pair2_score}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded">
                    <p className="font-medium text-sm text-blue-700">Challenged Score</p>
                    <p className="text-lg font-bold text-blue-800">{challenge.challenged_pair1_score} - {challenge.challenged_pair2_score}</p>
                  </div>
                </div>
                
                {challenge.challenge_reason && (
                  <div className="bg-yellow-50 p-3 rounded mb-3 border border-yellow-200">
                    <p className="font-medium text-sm text-yellow-700">Reason for Challenge:</p>
                    <p className="text-sm text-yellow-800 italic">"{challenge.challenge_reason}"</p>
                  </div>
                )}
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleResolveChallenge(challenge.id, 'approve', {
                      pair1_score: challenge.challenged_pair1_score,
                      pair2_score: challenge.challenged_pair2_score
                    })}
                    disabled={loading}
                    className="bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 disabled:opacity-50 flex items-center"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Approve Challenge
                  </button>
                  <button
                    onClick={() => handleResolveChallenge(challenge.id, 'reject')}
                    disabled={loading}
                    className="bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700 disabled:opacity-50 flex items-center"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Reject Challenge
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Conflicts */}
      {pendingConflicts.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-800 mb-3 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Score Conflicts ({pendingConflicts.length})
          </h4>
          
          <div className="space-y-4">
            {pendingConflicts.map((conflict) => (
              <div key={conflict.id} className="bg-white rounded-lg p-4 border border-yellow-300">
                <div className="mb-3">
                  <p className="font-medium">
                    Week {conflict.fixture.match.week_number} - Court {conflict.fixture.court_number}
                  </p>
                  <p className="text-sm text-gray-600">
                    {conflict.fixture.player1.name} & {conflict.fixture.player2.name} vs{' '}
                    {conflict.fixture.player3.name} & {conflict.fixture.player4.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Conflict occurred: {new Date(conflict.created_at).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div className="bg-blue-100 p-3 rounded">
                    <p className="font-medium text-sm text-blue-700">First Submission</p>
                    <p className="text-lg font-bold">{conflict.first_submission.pair1_score} - {conflict.first_submission.pair2_score}</p>
                    <p className="text-xs text-gray-600">Submitted first</p>
                  </div>
                  <div className="bg-orange-100 p-3 rounded">
                    <p className="font-medium text-sm text-orange-700">Conflicting Score</p>
                    <p className="text-lg font-bold text-orange-800">{conflict.conflicting_submission.pair1_score} - {conflict.conflicting_submission.pair2_score}</p>
                    <p className="text-xs text-gray-600">By {conflict.conflicting_user.name}</p>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleResolveConflict(conflict.id, true)}
                    disabled={loading}
                    className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                  >
                    Keep Original Score
                  </button>
                  <button
                    onClick={() => handleResolveConflict(conflict.id, false)}
                    disabled={loading}
                    className="bg-orange-600 text-white px-3 py-2 rounded text-sm hover:bg-orange-700 disabled:opacity-50"
                  >
                    Use {conflict.conflicting_user.name}'s Score
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Results with Edit Capability */}
      <div className="bg-white rounded-lg shadow p-6">
        <h4 className="font-semibold mb-4 flex items-center">
          <Edit className="w-5 h-5 mr-2" />
          Recent Match Results - Admin Edit ({recentResults.length})
        </h4>
        
        {recentResults.length === 0 ? (
          <p className="text-gray-500">No results to display</p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {recentResults.map((result) => (
              <div key={result.id} className="border border-gray-200 rounded p-3 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      Week {result.fixture.match.week_number} - Court {result.fixture.court_number}
                    </p>
                    <p className="text-xs text-gray-600">
                      {result.fixture.player1.name} & {result.fixture.player2.name} vs{' '}
                      {result.fixture.player3.name} & {result.fixture.player4.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Submitted by {result.submitted_by_user.name} on {new Date(result.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  {editingScore === result.id ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={editForm.pair1_score}
                        onChange={(e) => setEditForm({...editForm, pair1_score: e.target.value})}
                        className="w-12 p-1 border border-gray-300 rounded text-center text-sm"
                        disabled={loading}
                      />
                      <span className="text-gray-500">-</span>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={editForm.pair2_score}
                        onChange={(e) => setEditForm({...editForm, pair2_score: e.target.value})}
                        className="w-12 p-1 border border-gray-300 rounded text-center text-sm"
                        disabled={loading}
                      />
                      <button
                        onClick={() => handleSaveEdit(result.id)}
                        disabled={loading || !editForm.pair1_score || !editForm.pair2_score}
                        className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 disabled:opacity-50"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingScore(null);
                          setEditForm({ pair1_score: '', pair2_score: '' });
                        }}
                        disabled={loading}
                        className="bg-gray-500 text-white px-2 py-1 rounded text-xs hover:bg-gray-600 disabled:opacity-50"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-lg text-gray-800">
                        {result.pair1_score} - {result.pair2_score}
                      </span>
                      <button
                        onClick={() => handleEditScore(result)}
                        disabled={loading}
                        className="bg-[#5D1F1F] text-white p-1 rounded text-xs hover:bg-[#4A1818] disabled:opacity-50"
                        title="Edit score"
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Show if this result has been challenged */}
                {challenges.some(c => c.original_result_id === result.id && c.status !== 'pending') && (
                  <div className="mt-2 text-xs">
                    {challenges.filter(c => c.original_result_id === result.id && c.status !== 'pending').map(c => (
                      <span key={c.id} className={`inline-block px-2 py-1 rounded mr-2 ${
                        c.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        Challenge {c.status} by {c.resolver?.name || 'Admin'}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-semibold mb-2">Score Management Summary</h4>
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-red-600">{pendingChallenges.length}</p>
            <p className="text-sm text-gray-600">Pending Challenges</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-yellow-600">{pendingConflicts.length}</p>
            <p className="text-sm text-gray-600">Score Conflicts</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">{challenges.filter(c => c.status === 'resolved').length}</p>
            <p className="text-sm text-gray-600">Resolved Challenges</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-600">{allResults.length}</p>
            <p className="text-sm text-gray-600">Total Results</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScoreChallengesSection;