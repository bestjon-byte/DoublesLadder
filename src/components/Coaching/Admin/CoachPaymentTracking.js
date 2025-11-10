import React, { useState, useEffect } from 'react';
import { useCoaching } from '../../../hooks/useCoaching';
import { useToast } from '../../../contexts/ToastContext';
import '../../Ladder/Ladder.css';

/**
 * Coach Payment Tracking Component (Admin Only)
 * Tracks what the club owes the coach for delivered sessions
 */
const CoachPaymentTracking = ({ userId }) => {
  const { actions } = useCoaching(userId, true);
  const { showToast } = useToast();

  const [summary, setSummary] = useState(null);
  const [sessionsToPay, setSessionsToPay] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRecordPayment, setShowRecordPayment] = useState(false);
  const [showGoodwillPayment, setShowGoodwillPayment] = useState(false);
  const [showRateConfig, setShowRateConfig] = useState(false);

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
      const [summaryRes, sessionsRes, historyRes] = await Promise.all([
        actions.getCoachPaymentSummary(),
        actions.getCoachSessionsToPay(),
        actions.getCoachPaymentHistory(),
      ]);

      if (summaryRes.error) throw new Error(summaryRes.error);
      if (sessionsRes.error) throw new Error(sessionsRes.error);
      if (historyRes.error) throw new Error(historyRes.error);

      setSummary(summaryRes.data);
      setSessionsToPay(sessionsRes.data);
      setPaymentHistory(historyRes.data);
    } catch (error) {
      console.error('Error loading coach payment data:', error);
      showToast('Failed to load coach payment data', 'error');
    } finally {
      setLoading(false);
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
      showToast('Failed to record payment', 'error');
      return;
    }

    showToast('Payment recorded successfully', 'success');
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
      showToast('Failed to record goodwill payment', 'error');
      return;
    }

    showToast('Goodwill payment recorded successfully', 'success');
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
      showToast('Failed to update rate', 'error');
      return;
    }

    showToast('Rate updated successfully', 'success');
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

      {/* Summary Cards */}
      <div className="payment-summary-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
        {/* Total Paid */}
        <div className="summary-card" style={{ background: '#e8f5e9', padding: '20px', borderRadius: '8px', border: '2px solid #4caf50' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#2e7d32' }}>Total Paid</h3>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1b5e20' }}>
            {formatCurrency(summary?.total_paid)}
          </div>
          <div style={{ fontSize: '14px', color: '#558b2f', marginTop: '5px' }}>
            Credits available
          </div>
        </div>

        {/* Total Owed */}
        <div className="summary-card" style={{ background: '#fff3e0', padding: '20px', borderRadius: '8px', border: '2px solid #ff9800' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#e65100' }}>Total Owed</h3>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#bf360c' }}>
            {formatCurrency(summary?.total_owed)}
          </div>
          <div style={{ fontSize: '14px', color: '#f57c00', marginTop: '5px' }}>
            {summary?.sessions_to_pay_count || 0} sessions to pay
          </div>
        </div>

        {/* Balance */}
        <div className="summary-card" style={{
          background: summary?.balance >= 0 ? '#e3f2fd' : '#ffebee',
          padding: '20px',
          borderRadius: '8px',
          border: `2px solid ${summary?.balance >= 0 ? '#2196f3' : '#f44336'}`
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: summary?.balance >= 0 ? '#0d47a1' : '#b71c1c' }}>
            Balance
          </h3>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: summary?.balance >= 0 ? '#1565c0' : '#c62828' }}>
            {formatCurrency(summary?.balance)}
          </div>
          <div style={{ fontSize: '14px', color: summary?.balance >= 0 ? '#1976d2' : '#d32f2f', marginTop: '5px' }}>
            {summary?.balance >= 0 ? 'In credit' : 'Amount owed'}
          </div>
        </div>
      </div>

      {/* Session Type Breakdown */}
      {summary && (
        <div className="session-breakdown" style={{ marginBottom: '30px', padding: '15px', background: '#f5f5f5', borderRadius: '8px' }}>
          <h3 style={{ marginTop: 0 }}>Breakdown by Session Type</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
            {summary.adults_sessions_count > 0 && (
              <div style={{ padding: '10px', background: 'white', borderRadius: '4px' }}>
                <strong>Adults:</strong> {formatCurrency(summary.adults_owed)} ({summary.adults_sessions_count} sessions)
              </div>
            )}
            {summary.beginners_sessions_count > 0 && (
              <div style={{ padding: '10px', background: 'white', borderRadius: '4px' }}>
                <strong>Beginners:</strong> {formatCurrency(summary.beginners_owed)} ({summary.beginners_sessions_count} sessions)
              </div>
            )}
            {summary.juniors_sessions_count > 0 && (
              <div style={{ padding: '10px', background: 'white', borderRadius: '4px' }}>
                <strong>Juniors:</strong> {formatCurrency(summary.juniors_owed)} ({summary.juniors_sessions_count} sessions)
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="action-buttons" style={{ marginBottom: '30px', display: 'flex', gap: '10px' }}>
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
        <div className="record-payment-form" style={{ marginBottom: '30px', padding: '20px', background: '#f9f9f9', borderRadius: '8px' }}>
          <h3>Record Payment to Coach</h3>
          <form onSubmit={handleRecordPayment}>
            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
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

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
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

            <div className="form-row" style={{ marginBottom: '15px' }}>
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
        <div className="goodwill-payment-form" style={{ marginBottom: '30px', padding: '20px', background: '#f0f8ff', borderRadius: '8px' }}>
          <h3>Add Goodwill Payment</h3>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
            Record a one-off payment to the coach not tied to specific sessions
          </p>
          <form onSubmit={handleGoodwillPayment}>
            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
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

            <div className="form-row" style={{ marginBottom: '15px' }}>
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
        <div className="rate-config-form" style={{ marginBottom: '30px', padding: '20px', background: '#fff9e6', borderRadius: '8px' }}>
          <h3>Update Coach Payment Rates</h3>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
            Set new payment rates for coaching sessions by type
          </p>
          <form onSubmit={handleUpdateRate}>
            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
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

            <div className="form-row" style={{ marginBottom: '15px' }}>
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
      <div className="sessions-to-pay" style={{ marginBottom: '30px' }}>
        <h3>Sessions Awaiting Payment ({sessionsToPay.length})</h3>
        {sessionsToPay.length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>No sessions awaiting payment</p>
        ) : (
          <div className="sessions-list">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {sessionsToPay.map((session) => (
                  <tr key={session.session_id}>
                    <td>{formatDate(session.session_date)}</td>
                    <td>{session.session_time}</td>
                    <td>{session.session_type}</td>
                    <td>
                      <span className={`status-badge status-${session.status}`}>
                        {session.status}
                      </span>
                    </td>
                    <td>{formatCurrency(session.amount_owed)}</td>
                    <td style={{ fontSize: '12px', color: '#666' }}>
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
      <div className="payment-history">
        <h3>Payment History ({paymentHistory.length})</h3>
        {paymentHistory.length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>No payments recorded yet</p>
        ) : (
          <div className="history-list">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Type</th>
                  <th>Method</th>
                  <th>Reference</th>
                  <th>Recorded By</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {paymentHistory.map((payment) => (
                  <tr key={payment.payment_id}>
                    <td>{formatDate(payment.payment_date)}</td>
                    <td style={{ fontWeight: 'bold' }}>{formatCurrency(payment.amount)}</td>
                    <td>
                      <span className={`type-badge type-${payment.payment_type}`}>
                        {payment.payment_type}
                      </span>
                    </td>
                    <td>{payment.payment_method}</td>
                    <td>{payment.reference || '-'}</td>
                    <td>{payment.recorded_by_name}</td>
                    <td style={{ fontSize: '12px', color: '#666' }}>{payment.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style jsx>{`
        .status-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }
        .status-scheduled {
          background: #e3f2fd;
          color: #1565c0;
        }
        .status-completed {
          background: #e8f5e9;
          color: #2e7d32;
        }
        .status-cancelled {
          background: #ffebee;
          color: #c62828;
        }
        .type-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }
        .type-regular {
          background: #e3f2fd;
          color: #1565c0;
        }
        .type-advance {
          background: #f3e5f5;
          color: #6a1b9a;
        }
        .type-goodwill {
          background: #fff3e0;
          color: #e65100;
        }
        .data-table {
          width: 100%;
          border-collapse: collapse;
        }
        .data-table th {
          background: #f5f5f5;
          padding: 12px;
          text-align: left;
          border-bottom: 2px solid #ddd;
          font-weight: 600;
        }
        .data-table td {
          padding: 10px 12px;
          border-bottom: 1px solid #eee;
        }
        .data-table tr:hover {
          background: #fafafa;
        }
        label {
          display: block;
          margin-bottom: 5px;
          font-weight: 600;
          font-size: 14px;
        }
        input, select, textarea {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }
        .form-actions {
          display: flex;
          gap: 10px;
          margin-top: 15px;
        }
        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.2s;
        }
        .btn-primary {
          background: #2196f3;
          color: white;
        }
        .btn-primary:hover {
          background: #1976d2;
        }
        .btn-secondary {
          background: #757575;
          color: white;
        }
        .btn-secondary:hover {
          background: #616161;
        }
      `}</style>
    </div>
  );
};

export default CoachPaymentTracking;
