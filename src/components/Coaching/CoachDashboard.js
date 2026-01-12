import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, Users, CheckCircle, ChevronRight } from 'lucide-react';
import { useCoaching } from '../../hooks/useCoaching';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { formatTime, getSessionTypeColors } from '../../utils/timeFormatter';
import CoachRegisterModal from './Modals/CoachRegisterModal';

const CoachDashboard = ({ currentUser }) => {
  const { sessions, schedules, loading, actions } = useCoaching(currentUser?.id, false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // Group sessions by date category
  const groupedSessions = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const todaySessions = [];
    const upcomingSessions = [];
    const pastSessions = []; // All past sessions (not cancelled)

    sessions.forEach(session => {
      const sessionDate = new Date(session.session_date);
      sessionDate.setHours(0, 0, 0, 0);

      if (session.status === 'cancelled') return;

      if (sessionDate.getTime() === today.getTime()) {
        todaySessions.push(session);
      } else if (sessionDate > today && sessionDate <= nextWeek) {
        upcomingSessions.push(session);
      } else if (sessionDate < today) {
        pastSessions.push(session);
      }
    });

    // Sort by date/time
    const sortByDateTime = (a, b) => {
      const dateCompare = new Date(a.session_date) - new Date(b.session_date);
      if (dateCompare !== 0) return dateCompare;
      return a.session_time.localeCompare(b.session_time);
    };

    todaySessions.sort(sortByDateTime);
    upcomingSessions.sort(sortByDateTime);
    pastSessions.sort((a, b) => -sortByDateTime(a, b)); // Most recent first

    // Get the most recent past session per schedule (so coach can catch up on each group)
    // Plus any sessions from the last 7 days
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const recentSessions = [];
    const seenSchedules = new Set();

    for (const session of pastSessions) {
      const sessionDate = new Date(session.session_date);
      sessionDate.setHours(0, 0, 0, 0);

      // Always include sessions from last 7 days
      if (sessionDate >= lastWeek) {
        recentSessions.push(session);
        seenSchedules.add(session.schedule_id);
      } else if (!seenSchedules.has(session.schedule_id)) {
        // For older sessions, include the most recent one per schedule
        recentSessions.push(session);
        seenSchedules.add(session.schedule_id);
      }
    }

    return { todaySessions, upcomingSessions, recentSessions };
  }, [sessions]);

  const handleOpenRegister = (session) => {
    setSelectedSession(session);
    setShowRegisterModal(true);
  };

  const formatSessionDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    }
  };

  if (loading.sessions || loading.schedules) {
    return (
      <div className="p-8">
        <LoadingSpinner />
      </div>
    );
  }

  const SessionCard = ({ session, showDate = false, isRecent = false }) => {
    const colors = getSessionTypeColors(session.session_type);
    const schedule = schedules.find(s => s.id === session.schedule_id);
    const displayName = schedule?.schedule_name || session.session_type;
    const attendanceCount = session.attendance?.[0]?.count || 0;

    return (
      <div
        className={`bg-white border rounded-lg p-4 hover:shadow-md transition-shadow ${
          isRecent ? 'border-gray-200 opacity-80' : 'border-gray-200'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors.bg} ${colors.text}`}>
                {session.session_type}
              </span>
              {schedule?.schedule_name && (
                <span className="text-gray-900 font-semibold">
                  {schedule.schedule_name}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              {showDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatSessionDate(session.session_date)}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatTime(session.session_time)}
              </span>
              {isRecent && attendanceCount > 0 && (
                <span className="flex items-center gap-1 text-green-600">
                  <Users className="w-4 h-4" />
                  {attendanceCount} attended
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => handleOpenRegister(session)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              isRecent
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isRecent ? (
              <>
                View
                <ChevronRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Take Register
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Coach Dashboard</h1>
        <p className="text-blue-100">
          Welcome back! Take attendance for your coaching sessions.
        </p>
      </div>

      {/* Today's Sessions */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          Today
          {groupedSessions.todaySessions.length > 0 && (
            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-sm">
              {groupedSessions.todaySessions.length}
            </span>
          )}
        </h2>
        {groupedSessions.todaySessions.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <Calendar className="w-10 h-10 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">No sessions scheduled for today</p>
          </div>
        ) : (
          <div className="space-y-3">
            {groupedSessions.todaySessions.map(session => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        )}
      </section>

      {/* Upcoming Sessions */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-green-600" />
          Upcoming This Week
          {groupedSessions.upcomingSessions.length > 0 && (
            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-sm">
              {groupedSessions.upcomingSessions.length}
            </span>
          )}
        </h2>
        {groupedSessions.upcomingSessions.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <p className="text-gray-600">No upcoming sessions this week</p>
          </div>
        ) : (
          <div className="space-y-3">
            {groupedSessions.upcomingSessions.map(session => (
              <SessionCard key={session.id} session={session} showDate />
            ))}
          </div>
        )}
      </section>

      {/* Recent/Past Sessions */}
      {groupedSessions.recentSessions.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-gray-500" />
            Previous Sessions
            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-sm font-normal">
              {groupedSessions.recentSessions.length}
            </span>
          </h2>
          <p className="text-sm text-gray-500 mb-3">
            Missed recording attendance? You can still update these sessions.
          </p>
          <div className="space-y-3">
            {groupedSessions.recentSessions.slice(0, 8).map(session => (
              <SessionCard key={session.id} session={session} showDate isRecent />
            ))}
          </div>
        </section>
      )}

      {/* Register Modal */}
      {showRegisterModal && selectedSession && (
        <CoachRegisterModal
          isOpen={showRegisterModal}
          onClose={() => {
            setShowRegisterModal(false);
            setSelectedSession(null);
            // Refresh sessions to update attendance counts
            actions.fetchSessions();
          }}
          session={selectedSession}
          schedule={schedules.find(s => s.id === selectedSession.schedule_id)}
          actions={actions}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

export default CoachDashboard;
