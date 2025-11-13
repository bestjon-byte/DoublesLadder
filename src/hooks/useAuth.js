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

  // Load user profile with timeout and retry logic
  const loadUserProfile = useCallback(async (userId) => {
    console.log('🔵 [useAuth] Loading profile for user:', userId);

    // Create timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Profile query timeout')), 2000); // Reduced to 2s
    });

    // Create query promise
    const queryPromise = supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    try {
      const result = await Promise.race([queryPromise, timeoutPromise]);
      const { data: profile, error } = result;

      if (error) {
        console.error('❌ [useAuth] Profile query error:', error);
        if (error.code === 'PGRST116') {
          return null;
        }
        return null;
      }

      console.log('✅ [useAuth] Profile loaded successfully:', profile?.name, '(', profile?.role, ')');
      setUser(profile);
      return profile;
    } catch (error) {
      if (error.message === 'Profile query timeout') {
        console.warn('⚠️ [useAuth] Profile query timeout - using fallback data');
        // Try to continue without profile data
        return {
          id: userId,
          name: 'Loading...',
          email: 'loading@example.com',
          status: 'approved',
          role: 'player'
        };
      } else {
        console.error('❌ [useAuth] Unexpected profile error:', error);
        return null;
      }
    }
  }, []);

  // Sign in
  const signIn = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        setError(error);
        return { success: false, error };
      }
      
      const profile = await loadUserProfile(data.user.id);
      
      return { success: true, user: profile };
    } catch (error) {
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
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name }
        }
      });
      
      if (error) {
        setError(error);
        return { success: false, error };
      }
      
      return { success: true, needsApproval: true };
    } catch (error) {
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
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      setUser(null);
      setAuthMode('normal');
      setError(null);
      return { success: true };
    } catch (error) {
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
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setError(error);
        return { success: false, error };
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

  // Update password
  const updatePassword = useCallback(async (newPassword) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        setError(error);
        return { success: false, error };
      }

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

  // Initialize auth with simpler, more robust approach
  useEffect(() => {
    let isActive = true; // Prevent state updates if component unmounts
    
    const initializeAuth = async () => {
      try {
        console.log('🟢 [useAuth] Starting auth initialization...');

        // Check for password reset mode first
        const isPasswordReset = checkForPasswordReset();
        if (isPasswordReset) {
          console.log('🔵 [useAuth] Password reset mode detected');
          if (isActive) {
            setAuthMode('reset');
            setLoading(false);
          }
          return;
        }

        console.log('🔵 [useAuth] Getting current session...');
        // Get current session with timeout protection
        const { data: { session }, error } = await supabase.auth.getSession();

        console.log('🔵 [useAuth] Session retrieved:', session ? 'User logged in' : 'No session');

        if (!isActive) return; // Component unmounted

        if (error) {
          console.error('❌ [useAuth] Session error:', error);
          setError(error);
          setLoading(false);
          return;
        }

        if (session?.user) {
          // Try to load profile with fallback to auth data
          let profile = await loadUserProfile(session.user.id);
          
          if (!isActive) return; // Component unmounted
          
          // If profile loading failed or timed out, use auth data as fallback
          if (!profile) {
            profile = {
              id: session.user.id,
              name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
              email: session.user.email,
              status: 'approved', // Assume approved if they can login
              role: 'player'
            };
            setUser(profile);
            
            // Try to sync with database in background (non-blocking)
            setTimeout(async () => {
              try {
                const { error: syncError } = await supabase
                  .from('profiles')
                  .upsert({
                    id: session.user.id,
                    name: profile.name,
                    email: profile.email,
                    status: 'approved',
                    role: 'player'
                  });
                
                if (syncError) {
                  // Background sync failed - not critical
                }
              } catch (syncError) {
                // Background sync error - not critical
              }
            }, 1000);
          }
        }
      } catch (error) {
        if (isActive) {
          setError(error);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    // Set a reasonable timeout
    const timeoutId = setTimeout(() => {
      if (isActive) {
        setLoading(false);
      }
    }, 5000); // Reduced to 5 seconds since we have fallbacks

    initializeAuth().finally(() => {
      clearTimeout(timeoutId);
    });

    // Cleanup function
    return () => {
      isActive = false;
      clearTimeout(timeoutId);
    };
  }, [checkForPasswordReset, loadUserProfile]);

  // Listen for auth changes (but avoid duplicate profile loading)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      
      switch (event) {
        case 'SIGNED_IN':
          // Only load profile if we don't already have a user (avoid duplicate loading)
          if (session && !checkForPasswordReset() && !user) {
            await loadUserProfile(session.user.id);
          }
          break;
          
        case 'SIGNED_OUT':
          setUser(null);
          setAuthMode('normal');
          break;
          
        case 'PASSWORD_RECOVERY':
          setAuthMode('reset');
          setUser(null);
          break;
          
        case 'INITIAL_SESSION':
          // Initial session event - skipping duplicate load
          break;
          
        default:
          break;
      }
    });

    return () => subscription.unsubscribe();
  }, [checkForPasswordReset, loadUserProfile, user]);

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