import React from 'react';

const PlayersGuideModal = ({ showModal, setShowModal }) => {
  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-[#5D1F1F]">Tennis Ladder Players Guide</h2>
          <button
            onClick={() => setShowModal(false)}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="prose prose-sm max-w-none">

            {/* Welcome Section */}
            <div className="mb-8">
              <p className="text-gray-700 mb-4 text-lg">
                Welcome to the Tennis Ladder! This guide covers everything you need to know about our ranking system, match scheduling, and how to compete for prizes.
              </p>
            </div>

            {/* How Rankings Work */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-[#5D1F1F] mb-4">How Rankings Work</h3>

              <h4 className="text-lg font-medium text-gray-800 mb-3">Your Position on the Ladder</h4>
              <p className="text-gray-700 mb-4">
                Your ladder position is based on your <strong>win percentage</strong> - simply the number of games you've won divided by your total games played.
              </p>

              <h4 className="text-lg font-medium text-gray-800 mb-3">ELO Rating</h4>
              <p className="text-gray-700 mb-2">We also use an ELO rating system to:</p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Schedule fair matches between players of similar skill levels</li>
                <li>Track your improvement over time</li>
                <li>Ensure competitive, enjoyable games</li>
              </ul>
              <p className="text-gray-700 mb-4 italic">
                How ELO works: Beat a higher-rated player and your rating jumps up significantly. Beat a lower-rated player and it rises slightly. The reverse happens when you lose.
              </p>

              <h4 className="text-lg font-medium text-gray-800 mb-3">Minimum Games Requirement</h4>
              <p className="text-gray-700 mb-4">
                You must play at least <strong>3 matches</strong> during the season to be eligible for prizes.
              </p>
            </div>

            {/* Prizes */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-[#5D1F1F] mb-4">Prizes</h3>
              <p className="text-gray-700 mb-2">At the end of each season, we award:</p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li><strong>Men's Champion</strong> - highest win percentage</li>
                <li><strong>Ladies Champion</strong> - highest win percentage</li>
                <li><strong>Most Improved Player</strong> - biggest ELO rating increase during the season</li>
              </ul>
            </div>

            {/* Match Schedule */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-[#5D1F1F] mb-4">Match Schedule</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-blue-800 font-semibold">
                  <strong>When:</strong> Sunday mornings at 10:00 AM sharp
                </p>
                <p className="text-blue-700 text-sm mt-1">
                  <strong>Important:</strong> Arrive early to warm up - matches begin promptly at 10:00 AM!
                </p>
              </div>
            </div>

            {/* Match Format */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-[#5D1F1F] mb-4">Match Format</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 mb-2">5 Players on Court</h4>
                  <ul className="list-disc list-inside text-green-700 space-y-1 text-sm">
                    <li><strong>8 games total</strong></li>
                    <li>Rotating doubles with one player sitting out each game</li>
                    <li>Each player sits out exactly once to ensure equal playing time</li>
                  </ul>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">4 Players on Court</h4>
                  <ul className="list-disc list-inside text-blue-700 space-y-1 text-sm">
                    <li><strong>10 games total</strong></li>
                    <li>Straight doubles throughout the entire match</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Season Details */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-[#5D1F1F] mb-4">Season Details</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Each season runs 10-12 weeks</li>
                <li>Rankings update weekly and are viewable online anytime</li>
                <li>New seasons begin shortly after the previous season ends</li>
              </ul>
            </div>

            {/* Tips for Success */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-[#5D1F1F] mb-4">Tips for Success</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li><strong>Play regularly</strong> - More matches mean more opportunities to improve your win percentage</li>
                <li><strong>Focus on individual games</strong> - Each game counts toward your ranking, not just overall match wins</li>
                <li><strong>Practice good sportsmanship</strong> - Agree on scores before leaving the court</li>
              </ul>
            </div>

            {/* Common Questions */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-[#5D1F1F] mb-4">Common Questions</h3>

              <div className="space-y-4">
                <div className="border-l-4 border-[#5D1F1F] pl-4">
                  <h4 className="font-semibold text-gray-800 mb-1">What happens if we disagree on a game result?</h4>
                  <p className="text-gray-700 text-sm">All players should agree on the score before leaving the court. Contact the ladder administrator if you can't resolve a dispute.</p>
                </div>

                <div className="border-l-4 border-[#5D1F1F] pl-4">
                  <h4 className="font-semibold text-gray-800 mb-1">When do rankings update?</h4>
                  <p className="text-gray-700 text-sm">Rankings are updated weekly and can be viewed online at any time.</p>
                </div>
              </div>
            </div>

            {/* Good Luck Message */}
            <div className="text-center bg-[#5D1F1F] text-white rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-2">Good luck and have fun! 🎾</h3>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4">
          <button
            onClick={() => setShowModal(false)}
            className="w-full bg-[#5D1F1F] text-white py-2 px-4 rounded-md hover:bg-[#4A1818] transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlayersGuideModal;