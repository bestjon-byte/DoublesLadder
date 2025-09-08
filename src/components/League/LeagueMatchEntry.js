// League Match Entry Form Component
// This component handles entering results for league matches (9 rubbers)

import React, { useState, useEffect } from 'react';
import { X, Plus, Save, AlertCircle, Users, Calendar, Trophy, FileText } from 'lucide-react';
import { validateLeagueMatchRubbers, generateLeagueRubberStructure } from '../../utils/helpers';
import { getExternalClubs, searchExternalPlayers, createExternalPlayer } from '../../utils/externalPlayerManager';
import { createLeagueMatch, submitLeagueMatchResults } from '../../utils/leagueMatchManager';
import { parseLeagueMatchData } from '../../utils/leagueMatchParser';
import { parseLeagueMatchFromURL } from '../../utils/leagueURLParser';

const LeagueMatchEntry = ({ 
  isOpen, 
  onClose, 
  selectedSeason, 
  seasonPlayers,
  onMatchSubmitted 
}) => {
  // Form state
  const [matchData, setMatchData] = useState({
    week_number: '',
    match_date: '',
    team: '1sts',
    opponent_club: ''
  });

  // Rubber results state (9 rubbers)
  const [rubbers, setRubbers] = useState([]);
  
  // External players and clubs
  const [externalClubs, setExternalClubs] = useState([]);
  const [playerSearchResults, setPlayerSearchResults] = useState({});
  const [newPlayerNames, setNewPlayerNames] = useState({});
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [step, setStep] = useState(1); // 1: Match Details, 2: Rubber Results
  const [showParser, setShowParser] = useState(false);
  const [parseText, setParseText] = useState('');
  const [parseURL, setParseURL] = useState('');
  const [parseMode, setParseMode] = useState('url'); // 'text' or 'url'

  // Initialize rubber structure
  useEffect(() => {
    if (isOpen && rubbers.length === 0) {
      const rubberStructure = generateLeagueRubberStructure().map(rubber => ({
        ...rubber,
        cawood_player1_id: null,
        cawood_player2_id: null,
        opponent_player1_id: null,
        opponent_player2_id: null,
        opponent_player1_name: '',
        opponent_player2_name: '',
        cawood_games_won: '',
        opponent_games_won: ''
      }));
      setRubbers(rubberStructure);
    }
  }, [isOpen, rubbers.length]);

  // Load external clubs
  useEffect(() => {
    const loadClubs = async () => {
      const result = await getExternalClubs();
      if (result.success) {
        setExternalClubs(result.data);
      }
    };
    if (isOpen) {
      loadClubs();
    }
  }, [isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setMatchData({
        week_number: '',
        match_date: '',
        team: '1sts',
        opponent_club: ''
      });
      setRubbers([]);
      setErrors([]);
      setStep(1);
      setPlayerSearchResults({});
      setNewPlayerNames({});
    }
  }, [isOpen]);

  // Search for external players
  const searchPlayers = async (searchTerm, rubberIndex, playerPosition) => {
    if (!searchTerm || searchTerm.length < 2) {
      setPlayerSearchResults({ ...playerSearchResults, [`${rubberIndex}_${playerPosition}`]: [] });
      return;
    }

    const result = await searchExternalPlayers(searchTerm, matchData.opponent_club);
    if (result.success) {
      setPlayerSearchResults({ 
        ...playerSearchResults, 
        [`${rubberIndex}_${playerPosition}`]: result.data 
      });
    }
  };

  // Handle external player selection or creation
  const handleExternalPlayerSelect = async (rubberIndex, playerPosition, playerData) => {
    let playerId = playerData.id;
    
    // Create new player if needed
    if (!playerId && playerData.name) {
      setLoading(true);
      const createResult = await createExternalPlayer({
        name: playerData.name,
        club_name: matchData.opponent_club
      });
      setLoading(false);
      
      if (createResult.success) {
        playerId = createResult.data.id;
      } else {
        setErrors([...errors, `Failed to create player ${playerData.name}: ${createResult.error}`]);
        return;
      }
    }

    // Update rubber
    const updatedRubbers = [...rubbers];
    updatedRubbers[rubberIndex] = {
      ...updatedRubbers[rubberIndex],
      [`opponent_${playerPosition}_id`]: playerId,
      [`opponent_${playerPosition}_name`]: playerData.name
    };
    setRubbers(updatedRubbers);
    
    // Clear search results
    const searchKey = `${rubberIndex}_${playerPosition}`;
    setPlayerSearchResults({ ...playerSearchResults, [searchKey]: [] });
  };

  // Update rubber data
  const updateRubber = (index, field, value) => {
    const updatedRubbers = [...rubbers];
    updatedRubbers[index] = { ...updatedRubbers[index], [field]: value };
    setRubbers(updatedRubbers);
  };

  // Parse league match data from text or URL
  const handleParseData = async () => {
    if (parseMode === 'text' && !parseText.trim()) {
      alert('Please paste the league match data first');
      return;
    }
    
    if (parseMode === 'url' && !parseURL.trim()) {
      alert('Please enter the league match URL first');
      return;
    }

    try {
      setLoading(true);
      
      let parseResult;
      if (parseMode === 'url') {
        parseResult = await parseLeagueMatchFromURL(parseURL);
      } else {
        parseResult = parseLeagueMatchData(parseText);
      }
      
      if (!parseResult.success) {
        alert(`Error parsing data: ${parseResult.error}`);
        return;
      }

      const { data } = parseResult;
      
      // Update match data
      if (data.matchDate) {
        setMatchData(prev => ({
          ...prev,
          match_date: data.matchDate,
          opponent_club: data.awayTeam === 'Cawood 2' || data.awayTeam === 'Cawood' ? data.homeTeam : data.awayTeam
        }));
      }

      // Update rubber data with parsed results
      if (data.pairs && data.pairs.length > 0) {
        const updatedRubbers = rubbers.map((rubber, index) => {
          const pairIndex = Math.floor(index / 3);
          const rubberIndex = index % 3;
          
          if (data.pairs[pairIndex] && data.pairs[pairIndex].rubbers[rubberIndex]) {
            const parsedRubber = data.pairs[pairIndex].rubbers[rubberIndex];
            const parsedPair = data.pairs[pairIndex];
            
            return {
              ...rubber,
              opponent_player1_name: rubberIndex === 0 ? parsedPair.awayPlayer1 : rubber.opponent_player1_name,
              opponent_player2_name: rubberIndex === 0 ? parsedPair.awayPlayer2 : rubber.opponent_player2_name,
              cawood_games_won: parsedRubber.home.toString(),
              opponent_games_won: parsedRubber.away.toString()
            };
          }
          return rubber;
        });
        
        setRubbers(updatedRubbers);
      }

      // Close parser and move to rubber entry
      setShowParser(false);
      setParseText('');
      setParseURL('');
      setStep(2);
      alert('Match data parsed successfully! Please review and complete the remaining fields.');
      
    } catch (error) {
      alert(`Error parsing data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Validate and submit match
  const handleSubmit = async () => {
    setLoading(true);
    setErrors([]);

    try {
      // Validate match data
      if (!matchData.week_number || !matchData.match_date || !matchData.opponent_club) {
        throw new Error('Please fill in all match details');
      }

      // Convert rubber data for validation
      const rubberData = rubbers.map(rubber => ({
        cawood_player1_id: rubber.cawood_player1_id,
        cawood_player2_id: rubber.cawood_player2_id,
        opponent_player1_id: rubber.opponent_player1_id,
        opponent_player2_id: rubber.opponent_player2_id,
        cawood_games_won: parseInt(rubber.cawood_games_won) || 0,
        opponent_games_won: parseInt(rubber.opponent_games_won) || 0
      }));

      // Validate rubbers
      const validation = validateLeagueMatchRubbers(rubberData);
      if (!validation.isValid) {
        setErrors(validation.errors);
        setLoading(false);
        return;
      }

      // Create match fixture
      const matchResult = await createLeagueMatch({
        season_id: selectedSeason.id,
        match_date: matchData.match_date,
        week_number: parseInt(matchData.week_number),
        team: matchData.team,
        opponent_club: matchData.opponent_club
      });

      if (!matchResult.success) {
        throw new Error(matchResult.error);
      }

      // Submit rubber results
      const resultsResult = await submitLeagueMatchResults({
        fixture_id: matchResult.data.fixture.id,
        rubbers: rubberData
      });

      if (!resultsResult.success) {
        throw new Error(resultsResult.error);
      }

      // Success!
      if (onMatchSubmitted) {
        onMatchSubmitted();
      }
      onClose();
      
    } catch (error) {
      setErrors([error.message]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <Trophy className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Enter League Match Results</h2>
              <p className="text-sm text-gray-600">{selectedSeason?.name} - {matchData.team}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>1</div>
              <span className="text-sm font-medium">Match Details</span>
            </div>
            <div className="w-8 h-0.5 bg-gray-300"></div>
            <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>2</div>
              <span className="text-sm font-medium">Rubber Results</span>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Step 1: Match Details */}
          {step === 1 && (
            <div className="p-6 space-y-6">
              {/* Parse Data Section */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <h3 className="font-medium text-blue-900">Quick Data Entry</h3>
                  </div>
                  <button
                    onClick={() => setShowParser(!showParser)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    {showParser ? 'Hide Parser' : 'Parse from Website'}
                  </button>
                </div>
                
                {showParser && (
                  <div className="space-y-4">
                    {/* Parse Mode Toggle */}
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="url"
                          checked={parseMode === 'url'}
                          onChange={(e) => setParseMode(e.target.value)}
                          className="mr-2"
                        />
                        <span className="text-sm font-medium text-blue-700">From URL (Recommended)</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="text"
                          checked={parseMode === 'text'}
                          onChange={(e) => setParseMode(e.target.value)}
                          className="mr-2"
                        />
                        <span className="text-sm font-medium text-blue-700">From Text</span>
                      </label>
                    </div>

                    {parseMode === 'url' ? (
                      <div className="space-y-3">
                        <p className="text-sm text-blue-700">
                          Enter the York Men's Tennis League match URL to automatically fetch all data:
                        </p>
                        <input
                          type="url"
                          value={parseURL}
                          onChange={(e) => setParseURL(e.target.value)}
                          placeholder="https://www.yorkmenstennisleague.co.uk/fixtures/339"
                          className="w-full px-3 py-2 border border-blue-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                        <div className="text-xs text-blue-600 bg-blue-100 p-2 rounded">
                          💡 <strong>Example:</strong> https://www.yorkmenstennisleague.co.uk/fixtures/339
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-blue-700">
                          Copy and paste match results from the league website:
                        </p>
                        <textarea
                          value={parseText}
                          onChange={(e) => setParseText(e.target.value)}
                          placeholder="Paste league match results here..."
                          className="w-full h-32 px-3 py-2 border border-blue-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <button
                        onClick={handleParseData}
                        disabled={(parseMode === 'url' ? !parseURL.trim() : !parseText.trim()) || loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
                      >
                        {loading ? 'Parsing...' : `Parse ${parseMode === 'url' ? 'URL' : 'Text'}`}
                      </button>
                      <button
                        onClick={() => {
                          setParseText('');
                          setParseURL('');
                          setShowParser(false);
                        }}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Week Number
                  </label>
                  <input
                    type="number"
                    value={matchData.week_number}
                    onChange={(e) => setMatchData({ ...matchData, week_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="1"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Match Date
                  </label>
                  <input
                    type="date"
                    value={matchData.match_date}
                    onChange={(e) => setMatchData({ ...matchData, match_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Users className="w-4 h-4 inline mr-1" />
                    Team
                  </label>
                  <select
                    value={matchData.team}
                    onChange={(e) => setMatchData({ ...matchData, team: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="1sts">1sts</option>
                    <option value="2nds">2nds</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Opponent Club
                  </label>
                  <input
                    type="text"
                    value={matchData.opponent_club}
                    onChange={(e) => setMatchData({ ...matchData, opponent_club: e.target.value })}
                    list="clubs-list"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter opponent club name"
                  />
                  <datalist id="clubs-list">
                    {externalClubs.map(club => (
                      <option key={club} value={club} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setStep(2)}
                  disabled={!matchData.week_number || !matchData.match_date || !matchData.opponent_club}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next: Enter Results
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Rubber Results */}
          {step === 2 && (
            <div className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Match Results Grid</h3>
                <p className="text-sm text-gray-600">
                  Enter results for all 9 rubbers. Each rubber must total exactly 12 games.
                </p>
              </div>

              {/* Error Messages */}
              {errors.length > 0 && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-red-900">Please fix these errors:</h4>
                      <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                        {errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Rubber Results Grid */}
              <div className="space-y-4">
                {rubbers.map((rubber, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">Rubber {rubber.rubber_number}</h4>
                      <span className="text-sm text-gray-500">{rubber.description}</span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      {/* Cawood Pair */}
                      <div className="space-y-3">
                        <h5 className="text-sm font-medium text-gray-700">Cawood Pair</h5>
                        <div className="space-y-2">
                          <select
                            value={rubber.cawood_player1_id || ''}
                            onChange={(e) => updateRubber(index, 'cawood_player1_id', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select Player 1</option>
                            {seasonPlayers?.map(player => (
                              <option key={player.id} value={player.id}>{player.name}</option>
                            ))}
                          </select>
                          <select
                            value={rubber.cawood_player2_id || ''}
                            onChange={(e) => updateRubber(index, 'cawood_player2_id', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select Player 2</option>
                            {seasonPlayers?.map(player => (
                              <option key={player.id} value={player.id}>{player.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Opponent Pair */}
                      <div className="space-y-3">
                        <h5 className="text-sm font-medium text-gray-700">Opponent Pair</h5>
                        <div className="space-y-2">
                          {/* Opponent Player 1 */}
                          <div className="relative">
                            <input
                              type="text"
                              value={rubber.opponent_player1_name || ''}
                              onChange={(e) => {
                                updateRubber(index, 'opponent_player1_name', e.target.value);
                                searchPlayers(e.target.value, index, 'player1');
                              }}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Opponent Player 1"
                            />
                            {playerSearchResults[`${index}_player1`]?.length > 0 && (
                              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-32 overflow-y-auto">
                                {playerSearchResults[`${index}_player1`].map(player => (
                                  <button
                                    key={player.id}
                                    onClick={() => handleExternalPlayerSelect(index, 'player1', player)}
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                                  >
                                    {player.name}
                                  </button>
                                ))}
                                {rubber.opponent_player1_name && (
                                  <button
                                    onClick={() => handleExternalPlayerSelect(index, 'player1', { name: rubber.opponent_player1_name })}
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 border-t text-blue-600"
                                  >
                                    <Plus className="w-3 h-3 inline mr-1" />
                                    Add "{rubber.opponent_player1_name}"
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Opponent Player 2 */}
                          <div className="relative">
                            <input
                              type="text"
                              value={rubber.opponent_player2_name || ''}
                              onChange={(e) => {
                                updateRubber(index, 'opponent_player2_name', e.target.value);
                                searchPlayers(e.target.value, index, 'player2');
                              }}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Opponent Player 2"
                            />
                            {playerSearchResults[`${index}_player2`]?.length > 0 && (
                              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-32 overflow-y-auto">
                                {playerSearchResults[`${index}_player2`].map(player => (
                                  <button
                                    key={player.id}
                                    onClick={() => handleExternalPlayerSelect(index, 'player2', player)}
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                                  >
                                    {player.name}
                                  </button>
                                ))}
                                {rubber.opponent_player2_name && (
                                  <button
                                    onClick={() => handleExternalPlayerSelect(index, 'player2', { name: rubber.opponent_player2_name })}
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 border-t text-blue-600"
                                  >
                                    <Plus className="w-3 h-3 inline mr-1" />
                                    Add "{rubber.opponent_player2_name}"
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Score */}
                      <div className="space-y-3">
                        <h5 className="text-sm font-medium text-gray-700">Score</h5>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            value={rubber.cawood_games_won}
                            onChange={(e) => updateRubber(index, 'cawood_games_won', e.target.value)}
                            className="w-16 px-2 py-1 text-sm text-center border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                            min="0"
                            max="12"
                            placeholder="0"
                          />
                          <span className="text-sm text-gray-500">-</span>
                          <input
                            type="number"
                            value={rubber.opponent_games_won}
                            onChange={(e) => updateRubber(index, 'opponent_games_won', e.target.value)}
                            className="w-16 px-2 py-1 text-sm text-center border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                            min="0"
                            max="12"
                            placeholder="0"
                          />
                        </div>
                        <div className="text-xs text-gray-500">
                          Total: {(parseInt(rubber.cawood_games_won) || 0) + (parseInt(rubber.opponent_games_won) || 0)}/12
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between space-x-3 pt-6 border-t">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{loading ? 'Saving...' : 'Save Match Results'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeagueMatchEntry;