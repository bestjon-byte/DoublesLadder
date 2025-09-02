// src/components/Auth/AuthScreen.js - SIMPLIFIED AND FIXED
import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import PasswordReset from './PasswordReset';
import PasswordUpdate from './PasswordUpdate';
import { useAppToast } from '../../contexts/ToastContext';

const AuthScreen = ({ onAuthChange, isPasswordReset = false, onPasswordResetComplete }) => {
  const toast = useAppToast();
  const [authMode, setAuthMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    name: ''
  });

  useEffect(() => {
    if (isPasswordReset) {
      // Password reset mode activated from URL parameters
      setAuthMode('update');
    }
  }, [isPasswordReset]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (authMode === 'login') {
        // Attempting user login with provided credentials
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email: authForm.email,
          password: authForm.password,
        });
        
        if (error) {
          console.error('❌ Login error:', error);
          toast.error(`Login failed: ${error.message}`);
        } else {
          // Login successful - proceeding to load user profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
          
          onAuthChange(profile);
        }
      } else if (authMode === 'register') {
        // Attempting user registration with provided details
        
        const { data, error } = await supabase.auth.signUp({
          email: authForm.email,
          password: authForm.password,
          options: {
            data: {
              name: authForm.name,
            }
          }
        });
        
        if (error) {
          console.error('❌ Registration error:', error);
          toast.error(`Registration failed: ${error.message}`);
        } else {
          // Registration successful - user awaiting approval
          toast.success('Registration successful! Please wait for admin approval.');
          setAuthMode('login');
          setAuthForm({ email: '', password: '', name: '' });
        }
      }
    } catch (err) {
      console.error('💥 Unexpected error:', err);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle password reset mode
  if (authMode === 'reset') {
    return (
      <PasswordReset onBackToLogin={() => setAuthMode('login')} />
    );
  }

  // Handle password update mode (from email link)
  if (authMode === 'update') {
    return (
      <PasswordUpdate 
        onPasswordUpdated={() => {
          // Password successfully updated via reset link
          if (onPasswordResetComplete) {
            onPasswordResetComplete();
          } else {
            setAuthMode('login');
          }
        }} 
      />
    );
  }

  // Main auth screen
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
          <h1 className="text-2xl font-bold text-gray-800">Cawood Tennis Club</h1>
          <p className="text-gray-600">Doubles Ladder</p>
        </div>

        <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
          <button
            type="button"
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              authMode === 'login' ? 'bg-white text-gray-900 shadow' : 'text-gray-600'
            }`}
            onClick={() => setAuthMode('login')}
            disabled={loading}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              authMode === 'register' ? 'bg-white text-gray-900 shadow' : 'text-gray-600'
            }`}
            onClick={() => setAuthMode('register')}
            disabled={loading}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {authMode === 'register' && (
            <input
              type="text"
              placeholder="Full Name"
              value={authForm.name}
              onChange={(e) => setAuthForm({...authForm, name: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5D1F1F] focus:border-transparent"
              required
              disabled={loading}
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={authForm.email}
            onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5D1F1F] focus:border-transparent"
            required
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Password"
            value={authForm.password}
            onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5D1F1F] focus:border-transparent"
            required
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#5D1F1F] text-white py-3 rounded-md hover:bg-[#4A1818] transition-colors font-medium disabled:opacity-50"
          >
            {loading ? 'Loading...' : (authMode === 'login' ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        {authMode === 'login' && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setAuthMode('reset')}
              className="text-[#5D1F1F] hover:text-[#4A1818] text-sm transition-colors"
              disabled={loading}
            >
              Forgot your password?
            </button>
          </div>
        )}

        <div className="mt-4 text-sm text-gray-600 text-center">
          Create an account to get started!
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;