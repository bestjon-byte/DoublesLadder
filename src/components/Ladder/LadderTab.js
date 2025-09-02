// src/components/Ladder/LadderTab.js
import React from 'react';
import { getLadderData, getRankMovementDisplay } from '../../utils/helpers';

const LadderTab = ({ currentUser, users, updateRankings, selectedSeason, onPlayerSelect }) => {
  const ladderData = getLadderData(users, selectedSeason);
  const isSeasonCompleted = selectedSeason?.status === 'completed';

  const getRankIcon = (rank) => {
    if (rank === 1) return '🏆';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getRankWithMovement = (player) => {
    const rankIcon = getRankIcon(player.rank);
    const movement = getRankMovementDisplay(player.previous_rank, player.rank);
    return { rankIcon, movement };
  };

  const getWinPercentage = (player) => {
    return player.games_played > 0 ? Math.round((player.games_won / player.games_played) * 100 * 10) / 10 : 0;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            {selectedSeason?.name || 'Current'} Ladder
          </h2>
          {isSeasonCompleted && (
            <p className="text-sm text-blue-600 mt-1">
              🏆 This season has been completed
            </p>
          )}
        </div>
        {currentUser?.role === 'admin' && !isSeasonCompleted && (
          <button 
            onClick={updateRankings}
            className="bg-[#5D1F1F] text-white px-4 py-2 rounded-md hover:bg-[#4A1818] transition-colors text-sm sm:text-base"
          >
            Update Rankings
          </button>
        )}
        {currentUser?.role === 'admin' && isSeasonCompleted && (
          <div className="bg-gray-100 text-gray-500 px-4 py-2 rounded-md text-sm sm:text-base">
            Season Completed
          </div>
        )}
      </div>

      {ladderData.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          No players in ladder yet
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="block sm:hidden space-y-3">
            {ladderData.map((player, index) => {
              const isCurrentUser = player.id === currentUser?.id;
              const winPercentage = getWinPercentage(player);
              const { rankIcon, movement } = getRankWithMovement(player);
              
              return (
                <div
                  key={player.id}
                  className={`bg-white rounded-lg shadow-sm border-2 p-4 ${
                    isCurrentUser 
                      ? 'border-[#5D1F1F] bg-gradient-to-r from-[#5D1F1F]/5 to-[#5D1F1F]/2' 
                      : 'border-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`text-2xl font-bold ${isCurrentUser ? 'text-[#5D1F1F]' : 'text-gray-600'} flex items-center gap-1`}>
                        {rankIcon}
                        <span className="text-sm">{movement}</span>
                      </div>
                      <div>
                        <button
                          onClick={() => onPlayerSelect && onPlayerSelect(player.id)}
                          className={`font-semibold text-left hover:underline transition-colors ${
                            isCurrentUser ? 'text-[#5D1F1F] hover:text-red-800' : 'text-gray-900 hover:text-[#5D1F1F]'
                          }`}
                        >
                          {player.name}
                        </button>
                        {isCurrentUser && (
                          <div className="text-xs text-[#5D1F1F] font-medium">You</div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-gray-50 rounded-lg p-2">
                      <div className="text-xs text-gray-500 uppercase font-medium">Matches</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {player.matches_won || 0}/{player.matches_played || 0}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <div className="text-xs text-gray-500 uppercase font-medium">Games</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {player.games_won || 0}/{player.games_played || 0}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <div className="text-xs text-gray-500 uppercase font-medium">Win %</div>
                      <div className={`text-sm font-semibold ${winPercentage >= 60 ? 'text-green-600' : winPercentage >= 40 ? 'text-yellow-600' : 'text-gray-900'}`}>
                        {winPercentage}%
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matches</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Games</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Win %</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {ladderData.map((player, index) => {
                    const isCurrentUser = player.id === currentUser?.id;
                    const winPercentage = getWinPercentage(player);
                    const { rankIcon, movement } = getRankWithMovement(player);
                    
                    return (
                      <tr key={player.id} className={
                        isCurrentUser 
                          ? 'bg-gradient-to-r from-[#5D1F1F]/10 to-[#5D1F1F]/5 border-l-4 border-[#5D1F1F] font-medium' 
                          : (index % 2 === 0 ? 'bg-white' : 'bg-gray-50')
                      }>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            <span>{rankIcon}</span>
                            <span className="text-xs">{movement}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => onPlayerSelect && onPlayerSelect(player.id)}
                            className={`text-sm font-medium hover:underline transition-colors text-left ${
                              isCurrentUser ? 'text-[#5D1F1F] hover:text-red-800' : 'text-gray-900 hover:text-[#5D1F1F]'
                            }`}
                          >
                            {player.name} {isCurrentUser && <span className="text-xs">(You)</span>}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {player.matches_won || 0}/{player.matches_played || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {player.games_won || 0}/{player.games_played || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`font-medium ${winPercentage >= 60 ? 'text-green-600' : winPercentage >= 40 ? 'text-yellow-600' : 'text-gray-900'}`}>
                            {winPercentage}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LadderTab;