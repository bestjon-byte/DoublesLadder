// src/utils/helpers.js
import { ArrowUp, ArrowDown } from 'lucide-react';

export const getLadderData = (users, selectedSeason = null) => {
  const filteredUsers = users
    .filter(user => user.in_ladder && user.status === 'approved');
  
  // For completed seasons, sort by performance (win percentage, then games played)
  // For active seasons, sort by rank
  if (selectedSeason?.status === 'completed') {
    return filteredUsers.sort((a, b) => {
      const aWinPct = (a.games_played || 0) > 0 ? (a.games_won || 0) / (a.games_played || 0) : 0;
      const bWinPct = (b.games_played || 0) > 0 ? (b.games_won || 0) / (b.games_played || 0) : 0;
      
      // Primary sort: Win percentage (descending)
      if (aWinPct !== bWinPct) {
        return bWinPct - aWinPct;
      }
      
      // Secondary sort: Games played (descending) - more games = better ranking if same win%
      if ((a.games_played || 0) !== (b.games_played || 0)) {
        return (b.games_played || 0) - (a.games_played || 0);
      }
      
      // Tertiary sort: Games won (descending)
      return (b.games_won || 0) - (a.games_won || 0);
    }).map((user, index) => ({
      ...user,
      rank: index + 1 // Assign new rank based on performance
    }));
  } else {
    // For active seasons, sort by existing rank
    return filteredUsers.sort((a, b) => (a.rank || 999) - (b.rank || 999));
  }
};

export const getRankMovementIcon = (movement) => {
  if (movement === 'up') return <ArrowUp className="w-4 h-4 text-green-500" />;
  if (movement === 'down') return <ArrowDown className="w-4 h-4 text-red-500" />;
  return null;
};

export const getRankMovementDisplay = (previousRank, currentRank) => {
  if (!previousRank || previousRank === currentRank) {
    return <span className="text-gray-400 text-xs">-</span>;
  }
  
  if (previousRank > currentRank) {
    // Moved up (lower number = higher rank)
    const positions = previousRank - currentRank;
    return (
      <div className="flex items-center space-x-1">
        <ArrowUp className="w-4 h-4 text-green-500" />
        <span className="text-green-600 text-xs font-medium">+{positions}</span>
      </div>
    );
  } else {
    // Moved down (higher number = lower rank)
    const positions = currentRank - previousRank;
    return (
      <div className="flex items-center space-x-1">
        <ArrowDown className="w-4 h-4 text-red-500" />
        <span className="text-red-600 text-xs font-medium">-{positions}</span>
      </div>
    );
  }
};

// NEW: League expansion helper functions

/**
 * Get league ranking data for a season (based on games won percentage)
 * @param {Array} users - Season players
 * @param {Object} selectedSeason - Current season
 * @returns {Array} Sorted league ranking data
 */
export const getLeagueData = (users, selectedSeason = null) => {
  const filteredUsers = users
    .filter(user => user.in_ladder && user.status === 'approved')
    .filter(user => (user.games_played || 0) > 0); // Only show players with games played

  // League seasons sort by games won percentage
  return filteredUsers.sort((a, b) => {
    const aWinPct = (a.games_played || 0) > 0 ? (a.games_won || 0) / (a.games_played || 0) : 0;
    const bWinPct = (b.games_played || 0) > 0 ? (b.games_won || 0) / (b.games_played || 0) : 0;
    
    // Primary sort: Win percentage (descending)
    if (aWinPct !== bWinPct) {
      return bWinPct - aWinPct;
    }
    
    // Secondary sort: Total games won (descending)
    if ((a.games_won || 0) !== (b.games_won || 0)) {
      return (b.games_won || 0) - (a.games_won || 0);
    }
    
    // Tertiary sort: Total games played (descending) - more activity is better for tie-breaking
    return (b.games_played || 0) - (a.games_played || 0);
  }).map((user, index) => ({
    ...user,
    rank: index + 1,
    win_percentage: (user.games_played || 0) > 0 ? 
      ((user.games_won || 0) / (user.games_played || 0) * 100).toFixed(1) : 
      '0.0'
  }));
};

/**
 * Get singles championship ranking data for a season (based on match wins, then game win percentage)
 * @param {Array} users - Season players
 * @param {Object} selectedSeason - Current season
 * @returns {Array} Sorted singles championship ranking data
 */
export const getSinglesData = (users, selectedSeason = null) => {
  const filteredUsers = users
    .filter(user => user.in_ladder && user.status === 'approved')
    .filter(user => (user.matches_played || 0) > 0); // Only show players with matches played

  // Singles championships sort by match wins first, then game win percentage
  return filteredUsers.sort((a, b) => {
    const aMatchesWon = a.matches_won || 0;
    const bMatchesWon = b.matches_won || 0;
    
    // Primary sort: Matches won (descending)
    if (aMatchesWon !== bMatchesWon) {
      return bMatchesWon - aMatchesWon;
    }
    
    // Secondary sort: Game win percentage (descending)
    const aGameWinPct = (a.games_played || 0) > 0 ? (a.games_won || 0) / (a.games_played || 0) : 0;
    const bGameWinPct = (b.games_played || 0) > 0 ? (b.games_won || 0) / (b.games_played || 0) : 0;
    
    if (aGameWinPct !== bGameWinPct) {
      return bGameWinPct - aGameWinPct;
    }
    
    // Tertiary sort: Total games won (descending)
    if ((a.games_won || 0) !== (b.games_won || 0)) {
      return (b.games_won || 0) - (a.games_won || 0);
    }
    
    // Quaternary sort: Total matches played (descending) - more activity is better for tie-breaking
    return (b.matches_played || 0) - (a.matches_played || 0);
  }).map((user, index) => ({
    ...user,
    rank: index + 1,
    win_percentage: (user.games_played || 0) > 0 ? 
      ((user.games_won || 0) / (user.games_played || 0) * 100).toFixed(1) : 
      '0.0',
    match_win_percentage: (user.matches_played || 0) > 0 ? 
      ((user.matches_won || 0) / (user.matches_played || 0) * 100).toFixed(1) : 
      '0.0'
  }));
};

