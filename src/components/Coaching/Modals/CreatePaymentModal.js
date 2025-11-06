import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAppToast } from '../../../contexts/ToastContext';

const CreatePaymentModal = ({ isOpen, onClose, onSuccess, actions, allUsers }) => {
  const { success, error } = useAppToast();
  const [loading, setLoading] = useState(false);
  const [checkingUnpaid, setCheckingUnpaid] = useState(false);
  const [unpaidSessions, setUnpaidSessions] = useState([]);
  const [formData, setFormData] = useState({
    player_id: '',
    billing_period_start: '',
    billing_period_end: '',
    payment_deadline: '',
  });

  const handlePlayerChange = async (playerId) => {
    setFormData({ ...formData, player_id: playerId });
    if (playerId && formData.billing_period_start && formData.billing_period_end) {
      await checkUnpaidSessions(playerId, formData.billing_period_start, formData.billing_period_end);
    }
  };

  const checkUnpaidSessions = async (playerId, start, end) => {
    setCheckingUnpaid(true);
    const result = await actions.getUnpaidSessions(playerId, start, end);
    setCheckingUnpaid(false);
    if (!result.error) {
      setUnpaidSessions(result.data || []);
    }
  };

  useEffect(() => {
    if (formData.player_id && formData.billing_period_start && formData.billing_period_end) {
      checkUnpaidSessions(formData.player_id, formData.billing_period_start, formData.billing_period_end);
    }
  }, [formData.billing_period_start, formData.billing_period_end]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (unpaidSessions.length === 0) {
      error('No unpaid sessions found for the selected period');
      return;
    }

    setLoading(true);
    try {
      const result = await actions.createPaymentRequest(
        formData.player_id,
        formData.billing_period_start,
        formData.billing_period_end,
        formData.payment_deadline || null
      );
      if (result.error) throw result.error;

      success('Payment request created successfully');
      onSuccess();
    } catch (err) {
      error(err.message || 'Failed to create payment request');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const totalAmount = unpaidSessions.length * 4;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold">Create Payment Request</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Player</label>
            <select
              value={formData.player_id}
              onChange={(e) => handlePlayerChange(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5D1F1F] focus:border-transparent"
              required
            >
              <option value="">Select a player...</option>
              {allUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Period Start</label>
              <input
                type="date"
                value={formData.billing_period_start}
                onChange={(e) => setFormData({ ...formData, billing_period_start: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5D1F1F] focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Period End</label>
              <input
                type="date"
                value={formData.billing_period_end}
                onChange={(e) => setFormData({ ...formData, billing_period_end: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5D1F1F] focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Deadline (Optional)</label>
            <input
              type="date"
              value={formData.payment_deadline}
              onChange={(e) => setFormData({ ...formData, payment_deadline: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5D1F1F] focus:border-transparent"
            />
          </div>

          {checkingUnpaid && (
            <div className="text-center py-2 text-gray-600">Checking unpaid sessions...</div>
          )}

          {!checkingUnpaid && formData.player_id && formData.billing_period_start && formData.billing_period_end && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900 mb-2">
                Unpaid Sessions: {unpaidSessions.length}
              </p>
              {unpaidSessions.length > 0 && (
                <>
                  <p className="text-sm text-blue-700">
                    Total Amount: £{totalAmount.toFixed(2)} ({unpaidSessions.length} × £4.00)
                  </p>
                  <div className="mt-2 max-h-32 overflow-y-auto text-xs text-blue-600">
                    {unpaidSessions.map((s, i) => (
                      <div key={i}>• {new Date(s.session_date).toLocaleDateString('en-GB')} - {s.session_type}</div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || unpaidSessions.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePaymentModal;
