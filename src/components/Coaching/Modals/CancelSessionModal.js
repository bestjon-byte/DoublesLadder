import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useAppToast } from '../../../contexts/ToastContext';

const CancelSessionModal = ({ isOpen, onClose, session, actions, onSuccess }) => {
  const { success, error } = useAppToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cancellation_reason: '',
    coach_payment_status: 'to_pay', // Default: still pay coach
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // First cancel the session with the reason
      const cancelResult = await actions.cancelSession(session.id, formData.cancellation_reason);
      if (cancelResult.error) throw cancelResult.error;

      // Then update the coach payment status
      const paymentResult = await actions.updateSessionCoachPaymentStatus(
        session.id,
        formData.coach_payment_status,
        `Cancelled session - payment status: ${formData.coach_payment_status === 'to_pay' ? 'To Pay' : 'No Payment'}`
      );
      if (paymentResult.error) throw paymentResult.error;

      success('Session cancelled successfully');
      onSuccess();
      onClose();
    } catch (err) {
      error(err.message || 'Failed to cancel session');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold">Cancel Session</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-900">
              <strong>Session:</strong> {session.session_type} on{' '}
              {new Date(session.session_date).toLocaleDateString('en-GB')} at {session.session_time}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cancellation Reason
            </label>
            <textarea
              value={formData.cancellation_reason}
              onChange={(e) => setFormData({ ...formData, cancellation_reason: e.target.value })}
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5D1F1F] focus:border-transparent"
              placeholder="Why is this session being cancelled?"
            />
          </div>

          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Coach Payment
            </label>
            <p className="text-sm text-gray-600 mb-3">
              Should we still pay the coach for this cancelled session?
            </p>
            <div className="space-y-3">
              <label className="flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                     style={{ borderColor: formData.coach_payment_status === 'to_pay' ? '#2196f3' : '#ddd' }}>
                <input
                  type="radio"
                  name="coach_payment_status"
                  value="to_pay"
                  checked={formData.coach_payment_status === 'to_pay'}
                  onChange={(e) => setFormData({ ...formData, coach_payment_status: e.target.value })}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">To Pay</div>
                  <div className="text-sm text-gray-600">
                    Coach will be paid for this session (e.g., cancelled with short notice, coach's decision to run it)
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                     style={{ borderColor: formData.coach_payment_status === 'no_payment' ? '#2196f3' : '#ddd' }}>
                <input
                  type="radio"
                  name="coach_payment_status"
                  value="no_payment"
                  checked={formData.coach_payment_status === 'no_payment'}
                  onChange={(e) => setFormData({ ...formData, coach_payment_status: e.target.value })}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">No Payment</div>
                  <div className="text-sm text-gray-600">
                    Coach will NOT be paid (e.g., weather, coach unavailable, cancelled well in advance)
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Cancelling...' : 'Cancel Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CancelSessionModal;
