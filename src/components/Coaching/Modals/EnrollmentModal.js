import React, { useState, useEffect } from 'react';
import { X, UserPlus, UserMinus, Users, Search, Phone, Mail } from 'lucide-react';
import { useAppToast } from '../../../contexts/ToastContext';
import { LoadingSpinner } from '../../shared/LoadingSpinner';
import { supabase } from '../../../supabaseClient';

const EnrollmentModal = ({ isOpen, onClose, schedule, actions }) => {
  const { success, error: showError } = useAppToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enrolledPlayers, setEnrolledPlayers] = useState([]);
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showJuniorsOnly, setShowJuniorsOnly] = useState(schedule?.is_junior_session || false);

  // Load data on mount
  useEffect(() => {
    if (isOpen && schedule) {
      loadData();
    }
  }, [isOpen, schedule]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch enrolled players
      const { data: enrolled, error: enrollError } = await actions.getScheduleEnrollments(schedule.id);
      if (enrollError) throw enrollError;
      setEnrolledPlayers(enrolled || []);

      // Fetch all players for selection
      const { data: allPlayers, error: playersError } = await supabase
        .from('profiles')
        .select('id, name, email, is_junior, parent_name, parent_phone')
        .eq('status', 'approved')
        .order('name');

      if (playersError) throw playersError;

      // Filter out already enrolled players
      const enrolledIds = new Set((enrolled || []).map(e => e.player?.id || e.player_id));
      const available = (allPlayers || []).filter(p => !enrolledIds.has(p.id));
      setAvailablePlayers(available);
    } catch (err) {
      console.error('Error loading enrollment data:', err);
      showError('Failed to load enrollment data');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (player) => {
    setSaving(true);
    try {
      const { error } = await actions.enrollPlayer(schedule.id, player.id);
      if (error) throw error;

      // Update local state
      setEnrolledPlayers(prev => [...prev, { player }]);
      setAvailablePlayers(prev => prev.filter(p => p.id !== player.id));
      success(`${player.name} enrolled successfully`);
    } catch (err) {
      showError('Failed to enroll player');
    } finally {
      setSaving(false);
    }
  };

  const handleUnenroll = async (enrollment) => {
    const player = enrollment.player;
    if (!window.confirm(`Remove ${player.name} from this schedule?`)) {
      return;
    }

    setSaving(true);
    try {
      const { error } = await actions.unenrollPlayer(schedule.id, player.id);
      if (error) throw error;

      // Update local state
      setEnrolledPlayers(prev => prev.filter(e => e.player?.id !== player.id));
      setAvailablePlayers(prev => [...prev, player].sort((a, b) => a.name.localeCompare(b.name)));
      success(`${player.name} removed from schedule`);
    } catch (err) {
      showError('Failed to remove player');
    } finally {
      setSaving(false);
    }
  };

  // Filter available players
  const filteredAvailable = availablePlayers.filter(player => {
    const matchesSearch = !searchTerm ||
      player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (player.email && player.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesJuniorFilter = !showJuniorsOnly || player.is_junior;

    return matchesSearch && matchesJuniorFilter;
  });

  if (!isOpen) return null;

  const displayName = schedule.schedule_name || schedule.session_type;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Manage Enrollment
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {displayName} - {schedule.session_type}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {loading ? (
          <div className="p-12">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Enrolled Players Section */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                Enrolled Players
                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-sm">
                  {enrolledPlayers.length}
                </span>
              </h4>

              {enrolledPlayers.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Users className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">No players enrolled yet</p>
                  <p className="text-sm text-gray-500">Add players from the list below</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {enrolledPlayers.map((enrollment) => {
                    const player = enrollment.player;
                    return (
                      <div
                        key={player?.id || enrollment.player_id}
                        className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{player?.name}</span>
                            {player?.is_junior && (
                              <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs">
                                Junior
                              </span>
                            )}
                          </div>
                          {player?.is_junior && player?.parent_name && (
                            <div className="text-xs text-gray-600 mt-1 flex items-center gap-3">
                              <span>Parent: {player.parent_name}</span>
                              {player?.parent_phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {player.parent_phone}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleUnenroll(enrollment)}
                          disabled={saving}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-md transition-colors"
                          title="Remove from schedule"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Divider */}
            <hr className="border-gray-200" />

            {/* Add Players Section */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Add Players</h4>

              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search players..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showJuniorsOnly}
                    onChange={(e) => setShowJuniorsOnly(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-500"
                  />
                  Juniors only
                </label>
              </div>

              {/* Available Players List */}
              {filteredAvailable.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 rounded-lg">
                  <p className="text-gray-600">
                    {searchTerm || showJuniorsOnly
                      ? 'No matching players found'
                      : 'All players are already enrolled'}
                  </p>
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-2">
                  {filteredAvailable.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{player.name}</span>
                          {player.is_junior && (
                            <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs">
                              Junior
                            </span>
                          )}
                        </div>
                        {!player.email?.includes('@skeleton.local') && (
                          <p className="text-xs text-gray-500">{player.email}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleEnroll(player)}
                        disabled={saving}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        <UserPlus className="w-4 h-4" />
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnrollmentModal;
