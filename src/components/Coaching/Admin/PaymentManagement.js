import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Check, Mail } from 'lucide-react';
import { useAppToast } from '../../../contexts/ToastContext';
import CreatePaymentModal from '../Modals/CreatePaymentModal';
import PaymentDetailsModal from '../Modals/PaymentDetailsModal';
import { LoadingSpinner } from '../../shared/LoadingSpinner';

const PaymentManagement = ({ payments, loading, actions, allUsers, currentUser }) => {
  const { success, error } = useAppToast();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewingPayment, setViewingPayment] = useState(null);
  const [filter, setFilter] = useState('pending'); // 'pending', 'pending_confirmation', 'paid', 'all'
  const [statistics, setStatistics] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const loadStatistics = async () => {
      setLoadingStats(true);
      const result = await actions.getPaymentStatistics();
      if (result.data) {
        setStatistics(result.data);
      }
      setLoadingStats(false);
    };
    loadStatistics();
  }, [payments, actions]);

  const handleMarkPaid = async (payment) => {
    const reference = window.prompt('Enter payment reference (optional):');
    if (reference === null) return;

    const result = await actions.markPaymentReceived(payment.id, reference);
    if (result.error) {
      error('Failed to mark payment as received');
    } else {
      success('Payment marked as received');
    }
  };

  const handleSendReminder = async (payment) => {
    if (!window.confirm(`Send payment reminder to ${payment.player?.name}?`)) return;

    const result = await actions.sendPaymentReminder(payment.id);
    if (result.error) {
      error('Failed to send reminder');
    } else {
      success('Reminder sent successfully');
      // TODO: Actual email sending logic
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const filteredPayments = payments.filter(p => {
    if (filter === 'pending') return p.status === 'pending';
    if (filter === 'pending_confirmation') return p.status === 'pending_confirmation';
    if (filter === 'paid') return p.status === 'paid';
    return true;
  });

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700',
      pending_confirmation: 'bg-blue-100 text-blue-700',
      paid: 'bg-green-100 text-green-700',
      overdue: 'bg-red-100 text-red-700',
      cancelled: 'bg-gray-100 text-gray-700',
    };
    const labels = {
      pending: 'Pending',
      pending_confirmation: 'Awaiting Confirmation',
      paid: 'Paid',
      overdue: 'Overdue',
      cancelled: 'Cancelled',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status] || styles.pending}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Statistics Dashboard */}
      {loadingStats ? (
        <LoadingSpinner />
      ) : statistics && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-yellow-700 font-medium">Amount Owed</p>
              <DollarSign className="w-5 h-5 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-yellow-900">
              £{parseFloat(statistics.total_owed || 0).toFixed(2)}
            </p>
            <p className="text-xs text-yellow-600 mt-1">
              {statistics.pending_count || 0} pending payment{statistics.pending_count !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-blue-700 font-medium">Pending Confirmation</p>
              <Check className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-900">
              £{parseFloat(statistics.total_pending_confirmation || 0).toFixed(2)}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              {statistics.pending_confirmation_count || 0} awaiting confirmation
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-green-700 font-medium">Total Received</p>
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-900">
              £{parseFloat(statistics.total_received || 0).toFixed(2)}
            </p>
            <p className="text-xs text-green-600 mt-1">
              {statistics.paid_count || 0} confirmed payment{statistics.paid_count !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          {[
            { value: 'pending', label: 'Pending' },
            { value: 'pending_confirmation', label: 'To Confirm' },
            { value: 'paid', label: 'Paid' },
            { value: 'all', label: 'All' }
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`
                px-4 py-2 rounded-md font-medium transition-colors
                ${filter === f.value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
              `}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Payment Request
        </button>
      </div>

      {/* Payments List */}
      {filteredPayments.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No {filter !== 'all' && filter} payments found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPayments.map((payment) => (
            <div
              key={payment.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-medium text-gray-900">{payment.player?.name}</span>
                    {getStatusBadge(payment.status)}
                    <span className="text-gray-600">£{payment.amount_due.toFixed(2)}</span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      {payment.total_sessions} session{payment.total_sessions !== 1 ? 's' : ''} •{' '}
                      {new Date(payment.billing_period_start).toLocaleDateString('en-GB')} -{' '}
                      {new Date(payment.billing_period_end).toLocaleDateString('en-GB')}
                    </p>
                    {payment.payment_deadline && (
                      <p>Due: {new Date(payment.payment_deadline).toLocaleDateString('en-GB')}</p>
                    )}
                    {payment.status === 'pending_confirmation' && payment.user_marked_paid_at && (
                      <div className="mt-2 p-2 bg-blue-100 border border-blue-200 rounded">
                        <p className="text-blue-800 font-medium">
                          Player marked as paid: {new Date(payment.user_marked_paid_at).toLocaleDateString('en-GB')}
                        </p>
                        {payment.user_payment_note && (
                          <p className="text-blue-700 mt-1">Note: {payment.user_payment_note}</p>
                        )}
                      </div>
                    )}
                    {payment.reminder_sent_at && (
                      <p className="text-blue-600">
                        Reminder sent {new Date(payment.reminder_sent_at).toLocaleDateString('en-GB')}
                      </p>
                    )}
                    {payment.paid_at && (
                      <p className="text-green-600">
                        Paid {new Date(payment.paid_at).toLocaleDateString('en-GB')}
                        {payment.payment_reference && ` (Ref: ${payment.payment_reference})`}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewingPayment(payment)}
                    className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors text-sm"
                  >
                    View Details
                  </button>
                  {payment.status === 'pending' && (
                    <button
                      onClick={() => handleSendReminder(payment)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="Send reminder"
                    >
                      <Mail className="w-4 h-4" />
                    </button>
                  )}
                  {(payment.status === 'pending' || payment.status === 'pending_confirmation') && (
                    <button
                      onClick={() => handleMarkPaid(payment)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                      title={payment.status === 'pending_confirmation' ? 'Confirm payment received' : 'Mark as paid'}
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreatePaymentModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            actions.fetchPayments();
          }}
          actions={actions}
          allUsers={allUsers}
        />
      )}

      {viewingPayment && (
        <PaymentDetailsModal
          isOpen={!!viewingPayment}
          onClose={() => setViewingPayment(null)}
          payment={viewingPayment}
        />
      )}
    </div>
  );
};

export default PaymentManagement;
