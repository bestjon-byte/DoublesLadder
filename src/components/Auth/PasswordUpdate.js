// src/components/Auth/PasswordUpdate.js - FIXED
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
  const [isValidSession, setIsValidSession] = useState(false);

  useEffect(() => {
    // Check if we have a valid recovery session
    const checkRecoverySession = async () => {
      // Checking for valid recovery session from password reset link
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error checking session:', error);
          setError('Invalid or expired reset link. Please request a new password reset.');
          return;
        }
        
        if (session) {
          // Valid recovery session found
          setIsValidSession(true);
        } else {
          // No valid session available
          setError('Invalid or expired reset link. Please request a new password reset.');
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('An error occurred. Please try again.');
      }
    };
    
    checkRecoverySession();
  }, []);

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    if (!isValidSession) {
      setError('Invalid session. Please request a new password reset.');
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
      // Attempting to update user password
      
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        console.error('❌ Password update error:', error);
        setError(`Failed to update password: ${error.message}`);
        setLoading(false);
      } else {
        // Password updated successfully
        
        // Nuclear option - just reload the page after password update
        alert('Password updated successfully! You can now sign in with your new password.');
        
        // Sign out and force reload
        await supabase.auth.signOut();
        
        // Force a complete page reload to clear everything
        setTimeout(() => {
          window.location.href = '/';
          window.location.reload(true);
        }, 100);
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

        {isValidSession ? (
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