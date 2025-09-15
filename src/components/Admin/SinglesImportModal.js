// Singles Match Import Modal
import React, { useState, useEffect } from 'react';
import { X, Trophy, Calendar, Users, Target } from 'lucide-react';

const SinglesImportModal = ({ isOpen, onClose, supabase, seasons, currentUser }) => {
  const [loading, setLoading] = useState(false);
  const [selectedSeasonId, setSelectedSeasonId] = useState('');
  const [matchDate, setMatchDate] = useState('');
  const [player1Id, setPlayer1Id] = useState('');
  const [player2Id, setPlayer2Id] = useState('');
  const [player1Score, setPlayer1Score] = useState('');
  const [player2Score, setPlayer2Score] = useState('');
  const [players, setPlayers] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Get singles championship seasons
  const singlesSeasons = seasons?.filter(s => s.season_type === 'singles_championship') || [];

  // Fetch players when modal opens
  useEffect(() => {
    const fetchPlayers = async () => {
      if (!supabase || !isOpen) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, name, email')
          .eq('status', 'approved')
          .order('name');
        
        if (error) throw error;
        setPlayers(data || []);
      } catch (err) {
        console.error('Failed to fetch players:', err);
        setError('Failed to load players');
      }
    };

    fetchPlayers();
  }, [isOpen, supabase]);

  const handleReset = (keepSeasonAndDate = false) => {
    if (!keepSeasonAndDate) {
      setSelectedSeasonId('');
      setMatchDate('');
    }
    setPlayer1Id('');
    setPlayer2Id('');
    setPlayer1Score('');
    setPlayer2Score('');
    setError('');
    setSuccess(false);
  };

  const handleClose = () => {
    handleReset(false); // Full reset when closing
    onClose();
  };

  const handleImportAnother = () => {
    handleReset(true); // Keep season and date for next match
  };

  const validateForm = () => {
    if (!selectedSeasonId) return 'Please select a season';
    if (!matchDate) return 'Please select a match date';
    if (!player1Id || !player2Id) return 'Please select both players';
    if (player1Id === player2Id) return 'Players must be different';
    if (!player1Score || !player2Score) return 'Please enter scores for both players';
    
    const score1 = parseInt(player1Score);
    const score2 = parseInt(player2Score);
    
    if (isNaN(score1) || isNaN(score2) || score1 < 0 || score2 < 0) {
      return 'Scores must be valid positive numbers';
    }
    
    // Ties are allowed in tennis (practice matches, interrupted games, etc.)
    
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const score1 = parseInt(player1Score);
      const score2 = parseInt(player2Score);
      
      // Step 1: Generate unique week number for this season
      const { data: existingMatches, error: weekError } = await supabase
        .from('matches')
        .select('week_number')
        .eq('season_id', selectedSeasonId)
        .order('week_number', { ascending: false })
        .limit(1);

      if (weekError) throw weekError;

      const nextWeekNumber = existingMatches.length > 0 ? (existingMatches[0].week_number + 1) : 1;

      // Step 2: Create match record
      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .insert({
          season_id: selectedSeasonId,
          week_number: nextWeekNumber, // Use incremental week numbers for singles
          match_date: matchDate
        })
        .select()
        .single();

      if (matchError) throw matchError;

      // Step 3: Create match fixture (singles format)
      const { data: fixtureData, error: fixtureError } = await supabase
        .from('match_fixtures')
        .insert({
          match_id: matchData.id,
          court_number: 1,
          game_number: 1,
          player1_id: player1Id,
          player2_id: player2Id,
          // Leave pair fields null for singles
          player3_id: null,
          player4_id: null,
          pair1_player1_id: null,
          pair1_player2_id: null,
          pair2_player1_id: null,
          pair2_player2_id: null,
          sitting_player_id: null,
          match_format: 'singles'
        })
        .select()
        .single();

      if (fixtureError) throw fixtureError;

      // Step 4: Create match result
      const { error: resultError } = await supabase
        .from('match_results')
        .insert({
          fixture_id: fixtureData.id,
          pair1_score: score1, // Player 1's games won
          pair2_score: score2, // Player 2's games won
          submitted_by: currentUser.id,
          verified: true // Admin imports are auto-verified
        });

      if (resultError) throw resultError;

      // Step 5: Update player stats
      await updatePlayerStats(player1Id, score1, score2);
      await updatePlayerStats(player2Id, score2, score1);

      setSuccess(true);
      // Don't auto-close anymore - let user choose their action

    } catch (err) {
      console.error('Failed to import singles match:', err);
      setError(err.message || 'Failed to import match');
    } finally {
      setLoading(false);
    }
  };

  const updatePlayerStats = async (playerId, playerScore, opponentScore) => {
    try {
      // Check if player exists in season_players
      const { data: existingStats } = await supabase
        .from('season_players')
        .select('*')
        .eq('season_id', selectedSeasonId)
        .eq('player_id', playerId)
        .single();

      const matchWon = playerScore > opponentScore;
      const gamesWon = parseInt(playerScore); // This player's games won
      const totalGames = parseInt(playerScore) + parseInt(opponentScore); // Total games in the match

      if (existingStats) {
        // Update existing stats
        await supabase
          .from('season_players')
          .update({
            matches_played: existingStats.matches_played + 1,
            matches_won: existingStats.matches_won + (matchWon ? 1 : 0),
            games_played: existingStats.games_played + totalGames,
            games_won: existingStats.games_won + gamesWon,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingStats.id);
      } else {
        // Create new stats record
        await supabase
          .from('season_players')
          .insert({
            season_id: selectedSeasonId,
            player_id: playerId,
            matches_played: 1,
            matches_won: matchWon ? 1 : 0,
            games_played: totalGames,
            games_won: gamesWon, // This player's actual games won
            rank: null // Singles championship doesn't use rankings
          });
      }
    } catch (err) {
      console.error('Failed to update player stats:', err);
      // Don't throw - the match was still created successfully
    }
  };

  const selectedPlayer1 = players.find(p => p.id === player1Id);
  const selectedPlayer2 = players.find(p => p.id === player2Id);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-orange-100 p-2 rounded-full">
                <Trophy className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Import Completed Singles Match</h3>
            </div>
            <button
              onClick={handleClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {success ? (
            <div className="text-center py-8">
              <div className="bg-green-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Trophy className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold text-green-800 mb-2">Match Imported Successfully!</h4>
              <p className="text-green-600 mb-4">
                {selectedPlayer1?.name} vs {selectedPlayer2?.name} - {player1Score}-{player2Score}
              </p>
              <p className="text-xs text-gray-500 mb-6">
                Season and date will be retained for next match
              </p>
              
              <div className="flex space-x-3 justify-center">
                <button
                  onClick={handleImportAnother}
                  className="bg-orange-600 text-white py-2 px-6 rounded-md hover:bg-orange-700 transition-colors font-medium"
                >
                  Import Another Match
                </button>
                <button
                  onClick={handleClose}
                  className="bg-gray-300 text-gray-700 py-2 px-6 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-red-700">{error}</p>
                </div>
              )}

              {/* Season Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Singles Championship Season
                </label>
                <select
                  value={selectedSeasonId}
                  onChange={(e) => setSelectedSeasonId(e.target.value)}
                  disabled={loading}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Select a season...</option>
                  {singlesSeasons.map(season => (
                    <option key={season.id} value={season.id}>
                      {season.name} ({season.status})
                    </option>
                  ))}
                </select>
                {singlesSeasons.length === 0 && (
                  <p className="text-sm text-amber-600 mt-1">
                    No Singles Championship seasons found. Create one first.
                  </p>
                )}
              </div>

              {/* Match Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Match Date
                </label>
                <input
                  type="date"
                  value={matchDate}
                  onChange={(e) => setMatchDate(e.target.value)}
                  disabled={loading}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              {/* Player Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Users className="w-4 h-4 inline mr-1" />
                    Player 1
                  </label>
                  <select
                    value={player1Id}
                    onChange={(e) => setPlayer1Id(e.target.value)}
                    disabled={loading}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">Select player 1...</option>
                    {players.filter(p => p.id !== player2Id).map(player => (
                      <option key={player.id} value={player.id}>
                        {player.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Users className="w-4 h-4 inline mr-1" />
                    Player 2
                  </label>
                  <select
                    value={player2Id}
                    onChange={(e) => setPlayer2Id(e.target.value)}
                    disabled={loading}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">Select player 2...</option>
                    {players.filter(p => p.id !== player1Id).map(player => (
                      <option key={player.id} value={player.id}>
                        {player.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Score Entry */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Target className="w-4 h-4 inline mr-1" />
                    {selectedPlayer1?.name || 'Player 1'} Games Won
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={player1Score}
                    onChange={(e) => setPlayer1Score(e.target.value)}
                    disabled={loading}
                    placeholder="e.g., 6"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Target className="w-4 h-4 inline mr-1" />
                    {selectedPlayer2?.name || 'Player 2'} Games Won
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={player2Score}
                    onChange={(e) => setPlayer2Score(e.target.value)}
                    disabled={loading}
                    placeholder="e.g., 4"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Match Preview */}
              {selectedPlayer1 && selectedPlayer2 && player1Score && player2Score && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h4 className="font-medium text-orange-800 mb-2">Match Preview:</h4>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-orange-900">
                      {selectedPlayer1.name} vs {selectedPlayer2.name}
                    </p>
                    <p className="text-2xl font-bold text-orange-800 my-2">
                      {player1Score} - {player2Score}
                    </p>
                    <p className="text-sm text-orange-700">
                      {parseInt(player1Score) === parseInt(player2Score) 
                        ? 'Result: Tie' 
                        : `Winner: ${parseInt(player1Score) > parseInt(player2Score) ? selectedPlayer1.name : selectedPlayer2.name}`
                      }
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {!success && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex space-x-3">
              <button
                onClick={handleSubmit}
                disabled={loading || validateForm() !== null}
                className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? 'Importing...' : 'Import Singles Match'}
              </button>
              <button
                onClick={handleClose}
                disabled={loading}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SinglesImportModal;