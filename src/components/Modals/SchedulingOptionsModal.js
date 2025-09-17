import React from 'react';
import { Trophy, Target, Info, Users } from 'lucide-react';

const SchedulingOptionsModal = ({ 
  showModal, 
  setShowModal, 
  availablePlayersCount,
  seasonEloEnabled,
  onConfirm
}) => {
  if (!showModal) return null;

  const handleOptionSelect = (option) => {
    onConfirm(option);
    setShowModal(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Choose Scheduling Method</h3>
          <p className="text-sm text-gray-600 mt-1">
            How should players be grouped for this match week?
          </p>
        </div>

        <div className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-gray-600">
              {availablePlayersCount} players available for scheduling
            </span>
          </div>

          <div className="space-y-3">
            {/* Win Percentage Option */}
            <button
              onClick={() => handleOptionSelect('winPercent')}
              className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-left group"
            >
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 p-2 rounded-full group-hover:bg-blue-200 transition-colors">
                  <Trophy className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">Win Percentage Ranking</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    Group players by their current win percentage in the ladder. 
                    Highest win% players on Court 1, next highest on Court 2, etc.
                  </p>
                  <div className="text-xs text-blue-600 font-medium">
                    📊 Based on matches won vs total matches played
                  </div>
                </div>
              </div>
            </button>

            {/* ELO Rating Option */}
            <button
              onClick={() => handleOptionSelect('elo')}
              disabled={!seasonEloEnabled}
              className={`w-full p-4 border-2 rounded-lg transition-all duration-200 text-left group ${
                seasonEloEnabled 
                  ? 'border-gray-200 hover:border-purple-300 hover:bg-purple-50' 
                  : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-full transition-colors ${
                  seasonEloEnabled 
                    ? 'bg-purple-100 group-hover:bg-purple-200' 
                    : 'bg-gray-100'
                }`}>
                  <Target className={`w-5 h-5 ${seasonEloEnabled ? 'text-purple-600' : 'text-gray-400'}`} />
                </div>
                <div className="flex-1">
                  <h4 className={`font-semibold mb-1 ${seasonEloEnabled ? 'text-gray-900' : 'text-gray-500'}`}>
                    ELO Rating System
                  </h4>
                  <p className={`text-sm mb-2 ${seasonEloEnabled ? 'text-gray-600' : 'text-gray-400'}`}>
                    Group players by their ELO rating. Highest rated players on Court 1, 
                    next highest on Court 2, etc. More accurate skill-based matching.
                  </p>
                  {seasonEloEnabled ? (
                    <div className="text-xs text-purple-600 font-medium">
                      🎯 Based on skill-weighted match outcomes
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400 font-medium">
                      ⚠️ ELO system not enabled for this season
                    </div>
                  )}
                </div>
              </div>
            </button>
          </div>

          {/* Info Section */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-start space-x-2">
              <Info className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-gray-600">
                <p className="font-medium mb-1">Scheduling Logic:</p>
                <p>Players are sorted by chosen method, then grouped into courts of 4-5 players. 
                Court 1 gets the top-ranked players, Court 2 gets the next group, and so on.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex space-x-3">
            <button
              onClick={() => setShowModal(false)}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchedulingOptionsModal;