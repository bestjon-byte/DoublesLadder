import React, { useState } from 'react';
import { Trophy, Target, Info, Users, Eye } from 'lucide-react';

const SchedulingOptionsModal = ({ 
  showModal, 
  setShowModal, 
  availablePlayersCount,
  seasonEloEnabled,
  onConfirm,
  // New props for preview
  winPercentPreview,
  eloPreview,
  isLoadingPreviews
}) => {
  const [selectedMethod, setSelectedMethod] = useState(null);
  
  if (!showModal) return null;

  // Debug logging
  console.log('SchedulingOptionsModal props:', {
    winPercentPreview,
    eloPreview,
    isLoadingPreviews,
    availablePlayersCount,
    seasonEloEnabled
  });

  const handleOptionSelect = (option) => {
    onConfirm(option);
    setShowModal(false);
  };

  const handlePreview = (method) => {
    setSelectedMethod(selectedMethod === method ? null : method);
  };

  const PreviewSection = ({ method, preview, title, icon, color }) => {
    const isSelected = selectedMethod === method;
    const isBlue = color === 'blue';
    
    return (
      <div className="mt-3">
        <button
          onClick={() => handlePreview(method)}
          className={`w-full flex items-center justify-between p-2 border rounded-md transition-colors ${
            isSelected 
              ? isBlue 
                ? 'border-blue-300 bg-blue-50' 
                : 'border-purple-300 bg-purple-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Eye className={`w-4 h-4 ${
              isSelected 
                ? isBlue 
                  ? 'text-blue-600' 
                  : 'text-purple-600'
                : 'text-gray-500'
            }`} />
            <span className={`text-sm font-medium ${
              isSelected 
                ? isBlue 
                  ? 'text-blue-900' 
                  : 'text-purple-900'
                : 'text-gray-700'
            }`}>
              Preview {title} Matchups
            </span>
          </div>
          <span className={`text-xs ${
            isSelected 
              ? isBlue 
                ? 'text-blue-600' 
                : 'text-purple-600'
              : 'text-gray-500'
          }`}>
            {isSelected ? 'Hide' : 'Show'}
          </span>
        </button>
        
        {isSelected && (
          <div className="mt-2 p-3 bg-gray-50 rounded-md border">
            {isLoadingPreviews ? (
              <div className="text-center py-4">
                <div className="animate-spin w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full mx-auto mb-2"></div>
                <p className="text-sm text-gray-500">Loading preview...</p>
              </div>
            ) : preview && preview.length > 0 ? (
              <div className="space-y-3">
                {preview.map((court, index) => (
                  <div key={index} className="bg-white rounded-lg p-3 border">
                    <h4 className="font-medium text-sm text-gray-900 mb-2">
                      Court {index + 1} ({court.length} players)
                    </h4>
                    <div className="space-y-1">
                      {court.map((player, playerIndex) => (
                        <div key={player.id} className="flex items-center justify-between text-sm">
                          <span className="font-medium text-gray-900">
                            {playerIndex + 1}. {player.name}
                          </span>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            {method === 'winPercent' && (
                              <>
                                <span>Rank #{player.rank || 'N/A'}</span>
                                <span>•</span>
                                <span>{player.win_percentage || 0}% Win</span>
                              </>
                            )}
                            {method === 'elo' && (
                              <>
                                <span>ELO: {player.elo_rating || player.initialRating || 1200}</span>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-2">
                No preview available
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Choose Scheduling Method</h3>
          <p className="text-sm text-gray-600 mt-1">
            Preview both options and select the best grouping for this match week
          </p>
        </div>

        <div className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-gray-600">
              {availablePlayersCount} players available for scheduling
            </span>
          </div>

          <div className="space-y-4">
            {/* Win Percentage Option */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start space-x-3 mb-3">
                <div className="bg-blue-100 p-2 rounded-full">
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
              
              <PreviewSection 
                method="winPercent" 
                preview={winPercentPreview} 
                title="Win%" 
                color="blue" 
              />
              
              <button
                onClick={() => handleOptionSelect('winPercent')}
                className="w-full mt-3 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                Use Win Percentage Ranking
              </button>
            </div>

            {/* ELO Rating Option */}
            <div className={`border rounded-lg p-4 ${
              seasonEloEnabled ? 'border-gray-200' : 'border-gray-100 bg-gray-50 opacity-60'
            }`}>
              <div className="flex items-start space-x-3 mb-3">
                <div className={`p-2 rounded-full ${
                  seasonEloEnabled ? 'bg-purple-100' : 'bg-gray-100'
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
              
              {seasonEloEnabled && (
                <>
                  <PreviewSection 
                    method="elo" 
                    preview={eloPreview} 
                    title="ELO" 
                    color="purple" 
                  />
                  
                  <button
                    onClick={() => handleOptionSelect('elo')}
                    className="w-full mt-3 bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors font-medium"
                  >
                    Use ELO Rating System
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Info Section */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-start space-x-2">
              <Info className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-gray-600">
                <p className="font-medium mb-1">How it works:</p>
                <p>Players are sorted by chosen method, then grouped into courts of 4-5 players. 
                Court 1 gets the top-ranked players, Court 2 gets the next group, and so on.
                Click "Preview" to see the exact groupings before confirming.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex space-x-3">
            <button
              onClick={() => {
                setShowModal(false);
                setSelectedMethod(null);
              }}
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