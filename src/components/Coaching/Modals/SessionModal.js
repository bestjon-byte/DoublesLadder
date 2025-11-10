import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useAppToast } from '../../../contexts/ToastContext';

const SessionModal = ({ isOpen, onClose, onSuccess, actions }) => {
  const { success, error } = useAppToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    session_type: 'Adults',
    session_date: new Date().toISOString().split('T')[0],
    session_time: '18:00',
    notes: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await actions.createSession(formData);
      if (result.error) throw result.error;

      success('Session created successfully');
      onSuccess();
    } catch (err) {
      error(err.message || 'Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold">Create Manual Session</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Session Type</label>
            <select
              value={formData.session_type}
              onChange={(e) => setFormData({ ...formData, session_type: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5D1F1F] focus:border-transparent"
              required
            >
              <option value="Adults">Adults</option>
              <option value="Beginners">Beginners</option>
              <option value="Juniors">Juniors</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={formData.session_date}
              onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5D1F1F] focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
            <input
              type="time"
              value={formData.session_time}
              onChange={(e) => setFormData({ ...formData, session_time: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5D1F1F] focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5D1F1F] focus:border-transparent"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Creating...' : 'Create Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SessionModal;
