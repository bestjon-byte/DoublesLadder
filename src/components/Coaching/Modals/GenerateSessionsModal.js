import React, { useState, useEffect } from 'react';
import { Calendar, X } from 'lucide-react';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const GenerateSessionsModal = ({ isOpen, onClose, onGenerate, activeSchedules }) => {
  const [startDate, setStartDate] = useState(() => {
    // Default to next Monday
    const today = new Date();
    const daysUntilMonday = (8 - today.getDay()) % 7 || 7;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilMonday);
    return nextMonday.toISOString().split('T')[0];
  });

  const [weeksAhead, setWeeksAhead] = useState(4);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedSchedules, setSelectedSchedules] = useState([]);

  // Initialize all schedules as selected when modal opens
  useEffect(() => {
    if (isOpen && activeSchedules) {
      setSelectedSchedules(activeSchedules.map(s => s.id));
    }
  }, [isOpen, activeSchedules]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsGenerating(true);

    try {
      await onGenerate(startDate, weeksAhead, selectedSchedules);
      onClose();
    } catch (error) {
      console.error('Error generating sessions:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleSchedule = (scheduleId) => {
    setSelectedSchedules(prev =>
      prev.includes(scheduleId)
        ? prev.filter(id => id !== scheduleId)
        : [...prev, scheduleId]
    );
  };

  const selectAll = () => {
    setSelectedSchedules(activeSchedules.map(s => s.id));
  };

  const deselectAll = () => {
    setSelectedSchedules([]);
  };

  // Calculate end date for preview
  const getEndDate = () => {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + (weeksAhead * 7) - 1);
    return end.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getStartDateFormatted = () => {
    const start = new Date(startDate);
    return start.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-lg shadow-xl w-full sm:max-w-lg max-h-[90vh] sm:max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              Generate Sessions
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 -mr-2"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="overflow-y-auto flex-1 p-4 sm:p-6">
            <div className="space-y-4 sm:space-y-5">
              {/* Schedule Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Select Schedules
                  </label>
                  <div className="flex gap-2 text-xs">
                    <button
                      type="button"
                      onClick={selectAll}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Select All
                    </button>
                    <span className="text-gray-400">|</span>
                    <button
                      type="button"
                      onClick={deselectAll}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5 border border-gray-200 rounded-lg p-2 sm:p-3 max-h-40 overflow-y-auto bg-gray-50">
                  {activeSchedules && activeSchedules.length > 0 ? (
                    activeSchedules.map((schedule) => (
                      <label
                        key={schedule.id}
                        className="flex items-start gap-2.5 p-2 hover:bg-white rounded cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedSchedules.includes(schedule.id)}
                          onChange={() => toggleSchedule(schedule.id)}
                          className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-gray-900">
                            {schedule.session_type}
                          </div>
                          <div className="text-xs text-gray-600">
                            {DAY_NAMES[schedule.day_of_week]} at {schedule.session_time}
                          </div>
                        </div>
                      </label>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No active schedules available
                    </p>
                  )}
                </div>
                <p className="mt-1.5 text-xs text-gray-500">
                  {selectedSchedules.length} of {activeSchedules?.length || 0} selected
                </p>
              </div>

              {/* Start Date Picker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start From
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="mt-1.5 text-xs text-gray-500">
                  Sessions will be generated starting from this date
                </p>
              </div>

              {/* Weeks Ahead Selector - Responsive */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Weeks
                </label>

                {/* Mobile: Dropdown */}
                <div className="sm:hidden">
                  <select
                    value={weeksAhead}
                    onChange={(e) => setWeeksAhead(parseInt(e.target.value))}
                    className="w-full px-3 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {[1, 2, 3, 4, 6, 8, 10, 12].map((weeks) => (
                      <option key={weeks} value={weeks}>
                        {weeks} week{weeks !== 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Desktop: Buttons */}
                <div className="hidden sm:grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4, 6, 8, 10, 12].map((weeks) => (
                    <button
                      key={weeks}
                      type="button"
                      onClick={() => setWeeksAhead(weeks)}
                      className={`
                        px-3 py-2 rounded-md text-sm font-medium transition-colors
                        ${weeksAhead === weeks
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }
                      `}
                    >
                      {weeks}
                    </button>
                  ))}
                </div>

                <p className="mt-1.5 text-xs text-gray-500">
                  {weeksAhead} week{weeksAhead !== 1 ? 's' : ''} of sessions will be generated
                </p>
              </div>

              {/* Preview */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Start:</span>
                    <span className="font-medium text-gray-900">{getStartDateFormatted()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">End:</span>
                    <span className="font-medium text-gray-900">{getEndDate()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium text-gray-900">{weeksAhead} week{weeksAhead !== 1 ? 's' : ''}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-2 pt-2 border-t border-blue-200">
                    Only new sessions will be created. Existing sessions will be skipped.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Footer Actions */}
          <div className="flex gap-3 p-4 sm:p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors font-medium"
              disabled={isGenerating}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isGenerating || !startDate || weeksAhead < 1 || selectedSchedules.length === 0}
              className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isGenerating ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GenerateSessionsModal;
