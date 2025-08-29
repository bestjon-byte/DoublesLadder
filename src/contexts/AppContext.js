// src/contexts/AppContext.js - CENTRALIZED STATE MANAGEMENT
import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { supabase } from '../supabaseClient';

const AppContext = createContext();

// Action types
const ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_USER: 'SET_USER',
  SET_USERS: 'SET_USERS',
  SET_SEASON: 'SET_SEASON',
  SET_AVAILABILITY: 'SET_AVAILABILITY',
  SET_FIXTURES: 'SET_FIXTURES',
  SET_RESULTS: 'SET_RESULTS',
  SET_AUTH_MODE: 'SET_AUTH_MODE',
  RESET_STATE: 'RESET_STATE'
};

// Initial state
const initialState = {
  loading: true,
  currentUser: null,
  users: [],
  currentSeason: null,
  availability: [],
  matchFixtures: [],
  matchResults: [],
  authMode: 'normal'
};

// Reducer
const appReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    
    case ACTIONS.SET_USER:
      return { ...state, currentUser: action.payload, loading: false };
    
    case ACTIONS.SET_USERS:
      return { ...state, users: action.payload };
    
    case ACTIONS.SET_SEASON:
      return { ...state, currentSeason: action.payload };
    
    case ACTIONS.SET_AVAILABILITY:
      return { ...state, availability: action.payload };
    
    case ACTIONS.SET_FIXTURES:
      return { ...state, matchFixtures: action.payload };
    
    case ACTIONS.SET_RESULTS:
      return { ...state, matchResults: action.payload };
    
    case ACTIONS.SET_AUTH_MODE:
      return { ...state, authMode: action.payload };
    
    case ACTIONS.RESET_STATE:
      return { ...initialState, loading: false };
    
    default:
      return state;
  }
};

// Provider component
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Data fetching functions
  const fetchUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('rank', { ascending: true, nullsLast: true });

      if (error) throw error;
      dispatch({ type: ACTIONS.SET_USERS, payload: data || [] });
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, []);

  const fetchSeasons = useCallback(async () => {
    try {
      const { data: activeSeasons, error: seasonError } = await supabase
        .from('seasons')
        .select('*')
        .eq('is_active', true)
        .limit(1);
      
      if (seasonError) throw seasonError;
      
      let activeSeason = activeSeasons?.[0];
      
      if (!activeSeason) {
        activeSeason = await createDefaultSeason();
        if (!activeSeason) return;
      }
      
      const { data: matches } = await supabase
        .from('matches')
        .select('*')
        .eq('season_id', activeSeason.id)
        .order('week_number', { ascending: true });
      
      const seasonWithMatches = {
        ...activeSeason,
        matches: matches || []
      };
      
      dispatch({ type: ACTIONS.SET_SEASON, payload: seasonWithMatches });
    } catch (error) {
      console.error('Error fetching seasons:', error);
    }
  }, []);

  const createDefaultSeason = useCallback(async () => {
    try {
      await supabase
        .from('seasons')
        .update({ is_active: false })
        .eq('is_active', true);
      
      const { data: newSeason, error } = await supabase
        .from('seasons')
        .insert({
          name: `Season ${new Date().getFullYear()}`,
          start_date: new Date().toISOString().split('T')[0],
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      return newSeason;
    } catch (error) {
      console.error('Error creating season:', error);
      return null;
    }
  }, []);

  const fetchAvailability = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('availability')
        .select('*');
      
      if (error) throw error;
      dispatch({ type: ACTIONS.SET_AVAILABILITY, payload: data || [] });
    } catch (error) {
      console.error('Error fetching availability:', error);
    }
  }, []);

  const fetchMatchFixtures = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('match_fixtures')
        .select(`
          *,
          player1:player1_id(name),
          player2:player2_id(name),
          player3:player3_id(name),
          player4:player4_id(name),
          sitting_player:sitting_player_id(name)
        `);
      
      if (error) throw error;
      dispatch({ type: ACTIONS.SET_FIXTURES, payload: data || [] });
    } catch (error) {
      console.error('Error fetching fixtures:', error);
    }
  }, []);

  const fetchMatchResults = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('match_results')
        .select('*');
      
      if (error) throw error;
      dispatch({ type: ACTIONS.SET_RESULTS, payload: data || [] });
    } catch (error) {
      console.error('Error fetching results:', error);
    }
  }, []);

  const loadUserAndData = useCallback(async (userId) => {
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      
      dispatch({ type: ACTIONS.SET_USER, payload: profile });

      // Load all app data in parallel
      await Promise.all([
        fetchUsers(),
        fetchSeasons(),
        fetchAvailability(),
        fetchMatchFixtures(),
        fetchMatchResults()
      ]);
      
    } catch (error) {
      console.error('Error loading user and data:', error);
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  }, [fetchUsers, fetchSeasons, fetchAvailability, fetchMatchFixtures, fetchMatchResults]);

  const resetAppState = useCallback(() => {
    dispatch({ type: ACTIONS.RESET_STATE });
  }, []);

  const setAuthMode = useCallback((mode) => {
    dispatch({ type: ACTIONS.SET_AUTH_MODE, payload: mode });
  }, []);

  const setLoading = useCallback((loading) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: loading });
  }, []);

  // Helper functions
  const getPlayerAvailability = useCallback((userId, matchId) => {
    const match = state.currentSeason?.matches?.find(m => m.id === matchId);
    if (!match) return undefined;
    
    const userAvailability = state.availability.find(
      a => a.player_id === userId && a.match_date === match.match_date
    );
    return userAvailability?.is_available;
  }, [state.currentSeason, state.availability]);

  const getAvailabilityStats = useCallback((matchId) => {
    const match = state.currentSeason?.matches?.find(m => m.id === matchId);
    if (!match) return { total: 0, available: 0, responded: 0, pending: 0 };
    
    const ladderPlayers = state.users.filter(u => u.in_ladder && u.status === 'approved');
    const availableCount = state.availability.filter(
      a => a.match_date === match.match_date && a.is_available === true
    ).length;
    const respondedCount = state.availability.filter(
      a => a.match_date === match.match_date && (a.is_available === true || a.is_available === false)
    ).length;
    
    return {
      total: ladderPlayers.length,
      available: availableCount,
      responded: respondedCount,
      pending: ladderPlayers.length - respondedCount
    };
  }, [state.currentSeason, state.users, state.availability]);

  const getMatchScore = useCallback((fixtureId) => {
    return state.matchResults.find(r => r.fixture_id === fixtureId);
  }, [state.matchResults]);

  const value = {
    ...state,
    // Actions
    loadUserAndData,
    resetAppState,
    setAuthMode,
    setLoading,
    // Data fetchers
    fetchUsers,
    fetchSeasons,
    fetchAvailability,
    fetchMatchFixtures,
    fetchMatchResults,
    // Helpers
    getPlayerAvailability,
    getAvailabilityStats,
    getMatchScore
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};