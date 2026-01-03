// src/hooks/useAuth.js
// Handles all authentication logic

import { useState, useEffect, useCallback } from 'react';
import { supabase, supabaseUrl } from '../supabaseClient';

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

      setUser(profile);
      return profile;
    } catch (error) {
      if (error.message === 'Profile query timeout') {
        console.warn('⚠️ [useAuth] Profile query timeout - returning null to trigger retry');
        // Return null to trigger retry logic instead of using bad fallback data
        return null;
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

  // Sign up - Auto-creates approved profile immediately
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

      // Auto-create profile with approved status
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            name: name,
            email: email,
            role: 'player',
            status: 'approved'
          }, { onConflict: 'id' });

        if (profileError) {
          console.error('Failed to create profile:', profileError);
          // Continue - user can still be approved later if profile creation fails
        }

        // Send admin notification email about new user (optional - just FYI)
        try {
          const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
          await fetch(
            `${supabaseUrl}/functions/v1/notify-new-user-signup`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': anonKey,
                'Authorization': `Bearer ${anonKey}`,
              },
              body: JSON.stringify({
                user_id: data.user.id,
                email: email,
                name: name,
              }),
            }
          );
        } catch (emailError) {
          console.warn('Failed to send admin notification:', emailError);
        }
      }

      return { success: true, needsApproval: false };
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

  // Password reset is now handled by custom edge function via PasswordReset component
  // Old Supabase resetPasswordForEmail method removed to avoid confusion

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

        // Check for password reset mode first
        const isPasswordReset = checkForPasswordReset();
        if (isPasswordReset) {
          if (isActive) {
            setAuthMode('reset');
            setLoading(false);
          }
          return;
        }

        // Get current session with timeout protection
        const { data: { session }, error } = await supabase.auth.getSession();


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

          // If profile loading failed or timed out, retry once before giving up
          if (!profile) {
            // Wait a bit and try one more time
            await new Promise(resolve => setTimeout(resolve, 500));
            profile = await loadUserProfile(session.user.id);

            if (!isActive) return; // Component unmounted

            // If still no profile, use minimal fallback WITHOUT setting role
            // (role will be fetched when profile eventually loads)
            if (!profile) {
              profile = {
                id: session.user.id,
                name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
                email: session.user.email,
                status: 'pending', // Don't assume approved
                role: null // Don't assume role - will be set when profile loads
              };
              setUser(profile);
              // DO NOT upsert to database - that would overwrite existing data!
            }
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
      // requestPasswordReset removed - now handled by PasswordReset component
      updatePassword,
      setAuthMode,
    }
  };
};