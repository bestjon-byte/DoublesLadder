import React, { useState, useEffect } from 'react';
import { X, FileText, PoundSterling, Send, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { useAppToast } from '../../../contexts/ToastContext';

/**
 * Coach Invoice Modal
 * Allows the coach to request payment by sending an invoice to the club
 */
const CoachInvoiceModal = ({ isOpen, onClose, onSuccess, actions, summary, settings }) => {
  const { success: showSuccess, error: showError } = useAppToast();
  const [loading, setLoading] = useState(false);
  const [sessionsCount, setSessionsCount] = useState('');
  const [notes, setNotes] = useState('');

  // Calculate suggested sessions based on credit balance
  const suggestedSessions = summary
    ? Math.max(0, Math.ceil(Math.abs(summary.balance || 0) / (settings?.rate_per_session || 20)))
    : 0;

  // Pre-fill with suggested amount when opening
  useEffect(() => {
    if (isOpen && suggestedSessions > 0) {
      setSessionsCount(String(suggestedSessions));
    }
  }, [isOpen, suggestedSessions]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const count = parseInt(sessionsCount);
    if (!count || count <= 0) {
      showError('Please enter a valid number of sessions');
      return;
    }

    setLoading(true);
    try {
      const result = await actions.createCoachInvoice(count, notes);
      if (result.error) throw result.error;

      showSuccess('Invoice sent successfully to the club!');
      setSessionsCount('');
      setNotes('');
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Error creating invoice:', err);
      showError(err.message || 'Failed to send invoice');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const rate = settings?.rate_per_session || 20;
  const count = parseInt(sessionsCount) || 0;
  const totalAmount = count * rate;
  const creditBalance = summary?.balance || 0;
  const sessionsOwed = summary?.sessions_to_pay_count || 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b bg-gradient-to-r from-green-600 to-green-700 text-white rounded-t-lg">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6" />
            <h3 className="text-lg font-semibold">Request Payment</h3>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary Cards */}
        <div className="p-4 border-b bg-gray-50">
          <div className="grid grid-cols-2 gap-3">
            {/* Current Balance */}
            <div className={`p-3 rounded-lg ${
              creditBalance >= 0
                ? 'bg-green-50 border border-green-200'
                : 'bg-orange-50 border border-orange-200'
            }`}>
              <div className="text-xs text-gray-600 mb-1">Current Credit</div>
              <div className={`text-lg font-bold ${
                creditBalance >= 0 ? 'text-green-700' : 'text-orange-700'
              }`}>
                £{creditBalance.toFixed(2)}
              </div>
            </div>

            {/* Sessions Owed */}
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
              <div className="text-xs text-gray-600 mb-1">Sessions Owed</div>
              <div className="text-lg font-bold text-blue-700">
                {sessionsOwed}
              </div>
            </div>
          </div>

          {creditBalance < 0 && (
            <div className="mt-3 p-2 bg-orange-100 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-orange-800">
                The club owes you £{Math.abs(creditBalance).toFixed(2)}.
                Suggested invoice: {suggestedSessions} sessions
              </p>
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Sessions Count */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Sessions to Invoice
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={sessionsCount}
              onChange={(e) => setSessionsCount(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
              placeholder="e.g., 24"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              You can invoice for future sessions (prepayment) or past sessions
            </p>
          </div>

          {/* Calculated Amount */}
          {count > 0 && (
            <div className="bg-green-50 border-2 border-green-400 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">Invoice Amount</div>
                  <div className="text-2xl font-bold text-green-700">
                    £{totalAmount.toFixed(2)}
                  </div>
                </div>
                <PoundSterling className="w-8 h-8 text-green-500" />
              </div>
              <div className="mt-2 text-xs text-gray-600">
                {count} sessions × £{rate.toFixed(2)}/session
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              rows="2"
              placeholder="Any additional notes for the invoice..."
            />
          </div>

          {/* Invoice Preview */}
          {count > 0 && settings && (
            <div className="bg-gray-50 rounded-lg p-3 text-xs">
              <div className="flex items-center gap-1 text-gray-600 mb-2">
                <Info className="w-3 h-3" />
                <span>Invoice Preview</span>
              </div>
              <div className="space-y-1 text-gray-700">
                <div><strong>From:</strong> {settings.coach_name}</div>
                <div><strong>To:</strong> Cawood Tennis Club</div>
                <div><strong>Bank:</strong> {settings.bank_sort_code} / {settings.bank_account_number}</div>
                <div><strong>Amount:</strong> £{totalAmount.toFixed(2)}</div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || count <= 0}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Invoice
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer Info */}
        <div className="p-4 border-t bg-blue-50 rounded-b-lg">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800">
              Invoice will be emailed to <strong>cawoodtennis@gmail.com</strong> with your bank details.
              The admin will be notified and can mark it as paid when payment is received.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoachInvoiceModal;
