import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

/**
 * Custom hook for managing coaching sessions, schedules, attendance, and payments
 * @param {string} userId - Current user ID
 * @param {boolean} isAdmin - Whether current user is admin
 */
export const useCoaching = (userId, isAdmin = false) => {
  const [state, setState] = useState({
    schedules: [],
    sessions: [],
    attendance: [],
    payments: [],
    accessList: [],
    loading: {
      schedules: false,
      sessions: false,
      attendance: false,
      payments: false,
      access: false,
    },
    error: null,
  });

  // Helper to update loading state
  const setLoading = useCallback((key, value) => {
    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, [key]: value }
    }));
  }, []);

  // Helper to update data
  const updateData = useCallback((key, value) => {
    setState(prev => ({ ...prev, [key]: value }));
  }, []);

  // ==========================================================================
  // SCHEDULES MANAGEMENT
  // ==========================================================================

  /**
   * Fetch all coaching schedules (admin sees all, users see only active)
   */
  const fetchSchedules = useCallback(async () => {
    setLoading('schedules', true);
    try {
      let query = supabase
        .from('coaching_schedules')
        .select('*')
        .order('day_of_week', { ascending: true });

      if (!isAdmin) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      updateData('schedules', data || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      updateData('error', error.message);
    } finally {
      setLoading('schedules', false);
    }
  }, [isAdmin, setLoading, updateData]);

  /**
   * Create a new recurring schedule
   */
  const createSchedule = useCallback(async (scheduleData) => {
    try {
      const { data, error } = await supabase
        .from('coaching_schedules')
        .insert([{
          ...scheduleData,
          created_by: userId,
        }])
        .select()
        .single();

      if (error) throw error;
      await fetchSchedules();
      return { data, error: null };
    } catch (error) {
      console.error('Error creating schedule:', error);
      return { data: null, error };
    }
  }, [userId, fetchSchedules]);

  /**
   * Update an existing schedule
   */
  const updateSchedule = useCallback(async (scheduleId, updates) => {
    try {
      const { data, error } = await supabase
        .from('coaching_schedules')
        .update(updates)
        .eq('id', scheduleId)
        .select()
        .single();

      if (error) throw error;
      await fetchSchedules();
      return { data, error: null };
    } catch (error) {
      console.error('Error updating schedule:', error);
      return { data: null, error };
    }
  }, [fetchSchedules]);

  /**
   * Deactivate a schedule (soft delete)
   */
  const deactivateSchedule = useCallback(async (scheduleId) => {
    try {
      const { error } = await supabase
        .from('coaching_schedules')
        .update({
          is_active: false,
          deactivated_at: new Date().toISOString(),
        })
        .eq('id', scheduleId);

      if (error) throw error;
      await fetchSchedules();
      return { error: null };
    } catch (error) {
      console.error('Error deactivating schedule:', error);
      return { error };
    }
  }, [fetchSchedules]);

  /**
   * Generate upcoming sessions from active schedules
   */
  const generateSessions = useCallback(async (weeksAhead = 4) => {
    try {
      const { data, error } = await supabase
        .rpc('generate_coaching_sessions', { weeks_ahead: weeksAhead });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error generating sessions:', error);
      return { data: null, error };
    }
  }, []);

  // ==========================================================================
  // SESSIONS MANAGEMENT
  // ==========================================================================

  /**
   * Fetch coaching sessions
   */
  const fetchSessions = useCallback(async (filters = {}) => {
    setLoading('sessions', true);
    try {
      let query = supabase
        .from('coaching_sessions')
        .select(`
          *,
          attendance:coaching_attendance(count),
          schedule:coaching_schedules(session_type, day_of_week)
        `)
        .order('session_date', { ascending: false });

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.session_type) {
        query = query.eq('session_type', filters.session_type);
      }
      if (filters.dateFrom) {
        query = query.gte('session_date', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('session_date', filters.dateTo);
      }

      const { data, error } = await query;

      if (error) throw error;
      updateData('sessions', data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      updateData('error', error.message);
    } finally {
      setLoading('sessions', false);
    }
  }, [setLoading, updateData]);

  /**
   * Create a manual session (not from schedule)
   */
  const createSession = useCallback(async (sessionData) => {
    try {
      const { data, error } = await supabase
        .from('coaching_sessions')
        .insert([{
          ...sessionData,
          created_by: userId,
          schedule_id: null, // Manual session
        }])
        .select()
        .single();

      if (error) throw error;
      await fetchSessions();
      return { data, error: null };
    } catch (error) {
      console.error('Error creating session:', error);
      return { data: null, error };
    }
  }, [userId, fetchSessions]);

  /**
   * Update a session
   */
  const updateSession = useCallback(async (sessionId, updates) => {
    try {
      const { data, error } = await supabase
        .from('coaching_sessions')
        .update(updates)
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      await fetchSessions();
      return { data, error: null };
    } catch (error) {
      console.error('Error updating session:', error);
      return { data: null, error };
    }
  }, [fetchSessions]);

  /**
   * Cancel a session
   */
  const cancelSession = useCallback(async (sessionId, reason = '') => {
    return updateSession(sessionId, {
      status: 'cancelled',
      cancellation_reason: reason,
    });
  }, [updateSession]);

  /**
   * Mark session as completed
   */
  const completeSession = useCallback(async (sessionId) => {
    return updateSession(sessionId, { status: 'completed' });
  }, [updateSession]);

  /**
   * Delete a session completely
   */
  const deleteSession = useCallback(async (sessionId) => {
    try {
      const { error } = await supabase
        .from('coaching_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;
      await fetchSessions();
      return { error: null };
    } catch (error) {
      console.error('Error deleting session:', error);
      return { error };
    }
  }, [fetchSessions]);

  // ==========================================================================
  // ATTENDANCE MANAGEMENT
  // ==========================================================================

  /**
   * Fetch attendance records
   */
  const fetchAttendance = useCallback(async (filters = {}) => {
    setLoading('attendance', true);
    try {
      let query = supabase
        .from('coaching_attendance')
        .select(`
          *,
          player:profiles!coaching_attendance_player_id_fkey(id, name, email),
          session:coaching_sessions(id, session_date, session_time, session_type, status),
          marked_by_user:profiles!coaching_attendance_marked_by_fkey(id, name)
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.sessionId) {
        query = query.eq('session_id', filters.sessionId);
      }
      if (filters.playerId) {
        query = query.eq('player_id', filters.playerId);
      }

      const { data, error } = await query;

      if (error) throw error;
      updateData('attendance', data || []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      updateData('error', error.message);
    } finally {
      setLoading('attendance', false);
    }
  }, [setLoading, updateData]);

  /**
   * Mark attendance (admin or self-registration)
   */
  const markAttendance = useCallback(async (sessionId, playerId, selfRegistered = false) => {
    try {
      const { data, error } = await supabase
        .from('coaching_attendance')
        .insert([{
          session_id: sessionId,
          player_id: playerId,
          marked_by: userId,
          self_registered: selfRegistered,
        }])
        .select()
        .single();

      if (error) throw error;
      await fetchAttendance();
      return { data, error: null };
    } catch (error) {
      console.error('Error marking attendance:', error);
      return { data: null, error };
    }
  }, [userId, fetchAttendance]);

  /**
   * Remove attendance record
   */
  const removeAttendance = useCallback(async (attendanceId) => {
    try {
      const { error } = await supabase
        .from('coaching_attendance')
        .delete()
        .eq('id', attendanceId);

      if (error) throw error;
      await fetchAttendance();
      return { error: null };
    } catch (error) {
      console.error('Error removing attendance:', error);
      return { error };
    }
  }, [fetchAttendance]);

  /**
   * Get attendance for a specific session
   */
  const getSessionAttendance = useCallback(async (sessionId) => {
    try {
      const { data, error } = await supabase
        .from('coaching_attendance')
        .select(`
          *,
          player:profiles!coaching_attendance_player_id_fkey(id, name, email)
        `)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error fetching session attendance:', error);
      return { data: [], error };
    }
  }, []);

  // ==========================================================================
  // PAYMENT MANAGEMENT
  // ==========================================================================

  /**
   * Fetch payment records
   */
  const fetchPayments = useCallback(async (filters = {}) => {
    setLoading('payments', true);
    try {
      let query = supabase
        .from('coaching_payments')
        .select(`
          *,
          player:profiles!coaching_payments_player_id_fkey(id, name, email),
          sessions:coaching_payment_sessions(
            session:coaching_sessions(id, session_date, session_type)
          )
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.playerId) {
        query = query.eq('player_id', filters.playerId);
      }

      const { data, error } = await query;

      if (error) throw error;
      updateData('payments', data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      updateData('error', error.message);
    } finally {
      setLoading('payments', false);
    }
  }, [setLoading, updateData]);

  /**
   * Get unpaid sessions for a player
   */
  const getUnpaidSessions = useCallback(async (playerId, periodStart = null, periodEnd = null) => {
    try {
      const { data, error } = await supabase
        .rpc('get_unpaid_coaching_sessions', {
          p_player_id: playerId,
          p_billing_period_start: periodStart,
          p_billing_period_end: periodEnd,
        });

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error fetching unpaid sessions:', error);
      return { data: [], error };
    }
  }, []);

  /**
   * Create a payment request
   */
  const createPaymentRequest = useCallback(async (playerId, periodStart, periodEnd, deadline = null) => {
    try {
      const { data, error } = await supabase
        .rpc('create_coaching_payment_request', {
          p_player_id: playerId,
          p_billing_period_start: periodStart,
          p_billing_period_end: periodEnd,
          p_created_by: userId,
          p_payment_deadline: deadline,
        });

      if (error) throw error;
      await fetchPayments();
      return { data, error: null };
    } catch (error) {
      console.error('Error creating payment request:', error);
      return { data: null, error };
    }
  }, [userId, fetchPayments]);

  /**
   * Mark payment as received
   */
  const markPaymentReceived = useCallback(async (paymentId, reference = '') => {
    try {
      const { data, error } = await supabase
        .from('coaching_payments')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          marked_paid_by: userId,
          payment_reference: reference,
        })
        .eq('id', paymentId)
        .select()
        .single();

      if (error) throw error;
      await fetchPayments();
      return { data, error: null };
    } catch (error) {
      console.error('Error marking payment received:', error);
      return { data: null, error };
    }
  }, [userId, fetchPayments]);

  /**
   * Send payment reminder (updates reminder_sent_at timestamp)
   */
  const sendPaymentReminder = useCallback(async (paymentId) => {
    try {
      const { data, error } = await supabase
        .from('coaching_payments')
        .update({
          reminder_sent_at: new Date().toISOString(),
        })
        .eq('id', paymentId)
        .select()
        .single();

      if (error) throw error;
      await fetchPayments();
      return { data, error: null };
    } catch (error) {
      console.error('Error updating reminder timestamp:', error);
      return { data: null, error };
    }
  }, [fetchPayments]);

  /**
   * User marks payment as paid (pending admin confirmation)
   */
  const userMarkPaymentPaid = useCallback(async (paymentId, note = '') => {
    try {
      const { data, error } = await supabase
        .rpc('user_mark_payment_paid', {
          p_payment_id: paymentId,
          p_user_id: userId,
          p_note: note,
        });

      if (error) throw error;
      await fetchPayments();
      return { data, error: null };
    } catch (error) {
      console.error('Error marking payment as paid:', error);
      return { data: null, error };
    }
  }, [userId, fetchPayments]);

  /**
   * Get payment statistics
   */
  const getPaymentStatistics = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_payment_statistics');

      if (error) throw error;
      return { data: data?.[0] || null, error: null };
    } catch (error) {
      console.error('Error fetching payment statistics:', error);
      return { data: null, error };
    }
  }, []);

  // ==========================================================================
  // ACCESS CONTROL
  // ==========================================================================

  /**
   * Fetch coaching access list
   */
  const fetchAccessList = useCallback(async () => {
    setLoading('access', true);
    try {
      const { data, error } = await supabase
        .from('coaching_access')
        .select(`
          *,
          player:profiles!coaching_access_player_id_fkey(id, name, email),
          granted_by_user:profiles!coaching_access_granted_by_fkey(id, name)
        `)
        .order('granted_at', { ascending: false });

      if (error) throw error;
      updateData('accessList', data || []);
    } catch (error) {
      console.error('Error fetching access list:', error);
      updateData('error', error.message);
    } finally {
      setLoading('access', false);
    }
  }, [setLoading, updateData]);

  /**
   * Grant coaching access to a player
   */
  const grantAccess = useCallback(async (playerId, notes = '') => {
    try {
      const { data, error } = await supabase
        .from('coaching_access')
        .insert([{
          player_id: playerId,
          granted_by: userId,
          notes,
        }])
        .select()
        .single();

      if (error) throw error;
      await fetchAccessList();
      return { data, error: null };
    } catch (error) {
      console.error('Error granting access:', error);
      return { data: null, error };
    }
  }, [userId, fetchAccessList]);

  /**
   * Revoke coaching access
   */
  const revokeAccess = useCallback(async (playerId) => {
    try {
      const { data, error } = await supabase
        .from('coaching_access')
        .update({
          revoked_at: new Date().toISOString(),
        })
        .eq('player_id', playerId)
        .select()
        .single();

      if (error) throw error;
      await fetchAccessList();
      return { data, error: null };
    } catch (error) {
      console.error('Error revoking access:', error);
      return { data: null, error };
    }
  }, [fetchAccessList]);

  /**
   * Check if current user has coaching access
   */
  const checkUserAccess = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('coaching_access')
        .select('*')
        .eq('player_id', userId)
        .is('revoked_at', null)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      return { hasAccess: !!data, data, error: null };
    } catch (error) {
      console.error('Error checking user access:', error);
      return { hasAccess: false, data: null, error };
    }
  }, [userId]);

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================

  useEffect(() => {
    if (userId) {
      if (isAdmin) {
        // Admins fetch everything
        fetchSchedules();
        fetchSessions();
        fetchAttendance();
        fetchPayments();
        fetchAccessList();
      } else {
        // Regular users only fetch what they need
        checkUserAccess().then(({ hasAccess }) => {
          if (hasAccess) {
            fetchSchedules();
            fetchSessions({ status: 'scheduled' }); // Only upcoming sessions
            fetchAttendance({ playerId: userId }); // Only their attendance
            fetchPayments({ playerId: userId }); // Only their payments
          }
        });
      }
    }
  }, [userId, isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  // ==========================================================================
  // RETURN API
  // ==========================================================================

  return {
    // State
    schedules: state.schedules,
    sessions: state.sessions,
    attendance: state.attendance,
    payments: state.payments,
    accessList: state.accessList,
    loading: state.loading,
    error: state.error,

    // Actions
    actions: {
      // Schedules
      fetchSchedules,
      createSchedule,
      updateSchedule,
      deactivateSchedule,
      generateSessions,

      // Sessions
      fetchSessions,
      createSession,
      updateSession,
      cancelSession,
      completeSession,
      deleteSession,

      // Attendance
      fetchAttendance,
      markAttendance,
      removeAttendance,
      getSessionAttendance,

      // Payments
      fetchPayments,
      getUnpaidSessions,
      createPaymentRequest,
      markPaymentReceived,
      sendPaymentReminder,
      userMarkPaymentPaid,
      getPaymentStatistics,

      // Access Control
      fetchAccessList,
      grantAccess,
      revokeAccess,
      checkUserAccess,
    },
  };
};

export default useCoaching;
