import React, { useState, useEffect } from 'react';
import { Mail, X, AlertCircle, CheckCircle } from 'lucide-react';
import { useAppToast } from '../../../contexts/ToastContext';

/**
 * SendReminderModal - Admin modal for sending payment reminder emails
 * Features:
 * - Filter by: all outstanding, amount threshold, age threshold
 * - Preview recipients before sending
 * - Shows payment details for each recipient
 */
const SendReminderModal = ({ isOpen, onClose, actions }) => {
  const { success: showToast, error: showError } = useAppToast();

  const [filterType, setFilterType] = useState('all');
  const [amountThreshold, setAmountThreshold] = useState('20');
  const [ageThreshold, setAgeThreshold] = useState('7');
  const [previewData, setPreviewData] = useState(null);
  const [selectedRecipients, setSelectedRecipients] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Load preview when filter changes
  useEffect(() => {
    if (isOpen) {
      loadPreview();
    }
  }, [isOpen, filterType, amountThreshold, ageThreshold]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadPreview = async () => {
    setLoading(true);
    try {
      const threshold = filterType === 'amount_threshold'
        ? parseFloat(amountThreshold)
        : filterType === 'age_threshold'
        ? parseInt(ageThreshold)
        : null;

      const result = await actions.getPaymentsForReminder(filterType, threshold);

      if (result.error) {
        throw new Error(result.error);
      }

      const data = result.data || [];
      setPreviewData(data);

      // Auto-select all recipients by default
      setSelectedRecipients(new Set(data.map(p => p.payment_id)));
    } catch (error) {
      console.error('Error loading preview:', error);
      showError('Failed to load preview data');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    setSelectedRecipients(new Set(previewData.map(p => p.payment_id)));
  };

  const handleDeselectAll = () => {
    setSelectedRecipients(new Set());
  };

  const handleToggleRecipient = (paymentId) => {
    const newSelected = new Set(selectedRecipients);
    if (newSelected.has(paymentId)) {
      newSelected.delete(paymentId);
    } else {
      newSelected.add(paymentId);
    }
    setSelectedRecipients(newSelected);
  };

  const handleSend = async () => {
    if (!previewData || previewData.length === 0) {
      showError('No recipients to send to');
      return;
    }

    if (selectedRecipients.size === 0) {
      showError('Please select at least one recipient');
      return;
    }

    const confirmMsg = `Send payment reminders to ${selectedRecipients.size} selected player(s)?`;
    if (!window.confirm(confirmMsg)) return;

    setSending(true);
    try {
      const threshold = filterType === 'amount_threshold'
        ? parseFloat(amountThreshold)
        : filterType === 'age_threshold'
        ? parseInt(ageThreshold)
        : null;

      // Filter to only selected recipients
      const selectedPayments = previewData.filter(p => selectedRecipients.has(p.payment_id));

      const result = await actions.sendPaymentReminders(filterType, threshold, selectedPayments);

      if (result.error) {
        throw new Error(result.error);
      }

      showToast(`Successfully sent ${result.data.sent} reminder(s)`);

      if (result.data.failed > 0) {
        const errorDetails = result.data.errors && result.data.errors.length > 0
          ? result.data.errors.map(e => `${e.player}: ${e.error}`).join('\n')
          : 'Unknown error';
        showError(`${result.data.failed} email(s) failed to send:\n\n${errorDetails}`);
      }

      onClose();
    } catch (error) {
      console.error('Error sending reminders:', error);
      showError('Failed to send reminders: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount || 0);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '90vh', overflow: 'auto' }}>
        {/* Header */}
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Mail className="w-6 h-6 text-blue-600" />
            <h2 style={{ margin: 0 }}>Send Payment Reminders</h2>
          </div>
          <button onClick={onClose} className="icon-button">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Selection */}
        <div style={{ marginBottom: '25px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px' }}>Select Recipients</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {/* All Outstanding */}
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', padding: '12px', backgroundColor: 'white', borderRadius: '6px', border: filterType === 'all' ? '2px solid #3182ce' : '1px solid #ddd' }}>
              <input
                type="radio"
                name="filterType"
                value="all"
                checked={filterType === 'all'}
                onChange={(e) => setFilterType(e.target.value)}
                style={{ marginTop: '3px' }}
              />
              <div>
                <strong>All Outstanding Payments</strong>
                <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#666' }}>
                  Send to everyone with pending payments
                </p>
              </div>
            </label>

            {/* Amount Threshold */}
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', padding: '12px', backgroundColor: 'white', borderRadius: '6px', border: filterType === 'amount_threshold' ? '2px solid #3182ce' : '1px solid #ddd' }}>
              <input
                type="radio"
                name="filterType"
                value="amount_threshold"
                checked={filterType === 'amount_threshold'}
                onChange={(e) => setFilterType(e.target.value)}
                style={{ marginTop: '3px' }}
              />
              <div style={{ flex: 1 }}>
                <strong>Amount Threshold</strong>
                <p style={{ margin: '5px 0 8px 0', fontSize: '14px', color: '#666' }}>
                  Send to players owing more than a specific amount
                </p>
                {filterType === 'amount_threshold' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>£</span>
                    <input
                      type="number"
                      value={amountThreshold}
                      onChange={(e) => setAmountThreshold(e.target.value)}
                      min="0"
                      step="1"
                      style={{ width: '100px', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span style={{ fontSize: '14px', color: '#666' }}>or more</span>
                  </div>
                )}
              </div>
            </label>

            {/* Age Threshold */}
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', padding: '12px', backgroundColor: 'white', borderRadius: '6px', border: filterType === 'age_threshold' ? '2px solid #3182ce' : '1px solid #ddd' }}>
              <input
                type="radio"
                name="filterType"
                value="age_threshold"
                checked={filterType === 'age_threshold'}
                onChange={(e) => setFilterType(e.target.value)}
                style={{ marginTop: '3px' }}
              />
              <div style={{ flex: 1 }}>
                <strong>Age Threshold</strong>
                <p style={{ margin: '5px 0 8px 0', fontSize: '14px', color: '#666' }}>
                  Send to players with payments older than a specific time
                </p>
                {filterType === 'age_threshold' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="number"
                      value={ageThreshold}
                      onChange={(e) => setAgeThreshold(e.target.value)}
                      min="1"
                      step="1"
                      style={{ width: '100px', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span style={{ fontSize: '14px', color: '#666' }}>days or older</span>
                  </div>
                )}
              </div>
            </label>
          </div>
        </div>

        {/* Preview Section */}
        <div style={{ marginBottom: '25px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <div>
              <h3 style={{ margin: '0 0 8px 0' }}>Preview Recipients ({previewData?.length || 0})</h3>
              {previewData && previewData.length > 0 && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={handleSelectAll}
                    className="btn btn-sm"
                    style={{ padding: '4px 8px', fontSize: '12px', background: '#e5e7eb', color: '#374151' }}
                  >
                    Select All ({previewData.length})
                  </button>
                  <button
                    onClick={handleDeselectAll}
                    className="btn btn-sm"
                    style={{ padding: '4px 8px', fontSize: '12px', background: '#e5e7eb', color: '#374151' }}
                  >
                    Deselect All
                  </button>
                  <span style={{ fontSize: '13px', color: '#6b7280', alignSelf: 'center', marginLeft: '8px' }}>
                    {selectedRecipients.size} selected
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={loadPreview}
              disabled={loading}
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '14px' }}
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              Loading preview...
            </div>
          ) : !previewData || previewData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p style={{ color: '#666', margin: 0 }}>No players match the selected criteria</p>
            </div>
          ) : (
            <div style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden', maxHeight: '400px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#f8f9fa', position: 'sticky', top: 0 }}>
                  <tr>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #ddd', fontSize: '14px', fontWeight: '600', width: '50px' }}>
                      <input
                        type="checkbox"
                        checked={previewData.length > 0 && selectedRecipients.size === previewData.length}
                        onChange={(e) => e.target.checked ? handleSelectAll() : handleDeselectAll()}
                        style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                      />
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd', fontSize: '14px', fontWeight: '600' }}>Player</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #ddd', fontSize: '14px', fontWeight: '600' }}>Amount</th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #ddd', fontSize: '14px', fontWeight: '600' }}>Sessions</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd', fontSize: '14px', fontWeight: '600' }}>Period</th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #ddd', fontSize: '14px', fontWeight: '600' }}>Days Old</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((payment, index) => (
                    <tr key={payment.payment_id} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb' }}>
                      <td style={{ padding: '12px', borderBottom: '1px solid #eee', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selectedRecipients.has(payment.payment_id)}
                          onChange={() => handleToggleRecipient(payment.payment_id)}
                          style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                        />
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                        <div style={{ fontWeight: '500' }}>{payment.player_name}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>{payment.player_email}</div>
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #eee', textAlign: 'right', fontWeight: '600', color: '#d97706' }}>
                        {formatCurrency(payment.amount_due)}
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #eee', textAlign: 'center' }}>
                        {payment.total_sessions}
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #eee', fontSize: '13px' }}>
                        {formatDate(payment.billing_period_start)} - {formatDate(payment.billing_period_end)}
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #eee', textAlign: 'center' }}>
                        <span style={{
                          padding: '4px 8px',
                          backgroundColor: payment.days_outstanding > 14 ? '#fee2e2' : '#fef3c7',
                          color: payment.days_outstanding > 14 ? '#991b1b' : '#92400e',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {payment.days_outstanding} days
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div style={{ padding: '15px', backgroundColor: '#e6f3ff', border: '1px solid #3182ce', borderRadius: '6px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <AlertCircle className="w-5 h-5 text-blue-700 flex-shrink-0" style={{ marginTop: '2px' }} />
            <div style={{ fontSize: '14px', color: '#1e40af' }}>
              <p style={{ margin: '0 0 8px 0', fontWeight: '600' }}>Email will include:</p>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li>Payment amount and session details</li>
                <li>Bank transfer instructions (Sort Code: 05-07-62, Account: 25134464)</li>
                <li>One-click "I've paid" confirmation link (no login required)</li>
                <li>Alternative link to log into the app</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '20px', borderTop: '1px solid #ddd' }}>
          <button
            onClick={onClose}
            disabled={sending}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || loading || !previewData || previewData.length === 0 || selectedRecipients.size === 0}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {sending ? (
              <>Sending...</>
            ) : (
              <>
                <Mail className="w-4 h-4" />
                Send {selectedRecipients.size} Selected Reminder{selectedRecipients.size !== 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }
        .modal-content {
          background: white;
          border-radius: 12px;
          padding: 30px;
          width: 100%;
        }
        .icon-button {
          background: none;
          border: none;
          cursor: pointer;
          padding: 5px;
          border-radius: 4px;
          transition: background-color 0.2s;
        }
        .icon-button:hover {
          background-color: #f3f4f6;
        }
        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.2s;
        }
        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .btn-primary {
          background-color: #3182ce;
          color: white;
        }
        .btn-primary:hover:not(:disabled) {
          background-color: #2563eb;
        }
        .btn-secondary {
          background-color: #e5e7eb;
          color: #374151;
        }
        .btn-secondary:hover:not(:disabled) {
          background-color: #d1d5db;
        }
      `}</style>
    </div>
  );
};

export default SendReminderModal;
