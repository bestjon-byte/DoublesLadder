import React, { useState, useEffect } from 'react';
import { Banknote, User, Mail, Check, ChevronRight, Search } from 'lucide-react';
import { useAppToast } from '../../../contexts/ToastContext';
import PlayerPaymentModal from '../Modals/PlayerPaymentModal';
import { LoadingSpinner } from '../../shared/LoadingSpinner';

const PaymentManagement = ({ loading, actions }) => {
  const { success, error } = useAppToast();
  const [playersSummary, setPlayersSummary] = useState([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [viewingPlayer, setViewingPlayer] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'owe_money', 'awaiting_confirmation', 'paid_up'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlayers, setSelectedPlayers] = useState(new Set());
  const [sendingReminders, setSendingReminders] = useState(false);

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

  const handleTogglePlayer = (playerId) => {
    const newSelected = new Set(selectedPlayers);
    if (newSelected.has(playerId)) {
      newSelected.delete(playerId);
    } else {
      newSelected.add(playerId);
    }
    setSelectedPlayers(newSelected);
  };

  const handleSelectAll = () => {
    const playersToSelect = filteredPlayers
      .filter(p => parseFloat(p.amount_owed) > 0)
      .map(p => p.player_id);
    setSelectedPlayers(new Set(playersToSelect));
  };

  const handleDeselectAll = () => {
    setSelectedPlayers(new Set());
  };

  const handleSendReminders = async () => {
    if (selectedPlayers.size === 0) {
      error('Please select at least one player to send reminders to');
      return;
    }

    const confirmMsg = `Send payment reminders to ${selectedPlayers.size} selected player(s)?`;
    if (!window.confirm(confirmMsg)) return;

    setSendingReminders(true);
    try {
      // Get full player data for selected players
      const selectedPayments = playersSummary
        .filter(p => selectedPlayers.has(p.player_id))
        .map(p => ({
          player_id: p.player_id,
          player_name: p.player_name,
          player_email: p.player_email,
          amount_due: p.amount_owed,
          total_sessions: p.unpaid_sessions,
        }));

      const result = await actions.sendPaymentReminders(null, null, selectedPayments);

      if (result.error) {
        throw new Error(result.error);
      }

      success(`Successfully sent ${result.data.sent} reminder(s)`);

      if (result.data.failed > 0) {
        const errorDetails = result.data.errors && result.data.errors.length > 0
          ? result.data.errors.map(e => `${e.player}: ${e.error}`).join('\n')
          : 'Unknown error';
        error(`${result.data.failed} email(s) failed to send:\n\n${errorDetails}`);
      }

      // Clear selection and refresh
      setSelectedPlayers(new Set());
      await handleRefresh();
    } catch (err) {
      console.error('Error sending reminders:', err);
      error('Failed to send reminders: ' + err.message);
    } finally {
      setSendingReminders(false);
    }
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
            disabled={sendingReminders || selectedPlayers.size === 0}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            <Mail className="w-4 h-4" />
            {sendingReminders ? (
              <span>Sending...</span>
            ) : (
              <>
                <span className="hidden sm:inline">
                  Send Reminders {selectedPlayers.size > 0 ? `(${selectedPlayers.size})` : ''}
                </span>
                <span className="sm:hidden">
                  Send {selectedPlayers.size > 0 ? `(${selectedPlayers.size})` : ''}
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Selection Controls */}
      {filteredPlayers.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-md border border-gray-200">
          <span className="text-sm text-gray-600 font-medium">Select:</span>
          <button
            onClick={handleSelectAll}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            All Owing ({filteredPlayers.filter(p => parseFloat(p.amount_owed) > 0).length})
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={handleDeselectAll}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            None
          </button>
          {selectedPlayers.size > 0 && (
            <>
              <span className="text-gray-300">|</span>
              <span className="text-sm text-gray-700">
                <strong>{selectedPlayers.size}</strong> selected
              </span>
            </>
          )}
        </div>
      )}

      {/* Players List */}
      {filteredPlayers.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">
            {filter === 'all' ? 'No players with outstanding items found' :
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
              const canSelect = owedAmount > 0;

              return (
                <div
                  key={player.player_id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex gap-3 flex-1">
                      {canSelect ? (
                        <input
                          type="checkbox"
                          checked={selectedPlayers.has(player.player_id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleTogglePlayer(player.player_id);
                          }}
                          className="w-5 h-5 cursor-pointer mt-1 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-5"></div>
                      )}
                      <div className="flex-1" onClick={() => setViewingPlayer(player)}>
                        <h3 className="font-medium text-gray-900">{player.player_name}</h3>
                        <p className="text-sm text-gray-500">{player.player_email}</p>
                        <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                          {player.unpaid_sessions > 0 && (
                            <p>{player.unpaid_sessions} coaching session{player.unpaid_sessions !== 1 ? 's' : ''}</p>
                          )}
                          {(player.ladder_matches_unpaid || 0) > 0 && (
                            <p>{player.ladder_matches_unpaid} ladder match{player.ladder_matches_unpaid !== 1 ? 'es' : ''}</p>
                          )}
                          {(player.league_matches_unpaid || 0) > 0 && (
                            <p>{player.league_matches_unpaid} league match{player.league_matches_unpaid !== 1 ? 'es' : ''}</p>
                          )}
                          {(player.singles_matches_unpaid || 0) > 0 && (
                            <p>{player.singles_matches_unpaid} singles match{player.singles_matches_unpaid !== 1 ? 'es' : ''}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingPlayer(player);
                      }}
                      className="text-blue-600 hover:text-blue-800 flex-shrink-0"
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
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  <input
                    type="checkbox"
                    checked={
                      filteredPlayers.filter(p => parseFloat(p.amount_owed) > 0).length > 0 &&
                      filteredPlayers.filter(p => parseFloat(p.amount_owed) > 0).every(p => selectedPlayers.has(p.player_id))
                    }
                    onChange={(e) => e.target.checked ? handleSelectAll() : handleDeselectAll()}
                    className="w-4 h-4 cursor-pointer"
                    title="Select/Deselect all players who owe money"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Player
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
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
                const canSelect = owedAmount > 0;

                return (
                  <tr
                    key={player.player_id}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-4 py-4 text-center">
                      {canSelect ? (
                        <input
                          type="checkbox"
                          checked={selectedPlayers.has(player.player_id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleTogglePlayer(player.player_id);
                          }}
                          className="w-4 h-4 cursor-pointer"
                        />
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => setViewingPlayer(player)}>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{player.player_name}</div>
                        <div className="text-sm text-gray-500">{player.player_email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 cursor-pointer" onClick={() => setViewingPlayer(player)}>
                      <div className="space-y-0.5">
                        {player.unpaid_sessions > 0 && (
                          <div className="text-xs">
                            <span className="font-medium">{player.unpaid_sessions}</span> coaching
                            {player.coaching_amount_owed > 0 && <span className="text-gray-400 ml-1">£{parseFloat(player.coaching_amount_owed).toFixed(2)}</span>}
                          </div>
                        )}
                        {(player.ladder_matches_unpaid || 0) > 0 && (
                          <div className="text-xs">
                            <span className="font-medium">{player.ladder_matches_unpaid}</span> ladder
                            {player.ladder_amount_owed > 0 && <span className="text-gray-400 ml-1">£{parseFloat(player.ladder_amount_owed).toFixed(2)}</span>}
                          </div>
                        )}
                        {(player.league_matches_unpaid || 0) > 0 && (
                          <div className="text-xs">
                            <span className="font-medium">{player.league_matches_unpaid}</span> league
                            {player.league_amount_owed > 0 && <span className="text-gray-400 ml-1">£{parseFloat(player.league_amount_owed).toFixed(2)}</span>}
                          </div>
                        )}
                        {(player.singles_matches_unpaid || 0) > 0 && (
                          <div className="text-xs">
                            <span className="font-medium">{player.singles_matches_unpaid}</span> singles
                            {player.singles_amount_owed > 0 && <span className="text-gray-400 ml-1">£{parseFloat(player.singles_amount_owed).toFixed(2)}</span>}
                          </div>
                        )}
                        {player.unpaid_sessions === 0 &&
                         (player.ladder_matches_unpaid || 0) === 0 &&
                         (player.league_matches_unpaid || 0) === 0 &&
                         (player.singles_matches_unpaid || 0) === 0 && (
                          <div className="text-xs text-gray-400">No unpaid items</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right cursor-pointer" onClick={() => setViewingPlayer(player)}>
                      <span className={`text-sm font-semibold ${owedAmount > 0 ? 'text-yellow-700' : 'text-gray-400'}`}>
                        £{owedAmount.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right cursor-pointer" onClick={() => setViewingPlayer(player)}>
                      <span className={`text-sm font-semibold ${pendingAmount > 0 ? 'text-blue-700' : 'text-gray-400'}`}>
                        £{pendingAmount.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right cursor-pointer" onClick={() => setViewingPlayer(player)}>
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
    </div>
  );
};

export default PaymentManagement;
