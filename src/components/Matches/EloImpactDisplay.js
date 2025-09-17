import React from 'react';
import { useEloImpact } from '../../hooks/useEloImpact';

const EloImpactDisplay = ({ fixtureId, playerId, seasonId, currentUser, selectedSeason }) => {
  const { eloImpact, loading } = useEloImpact(fixtureId, playerId, seasonId);

  // Only show ELO impact if:
  // 1. Season has ELO enabled
  // 2. The current user is in this match
  // 3. We have ELO data
  if (!selectedSeason?.elo_enabled || playerId !== currentUser?.id || loading || !eloImpact) {
    return null;
  }

  return (
    <div className={`text-xs font-bold ml-2 px-2 py-1 rounded ${
      eloImpact.change > 0 
        ? 'bg-green-100 text-green-800' 
        : eloImpact.change < 0 
          ? 'bg-red-100 text-red-800' 
          : 'bg-gray-100 text-gray-800'
    }`}>
      ELO {eloImpact.change > 0 ? '+' : ''}{eloImpact.change}
    </div>
  );
};

export default EloImpactDisplay;