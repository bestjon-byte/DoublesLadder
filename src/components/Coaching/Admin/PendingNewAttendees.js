import React, { useState, useEffect } from 'react';
import { UserPlus, Check, X, User, Calendar, Clock, Mail, Phone, Users } from 'lucide-react';
import { supabase } from '../../../supabaseClient';
import { useAppToast } from '../../../contexts/ToastContext';

const PendingNewAttendees = ({ onRefresh }) => {
  const { success, error: showError } = useAppToast();
  const [skeletonAccounts, setSkeletonAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form state for completing profile
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    is_junior: false,
    parent_name: '',
    parent_email: '',
    parent_phone: '',
    notes: ''
  });

  const loadSkeletonAccounts = async () => {
    try {
      const { data, error } = await supabase.rpc('get_skeleton_accounts');
      if (error) throw error;
      setSkeletonAccounts(data || []);
    } catch (err) {
      console.error('Error loading skeleton accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSkeletonAccounts();
  }, []);

  const handleSelectAccount = (account) => {
    setSelectedAccount(account);
    setFormData({
      email: '',
      phone: '',
      is_junior: false,
      parent_name: '',
      parent_email: '',
      parent_phone: '',
      notes: ''
    });
  };

  const handleCompleteProfile = async () => {
    if (!selectedAccount) return;

    setSaving(true);
    try {
      const { data, error } = await supabase.rpc('complete_skeleton_profile', {
        p_profile_id: selectedAccount.id,
        p_email: formData.email || null,
        p_phone: formData.phone || null,
        p_parent_name: formData.parent_name || null,
        p_parent_email: formData.parent_email || null,
        p_parent_phone: formData.parent_phone || null,
        p_is_junior: formData.is_junior,
        p_notes: formData.notes || null
      });

      if (error) throw error;

      success(`Profile for ${selectedAccount.name} completed successfully`);
      setSelectedAccount(null);
      loadSkeletonAccounts();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Error completing profile:', err);
      showError('Failed to complete profile');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  if (loading) {
    return null; // Don't show anything while loading
  }

  if (skeletonAccounts.length === 0) {
    return null; // Don't show if no pending accounts
  }

  return (
    <>
      {/* Notification Banner */}
      <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-300 rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-orange-400 p-2 rounded-xl">
            <UserPlus className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              New Attendees to Register ({skeletonAccounts.length})
            </h3>
            <p className="text-sm text-gray-600">
              These people were added at coaching sessions and need their details completing
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {skeletonAccounts.map((account) => (
            <div
              key={account.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-xl shadow-sm border border-orange-100"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{account.name}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mt-1">
                    {account.session_type && (
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        {account.session_type}
                      </span>
                    )}
                    {account.session_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(account.session_date)}
                      </span>
                    )}
                    {account.created_by_name && (
                      <span className="text-gray-400">
                        Added by {account.created_by_name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleSelectAccount(account)}
                className="w-full sm:w-auto bg-orange-500 text-white px-5 py-3 rounded-xl font-semibold hover:bg-orange-600 active:bg-orange-700 transition-all shadow-md flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Complete Profile
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Complete Profile Modal */}
      {selectedAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Complete Profile</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Add details for <span className="font-semibold">{selectedAccount.name}</span>
                  </p>
                </div>
                <button
                  onClick={() => setSelectedAccount(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Form */}
            <div className="p-6 space-y-5">
              {/* Junior Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">Junior Player</p>
                    <p className="text-xs text-gray-500">Under 18 years old</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, is_junior: !prev.is_junior }))}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    formData.is_junior ? 'bg-purple-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform ${
                      formData.is_junior ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Contact Details */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  Contact Details
                </h4>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@example.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="07xxx xxxxxx"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  />
                </div>
              </div>

              {/* Parent/Guardian Details (shown if junior) */}
              {formData.is_junior && (
                <div className="space-y-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
                  <h4 className="font-medium text-purple-900 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Parent/Guardian Details
                  </h4>

                  <div>
                    <label className="block text-sm font-medium text-purple-800 mb-1">
                      Parent/Guardian Name
                    </label>
                    <input
                      type="text"
                      value={formData.parent_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, parent_name: e.target.value }))}
                      placeholder="Parent's name"
                      className="w-full px-4 py-3 border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-purple-800 mb-1">
                      Parent Email
                    </label>
                    <input
                      type="email"
                      value={formData.parent_email}
                      onChange={(e) => setFormData(prev => ({ ...prev, parent_email: e.target.value }))}
                      placeholder="parent@example.com"
                      className="w-full px-4 py-3 border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-purple-800 mb-1">
                      Parent Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.parent_phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, parent_phone: e.target.value }))}
                      placeholder="07xxx xxxxxx"
                      className="w-full px-4 py-3 border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any additional notes..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all resize-none"
                />
              </div>

              {/* Hint */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-800">
                  <strong>Tip:</strong> You can leave fields blank if you don't have the information yet.
                  The profile can be updated later.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-2xl">
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedAccount(null)}
                  className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCompleteProfile}
                  disabled={saving}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      <span>Complete Profile</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PendingNewAttendees;
