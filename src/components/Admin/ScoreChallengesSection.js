// src/components/Admin/ScoreChallengesSection.js - DEBUG VERSION
import React, { useState, useEffect } from 'react';
import { Flag, Check, X, Edit, AlertTriangle } from 'lucide-react';
import { supabase } from '../../supabaseClient';

const ScoreChallengesSection = ({ currentUser, onDataRefresh }) => {
  const [challenges, setChallenges] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [allResults, setAllResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingScore, setEditingScore] = useState(null);
  const [editForm, setEditForm] = useState({ pair1_score: '', pair2_score: '' });
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    console.log('🔍 ScoreChallengesSection mounted, fetching data...');
    fetchAllResults();
  }, []);

  const fetchAllResults = async () => {
    try {
      console.log('📊 Fetching match results...');
      setDebugInfo('Fetching results...');
      
      // First, let's try a simple query
      const { data: simpleResults, error: simpleError } = await supabase
        .from('match_results')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Simple results query:', { simpleResults, simpleError });

      if (simpleError) {
        console.error('❌ Error fetching simple results:', simpleError);
        setDebugInfo(`Error fetching simple results: ${simpleError.message}`);
        setAllResults([]);
        return;
      }

      console.log('✅ Found results (simple):', simpleResults?.length || 0);
      setDebugInfo(`Found ${simpleResults?.length || 0} results (simple query)`);

      if (!simpleResults || simpleResults.length === 0) {
        setAllResults([]);
        return;
      }

      // Now try with fixture joins
      const { data: complexResults, error: complexError } = await supabase
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

      console.log('Complex results query:', { complexResults, complexError });

      if (complexError) {
        console.error('❌ Error fetching complex results:', complexError);
        setDebugInfo(`Complex query failed: ${complexError.message}. Using simple results.`);
        setAllResults(simpleResults);
      } else {
        console.log('✅ Complex query successful:', complexResults?.length || 0);
        setDebugInfo(`Successfully fetched ${complexResults?.length || 0} results with player data`);
        setAllResults(complexResults || []);
      }
    } catch (error) {
      console.error('💥 Error in fetchAllResults:', error);
      setDebugInfo(`Unexpected error: ${error.message}`);
      setAllResults([]);
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

      const { data, error } = await supabase
        .from('match_results')
        .update({
          pair1_score: parseInt(editForm.pair1_score),
          pair2_score: parseInt(editForm.pair2_score)
        })
        .eq('id', resultId)
        .select();

      if (error) {
        console.error('❌ Error updating score:', error);
        alert('Error updating score: ' + error.message);
      } else {
        console.log('✅ Score updated successfully:', data);
        alert('Score updated successfully!');
        setEditingScore(null);
        setEditForm({ pair1_score: '', pair2_score: '' });
        await fetchAllResults();
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

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <h3 className="text-lg font-semibold">Score Management</h3>
      </div>
      
      {/* DEBUG INFO */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-800 mb-2">🔧 Debug Info</h4>
        <p className="text-sm text-blue-700">{debugInfo}</p>
        <p className="text-xs text-blue-600 mt-2">
          Current User: {currentUser?.name || 'None'} | Role: {currentUser?.role || 'None'}
        </p>
      </div>

      {/* Match Results */}
      <div className="bg-white rounded-lg shadow p-6">
        <h4 className="font-semibold mb-4 flex items-center">
          <Edit className="w-5 h-5 mr-2" />
          Recent Match Results - Admin Edit ({allResults.length})
        </h4>
        
        {allResults.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No results to display</p>
            <button 
              onClick={fetchAllResults}
              className="mt-2 bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
            >
              🔄 Refresh Results
            </button>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {allResults.slice(0, 20).map((result) => (
              <div key={result.id} className="border border-gray-200 rounded p-3 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    {/* Match context */}
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
                        <p className="text-xs text-gray-400">Fixture ID: {result.fixture_id}</p>
                      </div>
                    )}
                    
                    {/* Score editing */}
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
                          <span className="text-xs text-gray-500">
                            {result.created_at ? new Date(result.created_at).toLocaleDateString('en-GB') : 'Unknown date'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {editingScore !== result.id && (
                    <button 
                      onClick={() => handleEditScore(result)}
                      disabled={loading}
                      className="bg-[#5D1F1F] text-white p-1 rounded text-xs hover:bg-[#4A1818]"
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                  )}
                </div>
                
                <div className="text-xs text-gray-400 mt-1 pt-1 border-t border-gray-100">
                  ID: {result.id.substring(0, 8)}... | Submitted: {result.submitted_by || 'Unknown'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScoreChallengesSection;