// src/components/Modals/ScoreModal.js
import React from 'react';

const ScoreModal = ({ 
  showModal, 
  setShowModal, 
  selectedMatch, 
  setSelectedMatch, 
  submitScore 
}) => {
  if (!showModal || !selectedMatch) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Enter Score</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">
                {selectedMatch.pair1.join(' & ')} vs {selectedMatch.pair2.join(' & ')}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {selectedMatch.pair1.join(' & ')}
                </label>
                <input
                  type="number"
                  id="pair1Score"
                  min="0"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Games won"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {selectedMatch.pair2.join(' & ')}
                </label>
                <input
                  type="number"
                  id="pair2Score"
                  min="0"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Games won"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 pt-4">
              <button
                onClick={() => {
                  const pair1Score = document.getElementById('pair1Score').value;
                  const pair2Score = document.getElementById('pair2Score').value;
                  if (pair1Score && pair2Score) {
                    submitScore(pair1Score, pair2Score);
                  } else {
                    alert('Please enter scores for both pairs');
                  }
                }}
                className="flex-1 bg-[#5D1F1F] text-white py-2 px-4 rounded-md hover:bg-[#4A1818]"
              >
                Submit Score
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedMatch(null);
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScoreModal;