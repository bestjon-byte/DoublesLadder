// src/App.js - Updated with enhanced auth logging
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

// Component imports
import AuthScreen from './components/Auth/AuthScreen';
import Header from './components/Layout/Header';
import Navigation from './components/Layout/Navigation';
import LadderTab from './components/Ladder/LadderTab';
import MatchesTab from './components/Matches/MatchesTab';
import AvailabilityTab from './components/Availability/AvailabilityTab';
import AdminTab from './components/Admin/AdminTab';
import ScheduleModal from './components/Modals/ScheduleModal';
import ScoreModal from './components/Modals/ScoreModal';

const TennisLadderApp = () => {
  // State variables
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [currentSeason, setCurrentSeason] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [matchFixtures, setMatchFixtures] = useState([]);
  const [matchResults, setMatchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ladder');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [newMatchDate, setNewMatchDate] = useState('');
  const [isPasswordResetMode, setIsPasswordResetMode] = useState(false); // NEW STATE

  // Authentication and initialization with enhanced logging
  useEffect(() => {
    console.log('🚀 App starting up, checking initial session...');
    
    // FIRST: Check for password reset tokens in URL (before checking session)
    const checkForPasswordReset = () => {
      console.log('🔍 Checking for password reset URL...');
      console.log('Current URL:', window.location.href);
      
      // Check both query params and hash fragments (Supabase uses hash)
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      
      // Try query params first, then hash params
      let type = urlParams.get('type') || hashParams.get('type');
      let accessToken = urlParams.get('access_token') || hashParams.get('access_token');
      let refreshToken = urlParams.get('refresh_token') || hashParams.get('refresh_token');

      console.log('🔑 Auth tokens found:', { 
        type, 
        accessToken: !!accessToken, 
        refreshToken: !!refreshToken,
        from: accessToken ? (urlParams.get('access_token') ? 'query' : 'hash') : 'none'
      });

      if (type === 'recovery' && accessToken && refreshToken) {
        console.log('✅ Password reset detected - BLOCKING normal auth flow');
        
        // Set the session for password recovery (but don't fetch user profile)
        supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        }).then(({ data, error }) => {
          console.log('🔐 Password recovery session set:', { data, error });
        });
        
        // Force the user to null and show AuthScreen in update mode
        setCurrentUser(null);
        setLoading(false);
        setIsPasswordResetMode(true); // Set password reset mode
        
        // Clean up URL to remove tokens
        if (window.history.replaceState) {
          const cleanUrl = window.location.origin + window.location.pathname;
          window.history.replaceState(null, '', cleanUrl);
          console.log('🧹 URL cleaned:', cleanUrl);
        }
        
        return true; // Indicates password reset detected - block normal flow
      }
      
      return false; // No password reset
    };
    
    const isPasswordReset = checkForPasswordReset();
    
    // Only check normal session if it's NOT a password reset
    if (!isPasswordReset) {
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        console.log('📧 Initial session check:', { session, error });
        
        if (error) {
          console.error('❌ Error getting initial session:', error);
        }
        
        if (session) {
          console.log('✅ Found existing session for user:', session.user.email);
          fetchUserProfile(session.user.id);
        } else {
          console.log('ℹ️ No existing session found');
          setLoading(false);
        }
      });
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth state changed:', { event, session, isPasswordResetMode });
      
      // If we're in password reset mode, only allow specific events
      if (isPasswordResetMode) {
        if (event === 'SIGNED_OUT') {
          console.log('✅ Sign out during password reset - clearing reset mode');
          setIsPasswordResetMode(false);
          setCurrentUser(null);
          setLoading(false);
          return;
        } else if (event === 'SIGNED_IN') {
          console.log('✅ Password reset complete - user signed in normally');
          setIsPasswordResetMode(false);
          fetchUserProfile(session.user.id);
          return;
        } else {
          console.log('🚫 Ignoring auth event during password reset:', event);
          return;
        }
      }
      
      if (event === 'SIGNED_IN') {
        console.log('✅ User signed in:', session.user.email);
        fetchUserProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        console.log('👋 User signed out');
        setCurrentUser(null);
        setLoading(false);
      } else if (event === 'PASSWORD_RECOVERY') {
        console.log('🔑 Password recovery event detected');
        // Don't auto-login during password recovery
        setCurrentUser(null);
        setLoading(false);
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('🔄 Auth token refreshed');
      } else {
        console.log('📝 Other auth event:', event);
      }

      // Only process session changes if NOT in password reset mode
      if (!isPasswordResetMode) {
        if (session && event !== 'PASSWORD_RECOVERY') {
          fetchUserProfile(session.user.id);
        } else if (!session && event !== 'PASSWORD_RECOVERY') {
          setCurrentUser(null);
          setLoading(false);
        }
      }
    });

    return () => {
      console.log('🧹 Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, [isPasswordResetMode]); // Add isPasswordResetMode to dependency array

  const fetchUserProfile = async (userId) => {
    try {
      console.log('👤 Fetching user profile for ID:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Error fetching user profile:', error);
      } else if (data) {
        console.log('✅ User profile loaded:', { name: data.name, role: data.role, status: data.status });
        setCurrentUser(data);
        
        console.log('📊 Loading additional app data...');
        await Promise.all([
          fetchUsers(),
          fetchSeasons(),
          fetchAvailability(),
          fetchMatchFixtures(),
          fetchMatchResults()
        ]);
        console.log('✅ All app data loaded successfully');
      }
    } catch (error) {
      console.error('💥 Unexpected error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('rank', { ascending: true, nullsLast: true });

      if (data) {
        setUsers(data);
      }
      if (error) {
        console.error('Error fetching users:', error);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchSeasons = async () => {
    try {
      console.log('Fetching seasons...');
      
      const { data: activeSeasons, error: seasonError } = await supabase
        .from('seasons')
        .select('*')
        .eq('is_active', true)
        .limit(1);
      
      console.log('Active season query result:', { activeSeasons, seasonError });
      
      if (seasonError) {
        console.error('Error fetching active season:', seasonError);
        return;
      }
      
      let activeSeason = activeSeasons?.[0];
      
      if (!activeSeason) {
        console.log('No active season found, creating default season');
        activeSeason = await createDefaultSeason();
        if (!activeSeason) return;
      }
      
      const { data: matches, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .eq('season_id', activeSeason.id)
        .order('week_number', { ascending: true });
      
      console.log('Matches query result:', { matches, matchesError });
      
      const seasonWithMatches = {
        ...activeSeason,
        matches: matches || []
      };
      
      console.log('Setting current season:', seasonWithMatches);
      setCurrentSeason(seasonWithMatches);
      setSeasons([seasonWithMatches]);
    } catch (error) {
      console.error('Error in fetchSeasons:', error);
    }
  };

  const createDefaultSeason = async () => {
    try {
      console.log('Creating default season...');
      
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

      if (error) {
        console.error('Error creating default season:', error);
        alert('Error creating season: ' + error.message);
        return null;
      } else {
        console.log('Default season created:', newSeason);
        return newSeason;
      }
    } catch (error) {
      console.error('Error in createDefaultSeason:', error);
      return null;
    }
  };

  const fetchAvailability = async () => {
    try {
      const { data, error } = await supabase
        .from('availability')
        .select('*');

      if (data) {
        setAvailability(data);
      }
      if (error) {
        console.error('Error fetching availability:', error);
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
    }
  };

  const fetchMatchFixtures = async () => {
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

      if (data) {
        setMatchFixtures(data);
      }
      if (error) {
        console.error('Error fetching match fixtures:', error);
      }
    } catch (error) {
      console.error('Error fetching match fixtures:', error);
    }
  };

  const fetchMatchResults = async () => {
    try {
      const { data, error } = await supabase
        .from('match_results')
        .select('*');

      if (data) {
        setMatchResults(data);
      }
      if (error) {
        console.error('Error fetching match results:', error);
      }
    } catch (error) {
      console.error('Error fetching match results:', error);
    }
  };

  const addMatchToSeason = async () => {
    console.log('addMatchToSeason called');
    console.log('newMatchDate:', newMatchDate);
    console.log('currentSeason:', currentSeason);
    
    if (!newMatchDate) {
      alert('Please select a date for the match');
      return;
    }
    
    if (!currentSeason) {
      alert('No active season found. Please create a season first.');
      return;
    }
    
    try {
      const weekNumber = (currentSeason?.matches?.length || 0) + 1;
      console.log('Inserting match with weekNumber:', weekNumber);
      
      const { data, error } = await supabase
        .from('matches')
        .insert({
          season_id: currentSeason.id,
          week_number: weekNumber,
          match_date: newMatchDate
        })
        .select();

      if (error) {
        console.error('Supabase error details:', error);
        alert('Error adding match: ' + error.message);
      } else {
        console.log('Match added successfully:', data);
        await fetchSeasons();
        setShowScheduleModal(false);
        setNewMatchDate('');
      }
    } catch (error) {
      console.error('Error adding match:', error);
      alert('Error adding match: ' + error.message);
    }
  };

  const clearOldMatches = async () => {
    if (!currentUser?.role === 'admin') return;
    
    const confirmed = window.confirm('This will delete ALL matches and related data. Are you sure?');
    if (!confirmed) return;
    
    try {
      await supabase.from('match_results').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('match_fixtures').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('availability').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('matches').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      alert('All match data cleared successfully!');
      await fetchSeasons();
    } catch (error) {
      console.error('Error clearing data:', error);
      alert('Error clearing data: ' + error.message);
    }
  };

  const approveUser = async (userId) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'approved' })
        .eq('id', userId);

      if (error) {
        alert('Error approving user: ' + error.message);
      } else {
        await fetchUsers();
      }
    } catch (error) {
      console.error('Error approving user:', error);
    }
  };

  const addToLadder = async (userId, rank) => {
    console.log('addToLadder called with:', { userId, rank });
    
    try {
      const targetRank = parseInt(rank);
      console.log('Target rank:', targetRank);
      
      const { data: playersToShift, error: getError } = await supabase
        .from('profiles')
        .select('id, rank')
        .gte('rank', targetRank)
        .eq('in_ladder', true)
        .order('rank', { ascending: true });

      if (getError) {
        console.error('Error getting players to shift:', getError);
        alert('Error getting players: ' + getError.message);
        return;
      }

      if (playersToShift && playersToShift.length > 0) {
        for (const player of playersToShift) {
          const { error: shiftError } = await supabase
            .from('profiles')
            .update({ rank: player.rank + 1 })
            .eq('id', player.id);
          
          if (shiftError) {
            console.error('Error shifting player:', shiftError);
            alert('Error shifting ranks: ' + shiftError.message);
            return;
          }
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update({ 
          in_ladder: true, 
          rank: targetRank
        })
        .eq('id', userId);

      if (error) {
        console.error('Error adding to ladder:', error);
        alert('Error adding to ladder: ' + error.message);
      } else {
        console.log('Successfully added to ladder');
        await fetchUsers();
      }
    } catch (error) {
      console.error('Error in addToLadder:', error);
      alert('Error in addToLadder: ' + error.message);
    }
  };

  const setPlayerAvailability = async (matchId, available, userId = currentUser?.id) => {
    try {
      console.log('setPlayerAvailability called with:', { matchId, available, userId });
      
      const match = currentSeason?.matches?.find(m => m.id === matchId);
      if (!match) {
        alert('Match not found');
        return;
      }
      
      const matchDate = match.match_date;
      console.log('Using match date:', matchDate);
      
      if (available === undefined) {
        console.log('Removing availability record');
        const { error } = await supabase
          .from('availability')
          .delete()
          .eq('player_id', userId)
          .eq('match_date', matchDate);
        
        if (error) {
          console.error('Error removing availability:', error);
          alert('Error clearing availability: ' + error.message);
        }
      } else {
        console.log('Checking for existing record...');
        const { data: existing } = await supabase
          .from('availability')
          .select('*')
          .eq('player_id', userId)
          .eq('match_date', matchDate)
          .maybeSingle();
        
        console.log('Existing availability record:', existing);
        
        if (existing) {
          console.log('Updating existing record');
          const { error } = await supabase
            .from('availability')
            .update({ is_available: available })
            .eq('player_id', userId)
            .eq('match_date', matchDate);
          
          if (error) {
            console.error('Error updating availability:', error);
            alert('Error updating availability: ' + error.message);
          }
        } else {
          console.log('Inserting new record');
          const { error } = await supabase
            .from('availability')
            .insert({
              player_id: userId,
              match_date: matchDate,
              is_available: available
            });
          
          if (error) {
            console.error('Error inserting availability:', error);
            alert('Error setting availability: ' + error.message);
          }
        }
      }
      
      console.log('Refreshing availability data...');
      await fetchAvailability();
    } catch (error) {
      console.error('Error in setPlayerAvailability:', error);
      alert('Error managing availability: ' + error.message);
    }
  };

  const getPlayerAvailability = (userId, matchId) => {
    const match = currentSeason?.matches?.find(m => m.id === matchId);
    if (!match) return undefined;
    
    const userAvailability = availability.find(a => a.player_id === userId && a.match_date === match.match_date);
    return userAvailability?.is_available;
  };

  const getAvailabilityStats = (matchId) => {
    const match = currentSeason?.matches?.find(m => m.id === matchId);
    if (!match) return { total: 0, available: 0, responded: 0, pending: 0 };
    
    const ladderPlayers = users.filter(u => u.in_ladder && u.status === 'approved');
    const availableCount = availability.filter(a => a.match_date === match.match_date && a.is_available === true).length;
    const respondedCount = availability.filter(a => a.match_date === match.match_date && (a.is_available === true || a.is_available === false)).length;
    
    return {
      total: ladderPlayers.length,
      available: availableCount,
      responded: respondedCount,
      pending: ladderPlayers.length - respondedCount
    };
  };

  const generateMatches = async (matchId) => {
    console.log('generateMatches called with matchId:', matchId);
    
    const match = currentSeason?.matches?.find(m => m.id === matchId);
    if (!match) {
      alert('Match not found');
      return;
    }
    
    console.log('Found match:', match);
    
    const availablePlayers = users.filter(user => {
      if (!user.in_ladder || user.status !== 'approved') return false;
      
      const userAvailability = availability.find(a => a.player_id === user.id && a.match_date === match.match_date);
      const isAvailable = userAvailability?.is_available === true;
      
      console.log(`Player ${user.name}: in_ladder=${user.in_ladder}, status=${user.status}, available=${isAvailable}`);
      
      return isAvailable;
    }).sort((a, b) => (a.rank || 999) - (b.rank || 999));

    console.log('Available players:', availablePlayers.map(p => `${p.name} (Rank ${p.rank})`));
    const numPlayers = availablePlayers.length;
    
    if (numPlayers < 4) {
      alert(`Need at least 4 players to generate matches. Found ${numPlayers} available players.`);
      return;
    }

    const courts = [];

    // Intelligent grouping based on available players
    if (numPlayers % 4 === 0) {
      for (let i = 0; i < numPlayers; i += 4) {
        courts.push(availablePlayers.slice(i, i + 4));
      }
    } else if (numPlayers === 5) {
      courts.push(availablePlayers);
    } else if (numPlayers === 9) {
      courts.push(availablePlayers.slice(0, 4));
      courts.push(availablePlayers.slice(4, 9));
    } else if (numPlayers === 10) {
      courts.push(availablePlayers.slice(0, 5));
      courts.push(availablePlayers.slice(5, 10));
    } else if (numPlayers === 6) {
      courts.push(availablePlayers);
    } else if (numPlayers === 7) {
      courts.push(availablePlayers);
    } else if (numPlayers === 13) {
      courts.push(availablePlayers.slice(0, 4));
      courts.push(availablePlayers.slice(4, 8));
      courts.push(availablePlayers.slice(8, 13));
    } else if (numPlayers === 14) {
      courts.push(availablePlayers.slice(0, 5));
      courts.push(availablePlayers.slice(5, 10));
      courts.push(availablePlayers.slice(10, 14));
    } else {
      const groups = Math.floor(numPlayers / 4);
      const remainder = numPlayers % 4;
      
      for (let i = 0; i < groups; i++) {
        courts.push(availablePlayers.slice(i * 4, (i + 1) * 4));
      }
      
      if (remainder > 0) {
        courts.push(availablePlayers.slice(groups * 4));
      }
    }

    // Generate match fixtures for each court
    try {
      const fixturesToInsert = [];

      courts.forEach((courtPlayers, courtIndex) => {
        const courtNumber = courtIndex + 1;
        let gameNumber = 1;

        if (courtPlayers.length === 5) {
          // 5-player rotation
          const rotations = [
            { pair1: [0, 1], pair2: [2, 3], sitting: 4 },
            { pair1: [0, 2], pair2: [1, 4], sitting: 3 },
            { pair1: [0, 3], pair2: [2, 4], sitting: 1 },
            { pair1: [0, 4], pair2: [1, 3], sitting: 2 },
            { pair1: [1, 2], pair2: [3, 4], sitting: 0 }
          ];

          rotations.forEach(rotation => {
            fixturesToInsert.push({
              match_id: matchId,
              court_number: courtNumber,
              game_number: gameNumber++,
              player1_id: courtPlayers[rotation.pair1[0]].id,
              player2_id: courtPlayers[rotation.pair1[1]].id,
              player3_id: courtPlayers[rotation.pair2[0]].id,
              player4_id: courtPlayers[rotation.pair2[1]].id,
              pair1_player1_id: courtPlayers[rotation.pair1[0]].id,
              pair1_player2_id: courtPlayers[rotation.pair1[1]].id,
              pair2_player1_id: courtPlayers[rotation.pair2[0]].id,
              pair2_player2_id: courtPlayers[rotation.pair2[1]].id,
              sitting_player_id: courtPlayers[rotation.sitting].id
            });
          });
        } else if (courtPlayers.length === 4) {
          // Standard 4-player format
          const rotations = [
            { pair1: [0, 3], pair2: [1, 2] },
            { pair1: [0, 2], pair2: [1, 3] },
            { pair1: [0, 1], pair2: [2, 3] }
          ];

          rotations.forEach(rotation => {
            fixturesToInsert.push({
              match_id: matchId,
              court_number: courtNumber,
              game_number: gameNumber++,
              player1_id: courtPlayers[rotation.pair1[0]].id,
              player2_id: courtPlayers[rotation.pair1[1]].id,
              player3_id: courtPlayers[rotation.pair2[0]].id,
              player4_id: courtPlayers[rotation.pair2[1]].id,
              pair1_player1_id: courtPlayers[rotation.pair1[0]].id,
              pair1_player2_id: courtPlayers[rotation.pair1[1]].id,
              pair2_player1_id: courtPlayers[rotation.pair2[0]].id,
              pair2_player2_id: courtPlayers[rotation.pair2[1]].id,
              sitting_player_id: null
            });
          });
        }
      });

      console.log('About to insert fixtures:', fixturesToInsert.length, 'fixtures');
      
      const { error } = await supabase
        .from('match_fixtures')
        .insert(fixturesToInsert);

      if (error) {
        console.error('Error saving fixtures:', error);
        alert('Error generating matches: ' + error.message);
        return;
      }

      console.log('Fixtures inserted successfully');

      await Promise.all([
        fetchMatchFixtures(),
        fetchSeasons()
      ]);

      console.log(`Matches generated successfully! Created ${courts.length} court(s) with ${numPlayers} players.`);
    } catch (error) {
      console.error('Error in generateMatches:', error);
      alert('Error generating matches: ' + error.message);
    }
  };

  const openScoreModal = (matchData) => {
    setSelectedMatch(matchData);
    setShowScoreModal(true);
  };

  const submitScore = async (pair1Score, pair2Score) => {
    if (!selectedMatch) return;
    
    try {
      const { error } = await supabase
        .from('match_results')
        .insert({
          fixture_id: selectedMatch.fixtureId,
          pair1_score: parseInt(pair1Score),
          pair2_score: parseInt(pair2Score),
          submitted_by: currentUser.id
        });
      
      if (error) {
        console.error('Error submitting score:', error);
        alert('Error submitting score: ' + error.message);
      } else {
        await Promise.all([
          fetchMatchResults(),
          fetchSeasons()
        ]);
        setShowScoreModal(false);
        setSelectedMatch(null);
        console.log('Score submitted successfully');
      }
    } catch (error) {
      console.error('Error in submitScore:', error);
      alert('Error submitting score: ' + error.message);
    }
  };

  const getMatchScore = (fixtureId) => {
    return matchResults.find(r => r.fixture_id === fixtureId);
  };

  const updateRankings = async () => {
    try {
      console.log('Updating rankings...');
      
      const { data: resultsData, error } = await supabase
        .from('match_results')
        .select(`
          *,
          fixture:fixture_id (
            *,
            player1:player1_id(id, name),
            player2:player2_id(id, name),
            player3:player3_id(id, name),
            player4:player4_id(id, name)
          )
        `);

      if (error) {
        console.error('Error fetching results:', error);
        alert('Error fetching results: ' + error.message);
        return;
      }

      const ladderPlayers = users.filter(u => u.in_ladder && u.status === 'approved');
      const playerStats = {};
      
      ladderPlayers.forEach(player => {
        playerStats[player.id] = {
          name: player.name,
          matchesPlayed: 0,
          matchesWon: 0,
          gamesPlayed: 0,
          gamesWon: 0,
          winPercentage: 0
        };
      });

      resultsData.forEach(result => {
        const fixture = result.fixture;
        const players = [fixture.player1, fixture.player2, fixture.player3, fixture.player4];
        
        players.forEach(player => {
          if (player && playerStats[player.id]) {
            const stats = playerStats[player.id];
            stats.matchesPlayed += 1;
            stats.gamesPlayed += (result.pair1_score + result.pair2_score);
            
            const isInPair1 = (fixture.pair1_player1_id === player.id || fixture.pair1_player2_id === player.id);
            const wonMatch = isInPair1 ? result.pair1_score > result.pair2_score : result.pair2_score > result.pair1_score;
            const gamesWon = isInPair1 ? result.pair1_score : result.pair2_score;
            
            if (wonMatch) {
              stats.matchesWon += 1;
            }
            stats.gamesWon += gamesWon;
          }
        });
      });

      Object.values(playerStats).forEach(stats => {
        stats.winPercentage = stats.gamesPlayed > 0 ? 
          Math.round((stats.gamesWon / stats.gamesPlayed) * 100 * 10) / 10 : 0;
      });

      const sortedPlayers = ladderPlayers
        .map(player => ({
          ...player,
          calculatedStats: playerStats[player.id]
        }))
        .sort((a, b) => {
          const aStats = a.calculatedStats;
          const bStats = b.calculatedStats;
          
          if (bStats.winPercentage !== aStats.winPercentage) {
            return bStats.winPercentage - aStats.winPercentage;
          }
          
          if (bStats.matchesWon !== aStats.matchesWon) {
            return bStats.matchesWon - aStats.matchesWon;
          }
          
          return a.name.localeCompare(b.name);
        });

      for (let i = 0; i < sortedPlayers.length; i++) {
        const player = sortedPlayers[i];
        const stats = player.calculatedStats;
        const newRank = i + 1;
        const previousRank = player.rank;
        
        await supabase
          .from('profiles')
          .update({
            previous_rank: previousRank,
            rank: newRank,
            matches_played: stats.matchesPlayed,
            matches_won: stats.matchesWon,
            games_played: stats.gamesPlayed,
            games_won: stats.gamesWon
          })
          .eq('id', player.id);
      }

      await fetchUsers();
      console.log('Rankings updated successfully');
    } catch (error) {
      console.error('Error updating rankings:', error);
      alert('Error updating rankings: ' + error.message);
    }
  };

  const handleSignOut = async () => {
    console.log('👋 User initiated sign out');
    await supabase.auth.signOut();
  };

  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Render auth screen if not logged in
  if (!currentUser) {
    return <AuthScreen onAuthChange={setCurrentUser} />;
  }

  // Main app render
  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentUser={currentUser} onSignOut={handleSignOut} />
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} currentUser={currentUser} />
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'ladder' && (
          <LadderTab 
            currentUser={currentUser}
            users={users}
            updateRankings={updateRankings}
          />
        )}

        {activeTab === 'matches' && (
          <MatchesTab 
            currentUser={currentUser}
            currentSeason={currentSeason}
            setShowScheduleModal={setShowScheduleModal}
            matchFixtures={matchFixtures}
            matchResults={matchResults}
            availability={availability}
            users={users}
            generateMatches={generateMatches}
            openScoreModal={openScoreModal}
            getAvailabilityStats={getAvailabilityStats}
            getMatchScore={getMatchScore}
          />
        )}

        {activeTab === 'availability' && (
          <AvailabilityTab 
            currentUser={currentUser}
            currentSeason={currentSeason}
            getPlayerAvailability={getPlayerAvailability}
            setPlayerAvailability={setPlayerAvailability}
            matchFixtures={matchFixtures}
            matchResults={matchResults}
            getMatchScore={getMatchScore}
          />
        )}

        {activeTab === 'admin' && currentUser?.role === 'admin' && (
          <AdminTab 
            users={users}
            currentSeason={currentSeason}
            approveUser={approveUser}
            addToLadder={addToLadder}
            fetchUsers={fetchUsers}
            setPlayerAvailability={setPlayerAvailability}
            getPlayerAvailability={getPlayerAvailability}
            getAvailabilityStats={getAvailabilityStats}
            clearOldMatches={clearOldMatches}
            matchFixtures={matchFixtures}
            matchResults={matchResults}
          />
        )}
      </main>

      <ScheduleModal 
        showModal={showScheduleModal}
        setShowModal={setShowScheduleModal}
        newMatchDate={newMatchDate}
        setNewMatchDate={setNewMatchDate}
        addMatchToSeason={addMatchToSeason}
      />

      <ScoreModal 
        showModal={showScoreModal}
        setShowModal={setShowScoreModal}
        selectedMatch={selectedMatch}
        setSelectedMatch={setSelectedMatch}
        submitScore={submitScore}
      />
    </div>
  );
};

export default TennisLadderApp;