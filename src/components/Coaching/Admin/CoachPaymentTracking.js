import React, { useState, useEffect } from 'react';
import { useCoaching } from '../../../hooks/useCoaching';
import { useAppToast } from '../../../contexts/ToastContext';
import { FileText, CheckCircle, Clock, XCircle } from 'lucide-react';

/**
 * Coach Payment Tracking Component (Admin Only)
 * Tracks what the club owes the coach for delivered sessions
 * Includes pending invoice requests from coach
 */
const CoachPaymentTracking = ({ userId }) => {
  const { actions } = useCoaching(userId, true);
  const { success: showToast, error: showError } = useAppToast();

  const [summary, setSummary] = useState(null);
  const [sessionsToPay, setSessionsToPay] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [pendingInvoices, setPendingInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRecordPayment, setShowRecordPayment] = useState(false);
  const [showGoodwillPayment, setShowGoodwillPayment] = useState(false);
  const [showRateConfig, setShowRateConfig] = useState(false);
  const [processingInvoice, setProcessingInvoice] = useState(null);
  const [rejectingInvoice, setRejectingInvoice] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    payment_date: new Date().toISOString().split('T')[0],
    amount: '',
    payment_type: 'regular',
    payment_method: 'bank_transfer',
    reference: '',
    notes: '',
  });

  // Rate config form state
  const [rateForm, setRateForm] = useState({
    session_type: 'Adults',
    new_rate: '20.00',
    effective_from: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // Load data
  const loadData = async () => {
    setLoading(true);
    try {
      const [summaryRes, sessionsRes, historyRes, invoicesRes] = await Promise.all([
        actions.getCoachPaymentSummary(),
        actions.getCoachSessionsToPay(),
        actions.getCoachPaymentHistory(),
        actions.getCoachPendingInvoices(),
      ]);

      if (summaryRes.error) throw new Error(summaryRes.error);
      if (sessionsRes.error) throw new Error(sessionsRes.error);
      if (historyRes.error) throw new Error(historyRes.error);

      setSummary(summaryRes.data);
      setSessionsToPay(sessionsRes.data);
      setPaymentHistory(historyRes.data);
      setPendingInvoices(invoicesRes.data || []);
    } catch (error) {
      console.error('Error loading coach payment data:', error);
      showError('Failed to load coach payment data');
    } finally {
      setLoading(false);
    }
  };

  // Handle marking invoice as paid
  const handleMarkInvoicePaid = async (invoice) => {
    setProcessingInvoice(invoice.id);
    try {
      // First record the payment
      const paymentResult = await actions.recordCoachPayment({
        payment_date: new Date().toISOString().split('T')[0],
        amount: invoice.total_amount,
        payment_type: 'regular',
        payment_method: 'bank_transfer',
        reference: `Invoice #${String(invoice.invoice_number).padStart(2, '0')}`,
        notes: `Payment for invoice #${invoice.invoice_number}`,
      });

      if (paymentResult.error) throw paymentResult.error;

      // Then mark the invoice as paid
      const invoiceResult = await actions.markInvoicePaid(
        invoice.id,
        `Invoice #${String(invoice.invoice_number).padStart(2, '0')}`,
        paymentResult.data?.id || null
      );

      if (invoiceResult.error) throw invoiceResult.error;

      showToast('Invoice marked as paid and payment recorded');
      loadData();
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      showError('Failed to process invoice payment');
    } finally {
      setProcessingInvoice(null);
    }
  };

  // Handle rejecting invoice
  const handleRejectInvoice = async (invoice) => {
    if (!window.confirm(`Are you sure you want to reject Invoice #${String(invoice.invoice_number).padStart(2, '0')} for £${Number(invoice.total_amount).toFixed(2)}?`)) {
      return;
    }

    setProcessingInvoice(invoice.id);
    try {
      const result = await actions.rejectInvoice(invoice.id, rejectReason);
      if (result.error) throw result.error;

      showToast('Invoice rejected');
      setRejectingInvoice(null);
      setRejectReason('');
      loadData();
    } catch (error) {
      console.error('Error rejecting invoice:', error);
      showError('Failed to reject invoice');
    } finally {
      setProcessingInvoice(null);
    }
  };

  useEffect(() => {
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle record payment
  const handleRecordPayment = async (e) => {
    e.preventDefault();

    const { error } = await actions.recordCoachPayment(paymentForm);

    if (error) {
      showError('Failed to record payment');
      return;
    }

    showToast('Payment recorded successfully');
    setShowRecordPayment(false);
    setPaymentForm({
      payment_date: new Date().toISOString().split('T')[0],
      amount: '',
      payment_type: 'regular',
      payment_method: 'bank_transfer',
      reference: '',
      notes: '',
    });
    loadData();
  };

  // Handle goodwill payment
  const handleGoodwillPayment = async (e) => {
    e.preventDefault();

    const { error } = await actions.recordCoachPayment({
      ...paymentForm,
      payment_type: 'goodwill',
    });

    if (error) {
      showError('Failed to record goodwill payment');
      return;
    }

    showToast('Goodwill payment recorded successfully');
    setShowGoodwillPayment(false);
    setPaymentForm({
      payment_date: new Date().toISOString().split('T')[0],
      amount: '',
      payment_type: 'regular',
      payment_method: 'bank_transfer',
      reference: '',
      notes: '',
    });
    loadData();
  };

  // Handle update rate
  const handleUpdateRate = async (e) => {
    e.preventDefault();

    const { error } = await actions.updateCoachRate(
      rateForm.session_type,
      parseFloat(rateForm.new_rate),
      rateForm.effective_from,
      rateForm.notes
    );

    if (error) {
      showError('Failed to update rate');
      return;
    }

    showToast('Rate updated successfully');
    setShowRateConfig(false);
    setRateForm({
      session_type: 'Adults',
      new_rate: '20.00',
      effective_from: new Date().toISOString().split('T')[0],
      notes: '',
    });
    loadData();
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return <div className="loading-spinner">Loading coach payment data...</div>;
  }

  return (
    <div className="coach-payment-tracking">
      <h2>Coach Payment Tracking</h2>
      <p className="subtitle">Track payments owed to coach for delivered sessions</p>

      {/* Pending Invoice Requests */}
      {pendingInvoices.length > 0 && (
        <div className="mb-8 p-5 bg-yellow-50 border-2 border-yellow-400 rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-yellow-700" />
            <h3 className="m-0 text-yellow-800">
              Pending Invoice Requests ({pendingInvoices.length})
            </h3>
          </div>
          <p className="text-sm text-yellow-700 mb-4">
            The coach has requested payment. Review and mark as paid when processed.
          </p>
          <div className="space-y-3">
            {pendingInvoices.map((invoice) => (
              <div
                key={invoice.id}
                className="bg-white p-4 rounded-lg border border-yellow-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="font-semibold text-gray-900">
                    Invoice #{String(invoice.invoice_number).padStart(2, '0')}
                  </div>
                  <div className="text-sm text-gray-600">
                    {invoice.coach?.name || 'Coach'} • {new Date(invoice.invoice_date).toLocaleDateString('en-GB')}
                  </div>
                  <div className="text-sm text-gray-500">
                    {invoice.sessions_count} sessions @ £{invoice.rate_per_session}/session
                  </div>
                  {invoice.notes && (
                    <div className="text-xs text-gray-400 mt-1 italic">
                      Note: {invoice.notes}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="text-xl font-bold text-yellow-700">
                    £{Number(invoice.total_amount).toFixed(2)}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleMarkInvoicePaid(invoice)}
                      disabled={processingInvoice === invoice.id}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
                    >
                      {processingInvoice === invoice.id ? (
                        <>
                          <Clock className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Mark as Paid
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleRejectInvoice(invoice)}
                      disabled={processingInvoice === invoice.id}
                      className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50 font-medium"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
        {/* Total Paid */}
        <div className="bg-green-50 p-5 rounded-lg border-2 border-green-500">
          <h3 className="m-0 mb-2.5 text-green-800">Total Paid</h3>
          <div className="text-3xl font-bold text-green-900">
            {formatCurrency(summary?.total_paid)}
          </div>
          <div className="text-sm text-green-700 mt-1">
            Credits available
          </div>
        </div>

        {/* Total Owed */}
        <div className="bg-orange-50 p-5 rounded-lg border-2 border-orange-500">
          <h3 className="m-0 mb-2.5 text-orange-800">Total Owed</h3>
          <div className="text-3xl font-bold text-orange-900">
            {formatCurrency(summary?.total_owed)}
          </div>
          <div className="text-sm text-orange-600 mt-1">
            {summary?.sessions_to_pay_count || 0} sessions to pay
          </div>
        </div>

        {/* Balance */}
        <div className={`p-5 rounded-lg border-2 ${
          summary?.balance >= 0
            ? 'bg-blue-50 border-blue-500'
            : 'bg-red-50 border-red-500'
        }`}>
          <h3 className={`m-0 mb-2.5 ${
            summary?.balance >= 0 ? 'text-blue-900' : 'text-red-900'
          }`}>
            Balance
          </h3>
          <div className={`text-3xl font-bold ${
            summary?.balance >= 0 ? 'text-blue-800' : 'text-red-800'
          }`}>
            {formatCurrency(summary?.balance)}
          </div>
          <div className={`text-sm mt-1 ${
            summary?.balance >= 0 ? 'text-blue-700' : 'text-red-700'
          }`}>
            {summary?.balance >= 0 ? 'In credit' : 'Amount owed'}
          </div>
        </div>
      </div>

      {/* Session Type Breakdown */}
      {summary && (
        <div className="mb-8 p-4 bg-gray-100 rounded-lg">
          <h3 className="mt-0">Breakdown by Session Type</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {summary.adults_sessions_count > 0 && (
              <div className="p-2.5 bg-white rounded">
                <strong>Adults:</strong> {formatCurrency(summary.adults_owed)} ({summary.adults_sessions_count} sessions)
              </div>
            )}
            {summary.beginners_sessions_count > 0 && (
              <div className="p-2.5 bg-white rounded">
                <strong>Beginners:</strong> {formatCurrency(summary.beginners_owed)} ({summary.beginners_sessions_count} sessions)
              </div>
            )}
            {summary.juniors_sessions_count > 0 && (
              <div className="p-2.5 bg-white rounded">
                <strong>Juniors:</strong> {formatCurrency(summary.juniors_owed)} ({summary.juniors_sessions_count} sessions)
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mb-8 flex flex-wrap gap-2.5">
        <button
          className="btn btn-primary"
          onClick={() => setShowRecordPayment(!showRecordPayment)}
        >
          {showRecordPayment ? 'Cancel' : 'Record Payment'}
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => setShowGoodwillPayment(!showGoodwillPayment)}
        >
          {showGoodwillPayment ? 'Cancel' : 'Add Goodwill Payment'}
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => setShowRateConfig(!showRateConfig)}
        >
          {showRateConfig ? 'Cancel' : 'Update Rates'}
        </button>
      </div>

      {/* Record Payment Form */}
      {showRecordPayment && (
        <div className="mb-8 p-5 bg-gray-50 rounded-lg">
          <h3>Record Payment to Coach</h3>
          <form onSubmit={handleRecordPayment}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label>Payment Date *</label>
                <input
                  type="date"
                  value={paymentForm.payment_date}
                  onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                  required
                />
              </div>
              <div>
                <label>Amount (£) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  placeholder="e.g. 200.00"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label>Payment Method</label>
                <select
                  value={paymentForm.payment_method}
                  onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="cheque">Cheque</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label>Reference</label>
                <input
                  type="text"
                  value={paymentForm.reference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                  placeholder="Transaction reference"
                />
              </div>
            </div>

            <div className="mb-4">
              <label>Notes</label>
              <textarea
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                placeholder="Optional notes about this payment"
                rows="3"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">Record Payment</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowRecordPayment(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Goodwill Payment Form */}
      {showGoodwillPayment && (
        <div className="mb-8 p-5 bg-blue-50 rounded-lg">
          <h3>Add Goodwill Payment</h3>
          <p className="text-sm text-gray-600 mb-4">
            Record a one-off payment to the coach not tied to specific sessions
          </p>
          <form onSubmit={handleGoodwillPayment}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label>Payment Date *</label>
                <input
                  type="date"
                  value={paymentForm.payment_date}
                  onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                  required
                />
              </div>
              <div>
                <label>Amount (£) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  placeholder="e.g. 50.00"
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label>Reason / Notes *</label>
              <textarea
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                placeholder="Reason for goodwill payment"
                rows="3"
                required
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">Add Goodwill Payment</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowGoodwillPayment(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Rate Configuration Form */}
      {showRateConfig && (
        <div className="mb-8 p-5 bg-yellow-50 rounded-lg">
          <h3>Update Coach Payment Rates</h3>
          <p className="text-sm text-gray-600 mb-4">
            Set new payment rates for coaching sessions by type
          </p>
          <form onSubmit={handleUpdateRate}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div>
                <label>Session Type *</label>
                <select
                  value={rateForm.session_type}
                  onChange={(e) => setRateForm({ ...rateForm, session_type: e.target.value })}
                  required
                >
                  <option value="Adults">Adults</option>
                  <option value="Beginners">Beginners</option>
                  <option value="Juniors">Juniors</option>
                </select>
              </div>
              <div>
                <label>New Rate (£) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={rateForm.new_rate}
                  onChange={(e) => setRateForm({ ...rateForm, new_rate: e.target.value })}
                  placeholder="e.g. 20.00"
                  required
                />
              </div>
              <div>
                <label>Effective From *</label>
                <input
                  type="date"
                  value={rateForm.effective_from}
                  onChange={(e) => setRateForm({ ...rateForm, effective_from: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label>Notes</label>
              <input
                type="text"
                value={rateForm.notes}
                onChange={(e) => setRateForm({ ...rateForm, notes: e.target.value })}
                placeholder="Reason for rate change"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">Update Rate</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowRateConfig(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Sessions Awaiting Payment */}
      <div className="mb-8">
        <h3>Sessions Awaiting Payment ({sessionsToPay.length})</h3>
        {sessionsToPay.length === 0 ? (
          <p className="text-gray-600 italic">No sessions awaiting payment</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left border-b-2 border-gray-300 font-semibold">Date</th>
                  <th className="p-3 text-left border-b-2 border-gray-300 font-semibold">Type</th>
                  <th className="p-3 text-left border-b-2 border-gray-300 font-semibold">Status</th>
                  <th className="p-3 text-left border-b-2 border-gray-300 font-semibold">Amount</th>
                  <th className="p-3 text-left border-b-2 border-gray-300 font-semibold">Notes</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {sessionsToPay.map((session) => (
                  <tr key={session.session_id} className="hover:bg-gray-50">
                    <td className="p-2.5 border-b border-gray-200">{formatDate(session.session_date)}</td>
                    <td className="p-2.5 border-b border-gray-200">{session.session_type}</td>
                    <td className="p-2.5 border-b border-gray-200">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        session.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                        session.status === 'completed' ? 'bg-green-100 text-green-800' :
                        session.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {session.status}
                      </span>
                    </td>
                    <td className="p-2.5 border-b border-gray-200">{formatCurrency(session.amount_owed)}</td>
                    <td className="text-xs text-gray-600 p-2.5 border-b border-gray-200">
                      {session.cancellation_reason || session.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment History */}
      <div className="mb-8">
        <h3>Payment History ({paymentHistory.length})</h3>
        {paymentHistory.length === 0 ? (
          <p className="text-gray-600 italic">No payments recorded yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left border-b-2 border-gray-300 font-semibold">Date</th>
                  <th className="p-3 text-left border-b-2 border-gray-300 font-semibold">Amount</th>
                  <th className="p-3 text-left border-b-2 border-gray-300 font-semibold">Type</th>
                  <th className="p-3 text-left border-b-2 border-gray-300 font-semibold">Method</th>
                  <th className="p-3 text-left border-b-2 border-gray-300 font-semibold">Reference</th>
                  <th className="p-3 text-left border-b-2 border-gray-300 font-semibold">Recorded By</th>
                  <th className="p-3 text-left border-b-2 border-gray-300 font-semibold">Notes</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {paymentHistory.map((payment) => (
                  <tr key={payment.payment_id} className="hover:bg-gray-50">
                    <td className="p-2.5 border-b border-gray-200">{formatDate(payment.payment_date)}</td>
                    <td className="font-bold p-2.5 border-b border-gray-200">{formatCurrency(payment.amount)}</td>
                    <td className="p-2.5 border-b border-gray-200">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        payment.payment_type === 'regular' ? 'bg-blue-100 text-blue-800' :
                        payment.payment_type === 'advance' ? 'bg-purple-100 text-purple-800' :
                        payment.payment_type === 'goodwill' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {payment.payment_type}
                      </span>
                    </td>
                    <td className="p-2.5 border-b border-gray-200">{payment.payment_method}</td>
                    <td className="p-2.5 border-b border-gray-200">{payment.reference || '-'}</td>
                    <td className="p-2.5 border-b border-gray-200">{payment.recorded_by_name}</td>
                    <td className="text-xs text-gray-600 p-2.5 border-b border-gray-200">{payment.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoachPaymentTracking;
