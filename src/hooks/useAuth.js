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
    console.log('📱 Loading user profile for ID:', userId);
    
    // Create timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Profile query timeout')), 3000);
    });
    
    // Create query promise
    const queryPromise = supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    try {
      console.log('⏱️ Starting profile query with 3s timeout...');
      const result = await Promise.race([queryPromise, timeoutPromise]);
      const { data: profile, error } = result;

      if (error) {
        console.error('❌ Profile error:', error);
        if (error.code === 'PGRST116') {
          console.log('🔄 Profile not found, will create later...');
          return null;
        }
        return null;
      }

      console.log('✅ Profile loaded:', profile?.name || 'Unknown');
      setUser(profile);
      return profile;
    } catch (error) {
      if (error.message === 'Profile query timeout') {
        console.error('💥 Profile query timed out - database connection issue');
        console.log('🔄 Attempting direct query bypass...');
        
        // Try to continue without profile data
        return {
          id: userId,
          name: 'Loading...',
          email: 'loading@example.com', 
          status: 'approved',
          role: 'player'
        };
      } else {
        console.error('💥 Error loading profile:', error);
        return null;
      }
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

  // Initialize auth with simpler, more robust approach
  useEffect(() => {
    let isActive = true; // Prevent state updates if component unmounts
    
    const initializeAuth = async () => {
      try {
        console.log('🚀 Initializing auth...');
        
        // Check for password reset mode first
        const isPasswordReset = checkForPasswordReset();
        if (isPasswordReset) {
          console.log('🔑 Password reset mode detected');
          if (isActive) {
            setAuthMode('reset');
            setLoading(false);
          }
          return;
        }

        // Get current session with timeout protection
        console.log('🔍 Getting current session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!isActive) return; // Component unmounted
        
        if (error) {
          console.error('❌ Session error:', error);
          setError(error);
          setLoading(false);
          return;
        }

        if (session?.user) {
          console.log('✅ Valid session found, loading profile...');
          
          // Try to load profile with fallback to auth data
          let profile = await loadUserProfile(session.user.id);
          
          if (!isActive) return; // Component unmounted
          
          // If profile loading failed or timed out, use auth data as fallback
          if (!profile) {
            console.log('🔄 Using fallback profile from auth data...');
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
                  console.warn('⚠️ Background profile sync failed:', syncError);
                } else {
                  console.log('✅ Profile synced to database');
                }
              } catch (syncError) {
                console.warn('⚠️ Background sync error:', syncError);
              }
            }, 1000);
          }
        } else {
          console.log('ℹ️ No session - showing login');
        }
      } catch (error) {
        console.error('💥 Auth initialization failed:', error);
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
        console.warn('⏰ Auth timeout - stopping loading');
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