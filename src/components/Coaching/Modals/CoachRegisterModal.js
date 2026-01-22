import React, { useState, useEffect, useMemo } from 'react';
import { X, Check, Users, Calendar, Clock, Save, AlertCircle, UserPlus, Search, UserMinus } from 'lucide-react';
import { useAppToast } from '../../../contexts/ToastContext';
import { LoadingSpinner } from '../../shared/LoadingSpinner';
import { formatTime, getSessionTypeColors } from '../../../utils/timeFormatter';
import { supabase, supabaseUrl } from '../../../supabaseClient';

const CoachRegisterModal = ({ isOpen, onClose, session, schedule, actions, currentUser }) => {
  const { success, error: showError } = useAppToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enrolledPlayers, setEnrolledPlayers] = useState([]);
  const [attendance, setAttendance] = useState({}); // { playerId: boolean }
  const [initialAttendance, setInitialAttendance] = useState({});
  const [recentAttendance, setRecentAttendance] = useState({}); // { playerId: { count, attendedLast } }

  // New person modal state
  const [showAddNewPerson, setShowAddNewPerson] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  const [addingNewPerson, setAddingNewPerson] = useState(false);

  // Member search state
  const [allMembers, setAllMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  // Unenroll state
  const [unenrolling, setUnenrolling] = useState(null); // player id being unenrolled

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
        // Get last 4 sessions of this type (excluding current) - include completed sessions
        const { data: recentSessions, error: recentError } = await supabase
          .from('coaching_sessions')
          .select('id, session_date')
          .eq('session_type', session.session_type)
          .neq('id', session.id)
          .in('status', ['scheduled', 'completed'])
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
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [swipingPlayer, setSwipingPlayer] = useState(null);
  const [swipeOffset, setSwipeOffset] = useState(0);

  // Minimum swipe distance to trigger action (in px)
  const minSwipeDistance = 50;

  const toggleAttendance = (playerId, forceValue = null) => {
    setAttendance(prev => ({
      ...prev,
      [playerId]: forceValue !== null ? forceValue : !prev[playerId]
    }));
    // Brief visual feedback
    setJustToggled(playerId);
    setTimeout(() => setJustToggled(null), 200);
  };

  const onTouchStart = (e, playerId) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setSwipingPlayer(playerId);
  };

  const onTouchMove = (e, playerId) => {
    if (!touchStart || swipingPlayer !== playerId) return;
    const currentTouch = e.targetTouches[0].clientX;
    const diff = currentTouch - touchStart;
    // Limit the swipe offset visually
    setSwipeOffset(Math.max(-80, Math.min(80, diff)));
    setTouchEnd(currentTouch);
  };

  const onTouchEnd = (playerId) => {
    if (!touchStart || !touchEnd) {
      resetSwipe();
      return;
    }

    const distance = touchEnd - touchStart;
    const isRightSwipe = distance > minSwipeDistance;
    const isLeftSwipe = distance < -minSwipeDistance;

    if (isRightSwipe) {
      // Swipe right = mark present
      toggleAttendance(playerId, true);
    } else if (isLeftSwipe) {
      // Swipe left = mark absent
      toggleAttendance(playerId, false);
    }

    resetSwipe();
  };

  const resetSwipe = () => {
    setTouchStart(null);
    setTouchEnd(null);
    setSwipingPlayer(null);
    setSwipeOffset(0);
  };

  // Load all members when "Add New Person" modal opens
  const loadAllMembers = async () => {
    setLoadingMembers(true);
    try {
      // Get all approved profiles (excluding those already enrolled)
      const enrolledIds = enrolledPlayers.map(p => p.id);

      const { data: members, error } = await supabase
        .from('profiles')
        .select('id, name, is_junior, email')
        .eq('status', 'approved')
        .order('name');

      if (error) throw error;

      // Filter out already enrolled players
      const availableMembers = (members || []).filter(m => !enrolledIds.includes(m.id));
      setAllMembers(availableMembers);
    } catch (err) {
      console.error('Error loading members:', err);
    } finally {
      setLoadingMembers(false);
    }
  };

  // Open the add person modal and load members
  const openAddPersonModal = () => {
    setShowAddNewPerson(true);
    setNewPersonName('');
    setSelectedMember(null);
    loadAllMembers();
  };

  // Filter members based on search input
  const filteredMembers = useMemo(() => {
    if (!newPersonName.trim() || newPersonName.length < 2) return [];

    const searchTerm = newPersonName.toLowerCase().trim();
    return allMembers
      .filter(m => m.name?.toLowerCase().includes(searchTerm))
      .slice(0, 8); // Limit to 8 results for performance
  }, [newPersonName, allMembers]);

  // Handle enrolling an existing member
  const handleEnrollExistingMember = async (member) => {
    setAddingNewPerson(true);
    setSelectedMember(member);
    try {
      // Enroll the member in this schedule (if there's a schedule)
      if (session.schedule_id) {
        const { error: enrollError } = await supabase
          .from('coaching_schedule_enrollments')
          .insert({
            schedule_id: session.schedule_id,
            player_id: member.id,
            is_active: true
          });

        // Ignore duplicate errors (might already be enrolled from another path)
        if (enrollError && !enrollError.message.includes('duplicate')) {
          throw enrollError;
        }
      }

      // Get the session cost for payment status
      const sessionCost = parseFloat(session.session_cost) || parseFloat(schedule?.session_cost) || 4.00;
      const paymentStatus = sessionCost === 0 ? 'paid' : 'unpaid';

      // Add attendance record
      const { error: attendError } = await supabase
        .from('coaching_attendance')
        .insert({
          session_id: session.id,
          player_id: member.id,
          marked_by: currentUser.id,
          self_registered: false,
          payment_status: paymentStatus,
        });

      if (attendError) throw attendError;

      // Add to local state
      setEnrolledPlayers(prev => [...prev, member]);
      setAttendance(prev => ({ ...prev, [member.id]: true }));
      setInitialAttendance(prev => ({ ...prev, [member.id]: true }));
      setRecentAttendance(prev => ({
        ...prev,
        [member.id]: { count: 0, attendedLast: false, total: 0 }
      }));

      success(`${member.name} enrolled and marked present`);
      setNewPersonName('');
      setSelectedMember(null);
      setShowAddNewPerson(false);
    } catch (err) {
      console.error('Error enrolling member:', err);
      showError('Failed to enroll member');
    } finally {
      setAddingNewPerson(false);
      setSelectedMember(null);
    }
  };

  // Handle adding a new person (skeleton account)
  const handleAddNewPerson = async () => {
    if (!newPersonName.trim()) {
      showError('Please enter a name');
      return;
    }

    setAddingNewPerson(true);
    try {
      // Create skeleton profile via RPC
      const { data: newProfileId, error: createError } = await supabase
        .rpc('create_skeleton_profile', {
          p_name: newPersonName.trim(),
          p_created_by: currentUser.id,
          p_session_id: session.id
        });

      if (createError) throw createError;

      // Get the session cost for payment status
      const sessionCost = parseFloat(session.session_cost) || parseFloat(schedule?.session_cost) || 4.00;
      const paymentStatus = sessionCost === 0 ? 'paid' : 'unpaid';

      // Add attendance record for new person
      const { error: attendError } = await supabase
        .from('coaching_attendance')
        .insert({
          session_id: session.id,
          player_id: newProfileId,
          marked_by: currentUser.id,
          self_registered: false,
          payment_status: paymentStatus,
        });

      if (attendError) throw attendError;

      // Add the new person to our local state
      const newPlayer = {
        id: newProfileId,
        name: newPersonName.trim(),
        is_junior: false,
        is_skeleton: true
      };

      setEnrolledPlayers(prev => [...prev, newPlayer]);
      setAttendance(prev => ({ ...prev, [newProfileId]: true }));
      setInitialAttendance(prev => ({ ...prev, [newProfileId]: true }));
      setRecentAttendance(prev => ({
        ...prev,
        [newProfileId]: { count: 0, attendedLast: false, total: 0 }
      }));

      // Send admin notification email
      try {
        const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
        await fetch(
          `${supabaseUrl}/functions/v1/notify-skeleton-account`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': anonKey,
              'Authorization': `Bearer ${anonKey}`,
            },
            body: JSON.stringify({
              profile_id: newProfileId,
              name: newPersonName.trim(),
              session_id: session.id,
              session_type: session.session_type,
              session_date: session.session_date,
              created_by_name: currentUser.name
            }),
          }
        );
      } catch (emailError) {
        console.warn('Failed to send admin notification email:', emailError);
        // Don't fail the whole operation if email fails
      }

      success(`${newPersonName.trim()} added and marked present`);
      setNewPersonName('');
      setShowAddNewPerson(false);
    } catch (err) {
      console.error('Error adding new person:', err);
      showError('Failed to add new person');
    } finally {
      setAddingNewPerson(false);
    }
  };

  // Handle unenrolling a player from the schedule
  const handleUnenroll = async (player) => {
    if (!session.schedule_id) {
      showError('Cannot unenroll - no schedule linked');
      return;
    }

    if (!window.confirm(`Remove ${player.name} from this group? They won't appear on future registers.`)) {
      return;
    }

    setUnenrolling(player.id);
    try {
      const { error } = await supabase
        .from('coaching_schedule_enrollments')
        .update({ is_active: false })
        .eq('schedule_id', session.schedule_id)
        .eq('player_id', player.id);

      if (error) throw error;

      // Remove from local state
      setEnrolledPlayers(prev => prev.filter(p => p.id !== player.id));
      // Remove from attendance if they were marked
      setAttendance(prev => {
        const next = { ...prev };
        delete next[player.id];
        return next;
      });
      setInitialAttendance(prev => {
        const next = { ...prev };
        delete next[player.id];
        return next;
      });

      success(`${player.name} removed from group`);
    } catch (err) {
      console.error('Error unenrolling player:', err);
      showError('Failed to remove from group');
    } finally {
      setUnenrolling(null);
    }
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
            {/* Add New Person Button - Always visible at top */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3">
              <button
                onClick={openAddPersonModal}
                className="w-full flex items-center justify-center gap-3 px-4 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold text-lg shadow-md active:scale-[0.98] transition-all"
              >
                <UserPlus className="w-6 h-6" />
                <span>Add Someone</span>
              </button>
            </div>

            {sortedPlayers.length === 0 ? (
              <div className="text-center py-12 px-6">
                <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                <h4 className="font-medium text-gray-900 mb-2">No Players Enrolled</h4>
                <p className="text-sm text-gray-600">
                  No players are enrolled in this schedule.
                  <br />
                  Use "Add New Person" above to register someone.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {sortedPlayers.map(player => {
                  const isAttending = attendance[player.id] || false;
                  const indicator = getAttendanceIndicator(player.id);
                  const isCurrentlySwiping = swipingPlayer === player.id;
                  const currentOffset = isCurrentlySwiping ? swipeOffset : 0;

                  return (
                    <div key={player.id} className="relative overflow-hidden">
                      {/* Swipe background indicators */}
                      <div className="absolute inset-y-0 left-0 w-20 bg-green-500 flex items-center justify-start pl-4">
                        <Check className="w-6 h-6 text-white" />
                      </div>
                      <div className="absolute inset-y-0 right-0 w-20 bg-red-400 flex items-center justify-end pr-4">
                        <X className="w-6 h-6 text-white" />
                      </div>

                      {/* Main row - swipeable */}
                      <button
                        onClick={() => !isCurrentlySwiping && toggleAttendance(player.id)}
                        onTouchStart={(e) => onTouchStart(e, player.id)}
                        onTouchMove={(e) => onTouchMove(e, player.id)}
                        onTouchEnd={() => onTouchEnd(player.id)}
                        style={{ transform: `translateX(${currentOffset}px)` }}
                        className={`relative w-full flex items-center gap-4 px-4 ${session.schedule_id ? 'pr-12' : ''} py-4 sm:py-3 transition-colors ${
                          isCurrentlySwiping ? '' : 'transition-transform'
                        } active:scale-[0.99] ${
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
                            {player.is_skeleton && (
                              <span className="flex-shrink-0 bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded text-xs font-medium">
                                New
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

                      {/* Unenroll button - only show if schedule exists */}
                      {session.schedule_id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnenroll(player);
                          }}
                          disabled={unenrolling === player.id}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors z-10"
                          title="Remove from group"
                        >
                          {unenrolling === player.id ? (
                            <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <UserMinus className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
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

      {/* Add Person Modal - Mobile-optimized bottom sheet with member search */}
      {showAddNewPerson && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-[60]">
          <div className="bg-white w-full max-w-lg rounded-t-2xl shadow-2xl animate-slide-up max-h-[85vh] flex flex-col">
            {/* Handle bar for visual affordance */}
            <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-6 pb-4 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Add Someone</h3>
                    <p className="text-sm text-gray-500">Search members or add new</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowAddNewPerson(false);
                    setNewPersonName('');
                    setSelectedMember(null);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="px-6 pt-4 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                  placeholder="Type a name to search..."
                  autoFocus
                  autoComplete="off"
                  autoCapitalize="words"
                  className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all placeholder-gray-400"
                />
              </div>
            </div>

            {/* Content area - scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {loadingMembers ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  {/* Matching members list */}
                  {filteredMembers.length > 0 && (
                    <div className="space-y-2 mb-4">
                      <p className="text-sm font-medium text-gray-600 mb-3">
                        Existing members matching "{newPersonName}":
                      </p>
                      {filteredMembers.map(member => (
                        <button
                          key={member.id}
                          onClick={() => handleEnrollExistingMember(member)}
                          disabled={addingNewPerson}
                          className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                            selectedMember?.id === member.id
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 active:bg-blue-100'
                          } ${addingNewPerson ? 'opacity-50' : ''}`}
                        >
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-blue-600 font-bold text-lg">
                              {member.name?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{member.name}</p>
                            <p className="text-sm text-gray-500 truncate">
                              {member.is_junior ? 'Junior' : 'Adult'}
                              {member.email && ` • ${member.email}`}
                            </p>
                          </div>
                          {selectedMember?.id === member.id && addingNewPerson ? (
                            <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <div className="flex-shrink-0 bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-sm font-medium">
                              Enrol
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Divider when there are results */}
                  {filteredMembers.length > 0 && newPersonName.trim().length >= 2 && (
                    <div className="flex items-center gap-3 my-4">
                      <div className="flex-1 h-px bg-gray-200" />
                      <span className="text-sm text-gray-400">or</span>
                      <div className="flex-1 h-px bg-gray-200" />
                    </div>
                  )}

                  {/* No results message */}
                  {newPersonName.trim().length >= 2 && filteredMembers.length === 0 && (
                    <div className="text-center py-4 mb-4">
                      <p className="text-gray-500 text-sm">
                        No existing members found matching "{newPersonName}"
                      </p>
                    </div>
                  )}

                  {/* Create new person option - shown when there's text input */}
                  {newPersonName.trim().length >= 2 && (
                    <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
                      <p className="text-sm text-amber-800 mb-3">
                        <strong>Not a member?</strong> Add them as a new person. Admin will be notified to complete their details.
                      </p>
                      <button
                        onClick={handleAddNewPerson}
                        disabled={addingNewPerson && !selectedMember}
                        className="w-full px-4 py-3 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 active:bg-amber-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                      >
                        {addingNewPerson && !selectedMember ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Adding...</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-5 h-5" />
                            <span>Add "{newPersonName.trim()}" as New Person</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Hint when not enough characters */}
                  {newPersonName.trim().length < 2 && (
                    <div className="text-center py-8">
                      <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">
                        Type at least 2 characters to search
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer with Cancel */}
            <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0 safe-area-inset-bottom">
              <button
                onClick={() => {
                  setShowAddNewPerson(false);
                  setNewPersonName('');
                  setSelectedMember(null);
                }}
                className="w-full px-4 py-3 text-gray-700 bg-gray-100 rounded-xl font-semibold hover:bg-gray-200 active:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoachRegisterModal;
