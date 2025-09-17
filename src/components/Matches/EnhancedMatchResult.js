import React from 'react';
import { TrendingUp, TrendingDown, Minus, Users } from 'lucide-react';
import { useMatchEloImpacts } from '../../hooks/useMatchEloImpacts';

const EnhancedMatchResult = ({ 
  fixture, 
  score, 
  selectedSeason, 
  currentUser,
  users = [] 
}) => {
  const { eloImpacts, loading } = useMatchEloImpacts(fixture.id, selectedSeason?.id);
  
  if (!score) return null;

  // Get player names helper
  const getPlayerName = (playerId) => {
    const user = users.find(u => u.id === playerId);
    return user?.name || 'Unknown';
  };

  // Determine match format and get player info
  const isSingles = fixture.match_format === 'singles';
  const isDraw = score.pair1_score === score.pair2_score;
  
  let pair1Players, pair2Players;
  
  if (isSingles) {
    pair1Players = [{ id: fixture.player1_id, name: getPlayerName(fixture.player1_id) }];
    pair2Players = [{ id: fixture.player2_id, name: getPlayerName(fixture.player2_id) }];
  } else {
    pair1Players = [
      { id: fixture.pair1_player1_id, name: getPlayerName(fixture.pair1_player1_id) },
      { id: fixture.pair1_player2_id, name: getPlayerName(fixture.pair1_player2_id) }
    ].filter(p => p.id);
    
    pair2Players = [
      { id: fixture.pair2_player1_id, name: getPlayerName(fixture.pair2_player1_id) },
      { id: fixture.pair2_player2_id, name: getPlayerName(fixture.pair2_player2_id) }
    ].filter(p => p.id);
  }

  // Determine winning side
  const pair1Won = score.pair1_score > score.pair2_score;
  const pair2Won = score.pair2_score > score.pair1_score;

  // ELO Impact Component
  const EloImpactBadge = ({ playerId, playerName, isCurrentUser }) => {
    const impact = eloImpacts[playerId];
    if (!impact || !selectedSeason?.elo_enabled) return null;

    const isPositive = impact.change > 0;
    const isNegative = impact.change < 0;
    
    return (
      <div className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold transition-all duration-200 ${
        isCurrentUser 
          ? isPositive 
            ? 'bg-green-500 text-white shadow-lg ring-2 ring-green-300' 
            : isNegative 
              ? 'bg-red-500 text-white shadow-lg ring-2 ring-red-300'
              : 'bg-gray-500 text-white shadow-lg ring-2 ring-gray-300'
          : isPositive 
            ? 'bg-green-100 text-green-800' 
            : isNegative 
              ? 'bg-red-100 text-red-800'
              : 'bg-gray-100 text-gray-800'
      }`}>
        {isPositive && <TrendingUp className="w-3 h-3 mr-1" />}
        {isNegative && <TrendingDown className="w-3 h-3 mr-1" />}
        {!isPositive && !isNegative && <Minus className="w-3 h-3 mr-1" />}
        {isPositive ? '+' : ''}{impact.change}
      </div>
    );
  };

  // Player Team Component
  const PlayerTeam = ({ players, score, won, lost }) => (
    <div className={`flex-1 p-4 rounded-xl border-2 transition-all duration-300 ${
      won ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-300 shadow-lg' :
      lost ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-300 shadow-md' :
      'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300 shadow-md'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {isSingles ? (
            <div className="text-sm font-semibold text-gray-900">
              {players[0]?.name}
            </div>
          ) : (
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4 text-gray-600" />
              <div className="text-sm font-semibold text-gray-900">
                {players.map(p => p.name).join(' & ')}
              </div>
            </div>
          )}
        </div>
        
        {/* Score Display */}
        <div className={`text-2xl font-bold px-3 py-1 rounded-lg ${
          won ? 'bg-green-600 text-white' :
          lost ? 'bg-red-600 text-white' :
          'bg-gray-600 text-white'
        }`}>
          {score}
        </div>
      </div>

      {/* ELO Impacts */}
      {selectedSeason?.elo_enabled && !loading && (
        <div className="space-y-2">
          {players.map(player => {
            const isCurrentUser = player.id === currentUser?.id;
            return (
              <div key={player.id} className="flex items-center justify-between">
                <span className={`text-xs ${isCurrentUser ? 'font-bold text-blue-600' : 'text-gray-600'}`}>
                  {player.name} {isCurrentUser && '(You)'}
                </span>
                <EloImpactBadge 
                  playerId={player.id} 
                  playerName={player.name}
                  isCurrentUser={isCurrentUser}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 hover:shadow-xl transition-all duration-300">
      {/* Match Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className={`px-3 py-1 rounded-full text-xs font-bold ${
            isDraw ? 'bg-gray-500 text-white' :
            'bg-blue-500 text-white'
          }`}>
            {isSingles ? 'SINGLES' : 'DOUBLES'} {isDraw && '• DRAW'}
          </div>
          
          {selectedSeason?.elo_enabled && (
            <div className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
              ELO MATCH
            </div>
          )}
        </div>
        
        {/* Overall Result */}
        <div className={`px-3 py-1 rounded-full text-xs font-bold ${
          isDraw ? 'bg-gray-600 text-white' : 'bg-green-600 text-white'
        }`}>
          {isDraw ? 'DRAW' : 'COMPLETED'}
        </div>
      </div>

      {/* Match Results */}
      <div className="flex items-center space-x-4">
        <PlayerTeam 
          players={pair1Players}
          score={score.pair1_score}
          won={pair1Won}
          lost={pair2Won}
        />
        
        {/* VS Divider */}
        <div className="flex flex-col items-center">
          <div className="text-xs font-medium text-gray-500 mb-1">VS</div>
          <div className="w-8 h-px bg-gradient-to-r from-gray-300 via-gray-400 to-gray-300"></div>
        </div>
        
        <PlayerTeam 
          players={pair2Players}
          score={score.pair2_score}
          won={pair2Won}
          lost={pair1Won}
        />
      </div>

      {/* Loading State for ELO */}
      {selectedSeason?.elo_enabled && loading && (
        <div className="mt-3 text-center">
          <div className="inline-flex items-center space-x-2 text-xs text-gray-500">
            <div className="animate-spin w-3 h-3 border border-gray-300 border-t-blue-500 rounded-full"></div>
            <span>Loading ELO impacts...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedMatchResult;