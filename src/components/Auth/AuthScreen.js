// src/components/Auth/AuthScreen.js - Completely rewritten for password reset
import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import PasswordReset from './PasswordReset';
import PasswordUpdate from './PasswordUpdate';

const AuthScreen = ({ onAuthChange }) => {
  const [authMode, setAuthMode] = useState('login'); // 'login', 'register', 'reset', 'update'
  const [loading, setLoading] = useState(false);
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    name: ''
  });

  useEffect(() => {
    // Check for password reset tokens in URL immediately on component mount
    console.log('🔍 AuthScreen: Checking for password reset tokens...');
    
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    
    console.log('🔑 AuthScreen tokens:', { type, hasAccess: !!accessToken, hasRefresh: !!refreshToken });

    if (type === 'recovery' && accessToken && refreshToken) {
      console.log('✅ AuthScreen: Password reset detected, switching to update mode');
      setAuthMode('update');
      
      // Clean up URL
      if (window.history.replaceState) {
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState(null, '', cleanUrl);
        console.log('🧹 AuthScreen: URL cleaned');
      }
    }
  }, []);

  const handleAuth = async () => {
    setLoading(true);
    
    try {
      if (authMode === 'login') {
        console.log('🔐 AuthScreen: Attempting login for:', authForm.email);
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email: authForm.email,
          password: authForm.password,
        });
        
        console.log('🔐 AuthScreen: Login response:', { data, error });
        
        if (error) {
          console.error('❌ AuthScreen: Login error:', error);
          alert(`Login failed: ${error.message}`);
        } else {
          console.log('✅ AuthScreen: Login successful, fetching profile...');
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
          
          console.log('👤 AuthScreen: Profile data:', profile);
          onAuthChange(profile);
        }
      } else if (authMode === 'register') {
        console.log('📝 AuthScreen: Attempting registration for:', authForm.email);
        
        const { data, error } = await supabase.auth.signUp({
          email: authForm.email,
          password: authForm.password,
          options: {
            data: {
              name: authForm.name,
            }
          }
        });
        
        console.log('📝 AuthScreen: Registration response:', { data, error });
        
        if (error) {
          console.error('❌ AuthScreen: Registration error:', error);
          alert(`Registration failed: ${error.message}`);
        } else {
          console.log('✅ AuthScreen: Registration successful');
          alert('Registration successful! Please wait for admin approval.');
          setAuthMode('login');
        }
      }
    } catch (err) {
      console.error('💥 AuthScreen: Unexpected auth error:', err);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
      setAuthForm({ email: '', password: '', name: '' });
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
      <PasswordUpdate onPasswordUpdated={() => {
        console.log('🔄 AuthScreen: Password updated, switching to login');
        setAuthMode('login');
      }} />
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
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              authMode === 'login' ? 'bg-white text-gray-900 shadow' : 'text-gray-600'
            }`}
            onClick={() => setAuthMode('login')}
          >
            Sign In
          </button>
          <button
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              authMode === 'register' ? 'bg-white text-gray-900 shadow' : 'text-gray-600'
            }`}
            onClick={() => setAuthMode('register')}
          >
            Sign Up
          </button>
        </div>

        <div className="space-y-4">
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
            onClick={handleAuth}
            disabled={loading}
            className="w-full bg-[#5D1F1F] text-white py-3 rounded-md hover:bg-[#4A1818] transition-colors font-medium disabled:opacity-50"
          >
            {loading ? 'Loading...' : (authMode === 'login' ? 'Sign In' : 'Sign Up')}
          </button>
        </div>

        {authMode === 'login' && (
          <div className="mt-4 text-center">
            <button
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

        <div className="mt-4 text-xs text-gray-500 text-center">
          <p>Debug info will appear in browser console</p>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;