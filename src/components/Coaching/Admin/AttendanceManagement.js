import React, { useState } from 'react';
import { UserCheck, Plus, Trash2 } from 'lucide-react';
import { useAppToast } from '../../../contexts/ToastContext';
import MarkAttendanceModal from '../Modals/MarkAttendanceModal';
import { LoadingSpinner } from '../../shared/LoadingSpinner';

const AttendanceManagement = ({ sessions, attendance, loading, actions, allUsers, currentUser }) => {
  const { success, error } = useAppToast();
  const [showModal, setShowModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);

  const handleMarkAttendance = (session) => {
    setSelectedSession(session);
    setShowModal(true);
  };

  const handleRemoveAttendance = async (attendanceRecord) => {
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

  // Group attendance by session - show last 30 days + future sessions
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

  const recentSessions = sessions
    .filter(s => s.session_date >= thirtyDaysAgoStr && s.status !== 'cancelled')
    .sort((a, b) => new Date(b.session_date) - new Date(a.session_date))
    .slice(0, 20); // Increased from 10 to 20 to show more sessions

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Recent Sessions</h3>
          <p className="text-sm text-gray-600">Last 30 days and upcoming sessions</p>
        </div>
      </div>

      {recentSessions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No sessions found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {recentSessions.map((session) => {
            const sessionAttendance = attendance.filter(a => a.session_id === session.id);
            return (
              <div
                key={session.id}
                className="bg-white border border-gray-200 rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`
                        px-2 py-1 rounded text-xs font-medium
                        ${session.session_type === 'Adults' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}
                      `}>
                        {session.session_type}
                      </span>
                      <span className="font-medium">
                        {new Date(session.session_date).toLocaleDateString('en-GB')}
                      </span>
                      <span className="text-gray-600 text-sm">at {session.session_time}</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {sessionAttendance.length} attendee{sessionAttendance.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => handleMarkAttendance(session)}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Mark Attendance
                  </button>
                </div>

                {sessionAttendance.length > 0 && (
                  <div className="border-t border-gray-200 pt-3 mt-3">
                    <div className="space-y-2">
                      {sessionAttendance.map((record) => (
                        <div key={record.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                          <div className="flex items-center gap-3">
                            <span className="font-medium">{record.player?.name}</span>
                            {record.self_registered && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                Self-registered
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => handleRemoveAttendance(record)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showModal && selectedSession && (
        <MarkAttendanceModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedSession(null);
          }}
          session={selectedSession}
          allUsers={allUsers}
          actions={actions}
          onSuccess={() => {
            setShowModal(false);
            setSelectedSession(null);
            actions.fetchAttendance();
          }}
        />
      )}
    </div>
  );
};

export default AttendanceManagement;
