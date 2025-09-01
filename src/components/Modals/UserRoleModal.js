// src/components/Modals/UserRoleModal.js
import React, { useState } from 'react';
import { Shield, ShieldCheck } from 'lucide-react';

const UserRoleModal = ({ 
  showModal, 
  setShowModal, 
  allUsers,
  currentUser,
  updateUserRole
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [updating, setUpdating] = useState(null);

  if (!showModal) return null;

  // Filter users based on search term
  const filteredUsers = allUsers.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUpdateUserRole = async (userId, newRole, userName) => {
    // Prevent self-demotion
    if (userId === currentUser.id && newRole !== 'admin') {
      alert('You cannot demote yourself from admin status.');
      return;
    }

    const action = newRole === 'admin' ? 'promote' : 'demote';
    const confirmation = window.confirm(
      `Are you sure you want to ${action} ${userName} ${newRole === 'admin' ? 'to admin' : 'to player'}?`
    );

    if (!confirmation) return;

    setUpdating(userId);
    try {
      const result = await updateUserRole(userId, newRole);
      if (result?.success) {
        // Success feedback is handled by the parent component
      } else {
        alert('Failed to update user role. Please try again.');
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Error updating user role: ' + error.message);
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-gray-900">User Role Management</h3>
            <button
              onClick={() => setShowModal(false)}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Promote users to admin or demote them to players
          </p>
        </div>

        <div className="p-6">
          {/* Search Bar */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5D1F1F] focus:border-transparent"
            />
          </div>

          {/* Users List */}
          <div className="overflow-y-auto max-h-96">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No users found matching your search.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredUsers.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {user.role === 'admin' ? (
                          <ShieldCheck className="h-6 w-6 text-blue-600" />
                        ) : (
                          <Shield className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {user.name}
                          {user.id === currentUser.id && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        <div className="text-xs text-gray-400">
                          Current role: 
                          <span className={`ml-1 font-semibold ${
                            user.role === 'admin' ? 'text-blue-600' : 'text-gray-600'
                          }`}>
                            {user.role === 'admin' ? 'Admin' : 'Player'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      {user.role !== 'admin' ? (
                        <button
                          onClick={() => handleUpdateUserRole(user.id, 'admin', user.name)}
                          disabled={updating === user.id}
                          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {updating === user.id ? 'Promoting...' : 'Promote to Admin'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpdateUserRole(user.id, 'player', user.name)}
                          disabled={updating === user.id || user.id === currentUser.id}
                          className="px-4 py-2 bg-orange-600 text-white text-sm rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {updating === user.id ? 'Demoting...' : 'Demote to Player'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => setShowModal(false)}
            className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserRoleModal;