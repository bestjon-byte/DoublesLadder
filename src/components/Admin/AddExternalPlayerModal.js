// Add External Player Modal - Create skeleton users for storing results
import React, { useState } from 'react';
import { X, UserPlus, User, Mail, AlertCircle, CheckCircle } from 'lucide-react';

const AddExternalPlayerModal = ({ isOpen, onClose, supabase, onPlayerAdded }) => {
  const [loading, setLoading] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [playerEmail, setPlayerEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [createdPlayer, setCreatedPlayer] = useState(null);

  const handleReset = () => {
    setPlayerName('');
    setPlayerEmail('');
    setError('');
    setSuccess(false);
    setCreatedPlayer(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const validateForm = () => {
    if (!playerName.trim()) return 'Player name is required';
    if (playerName.trim().length < 2) return 'Player name must be at least 2 characters';
    
    // Email is optional, but if provided, should be valid format
    if (playerEmail.trim() && !isValidEmail(playerEmail.trim())) {
      return 'Please enter a valid email address';
    }
    
    return null;
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const generateSkeletonEmail = (name) => {
    // Generate a unique email for skeleton users
    const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const timestamp = Date.now();
    return `${cleanName}-${timestamp}@skeleton.local`;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const name = playerName.trim();
      const email = playerEmail.trim() || generateSkeletonEmail(name);

      // Check if email already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('email', email)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found (which is what we want)
        throw checkError;
      }

      if (existingUser) {
        setError(`A user with email "${email}" already exists: ${existingUser.name}`);
        return;
      }

      // Check if name already exists (warn but allow)
      const { data: existingNameUser } = await supabase
        .from('profiles')
        .select('id, name, email')
        .ilike('name', name)
        .single();

      if (existingNameUser && !window.confirm(
        `A user named "${existingNameUser.name}" already exists. Do you want to create another user with this name?`
      )) {
        return;
      }

      // Create the skeleton user
      const { data: newUser, error: createError } = await supabase
        .from('profiles')
        .insert({
          name: name,
          email: email,
          status: 'approved', // Skeleton users are auto-approved
          role: 'player'
        })
        .select()
        .single();

      if (createError) throw createError;

      setCreatedPlayer(newUser);
      setSuccess(true);

      // Notify parent component if callback provided
      if (onPlayerAdded) {
        onPlayerAdded(newUser);
      }

    } catch (err) {
      console.error('Failed to create external player:', err);
      setError(err.message || 'Failed to create player');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAnother = () => {
    handleReset();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-100 p-2 rounded-full">
                <UserPlus className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Add External Player</h3>
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
              <h4 className="text-lg font-semibold text-green-800 mb-2">Player Added Successfully!</h4>
              <p className="text-green-600 mb-2">
                <strong>{createdPlayer?.name}</strong>
              </p>
              <p className="text-xs text-gray-500 mb-6">
                {createdPlayer?.email?.includes('@skeleton.local') 
                  ? 'Auto-generated skeleton email address'
                  : `Email: ${createdPlayer?.email}`
                }
              </p>
              
              <div className="flex space-x-3 justify-center">
                <button
                  onClick={handleAddAnother}
                  className="bg-purple-600 text-white py-2 px-6 rounded-md hover:bg-purple-700 transition-colors font-medium"
                >
                  Add Another Player
                </button>
                <button
                  onClick={handleClose}
                  className="bg-gray-300 text-gray-700 py-2 px-6 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700">{error}</p>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h4 className="text-blue-800 font-medium mb-2">What is an External Player?</h4>
                <ul className="text-blue-700 text-sm space-y-1">
                  <li>• Players who haven't signed up to the app</li>
                  <li>• External opponents from other clubs</li>
                  <li>• Allows storing match results against them</li>
                  <li>• They won't be able to log in or see the app</li>
                </ul>
              </div>

              {/* Player Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Player Name *
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  disabled={loading}
                  placeholder="e.g., John Smith"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Player Email (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={playerEmail}
                  onChange={(e) => setPlayerEmail(e.target.value)}
                  disabled={loading}
                  placeholder="e.g., john.smith@email.com"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  If left blank, a unique skeleton email will be generated automatically
                </p>
              </div>

              {/* Preview */}
              {playerName.trim() && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-2">Player Preview:</h4>
                  <div className="text-sm text-gray-600">
                    <p><strong>Name:</strong> {playerName.trim()}</p>
                    <p><strong>Email:</strong> {playerEmail.trim() || 'Auto-generated skeleton email'}</p>
                    <p><strong>Status:</strong> External Player (Auto-approved)</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {!success && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex space-x-3">
              <button
                onClick={handleSubmit}
                disabled={loading || validateForm() !== null}
                className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? 'Creating Player...' : 'Add External Player'}
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
      </div>
    </div>
  );
};

export default AddExternalPlayerModal;