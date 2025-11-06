import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, XCircle, DollarSign, Clock } from 'lucide-react';
import { useCoaching } from '../../hooks/useCoaching';
import { useAppToast } from '../../contexts/ToastContext';
import { LoadingSpinner } from '../shared/LoadingSpinner';

const CoachingUserTab = ({ currentUser }) => {
  const coaching = useCoaching(currentUser?.id, false);
  const { success, error } = useAppToast();
  const [activeTab, setActiveTab] = useState('sessions'); // 'sessions', 'payments'
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  useEffect(() => {
    if (currentUser?.id) {
      coaching.actions.checkUserAccess().then(result => {
        setHasAccess(result.hasAccess);
        setCheckingAccess(false);
      });
    }
  }, [currentUser]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRegister = async (session) => {
    const result = await coaching.actions.markAttendance(session.id, currentUser.id, true);
    if (result.error) {
      if (result.error.message?.includes('duplicate')) {
        error('You are already registered for this session');
      } else {
        error('Failed to register for session');
      }
    } else {
      success('Successfully registered for session');
      coaching.actions.fetchSessions({ status: 'scheduled' });
      coaching.actions.fetchAttendance({ playerId: currentUser.id });
    }
  };

  const handleUnregister = async (attendanceId) => {
    if (!window.confirm('Cancel your registration for this session?')) return;

    const result = await coaching.actions.removeAttendance(attendanceId);
    if (result.error) {
      error('Failed to cancel registration');
    } else {
      success('Registration cancelled');
      coaching.actions.fetchSessions({ status: 'scheduled' });
      coaching.actions.fetchAttendance({ playerId: currentUser.id });
    }
  };

  const handleMarkPaid = async (payment) => {
    const note = window.prompt(
      'Enter payment reference or note (optional):\n\nFor example: "Bank transfer on ' + new Date().toLocaleDateString('en-GB') + '"'
    );
    if (note === null) return; // User cancelled

    const result = await coaching.actions.userMarkPaymentPaid(payment.id, note || '');
    if (result.error) {
      error('Failed to mark payment as paid');
    } else {
      success('Payment marked as paid - awaiting admin confirmation');
      coaching.actions.fetchPayments({ playerId: currentUser.id });
    }
  };

  if (checkingAccess) {
    return <LoadingSpinner />;
  }

  if (!hasAccess) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Coaching Access Required</h2>
        <p className="text-gray-600 mb-4">
          You don't have access to coaching sessions yet.
        </p>
        <p className="text-sm text-gray-500">
          Please contact an administrator if you'd like to join coaching sessions.
        </p>
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const upcomingSessions = coaching.sessions.filter(s =>
    s.session_date >= today && s.status === 'scheduled'
  ).sort((a, b) => new Date(a.session_date) - new Date(b.session_date));

  const myAttendance = coaching.attendance.filter(a => a.player_id === currentUser.id);
  const myAttendanceMap = new Map(myAttendance.map(a => [a.session_id, a]));

  const myPayments = coaching.payments
    .filter(p => p.player_id === currentUser.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // Calculate payment totals
  const totalOwed = myPayments
    .filter(p => p.status === 'pending' || p.status === 'pending_confirmation')
    .reduce((sum, p) => sum + parseFloat(p.amount_due), 0);
  const totalPaid = myPayments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + parseFloat(p.amount_due), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Coaching Sessions</h2>
        <p className="text-gray-600">View upcoming sessions and manage your attendance</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('sessions')}
            className={`
              flex items-center gap-2 px-6 py-4 font-medium transition-colors
              ${activeTab === 'sessions'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }
            `}
          >
            <Calendar className="w-5 h-5" />
            Upcoming Sessions
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`
              flex items-center gap-2 px-6 py-4 font-medium transition-colors
              ${activeTab === 'payments'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }
            `}
          >
            <DollarSign className="w-5 h-5" />
            Payments
            {myPayments.filter(p => p.status === 'pending').length > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {myPayments.filter(p => p.status === 'pending').length}
              </span>
            )}
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'sessions' ? (
            <div className="space-y-4">
              {coaching.loading.sessions ? (
                <LoadingSpinner />
              ) : upcomingSessions.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No upcoming sessions scheduled</p>
                </div>
              ) : (
                upcomingSessions.map((session) => {
                  const myAttendanceRecord = myAttendanceMap.get(session.id);
                  const isRegistered = !!myAttendanceRecord;

                  return (
                    <div
                      key={session.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`
                              px-3 py-1 rounded-full text-sm font-medium
                              ${session.session_type === 'Adults'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-green-100 text-green-700'
                              }
                            `}>
                              {session.session_type}
                            </span>
                            <span className="text-gray-900 font-medium">
                              {new Date(session.session_date).toLocaleDateString('en-GB', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span>{session.session_time}</span>
                          </div>
                          {session.notes && (
                            <p className="text-sm text-gray-500 mt-2">{session.notes}</p>
                          )}
                        </div>
                        <div>
                          {isRegistered ? (
                            <button
                              onClick={() => handleUnregister(myAttendanceRecord.id)}
                              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors"
                            >
                              <XCircle className="w-4 h-4" />
                              Cancel Registration
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRegister(session)}
                              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Register
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {coaching.loading.payments ? (
                <LoadingSpinner />
              ) : myPayments.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No payment requests yet</p>
                </div>
              ) : (
                <>
                  {/* Payment Summary */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-700 font-medium mb-1">Amount Owed</p>
                      <p className="text-2xl font-bold text-yellow-900">£{totalOwed.toFixed(2)}</p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm text-green-700 font-medium mb-1">Total Paid</p>
                      <p className="text-2xl font-bold text-green-900">£{totalPaid.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Payment List */}
                  <div className="space-y-4">
                    {myPayments.map((payment) => {
                      const getStatusBadge = () => {
                        const statusConfig = {
                          pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' },
                          pending_confirmation: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Awaiting Confirmation' },
                          paid: { bg: 'bg-green-100', text: 'text-green-700', label: 'Paid' },
                        };
                        const config = statusConfig[payment.status] || statusConfig.pending;
                        return (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${config.bg} ${config.text}`}>
                            {config.label}
                          </span>
                        );
                      };

                      return (
                        <div
                          key={payment.id}
                          className={`
                            border rounded-lg p-4
                            ${payment.status === 'pending' ? 'bg-yellow-50 border-yellow-200' : ''}
                            ${payment.status === 'pending_confirmation' ? 'bg-blue-50 border-blue-200' : ''}
                            ${payment.status === 'paid' ? 'bg-white border-gray-200' : ''}
                          `}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-lg font-semibold text-gray-900">
                                  £{payment.amount_due.toFixed(2)}
                                </span>
                                {getStatusBadge()}
                              </div>
                              <p className="text-sm text-gray-600">
                                {payment.total_sessions} session{payment.total_sessions !== 1 ? 's' : ''} •{' '}
                                {new Date(payment.billing_period_start).toLocaleDateString('en-GB')} -{' '}
                                {new Date(payment.billing_period_end).toLocaleDateString('en-GB')}
                              </p>
                            </div>
                          </div>

                          {payment.payment_deadline && (payment.status === 'pending' || payment.status === 'pending_confirmation') && (
                            <p className="text-sm text-gray-700 mb-2">
                              <span className="font-medium">Due:</span> {new Date(payment.payment_deadline).toLocaleDateString('en-GB')}
                            </p>
                          )}

                          {payment.status === 'pending_confirmation' && payment.user_marked_paid_at && (
                            <div className="mb-2 p-2 bg-blue-100 border border-blue-200 rounded">
                              <p className="text-sm text-blue-800">
                                <span className="font-medium">You marked as paid:</span> {new Date(payment.user_marked_paid_at).toLocaleDateString('en-GB')}
                              </p>
                              {payment.user_payment_note && (
                                <p className="text-sm text-blue-700 mt-1">Note: {payment.user_payment_note}</p>
                              )}
                              <p className="text-xs text-blue-600 mt-1">Awaiting admin confirmation</p>
                            </div>
                          )}

                          {payment.paid_at && payment.status === 'paid' && (
                            <p className="text-sm text-green-600">
                              Confirmed paid {new Date(payment.paid_at).toLocaleDateString('en-GB')}
                            </p>
                          )}

                          {payment.status === 'pending' && (
                            <div className="mt-3 pt-3 border-t border-yellow-200">
                              <p className="text-sm text-gray-700 mb-3">
                                Please transfer payment to the club bank account and include your name as reference.
                              </p>
                              <button
                                onClick={() => handleMarkPaid(payment)}
                                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                              >
                                Mark as Paid
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoachingUserTab;
