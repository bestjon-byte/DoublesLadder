import React, { useState, useEffect } from 'react';
import { X, Search, CheckSquare, Square } from 'lucide-react';
import { useAppToast } from '../../../contexts/ToastContext';

const MarkAttendanceModal = ({ isOpen, onClose, session, allUsers, actions, onSuccess }) => {
  const { success, error } = useAppToast();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlayerIds, setSelectedPlayerIds] = useState([]);
  const [existingAttendance, setExistingAttendance] = useState([]);

  useEffect(() => {
    if (session) {
      actions.getSessionAttendance(session.id).then(result => {
        if (!result.error) {
          setExistingAttendance(result.data || []);
        }
      });
      // Reset selections when modal opens with a new session
      setSelectedPlayerIds([]);
      setSearchTerm('');
    }
  }, [session, actions]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedPlayerIds.length === 0) return;

    setLoading(true);
    try {
      let successCount = 0;
      let errorCount = 0;

      // Mark attendance for each selected player
      for (const playerId of selectedPlayerIds) {
        const result = await actions.markAttendance(session.id, playerId, false);
        if (result.error) {
          errorCount++;
        } else {
          successCount++;
        }
      }

      if (successCount > 0) {
        success(`Marked attendance for ${successCount} player${successCount !== 1 ? 's' : ''}`);
      }
      if (errorCount > 0) {
        error(`Failed to mark attendance for ${errorCount} player${errorCount !== 1 ? 's' : ''}`);
      }

      onSuccess();
    } catch (err) {
      error(err.message || 'Failed to mark attendance');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const attendedPlayerIds = new Set(existingAttendance.map(a => a.player_id));
  const availablePlayers = allUsers
    .filter(u => !attendedPlayerIds.has(u.id))
    .filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const togglePlayer = (playerId) => {
    setSelectedPlayerIds(prev =>
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  const toggleAll = () => {
    if (selectedPlayerIds.length === availablePlayers.length) {
      setSelectedPlayerIds([]);
    } else {
      setSelectedPlayerIds(availablePlayers.map(p => p.id));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold">Mark Attendance</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Session: {new Date(session.session_date).toLocaleDateString('en-GB')} at {session.session_time}
            </p>
            <p className="text-sm text-gray-600">
              Current attendance: {existingAttendance.length}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Players</label>
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name..."
                  className="w-full pl-10 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5D1F1F] focus:border-transparent"
                />
              </div>
            </div>

            {availablePlayers.length > 0 && (
              <div className="flex items-center justify-between px-1">
                <span className="text-sm text-gray-600">
                  {selectedPlayerIds.length} of {availablePlayers.length} selected
                </span>
                <button
                  type="button"
                  onClick={toggleAll}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  {selectedPlayerIds.length === availablePlayers.length ? 'Clear All' : 'Select All'}
                </button>
              </div>
            )}

            <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md">
              {availablePlayers.length === 0 ? (
                <p className="text-center py-8 text-gray-500">No players found</p>
              ) : (
                availablePlayers.map((player) => {
                  const isSelected = selectedPlayerIds.includes(player.id);
                  return (
                    <div
                      key={player.id}
                      onClick={() => togglePlayer(player.id)}
                      className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                      )}
                      <span className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                        {player.name}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || selectedPlayerIds.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Marking...' : `Mark ${selectedPlayerIds.length} Player${selectedPlayerIds.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MarkAttendanceModal;
