// src/components/Modals/ScheduleModal.js
import React from 'react';

const ScheduleModal = ({ 
  showModal, 
  setShowModal, 
  newMatchDate, 
  setNewMatchDate, 
  addMatchToSeason 
}) => {
  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Add New Match</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Match Date
              </label>
              <input
                type="date"
                value={newMatchDate}
                onChange={(e) => setNewMatchDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div className="flex space-x-3 pt-4">
              <button
                onClick={addMatchToSeason}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
              >
                Add Match
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  setNewMatchDate('');
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

export default ScheduleModal;