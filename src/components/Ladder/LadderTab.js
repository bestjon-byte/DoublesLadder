// src/components/Ladder/LadderTab.js
import React from 'react';
import { getLadderData, getRankMovementDisplay } from '../../utils/helpers';

const LadderTab = ({ currentUser, users, updateRankings, selectedSeason }) => {
  const ladderData = getLadderData(users);
  const isSeasonCompleted = selectedSeason?.status === 'completed';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
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
            className="bg-[#5D1F1F] text-white px-4 py-2 rounded-md hover:bg-[#4A1818] transition-colors"
          >
            Update Rankings
          </button>
        )}
        {currentUser?.role === 'admin' && isSeasonCompleted && (
          <div className="bg-gray-100 text-gray-500 px-4 py-2 rounded-md">
            Season Completed
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matches</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Games</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Win %</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Move</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ladderData.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No players in ladder yet
                  </td>
                </tr>
              ) : (
                ladderData.map((player, index) => (
                  <tr key={player.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{player.rank}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{player.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {player.matches_won || 0}/{player.matches_played || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {player.games_won || 0}/{player.games_played || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {player.games_played > 0 ? Math.round((player.games_won / player.games_played) * 100 * 10) / 10 : 0}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap w-20">
                      {getRankMovementDisplay(player.previous_rank, player.rank)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LadderTab;