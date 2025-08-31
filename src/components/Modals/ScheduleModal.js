// src/components/Modals/ScheduleModal.js - FIXED
import React from 'react';

const ScheduleModal = ({ 
  showModal, 
  setShowModal, 
  newMatchDate, 
  setNewMatchDate, 
  addMatchToSeason 
}) => {
  if (!showModal) return null;

  // Get today's date in YYYY-MM-DD format, ensuring we use local timezone
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayDate = getTodayDate();

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
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5D1F1F] focus:border-transparent"
                min={todayDate} // Now explicitly allows today's date
              />
              <p className="text-xs text-gray-500 mt-1">
                You can schedule matches for today ({new Date().toLocaleDateString('en-GB')}) or any future date
              </p>
            </div>
            
            <div className="flex space-x-3 pt-4">
              <button
                onClick={() => addMatchToSeason(newMatchDate)}
                disabled={!newMatchDate}
                className="flex-1 bg-[#5D1F1F] text-white py-2 px-4 rounded-md hover:bg-[#4A1818] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add Match
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  setNewMatchDate('');
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
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