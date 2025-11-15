// src/components/Auth/PasswordUpdate.js - Custom Token-Based Reset
import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Eye, EyeOff } from 'lucide-react';

const PasswordUpdate = ({ onPasswordUpdated }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const [tokenData, setTokenData] = useState(null);
  const [checkingToken, setCheckingToken] = useState(true);

  useEffect(() => {
    // Check if we have a valid password reset token
    const checkResetToken = async () => {
      // Extracting token from URL query parameter
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');

      if (!token) {
        setError('No reset token found. Please request a new password reset.');
        setCheckingToken(false);
        return;
      }

      try {
        // Validate the token using our custom function
        const { data, error } = await supabase
          .rpc('validate_password_reset_token', {
            p_token: token,
          });

        if (error) {
          console.error('❌ Error validating token:', error);
          setError('Invalid or expired reset link. Please request a new password reset.');
          setCheckingToken(false);
          return;
        }

        if (data && data.length > 0 && data[0].valid) {
          // Valid token found
          setIsValidToken(true);
          setTokenData(data[0]);
        } else {
          // Invalid or expired token
          setError('Invalid or expired reset link. Please request a new password reset.');
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('An error occurred. Please try again.');
      } finally {
        setCheckingToken(false);
      }
    };

    checkResetToken();
  }, []);

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();

    if (!isValidToken || !tokenData) {
      setError('Invalid token. Please request a new password reset.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Update password using secure RPC function
      const { data: result, error: updateError } = await supabase.rpc('update_password_with_token', {
        p_user_id: tokenData.user_id,
        p_new_password: password,
      });

      if (updateError) {
        console.error('❌ Password update error:', updateError);
        setError(`Failed to update password: ${updateError.message}`);
        setLoading(false);
      } else if (result && result.success) {
        // Password updated successfully
        alert('Password updated successfully! You can now sign in with your new password.');

        // Navigate to root (login page)
        setTimeout(() => {
          window.location.href = '/';
        }, 100);
      } else {
        setError('Failed to update password. Please try again.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#5D1F1F] to-[#8B3A3A] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <div className="text-center mb-6">
          <img 
            src="/club-logo.png" 
            alt="Cawood Tennis Club Logo" 
            className="w-24 h-24 mx-auto mb-3 rounded-full shadow-md object-contain bg-white p-1"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          <div className="w-24 h-24 bg-[#5D1F1F] rounded-full mx-auto mb-3 flex items-center justify-center shadow-md" style={{display: 'none'}}>
            <span className="text-white font-bold text-3xl">C</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Set New Password</h1>
          <p className="text-gray-600">Enter your new password below</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {checkingToken ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Validating reset link...</p>
          </div>
        ) : isValidToken ? (
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5D1F1F] focus:border-transparent"
                required
                disabled={loading}
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-3 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5D1F1F] focus:border-transparent"
                required
                disabled={loading}
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            
            <button
              type="submit"
              disabled={loading || !password.trim() || !confirmPassword.trim()}
              className="w-full bg-[#5D1F1F] text-white py-3 rounded-md hover:bg-[#4A1818] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">Please check your email for a valid reset link.</p>
            <button
              onClick={() => window.location.href = '/'}
              className="text-[#5D1F1F] hover:text-[#4A1818] font-medium"
            >
              Return to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PasswordUpdate;