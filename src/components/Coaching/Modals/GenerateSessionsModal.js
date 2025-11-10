import React, { useState } from 'react';
import { Calendar, X } from 'lucide-react';

const GenerateSessionsModal = ({ isOpen, onClose, onGenerate, activeSchedulesCount }) => {
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

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsGenerating(true);

    try {
      await onGenerate(startDate, weeksAhead);
      onClose();
    } catch (error) {
      console.error('Error generating sessions:', error);
    } finally {
      setIsGenerating(false);
    }
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Calendar className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Generate Sessions
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Active Schedules Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">{activeSchedulesCount}</span> active schedule
                {activeSchedulesCount !== 1 ? 's' : ''} will be used to generate sessions
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
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Sessions will be generated starting from this date
              </p>
            </div>

            {/* Weeks Ahead Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Weeks
              </label>
              <div className="grid grid-cols-4 gap-2">
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
              <p className="mt-1 text-xs text-gray-500">
                Generate sessions for the next {weeksAhead} week{weeksAhead !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Custom Weeks Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Or Enter Custom Number
              </label>
              <input
                type="number"
                min="1"
                max="52"
                value={weeksAhead}
                onChange={(e) => setWeeksAhead(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Preview */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Preview</h4>
              <div className="space-y-1 text-sm text-gray-700">
                <p>
                  <span className="font-medium">Start date:</span> {getStartDateFormatted()}
                </p>
                <p>
                  <span className="font-medium">End date:</span> {getEndDate()}
                </p>
                <p>
                  <span className="font-medium">Duration:</span> {weeksAhead} week{weeksAhead !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-gray-600 mt-2">
                  Existing sessions will be skipped. Only new sessions will be created.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              disabled={isGenerating}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isGenerating || !startDate || weeksAhead < 1}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isGenerating ? 'Generating...' : 'Generate Sessions'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GenerateSessionsModal;
