// src/utils/helpers.js
import { ArrowUp, ArrowDown } from 'lucide-react';

export const getLadderData = (users) => {
  return users
    .filter(user => user.in_ladder && user.status === 'approved')
    .sort((a, b) => (a.rank || 999) - (b.rank || 999));
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