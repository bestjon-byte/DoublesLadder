import React, { useState } from 'react';
import { X, Search } from 'lucide-react';
import { useAppToast } from '../../../contexts/ToastContext';

const GrantAccessModal = ({ isOpen, onClose, onSuccess, actions, allUsers, existingAccess }) => {
  const { success, error } = useAppToast();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPlayerId) return;

    setLoading(true);
    try {
      const result = await actions.grantAccess(selectedPlayerId, notes);
      if (result.error) throw result.error;

      success('Coaching access granted successfully');
      onSuccess();
    } catch (err) {
      error(err.message || 'Failed to grant access');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const activeAccessPlayerIds = new Set(
    existingAccess.filter(a => !a.revoked_at).map(a => a.player_id)
  );
  const availablePlayers = allUsers
    .filter(u => !activeAccessPlayerIds.has(u.id))
    .filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold">Grant Coaching Access</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Player</label>
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

          <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md">
            {availablePlayers.length === 0 ? (
              <p className="text-center py-8 text-gray-500">
                {searchTerm ? 'No players found' : 'All players already have access'}
              </p>
            ) : (
              availablePlayers.map((player) => (
                <label
                  key={player.id}
                  className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <input
                    type="radio"
                    name="player"
                    value={player.id}
                    checked={selectedPlayerId === player.id}
                    onChange={(e) => setSelectedPlayerId(e.target.value)}
                    className="mr-3"
                  />
                  <span className="font-medium">{player.name}</span>
                </label>
              ))
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5D1F1F] focus:border-transparent"
              placeholder="e.g., Registered for beginner coaching"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedPlayerId}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Granting...' : 'Grant Access'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GrantAccessModal;
