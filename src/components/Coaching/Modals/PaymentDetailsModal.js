import React from 'react';
import { X } from 'lucide-react';

const PaymentDetailsModal = ({ isOpen, onClose, payment }) => {
  if (!isOpen) return null;

  const sessions = payment.sessions || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold">Payment Details</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Payment Information</h4>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Player:</span> {payment.player?.name}</p>
              <p><span className="font-medium">Amount:</span> £{payment.amount_due.toFixed(2)}</p>
              <p><span className="font-medium">Sessions:</span> {payment.total_sessions}</p>
              <p><span className="font-medium">Status:</span> {payment.status}</p>
              <p>
                <span className="font-medium">Period:</span>{' '}
                {new Date(payment.billing_period_start).toLocaleDateString('en-GB')} -{' '}
                {new Date(payment.billing_period_end).toLocaleDateString('en-GB')}
              </p>
              {payment.payment_deadline && (
                <p><span className="font-medium">Deadline:</span> {new Date(payment.payment_deadline).toLocaleDateString('en-GB')}</p>
              )}
              {payment.paid_at && (
                <p className="text-green-600">
                  <span className="font-medium">Paid:</span> {new Date(payment.paid_at).toLocaleDateString('en-GB')}
                  {payment.payment_reference && ` (Ref: ${payment.payment_reference})`}
                </p>
              )}
              {payment.reminder_sent_at && (
                <p className="text-blue-600">
                  <span className="font-medium">Reminder Sent:</span> {new Date(payment.reminder_sent_at).toLocaleDateString('en-GB')}
                </p>
              )}
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Sessions Included ({sessions.length})
            </h4>
            {sessions.length === 0 ? (
              <p className="text-sm text-gray-500">No session details available</p>
            ) : (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {sessions.map((s, i) => (
                  <div key={i} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded text-sm">
                    <span>
                      {s.session?.session_date && new Date(s.session.session_date).toLocaleDateString('en-GB')}
                    </span>
                    <span className="text-gray-600">{s.session?.session_type}</span>
                    <span className="text-gray-500">£4.00</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetailsModal;
