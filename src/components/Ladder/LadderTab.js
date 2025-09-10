// src/components/Ladder/LadderTab.js - RENAMED to support League expansion
import React, { useState, useEffect } from 'react';
import { getUnifiedRankingData, getRankMovementDisplay, getSeasonDisplayInfo, formatLeagueStats } from '../../utils/helpers';

const LadderTab = ({ currentUser, users, updateRankings, selectedSeason, onPlayerSelect, supabase }) => {
  // State for team filter
  const [teamFilter, setTeamFilter] = useState('all'); // 'all', '1sts', '2nds'
  const [playerTeamData, setPlayerTeamData] = useState({});

  // NEW: Use unified ranking data for both ladder and league seasons
  const rankingData = getUnifiedRankingData(users, selectedSeason);
  const isSeasonCompleted = selectedSeason?.status === 'completed';
  const isLeagueSeason = selectedSeason?.season_type === 'league';
  const seasonInfo = getSeasonDisplayInfo(selectedSeason);

  // Fetch player team data for league seasons
  useEffect(() => {
    const fetchPlayerTeamData = async () => {
      if (!isLeagueSeason || !supabase || !selectedSeason?.id) return;

      try {
        const { data, error } = await supabase
          .from('league_match_rubbers')
          .select(`
            cawood_player1_id,
            cawood_player2_id,
            match_fixtures!inner(team, match_id, matches!inner(season_id))
          `)
          .eq('match_fixtures.matches.season_id', selectedSeason.id);

        if (error) throw error;

        const teamMap = {};
        data?.forEach(rubber => {
          const team = rubber.match_fixtures.team;
          if (rubber.cawood_player1_id) {
            teamMap[rubber.cawood_player1_id] = team;
          }
          if (rubber.cawood_player2_id) {
            teamMap[rubber.cawood_player2_id] = team;
          }
        });

        setPlayerTeamData(teamMap);
      } catch (error) {
        console.error('Error fetching player team data:', error);
      }
    };

    fetchPlayerTeamData();
  }, [isLeagueSeason, supabase, selectedSeason?.id]);

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

  // Filter players based on team selection for league seasons
  const getFilteredRankingData = () => {
    if (!isLeagueSeason || teamFilter === 'all') {
      return rankingData;
    }

    return rankingData.filter(player => {
      const playerTeam = playerTeamData[player.id];
      return playerTeam === teamFilter;
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header - NEW: Dynamic based on season type */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              {seasonInfo.title} {isLeagueSeason ? 'League' : 'Ladder'}
            </h2>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${seasonInfo.badgeColor}`}>
              {seasonInfo.badge}
            </span>
          </div>
          <p className="text-sm text-gray-600">
            {seasonInfo.subtitle}
          </p>
          {isSeasonCompleted && (
            <p className="text-sm text-blue-600 mt-1">
              🏆 This season has been completed
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {/* Team Filter Dropdown for League Seasons */}
          {isLeagueSeason && (
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Team:</label>
              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="all">All Cawood</option>
                <option value="1sts">Cawood 1sts</option>
                <option value="2nds">Cawood 2nds</option>
              </select>
            </div>
          )}
          
          {/* Admin Controls */}
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
      </div>

      {(() => {
        const filteredData = getFilteredRankingData();
        return filteredData.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
            {teamFilter === 'all' 
              ? `No players in ${isLeagueSeason ? 'league' : 'ladder'} yet`
              : `No players found for ${teamFilter === '1sts' ? 'Cawood 1sts' : 'Cawood 2nds'}`
            }
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="block sm:hidden space-y-3">
              {filteredData.map((player, index) => {
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
                          className={`font-semibold text-left hover:underline transition-colors py-2 px-1 min-h-[44px] flex items-center ${
                            isCurrentUser ? 'text-[#5D1F1F] hover:text-red-800' : 'text-gray-900 hover:text-[#5D1F1F]'
                          }`}
                          style={{ touchAction: 'manipulation' }}
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
                      <div className="text-xs text-gray-500 uppercase font-medium">
                        {isLeagueSeason ? 'Rubbers' : 'Matches'}
                      </div>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {isLeagueSeason ? 'Rubbers' : 'Matches'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Games</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Win %</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData.map((player, index) => {
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
                            className={`text-sm font-medium hover:underline transition-colors text-left py-2 px-1 min-h-[44px] flex items-center ${
                              isCurrentUser ? 'text-[#5D1F1F] hover:text-red-800' : 'text-gray-900 hover:text-[#5D1F1F]'
                            }`}
                            style={{ touchAction: 'manipulation' }}
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
        );
      })()}
    </div>
  );
};

export default LadderTab;