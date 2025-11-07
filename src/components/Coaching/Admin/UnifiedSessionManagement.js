import React, { useState } from 'react';
import { Calendar, Plus, X, Check, Trash2, ChevronDown, ChevronUp, UserPlus, Users } from 'lucide-react';
import { useAppToast } from '../../../contexts/ToastContext';
import SessionModal from '../Modals/SessionModal';
import MarkAttendanceModal from '../Modals/MarkAttendanceModal';
import { LoadingSpinner } from '../../shared/LoadingSpinner';

const UnifiedSessionManagement = ({ sessions, schedules, loading, attendance, actions, allUsers, currentUser }) => {
  const { success, error } = useAppToast();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedSessions, setExpandedSessions] = useState(new Set());
  const [markingAttendanceFor, setMarkingAttendanceFor] = useState(null);
  const [filter, setFilter] = useState('upcoming'); // 'upcoming', 'past', 'cancelled', 'all'

  const formatTime = (time24) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'pm' : 'am';
    const hour12 = hour % 12 || 12;
    return `${hour12}${minutes !== '00' ? ':' + minutes : ''}${ampm}`;
  };

  const toggleSession = (sessionId) => {
    setExpandedSessions(prev => {
      const next = new Set(prev);
      if (next.has(sessionId)) {
        next.delete(sessionId);
      } else {
        next.add(sessionId);
      }
      return next;
    });
  };

  const handleCancel = async (session) => {
    const reason = window.prompt('Enter cancellation reason (optional):');
    if (reason === null) return;

    const result = await actions.cancelSession(session.id, reason);
    if (result.error) {
      error('Failed to cancel session');
    } else {
      success('Session cancelled successfully');
    }
  };

  const handleComplete = async (sessionId) => {
    if (!window.confirm('Mark this session as completed?')) return;

    const result = await actions.completeSession(sessionId);
    if (result.error) {
      error('Failed to complete session');
    } else {
      success('Session marked as completed');
    }
  };

  const handleDelete = async (session) => {
    const sessionAttendance = attendance.filter(a => a.session_id === session.id);
    const confirmMsg = sessionAttendance.length > 0
      ? `This session has ${sessionAttendance.length} attendee(s). Are you sure you want to permanently delete it?`
      : 'Are you sure you want to permanently delete this session?';

    if (!window.confirm(confirmMsg)) return;

    const result = await actions.deleteSession(session.id);
    if (result.error) {
      error('Failed to delete session');
    } else {
      success('Session deleted successfully');
    }
  };

  const handleRemoveAttendance = async (attendanceRecord, sessionId) => {
    if (!window.confirm(`Remove ${attendanceRecord.player?.name}'s attendance?`)) return;

    const result = await actions.removeAttendance(attendanceRecord.id);
    if (result.error) {
      error('Failed to remove attendance');
    } else {
      success('Attendance removed');
      actions.fetchAttendance();
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  // Filter and sort sessions
  const today = new Date().toISOString().split('T')[0];
  const filteredSessions = sessions.filter(session => {
    if (filter === 'upcoming') {
      return session.session_date >= today && session.status === 'scheduled';
    } else if (filter === 'past') {
      return session.session_date < today || session.status === 'completed';
    } else if (filter === 'cancelled') {
      return session.status === 'cancelled';
    }
    return true; // 'all'
  }).sort((a, b) => {
    if (filter === 'upcoming') {
      return new Date(a.session_date) - new Date(b.session_date);
    } else {
      return new Date(b.session_date) - new Date(a.session_date);
    }
  });

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          {['upcoming', 'past', 'cancelled', 'all'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`
                px-4 py-2 rounded-md font-medium transition-colors
                ${filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Session
        </button>
      </div>

      {/* Sessions List */}
      {filteredSessions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No {filter !== 'all' && filter} sessions found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSessions.map((session) => {
            const sessionAttendance = attendance.filter(a => a.session_id === session.id);
            const isExpanded = expandedSessions.has(session.id);

            return (
              <div
                key={session.id}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Session Header */}
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`
                          px-3 py-1 rounded-full text-sm font-medium
                          ${session.session_type === 'Adults'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-green-100 text-green-700'
                          }
                        `}>
                          {session.session_type}
                        </span>
                        {getStatusBadge(session.status)}
                        <span className="text-gray-900 font-medium">
                          {new Date(session.session_date).toLocaleDateString('en-GB', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                        <span className="text-gray-600">at {formatTime(session.session_time)}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <button
                          onClick={() => toggleSession(session.id)}
                          className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                        >
                          <Users className="w-4 h-4" />
                          <span>{sessionAttendance.length} attendee{sessionAttendance.length !== 1 ? 's' : ''}</span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                        {session.notes && (
                          <span className="text-gray-500">• {session.notes}</span>
                        )}
                      </div>
                      {session.status === 'cancelled' && session.cancellation_reason && (
                        <p className="text-sm text-red-600 mt-2">
                          Cancelled: {session.cancellation_reason}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setMarkingAttendanceFor(session)}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                        title="Add attendee"
                      >
                        <UserPlus className="w-4 h-4" />
                        Add
                      </button>
                      {session.status === 'scheduled' && (
                        <>
                          <button
                            onClick={() => handleComplete(session.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                            title="Mark as completed"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleCancel(session)}
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-md transition-colors"
                            title="Cancel session"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(session)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete session permanently"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Attendance Section */}
                {isExpanded && (
                  <div className="border-t border-gray-200 bg-gray-50 p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Attendance</h4>

                    {sessionAttendance.length === 0 ? (
                      <div className="text-center py-6 text-gray-500 text-sm">
                        No attendance recorded yet
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {sessionAttendance.map((record) => (
                          <div
                            key={record.id}
                            className="flex items-center justify-between py-2 px-3 bg-white rounded border border-gray-200"
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
                              onClick={() => handleRemoveAttendance(record, session.id)}
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
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <SessionModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            actions.fetchSessions();
          }}
          actions={actions}
        />
      )}

      {markingAttendanceFor && (
        <MarkAttendanceModal
          isOpen={!!markingAttendanceFor}
          onClose={() => setMarkingAttendanceFor(null)}
          session={markingAttendanceFor}
          allUsers={allUsers}
          actions={actions}
          onSuccess={() => {
            setMarkingAttendanceFor(null);
            actions.fetchAttendance();
          }}
        />
      )}
    </div>
  );
};

export default UnifiedSessionManagement;
