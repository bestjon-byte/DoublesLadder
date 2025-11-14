import React from 'react';
import { Trophy, Target, Users } from 'lucide-react';

const SchedulingOptionsModal = ({
  showModal,
  setShowModal,
  availablePlayersCount,
  seasonEloEnabled,
  onMethodSelect,  // Changed from onConfirm to onMethodSelect
  // New props for preview
  winPercentPreview,
  eloPreview,
  isLoadingPreviews
}) => {
  if (!showModal) return null;

  // Debug logging
    winPercentPreview,
    eloPreview,
    isLoadingPreviews,
    availablePlayersCount,
    seasonEloEnabled
  });

  const handleOptionSelect = (option) => {
    onMethodSelect(option);  // Trigger next modal instead of confirming
    // Don't close this modal yet - parent will handle transition
  };

  // Removed handlePreview - previews now show automatically

  const PreviewSection = ({ preview, title }) => {

    return (
      <div className="mt-3">
        <div className="p-3 bg-gray-50 rounded-md border">
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
                          {title === 'Win%' && (
                            <>
                              <span>Rank #{player.rank || 'N/A'}</span>
                              <span>•</span>
                              <span>{player.win_percentage || 0}% Win</span>
                            </>
                          )}
                          {title === 'ELO' && (
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
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">Choose Scheduling Method</h3>
          <p className="text-sm text-gray-600 mt-1">
            Compare both grouping methods and select the best option for this match week
          </p>
        </div>

        <div className="p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-gray-600">
              {availablePlayersCount} players available for scheduling
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Win Percentage Option */}
            <div className="border-2 border-blue-200 rounded-lg p-4 h-fit hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-blue-100 p-2 rounded-full">
                  <Trophy className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Win Percentage</h4>
                  <p className="text-xs text-blue-600">Ranked by current ladder position</p>
                </div>
              </div>

              <PreviewSection
                preview={winPercentPreview}
                title="Win%"
              />

              <button
                onClick={() => handleOptionSelect('winPercent')}
                className="w-full mt-4 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-all transform hover:scale-[1.02] font-semibold shadow-md"
              >
                Select Win Percentage
              </button>
            </div>

            {/* ELO Rating Option */}
            <div className={`border-2 rounded-lg p-4 h-fit transition-shadow ${
              seasonEloEnabled ? 'border-purple-200 hover:shadow-md' : 'border-gray-200 bg-gray-50 opacity-60'
            }`}>
              <div className="flex items-center space-x-3 mb-4">
                <div className={`p-2 rounded-full ${
                  seasonEloEnabled ? 'bg-purple-100' : 'bg-gray-100'
                }`}>
                  <Target className={`w-5 h-5 ${seasonEloEnabled ? 'text-purple-600' : 'text-gray-400'}`} />
                </div>
                <div>
                  <h4 className={`font-bold ${seasonEloEnabled ? 'text-gray-900' : 'text-gray-500'}`}>
                    ELO Rating
                  </h4>
                  <p className={`text-xs ${seasonEloEnabled ? 'text-purple-600' : 'text-gray-400'}`}>
                    {seasonEloEnabled ? 'Skill-based matching system' : 'Not enabled for this season'}
                  </p>
                </div>
              </div>

              {seasonEloEnabled && (
                <>
                  <PreviewSection
                    preview={eloPreview}
                    title="ELO"
                  />

                  <button
                    onClick={() => handleOptionSelect('elo')}
                    className="w-full mt-4 bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-all transform hover:scale-[1.02] font-semibold shadow-md"
                  >
                    Select ELO Rating
                  </button>
                </>
              )}
            </div>
          </div>

        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => setShowModal(false)}
            className="w-full bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default SchedulingOptionsModal;