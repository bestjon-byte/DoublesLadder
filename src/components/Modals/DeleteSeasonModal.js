// src/components/Modals/DeleteSeasonModal.js
import React, { useState } from 'react';
import { AlertTriangle, Trash2, Calendar } from 'lucide-react';

const DeleteSeasonModal = ({ 
  showModal, 
  setShowModal, 
  seasons,
  selectedSeason,
  deleteSeason
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [selectedSeasonToDelete, setSelectedSeasonToDelete] = useState('');

  if (!showModal) return null;

  const handleDeleteSeason = async () => {
    if (!selectedSeasonToDelete) {
      alert('Please select a season to delete.');
      return;
    }

    const seasonToDelete = seasons.find(s => s.id === selectedSeasonToDelete);
    if (!seasonToDelete) {
      alert('Selected season not found.');
      return;
    }

    const confirmationText = `DELETE ${seasonToDelete.name}`;
    if (confirmText !== confirmationText) {
      alert(`Please type exactly: ${confirmationText}`);
      return;
    }

    // Final confirmation dialogs
    const firstConfirm = window.confirm(
      `⚠️ FINAL WARNING: This will permanently delete "${seasonToDelete.name}" and ALL associated data:\n\n` +
      `• All matches and results for this season\n` +
      `• All player rankings for this season\n` +
      `• All availability records for this season\n` +
      `• The entire season record\n\n` +
      `This action CANNOT be undone!\n\n` +
      `Click OK to proceed with deletion.`
    );

    if (!firstConfirm) return;

    const secondConfirm = window.confirm(
      `🚨 LAST CHANCE: You are about to permanently delete season "${seasonToDelete.name}".\n\n` +
      `This will remove ALL DATA for this season from the database forever.\n\n` +
      `Are you absolutely certain you want to continue?`
    );

    if (!secondConfirm) return;

    setDeleting(true);
    try {
      const result = await deleteSeason(seasonToDelete.id, seasonToDelete.name);
      if (result?.success) {
        alert(`✅ Season "${seasonToDelete.name}" has been permanently deleted.`);
        setShowModal(false);
        setConfirmText('');
        setSelectedSeasonToDelete('');
      } else {
        console.error('Season deletion failed:', result?.error);
        const errorMsg = result?.error?.message || result?.error?.details || result?.error || 'Unknown error';
        alert(`❌ Failed to delete season: ${errorMsg}\n\nPlease try again or contact support.`);
      }
    } catch (error) {
      console.error('Error deleting season:', error);
      alert('❌ Error deleting season: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  const selectedSeasonObj = seasons.find(s => s.id === selectedSeasonToDelete);
  const confirmationText = selectedSeasonObj ? `DELETE ${selectedSeasonObj.name}` : '';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-red-200 bg-red-50">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-red-100 p-2 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-red-900">⚠️ Delete Season</h3>
            </div>
            <button
              onClick={() => setShowModal(false)}
              className="text-red-400 hover:text-red-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>
          <p className="text-sm text-red-700 mt-2 font-medium">
            🚨 DANGER: This action will permanently delete all season data and cannot be undone!
          </p>
        </div>

        <div className="p-6 overflow-y-auto max-h-96">
          {/* Warning Section */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-red-900 mb-2">This will permanently delete:</h4>
                <ul className="text-sm text-red-800 space-y-1">
                  <li>• All matches and match fixtures for the season</li>
                  <li>• All match results and scores</li>
                  <li>• All player rankings and ladder positions</li>
                  <li>• All player availability records</li>
                  <li>• The entire season record and history</li>
                </ul>
                <p className="text-sm text-red-900 font-semibold mt-3">
                  ⚠️ Users will NOT be deleted, only their season-specific data
                </p>
              </div>
            </div>
          </div>

          {/* Season Selection */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Select Season to Delete:
            </label>
            <select
              value={selectedSeasonToDelete}
              onChange={(e) => {
                setSelectedSeasonToDelete(e.target.value);
                setConfirmText(''); // Reset confirmation text when season changes
              }}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">Choose a season...</option>
              {seasons.map(season => (
                <option key={season.id} value={season.id}>
                  {season.name} ({season.status}) - Started: {new Date(season.start_date).toLocaleDateString('en-GB')}
                  {season.id === selectedSeason?.id ? ' [CURRENTLY SELECTED]' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Confirmation Text Input */}
          {selectedSeasonToDelete && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Type exactly: <span className="text-red-600 font-mono">{confirmationText}</span>
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={confirmationText}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono"
              />
              {confirmText && confirmText !== confirmationText && (
                <p className="text-red-600 text-sm mt-1">
                  ❌ Text doesn't match. Please type exactly: {confirmationText}
                </p>
              )}
              {confirmText === confirmationText && (
                <p className="text-green-600 text-sm mt-1">
                  ✅ Confirmation text matches
                </p>
              )}
            </div>
          )}

          {/* Selected Season Info */}
          {selectedSeasonObj && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="w-4 h-4 text-gray-600" />
                <h4 className="font-medium text-gray-900">Season to be deleted:</h4>
              </div>
              <div className="text-sm text-gray-700">
                <p><strong>Name:</strong> {selectedSeasonObj.name}</p>
                <p><strong>Status:</strong> {selectedSeasonObj.status}</p>
                <p><strong>Started:</strong> {new Date(selectedSeasonObj.start_date).toLocaleDateString('en-GB')}</p>
                {selectedSeasonObj.end_date && (
                  <p><strong>Ended:</strong> {new Date(selectedSeasonObj.end_date).toLocaleDateString('en-GB')}</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex space-x-3">
            <button
              onClick={handleDeleteSeason}
              disabled={deleting || !selectedSeasonToDelete || confirmText !== confirmationText}
              className="flex-1 bg-red-600 text-white py-3 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold flex items-center justify-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>{deleting ? 'Deleting Season...' : 'DELETE SEASON PERMANENTLY'}</span>
            </button>
            <button
              onClick={() => {
                setShowModal(false);
                setConfirmText('');
                setSelectedSeasonToDelete('');
              }}
              disabled={deleting}
              className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-400 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteSeasonModal;