// src/components/Ladder/LadderTab.js - RENAMED to support League expansion
import React, { useState } from 'react';
import { getUnifiedRankingData, getRankMovementDisplay, getSeasonDisplayInfo } from '../../utils/helpers';
import { getEloRankColor } from '../../utils/eloCalculator';
import { ChevronUp, ChevronDown, MessageCircle } from 'lucide-react';
import WhatsAppLeagueExporter from '../WhatsApp/WhatsAppLeagueExporter';

const LadderTab = ({ currentUser, users, updateRankings, selectedSeason, onPlayerSelect, supabase, matchFixtures }) => {
  // State for team filter and ELO sorting
  const [teamFilter, setTeamFilter] = useState('all'); // 'all', '1sts', '2nds'
  const [sortBy, setSortBy] = useState('rank'); // 'rank', 'elo'

  // State for column sorting
  const [sortColumn, setSortColumn] = useState('rank');
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc', 'desc'

  // State for WhatsApp export modal
  const [showWhatsAppExport, setShowWhatsAppExport] = useState(false);

  // Helper function to prepare data for WhatsApp export
  const prepareWhatsAppData = () => {
    const filteredData = getFilteredRankingData();
    return {
      season: selectedSeason,
      players: filteredData
    };
  };

  // NEW: Use unified ranking data for both ladder and league seasons
  const rankingData = getUnifiedRankingData(users, selectedSeason);
  const isSeasonCompleted = selectedSeason?.status === 'completed';
  const isLeagueSeason = selectedSeason?.season_type === 'league';
  const isSinglesSeason = selectedSeason?.season_type === 'singles_championship';
  const seasonInfo = getSeasonDisplayInfo(selectedSeason);


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

  // Handle column header click for sorting
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc'); // Default to descending for most metrics
    }
  };

  // Sort players based on selected column and direction
  const sortPlayers = (players) => {
    return [...players].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortColumn) {
        case 'rank':
          aValue = a.rank || 999;
          bValue = b.rank || 999;
          break;
        case 'name':
          aValue = a.name || '';
          bValue = b.name || '';
          break;
        case 'matches':
          aValue = (a.matches_won || 0) / Math.max(a.matches_played || 1, 1);
          bValue = (b.matches_won || 0) / Math.max(b.matches_played || 1, 1);
          break;
        case 'games':
          aValue = (a.games_won || 0) / Math.max(a.games_played || 1, 1);
          bValue = (b.games_won || 0) / Math.max(b.games_played || 1, 1);
          break;
        case 'winPercent':
          aValue = getWinPercentage(a);
          bValue = getWinPercentage(b);
          break;
        case 'elo':
          aValue = a.elo_rating || selectedSeason?.elo_initial_rating || 1200;
          bValue = b.elo_rating || selectedSeason?.elo_initial_rating || 1200;
          break;
        default:
          aValue = a.rank || 999;
          bValue = b.rank || 999;
      }
      
      // Handle string sorting
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const result = aValue.localeCompare(bValue);
        return sortDirection === 'asc' ? result : -result;
      }
      
      // Handle numeric sorting
      const result = aValue - bValue;
      return sortDirection === 'asc' ? result : -result;
    });
  };

  // Calculate team-specific statistics for league seasons
  const getFilteredRankingData = () => {
    let data;
    if (!isLeagueSeason || teamFilter === 'all') {
      data = rankingData;
    } else {
      // For team filtering, we need to recalculate stats based only on matches played for that team
      data = getTeamSpecificStats();
    }
    
    // Apply ELO sorting if enabled for ladder seasons (legacy sorting)
    if (!isLeagueSeason && selectedSeason?.elo_enabled && sortBy === 'elo' && sortColumn === 'rank') {
      data = sortPlayersByElo(data);
    }
    
    // Apply column-based sorting (overrides legacy sorting)
    if (sortColumn !== 'rank' || sortDirection !== 'asc') {
      data = sortPlayers(data);
    }
    
    return data;
  };

  // Sort players by ELO rating if ELO is enabled and sort mode is set to ELO
  const sortPlayersByElo = (players) => {
    if (!selectedSeason?.elo_enabled || sortBy !== 'elo') {
      return players;
    }
    
    return [...players].sort((a, b) => {
      const aRating = a.elo_rating || selectedSeason.elo_initial_rating || 1200;
      const bRating = b.elo_rating || selectedSeason.elo_initial_rating || 1200;
      return bRating - aRating;
    }).map((player, index) => ({
      ...player,
      rank: index + 1
    }));
  };

  // Calculate statistics for players based only on matches played for the selected team
  const getTeamSpecificStats = () => {
    if (!matchFixtures || matchFixtures.length === 0) return [];

    const teamStats = new Map();

    // Process all match fixtures for the selected season
    matchFixtures.forEach(fixture => {
      if (fixture.team !== teamFilter) return; // Only process matches for selected team

      fixture.league_match_rubbers?.forEach(rubber => {
        // Process both Cawood players in this rubber
        [rubber.cawood_player1_id, rubber.cawood_player2_id].forEach(playerId => {
          if (!playerId) return;

          if (!teamStats.has(playerId)) {
            // Find the player in our users array to get basic info
            const playerInfo = rankingData.find(p => p.id === playerId);
            if (!playerInfo) return;

            teamStats.set(playerId, {
              ...playerInfo,
              games_played: 0,
              games_won: 0,
              matches_played: 0, // rubbers
              matches_won: 0, // rubbers won
              team: teamFilter
            });
          }

          const stats = teamStats.get(playerId);
          
          // Add games played and won
          if (rubber.cawood_games_won !== null && rubber.opponent_games_won !== null) {
            stats.games_played += rubber.cawood_games_won + rubber.opponent_games_won;
            stats.games_won += rubber.cawood_games_won;
            stats.matches_played += 1;
            
            // Rubber won if Cawood won more games
            if (rubber.cawood_games_won > rubber.opponent_games_won) {
              stats.matches_won += 1;
            }
          }
        });
      });
    });

    // Convert to array and sort by win percentage like the original league logic
    const playersWithStats = Array.from(teamStats.values()).filter(player => player.games_played > 0);
    
    return playersWithStats.sort((a, b) => {
      const aWinPct = a.games_played > 0 ? a.games_won / a.games_played : 0;
      const bWinPct = b.games_played > 0 ? b.games_won / b.games_played : 0;
      
      // Primary sort: Win percentage (descending)
      if (aWinPct !== bWinPct) {
        return bWinPct - aWinPct;
      }
      
      // Secondary sort: Total games won (descending)
      if (a.games_won !== b.games_won) {
        return b.games_won - a.games_won;
      }
      
      // Tertiary sort: Total games played (descending)
      return b.games_played - a.games_played;
    }).map((player, index) => ({
      ...player,
      rank: index + 1,
      win_percentage: player.games_played > 0 ? 
        ((player.games_won / player.games_played) * 100).toFixed(1) : 
        '0.0'
    }));
  };

  // Sortable header component
  const SortableHeader = ({ column, children, className = "" }) => {
    const isActive = sortColumn === column;
    const isAscending = isActive && sortDirection === 'asc';
    
    return (
      <th 
        className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors ${className}`}
        onClick={() => handleSort(column)}
      >
        <div className="flex items-center space-x-1">
          <span>{children}</span>
          <div className="flex flex-col">
            <ChevronUp 
              className={`w-3 h-3 ${isActive && isAscending ? 'text-blue-600' : 'text-gray-300'}`} 
            />
            <ChevronDown 
              className={`w-3 h-3 -mt-1 ${isActive && !isAscending ? 'text-blue-600' : 'text-gray-300'}`} 
            />
          </div>
        </div>
      </th>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header - NEW: Dynamic based on season type */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              {seasonInfo.title} {isSinglesSeason ? 'Championship' : (isLeagueSeason ? 'League' : 'Ladder')}
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
          
          {/* ELO Sort Toggle for Ladder Seasons */}
          {!isLeagueSeason && selectedSeason?.elo_enabled && (
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="rank">Win %</option>
                <option value="elo">ELO Rating</option>
              </select>
            </div>
          )}
          
          {/* WhatsApp Export Button - Admin Only */}
          {currentUser?.role === 'admin' && (
            <button
              onClick={() => setShowWhatsAppExport(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm sm:text-base flex items-center space-x-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Share</span>
            </button>
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
                  
                  <div className={`grid gap-4 text-center ${!isLeagueSeason && selectedSeason?.elo_enabled ? 'grid-cols-4' : 'grid-cols-3'}`}>
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
                    {!isLeagueSeason && selectedSeason?.elo_enabled && (
                      <div className="bg-gray-50 rounded-lg p-2">
                        <div className="text-xs text-gray-500 uppercase font-medium">ELO</div>
                        <div className={`text-sm font-semibold ${getEloRankColor(player.elo_rating || selectedSeason.elo_initial_rating || 1200)}`}>
                          {player.elo_rating || selectedSeason.elo_initial_rating || 1200}
                        </div>
                      </div>
                    )}
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
                    <SortableHeader column="rank">Rank</SortableHeader>
                    <SortableHeader column="name">Name</SortableHeader>
                    <SortableHeader column="matches">
                      {isLeagueSeason ? 'Rubbers' : 'Matches'}
                    </SortableHeader>
                    <SortableHeader column="games">Games</SortableHeader>
                    <SortableHeader column="winPercent">Win %</SortableHeader>
                    {!isLeagueSeason && selectedSeason?.elo_enabled && (
                      <SortableHeader column="elo">ELO Rating</SortableHeader>
                    )}
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
                        {!isLeagueSeason && selectedSeason?.elo_enabled && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`font-medium ${getEloRankColor(player.elo_rating || selectedSeason.elo_initial_rating || 1200)}`}>
                              {player.elo_rating || selectedSeason.elo_initial_rating || 1200}
                            </span>
                          </td>
                        )}
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

      {/* WhatsApp Export Modal */}
      {showWhatsAppExport && (
        <WhatsAppLeagueExporter
          seasonData={prepareWhatsAppData()}
          onClose={() => setShowWhatsAppExport(false)}
        />
      )}
    </div>
  );
};

export default LadderTab;