import React, { useState, useEffect } from 'react';
import { X, Check, Banknote, Calendar, AlertCircle } from 'lucide-react';
import { useAppToast } from '../../../contexts/ToastContext';
import { LoadingSpinner } from '../../shared/LoadingSpinner';
import { formatTime, getSessionTypeColors } from '../../../utils/timeFormatter';

// Helper to get colors for item types
const getItemTypeColors = (itemType) => {
  switch (itemType) {
    case 'coaching':
      return { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Coaching' };
    case 'ladder':
      return { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Ladder Match' };
    case 'league':
      return { bg: 'bg-blue-100', text: 'text-blue-800', label: 'League Match' };
    case 'singles_championship':
      return { bg: 'bg-green-100', text: 'text-green-800', label: 'Singles' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-800', label: itemType };
  }
};

const PlayerPaymentModal = ({ isOpen, onClose, player, actions, onSuccess }) => {
  const { success, error } = useAppToast();
  const [coachingSessions, setCoachingSessions] = useState([]);
  const [matchFees, setMatchFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [reversingPayment, setReversingPayment] = useState(false);

  useEffect(() => {
    if (isOpen && player) {
      loadAllItems();
    }
  }, [isOpen, player]);

  const loadAllItems = async () => {
    setLoading(true);

    // Load coaching sessions and match fees in parallel
    const [sessionsResult, feesResult] = await Promise.all([
      actions.getPlayerSessionsByPaymentStatus(player.player_id),
      actions.getPlayerMatchFees(player.player_id)
    ]);

    if (sessionsResult.data) {
      setCoachingSessions(sessionsResult.data);
    }
    if (feesResult.data) {
      setMatchFees(feesResult.data);
    }

    setLoading(false);
    setSelectedItems([]);
  };

  const handleConfirmByAmount = async () => {
    const amountStr = window.prompt(
      `Enter amount received from ${player.player_name}:\n\n` +
      `(Payment will be auto-allocated to oldest unpaid items.)`
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
        `Confirmed £${amountAllocated.toFixed(2)} for ${sessionsConfirmed} item(s)` +
        (remaining > 0 ? `. £${remaining.toFixed(2)} remaining` : '')
      );

      await loadAllItems();
      if (onSuccess) onSuccess();
    }
    setConfirmingPayment(false);
  };

  const handleReversePayment = async () => {
    // Only works for coaching sessions currently
    const coachingItems = selectedItems.filter(id => id.startsWith('coaching_'));
    if (coachingItems.length === 0) {
      error('Select coaching sessions to mark as unpaid');
      return;
    }

    const attendanceIds = coachingItems.map(id => id.replace('coaching_', ''));

    const confirmMsg = `Are you sure you want to mark ${attendanceIds.length} session(s) as UNPAID?\n\n` +
      `This will reverse the payment status.`;

    if (!window.confirm(confirmMsg)) return;

    const reason = window.prompt('Enter reason for reversal (optional):') || 'Payment not received';

    setReversingPayment(true);
    const result = await actions.adminReversePaymentStatus(attendanceIds, reason);

    if (result.error) {
      error('Failed to reverse payment status');
    } else {
      const reversedCount = result.data?.length || 0;
      success(`Reversed ${reversedCount} session(s) back to unpaid`);
      await loadAllItems();
      if (onSuccess) onSuccess();
    }
    setReversingPayment(false);
  };

  const toggleItemSelection = (itemId) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  if (!isOpen) return null;

  // Combine and categorize all items
  const allItems = [
    // Coaching sessions with type indicator
    ...coachingSessions.map(s => ({
      id: `coaching_${s.attendance_id}`,
      type: 'coaching',
      date: s.session_date,
      time: s.session_time,
      sessionType: s.session_type,
      amount: 4.00,
      paymentStatus: s.payment_status,
      userMarkedPaidAt: s.user_marked_paid_at,
      userPaymentNote: s.user_payment_note,
      adminPaymentReference: s.admin_payment_reference,
    })),
    // Match fees with type indicator
    ...matchFees.map(f => ({
      id: `match_${f.id}`,
      type: f.match_type,
      date: f.match_date,
      time: null,
      sessionType: null,
      seasonName: f.season_name,
      amount: parseFloat(f.fee_amount),
      paymentStatus: f.payment_status,
      userMarkedPaidAt: null,
      userPaymentNote: null,
      adminPaymentReference: null,
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const unpaidItems = allItems.filter(i => i.paymentStatus === 'unpaid');
  const pendingItems = allItems.filter(i => i.paymentStatus === 'pending_confirmation');
  const paidItems = allItems.filter(i => i.paymentStatus === 'paid');

  const renderItem = (item, bgColor, borderColor, amountColor, showCheckbox = false, showCheck = false) => {
    const typeColors = getItemTypeColors(item.type);
    const sessionColors = item.sessionType ? getSessionTypeColors(item.sessionType) : null;

    return (
      <div
        key={item.id}
        className={`flex items-start gap-3 p-3 ${bgColor} border ${borderColor} rounded-md ${showCheckbox ? 'cursor-pointer hover:opacity-90' : ''} transition-colors`}
        onClick={showCheckbox ? () => toggleItemSelection(item.id) : undefined}
      >
        {showCheckbox && (
          <input
            type="checkbox"
            checked={selectedItems.includes(item.id)}
            onChange={() => toggleItemSelection(item.id)}
            className="mt-1 w-4 h-4 rounded"
            onClick={(e) => e.stopPropagation()}
          />
        )}
        {showCheck && <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />}

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            {/* Type badge */}
            <span className={`text-xs ${typeColors.bg} ${typeColors.text} px-2 py-0.5 rounded font-medium`}>
              {typeColors.label}
            </span>

            {/* Session type for coaching */}
            {sessionColors && (
              <span className={`text-xs ${sessionColors.bg} ${sessionColors.text} px-2 py-0.5 rounded`}>
                {item.sessionType}
              </span>
            )}

            {/* Season name for matches */}
            {item.seasonName && (
              <span className="text-xs text-gray-500">
                {item.seasonName}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">
              {new Date(item.date).toLocaleDateString('en-GB', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </span>
            {item.time && (
              <span className="text-sm text-gray-600">at {formatTime(item.time)}</span>
            )}
          </div>

          {/* Additional info */}
          {item.userMarkedPaidAt && (
            <div className="text-xs text-blue-700 mt-1">
              Player marked paid: {new Date(item.userMarkedPaidAt).toLocaleDateString('en-GB')}
            </div>
          )}
          {item.userPaymentNote && (
            <div className="text-xs text-blue-600 mt-1">
              Note: {item.userPaymentNote}
            </div>
          )}
          {item.adminPaymentReference && (
            <div className="text-xs text-green-600 mt-1">
              Ref: {item.adminPaymentReference}
            </div>
          )}
        </div>

        <span className={`text-sm font-semibold ${amountColor} whitespace-nowrap`}>
          £{item.amount.toFixed(2)}
        </span>
      </div>
    );
  };

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
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          {/* Total Amounts */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600">Total Owed</p>
              <p className="text-2xl font-bold text-yellow-700">£{parseFloat(player.amount_owed || 0).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">To Confirm</p>
              <p className="text-2xl font-bold text-blue-700">£{parseFloat(player.amount_pending_confirmation || 0).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Paid</p>
              <p className="text-2xl font-bold text-green-700">£{parseFloat(player.amount_paid || 0).toFixed(2)}</p>
            </div>
          </div>

          {/* Breakdown */}
          {parseFloat(player.amount_owed || 0) > 0 && (
            <div className="border-t border-gray-200 pt-3 text-sm">
              <p className="text-gray-600 font-medium mb-2">Amount owed breakdown:</p>
              <div className="flex flex-wrap gap-2">
                {player.unpaid_sessions > 0 && (
                  <div className="bg-white rounded px-2 py-1 border border-gray-200">
                    <span className="font-medium">{player.unpaid_sessions}</span>
                    <span className="text-gray-500 ml-1">coaching</span>
                    <span className="text-gray-400 ml-1">£{parseFloat(player.coaching_amount_owed || player.unpaid_sessions * 4).toFixed(2)}</span>
                  </div>
                )}
                {(player.ladder_matches_unpaid || 0) > 0 && (
                  <div className="bg-white rounded px-2 py-1 border border-gray-200">
                    <span className="font-medium">{player.ladder_matches_unpaid}</span>
                    <span className="text-gray-500 ml-1">ladder</span>
                    <span className="text-gray-400 ml-1">£{parseFloat(player.ladder_amount_owed || 0).toFixed(2)}</span>
                  </div>
                )}
                {(player.league_matches_unpaid || 0) > 0 && (
                  <div className="bg-white rounded px-2 py-1 border border-gray-200">
                    <span className="font-medium">{player.league_matches_unpaid}</span>
                    <span className="text-gray-500 ml-1">league</span>
                    <span className="text-gray-400 ml-1">£{parseFloat(player.league_amount_owed || 0).toFixed(2)}</span>
                  </div>
                )}
                {(player.singles_matches_unpaid || 0) > 0 && (
                  <div className="bg-white rounded px-2 py-1 border border-gray-200">
                    <span className="font-medium">{player.singles_matches_unpaid}</span>
                    <span className="text-gray-500 ml-1">singles</span>
                    <span className="text-gray-400 ml-1">£{parseFloat(player.singles_amount_owed || 0).toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 p-4 bg-white border-b border-gray-200">
          <button
            onClick={handleConfirmByAmount}
            disabled={confirmingPayment || loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Banknote className="w-4 h-4" />
            Confirm Payment
          </button>
          {selectedItems.length > 0 && (
            <button
              onClick={handleReversePayment}
              disabled={reversingPayment || loading}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              <AlertCircle className="w-4 h-4" />
              Mark as Unpaid ({selectedItems.length})
            </button>
          )}
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <LoadingSpinner />
          ) : allItems.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No items found for this player</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Unpaid Items */}
              {unpaidItems.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Unpaid ({unpaidItems.length})
                  </h3>
                  <div className="space-y-2">
                    {unpaidItems.map(item =>
                      renderItem(item, 'bg-yellow-50', 'border-yellow-200', 'text-yellow-700')
                    )}
                  </div>
                </div>
              )}

              {/* Pending Confirmation Items */}
              {pendingItems.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Awaiting Confirmation ({pendingItems.length})
                  </h3>
                  <div className="space-y-2">
                    {pendingItems.map(item =>
                      renderItem(item, 'bg-blue-50', 'border-blue-200', 'text-blue-700', true)
                    )}
                  </div>
                </div>
              )}

              {/* Paid Items */}
              {paidItems.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Paid ({paidItems.length})
                  </h3>
                  <div className="space-y-2">
                    {paidItems.slice(0, 10).map(item =>
                      renderItem(item, 'bg-green-50', 'border-green-200', 'text-green-700', true, true)
                    )}
                    {paidItems.length > 10 && (
                      <p className="text-sm text-gray-500 text-center py-2">
                        + {paidItems.length - 10} more paid item{paidItems.length - 10 !== 1 ? 's' : ''}
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
