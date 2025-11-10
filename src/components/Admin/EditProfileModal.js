// src/components/Admin/EditProfileModal.js
// Edit user profiles - admin tool for updating user information
import React, { useState, useEffect } from 'react';
import { X, UserCog, Search, Mail, User, Shield, AlertCircle, CheckCircle, Save } from 'lucide-react';
import { supabase } from '../../supabaseClient';

const EditProfileModal = ({ isOpen, onClose, allUsers, currentUser, onProfileUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Form fields
  const [editedName, setEditedName] = useState('');
  const [editedEmail, setEditedEmail] = useState('');
  const [editedRole, setEditedRole] = useState('player');
  const [editedStatus, setEditedStatus] = useState('approved');
  const [originalProfile, setOriginalProfile] = useState(null);

  // Reset form when modal opens/closes or user changes
  useEffect(() => {
    if (!isOpen) {
      handleReset();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedUser) {
      setEditedName(selectedUser.name || '');
      setEditedEmail(selectedUser.email || '');
      setEditedRole(selectedUser.role || 'player');
      setEditedStatus(selectedUser.status || 'approved');
      setOriginalProfile({
        name: selectedUser.name,
        email: selectedUser.email,
        role: selectedUser.role,
        status: selectedUser.status
      });
    }
  }, [selectedUser]);

  const handleReset = () => {
    setSearchTerm('');
    setSelectedUser(null);
    setEditedName('');
    setEditedEmail('');
    setEditedRole('player');
    setEditedStatus('approved');
    setOriginalProfile(null);
    setError('');
    setSuccess(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  // Filter users based on search term
  const filteredUsers = allUsers
    ? allUsers.filter(user => {
        const searchLower = searchTerm.toLowerCase();
        return (
          user.name?.toLowerCase().includes(searchLower) ||
          user.email?.toLowerCase().includes(searchLower) ||
          user.id?.toLowerCase().includes(searchLower)
        );
      })
      .sort((a, b) => a.name?.localeCompare(b.name))
    : [];

  const validateForm = () => {
    if (!editedName.trim()) return 'Name is required';
    if (editedName.trim().length < 2) return 'Name must be at least 2 characters';

    if (!editedEmail.trim()) return 'Email is required';
    if (!isValidEmail(editedEmail.trim())) {
      return 'Please enter a valid email address';
    }

    return null;
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const hasChanges = () => {
    if (!originalProfile) return false;
    return (
      editedName !== originalProfile.name ||
      editedEmail !== originalProfile.email ||
      editedRole !== originalProfile.role ||
      editedStatus !== originalProfile.status
    );
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!hasChanges()) {
      setError('No changes detected');
      return;
    }

    // Prevent users from demoting themselves
    if (selectedUser.id === currentUser?.id && editedRole !== 'admin') {
      setError('You cannot remove your own admin privileges');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Check if email is being changed and if it already exists
      if (editedEmail !== originalProfile.email) {
        const { data: existingUsers, error: checkError } = await supabase
          .from('profiles')
          .select('id, name, email')
          .eq('email', editedEmail.trim())
          .neq('id', selectedUser.id);

        if (checkError) throw checkError;

        if (existingUsers && existingUsers.length > 0) {
          setError(`Email "${editedEmail}" is already in use by ${existingUsers[0].name}`);
          setLoading(false);
          return;
        }
      }

      // Update the profile
      const { data: updatedUser, error: updateError } = await supabase
        .from('profiles')
        .update({
          name: editedName.trim(),
          email: editedEmail.trim(),
          role: editedRole,
          status: editedStatus
        })
        .eq('id', selectedUser.id)
        .select()
        .single();

      if (updateError) throw updateError;

      setSuccess(true);

      // Notify parent component if callback provided
      if (onProfileUpdated) {
        onProfileUpdated(updatedUser);
      }

      // Auto-close after 2 seconds
      setTimeout(() => {
        handleClose();
      }, 2000);

    } catch (err) {
      console.error('Failed to update profile:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <UserCog className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Edit User Profile</h3>
            </div>
            <button
              onClick={handleClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {success ? (
            <div className="text-center py-8">
              <div className="bg-green-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold text-green-800 mb-2">Profile Updated Successfully!</h4>
              <p className="text-green-600 mb-2">
                <strong>{editedName}</strong>
              </p>
              <p className="text-xs text-gray-500">
                Changes have been saved to the database
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700">{error}</p>
                </div>
              )}

              {!selectedUser ? (
                <div>
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                    <h4 className="text-blue-800 font-medium mb-2">Edit User Information</h4>
                    <ul className="text-blue-700 text-sm space-y-1">
                      <li>• Update user display name and email</li>
                      <li>• Change user role (Player/Admin)</li>
                      <li>• Modify account status</li>
                      <li>• Search by name, email, or user ID</li>
                    </ul>
                  </div>

                  {/* User Search */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Search className="w-4 h-4 inline mr-1" />
                      Search for User
                    </label>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by name, email, or ID..."
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* User List */}
                  {searchTerm.trim() && (
                    <div className="mt-4 border border-gray-300 rounded-md max-h-96 overflow-y-auto">
                      {filteredUsers.length > 0 ? (
                        <div className="divide-y divide-gray-200">
                          {filteredUsers.map(user => (
                            <div
                              key={user.id}
                              onClick={() => setSelectedUser(user)}
                              className="p-4 hover:bg-blue-50 cursor-pointer transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-gray-900">{user.name}</p>
                                  <p className="text-sm text-gray-600">{user.email}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                                      user.role === 'admin'
                                        ? 'bg-purple-100 text-purple-700'
                                        : 'bg-gray-100 text-gray-700'
                                    }`}>
                                      {user.role}
                                    </span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                                      user.status === 'approved'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                      {user.status}
                                    </span>
                                  </div>
                                </div>
                                <User className="w-5 h-5 text-gray-400" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center text-gray-500">
                          No users found matching "{searchTerm}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  {/* Selected User Header */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-800">Editing Profile:</h4>
                      <button
                        onClick={() => setSelectedUser(null)}
                        className="text-blue-600 hover:text-blue-700 text-sm"
                      >
                        Change User
                      </button>
                    </div>
                    <p className="text-gray-600">
                      <strong>Current:</strong> {originalProfile?.name} ({originalProfile?.email})
                    </p>
                    <p className="text-xs text-gray-500 mt-1">User ID: {selectedUser.id}</p>
                  </div>

                  {/* Edit Form */}
                  <div className="space-y-4">
                    {/* Display Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <User className="w-4 h-4 inline mr-1" />
                        Display Name *
                      </label>
                      <input
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        disabled={loading}
                        placeholder="e.g., John Smith"
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Email Address */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Mail className="w-4 h-4 inline mr-1" />
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={editedEmail}
                        onChange={(e) => setEditedEmail(e.target.value)}
                        disabled={loading}
                        placeholder="e.g., john.smith@email.com"
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Role */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Shield className="w-4 h-4 inline mr-1" />
                        User Role
                      </label>
                      <select
                        value={editedRole}
                        onChange={(e) => setEditedRole(e.target.value)}
                        disabled={loading || selectedUser.id === currentUser?.id}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      >
                        <option value="player">Player</option>
                        <option value="admin">Admin</option>
                      </select>
                      {selectedUser.id === currentUser?.id && (
                        <p className="text-xs text-gray-500 mt-1">
                          You cannot change your own role
                        </p>
                      )}
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Account Status
                      </label>
                      <select
                        value={editedStatus}
                        onChange={(e) => setEditedStatus(e.target.value)}
                        disabled={loading}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="approved">Approved</option>
                        <option value="pending">Pending</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        Pending users cannot access the app until approved
                      </p>
                    </div>

                    {/* Additional User Info (Read-only) */}
                    {selectedUser.auth_user_id && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Additional Information</h5>
                        <div className="text-xs text-gray-600 space-y-1">
                          <p><strong>Auth User ID:</strong> {selectedUser.auth_user_id}</p>
                          {selectedUser.is_external && (
                            <p className="text-orange-600"><strong>External Player:</strong> Yes</p>
                          )}
                          {selectedUser.merged_into_player_id && (
                            <p className="text-purple-600"><strong>Merged Into:</strong> {selectedUser.merged_into_player_id}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Changes Summary */}
                    {hasChanges() && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h5 className="text-sm font-medium text-yellow-800 mb-2">Pending Changes:</h5>
                        <div className="text-xs text-yellow-700 space-y-1">
                          {editedName !== originalProfile.name && (
                            <p>• Name: "{originalProfile.name}" → "{editedName}"</p>
                          )}
                          {editedEmail !== originalProfile.email && (
                            <p>• Email: "{originalProfile.email}" → "{editedEmail}"</p>
                          )}
                          {editedRole !== originalProfile.role && (
                            <p>• Role: "{originalProfile.role}" → "{editedRole}"</p>
                          )}
                          {editedStatus !== originalProfile.status && (
                            <p>• Status: "{originalProfile.status}" → "{editedStatus}"</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {!success && selectedUser && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex space-x-3">
              <button
                onClick={handleSubmit}
                disabled={loading || validateForm() !== null || !hasChanges()}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={handleClose}
                disabled={loading}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {!success && !selectedUser && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={handleClose}
              className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditProfileModal;
