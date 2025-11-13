import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, XCircle, PoundSterling, Clock, CheckSquare, Square } from 'lucide-react';
import { useCoaching } from '../../hooks/useCoaching';
import { useAppToast } from '../../contexts/ToastContext';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { formatDateResponsive, formatDateShort } from '../../utils/dateFormatting';
import { formatTime, getSessionTypeColors } from '../../utils/timeFormatter';

const CoachingUserTab = ({ currentUser }) => {
  const coaching = useCoaching(currentUser?.id, false);
  const { success, error } = useAppToast();
  const [activeTab, setActiveTab] = useState('sessions'); // 'sessions', 'payments'
  const [paymentSummary, setPaymentSummary] = useState(null);
  const [mySessions, setMySessions] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [selectedSessions, setSelectedSessions] = useState([]);

  useEffect(() => {
    if (activeTab === 'payments' && currentUser?.id) {
      loadPaymentData();
    }
  }, [activeTab, currentUser]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadPaymentData = async () => {
    setLoadingPayments(true);
    const [summaryResult, sessionsResult] = await Promise.all([
      coaching.actions.getPlayerPaymentSummary(currentUser.id),
      coaching.actions.getPlayerSessionsByPaymentStatus(currentUser.id)
    ]);

    if (summaryResult.data) {
      setPaymentSummary(summaryResult.data);
    }
    if (sessionsResult.data) {
      setMySessions(sessionsResult.data);
    }
    setLoadingPayments(false);
  };

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

  const handleMarkSessionsPaid = async () => {
    if (selectedSessions.length === 0) {
      error('Please select sessions to mark as paid');
      return;
    }

    const note = window.prompt(
      `Mark ${selectedSessions.length} session(s) as paid?\n\n` +
      `Total: £${(selectedSessions.length * 4).toFixed(2)}\n\n` +
      `Enter payment reference or note (optional):\n` +
      `For example: "Bank transfer on ${new Date().toLocaleDateString('en-GB')}"`
    );

    if (note === null) return; // User cancelled

    const result = await coaching.actions.playerMarkSessionsPaid(selectedSessions, note || '');
    if (result.error) {
      error('Failed to mark sessions as paid');
    } else {
      success(`Marked ${selectedSessions.length} session(s) as paid - awaiting admin confirmation`);
      setSelectedSessions([]);
      await loadPaymentData();
    }
  };

  const toggleSession = (attendanceId) => {
    setSelectedSessions(prev =>
      prev.includes(attendanceId)
        ? prev.filter(id => id !== attendanceId)
        : [...prev, attendanceId]
    );
  };

  const toggleAllUnpaid = () => {
    const unpaidSessions = mySessions.filter(s => s.payment_status === 'unpaid');
    const allUnpaidSelected = unpaidSessions.every(s => selectedSessions.includes(s.attendance_id));

    if (allUnpaidSelected) {
      setSelectedSessions(prev => prev.filter(id => !unpaidSessions.find(s => s.attendance_id === id)));
    } else {
      setSelectedSessions(prev => [...new Set([...prev, ...unpaidSessions.map(s => s.attendance_id)])]);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const myAttendance = coaching.attendance.filter(a => a.player_id === currentUser.id);
  const myAttendanceMap = new Map(myAttendance.map(a => [a.session_id, a]));

  // Get all sessions where user has attendance records
  const mySessionIds = new Set(myAttendance.map(a => a.session_id));
  const myInvolvedSessions = coaching.sessions.filter(s => mySessionIds.has(s.id));

  // Filter sessions based on selected filter
  const filteredSessions = myInvolvedSessions.filter(session => {
    if (sessionFilter === 'upcoming') {
      return session.session_date >= today && session.status === 'scheduled';
    } else if (sessionFilter === 'past') {
      return session.session_date < today || session.status === 'completed';
    } else if (sessionFilter === 'cancelled') {
      return session.status === 'cancelled';
    }
    return true; // 'all'
  }).sort((a, b) => {
    // Upcoming: sort oldest to newest, Past/Cancelled/All: sort newest to oldest
    if (sessionFilter === 'upcoming') {
      return new Date(a.session_date) - new Date(b.session_date);
    } else {
      return new Date(b.session_date) - new Date(a.session_date);
    }
  });

  // For registration - show all upcoming sessions (not just the ones user is registered for)
  const upcomingSessionsForRegistration = coaching.sessions.filter(s =>
    s.session_date >= today && s.status === 'scheduled'
  ).sort((a, b) => new Date(a.session_date) - new Date(b.session_date));

  const unpaidSessions = mySessions.filter(s => s.payment_status === 'unpaid');
  const pendingConfirmationSessions = mySessions.filter(s => s.payment_status === 'pending_confirmation');
  const paidSessions = mySessions.filter(s => s.payment_status === 'paid');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Coaching Sessions</h2>
        <p className="text-gray-600">View upcoming sessions and manage your attendance and payments</p>
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
            Sessions
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
            <PoundSterling className="w-5 h-5" />
            Payments
            {paymentSummary && paymentSummary.unpaid_sessions > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {paymentSummary.unpaid_sessions}
              </span>
            )}
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'sessions' ? (
            <div className="space-y-4">
              {/* Session Filters */}
              <div className="flex flex-wrap gap-2">
                {['upcoming', 'past', 'cancelled', 'all'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setSessionFilter(filter)}
                    className={`
                      px-3 sm:px-4 py-2 rounded-md text-sm sm:text-base font-medium transition-colors
                      ${sessionFilter === filter
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }
                    `}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>

              {coaching.loading.sessions ? (
                <LoadingSpinner />
              ) : (
                <>
                  {/* Show registration section only for upcoming filter */}
                  {sessionFilter === 'upcoming' && upcomingSessionsForRegistration.length === 0 && (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">No upcoming sessions scheduled</p>
                    </div>
                  )}

                  {sessionFilter === 'upcoming' && upcomingSessionsForRegistration.length > 0 && (
                    <div className="space-y-3">
                      {upcomingSessionsForRegistration.map((session) => {
                        const myAttendanceRecord = myAttendanceMap.get(session.id);
                        const isRegistered = !!myAttendanceRecord;

                        const colors = getSessionTypeColors(session.session_type);
                        return (
                          <div
                            key={session.id}
                            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors.bg} ${colors.text}`}>
                                    {session.session_type}
                                  </span>
                                  {isRegistered && (
                                    <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                                      Registered
                                    </span>
                                  )}
                                  {/* Responsive date display */}
                                  <span className="hidden md:inline text-gray-900 font-medium">
                                    {formatDateResponsive(session.session_date, false)}
                                  </span>
                                  <span className="md:hidden text-gray-900 font-medium">
                                    {formatDateResponsive(session.session_date, true)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Clock className="w-4 h-4" />
                                  <span>{formatTime(session.session_time)}</span>
                                </div>
                                {session.notes && (
                                  <p className="text-sm text-gray-500 mt-2">{session.notes}</p>
                                )}
                              </div>
                              <div>
                                {isRegistered ? (
                                  <button
                                    onClick={() => handleUnregister(myAttendanceRecord.id)}
                                    className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors whitespace-nowrap"
                                  >
                                    <XCircle className="w-4 h-4 flex-shrink-0" />
                                    <span className="hidden sm:inline">Cancel Registration</span>
                                    <span className="sm:hidden">Cancel</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleRegister(session)}
                                    className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    Register
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Show filtered sessions (user's attendance history) */}
                  {sessionFilter !== 'upcoming' && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        {sessionFilter === 'all' ? 'All' : sessionFilter.charAt(0).toUpperCase() + sessionFilter.slice(1)} Sessions
                      </h3>
                      {filteredSessions.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-lg">
                          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-600">
                            No {sessionFilter !== 'all' && sessionFilter} sessions found
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {filteredSessions.map((session) => {
                            const myAttendanceRecord = myAttendanceMap.get(session.id);
                            const colors = getSessionTypeColors(session.session_type);
                            const getStatusBadge = (status) => {
                              const styles = {
                                scheduled: 'bg-blue-100 text-blue-700',
                                completed: 'bg-green-100 text-green-700',
                                cancelled: 'bg-red-100 text-red-700',
                              };
                              return (
                                <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
                                  {status.charAt(0).toUpperCase() + status.slice(1)}
                                </span>
                              );
                            };

                            return (
                              <div
                                key={session.id}
                                className="bg-white border border-gray-200 rounded-lg p-4"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors.bg} ${colors.text}`}>
                                        {session.session_type}
                                      </span>
                                      {getStatusBadge(session.status)}
                                      <span className="text-gray-900 font-medium">
                                        {formatDateShort(session.session_date)}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-600">
                                      <Clock className="w-4 h-4" />
                                      <span>{formatTime(session.session_time)}</span>
                                    </div>
                                    {session.notes && (
                                      <p className="text-sm text-gray-500 mt-2">{session.notes}</p>
                                    )}
                                    {session.status === 'cancelled' && session.cancellation_reason && (
                                      <p className="text-sm text-red-600 mt-2">
                                        Cancelled: {session.cancellation_reason}
                                      </p>
                                    )}
                                    {myAttendanceRecord?.payment_status && (
                                      <div className="mt-2">
                                        {myAttendanceRecord.payment_status === 'unpaid' && (
                                          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">Unpaid</span>
                                        )}
                                        {myAttendanceRecord.payment_status === 'pending_confirmation' && (
                                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Payment Pending</span>
                                        )}
                                        {myAttendanceRecord.payment_status === 'paid' && (
                                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Paid</span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {loadingPayments ? (
                <LoadingSpinner />
              ) : !paymentSummary ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <PoundSterling className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No coaching sessions found</p>
                </div>
              ) : (
                <>
                  {/* Payment Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-700 font-medium mb-1">Amount Owed</p>
                      <p className="text-2xl font-bold text-yellow-900">£{parseFloat(paymentSummary.amount_owed || 0).toFixed(2)}</p>
                      <p className="text-xs text-yellow-600 mt-1">{paymentSummary.unpaid_sessions} unpaid session{paymentSummary.unpaid_sessions !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-700 font-medium mb-1">Awaiting Confirmation</p>
                      <p className="text-2xl font-bold text-blue-900">£{parseFloat(paymentSummary.amount_pending_confirmation || 0).toFixed(2)}</p>
                      <p className="text-xs text-blue-600 mt-1">{paymentSummary.pending_confirmation_sessions} session{paymentSummary.pending_confirmation_sessions !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm text-green-700 font-medium mb-1">Total Paid</p>
                      <p className="text-2xl font-bold text-green-900">£{parseFloat(paymentSummary.amount_paid || 0).toFixed(2)}</p>
                      <p className="text-xs text-green-600 mt-1">{paymentSummary.paid_sessions} confirmed session{paymentSummary.paid_sessions !== 1 ? 's' : ''}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {selectedSessions.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
                      <p className="text-sm text-blue-700">
                        {selectedSessions.length} session{selectedSessions.length !== 1 ? 's' : ''} selected (£{(selectedSessions.length * 4).toFixed(2)})
                      </p>
                      <button
                        onClick={handleMarkSessionsPaid}
                        className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap"
                      >
                        <span className="hidden sm:inline">Mark as Paid</span>
                        <span className="sm:hidden">Mark Paid</span>
                      </button>
                    </div>
                  )}

                  {/* Unpaid Sessions */}
                  {unpaidSessions.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Unpaid Sessions ({unpaidSessions.length})
                        </h3>
                        <button
                          onClick={toggleAllUnpaid}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          {unpaidSessions.every(s => selectedSessions.includes(s.attendance_id)) ? 'Deselect All' : 'Select All'}
                        </button>
                      </div>
                      <div className="space-y-2">
                        {unpaidSessions.map(session => (
                          <div
                            key={session.attendance_id}
                            onClick={() => toggleSession(session.attendance_id)}
                            className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md cursor-pointer hover:bg-yellow-100 transition-colors"
                          >
                            {selectedSessions.includes(session.attendance_id) ? (
                              <CheckSquare className="w-5 h-5 text-blue-600 flex-shrink-0" />
                            ) : (
                              <Square className="w-5 h-5 text-gray-400 flex-shrink-0" />
                            )}
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">
                                  {formatDateShort(session.session_date)}
                                </span>
                                <span className="text-sm text-gray-600">at {session.session_time}</span>
                                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                                  {session.session_type}
                                </span>
                              </div>
                            </div>
                            <span className="text-sm font-semibold text-yellow-700">£4.00</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pending Confirmation Sessions */}
                  {pendingConfirmationSessions.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        Awaiting Confirmation ({pendingConfirmationSessions.length})
                      </h3>
                      <div className="space-y-2">
                        {pendingConfirmationSessions.map(session => (
                          <div
                            key={session.attendance_id}
                            className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-md"
                          >
                            <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-gray-900">
                                  {formatDateShort(session.session_date)}
                                </span>
                                <span className="text-sm text-gray-600">at {session.session_time}</span>
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                  {session.session_type}
                                </span>
                              </div>
                              <div className="text-xs text-blue-700">
                                You marked as paid: {formatDateShort(session.user_marked_paid_at)}
                              </div>
                              {session.user_payment_note && (
                                <div className="text-xs text-blue-600 mt-1">
                                  Note: {session.user_payment_note}
                                </div>
                              )}
                            </div>
                            <span className="text-sm font-semibold text-blue-700">£4.00</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Paid Sessions - Show recent 5 */}
                  {paidSessions.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        Paid Sessions ({paidSessions.length})
                      </h3>
                      <div className="space-y-2">
                        {paidSessions.slice(0, 5).map(session => (
                          <div
                            key={session.attendance_id}
                            className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-md"
                          >
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-900">
                                  {formatDateShort(session.session_date)}
                                </span>
                                <span className="text-xs text-gray-600">at {session.session_time}</span>
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                  {session.session_type}
                                </span>
                              </div>
                            </div>
                            <span className="text-sm font-semibold text-green-700">£4.00</span>
                          </div>
                        ))}
                        {paidSessions.length > 5 && (
                          <p className="text-sm text-gray-500 text-center py-2">
                            + {paidSessions.length - 5} more paid session{paidSessions.length - 5 !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {mySessions.length === 0 && (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">You haven't attended any coaching sessions yet</p>
                    </div>
                  )}
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
