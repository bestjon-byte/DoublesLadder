// src/hooks/useAuth.js
// Handles all authentication logic

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState('normal');
  const [error, setError] = useState(null);

  // Check for password reset mode
  const checkForPasswordReset = useCallback(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    return hashParams.get('type') === 'recovery' && hashParams.get('access_token');
  }, []);

  // Load user profile
  const loadUserProfile = useCallback(async (userId) => {
    try {
      console.log('📱 Loading user profile...');
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Profile error:', error);
        setError(error);
        return null;
      }

      console.log('✅ Profile loaded:', profile.name);
      setUser(profile);
      return profile;
    } catch (error) {
      console.error('💥 Error loading profile:', error);
      setError(error);
      return null;
    }
  }, []);

  // Sign in
  const signIn = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔐 Attempting login...');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('❌ Login error:', error);
        setError(error);
        return { success: false, error };
      }
      
      console.log('✅ Login successful');
      const profile = await loadUserProfile(data.user.id);
      
      return { success: true, user: profile };
    } catch (error) {
      console.error('💥 Unexpected error:', error);
      setError(error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [loadUserProfile]);

  // Sign up
  const signUp = useCallback(async (email, password, name) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('📝 Attempting registration...');
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name }
        }
      });
      
      if (error) {
        console.error('❌ Registration error:', error);
        setError(error);
        return { success: false, error };
      }
      
      console.log('✅ Registration successful');
      return { success: true, needsApproval: true };
    } catch (error) {
      console.error('💥 Unexpected error:', error);
      setError(error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      console.log('👋 Signing out...');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Supabase signout error:', error);
        throw error;
      }
      
      console.log('✅ Successfully signed out from Supabase');
      setUser(null);
      setAuthMode('normal');
      setError(null);
      return { success: true };
    } catch (error) {
      console.error('❌ Error signing out:', error);
      setError(error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, []);

  // Password reset request
  const requestPasswordReset = useCallback(async (email) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔑 Requesting password reset...');
      
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error('❌ Password reset error:', error);
        setError(error);
        return { success: false, error };
      }

      console.log('✅ Password reset email sent');
      return { success: true };
    } catch (error) {
      console.error('💥 Unexpected error:', error);
      setError(error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, []);

  // Update password
  const updatePassword = useCallback(async (newPassword) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔐 Updating password...');
      
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('❌ Password update error:', error);
        setError(error);
        return { success: false, error };
      }

      console.log('✅ Password updated successfully');
      
      // Sign out and redirect after password update
      await supabase.auth.signOut();
      setAuthMode('normal');
      
      // Clear URL hash
      if (window.location.hash) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      
      return { success: true };
    } catch (error) {
      console.error('💥 Unexpected error:', error);
      setError(error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize auth
  useEffect(() => {
    const initializeAuth = async () => {
      // Set timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.warn('⏰ Auth initialization timeout - forcing loading to false');
        setLoading(false);
        setError(new Error('Authentication timeout - please refresh the page'));
      }, 20000); // 20 second timeout - increased for slower connections
      
      try {
        console.log('🚀 Initializing auth...');
        
        // Check for password reset mode
        const isPasswordReset = checkForPasswordReset();
        
        if (isPasswordReset) {
          console.log('🔑 Password reset mode detected');
          setAuthMode('reset');
          clearTimeout(timeoutId);
          setLoading(false);
          return;
        }

        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Session error:', error);
          setError(error);
          clearTimeout(timeoutId);
          setLoading(false);
          return;
        }

        if (session) {
          console.log('✅ Valid session found');
          const profile = await loadUserProfile(session.user.id);
          if (!profile) {
            console.error('❌ Failed to load profile - signing out');
            await supabase.auth.signOut();
            setUser(null);
          }
        } else {
          console.log('ℹ️ No session - showing login');
        }
        
        clearTimeout(timeoutId);
      } catch (error) {
        console.error('💥 Auth initialization failed:', error);
        setError(error);
        clearTimeout(timeoutId);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [checkForPasswordReset, loadUserProfile]);

  // Listen for auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth event:', event);
      
      switch (event) {
        case 'SIGNED_IN':
          if (session && !checkForPasswordReset()) {
            console.log('✅ User signed in');
            await loadUserProfile(session.user.id);
          }
          break;
          
        case 'SIGNED_OUT':
          console.log('👋 User signed out');
          setUser(null);
          setAuthMode('normal');
          break;
          
        case 'PASSWORD_RECOVERY':
          console.log('🔑 Password recovery triggered');
          setAuthMode('reset');
          setUser(null);
          break;
          
        default:
          break;
      }
    });

    return () => subscription.unsubscribe();
  }, [checkForPasswordReset, loadUserProfile]);

  return {
    user,
    loading,
    authMode,
    error,
    actions: {
      signIn,
      signUp,
      signOut,
      requestPasswordReset,
      updatePassword,
      setAuthMode,
    }
  };
};