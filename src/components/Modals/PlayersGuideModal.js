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
              <h3 className="text-xl font-semibold text-[#5D1F1F] mb-4">Welcome to the Tennis Ladder! 🎾</h3>
              <p className="text-gray-700 mb-4">
                This guide explains how our tennis ladder system works, including scheduling, rankings, and prizes.
              </p>
            </div>

            {/* How the Ladder Works */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-[#5D1F1F] mb-4">How the Ladder Works</h3>

              <h4 className="text-lg font-medium text-gray-800 mb-3">Ranking System</h4>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li><strong>Primary Ranking</strong>: Determined by <strong>win percentage</strong> (wins ÷ total matches played)</li>
                <li><strong>ELO Rating</strong>: Used for fair match scheduling and skill assessment</li>
                <li><strong>Minimum Matches</strong>: Players must complete a minimum number of matches to be eligible for prizes</li>
              </ul>

              <h4 className="text-lg font-medium text-gray-800 mb-3">Champions & Prizes</h4>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li><strong>Men's Champion</strong>: Player with highest win percentage at season end</li>
                <li><strong>Ladies Champion</strong>: Player with highest win percentage at season end</li>
                <li><strong>Most Improved Prize</strong>: Player with the greatest ELO rating improvement during the season</li>
              </ul>
            </div>

            {/* Match Scheduling */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-[#5D1F1F] mb-4">Match Scheduling</h3>

              <h4 className="text-lg font-medium text-gray-800 mb-3">How Matches Are Scheduled</h4>
              <ol className="list-decimal list-inside text-gray-700 mb-4 space-y-2">
                <li>Matches are scheduled based on <strong>ELO ratings</strong> to ensure fair competition</li>
                <li>Players with similar skill levels (ELO ratings) are paired together</li>
                <li>The system will automatically suggest match pairings each week</li>
                <li>Players coordinate directly to arrange specific times within the scheduled week</li>
              </ol>

              <h4 className="text-lg font-medium text-gray-800 mb-3">Court Format & Game Rules</h4>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <h5 className="font-semibold text-green-800 mb-2">5 Players on Court</h5>
                <ul className="list-disc list-inside text-green-700 space-y-1">
                  <li><strong>Format</strong>: 8 games total</li>
                  <li><strong>Structure</strong>: Rotating doubles with one player sitting out each game</li>
                  <li><strong>Rotation</strong>: Each player sits out approximately 1-2 games to ensure equal playing time</li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h5 className="font-semibold text-blue-800 mb-2">4 Players on Court</h5>
                <ul className="list-disc list-inside text-blue-700 space-y-1">
                  <li><strong>Format</strong>: 10 games total</li>
                  <li><strong>Structure</strong>: Straight doubles (2v2 throughout)</li>
                  <li><strong>Teams</strong>: May rotate or stay consistent depending on player preference and fairness</li>
                </ul>
              </div>

              <h4 className="text-lg font-medium text-gray-800 mb-3">Match Results</h4>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li><strong>Scoring</strong>: Each game won/lost counts toward your overall record</li>
                <li><strong>Reporting</strong>: Results must be reported within 48 hours of match completion</li>
                <li><strong>Verification</strong>: All players should confirm match results for accuracy</li>
              </ul>
            </div>

            {/* ELO Rating System */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-[#5D1F1F] mb-4">ELO Rating System</h3>

              <h4 className="text-lg font-medium text-gray-800 mb-3">What is ELO?</h4>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>A skill rating system that adjusts based on match outcomes</li>
                <li>Beating higher-rated players increases your ELO more than beating lower-rated players</li>
                <li>Losing to lower-rated players decreases your ELO more than losing to higher-rated players</li>
              </ul>

              <h4 className="text-lg font-medium text-gray-800 mb-3">How ELO Affects You</h4>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li><strong>Match Scheduling</strong>: Ensures you play against similarly skilled opponents</li>
                <li><strong>Fair Competition</strong>: Prevents mismatched games that aren't fun for anyone</li>
                <li><strong>Progress Tracking</strong>: Shows your improvement over time</li>
              </ul>
            </div>

            {/* Tips for Success */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-[#5D1F1F] mb-4">Tips for Success</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-800 mb-2">Improving Win Percentage</h4>
                  <ul className="list-disc list-inside text-yellow-700 text-sm space-y-1">
                    <li><strong>Consistency</strong>: Regular play helps maintain skill level</li>
                    <li><strong>Strategy</strong>: Focus on doubles strategy and communication</li>
                    <li><strong>Fitness</strong>: Stay in tennis shape throughout the season</li>
                  </ul>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-800 mb-2">Moving Up the Ladder</h4>
                  <ul className="list-disc list-inside text-purple-700 text-sm space-y-1">
                    <li>Play regularly to increase total matches</li>
                    <li>Focus on winning games rather than just matches</li>
                    <li>Learn from stronger players in your matches</li>
                  </ul>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 mb-2">Most Improved Prize</h4>
                  <ul className="list-disc list-inside text-green-700 text-sm space-y-1">
                    <li>Focus on fundamental skill development</li>
                    <li>Take lessons or practice outside ladder matches</li>
                    <li>Play consistently throughout the season</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* FAQ */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-[#5D1F1F] mb-4">Frequently Asked Questions</h3>

              <div className="space-y-4">
                <div className="border-l-4 border-[#5D1F1F] pl-4">
                  <h4 className="font-semibold text-gray-800 mb-2">What happens if I can't make my scheduled match?</h4>
                  <p className="text-gray-700 text-sm">Contact the other players as soon as possible to reschedule within the same week, or arrange a make-up match.</p>
                </div>

                <div className="border-l-4 border-[#5D1F1F] pl-4">
                  <h4 className="font-semibold text-gray-800 mb-2">How often will I play?</h4>
                  <p className="text-gray-700 text-sm">Typically 1-2 matches per week, depending on the number of participants and court availability.</p>
                </div>

                <div className="border-l-4 border-[#5D1F1F] pl-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Can I play with the same partner every time?</h4>
                  <p className="text-gray-700 text-sm">In the 4-player format, you may have consistency. In 5-player format, rotation ensures you play with different partners.</p>
                </div>

                <div className="border-l-4 border-[#5D1F1F] pl-4">
                  <h4 className="font-semibold text-gray-800 mb-2">When are rankings updated?</h4>
                  <p className="text-gray-700 text-sm">Rankings are updated after each match and can be viewed online at any time.</p>
                </div>
              </div>
            </div>

            {/* Good Luck Message */}
            <div className="text-center bg-[#5D1F1F] text-white rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-2">Good luck and have fun!</h3>
              <p className="text-lg">May the best players win! 🎾</p>
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