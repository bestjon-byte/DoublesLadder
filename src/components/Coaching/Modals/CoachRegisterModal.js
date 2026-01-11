import React, { useState, useEffect, useMemo } from 'react';
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
  const [recentAttendance, setRecentAttendance] = useState({}); // { playerId: { count, attendedLast } }

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

      // Fetch recent attendance history for smart sorting (last 4 sessions of same type)
      const recentAttendanceMap = {};
      if (players.length > 0 && session.session_type) {
        // Get last 4 sessions of this type (excluding current)
        const { data: recentSessions, error: recentError } = await supabase
          .from('coaching_sessions')
          .select('id, session_date')
          .eq('session_type', session.session_type)
          .neq('id', session.id)
          .eq('status', 'scheduled')
          .order('session_date', { ascending: false })
          .limit(4);

        if (!recentError && recentSessions?.length > 0) {
          const recentSessionIds = recentSessions.map(s => s.id);
          const lastSessionId = recentSessionIds[0];

          // Get attendance for these sessions
          const { data: recentAtt, error: recentAttError } = await supabase
            .from('coaching_attendance')
            .select('player_id, session_id')
            .in('session_id', recentSessionIds);

          if (!recentAttError && recentAtt) {
            // Build attendance stats per player
            players.forEach(player => {
              const playerAtt = recentAtt.filter(a => a.player_id === player.id);
              recentAttendanceMap[player.id] = {
                count: playerAtt.length,
                attendedLast: playerAtt.some(a => a.session_id === lastSessionId),
                total: recentSessions.length
              };
            });
          }
        }
      }

      setEnrolledPlayers(players);
      setAttendance(attendanceMap);
      setInitialAttendance(attendanceMap);
      setRecentAttendance(recentAttendanceMap);
    } catch (err) {
      console.error('Error loading register data:', err);
      showError('Failed to load register data');
    } finally {
      setLoading(false);
    }
  };

  // Smart sort: ticked first, then by recent attendance, then alphabetical
  const sortedPlayers = useMemo(() => {
    return [...enrolledPlayers].sort((a, b) => {
      // 1. Currently marked attending - top
      const aAttending = attendance[a.id] ? 1 : 0;
      const bAttending = attendance[b.id] ? 1 : 0;
      if (aAttending !== bAttending) return bAttending - aAttending;

      // 2. Attended last session
      const aLast = recentAttendance[a.id]?.attendedLast ? 1 : 0;
      const bLast = recentAttendance[b.id]?.attendedLast ? 1 : 0;
      if (aLast !== bLast) return bLast - aLast;

      // 3. By recent attendance count
      const aCount = recentAttendance[a.id]?.count || 0;
      const bCount = recentAttendance[b.id]?.count || 0;
      if (aCount !== bCount) return bCount - aCount;

      // 4. Alphabetical
      return a.name.localeCompare(b.name);
    });
  }, [enrolledPlayers, attendance, recentAttendance]);

  // Get attendance indicator for a player
  const getAttendanceIndicator = (playerId) => {
    const stats = recentAttendance[playerId];
    if (!stats) return { color: 'bg-gray-300', label: 'New' };

    if (stats.count === 0) {
      return { color: 'bg-gray-300', label: 'New' };
    } else if (stats.attendedLast && stats.count >= 2) {
      return { color: 'bg-green-500', label: 'Regular' };
    } else if (stats.attendedLast) {
      return { color: 'bg-blue-500', label: 'Last week' };
    } else if (stats.count >= 2) {
      return { color: 'bg-yellow-500', label: 'Sometimes' };
    } else {
      return { color: 'bg-gray-400', label: 'Occasional' };
    }
  };

  const [justToggled, setJustToggled] = useState(null);

  const toggleAttendance = (playerId) => {
    setAttendance(prev => ({
      ...prev,
      [playerId]: !prev[playerId]
    }));
    // Brief visual feedback
    setJustToggled(playerId);
    setTimeout(() => setJustToggled(null), 200);
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

  // Format date compactly for mobile
  const formatCompactDate = (date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
      {/* Full-screen on mobile, centered modal on desktop */}
      <div className="bg-white w-full sm:max-w-lg sm:mx-4 sm:rounded-lg shadow-xl h-full sm:h-auto sm:max-h-[90vh] flex flex-col">
        {/* Compact Header - optimized for mobile */}
        <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${colors.bg} ${colors.text}`}>
                {session.session_type}
              </span>
              {schedule?.schedule_name && (
                <span className="font-semibold text-gray-900 truncate">{schedule.schedule_name}</span>
              )}
              <span className="text-gray-400">•</span>
              <span className="text-sm text-gray-600 whitespace-nowrap">
                {formatCompactDate(sessionDate)} {formatTime(session.session_time)}
              </span>
            </div>
            <button
              onClick={onClose}
              className="ml-2 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content - scrollable player list */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {sortedPlayers.length === 0 ? (
              <div className="text-center py-12 px-6">
                <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                <h4 className="font-medium text-gray-900 mb-2">No Players Enrolled</h4>
                <p className="text-sm text-gray-600">
                  No players are enrolled in this schedule.
                  <br />
                  Ask an admin to enroll players first.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {sortedPlayers.map(player => {
                  const isAttending = attendance[player.id] || false;
                  const indicator = getAttendanceIndicator(player.id);

                  return (
                    <button
                      key={player.id}
                      onClick={() => toggleAttendance(player.id)}
                      className={`w-full flex items-center gap-4 px-4 py-4 sm:py-3 transition-all active:scale-[0.98] ${
                        justToggled === player.id
                          ? 'bg-green-100'
                          : isAttending
                            ? 'bg-green-50'
                            : 'bg-white'
                      }`}
                    >
                      {/* Checkbox - larger for touch */}
                      <div className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                        isAttending
                          ? 'border-green-500 bg-green-500 text-white scale-110'
                          : 'border-gray-300 bg-white'
                      }`}>
                        {isAttending && <Check className="w-4 h-4" strokeWidth={3} />}
                      </div>

                      {/* Player info */}
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium truncate ${isAttending ? 'text-green-900' : 'text-gray-900'}`}>
                            {player.name}
                          </span>
                          {player.is_junior && (
                            <span className="flex-shrink-0 bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded text-xs font-medium">
                              Jr
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Attendance indicator dot */}
                      <div className="flex-shrink-0 flex items-center gap-1.5" title={indicator.label}>
                        <span className={`w-2.5 h-2.5 rounded-full ${indicator.color}`}></span>
                        <span className="text-xs text-gray-400 hidden sm:inline">{indicator.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Sticky Footer - always visible */}
        <div className="flex-shrink-0 px-4 py-3 border-t border-gray-200 bg-white safe-area-inset-bottom">
          <div className="flex items-center justify-between gap-4">
            {/* Attendance count - prominent */}
            <div className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                attendedCount > 0 ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                <span className={`text-lg font-bold ${attendedCount > 0 ? 'text-green-700' : 'text-gray-500'}`}>
                  {attendedCount}
                </span>
              </div>
              <span className="text-sm text-gray-500">
                / {sortedPlayers.length} present
              </span>
            </div>

            {/* Save button - large touch target */}
            <button
              onClick={handleSave}
              disabled={saving || sortedPlayers.length === 0}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                hasChanges
                  ? 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800'
                  : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
              } disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]`}
            >
              {saving ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Save</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoachRegisterModal;
