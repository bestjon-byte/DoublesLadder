import React, { useState, useEffect } from 'react';
import { X, UserPlus, Trash2, CheckCircle } from 'lucide-react';
import { useAppToast } from '../../../contexts/ToastContext';
import { LoadingSpinner } from '../../shared/LoadingSpinner';

const SessionDetailsModal = ({ isOpen, onClose, session, actions, allUsers }) => {
  const { success, error } = useAppToast();
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingAttendance, setAddingAttendance] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [accessList, setAccessList] = useState([]);
  const [playerStats, setPlayerStats] = useState([]);

  useEffect(() => {
    if (session) {
      loadData();
    }
  }, [session]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    setLoading(true);
    const [attendanceResult, accessResult, statsResult] = await Promise.all([
      actions.getSessionAttendance(session.id),
      actions.fetchAccessList ? actions.fetchAccessList() : Promise.resolve({ data: [] }),
      actions.getPlayerAttendanceStats(session.session_type)
    ]);

    if (!attendanceResult.error) {
      setAttendance(attendanceResult.data || []);
    }

    if (!statsResult.error) {
      setPlayerStats(statsResult.data || []);
    }

    // Get list of users with coaching access
    if (allUsers) {
      // If we have allUsers prop, use it
      setAccessList(allUsers);
    }
    setLoading(false);
  };

  const handleAddAttendance = async () => {
    if (!selectedPlayerId) {
      error('Please select a player');
      return;
    }

    // Check if player already registered
    if (attendance.some(a => a.player_id === selectedPlayerId)) {
      error('Player is already registered for this session');
      return;
    }

    setAddingAttendance(true);
    const result = await actions.markAttendance(session.id, selectedPlayerId, false);

    if (result.error) {
      if (result.error.message?.includes('duplicate')) {
        error('Player is already registered for this session');
      } else {
        error('Failed to add attendance');
      }
    } else {
      success('Attendance added successfully');
      setSelectedPlayerId('');
      await loadData();
    }
    setAddingAttendance(false);
  };

  const handleRemoveAttendance = async (attendanceId, playerName) => {
    if (!window.confirm(`Remove ${playerName} from this session?`)) return;

    const result = await actions.removeAttendance(attendanceId);
    if (result.error) {
      error('Failed to remove attendance');
    } else {
      success('Attendance removed');
      await loadData();
    }
  };

  if (!isOpen) return null;

  // Get players not yet registered for this session
  const attendeeIds = attendance.map(a => a.player_id);

  // Create a map of player stats for quick lookup
  const statsMap = new Map(playerStats.map(stat => [stat.player_id, stat]));

  // Sort players by attendance count (frequent attendees first), then alphabetically
  const availablePlayers = allUsers
    ? allUsers
        .filter(u => !attendeeIds.includes(u.id))
        .map(player => ({
          ...player,
          attendanceCount: statsMap.get(player.id)?.attendance_count || 0
        }))
        .sort((a, b) => {
          // First, sort by attendance count (descending)
          const countDiff = b.attendanceCount - a.attendanceCount;
          if (countDiff !== 0) return countDiff;

          // Then alphabetically by name
          return a.name.localeCompare(b.name);
        })
    : [];

  const getPaymentStatusBadge = (paymentStatus) => {
    if (!paymentStatus || paymentStatus === 'unpaid') {
      return <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">Unpaid</span>;
    } else if (paymentStatus === 'pending_confirmation') {
      return <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Pending</span>;
    } else if (paymentStatus === 'paid') {
      return <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Paid</span>;
    }
    return null;
  };

  const isPastSession = new Date(session.session_date) < new Date();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h3 className="text-lg font-semibold">Session Details</h3>
            {isPastSession && (
              <p className="text-sm text-gray-500">Past Session - You can still add/remove attendance</p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Session Information */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Session Information</h4>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium">Type:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  session.session_type === 'Adults'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                  {session.session_type}
                </span>
              </div>
              <p>
                <span className="font-medium">Date:</span>{' '}
                {new Date(session.session_date).toLocaleDateString('en-GB', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
              <p><span className="font-medium">Time:</span> {session.session_time}</p>
              <p>
                <span className="font-medium">Status:</span>{' '}
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  session.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                  session.status === 'completed' ? 'bg-green-100 text-green-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                </span>
              </p>
              {session.notes && (
                <p><span className="font-medium">Notes:</span> {session.notes}</p>
              )}
            </div>
          </div>

          {/* Add Attendance */}
          <div className="border-t pt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Add Attendance</h4>
            <div className="flex gap-2">
              <select
                value={selectedPlayerId}
                onChange={(e) => setSelectedPlayerId(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={addingAttendance || !allUsers || allUsers.length === 0}
              >
                <option value="">Select a player...</option>
                {availablePlayers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                    {user.attendanceCount > 0 ? ` (${user.attendanceCount}x)` : ''}
                    {' - ' + user.email}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddAttendance}
                disabled={!selectedPlayerId || addingAttendance}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UserPlus className="w-4 h-4" />
                Add
              </button>
            </div>
            {allUsers && availablePlayers.length === 0 && attendance.length > 0 && (
              <p className="text-sm text-gray-500 mt-2">All players with access are already registered</p>
            )}
          </div>

          {/* Attendance List */}
          <div className="border-t pt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Attendance ({attendance.length})
            </h4>
            {loading ? (
              <LoadingSpinner />
            ) : attendance.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">No attendance recorded yet</p>
                <p className="text-xs text-gray-400 mt-1">Use the form above to add players</p>
              </div>
            ) : (
              <div className="space-y-2">
                {attendance.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{record.player?.name}</span>
                        {record.self_registered && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                            Self-registered
                          </span>
                        )}
                        {getPaymentStatusBadge(record.payment_status)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {record.player?.email}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveAttendance(record.id, record.player?.name)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Remove attendance"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment Summary */}
          {attendance.length > 0 && (
            <div className="border-t pt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Payment Summary</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs text-yellow-700 font-medium">Unpaid</p>
                  <p className="text-xl font-bold text-yellow-900">
                    {attendance.filter(a => !a.payment_status || a.payment_status === 'unpaid').length}
                  </p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-700 font-medium">Pending</p>
                  <p className="text-xl font-bold text-blue-900">
                    {attendance.filter(a => a.payment_status === 'pending_confirmation').length}
                  </p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-xs text-green-700 font-medium">Paid</p>
                  <p className="text-xl font-bold text-green-900">
                    {attendance.filter(a => a.payment_status === 'paid').length}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionDetailsModal;
