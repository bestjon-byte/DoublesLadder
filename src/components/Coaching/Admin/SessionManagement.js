import React, { useState } from 'react';
import { Calendar, Plus, Edit, X, Check, Eye } from 'lucide-react';
import { useAppToast } from '../../../contexts/ToastContext';
import SessionModal from '../Modals/SessionModal';
import SessionDetailsModal from '../Modals/SessionDetailsModal';
import { LoadingSpinner } from '../../shared/LoadingSpinner';

const SessionManagement = ({ sessions, schedules, loading, actions, currentUser }) => {
  const { success, error } = useAppToast();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewingSession, setViewingSession] = useState(null);
  const [filter, setFilter] = useState('upcoming'); // 'upcoming', 'past', 'cancelled', 'all'

  const handleCancel = async (session) => {
    const reason = window.prompt('Enter cancellation reason (optional):');
    if (reason === null) return; // User clicked cancel

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

  if (loading) {
    return <LoadingSpinner />;
  }

  // Filter sessions
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
            const attendanceCount = session.attendance?.[0]?.count || 0;
            return (
              <div
                key={session.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
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
                      <span className="text-gray-600">at {session.session_time}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Attendees: {attendanceCount}</span>
                      {session.schedule && (
                        <span className="text-xs text-gray-500">(Auto-generated)</span>
                      )}
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
                      onClick={() => setViewingSession(session)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="View details"
                    >
                      <Eye className="w-4 h-4" />
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
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Cancel session"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
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

      {viewingSession && (
        <SessionDetailsModal
          isOpen={!!viewingSession}
          onClose={() => setViewingSession(null)}
          session={viewingSession}
          actions={actions}
        />
      )}
    </div>
  );
};

export default SessionManagement;
