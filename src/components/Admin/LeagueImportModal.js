// League Import Modal - New Implementation
import React, { useState, useEffect } from 'react';
import { X, Globe, AlertCircle, CheckCircle, Download, FileText, Users, UserPlus } from 'lucide-react';
import { parseLeagueMatchFromText } from '../../utils/leagueTextParser';
import { findPlayerMatches, identifyCawoodPlayers, generateDummyEmail, getCachedPlayerMatches, saveCachedPlayerMatch } from '../../utils/playerMatcher';

const LeagueImportModal = ({ isOpen, onClose, supabase, selectedSeason }) => {
  const [textData, setTextData] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [step, setStep] = useState('parse'); // 'parse', 'match', 'import'
  const [existingPlayers, setExistingPlayers] = useState([]);
  const [cachedMatches, setCachedMatches] = useState([]);
  const [playerMatches, setPlayerMatches] = useState([]);
  const [matchingData, setMatchingData] = useState(null);
  const [importSuccess, setImportSuccess] = useState(false);

  // Fetch existing players and cached matches on component mount
  useEffect(() => {
    const fetchData = async () => {
      if (!supabase) return;
      
      try {
        // Fetch existing players
        const { data: playersData, error: playersError } = await supabase
          .from('profiles')
          .select('id, name, email')
          .in('role', ['player', 'admin'])  // Include both players and admins
          .eq('status', 'approved')
          .order('name');
        
        if (playersError) throw playersError;
        setExistingPlayers(playersData || []);

        // Fetch cached player matches
        const cachedData = await getCachedPlayerMatches(supabase);
        setCachedMatches(cachedData);
        
      } catch (err) {
        console.error('Failed to fetch data:', err);
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen, supabase]);

  const handleReset = () => {
    setTextData('');
    setResult(null);
    setError('');
    setStep('parse');
    setPlayerMatches([]);
    setMatchingData(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleParse = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      if (!textData.trim()) {
        setError('Please paste the match text data');
        return;
      }

      const parseResult = parseLeagueMatchFromText(textData);
      
      if (parseResult.success) {
        setResult(parseResult.data);
        setError('');
        
        // Identify Cawood players and start matching process
        const playerData = identifyCawoodPlayers(parseResult.data);
        setMatchingData(playerData);
        
        // Generate matches for each Cawood player with cache support
        const matches = playerData.cawoodPlayers.map(playerName => {
          const suggestions = findPlayerMatches(playerName, existingPlayers, cachedMatches);
          
          // Check if there's a cached match for this player
          const cachedMatch = cachedMatches.find(cache => 
            cache.parsed_name.toLowerCase() === playerName.toLowerCase()
          );
          
          const cachedPlayer = cachedMatch ? 
            existingPlayers.find(p => p.id === cachedMatch.matched_player_id) : null;
          
          return {
            parsedName: playerName,
            suggestions: suggestions,
            selectedMatch: cachedPlayer, // Auto-select cached match
            createNew: false,
            isCachedMatch: !!cachedPlayer,
            newPlayerData: {
              name: playerName,
              email: generateDummyEmail(playerName)
            }
          };
        });
        
        setPlayerMatches(matches);
        setStep('match');
      } else {
        setError(parseResult.error || 'Failed to parse match text');
        setResult(null);
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const renderParsedData = () => {
    if (!result) return null;

    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-4">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-green-800">Match Data Parsed Successfully!</h3>
        </div>

        <div className="space-y-4">
          {/* Match Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Match Information</h4>
              <div className="text-sm space-y-1">
                <p><strong>Date:</strong> {result.matchDate || 'Not found'}</p>
                <p><strong>Time:</strong> {result.matchTime || 'Not found'}</p>
                <p><strong>Home Team:</strong> {result.homeTeam || 'Not found'}</p>
                <p><strong>Away Team:</strong> {result.awayTeam || 'Not found'}</p>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 mb-2">Data Summary</h4>
              <div className="text-sm space-y-1">
                <p><strong>Home Team Pairs:</strong> {result.homeTeamPairs?.length || 0}</p>
                <p><strong>Away Team Pairs:</strong> {result.awayTeamPairs?.length || 0}</p>
                <p><strong>Scoring Matrix:</strong> {result.scoringMatrix?.length || 0} rows</p>
              </div>
            </div>
          </div>

          {/* Team Pairs */}
          {result.homeTeamPairs && result.homeTeamPairs.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Home Team Pairs ({result.homeTeam})</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                {result.homeTeamPairs.map((pair, index) => (
                  <div key={index} className="bg-white p-2 rounded border">
                    <p className="font-medium">Pair {index + 1}</p>
                    <p>{pair.player1}</p>
                    <p>{pair.player2}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.awayTeamPairs && result.awayTeamPairs.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Away Team Pairs ({result.awayTeam})</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                {result.awayTeamPairs.map((pair, index) => (
                  <div key={index} className="bg-white p-2 rounded border">
                    <p className="font-medium">Pair {index + 1}</p>
                    <p>{pair.player1}</p>
                    <p>{pair.player2}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scoring Matrix */}
          {result.scoringMatrix && result.scoringMatrix.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Scoring Matrix</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border border-gray-300 px-2 py-1">Home Pair ({result.homeTeam})</th>
                      {result.awayTeamPairs?.map((pair, index) => (
                        <th key={index} className="border border-gray-300 px-2 py-1">
                          vs {pair.player1} & {pair.player2}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.scoringMatrix.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        <td className="border border-gray-300 px-2 py-1 font-medium">
                          {result.homeTeamPairs?.[rowIndex] ? 
                            `${result.homeTeamPairs[rowIndex].player1} & ${result.homeTeamPairs[rowIndex].player2}` : 
                            `Home Pair ${rowIndex + 1}`
                          }
                        </td>
                        {row.map((score, colIndex) => (
                          <td key={colIndex} className="border border-gray-300 px-2 py-1 text-center">
                            {score ? `${score.homeScore}-${score.awayScore}` : 'No score'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Raw Data (for debugging) */}
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
              Show Raw Parsed Data (for debugging)
            </summary>
            <pre className="mt-2 p-3 bg-gray-100 text-xs overflow-auto max-h-40 rounded">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    );
  };

  const renderPlayerMatching = () => {
    if (!matchingData || !playerMatches.length) return null;

    const handleMatchSelection = (index, selectedPlayer) => {
      const newMatches = [...playerMatches];
      newMatches[index].selectedMatch = selectedPlayer;
      newMatches[index].createNew = false;
      setPlayerMatches(newMatches);
    };

    const handleCreateNew = (index, checked) => {
      const newMatches = [...playerMatches];
      newMatches[index].createNew = checked;
      if (checked) {
        newMatches[index].selectedMatch = null;
      }
      setPlayerMatches(newMatches);
    };

    const handleNewPlayerChange = (index, field, value) => {
      const newMatches = [...playerMatches];
      newMatches[index].newPlayerData[field] = value;
      setPlayerMatches(newMatches);
    };

    const canProceed = playerMatches.every(match => 
      match.selectedMatch || (match.createNew && match.newPlayerData.name.trim() && match.newPlayerData.email.trim())
    );

    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-blue-800">Player Matching Required</h3>
          </div>
          <p className="text-sm text-blue-700">
            Match the {matchingData.cawoodPlayers.length} Cawood players from the parsed data with existing users, or create new accounts.
          </p>
          <p className="text-xs text-blue-600 mt-1">
            <strong>Opponent club:</strong> {matchingData.opponentClub} ({matchingData.opponentPlayers.length} players)
          </p>
        </div>

        <div className="space-y-4">
          {playerMatches.map((match, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">
                  Parsed Name: <span className="text-blue-600">{match.parsedName}</span>
                  {match.isCachedMatch && (
                    <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                      ✓ Previously Confirmed
                    </span>
                  )}
                </h4>
                <div className="text-sm text-gray-500">
                  {match.suggestions.length} player{match.suggestions.length !== 1 ? 's' : ''} starting with "{match.parsedName.charAt(0).toUpperCase()}"
                </div>
              </div>

              {/* Existing player suggestions */}
              {match.suggestions.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Players starting with "{match.parsedName.charAt(0).toUpperCase()}":
                  </label>
                  <div className="space-y-2">
                    {match.suggestions.map((suggestion, suggestionIndex) => (
                      <label key={suggestionIndex} className={`flex items-center space-x-3 p-2 border rounded hover:bg-gray-50 ${
                        suggestion.isCached ? 'border-green-300 bg-green-50' : ''
                      }`}>
                        <input
                          type="radio"
                          name={`player-${index}`}
                          checked={match.selectedMatch?.id === suggestion.player.id}
                          onChange={() => handleMatchSelection(index, suggestion.player)}
                          disabled={match.createNew}
                          className="text-blue-600"
                        />
                        <div className="flex-1">
                          <div className="font-medium">{suggestion.player.name}</div>
                          <div className="text-sm text-gray-500">{suggestion.player.email}</div>
                        </div>
                        <div className="text-right">
                          {suggestion.isCached && (
                            <div className="text-sm font-medium text-green-600">✓ Cached</div>
                          )}
                          {suggestion.isExact && !suggestion.isCached && (
                            <div className="text-sm font-medium text-blue-600">Exact match</div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Create new user option */}
              <div className="border-t pt-4">
                <label className="flex items-center space-x-3 mb-3">
                  <input
                    type="checkbox"
                    checked={match.createNew}
                    onChange={(e) => handleCreateNew(index, e.target.checked)}
                    className="text-blue-600"
                  />
                  <span className="font-medium text-gray-700">Create new user</span>
                  <UserPlus className="w-4 h-4 text-gray-400" />
                </label>

                {match.createNew && (
                  <div className="ml-6 space-y-3 bg-gray-50 p-3 rounded">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <input
                        type="text"
                        value={match.newPlayerData.name}
                        onChange={(e) => handleNewPlayerChange(index, 'name', e.target.value)}
                        className="mt-1 w-full px-3 py-1 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <input
                        type="email"
                        value={match.newPlayerData.email}
                        onChange={(e) => handleNewPlayerChange(index, 'email', e.target.value)}
                        className="mt-1 w-full px-3 py-1 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Dummy email format recommended</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <button
            onClick={() => setStep('parse')}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
          >
            ← Back to Parsing
          </button>
          <button
            onClick={() => setStep('import')}
            disabled={!canProceed}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Proceed to Import →
          </button>
        </div>
      </div>
    );
  };

  // Import to database
  const handleImport = async () => {
    if (!selectedSeason || !matchingData || !playerMatches || !result || !supabase) {
      setError('Missing required data for import');
      return;
    }

    // Validate season type
    if (selectedSeason.season_type !== 'league') {
      setError('League matches can only be imported to league seasons. Please select a league season.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { matchDate, homeTeam, awayTeam, scoringMatrix } = result;
      const { cawoodPlayers, opponentPlayers, opponentClub, cawoodIsHome } = matchingData;

      // Extract team name (1sts or 2nds) from Cawood team name
      const cawoodTeamName = cawoodIsHome ? homeTeam : awayTeam;
      const team = cawoodTeamName.toLowerCase().includes('2') ? '2nds' : '1sts';

      // 1. Create or find the match record with next available week number
      const { data: existingMatches } = await supabase
        .from('matches')
        .select('week_number')
        .eq('season_id', selectedSeason.id)
        .order('week_number', { ascending: false })
        .limit(1);

      const nextWeekNumber = existingMatches?.length > 0 ? (existingMatches[0].week_number || 0) + 1 : 1;

      const { data: matchRecord, error: matchError } = await supabase
        .from('matches')
        .insert({
          season_id: selectedSeason.id,
          week_number: nextWeekNumber,
          match_date: matchDate
        })
        .select()
        .single();

      if (matchError) throw matchError;

      // 2. Create external players for opponents
      const externalPlayerIds = {};
      for (const opponentName of opponentPlayers) {
        const { data: existingExternal } = await supabase
          .from('external_players')
          .select('id')
          .eq('name', opponentName)
          .eq('club_name', opponentClub)
          .maybeSingle();

        if (existingExternal) {
          externalPlayerIds[opponentName] = existingExternal.id;
        } else {
          const { data: newExternal, error: externalError } = await supabase
            .from('external_players')
            .insert({
              name: opponentName,
              club_name: opponentClub
            })
            .select('id')
            .single();

          if (externalError) throw externalError;
          externalPlayerIds[opponentName] = newExternal.id;
        }
      }

      // 3. Create new Cawood players if needed
      const cawoodPlayerIds = {};
      for (const match of playerMatches) {
        if (match.createNew && match.newPlayerData.name.trim()) {
          // Create new profile
          const { data: newProfile, error: profileError } = await supabase
            .from('profiles')
            .insert({
              name: match.newPlayerData.name,
              email: match.newPlayerData.email,
              status: 'approved',
              role: 'player'
            })
            .select('id')
            .single();

          if (profileError) throw profileError;
          cawoodPlayerIds[match.parsedName] = newProfile.id;
        } else if (match.selectedMatch) {
          cawoodPlayerIds[match.parsedName] = match.selectedMatch.id;
        }
      }

      // 4. Create match fixture (league matches don't need individual player assignments)
      const cawoodPlayersList = Object.values(cawoodPlayerIds);
      if (cawoodPlayersList.length === 0) {
        throw new Error(`No Cawood players found or created`);
      }

      const { data: fixture, error: fixtureError } = await supabase
        .from('match_fixtures')
        .insert({
          match_id: matchRecord.id,
          court_number: 1,
          game_number: 1,
          // For league matches, we only need these dummy player IDs (required by schema)
          player1_id: cawoodPlayersList[0],
          player2_id: cawoodPlayersList[1] || cawoodPlayersList[0],
          player3_id: cawoodPlayersList[2] || cawoodPlayersList[0],
          player4_id: cawoodPlayersList[3] || cawoodPlayersList[0],
          // League-specific fields
          match_type: 'league',
          team: team,
          opponent_club: opponentClub
        })
        .select()
        .single();

      if (fixtureError) throw fixtureError;

      // 5. Create league match rubbers
      const cawoodPairs = cawoodIsHome ? result.homeTeamPairs : result.awayTeamPairs;
      const opponentPairs = cawoodIsHome ? result.awayTeamPairs : result.homeTeamPairs;
      
      let rubberNumber = 1;
      for (let pairIndex = 0; pairIndex < Math.min(cawoodPairs.length, 3); pairIndex++) {
        const cawoodPair = cawoodPairs[pairIndex];
        
        for (let oppPairIndex = 0; oppPairIndex < Math.min(opponentPairs.length, 3); oppPairIndex++) {
          const opponentPair = opponentPairs[oppPairIndex];
          // Fix matrix indexing based on home/away status
          const rubber = cawoodIsHome ? 
            scoringMatrix[pairIndex]?.[oppPairIndex] :  // Home: [cawoodPair][opponentPair]
            scoringMatrix[oppPairIndex]?.[pairIndex];   // Away: [opponentPair][cawoodPair]
          
          if (rubber) {
            // Simple: just store the scores directly from the matrix
            // homeScore = home team games, awayScore = away team games
            // Determine which is Cawood based on cawoodIsHome
            const cawoodGames = cawoodIsHome ? rubber.homeScore : rubber.awayScore;
            const opponentGames = cawoodIsHome ? rubber.awayScore : rubber.homeScore;
            
            const { error: rubberError } = await supabase
              .from('league_match_rubbers')
              .insert({
                match_fixture_id: fixture.id,
                rubber_number: rubberNumber,
                cawood_player1_id: cawoodPlayerIds[cawoodPair.player1],
                cawood_player2_id: cawoodPlayerIds[cawoodPair.player2],
                opponent_player1_id: externalPlayerIds[opponentPair.player1],
                opponent_player2_id: externalPlayerIds[opponentPair.player2],
                cawood_games_won: cawoodGames,
                opponent_games_won: opponentGames
              });

            if (rubberError) throw rubberError;
            rubberNumber++;
          }
        }
      }

      // Save confirmed player matches to cache for future imports
      const currentUserId = supabase?.auth?.user?.id;
      for (const match of playerMatches) {
        if (match.selectedMatch && !match.createNew && !match.isCachedMatch) {
          // This is a new confirmation that should be cached
          await saveCachedPlayerMatch(
            supabase, 
            match.parsedName, 
            match.selectedMatch.id, 
            currentUserId
          );
        }
      }

      setImportSuccess(true);
      setStep('success');
      
    } catch (err) {
      console.error('Import error:', err);
      setError(`Import failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">League Match Import</h2>
              <p className="text-sm text-gray-600">Import match results by pasting match text data</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'parse' && (
          <div className="space-y-6">
            {/* Text Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Match Data Text
              </label>
              <div className="space-y-2">
                <textarea
                  value={textData}
                  onChange={(e) => setTextData(e.target.value)}
                  placeholder={`Paste the match data here, for example:

Fixtures - Market Weighton v Cawood 2
27 April 2025 - 10:00
     Cawood 2          
Market Weighton    Steven Walter
Nas Shefta    John Best
Mike Brennan    Mark Bottomley
Steve Caslake    GF    GA
Ian Robson
Aled Edwards    6 - 6    7 - 5    10 - 2    23    13
...`}
                  rows={12}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
                  disabled={loading}
                />
                <div className="flex space-x-2">
                  <button
                    onClick={handleParse}
                    disabled={loading || !textData.trim()}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Parsing...</span>
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4" />
                        <span>Parse Text</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      const exampleText = `Fixtures - Market Weighton v Cawood 2
27 April 2025 - 10:00
     Cawood 2          
Market Weighton    Steven Walter
Nas Shefta    John Best
Mike Brennan    Mark Bottomley
Steve Caslake    GF    GA
Ian Robson
Aled Edwards    6 - 6    7 - 5    10 - 2    23    13
Nick Collins
Stewart Berry    6 - 6    5 - 7    11 - 1    22    14
Ken Bottomer
Keigan Freeman Hacker    6 - 6    5 - 7    11 - 1    22    14
Market Weighton    8.5    3.5    Cawood 2
67    41`;
                      setTextData(exampleText);
                    }}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
                    disabled={loading}
                  >
                    Use Example
                  </button>
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Copy and paste the complete match results text from the league website
              </p>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-red-800">Parse Error</h3>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Parsed Data Display */}
            {renderParsedData()}
          </div>
          )}

          {step === 'match' && renderPlayerMatching()}

          {step === 'import' && (
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <h3 className="font-semibold text-yellow-800">Ready to Import</h3>
                </div>
                <div className="text-sm text-yellow-700 space-y-2">
                  <p><strong>Season:</strong> {selectedSeason?.name} ({selectedSeason?.season_type})</p>
                  <p><strong>Match:</strong> {result?.homeTeam} vs {result?.awayTeam}</p>
                  <p><strong>Date:</strong> {result?.matchDate}</p>
                  <p><strong>Cawood Team:</strong> {matchingData?.cawoodIsHome ? 'Home' : 'Away'} ({matchingData?.cawoodPlayers?.length || 0} players)</p>
                  <p><strong>Opponent:</strong> {matchingData?.opponentClub} ({matchingData?.opponentPlayers?.length || 0} players)</p>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <button
                  onClick={() => setStep('match')}
                  disabled={loading}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
                >
                  ← Back to Matching
                </button>
                <button
                  onClick={handleImport}
                  disabled={loading || selectedSeason?.season_type !== 'league'}
                  className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Importing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Import to Database</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-8">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-green-800 mb-2">Import Successful!</h3>
                <p className="text-green-700 mb-4">
                  League match has been imported to the database. All players, rubbers, and results have been saved.
                </p>
                <div className="space-y-2 text-sm text-green-600">
                  <p>✓ Match record created</p>
                  <p>✓ External players added</p>
                  <p>✓ League rubbers recorded</p>
                  <p>✓ Stats will be updated in profiles</p>
                </div>
              </div>
              <div className="mt-6 space-x-3">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
                >
                  Import Another Match
                </button>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex justify-end space-x-3">
            {(result && step === 'parse') && (
              <button
                onClick={handleReset}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                Parse Another URL
              </button>
            )}
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeagueImportModal;