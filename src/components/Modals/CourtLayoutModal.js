// src/components/Modals/CourtLayoutModal.js
import React from 'react';
import { Trophy, Target, ArrowLeft } from 'lucide-react';
import { getLayoutLabel, applyCourtLayout } from '../../utils/courtLayoutUtils';

const CourtLayoutModal = ({
  showModal,
  setShowModal,
  layoutOptions,
  sortedPlayers,
  schedulingMethod,
  onConfirm,
  onBack,
  seasonEloEnabled
}) => {
  if (!showModal) return null;

  const handleLayoutSelect = (layout) => {
    onConfirm(layout);
    setShowModal(false);
  };

  // Determine which icon and styling to use based on scheduling method
  const isElo = schedulingMethod === 'elo';
  const IconComponent = isElo ? Target : Trophy;
  const methodLabel = isElo ? 'ELO Rating' : 'Win Percentage';

  // Define complete class strings (Tailwind doesn't support dynamic class construction)
  const iconBgClass = isElo ? 'bg-purple-100' : 'bg-blue-100';
  const iconColorClass = isElo ? 'text-purple-600' : 'text-blue-600';
  const borderColorClass = isElo ? 'border-purple-200' : 'border-blue-200';
  const borderHoverClass = isElo ? 'hover:border-purple-400' : 'hover:border-blue-400';
  const buttonBgClass = isElo ? 'bg-purple-600' : 'bg-blue-600';
  const buttonHoverClass = isElo ? 'hover:bg-purple-700' : 'hover:bg-blue-700';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-3 mb-2">
            <div className={`p-2 rounded-full ${iconBgClass}`}>
              <IconComponent className={`w-5 h-5 ${iconColorClass}`} />
            </div>
            <h3 className="text-xl font-bold text-gray-900">
              Choose Court Layout - {methodLabel}
            </h3>
          </div>
          <p className="text-sm text-gray-600">
            {sortedPlayers.length} players available - Select how to distribute players across courts
          </p>
        </div>

        {/* Layout Options Grid */}
        <div className="p-6">
          {layoutOptions.length === 1 ? (
            // Single layout option - no choice needed, show info message
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">
                Only one layout option available for {sortedPlayers.length} players:
              </p>
              <div className="inline-block bg-gray-100 px-4 py-2 rounded-lg font-medium text-gray-900 mb-6">
                {layoutOptions[0].join('-')} (Courts: {layoutOptions[0].length})
              </div>
              <button
                onClick={() => handleLayoutSelect(layoutOptions[0])}
                className={`${buttonBgClass} ${buttonHoverClass} text-white py-3 px-8 rounded-lg transition-all transform hover:scale-[1.02] font-semibold shadow-md`}
              >
                Continue with this layout
              </button>
            </div>
          ) : (
            // Multiple layout options - show grid for selection
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {layoutOptions.map((layout, index) => {
                const courtPreviews = applyCourtLayout(sortedPlayers, layout);
                const layoutLabel = getLayoutLabel(layout, index);

                return (
                  <div
                    key={index}
                    className={`border-2 ${borderColorClass} ${borderHoverClass} rounded-lg p-4 hover:shadow-lg transition-all`}
                  >
                    {/* Layout Header */}
                    <div className="mb-4 pb-3 border-b border-gray-200">
                      <h4 className="font-bold text-gray-900 mb-1">{layoutLabel}</h4>
                      <p className="text-xs text-gray-500">
                        {layout.length} court{layout.length > 1 ? 's' : ''}: {layout.join(', ')} players each
                      </p>
                    </div>

                    {/* Court Previews */}
                    <div className="space-y-3 mb-4 max-h-[400px] overflow-y-auto">
                      {courtPreviews.map((court, courtIndex) => (
                        <div key={courtIndex} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <h5 className="font-semibold text-sm text-gray-900 mb-2">
                            Court {courtIndex + 1} ({court.length} players)
                          </h5>
                          <div className="space-y-1">
                            {court.map((player, playerIndex) => (
                              <div
                                key={player.id}
                                className="flex items-center justify-between text-xs"
                              >
                                <span className="font-medium text-gray-900">
                                  {playerIndex + 1}. {player.name}
                                </span>
                                <div className="flex items-center space-x-2 text-gray-500">
                                  {schedulingMethod === 'winPercent' && (
                                    <>
                                      <span>Rank #{player.rank || 'N/A'}</span>
                                      <span>•</span>
                                      <span>
                                        {Math.round((player.games_won || 0) / Math.max(player.games_played || 1, 1) * 100)}% Win
                                      </span>
                                    </>
                                  )}
                                  {schedulingMethod === 'elo' && (
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

                    {/* Select Button */}
                    <button
                      onClick={() => handleLayoutSelect(layout)}
                      className={`w-full ${buttonBgClass} ${buttonHoverClass} text-white py-3 px-4 rounded-lg transition-all transform hover:scale-[1.02] font-semibold shadow-md`}
                    >
                      Select Layout {String.fromCharCode(65 + index)}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex space-x-3">
          <button
            onClick={() => {
              setShowModal(false);
              if (onBack) onBack();
            }}
            className="flex items-center space-x-2 bg-gray-300 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-400 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Method Selection</span>
          </button>
          <button
            onClick={() => setShowModal(false)}
            className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourtLayoutModal;
