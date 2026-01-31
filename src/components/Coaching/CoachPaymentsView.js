import React, { useState, useEffect } from 'react';
import { PoundSterling, Calendar, TrendingUp, CheckCircle, AlertCircle, CreditCard, Receipt, Settings, FileText, Send, Edit2, Save, X } from 'lucide-react';
import { useCoaching } from '../../hooks/useCoaching';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { useAppToast } from '../../contexts/ToastContext';
import CoachInvoiceModal from './Modals/CoachInvoiceModal';

/**
 * Coach Payments View
 * Shows the coach their payment status, sessions delivered, credit balance,
 * ability to set their rate, and request payment via invoice
 */
const CoachPaymentsView = ({ currentUser }) => {
  const { actions } = useCoaching(currentUser?.id, true);
  const { success: showSuccess, error: showError } = useAppToast();

  const [summary, setSummary] = useState(null);
  const [sessionsDelivered, setSessionsDelivered] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal state
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Rate editing state
  const [editingRate, setEditingRate] = useState(false);
  const [newRate, setNewRate] = useState('');
  const [savingRate, setSavingRate] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, sessionsRes, historyRes, settingsRes, invoicesRes] = await Promise.all([
        actions.getCoachPaymentSummary(),
        actions.getCoachSessionsToPay(),
        actions.getCoachPaymentHistory(),
        actions.getCoachSettings(),
        actions.getCoachInvoices(),
      ]);

      if (summaryRes.error) throw new Error('Failed to load summary');
      if (sessionsRes.error) throw new Error('Failed to load sessions');
      if (historyRes.error) throw new Error('Failed to load payment history');

      setSummary(summaryRes.data);
      setSessionsDelivered(sessionsRes.data || []);
      setPaymentHistory(historyRes.data || []);
      setSettings(settingsRes.data);
      setInvoices(invoicesRes.data || []);
    } catch (err) {
      console.error('Error loading coach payment data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSaveRate = async () => {
    const rate = parseFloat(newRate);
    if (isNaN(rate) || rate <= 0) {
      showError('Please enter a valid rate');
      return;
    }

    setSavingRate(true);
    try {
      const result = await actions.updateCoachSettings({ rate_per_session: rate });
      if (result.error) throw result.error;

      setSettings({ ...settings, rate_per_session: rate });
      setEditingRate(false);
      showSuccess('Rate updated successfully');
    } catch (err) {
      showError(err.message || 'Failed to update rate');
    } finally {
      setSavingRate(false);
    }
  };

  const startEditingRate = () => {
    setNewRate(String(settings?.rate_per_session || 20));
    setEditingRate(true);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateShort = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    });
  };

  if (loading) {
    return (
      <div className="p-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-700">{error}</p>
          <button
            onClick={loadData}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Use rate from settings, fallback to 20
  const sessionRate = settings?.rate_per_session || 20;

  // Calculate key metrics
  const totalReceived = summary?.total_paid || 0;
  const sessionsDeliveredCount = summary?.sessions_to_pay_count || 0;
  const amountEarned = summary?.total_owed || 0;
  const prepaidCredit = summary?.balance || 0;
  const sessionsRemaining = Math.floor(prepaidCredit / sessionRate);

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-5 text-white">
        <h1 className="text-xl font-bold mb-1">My Payments</h1>
        <p className="text-green-100 text-sm">
          Track your sessions and payment balance with the club
        </p>
      </div>

      {/* Main Balance Card with Request Payment Button */}
      <div className={`p-5 rounded-xl border-2 ${
        prepaidCredit >= 0
          ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-400'
          : 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-400'
      }`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-sm font-medium text-gray-600 mb-1">Prepaid Credit</div>
            <div className={`text-3xl font-bold ${prepaidCredit >= 0 ? 'text-green-700' : 'text-orange-700'}`}>
              {formatCurrency(prepaidCredit)}
            </div>
          </div>
          <div className={`p-3 rounded-full ${prepaidCredit >= 0 ? 'bg-green-100' : 'bg-orange-100'}`}>
            <CreditCard className={`w-6 h-6 ${prepaidCredit >= 0 ? 'text-green-600' : 'text-orange-600'}`} />
          </div>
        </div>

        {prepaidCredit >= 0 ? (
          <div className="bg-white/60 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">
                {sessionsRemaining} more session{sessionsRemaining !== 1 ? 's' : ''} covered
              </span>
            </div>
            <p className="text-xs text-green-600 mt-1">
              At £{sessionRate}/session, your credit covers approximately {sessionsRemaining} more sessions.
            </p>
          </div>
        ) : (
          <div className="bg-white/60 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 text-orange-800">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Time to invoice!</span>
            </div>
            <p className="text-xs text-orange-600 mt-1">
              The club owes you {formatCurrency(Math.abs(prepaidCredit))}. Send an invoice to request payment.
            </p>
          </div>
        )}

        {/* Request Payment Button */}
        <button
          onClick={() => setShowInvoiceModal(true)}
          className="w-full py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold flex items-center justify-center gap-2 shadow-md"
        >
          <Send className="w-5 h-5" />
          Request Payment
        </button>
      </div>

      {/* Rate Settings */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Your Session Rate</span>
          </div>
          {editingRate ? (
            <div className="flex items-center gap-2">
              <span className="text-gray-500">£</span>
              <input
                type="number"
                value={newRate}
                onChange={(e) => setNewRate(e.target.value)}
                className="w-20 px-2 py-1 border rounded text-right"
                min="1"
                step="1"
              />
              <button
                onClick={handleSaveRate}
                disabled={savingRate}
                className="p-1 text-green-600 hover:text-green-700"
              >
                <Save className="w-5 h-5" />
              </button>
              <button
                onClick={() => setEditingRate(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-gray-900">£{sessionRate}/session</span>
              <button
                onClick={startEditingRate}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Total Received */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <PoundSterling className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-medium text-gray-500">Total Received</span>
          </div>
          <div className="text-xl font-bold text-gray-900">
            {formatCurrency(totalReceived)}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            All payments from club
          </div>
        </div>

        {/* Sessions Delivered */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Receipt className="w-4 h-4 text-purple-500" />
            <span className="text-xs font-medium text-gray-500">Sessions Delivered</span>
          </div>
          <div className="text-xl font-bold text-gray-900">
            {sessionsDeliveredCount}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Worth {formatCurrency(amountEarned)}
          </div>
        </div>
      </div>

      {/* Invoice History */}
      {invoices.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-green-500" />
            Your Invoices
          </h3>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
              {invoices.slice(0, 10).map((invoice) => (
                <div key={invoice.id} className="p-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 text-sm">
                      Invoice #{String(invoice.invoice_number).padStart(2, '0')}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(invoice.invoice_date)} • {invoice.sessions_count} sessions
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      {formatCurrency(invoice.total_amount)}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      invoice.status === 'paid'
                        ? 'bg-green-100 text-green-700'
                        : invoice.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {invoice.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Breakdown by Type */}
      {summary && (summary.adults_sessions_count > 0 || summary.beginners_sessions_count > 0 || summary.juniors_sessions_count > 0) && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Sessions by Type
          </h3>
          <div className="space-y-2">
            {summary.adults_sessions_count > 0 && (
              <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  <span className="text-sm text-gray-700">Adults</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-gray-900">{summary.adults_sessions_count}</span>
                  <span className="text-xs text-gray-400 ml-2">({formatCurrency(summary.adults_owed)})</span>
                </div>
              </div>
            )}
            {summary.beginners_sessions_count > 0 && (
              <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  <span className="text-sm text-gray-700">Beginners</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-gray-900">{summary.beginners_sessions_count}</span>
                  <span className="text-xs text-gray-400 ml-2">({formatCurrency(summary.beginners_owed)})</span>
                </div>
              </div>
            )}
            {summary.juniors_sessions_count > 0 && (
              <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  <span className="text-sm text-gray-700">Juniors</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-gray-900">{summary.juniors_sessions_count}</span>
                  <span className="text-xs text-gray-400 ml-2">({formatCurrency(summary.juniors_owed)})</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Sessions Delivered */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          Recent Sessions Delivered
        </h3>
        {sessionsDelivered.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <Calendar className="w-10 h-10 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">No sessions delivered yet</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
              {sessionsDelivered.slice(0, 20).map((session) => (
                <div key={session.session_id} className="p-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 text-sm">
                      {formatDateShort(session.session_date)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {session.session_type}
                    </div>
                  </div>
                  <div className="font-medium text-gray-700">
                    {formatCurrency(session.amount_owed)}
                  </div>
                </div>
              ))}
            </div>
            {sessionsDelivered.length > 0 && (
              <div className="p-2 bg-gray-50 border-t text-center text-xs text-gray-500">
                Showing {Math.min(20, sessionsDelivered.length)} of {sessionsDelivered.length} sessions
              </div>
            )}
          </div>
        )}
      </div>

      {/* Payment History */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <PoundSterling className="w-4 h-4 text-green-500" />
          Payments Received from Club
        </h3>
        {paymentHistory.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <PoundSterling className="w-10 h-10 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">No payments recorded yet</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
              {paymentHistory.map((payment) => (
                <div key={payment.payment_id} className="p-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 text-sm">
                      {formatDate(payment.payment_date)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {payment.reference || payment.payment_method}
                    </div>
                  </div>
                  <div className="font-semibold text-green-600">
                    +{formatCurrency(payment.amount)}
                  </div>
                </div>
              ))}
            </div>
            {paymentHistory.length > 0 && (
              <div className="p-2 bg-gray-50 border-t text-center text-xs text-gray-500">
                {paymentHistory.length} payment{paymentHistory.length !== 1 ? 's' : ''} totalling {formatCurrency(totalReceived)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
        <h4 className="text-sm font-semibold text-blue-800 mb-2">How it works</h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• The club pays you in advance for blocks of sessions</li>
          <li>• Each session you deliver (£{sessionRate}) is deducted from your credit</li>
          <li>• When credit runs low, click "Request Payment" to send an invoice</li>
          <li>• The admin will receive your invoice and process the payment</li>
        </ul>
      </div>

      {/* Invoice Modal */}
      <CoachInvoiceModal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        onSuccess={loadData}
        actions={actions}
        summary={summary}
        settings={settings}
      />
    </div>
  );
};

export default CoachPaymentsView;
