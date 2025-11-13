import React, { useState } from 'react';
import { Plus, Edit, Trash2, Calendar, RefreshCw } from 'lucide-react';
import { useAppToast } from '../../../contexts/ToastContext';
import ScheduleModal from '../Modals/ScheduleModal';
import GenerateSessionsModal from '../Modals/GenerateSessionsModal';
import { LoadingSpinner } from '../../shared/LoadingSpinner';
import { formatTime, getSessionTypeColors } from '../../../utils/timeFormatter';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const ScheduleManagement = ({ schedules, loading, actions, currentUser }) => {
  const { success, error } = useAppToast();
  const [showModal, setShowModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [generating, setGenerating] = useState(false);

  const handleCreate = () => {
    setEditingSchedule(null);
    setShowModal(true);
  };

  const handleEdit = (schedule) => {
    setEditingSchedule(schedule);
    setShowModal(true);
  };

  const handleDeactivate = async (scheduleId) => {
    if (!window.confirm('Are you sure you want to deactivate this schedule? Future sessions will no longer be generated.')) {
      return;
    }

    const result = await actions.deactivateSchedule(scheduleId);
    if (result.error) {
      error('Failed to deactivate schedule');
    } else {
      success('Schedule deactivated successfully');
    }
  };

  const handleOpenGenerateModal = () => {
    setShowGenerateModal(true);
  };

  const handleGenerateSessions = async (startDate, weeksAhead, scheduleIds) => {
    setGenerating(true);
    const result = await actions.generateSessions(weeksAhead, startDate, scheduleIds);

    if (result.error) {
      setGenerating(false);
      error('Failed to generate sessions: ' + result.error.message);
    } else {
      // Refresh the sessions list after generating
      await actions.fetchSessions();
      setGenerating(false);
      const count = result.data?.length || 0;
      success(`Generated ${count} new session${count !== 1 ? 's' : ''}`);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const activeSchedules = schedules.filter(s => s.is_active);
  const inactiveSchedules = schedules.filter(s => !s.is_active);

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">
          Schedules <span className="text-sm sm:text-base text-gray-600">({activeSchedules.length} active)</span>
        </h3>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <button
            onClick={handleOpenGenerateModal}
            disabled={generating || activeSchedules.length === 0}
            className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white text-sm sm:text-base rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            {generating ? (
              <RefreshCw className="w-4 h-4 animate-spin flex-shrink-0" />
            ) : (
              <Calendar className="w-4 h-4 flex-shrink-0" />
            )}
            <span className="hidden sm:inline">Generate Sessions</span>
            <span className="sm:hidden">Generate</span>
          </button>
          <button
            onClick={handleCreate}
            className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white text-sm sm:text-base rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4 flex-shrink-0" />
            <span className="hidden sm:inline">New Schedule</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </div>

      {/* Active Schedules */}
      {activeSchedules.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">No active schedules</p>
          <button
            onClick={handleCreate}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Create your first schedule
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {activeSchedules.map((schedule) => {
            const colors = getSessionTypeColors(schedule.session_type);
            return (
              <div
                key={schedule.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${colors.bg} ${colors.text}`}>
                        {schedule.session_type}
                      </span>
                      <span className="text-gray-900 font-medium whitespace-nowrap">
                        Every {DAY_NAMES[schedule.day_of_week]}
                      </span>
                      <span className="text-gray-600 whitespace-nowrap">
                        at {formatTime(schedule.session_time)}
                      </span>
                    </div>
                  {schedule.notes && (
                    <p className="text-sm text-gray-600">{schedule.notes}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Created {new Date(schedule.created_at).toLocaleDateString('en-GB')}
                  </p>
                </div>
                <div className="flex gap-2 self-end sm:self-start">
                  <button
                    onClick={() => handleEdit(schedule)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors flex-shrink-0"
                    title="Edit schedule"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeactivate(schedule.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors flex-shrink-0"
                    title="Deactivate schedule"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* Inactive Schedules */}
      {inactiveSchedules.length > 0 && (
        <div className="mt-8">
          <h4 className="text-md font-semibold text-gray-700 mb-3">
            Inactive Schedules ({inactiveSchedules.length})
          </h4>
          <div className="space-y-2">
            {inactiveSchedules.map((schedule) => (
              <div
                key={schedule.id}
                className="bg-gray-50 border border-gray-200 rounded-lg p-3 opacity-60"
              >
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 rounded text-xs font-medium bg-gray-200 text-gray-700">
                    {schedule.session_type}
                  </span>
                  <span className="text-sm text-gray-600">
                    Every {DAY_NAMES[schedule.day_of_week]} at {schedule.session_time}
                  </span>
                  <span className="text-xs text-gray-500">
                    (Deactivated {new Date(schedule.deactivated_at).toLocaleDateString('en-GB')})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <ScheduleModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          schedule={editingSchedule}
          onSuccess={() => {
            setShowModal(false);
            actions.fetchSchedules();
          }}
          actions={actions}
        />
      )}

      {showGenerateModal && (
        <GenerateSessionsModal
          isOpen={showGenerateModal}
          onClose={() => setShowGenerateModal(false)}
          onGenerate={handleGenerateSessions}
          activeSchedules={activeSchedules}
        />
      )}
    </div>
  );
};

export default ScheduleManagement;