/**
 * Get unified ladder/league/singles data based on season type
 * @param {Array} users - Season players
 * @param {Object} selectedSeason - Current season
 * @returns {Array} Sorted ranking data
 */
export const getUnifiedRankingData = (users, selectedSeason = null) => {
  if (selectedSeason?.season_type === 'league') {
    return getLeagueData(users, selectedSeason);
  } else if (selectedSeason?.season_type === 'singles_championship') {
    return getSinglesData(users, selectedSeason);
  } else {
    return getLadderData(users, selectedSeason);
  }
};

/**
 * Calculate league statistics for display
 * @param {Object} player - Player object with league stats
 * @returns {Object} Formatted league statistics
 */
export const formatLeagueStats = (player) => {
  const gamesPlayed = player.games_played || 0;
  const gamesWon = player.games_won || 0;
  const gamesLost = gamesPlayed - gamesWon;
  const rubbersPlayed = player.matches_played || 0;
  const rubbersWon = player.matches_won || 0;
  const winPercentage = gamesPlayed > 0 ? (gamesWon / gamesPlayed * 100).toFixed(1) : '0.0';

  return {
    rubbers_played: rubbersPlayed,
    rubbers_won: rubbersWon,
    games_played: gamesPlayed,
    games_won: gamesWon,
    games_lost: gamesLost,
    win_percentage: winPercentage,
    rubber_win_percentage: rubbersPlayed > 0 ? (rubbersWon / rubbersPlayed * 100).toFixed(1) : '0.0'
  };
};

/**
 * Validate league match rubber results
 * @param {Array} rubbers - Array of rubber results (should be 9)
 * @returns {Object} Validation result
 */
export const validateLeagueMatchRubbers = (rubbers) => {
  const errors = [];
  
  if (!rubbers || rubbers.length !== 9) {
    errors.push('League matches must have exactly 9 rubber results');
  }

  rubbers?.forEach((rubber, index) => {
    const rubberNum = index + 1;
    
    if (!rubber.cawood_player1_id) {
      errors.push(`Rubber ${rubberNum}: Cawood player 1 is required`);
    }
    if (!rubber.cawood_player2_id) {
      errors.push(`Rubber ${rubberNum}: Cawood player 2 is required`);
    }
    if (!rubber.opponent_player1_id) {
      errors.push(`Rubber ${rubberNum}: Opponent player 1 is required`);
    }
    if (!rubber.opponent_player2_id) {
      errors.push(`Rubber ${rubberNum}: Opponent player 2 is required`);
    }
    
    const cawoodGames = rubber.cawood_games_won || 0;
    const opponentGames = rubber.opponent_games_won || 0;
    
    if (cawoodGames + opponentGames !== 12) {
      errors.push(`Rubber ${rubberNum}: Games must total 12 (currently ${cawoodGames + opponentGames})`);
    }
    
    if (cawoodGames < 0 || opponentGames < 0) {
      errors.push(`Rubber ${rubberNum}: Game scores cannot be negative`);
    }

    // Check for duplicate Cawood players within the rubber
    if (rubber.cawood_player1_id === rubber.cawood_player2_id) {
      errors.push(`Rubber ${rubberNum}: Cannot have the same Cawood player twice`);
    }

    // Check for duplicate opponent players within the rubber
    if (rubber.opponent_player1_id === rubber.opponent_player2_id) {
      errors.push(`Rubber ${rubberNum}: Cannot have the same opponent player twice`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Generate standard league rubber pairing structure
 * @returns {Array} Standard 9-rubber structure for league matches
 */
export const generateLeagueRubberStructure = () => {
  return [
    { rubber_number: 1, description: "Pair 1 vs Pair 1" },
    { rubber_number: 2, description: "Pair 1 vs Pair 2" },
    { rubber_number: 3, description: "Pair 1 vs Pair 3" },
    { rubber_number: 4, description: "Pair 2 vs Pair 1" },
    { rubber_number: 5, description: "Pair 2 vs Pair 2" },
    { rubber_number: 6, description: "Pair 2 vs Pair 3" },
    { rubber_number: 7, description: "Pair 3 vs Pair 1" },
    { rubber_number: 8, description: "Pair 3 vs Pair 2" },
    { rubber_number: 9, description: "Pair 3 vs Pair 3" }
  ];
};

/**
 * Get season display information
 * @param {Object} season - Season object
 * @returns {Object} Display information for the season
 */
export const getSeasonDisplayInfo = (season) => {
  if (!season) return { title: '', subtitle: '', badge: '' };

  const seasonType = season.season_type;
  const leagueInfo = season.league_info || {};
  
  switch (seasonType) {
    case 'league':
      return {
        title: season.name,
        subtitle: `${leagueInfo.division || 'League'} - ${leagueInfo.external_league_name || 'External League'}`,
        badge: 'League',
        badgeColor: 'bg-blue-100 text-blue-800'
      };
    case 'singles_championship':
      return {
        title: season.name,
        subtitle: 'Singles Championship - Individual Competition',
        badge: 'Singles',
        badgeColor: 'bg-orange-100 text-orange-800'
      };
    default: // 'ladder'
      return {
        title: season.name,
        subtitle: 'Internal Ladder',
        badge: 'Ladder',
        badgeColor: 'bg-green-100 text-green-800'
      };
  }
};