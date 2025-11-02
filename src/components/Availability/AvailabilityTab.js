// src/components/Availability/AvailabilityTab.js
import React from 'react';
import { ChevronDown } from 'lucide-react';

const AvailabilityTab = ({
  currentUser,
  currentSeason,
  selectedSeason,
  ladderPlayers,
  getPlayerAvailability,
  setPlayerAvailability,
  matchFixtures,
  matchResults,
  getMatchScore
}) => {
  const [adminMode, setAdminMode] = React.useState(false);
  const [showPastMatches, setShowPastMatches] = React.useState(false);

  // Check if user is admin
  const isAdmin = currentUser?.role === 'admin';

  // Check if user is in the selected season's ladder
  const userInSeason = ladderPlayers?.find(player => player.id === currentUser.id);

  if (!userInSeason && !isAdmin) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Match Availability</h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-800">
            You need to be added to the {selectedSeason?.name || 'current season'} ladder before you can set your availability for matches.
          </p>
        </div>
      </div>
    );
  }

  // Show read-only message for completed seasons
  if (selectedSeason?.status === 'completed') {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Match Availability</h2>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <p className="text-blue-800">
            This season ({selectedSeason.name}) has been completed. Availability cannot be modified.
          </p>
        </div>
      </div>
    );
  }

  // Separate future and past matches
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const futureMatches = currentSeason?.matches?.filter(match => {
    const matchDate = new Date(match.match_date);
    return matchDate >= today;
  }) || [];
  
  const pastMatches = currentSeason?.matches?.filter(match => {
    const matchDate = new Date(match.match_date);
    return matchDate < today;
  }) || [];

  // Helper to check if a match is complete
  const isMatchComplete = (matchId) => {
    const matchGameFixtures = matchFixtures.filter(f => f.match_id === matchId);
    if (matchGameFixtures.length === 0) return false;

    const completedGames = matchGameFixtures.filter(fixture =>
      matchResults.some(result => result.fixture_id === fixture.id)
    ).length;

    return completedGames === matchGameFixtures.length && matchGameFixtures.length > 0;
  };

  // Helper to get response statistics for a match
  const getMatchResponseStats = (matchId) => {
    if (!ladderPlayers || ladderPlayers.length === 0) {
      return { responded: 0, total: 0, available: 0, notAvailable: 0, responseRate: 0 };
    }

    const totalPlayers = ladderPlayers.length;
    let responded = 0;
    let available = 0;
    let notAvailable = 0;

    ladderPlayers.forEach(player => {
      const availability = getPlayerAvailability(player.id, matchId);
      if (availability !== undefined) {
        responded++;
        if (availability === true) available++;
        if (availability === false) notAvailable++;
      }
    });

    const responseRate = totalPlayers > 0 ? Math.round((responded / totalPlayers) * 100) : 0;

    return {
      responded,
      total: totalPlayers,
      available,
      notAvailable,
      responseRate
    };
  };

  // Helper to get timeline border color based on response rate and status
  const getTimelineBorderColor = (matchId, matchDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(matchDate);
    date.setHours(0, 0, 0, 0);

    // Past matches = gray
    if (date < today) {
      return 'border-l-gray-300';
    }

    // Completed matches = green
    if (isMatchComplete(matchId)) {
      return 'border-l-green-500';
    }

    // Future matches - based on response rate
    const stats = getMatchResponseStats(matchId);
    if (stats.responseRate >= 75) {
      return 'border-l-green-500'; // Good response
    } else if (stats.responseRate >= 50) {
      return 'border-l-blue-500'; // Moderate response
    } else if (stats.responseRate > 0) {
      return 'border-l-orange-500'; // Needs attention
    } else {
      return 'border-l-gray-400'; // No responses yet
    }
  };

  // Helper to get player's scores for a match
  const getPlayerScoresForMatch = (matchId) => {
    const playerFixtures = matchFixtures.filter(fixture => 
      fixture.match_id === matchId && 
      (fixture.player1_id === currentUser.id || fixture.player2_id === currentUser.id || 
       fixture.player3_id === currentUser.id || fixture.player4_id === currentUser.id)
    );
    
    const playerScores = [];
    playerFixtures.forEach(fixture => {
      const score = getMatchScore(fixture.id);
      if (score) {
        const isInPair1 = (fixture.pair1_player1_id === currentUser.id || fixture.pair1_player2_id === currentUser.id);
        const won = isInPair1 ? score.pair1_score > score.pair2_score : score.pair2_score > score.pair1_score;
        
        let partner, opponent;
        if (isInPair1) {
          partner = fixture.pair1_player1_id === currentUser.id ? fixture.player2?.name : fixture.player1?.name;
          opponent = `${fixture.player3?.name} & ${fixture.player4?.name}`;
        } else {
          partner = fixture.pair2_player1_id === currentUser.id ? fixture.player4?.name : fixture.player3?.name;
          opponent = `${fixture.player1?.name} & ${fixture.player2?.name}`;
        }
        
        playerScores.push({
          opponent: opponent,
          partner: partner,
          score: `${score.pair1_score} - ${score.pair2_score}`,
          won: won
        });
      }
    });
    return playerScores;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Match Availability</h2>
        {isAdmin && (
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={adminMode}
                onChange={(e) => setAdminMode(e.target.checked)}
                className="rounded border-gray-300 text-[#5D1F1F] focus:ring-[#5D1F1F]"
              />
              <span className="font-medium">Manage All Players</span>
            </label>
          </div>
        )}
      </div>

      {/* Admin Player Availability Management */}
      {isAdmin && adminMode && currentSeason?.season_type !== 'league' && (
        <div className="space-y-5">
          {/* Summary Statistics */}
          {futureMatches.length > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">📊 Availability Overview</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Upcoming Matches</div>
                  <div className="text-xl font-bold text-gray-900">{futureMatches.length}</div>
                </div>
                <div>
                  <div className="text-gray-600">Total Players</div>
                  <div className="text-xl font-bold text-gray-900">{ladderPlayers?.length || 0}</div>
                </div>
                <div>
                  <div className="text-gray-600">Avg Response Rate</div>
                  <div className="text-xl font-bold text-gray-900">
                    {futureMatches.length > 0
                      ? Math.round(
                          futureMatches.reduce((sum, m) => sum + getMatchResponseStats(m.id).responseRate, 0) /
                            futureMatches.length
                        )
                      : 0}%
                  </div>
                </div>
                {pastMatches.length > 0 && (
                  <div>
                    <div className="text-gray-600">Past Matches</div>
                    <div className="text-xl font-bold text-gray-900">{pastMatches.length}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Future Matches Section */}
          {futureMatches.length > 0 ? (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-900">
                Upcoming Matches ({futureMatches.length})
              </h3>
              <div className="space-y-3">
                {futureMatches.map((match) => {
                  const matchComplete = isMatchComplete(match.id);
                  const stats = getMatchResponseStats(match.id);

                  return (
                    <div
                      key={match.id}
                      className={`bg-white border-l-4 ${getTimelineBorderColor(match.id, match.match_date)} rounded-lg shadow-sm overflow-hidden`}
                    >
                      {/* Match Header */}
                      <div className="p-4 sm:p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h4 className="font-semibold text-gray-900">Week {match.week_number}</h4>
                              <span className="text-gray-600">
                                {match.match_date ? new Date(match.match_date).toLocaleDateString('en-GB') : 'No date set'}
                              </span>
                              {matchComplete && (
                                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                                  ✅ Completed
                                </span>
                              )}
                            </div>

                            {/* Response Stats */}
                            {!matchComplete && (
                              <div className="mt-2 flex items-center gap-3">
                                <span className="text-sm text-gray-600">
                                  {stats.responded}/{stats.total} responded ({stats.responseRate}%)
                                </span>
                                {/* Progress Bar */}
                                <div className="flex-1 max-w-xs h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full transition-all ${
                                      stats.responseRate >= 75
                                        ? 'bg-green-500'
                                        : stats.responseRate >= 50
                                        ? 'bg-blue-500'
                                        : 'bg-orange-500'
                                    }`}
                                    style={{ width: `${stats.responseRate}%` }}
                                  ></div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Player Grid */}
                        {matchComplete ? (
                          <div className="text-sm text-gray-600 italic">
                            All results have been entered for this match.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {ladderPlayers?.map(player => {
                              const playerAvailability = getPlayerAvailability(player.id, match.id);
                              return (
                                <div key={player.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                  <span className="text-sm font-medium truncate mr-2">{player.name}</span>
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => setPlayerAvailability(match.id, true, player.id)}
                                      className={`px-2 py-1 text-xs rounded transition-colors ${
                                        playerAvailability === true
                                          ? 'bg-green-600 text-white'
                                          : 'bg-gray-200 text-gray-700 hover:bg-green-100'
                                      }`}
                                      title="Available"
                                    >
                                      ✓
                                    </button>
                                    <button
                                      onClick={() => setPlayerAvailability(match.id, false, player.id)}
                                      className={`px-2 py-1 text-xs rounded transition-colors ${
                                        playerAvailability === false
                                          ? 'bg-red-600 text-white'
                                          : 'bg-gray-200 text-gray-700 hover:bg-red-100'
                                      }`}
                                      title="Not Available"
                                    >
                                      ✗
                                    </button>
                                    {playerAvailability !== undefined && (
                                      <button
                                        onClick={() => setPlayerAvailability(match.id, undefined, player.id)}
                                        className="px-2 py-1 text-xs rounded bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                                        title="Clear"
                                      >
                                        Clear
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <p className="text-gray-500">No upcoming matches scheduled.</p>
            </div>
          )}

          {/* Past Matches Section - Collapsible */}
          {pastMatches.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <button
                onClick={() => setShowPastMatches(!showPastMatches)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-gray-900">Past Matches ({pastMatches.length})</h3>
                  <span className="text-sm text-gray-500">Completed or no longer accepting responses</span>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                    showPastMatches ? 'rotate-180' : 'rotate-0'
                  }`}
                />
              </button>

              {showPastMatches && (
                <div className="border-t border-gray-200 p-4 space-y-3">
                  {pastMatches.map((match) => {
                    const matchComplete = isMatchComplete(match.id);
                    const stats = getMatchResponseStats(match.id);

                    return (
                      <div
                        key={match.id}
                        className="bg-gray-50 border-l-4 border-l-gray-300 rounded p-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h4 className="font-medium text-gray-900">Week {match.week_number}</h4>
                            <span className="text-sm text-gray-600">
                              {match.match_date ? new Date(match.match_date).toLocaleDateString('en-GB') : 'No date set'}
                            </span>
                            {matchComplete && (
                              <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded">
                                Completed
                              </span>
                            )}
                          </div>
                          <span className="text-sm text-gray-500">
                            {stats.responded}/{stats.total} responded
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Future Matches - Player's Own Availability */}
      {!adminMode && userInSeason && futureMatches.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-900">Your Upcoming Matches</h3>
          <p className="text-gray-600 mb-4 text-sm">Please set your availability for upcoming matches</p>

          <div className="space-y-3">
            {futureMatches.map((match) => {
              const userAvailability = getPlayerAvailability(currentUser.id, match.id);
              const matchComplete = isMatchComplete(match.id);
              const matchDate = new Date(match.match_date);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              matchDate.setHours(0, 0, 0, 0);
              const isToday = matchDate.getTime() === today.getTime();
              const isTomorrow = matchDate.getTime() === today.getTime() + 86400000;

              return (
                <div
                  key={match.id}
                  className={`bg-white border-l-4 ${getTimelineBorderColor(match.id, match.match_date)} rounded-lg shadow-sm`}
                >
                  <div className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h4 className="font-semibold text-gray-900">Week {match.week_number}</h4>
                          <span className="text-gray-600">
                            {isToday ? 'Today' : isTomorrow ? 'Tomorrow' : new Date(match.match_date).toLocaleDateString('en-GB')}
                          </span>
                          {matchComplete && (
                            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                              ✅ Completed
                            </span>
                          )}
                        </div>

                        {/* Status indicator */}
                        {!matchComplete && userAvailability !== undefined && (
                          <div className="mt-2 text-sm text-gray-600">
                            {userAvailability ? '✓ You\'re available' : '✗ You\'re not available'}
                          </div>
                        )}
                        {!matchComplete && userAvailability === undefined && (
                          <div className="mt-2 text-sm text-orange-600">
                            ⏰ Please respond
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      {!matchComplete && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setPlayerAvailability(match.id, true, currentUser.id)}
                            className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium min-h-[40px] ${
                              userAvailability === true
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-green-100'
                            }`}
                          >
                            Available
                          </button>
                          <button
                            onClick={() => setPlayerAvailability(match.id, false, currentUser.id)}
                            className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium min-h-[40px] ${
                              userAvailability === false
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-red-100'
                            }`}
                          >
                            Not Available
                          </button>
                          {userAvailability !== undefined && (
                            <button
                              onClick={() => setPlayerAvailability(match.id, undefined, currentUser.id)}
                              className="px-3 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors text-sm min-h-[40px]"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {matchComplete && (
                      <div className="mt-3 text-sm text-gray-600">
                        All results have been entered for this match.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Past Matches - Player's Own Results */}
      {!adminMode && userInSeason && pastMatches.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-900">Past Matches</h3>
          <div className="space-y-3">
            {pastMatches.map((match) => {
              const playerScores = getPlayerScoresForMatch(match.id);

              return (
                <div key={match.id} className="bg-white border-l-4 border-l-gray-300 rounded-lg shadow-sm">
                  <div className="p-4 sm:p-5">
                    <div className="mb-3">
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold text-gray-900">Week {match.week_number}</h4>
                        <span className="text-gray-600 text-sm">{new Date(match.match_date).toLocaleDateString('en-GB')}</span>
                      </div>
                    </div>

                    {playerScores.length > 0 ? (
                      <div>
                        <h5 className="font-medium mb-2 text-sm text-gray-700">Your Results:</h5>
                        <div className="space-y-2">
                          {playerScores.map((game, index) => (
                            <div key={index} className={`p-3 rounded-lg text-sm ${game.won ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                                <span className="text-gray-700">With {game.partner} vs {game.opponent}</span>
                                <span className={`font-semibold ${game.won ? 'text-green-700' : 'text-red-700'}`}>
                                  {game.score} {game.won ? '✓ Won' : '✗ Lost'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm italic">No scores recorded for this match</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!adminMode && userInSeason && futureMatches.length === 0 && pastMatches.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <p className="text-gray-500">No matches scheduled yet.</p>
        </div>
      )}

      {adminMode && (!currentSeason?.matches || currentSeason.matches.length === 0) && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <p className="text-gray-500">No matches scheduled for this season yet.</p>
        </div>
      )}
    </div>
  );
};

export default AvailabilityTab;