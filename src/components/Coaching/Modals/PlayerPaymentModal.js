import React, { useState, useEffect } from 'react';
import { X, Check, CheckSquare, Square, DollarSign, Calendar } from 'lucide-react';
import { useAppToast } from '../../../contexts/ToastContext';
import { LoadingSpinner } from '../../shared/LoadingSpinner';

const PlayerPaymentModal = ({ isOpen, onClose, player, actions, onSuccess }) => {
  const { success, error } = useAppToast();
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [selectedSessions, setSelectedSessions] = useState([]);
  const [confirmingPayment, setConfirmingPayment] = useState(false);

  useEffect(() => {
    if (isOpen && player) {
      loadSessions();
    }
  }, [isOpen, player]);

  const loadSessions = async () => {
    setLoadingSessions(true);
    const result = await actions.getPlayerSessionsByPaymentStatus(player.player_id);
    if (result.data) {
      setSessions(result.data);
    }
    setLoadingSessions(false);
  };

  const handleConfirmByAmount = async () => {
    const amountStr = window.prompt(
      `Enter amount received from ${player.player_name}:\n\n` +
      `(Sessions cost £4 each. Payment will be auto-allocated to oldest unpaid sessions.)`
    );

    if (amountStr === null) return;

    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      error('Please enter a valid amount');
      return;
    }

    const reference = window.prompt('Enter payment reference (optional):') || '';

    setConfirmingPayment(true);
    const result = await actions.adminConfirmPayment(player.player_id, amount, reference);

    if (result.error) {
      error('Failed to confirm payment');
    } else {
      const sessionsConfirmed = result.data?.sessions_confirmed || 0;
      const amountAllocated = result.data?.amount_allocated || 0;
      const remaining = result.data?.remaining_amount || 0;

      success(
        `Confirmed £${amountAllocated.toFixed(2)} for ${sessionsConfirmed} session(s)` +
        (remaining > 0 ? `. £${remaining.toFixed(2)} remaining (not enough for another session)` : '')
      );

      await loadSessions();
      if (onSuccess) onSuccess();
    }
    setConfirmingPayment(false);
  };

  const handleConfirmSelected = async () => {
    if (selectedSessions.length === 0) {
      error('Please select sessions to confirm');
      return;
    }

    const reference = window.prompt(
      `Confirm ${selectedSessions.length} session(s) as paid?\n\n` +
      `Total: £${(selectedSessions.length * 4).toFixed(2)}\n\n` +
      `Enter payment reference (optional):`
    ) || '';

    if (reference === null) return;

    setConfirmingPayment(true);
    const result = await actions.adminConfirmSessions(selectedSessions, reference);

    if (result.error) {
      error('Failed to confirm sessions');
    } else {
      success(`Confirmed ${selectedSessions.length} session(s) as paid`);
      setSelectedSessions([]);
      await loadSessions();
      if (onSuccess) onSuccess();
    }
    setConfirmingPayment(false);
  };

  const toggleSession = (attendanceId) => {
    setSelectedSessions(prev =>
      prev.includes(attendanceId)
        ? prev.filter(id => id !== attendanceId)
        : [...prev, attendanceId]
    );
  };

  const toggleAllUnpaid = () => {
    const unpaidSessions = sessions.filter(s => s.payment_status === 'unpaid');
    const allUnpaidSelected = unpaidSessions.every(s => selectedSessions.includes(s.attendance_id));

    if (allUnpaidSelected) {
      setSelectedSessions(prev => prev.filter(id => !unpaidSessions.find(s => s.attendance_id === id)));
    } else {
      setSelectedSessions(prev => [...new Set([...prev, ...unpaidSessions.map(s => s.attendance_id)])]);
    }
  };

  const toggleAllPending = () => {
    const pendingSessions = sessions.filter(s => s.payment_status === 'pending_confirmation');
    const allPendingSelected = pendingSessions.every(s => selectedSessions.includes(s.attendance_id));

    if (allPendingSelected) {
      setSelectedSessions(prev => prev.filter(id => !pendingSessions.find(s => s.attendance_id === id)));
    } else {
      setSelectedSessions(prev => [...new Set([...prev, ...pendingSessions.map(s => s.attendance_id)])]);
    }
  };

  if (!isOpen) return null;

  const unpaidSessions = sessions.filter(s => s.payment_status === 'unpaid');
  const pendingConfirmationSessions = sessions.filter(s => s.payment_status === 'pending_confirmation');
  const paidSessions = sessions.filter(s => s.payment_status === 'paid');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{player.player_name}</h2>
            <p className="text-sm text-gray-600">{player.player_email}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 p-6 bg-gray-50 border-b border-gray-200">
          <div>
            <p className="text-sm text-gray-600">Owed</p>
            <p className="text-2xl font-bold text-yellow-700">£{parseFloat(player.amount_owed || 0).toFixed(2)}</p>
            <p className="text-xs text-gray-500">{player.unpaid_sessions} sessions</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">To Confirm</p>
            <p className="text-2xl font-bold text-blue-700">£{parseFloat(player.amount_pending_confirmation || 0).toFixed(2)}</p>
            <p className="text-xs text-gray-500">{player.pending_confirmation_sessions} sessions</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Paid</p>
            <p className="text-2xl font-bold text-green-700">£{parseFloat(player.amount_paid || 0).toFixed(2)}</p>
            <p className="text-xs text-gray-500">{player.paid_sessions} sessions</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 p-4 bg-white border-b border-gray-200">
          <button
            onClick={handleConfirmByAmount}
            disabled={confirmingPayment || loadingSessions}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <DollarSign className="w-4 h-4" />
            Confirm Payment by Amount
          </button>
          {selectedSessions.length > 0 && (
            <button
              onClick={handleConfirmSelected}
              disabled={confirmingPayment}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              Confirm Selected ({selectedSessions.length})
            </button>
          )}
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loadingSessions ? (
            <LoadingSpinner />
          ) : sessions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No coaching sessions found for this player</p>
            </div>
          ) : (
            <div className="space-y-6">
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
                              {new Date(session.session_date).toLocaleDateString('en-GB', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
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
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Awaiting Confirmation ({pendingConfirmationSessions.length})
                    </h3>
                    <button
                      onClick={toggleAllPending}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      {pendingConfirmationSessions.every(s => selectedSessions.includes(s.attendance_id)) ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  <div className="space-y-2">
                    {pendingConfirmationSessions.map(session => (
                      <div
                        key={session.attendance_id}
                        onClick={() => toggleSession(session.attendance_id)}
                        className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-md cursor-pointer hover:bg-blue-100 transition-colors"
                      >
                        {selectedSessions.includes(session.attendance_id) ? (
                          <CheckSquare className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">
                              {new Date(session.session_date).toLocaleDateString('en-GB', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </span>
                            <span className="text-sm text-gray-600">at {session.session_time}</span>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              {session.session_type}
                            </span>
                          </div>
                          <div className="text-xs text-blue-700">
                            Player marked paid: {new Date(session.user_marked_paid_at).toLocaleDateString('en-GB')}
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

              {/* Paid Sessions */}
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
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-900">
                              {new Date(session.session_date).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </span>
                            <span className="text-xs text-gray-600">at {session.session_time}</span>
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                              {session.session_type}
                            </span>
                          </div>
                          {session.admin_payment_reference && (
                            <div className="text-xs text-green-600 mt-1">
                              Ref: {session.admin_payment_reference}
                            </div>
                          )}
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerPaymentModal;
