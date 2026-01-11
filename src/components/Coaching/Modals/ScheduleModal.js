import React, { useState, useEffect } from 'react';
import { X, PoundSterling } from 'lucide-react';
import { useAppToast } from '../../../contexts/ToastContext';

const DAY_OPTIONS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const SESSION_TYPES = ['Adults', 'Beginners', 'Juniors'];

const ScheduleModal = ({ isOpen, onClose, schedule, onSuccess, actions }) => {
  const { success, error } = useAppToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    schedule_name: '',
    session_type: 'Adults',
    day_of_week: 3, // Wednesday
    session_time: '18:00',
    session_cost: '4.00',
    is_junior_session: false,
    notes: '',
  });

  useEffect(() => {
    if (schedule) {
      setFormData({
        schedule_name: schedule.schedule_name || '',
        session_type: schedule.session_type || 'Adults',
        day_of_week: schedule.day_of_week || 3,
        session_time: schedule.session_time || '18:00',
        session_cost: schedule.session_cost?.toString() || '4.00',
        is_junior_session: schedule.is_junior_session || false,
        notes: schedule.notes || '',
      });
    } else {
      // Reset to defaults for new schedule
      setFormData({
        schedule_name: '',
        session_type: 'Adults',
        day_of_week: 3,
        session_time: '18:00',
        session_cost: '4.00',
        is_junior_session: false,
        notes: '',
      });
    }
  }, [schedule]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Prepare data with proper types
      const submitData = {
        ...formData,
        session_cost: parseFloat(formData.session_cost) || 0,
        // Set is_junior_session automatically based on session_type
        is_junior_session: formData.session_type === 'Juniors',
      };

      let result;
      if (schedule) {
        // Update existing schedule
        result = await actions.updateSchedule(schedule.id, submitData);
      } else {
        // Create new schedule
        result = await actions.createSchedule(submitData);
      }

      if (result.error) {
        throw result.error;
      }

      success(`Schedule ${schedule ? 'updated' : 'created'} successfully`);
      onSuccess();
    } catch (err) {
      error(err.message || `Failed to ${schedule ? 'update' : 'create'} schedule`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {schedule ? 'Edit Schedule' : 'Create New Schedule'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Schedule Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Schedule Name
            </label>
            <input
              type="text"
              value={formData.schedule_name}
              onChange={(e) => setFormData({ ...formData, schedule_name: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5D1F1F] focus:border-transparent"
              placeholder="e.g., Under 10s, Adult Improvers"
            />
            <p className="text-xs text-gray-500 mt-1">
              Optional: Give this schedule a friendly name
            </p>
          </div>

          {/* Session Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session Type
            </label>
            <select
              value={formData.session_type}
              onChange={(e) => {
                const newType = e.target.value;
                setFormData({
                  ...formData,
                  session_type: newType,
                  // Auto-set cost to 0 for Juniors
                  session_cost: newType === 'Juniors' ? '0.00' : formData.session_cost
                });
              }}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5D1F1F] focus:border-transparent"
              required
            >
              {SESSION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Day of Week */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Day of Week
            </label>
            <select
              value={formData.day_of_week}
              onChange={(e) => setFormData({ ...formData, day_of_week: parseInt(e.target.value) })}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5D1F1F] focus:border-transparent"
              required
            >
              {DAY_OPTIONS.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
          </div>

          {/* Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session Time
            </label>
            <input
              type="time"
              value={formData.session_time}
              onChange={(e) => setFormData({ ...formData, session_time: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5D1F1F] focus:border-transparent"
              required
            />
          </div>

          {/* Session Cost */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session Cost (£)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">£</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.session_cost}
                onChange={(e) => setFormData({ ...formData, session_cost: e.target.value })}
                className="w-full p-3 pl-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5D1F1F] focus:border-transparent"
                placeholder="4.00"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {formData.session_type === 'Juniors'
                ? 'Junior sessions are typically free (£0.00)'
                : 'Standard cost per session (e.g., £4.00)'}
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5D1F1F] focus:border-transparent"
              placeholder="e.g., Wednesday evening adult coaching"
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Saving...' : schedule ? 'Update Schedule' : 'Create Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleModal;
