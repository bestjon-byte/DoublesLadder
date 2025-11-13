import React, { useState, useEffect } from 'react';
import { Banknote, User, Mail, Check, ChevronRight, Search } from 'lucide-react';
import { useAppToast } from '../../../contexts/ToastContext';
import PlayerPaymentModal from '../Modals/PlayerPaymentModal';
import SendReminderModal from '../Modals/SendReminderModal';
import { LoadingSpinner } from '../../shared/LoadingSpinner';

const PaymentManagement = ({ loading, actions }) => {
  const { success, error } = useAppToast();
  const [playersSummary, setPlayersSummary] = useState([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [viewingPlayer, setViewingPlayer] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'owe_money', 'awaiting_confirmation', 'paid_up'
  const [searchQuery, setSearchQuery] = useState('');
  const [showReminderModal, setShowReminderModal] = useState(false);

  // Load all players payment summary
  useEffect(() => {
    const loadSummary = async () => {
      setLoadingSummary(true);
      const result = await actions.getAllPlayersPaymentSummary();
      if (result.data) {
        setPlayersSummary(result.data);
      }
      setLoadingSummary(false);
    };
    loadSummary();
  }, [actions]);

  const handleSendReminders = () => {
    setShowReminderModal(true);
  };

  const handleRefresh = async () => {
    setLoadingSummary(true);
    const result = await actions.getAllPlayersPaymentSummary();
    if (result.data) {
      setPlayersSummary(result.data);
    }
    setLoadingSummary(false);
  };

  if (loadingSummary && playersSummary.length === 0) {
    return <LoadingSpinner />;
  }

  // Filter players
  const filteredPlayers = playersSummary.filter(player => {
    // Payment status filter
    if (filter === 'owe_money') {
      if (parseFloat(player.amount_owed) === 0) return false;
    } else if (filter === 'awaiting_confirmation') {
      if (parseFloat(player.amount_pending_confirmation) === 0) return false;
    } else if (filter === 'paid_up') {
      if (parseFloat(player.amount_owed) !== 0 || parseFloat(player.amount_pending_confirmation) !== 0) return false;
    }

    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const nameMatch = player.player_name?.toLowerCase().includes(query);
      const emailMatch = player.player_email?.toLowerCase().includes(query);
      if (!nameMatch && !emailMatch) return false;
    }

    return true;
  });

  // Calculate totals
  const totals = playersSummary.reduce((acc, player) => ({
    owed: acc.owed + parseFloat(player.amount_owed || 0),
    pending: acc.pending + parseFloat(player.amount_pending_confirmation || 0),
    paid: acc.paid + parseFloat(player.amount_paid || 0),
    playersOwing: acc.playersOwing + (parseFloat(player.amount_owed) > 0 ? 1 : 0),
    playersPending: acc.playersPending + (parseFloat(player.amount_pending_confirmation) > 0 ? 1 : 0),
  }), { owed: 0, pending: 0, paid: 0, playersOwing: 0, playersPending: 0 });

  return (
    <div className="space-y-6">
      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-yellow-700 font-medium">Total Owed</p>
            <Banknote className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-2xl font-bold text-yellow-900">
            £{totals.owed.toFixed(2)}
          </p>
          <p className="text-xs text-yellow-600 mt-1">
            {totals.playersOwing} player{totals.playersOwing !== 1 ? 's' : ''} owing money
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-blue-700 font-medium">Awaiting Confirmation</p>
            <Check className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-900">
            £{totals.pending.toFixed(2)}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            {totals.playersPending} player{totals.playersPending !== 1 ? 's' : ''} marked as paid
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-green-700 font-medium">Total Received</p>
            <Check className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-900">
            £{totals.paid.toFixed(2)}
          </p>
          <p className="text-xs text-green-600 mt-1">
            All-time confirmed payments
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by player name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Filters Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'all', label: 'All Players' },
            { value: 'owe_money', label: 'Owe Money' },
            { value: 'awaiting_confirmation', label: 'To Confirm' },
            { value: 'paid_up', label: 'Paid Up' }
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
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={loadingSummary}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {loadingSummary ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            onClick={handleSendReminders}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            <Mail className="w-4 h-4" />
            <span className="hidden sm:inline">Send Payment Reminders</span>
            <span className="sm:hidden">Send Reminders</span>
          </button>
        </div>
      </div>

      {/* Players List */}
      {filteredPlayers.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">
            {filter === 'all' ? 'No players with coaching attendance found' :
             filter === 'owe_money' ? 'No players owe money' :
             filter === 'awaiting_confirmation' ? 'No payments awaiting confirmation' :
             'No players are fully paid up'}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Card Layout */}
          <div className="md:hidden space-y-3">
            {filteredPlayers.map((player) => {
              const owedAmount = parseFloat(player.amount_owed || 0);
              const pendingAmount = parseFloat(player.amount_pending_confirmation || 0);
              const paidAmount = parseFloat(player.amount_paid || 0);

              return (
                <div
                  key={player.player_id}
                  onClick={() => setViewingPlayer(player)}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{player.player_name}</h3>
                      <p className="text-sm text-gray-500">{player.player_email}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {player.total_sessions} sessions ({player.unpaid_sessions} unpaid • {player.pending_confirmation_sessions} pending • {player.paid_sessions} paid)
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingPlayer(player);
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center pt-3 border-t border-gray-200">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Owed</p>
                      <p className={`text-sm font-semibold ${owedAmount > 0 ? 'text-yellow-700' : 'text-gray-400'}`}>
                        £{owedAmount.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Pending</p>
                      <p className={`text-sm font-semibold ${pendingAmount > 0 ? 'text-blue-700' : 'text-gray-400'}`}>
                        £{pendingAmount.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Paid</p>
                      <p className="text-sm font-semibold text-green-700">
                        £{paidAmount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table Layout */}
          <div className="hidden md:block bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Player
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sessions
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Owed
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  To Confirm
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paid
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPlayers.map((player) => {
                const owedAmount = parseFloat(player.amount_owed || 0);
                const pendingAmount = parseFloat(player.amount_pending_confirmation || 0);
                const paidAmount = parseFloat(player.amount_paid || 0);

                return (
                  <tr
                    key={player.player_id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setViewingPlayer(player)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{player.player_name}</div>
                        <div className="text-sm text-gray-500">{player.player_email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div>
                        <div>{player.total_sessions} total</div>
                        <div className="text-xs text-gray-500">
                          {player.unpaid_sessions} unpaid • {player.pending_confirmation_sessions} pending • {player.paid_sessions} paid
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={`text-sm font-semibold ${owedAmount > 0 ? 'text-yellow-700' : 'text-gray-400'}`}>
                        £{owedAmount.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={`text-sm font-semibold ${pendingAmount > 0 ? 'text-blue-700' : 'text-gray-400'}`}>
                        £{pendingAmount.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-sm font-semibold text-green-700">
                        £{paidAmount.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingPlayer(player);
                        }}
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
                      >
                        View Details
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </>
      )}

      {/* Player Payment Modal */}
      {viewingPlayer && (
        <PlayerPaymentModal
          isOpen={!!viewingPlayer}
          onClose={() => setViewingPlayer(null)}
          player={viewingPlayer}
          actions={actions}
          onSuccess={handleRefresh}
        />
      )}

      {/* Send Reminder Modal */}
      <SendReminderModal
        isOpen={showReminderModal}
        onClose={() => {
          setShowReminderModal(false);
          handleRefresh();
        }}
        actions={actions}
      />
    </div>
  );
};

export default PaymentManagement;
