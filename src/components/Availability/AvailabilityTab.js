// src/components/Availability/AvailabilityTab.js
import React from 'react';

const AvailabilityTab = ({ 
  currentUser, 
  currentSeason, 
  getPlayerAvailability, 
  setPlayerAvailability, 
  matchFixtures, 
  matchResults, 
  getMatchScore 
}) => {
  if (!currentUser?.in_ladder) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Match Availability</h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-800">
            You need to be added to the ladder before you can set your availability for matches.
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
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Match Availability</h2>
      
      {/* Future Matches */}
      {futureMatches.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Upcoming Matches</h3>
          <p className="text-gray-600 mb-4">Please set your availability for upcoming matches</p>
          
          <div className="space-y-4">
            {futureMatches.map((match) => {
              const userAvailability = getPlayerAvailability(currentUser.id, match.id);
              const matchComplete = isMatchComplete(match.id);
              
              return (
                <div key={match.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-semibold">Week {match.week_number}</h4>
                      <p className="text-gray-600">{new Date(match.match_date).toLocaleDateString('en-GB')}</p>
                    </div>
                    {matchComplete ? (
                      <div className="bg-green-100 text-green-800 px-4 py-2 rounded-md font-medium">
                        ✅ Match Completed
                      </div>
                    ) : (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setPlayerAvailability(match.id, true, currentUser.id)}
                          className={`px-4 py-2 rounded-md transition-colors ${
                            userAvailability === true
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-green-100'
                          }`}
                        >
                          Available
                        </button>
                        <button
                          onClick={() => setPlayerAvailability(match.id, false, currentUser.id)}
                          className={`px-4 py-2 rounded-md transition-colors ${
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
                            className="px-4 py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {!matchComplete && userAvailability !== undefined && (
                    <div className="flex items-center space-x-2 text-sm">
                      <div className={`w-3 h-3 rounded-full ${userAvailability ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="text-gray-600">
                        You are marked as {userAvailability ? 'available' : 'not available'} for this match
                      </span>
                    </div>
                  )}
                  
                  {matchComplete && (
                    <div className="text-sm text-gray-600">
                      All results have been entered for this match. Check your results below.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Past Matches */}
      {pastMatches.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Past Matches</h3>
          <div className="space-y-4">
            {pastMatches.map((match) => {
              const playerScores = getPlayerScoresForMatch(match.id);
              
              return (
                <div key={match.id} className="bg-white rounded-lg shadow p-6">
                  <div className="mb-4">
                    <h4 className="text-lg font-semibold">Week {match.week_number}</h4>
                    <p className="text-gray-600">{new Date(match.match_date).toLocaleDateString('en-GB')}</p>
                  </div>
                  
                  {playerScores.length > 0 ? (
                    <div>
                      <h5 className="font-medium mb-2">Your Results:</h5>
                      <div className="space-y-2">
                        {playerScores.map((game, index) => (
                          <div key={index} className={`p-2 rounded text-sm ${game.won ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                            <div className="flex justify-between items-center">
                              <span>With {game.partner} vs {game.opponent}</span>
                              <span className={`font-semibold ${game.won ? 'text-green-700' : 'text-red-700'}`}>
                                {game.score} {game.won ? '(Won)' : '(Lost)'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No scores recorded for this match</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {futureMatches.length === 0 && pastMatches.length === 0 && (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500">No matches scheduled yet.</p>
        </div>
      )}
    </div>
  );
};

export default AvailabilityTab;