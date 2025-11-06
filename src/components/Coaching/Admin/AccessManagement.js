import React, { useState } from 'react';
import { Users, Plus, X, Check } from 'lucide-react';
import { useAppToast } from '../../../contexts/ToastContext';
import GrantAccessModal from '../Modals/GrantAccessModal';
import { LoadingSpinner } from '../../shared/LoadingSpinner';

const AccessManagement = ({ accessList, loading, actions, allUsers, currentUser }) => {
  const { success, error } = useAppToast();
  const [showModal, setShowModal] = useState(false);

  const handleRevoke = async (access) => {
    if (!window.confirm(`Revoke coaching access for ${access.player?.name}?`)) return;

    const result = await actions.revokeAccess(access.player_id);
    if (result.error) {
      error('Failed to revoke access');
    } else {
      success(`Access revoked for ${access.player?.name}`);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const activeAccess = accessList.filter(a => !a.revoked_at);
  const revokedAccess = accessList.filter(a => a.revoked_at);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          Players with Coaching Access ({activeAccess.length})
        </h3>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Grant Access
        </button>
      </div>

      {/* Active Access */}
      {activeAccess.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">No players have coaching access</p>
          <button
            onClick={() => setShowModal(true)}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Grant access to a player
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {activeAccess.map((access) => (
            <div
              key={access.id}
              className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-medium text-gray-900">{access.player?.name}</span>
                  <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                    <Check className="w-3 h-3 inline mr-1" />
                    Active
                  </span>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Granted {new Date(access.granted_at).toLocaleDateString('en-GB')}
                  {access.granted_by_user && ` by ${access.granted_by_user.name}`}
                </div>
                {access.notes && (
                  <p className="text-sm text-gray-500 mt-1">{access.notes}</p>
                )}
              </div>
              <button
                onClick={() => handleRevoke(access)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                title="Revoke access"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Revoked Access */}
      {revokedAccess.length > 0 && (
        <div className="mt-8">
          <h4 className="text-md font-semibold text-gray-700 mb-3">
            Revoked Access ({revokedAccess.length})
          </h4>
          <div className="space-y-2">
            {revokedAccess.map((access) => (
              <div
                key={access.id}
                className="bg-gray-50 border border-gray-200 rounded-lg p-3 opacity-60"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-gray-700">{access.player?.name}</span>
                    <span className="text-sm text-gray-500 ml-3">
                      Revoked {new Date(access.revoked_at).toLocaleDateString('en-GB')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <GrantAccessModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            actions.fetchAccessList();
          }}
          actions={actions}
          allUsers={allUsers}
          existingAccess={accessList}
        />
      )}
    </div>
  );
};

export default AccessManagement;
