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