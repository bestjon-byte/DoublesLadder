// src/components/Auth/PasswordReset.js
import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { ArrowLeft } from 'lucide-react';

const PasswordReset = ({ onBackToLogin }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      console.log('Attempting password reset for:', email);
      console.log('Current origin:', window.location.origin);
      console.log('Redirect URL will be:', `${window.location.origin}/reset-password`);
      
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      console.log('Password reset response:', { data, error });

      if (error) {
        console.error('Password reset error:', error);
        setError(`Password reset failed: ${error.message}`);
      } else {
        console.log('Password reset email sent successfully');
        setMessage('Password reset email sent! Check your inbox and spam folder.');
        setEmail('');
      }
    } catch (err) {
      console.error('Unexpected error during password reset:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
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
              console.error('Logo failed to load');
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          <div className="w-24 h-24 bg-[#5D1F1F] rounded-full mx-auto mb-3 flex items-center justify-center shadow-md" style={{display: 'none'}}>
            <span className="text-white font-bold text-3xl">C</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Reset Password</h1>
          <p className="text-gray-600">Enter your email to receive a reset link</p>
        </div>

        {message && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-800 text-sm">{message}</p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handlePasswordReset} className="space-y-4">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5D1F1F] focus:border-transparent"
            required
            disabled={loading}
          />
          
          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full bg-[#5D1F1F] text-white py-3 rounded-md hover:bg-[#4A1818] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending Reset Email...' : 'Send Reset Email'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={onBackToLogin}
            className="flex items-center justify-center space-x-2 text-[#5D1F1F] hover:text-[#4A1818] transition-colors mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Sign In</span>
          </button>
        </div>

        <div className="mt-4 text-xs text-gray-500 text-center">
          <p>Debug info will appear in browser console</p>
        </div>
      </div>
    </div>
  );
};

export default PasswordReset;