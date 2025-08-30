// src/hooks/useOptimizedData.js - PERFORMANCE OPTIMIZED HOOKS
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../supabaseClient';

// Cache for preventing duplicate requests
const cache = new Map();
const CACHE_DURATION = 30000; // 30 seconds

const getCacheKey = (table, query = {}) => {
  return `${table}_${JSON.stringify(query)}`;
};

const getCachedData = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

const setCachedData = (key, data) => {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
};

// Hook for optimized user fetching
export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsers = useCallback(async () => {
    const cacheKey = getCacheKey('profiles');
    const cachedData = getCachedData(cacheKey);
    
    if (cachedData) {
      setUsers(cachedData);
      setLoading(false);
      return cachedData;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('id, name, email, status, role, in_ladder, rank, previous_rank, matches_played, matches_won, games_played, games_won, created_at')
        .order('rank', { ascending: true, nullsLast: true });

      if (fetchError) throw fetchError;

      const userData = data || [];
      setUsers(userData);
      setCachedData(cacheKey, userData);
      
      return userData;
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const ladderUsers = useMemo(() => 
    users.filter(user => user.in_ladder && user.status === 'approved')
      .sort((a, b) => (a.rank || 999) - (b.rank || 999)),
    [users]
  );

  const pendingUsers = useMemo(() => 
    users.filter(user => user.status === 'pending'),
    [users]
  );

  const approvedNonLadderUsers = useMemo(() => 
    users.filter(user => user.status === 'approved' && !user.in_ladder),
    [users]
  );

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    ladderUsers,
    pendingUsers,
    approvedNonLadderUsers,
    loading,
    error,
    refetch: fetchUsers
  };
};

// Hook for optimized season fetching
export const useSeason = () => {
  const [currentSeason, setCurrentSeason] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSeason = useCallback(async () => {
    const cacheKey = getCacheKey('seasons_active');
    const cachedData = getCachedData(cacheKey);
    
    if (cachedData) {
      setCurrentSeason(cachedData);
      setLoading(false);
      return cachedData;
    }

    try {
      setLoading(true);
      setError(null);

      // Get active season
      const { data: activeSeasons, error: seasonError } = await supabase
        .from('seasons')
        .select('*')
        .eq('is_active', true)
        .limit(1);
      
      if (seasonError) throw seasonError;
      
      let activeSeason = activeSeasons?.[0];
      
      if (!activeSeason) {
        // Create default season
        await supabase
          .from('seasons')
          .update({ is_active: false })
          .eq('is_active', true);
        
        const { data: newSeason, error: createError } = await supabase
          .from('seasons')
          .insert({
            name: `Season ${new Date().getFullYear()}`,
            start_date: new Date().toISOString().split('T')[0],
            is_active: true
          })
          .select()
          .single();

        if (createError) throw createError;
        activeSeason = newSeason;
      }
      
      // Get matches for this season
      const { data: matches, error: matchesError } = await supabase
        .from('matches')
        .select('id, season_id, week_number, match_date, status, created_at')
        .eq('season_id', activeSeason.id)
        .order('week_number', { ascending: true });
      
      if (matchesError) throw matchesError;
      
      const seasonWithMatches = {
        ...activeSeason,
        matches: matches || []
      };
      
      setCurrentSeason(seasonWithMatches);
      setCachedData(cacheKey, seasonWithMatches);
      
      return seasonWithMatches;
    } catch (err) {
      console.error('Error fetching season:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSeason();
  }, [fetchSeason]);

  return {
    currentSeason,
    loading,
    error,
    refetch: fetchSeason
  };
};

// Hook for optimized match fixtures
export const useMatchFixtures = (matchId = null) => {
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFixtures = useCallback(async () => {
    const cacheKey = getCacheKey('match_fixtures', { matchId });
    const cachedData = getCachedData(cacheKey);
    
    if (cachedData) {
      setFixtures(cachedData);
      setLoading(false);
      return cachedData;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('match_fixtures')
        .select(`
          id, match_id, court_number, game_number,
          player1_id, player2_id, player3_id, player4_id,
          pair1_player1_id, pair1_player2_id, pair2_player1_id, pair2_player2_id,
          sitting_player_id, created_at,
          player1:player1_id(id, name),
          player2:player2_id(id, name),
          player3:player3_id(id, name),
          player4:player4_id(id, name),
          sitting_player:sitting_player_id(id, name)
        `);

      if (matchId) {
        query = query.eq('match_id', matchId);
      }

      const { data, error: fetchError } = await query
        .order('court_number', { ascending: true })
        .order('game_number', { ascending: true });

      if (fetchError) throw fetchError;

      const fixtureData = data || [];
      setFixtures(fixtureData);
      setCachedData(cacheKey, fixtureData);
      
      return fixtureData;
    } catch (err) {
      console.error('Error fetching fixtures:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  // Memoized court grouping
  const courtFixtures = useMemo(() => {
    const courtGroups = {};
    
    fixtures.forEach(fixture => {
      if (!courtGroups[fixture.court_number]) {
        courtGroups[fixture.court_number] = [];
      }
      courtGroups[fixture.court_number].push(fixture);
    });
    
    return Object.entries(courtGroups).map(([courtNumber, courtFixtures]) => ({
      court: parseInt(courtNumber),
      fixtures: courtFixtures.sort((a, b) => a.game_number - b.game_number)
    }));
  }, [fixtures]);

  useEffect(() => {
    fetchFixtures();
  }, [fetchFixtures]);

  return {
    fixtures,
    courtFixtures,
    loading,
    error,
    refetch: fetchFixtures
  };
};

// Hook for optimized match results
export const useMatchResults = (fixtureIds = null) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchResults = useCallback(async () => {
    const cacheKey = getCacheKey('match_results', { fixtureIds });
    const cachedData = getCachedData(cacheKey);
    
    if (cachedData) {
      setResults(cachedData);
      setLoading(false);
      return cachedData;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('match_results')
        .select('id, fixture_id, pair1_score, pair2_score, submitted_by, created_at');

      if (fixtureIds && Array.isArray(fixtureIds)) {
        query = query.in('fixture_id', fixtureIds);
      }

      const { data, error: fetchError } = await query
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const resultData = data || [];
      setResults(resultData);
      setCachedData(cacheKey, resultData);
      
      return resultData;
    } catch (err) {
      console.error('Error fetching results:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [fixtureIds]);

  // Helper to get score for a specific fixture
  const getFixtureScore = useCallback((fixtureId) => {
    return results.find(r => r.fixture_id === fixtureId);
  }, [results]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  return {
    results,
    loading,
    error,
    getFixtureScore,
    refetch: fetchResults
  };
};

// Hook for optimized availability data
export const useAvailability = (matchDate = null) => {
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAvailability = useCallback(async () => {
    const cacheKey = getCacheKey('availability', { matchDate });
    const cachedData = getCachedData(cacheKey);
    
    if (cachedData) {
      setAvailability(cachedData);
      setLoading(false);
      return cachedData;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('availability')
        .select('id, player_id, match_date, is_available, created_at');

      if (matchDate) {
        query = query.eq('match_date', matchDate);
      }

      const { data, error: fetchError } = await query
        .order('match_date', { ascending: false });

      if (fetchError) throw fetchError;

      const availabilityData = data || [];
      setAvailability(availabilityData);
      setCachedData(cacheKey, availabilityData);
      
      return availabilityData;
    } catch (err) {
      console.error('Error fetching availability:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [matchDate]);

  // Helper to get player availability for a specific match
  const getPlayerAvailability = useCallback((playerId, matchDate) => {
    const record = availability.find(
      a => a.player_id === playerId && a.match_date === matchDate
    );
    return record?.is_available;
  }, [availability]);

  // Helper to get availability stats for a match
  const getMatchStats = useCallback((matchDate, totalPlayers) => {
    const matchAvailability = availability.filter(a => a.match_date === matchDate);
    const availableCount = matchAvailability.filter(a => a.is_available === true).length;
    const respondedCount = matchAvailability.length;
    
    return {
      total: totalPlayers,
      available: availableCount,
      responded: respondedCount,
      pending: totalPlayers - respondedCount
    };
  }, [availability]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  return {
    availability,
    loading,
    error,
    getPlayerAvailability,
    getMatchStats,
    refetch: fetchAvailability
  };
};

// Utility to invalidate cache
export const invalidateCache = (pattern = null) => {
  if (pattern) {
    // Clear cache entries matching pattern
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    }
  } else {
    // Clear all cache
    cache.clear();
  }
};

// Utility to preload data
export const preloadData = async (tables = []) => {
  const promises = tables.map(table => {
    switch (table) {
      case 'users':
        return supabase.from('profiles').select('*');
      case 'season':
        return supabase.from('seasons').select('*').eq('is_active', true);
      case 'fixtures':
        return supabase.from('match_fixtures').select('*');
      case 'results':
        return supabase.from('match_results').select('*');
      case 'availability':
        return supabase.from('availability').select('*');
      default:
        return Promise.resolve();
    }
  });

  try {
    await Promise.all(promises);
    console.log('✅ Data preloaded successfully');
  } catch (error) {
    console.error('❌ Error preloading data:', error);
  }
};