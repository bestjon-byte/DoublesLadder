// src/components/Modals/DeleteUserModal.js
import React, { useState } from 'react';
import { AlertTriangle, Users, Shield, UserX } from 'lucide-react';

const DeleteUserModal = ({ 
  showModal, 
  setShowModal, 
  allUsers,
  currentUser,
  deleteUser
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [selectedUserToDelete, setSelectedUserToDelete] = useState('');

  if (!showModal) return null;

  // Only show approved users (not pending or already deleted) and not the current admin user
  const availableUsers = allUsers.filter(u => 
    u.status === 'approved' && 
    u.id !== currentUser.id && // Can't delete yourself
    u.name && u.email // Has valid data to display
  );

  const handleDeleteUser = async () => {
    if (!selectedUserToDelete) {
      alert('Please select a user to delete.');
      return;
    }

    const userToDelete = availableUsers.find(u => u.id === selectedUserToDelete);
    if (!userToDelete) {
      alert('Selected user not found.');
      return;
    }

    const confirmationText = `DELETE ${userToDelete.name}`;
    if (confirmText !== confirmationText) {
      alert(`Please type exactly: ${confirmationText}`);
      return;
    }

    // Final confirmation dialogs
    const firstConfirm = window.confirm(
      `⚠️ DEACTIVATE USER: "${userToDelete.name}" (${userToDelete.email})\n\n` +
      `This will:\n` +
      `• Deactivate their account and login access\n` +
      `• Remove them from all current seasons\n` +
      `• Make them unavailable for future ladder selection\n` +
      `• Anonymize their personal information\n\n` +
      `PRESERVED:\n` +
      `• All match history and results\n` +
      `• Historical game data for statistics\n\n` +
      `This action CANNOT be easily undone!\n\n` +
      `Click OK to proceed with user deactivation.`
    );

    if (!firstConfirm) return;

    const secondConfirm = window.confirm(
      `🚨 FINAL CONFIRMATION: Deactivate "${userToDelete.name}"?\n\n` +
      `Their login will be disabled and they will be removed from the app,\n` +
      `but their match history will be preserved.\n\n` +
      `Are you absolutely certain you want to continue?`
    );

    if (!secondConfirm) return;

    setDeleting(true);
    try {
      const result = await deleteUser(userToDelete.id, userToDelete.name, userToDelete.email);
      if (result?.success) {
        alert(`✅ User "${userToDelete.name}" has been deactivated successfully.\nTheir match history has been preserved.`);
        setShowModal(false);
        setConfirmText('');
        setSelectedUserToDelete('');
      } else {
        alert('❌ Failed to deactivate user. Please try again or contact support.');
      }
    } catch (error) {
      console.error('Error deactivating user:', error);
      alert('❌ Error deactivating user: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  const selectedUserObj = availableUsers.find(u => u.id === selectedUserToDelete);
  const confirmationText = selectedUserObj ? `DELETE ${selectedUserObj.name}` : '';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-orange-200 bg-orange-50">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-orange-100 p-2 rounded-full">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-orange-900">⚠️ Delete User</h3>
            </div>
            <button
              onClick={() => setShowModal(false)}
              className="text-orange-400 hover:text-orange-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>
          <p className="text-sm text-orange-700 mt-2 font-medium">
            🚨 This will deactivate the user but preserve their match history
          </p>
        </div>

        <div className="p-6 overflow-y-auto max-h-96">
          {/* Information Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">What happens when you delete a user:</h4>
                <div className="text-sm text-blue-800 space-y-2">
                  <div>
                    <p className="font-semibold text-orange-700">DEACTIVATED:</p>
                    <ul className="list-disc list-inside ml-2">
                      <li>Login access disabled</li>
                      <li>Removed from all current seasons</li>
                      <li>Name and email anonymized</li>
                      <li>No longer available for ladder selection</li>
                      <li>Future availability cleared</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-green-700">PRESERVED:</p>
                    <ul className="list-disc list-inside ml-2">
                      <li>All match results and game history</li>
                      <li>Historical statistics and records</li>
                      <li>Past availability data</li>
                      <li>Match fixtures they participated in</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* User Selection */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Select User to Delete:
            </label>
            <select
              value={selectedUserToDelete}
              onChange={(e) => {
                setSelectedUserToDelete(e.target.value);
                setConfirmText(''); // Reset confirmation text when user changes
              }}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">Choose a user...</option>
              {availableUsers.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email}) - Role: {user.role || 'player'}
                </option>
              ))}
            </select>
            {availableUsers.length === 0 && (
              <p className="text-gray-500 text-sm mt-2">
                No users available for deletion. You cannot delete yourself or users that are already deleted.
              </p>
            )}
          </div>

          {/* Confirmation Text Input */}
          {selectedUserToDelete && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Type exactly: <span className="text-orange-600 font-mono">{confirmationText}</span>
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={confirmationText}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono"
              />
              {confirmText && confirmText !== confirmationText && (
                <p className="text-orange-600 text-sm mt-1">
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

          {/* Selected User Info */}
          {selectedUserObj && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <Users className="w-4 h-4 text-gray-600" />
                <h4 className="font-medium text-gray-900">User to be deactivated:</h4>
              </div>
              <div className="text-sm text-gray-700">
                <p><strong>Name:</strong> {selectedUserObj.name}</p>
                <p><strong>Email:</strong> {selectedUserObj.email}</p>
                <p><strong>Role:</strong> {selectedUserObj.role || 'player'}</p>
                <p><strong>Status:</strong> {selectedUserObj.status}</p>
              </div>
            </div>
          )}

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ Note:</strong> This action deactivates the user account rather than permanently deleting it. 
              This ensures match history and statistics remain intact for reporting purposes.
            </p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex space-x-3">
            <button
              onClick={handleDeleteUser}
              disabled={deleting || !selectedUserToDelete || confirmText !== confirmationText || availableUsers.length === 0}
              className="flex-1 bg-orange-600 text-white py-3 px-4 rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold flex items-center justify-center space-x-2"
            >
              <UserX className="w-4 h-4" />
              <span>{deleting ? 'Deactivating User...' : 'DEACTIVATE USER'}</span>
            </button>
            <button
              onClick={() => {
                setShowModal(false);
                setConfirmText('');
                setSelectedUserToDelete('');
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

export default DeleteUserModal;