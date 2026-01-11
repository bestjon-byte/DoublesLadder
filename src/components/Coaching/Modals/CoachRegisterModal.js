import React, { useState, useEffect } from 'react';
import { X, Check, Users, Calendar, Clock, Save, AlertCircle } from 'lucide-react';
import { useAppToast } from '../../../contexts/ToastContext';
import { LoadingSpinner } from '../../shared/LoadingSpinner';
import { formatTime, getSessionTypeColors } from '../../../utils/timeFormatter';
import { supabase } from '../../../supabaseClient';

const CoachRegisterModal = ({ isOpen, onClose, session, schedule, actions, currentUser }) => {
  const { success, error: showError } = useAppToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enrolledPlayers, setEnrolledPlayers] = useState([]);
  const [attendance, setAttendance] = useState({}); // { playerId: boolean }
  const [initialAttendance, setInitialAttendance] = useState({});

  useEffect(() => {
    if (isOpen && session) {
      loadData();
    }
  }, [isOpen, session]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Get enrolled players for this session's schedule
      let players = [];

      if (session.schedule_id) {
        const { data: enrollments, error: enrollError } = await supabase
          .from('coaching_schedule_enrollments')
          .select(`
            *,
            player:profiles!coaching_schedule_enrollments_player_id_fkey(id, name, is_junior)
          `)
          .eq('schedule_id', session.schedule_id)
          .eq('is_active', true);

        if (enrollError) throw enrollError;
        players = (enrollments || []).map(e => e.player);
      }

      // Get current attendance for this session
      const { data: currentAttendance, error: attendError } = await supabase
        .from('coaching_attendance')
        .select('player_id')
        .eq('session_id', session.id);

      if (attendError) throw attendError;

      // Build attendance map
      const attendanceMap = {};
      (currentAttendance || []).forEach(a => {
        attendanceMap[a.player_id] = true;
      });

      // If no enrolled players but we have attendance, fetch those players
      if (players.length === 0 && currentAttendance?.length > 0) {
        const playerIds = currentAttendance.map(a => a.player_id);
        const { data: attendedPlayers, error: playersError } = await supabase
          .from('profiles')
          .select('id, name, is_junior')
          .in('id', playerIds);

        if (!playersError) {
          players = attendedPlayers || [];
        }
      }

      setEnrolledPlayers(players);
      setAttendance(attendanceMap);
      setInitialAttendance(attendanceMap);
    } catch (err) {
      console.error('Error loading register data:', err);
      showError('Failed to load register data');
    } finally {
      setLoading(false);
    }
  };

  const toggleAttendance = (playerId) => {
    setAttendance(prev => ({
      ...prev,
      [playerId]: !prev[playerId]
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Find changes
      const toAdd = [];
      const toRemove = [];

      enrolledPlayers.forEach(player => {
        const wasAttending = initialAttendance[player.id] || false;
        const isAttending = attendance[player.id] || false;

        if (isAttending && !wasAttending) {
          toAdd.push(player.id);
        } else if (!isAttending && wasAttending) {
          toRemove.push(player.id);
        }
      });

      // Determine payment status based on session cost
      const sessionCost = parseFloat(session.session_cost) || parseFloat(schedule?.session_cost) || 4.00;
      const paymentStatus = sessionCost === 0 ? 'paid' : 'unpaid';

      // Add new attendance records
      if (toAdd.length > 0) {
        const { error: addError } = await supabase
          .from('coaching_attendance')
          .insert(
            toAdd.map(playerId => ({
              session_id: session.id,
              player_id: playerId,
              marked_by: currentUser.id,
              self_registered: false,
              payment_status: paymentStatus,
            }))
          );

        if (addError) throw addError;
      }

      // Remove attendance records
      if (toRemove.length > 0) {
        const { error: removeError } = await supabase
          .from('coaching_attendance')
          .delete()
          .eq('session_id', session.id)
          .in('player_id', toRemove);

        if (removeError) throw removeError;
      }

      const totalChanges = toAdd.length + toRemove.length;
      if (totalChanges > 0) {
        success(`Register saved - ${Object.values(attendance).filter(Boolean).length} attended`);
      } else {
        success('No changes to save');
      }

      onClose();
    } catch (err) {
      console.error('Error saving register:', err);
      showError('Failed to save register');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const displayName = schedule?.schedule_name || session.session_type;
  const sessionDate = new Date(session.session_date);
  const colors = getSessionTypeColors(session.session_type);
  const attendedCount = Object.values(attendance).filter(Boolean).length;
  const hasChanges = JSON.stringify(attendance) !== JSON.stringify(initialAttendance);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Take Register</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Session Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors.bg} ${colors.text}`}>
                {session.session_type}
              </span>
              {schedule?.schedule_name && (
                <span className="font-semibold text-gray-900">{schedule.schedule_name}</span>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {sessionDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatTime(session.session_time)}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="p-12">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6">
            {enrolledPlayers.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                <h4 className="font-medium text-gray-900 mb-2">No Players Enrolled</h4>
                <p className="text-sm text-gray-600">
                  No players are enrolled in this schedule.
                  <br />
                  Ask an admin to enroll players first.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {enrolledPlayers.map(player => {
                  const isAttending = attendance[player.id] || false;
                  return (
                    <button
                      key={player.id}
                      onClick={() => toggleAttendance(player.id)}
                      className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                        isAttending
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          isAttending
                            ? 'border-green-500 bg-green-500 text-white'
                            : 'border-gray-300'
                        }`}>
                          {isAttending && <Check className="w-4 h-4" />}
                        </div>
                        <span className="font-medium text-gray-900">{player.name}</span>
                        {player.is_junior && (
                          <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs">
                            Junior
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">
                Attended: <strong className="text-gray-900">{attendedCount}</strong>
                {enrolledPlayers.length > 0 && ` / ${enrolledPlayers.length}`}
              </span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || enrolledPlayers.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? (
                  'Saving...'
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Register
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoachRegisterModal;
