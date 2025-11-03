// src/components/Ladder/LadderTab.js - RENAMED to support League expansion
import React, { useState, useEffect } from 'react';
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
  const [whatsAppData, setWhatsAppData] = useState(null);

  // State for Most Improved Player
  const [mostImprovedPlayerId, setMostImprovedPlayerId] = useState(null);
  const [mostImprovedValue, setMostImprovedValue] = useState(0);

  // Calculate Most Improved Player on component load/update (based on max ELO recovery from lowest point)
  useEffect(() => {
    const calculateMostImproved = async () => {
      if (!selectedSeason?.elo_enabled || !supabase || !users || users.length === 0) {
        setMostImprovedPlayerId(null);
        setMostImprovedValue(0);
        return;
      }

      try {
        // Get season_player IDs
        const { data: seasonPlayerIds } = await supabase
          .from('season_players')
          .select('id, player_id, elo_rating')
          .eq('season_id', selectedSeason.id);

        if (seasonPlayerIds && seasonPlayerIds.length > 0) {
          const seasonPlayerMap = {};
          seasonPlayerIds.forEach(sp => {
            seasonPlayerMap[sp.player_id] = sp.id;
          });

          // Get ALL ELO history for all players to find min ratings
          const { data: allEloHistory } = await supabase
            .from('elo_history')
            .select('season_player_id, old_rating, new_rating')
            .in('season_player_id', seasonPlayerIds.map(sp => sp.id))
            .order('created_at', { ascending: true });

          if (allEloHistory) {
            // Calculate min ELO for each player
            const minEloMap = {};
            allEloHistory.forEach(entry => {
              if (!minEloMap[entry.season_player_id]) {
                minEloMap[entry.season_player_id] = entry.old_rating;
              }
              minEloMap[entry.season_player_id] = Math.min(
                minEloMap[entry.season_player_id],
                entry.old_rating,
                entry.new_rating
              );
            });

            // Get unified ranking data to access current ELO ratings
            const rankingData = getUnifiedRankingData(users, selectedSeason);

            // Calculate max improvement (current - min) for each player
            let maxImprovement = 0;
            let improvedPlayerId = null;

            rankingData.forEach(player => {
              const seasonPlayerId = seasonPlayerMap[player.id];
              const minElo = minEloMap[seasonPlayerId];
              const currentElo = player.elo_rating;

              if (minElo && currentElo && player.games_played > 0) {
                const improvement = currentElo - minElo;
                if (improvement > maxImprovement) {
                  maxImprovement = improvement;
                  improvedPlayerId = player.id;
                }
              }
            });

            // Set state
            if (improvedPlayerId && maxImprovement > 0) {
              setMostImprovedPlayerId(improvedPlayerId);
              setMostImprovedValue(Math.round(maxImprovement));
            } else {
              setMostImprovedPlayerId(null);
              setMostImprovedValue(0);
            }
          }
        }
      } catch (error) {
        console.error('Error calculating Most Improved Player:', error);
        setMostImprovedPlayerId(null);
        setMostImprovedValue(0);
      }
    };

    calculateMostImproved();
  }, [selectedSeason, users, supabase]);

  // Helper function to prepare data for WhatsApp export
  const prepareWhatsAppData = async () => {
    const filteredData = getFilteredRankingData();

    // Fetch latest ELO changes for each player
    let playersWithEloChanges = filteredData;
    let mostImprovedPlayer = null;

    if (selectedSeason?.elo_enabled && supabase) {
      try {
        // Get the most recent date with ELO changes (representing the current week)
        const { data: recentDate } = await supabase
          .from('elo_history')
          .select('created_at')
          .eq('season_players.season_id', selectedSeason.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (recentDate && recentDate.length > 0) {
          const mostRecentDate = new Date(recentDate[0].created_at).toISOString().split('T')[0];

          // Get weekly ELO changes (sum of all changes from the most recent play date)
          const { data: weeklyChanges } = await supabase.rpc('get_weekly_elo_changes', {
            p_season_id: selectedSeason.id,
            p_date: mostRecentDate
          });

          if (weeklyChanges) {
            const weeklyChangeMap = {};
            weeklyChanges.forEach(change => {
              weeklyChangeMap[change.player_id] = change.total_week_change;
            });

            // Add weekly ELO changes to player data
            playersWithEloChanges = filteredData.map(player => ({
              ...player,
              last_elo_change: weeklyChangeMap[player.id] || null
            }));
          } else {
            // Fallback to individual query if RPC doesn't exist
            const { data: eloChanges } = await supabase
              .from('elo_history')
              .select(`
                rating_change,
                created_at,
                season_player_id,
                season_players!inner(player_id)
              `)
              .eq('season_players.season_id', selectedSeason.id)
              .gte('created_at', mostRecentDate)
              .lt('created_at', new Date(new Date(mostRecentDate).getTime() + 24*60*60*1000).toISOString());

            if (eloChanges) {
              // Sum up weekly changes for each player
              const weeklyTotals = {};
              eloChanges.forEach(change => {
                const playerId = change.season_players.player_id;
                if (!weeklyTotals[playerId]) {
                  weeklyTotals[playerId] = 0;
                }
                weeklyTotals[playerId] += change.rating_change;
              });

              // Add weekly ELO changes to player data
              playersWithEloChanges = filteredData.map(player => ({
                ...player,
                last_elo_change: weeklyTotals[player.id] || null
              }));
            }
          }
        }

        // Calculate Most Improved Player (max ELO recovery from lowest point)
        const { data: seasonPlayerIds } = await supabase
          .from('season_players')
          .select('id, player_id')
          .eq('season_id', selectedSeason.id);

        if (seasonPlayerIds && seasonPlayerIds.length > 0) {
          const seasonPlayerMap = {};
          seasonPlayerIds.forEach(sp => {
            seasonPlayerMap[sp.player_id] = sp.id;
          });

          // Get ALL ELO history for all players to find min ratings
          const { data: allEloHistory } = await supabase
            .from('elo_history')
            .select('season_player_id, old_rating, new_rating')
            .in('season_player_id', seasonPlayerIds.map(sp => sp.id))
            .order('created_at', { ascending: true });

          if (allEloHistory) {
            // Calculate min ELO for each player
            const minEloMap = {};
            allEloHistory.forEach(entry => {
              if (!minEloMap[entry.season_player_id]) {
                minEloMap[entry.season_player_id] = entry.old_rating;
              }
              minEloMap[entry.season_player_id] = Math.min(
                minEloMap[entry.season_player_id],
                entry.old_rating,
                entry.new_rating
              );
            });

            // Calculate max improvement (current - min) for each player
            let maxImprovement = 0;
            let improvedPlayerId = null;

            playersWithEloChanges.forEach(player => {
              const seasonPlayerId = seasonPlayerMap[player.id];
              const minElo = minEloMap[seasonPlayerId];
              const currentElo = player.elo_rating;

              if (minElo && currentElo && player.games_played > 0) {
                const improvement = currentElo - minElo;
                if (improvement > maxImprovement) {
                  maxImprovement = improvement;
                  improvedPlayerId = player.id;
                }
              }
            });

            // Set most improved player info
            if (improvedPlayerId && maxImprovement > 0) {
              const improvedPlayer = playersWithEloChanges.find(p => p.id === improvedPlayerId);
              mostImprovedPlayer = {
                name: improvedPlayer?.name,
                improvement: Math.round(maxImprovement)
              };
            }
          }
        }
      } catch (error) {
        console.error('Error fetching ELO data:', error);
      }
    }

    return {
      season: selectedSeason,
      players: playersWithEloChanges,
      mostImprovedPlayer
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
              onClick={async () => {
                const data = await prepareWhatsAppData();
                setWhatsAppData(data);
                setShowWhatsAppExport(true);
              }}
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
                          className={`font-semibold text-left hover:underline transition-colors py-2 px-1 min-h-[44px] flex items-center gap-2 ${
                            isCurrentUser ? 'text-[#5D1F1F] hover:text-red-800' : 'text-gray-900 hover:text-[#5D1F1F]'
                          }`}
                          style={{ touchAction: 'manipulation' }}
                        >
                          <span>{player.name}</span>
                          {mostImprovedPlayerId === player.id && mostImprovedValue > 0 && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                              🌟 +{mostImprovedValue}
                            </span>
                          )}
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
                            className={`text-sm font-medium hover:underline transition-colors text-left py-2 px-1 min-h-[44px] flex items-center gap-2 ${
                              isCurrentUser ? 'text-[#5D1F1F] hover:text-red-800' : 'text-gray-900 hover:text-[#5D1F1F]'
                            }`}
                            style={{ touchAction: 'manipulation' }}
                          >
                            <span>{player.name} {isCurrentUser && <span className="text-xs">(You)</span>}</span>
                            {mostImprovedPlayerId === player.id && mostImprovedValue > 0 && (
                              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                                🌟 +{mostImprovedValue}
                              </span>
                            )}
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
      {showWhatsAppExport && whatsAppData && (
        <WhatsAppLeagueExporter
          seasonData={whatsAppData}
          onClose={() => {
            setShowWhatsAppExport(false);
            setWhatsAppData(null);
          }}
        />
      )}
    </div>
  );
};

export default LadderTab;