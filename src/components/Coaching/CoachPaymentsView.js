import React, { useState, useEffect } from 'react';
import { PoundSterling, Calendar, TrendingUp, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useCoaching } from '../../hooks/useCoaching';
import { LoadingSpinner } from '../shared/LoadingSpinner';

/**
 * Coach Payments View (Read-only for coaches)
 * Shows sessions run, payments received, and credit balance
 */
const CoachPaymentsView = ({ currentUser }) => {
  const { actions } = useCoaching(currentUser?.id, true);

  const [summary, setSummary] = useState(null);
  const [sessionsToPay, setSessionsToPay] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load data
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, sessionsRes, historyRes] = await Promise.all([
        actions.getCoachPaymentSummary(),
        actions.getCoachSessionsToPay(),
        actions.getCoachPaymentHistory(),
      ]);

      if (summaryRes.error) throw new Error('Failed to load summary');
      if (sessionsRes.error) throw new Error('Failed to load sessions');
      if (historyRes.error) throw new Error('Failed to load payment history');

      setSummary(summaryRes.data);
      setSessionsToPay(sessionsRes.data || []);
      setPaymentHistory(historyRes.data || []);
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

  // Format date short for mobile
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

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-5 text-white">
        <h1 className="text-xl font-bold mb-1">My Payments</h1>
        <p className="text-green-100 text-sm">
          Track your sessions and payment balance
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Credit Balance */}
        <div className={`p-4 rounded-lg border-2 ${
          (summary?.balance || 0) >= 0
            ? 'bg-green-50 border-green-500'
            : 'bg-orange-50 border-orange-500'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <PoundSterling className={`w-5 h-5 ${
              (summary?.balance || 0) >= 0 ? 'text-green-600' : 'text-orange-600'
            }`} />
            <span className={`text-sm font-medium ${
              (summary?.balance || 0) >= 0 ? 'text-green-800' : 'text-orange-800'
            }`}>
              Credit Balance
            </span>
          </div>
          <div className={`text-2xl font-bold ${
            (summary?.balance || 0) >= 0 ? 'text-green-900' : 'text-orange-900'
          }`}>
            {formatCurrency(summary?.balance)}
          </div>
          <div className={`text-xs mt-1 ${
            (summary?.balance || 0) >= 0 ? 'text-green-600' : 'text-orange-600'
          }`}>
            {(summary?.balance || 0) >= 0 ? 'Available credit' : 'Payment due'}
          </div>
        </div>

        {/* Total Paid */}
        <div className="p-4 rounded-lg border border-gray-200 bg-white">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Total Paid</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(summary?.total_paid)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            All time
          </div>
        </div>

        {/* Sessions to Pay */}
        <div className="p-4 rounded-lg border border-gray-200 bg-white">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-orange-500" />
            <span className="text-sm font-medium text-gray-700">Unpaid Sessions</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {summary?.sessions_to_pay_count || 0}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {formatCurrency(summary?.total_owed)} owed
          </div>
        </div>
      </div>

      {/* Session Type Breakdown */}
      {summary && (summary.adults_sessions_count > 0 || summary.beginners_sessions_count > 0 || summary.juniors_sessions_count > 0) && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Breakdown by Session Type
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {summary.adults_sessions_count > 0 && (
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="text-xs text-gray-500 mb-1">Adults</div>
                <div className="font-semibold text-gray-900">{formatCurrency(summary.adults_owed)}</div>
                <div className="text-xs text-gray-400">{summary.adults_sessions_count} sessions</div>
              </div>
            )}
            {summary.beginners_sessions_count > 0 && (
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="text-xs text-gray-500 mb-1">Beginners</div>
                <div className="font-semibold text-gray-900">{formatCurrency(summary.beginners_owed)}</div>
                <div className="text-xs text-gray-400">{summary.beginners_sessions_count} sessions</div>
              </div>
            )}
            {summary.juniors_sessions_count > 0 && (
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="text-xs text-gray-500 mb-1">Juniors</div>
                <div className="font-semibold text-gray-900">{formatCurrency(summary.juniors_owed)}</div>
                <div className="text-xs text-gray-400">{summary.juniors_sessions_count} sessions</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sessions Awaiting Payment */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-orange-500" />
          Sessions Awaiting Payment ({sessionsToPay.length})
        </h3>
        {sessionsToPay.length === 0 ? (
          <div className="bg-green-50 rounded-lg p-6 text-center">
            <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
            <p className="text-green-700 font-medium">All caught up!</p>
            <p className="text-green-600 text-sm">No sessions awaiting payment</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-100">
              {sessionsToPay.slice(0, 10).map((session) => (
                <div key={session.session_id} className="p-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 text-sm">
                      {formatDateShort(session.session_date)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {session.session_type}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      {formatCurrency(session.amount_owed)}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      session.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {session.status}
                    </span>
                  </div>
                </div>
              ))}
              {sessionsToPay.length > 10 && (
                <div className="p-3 text-center text-sm text-gray-500">
                  + {sessionsToPay.length - 10} more sessions
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Recent Payments */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          Recent Payments ({paymentHistory.length})
        </h3>
        {paymentHistory.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <Calendar className="w-10 h-10 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">No payments recorded yet</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-100">
              {paymentHistory.slice(0, 5).map((payment) => (
                <div key={payment.payment_id} className="p-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 text-sm">
                      {formatDate(payment.payment_date)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {payment.payment_method} {payment.reference && `• ${payment.reference}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-green-600">
                      +{formatCurrency(payment.amount)}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      payment.payment_type === 'regular'
                        ? 'bg-blue-100 text-blue-700'
                        : payment.payment_type === 'goodwill'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-gray-100 text-gray-700'
                    }`}>
                      {payment.payment_type}
                    </span>
                  </div>
                </div>
              ))}
              {paymentHistory.length > 5 && (
                <div className="p-3 text-center text-sm text-gray-500">
                  + {paymentHistory.length - 5} older payments
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoachPaymentsView;
