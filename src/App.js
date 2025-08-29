// src/App.js - FIXED AUTH SYSTEM
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
  const [authMode, setAuthMode] = useState('normal'); // 'normal' | 'reset'

  useEffect(() => {
    console.log('🚀 App starting - initializing auth...');
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      // Check for password reset first
      const isPasswordReset = checkForPasswordReset();
      
      if (isPasswordReset) {
        console.log('🔑 Password reset mode detected');
        setAuthMode('reset');
        setLoading(false);
        return;
      }

      // Normal session check
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Session error:', error);
        setLoading(false);
        return;
      }

      if (session) {
        console.log('✅ Valid session found');
        await loadUserAndData(session.user.id);
      } else {
        console.log('ℹ️ No session - showing login');
        setLoading(false);
      }

      // Set up auth listener
      setupAuthListener();
      
    } catch (error) {
      console.error('💥 Auth initialization failed:', error);
      setLoading(false);
    }
  };

  const checkForPasswordReset = () => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    return hashParams.get('type') === 'recovery' && hashParams.get('access_token');
  };

  const setupAuthListener = () => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth event:', event);
      
      switch (event) {
        case 'SIGNED_IN':
          if (session && !checkForPasswordReset()) {
            console.log('✅ User signed in');
            await loadUserAndData(session.user.id);
          }
          break;
          
        case 'SIGNED_OUT':
          console.log('👋 User signed out');
          resetAppState();
          break;
          
        case 'PASSWORD_RECOVERY':
          console.log('🔑 Password recovery triggered');
          setAuthMode('reset');
          setCurrentUser(null);
          setLoading(false);
          break;
          
        default:
          // Handle other events if needed
          break;
      }
    });

    return () => subscription.unsubscribe();
  };

  const loadUserAndData = async (userId) => {
    try {
      console.log('📱 Loading user profile and data...');
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Profile error:', error);
        setLoading(false);
        return;
      }

      setCurrentUser(profile);
      console.log('✅ Profile loaded:', profile.name);

      // Load all app data in parallel
      await Promise.all([
        fetchUsers(),
        fetchSeasons(),
        fetchAvailability(),
        fetchMatchFixtures(),
        fetchMatchResults()
      ]);
      
    } catch (error) {
      console.error('💥 Data loading failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetAppState = () => {
    setCurrentUser(null);
    setUsers([]);
    setSeasons([]);
    setCurrentSeason(null);
    setAvailability([]);
    setMatchFixtures([]);
    setMatchResults([]);
    setAuthMode('normal');
    setLoading(false);
  };

  const handlePasswordResetComplete = () => {
    console.log('✅ Password reset complete');
    setAuthMode('normal');
    // Clear any reset tokens from URL
    if (window.location.hash) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  // Data fetching functions (unchanged from original)
  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('rank', { ascending: true, nullsLast: true });

      if (data) setUsers(data);
      if (error) console.error('Error fetching users:', error);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchSeasons = async () => {
    try {
      const { data: activeSeasons, error: seasonError } = await supabase
        .from('seasons')
        .select('*')
        .eq('is_active', true)
        .limit(1);
      
      if (seasonError) {
        console.error('Error fetching season:', seasonError);
        return;
      }
      
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
      
      setCurrentSeason(seasonWithMatches);
      setSeasons([seasonWithMatches]);
    } catch (error) {
      console.error('Error in fetchSeasons:', error);
    }
  };

  const createDefaultSeason = async () => {
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

      if (error) {
        console.error('Error creating season:', error);
        return null;
      }
      
      return newSeason;
    } catch (error) {
      console.error('Error in createDefaultSeason:', error);
      return null;
    }
  };

  const fetchAvailability = async () => {
    try {
      const { data } = await supabase.from('availability').select('*');
      if (data) setAvailability(data);
    } catch (error) {
      console.error('Error fetching availability:', error);
    }
  };

  const fetchMatchFixtures = async () => {
    try {
      const { data } = await supabase
        .from('match_fixtures')
        .select(`
          *,
          player1:player1_id(name),
          player2:player2_id(name),
          player3:player3_id(name),
          player4:player4_id(name),
          sitting_player:sitting_player_id(name)
        `);
      if (data) setMatchFixtures(data);
    } catch (error) {
      console.error('Error fetching fixtures:', error);
    }
  };

  const fetchMatchResults = async () => {
    try {
      const { data } = await supabase.from('match_results').select('*');
      if (data) setMatchResults(data);
    } catch (error) {
      console.error('Error fetching results:', error);
    }
  };

  // All other functions remain the same...
  const addMatchToSeason = async () => {
    if (!newMatchDate) {
      alert('Please select a date for the match');
      return;
    }
    
    if (!currentSeason) {
      alert('No active season found');
      return;
    }
    
    try {
      const weekNumber = (currentSeason?.matches?.length || 0) + 1;
      
      const { error } = await supabase
        .from('matches')
        .insert({
          season_id: currentSeason.id,
          week_number: weekNumber,
          match_date: newMatchDate
        })
        .select();

      if (error) {
        alert('Error adding match: ' + error.message);
      } else {
        await fetchSeasons();
        setShowScheduleModal(false);
        setNewMatchDate('');
      }
    } catch (error) {
      alert('Error adding match: ' + error.message);
    }
  };

  const clearOldMatches = async () => {
    if (!currentUser?.role === 'admin') return;
    
    try {
      await supabase.from('match_results').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('match_fixtures').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('availability').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('matches').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      alert('All match data cleared!');
      await fetchSeasons();
    } catch (error) {
      alert('Error clearing data: ' + error.message);
    }
  };

  const approveUser = async (userId) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'approved' })
        .eq('id', userId);

      if (!error) await fetchUsers();
    } catch (error) {
      console.error('Error approving user:', error);
    }
  };

  const addToLadder = async (userId, rank) => {
    try {
      const targetRank = parseInt(rank);
      
      const { data: playersToShift, error: getError } = await supabase
        .from('profiles')
        .select('id, rank')
        .gte('rank', targetRank)
        .eq('in_ladder', true)
        .order('rank', { ascending: true });

      if (getError) {
        alert('Error: ' + getError.message);
        return;
      }

      if (playersToShift?.length > 0) {
        for (const player of playersToShift) {
          await supabase
            .from('profiles')
            .update({ rank: player.rank + 1 })
            .eq('id', player.id);
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update({ 
          in_ladder: true, 
          rank: targetRank
        })
        .eq('id', userId);

      if (!error) await fetchUsers();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const setPlayerAvailability = async (matchId, available, userId = currentUser?.id) => {
    try {
      const match = currentSeason?.matches?.find(m => m.id === matchId);
      if (!match) return;
      
      const matchDate = match.match_date;
      
      if (available === undefined) {
        await supabase
          .from('availability')
          .delete()
          .eq('player_id', userId)
          .eq('match_date', matchDate);
      } else {
        const { data: existing } = await supabase
          .from('availability')
          .select('*')
          .eq('player_id', userId)
          .eq('match_date', matchDate)
          .maybeSingle();
        
        if (existing) {
          await supabase
            .from('availability')
            .update({ is_available: available })
            .eq('player_id', userId)
            .eq('match_date', matchDate);
        } else {
          await supabase
            .from('availability')
            .insert({
              player_id: userId,
              match_date: matchDate,
              is_available: available
            });
        }
      }
      
      await fetchAvailability();
    } catch (error) {
      alert('Error: ' + error.message);
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
    const match = currentSeason?.matches?.find(m => m.id === matchId);
    if (!match) {
      alert('Match not found');
      return;
    }
    
    const availablePlayers = users.filter(user => {
      if (!user.in_ladder || user.status !== 'approved') return false;
      const userAvailability = availability.find(a => a.player_id === user.id && a.match_date === match.match_date);
      return userAvailability?.is_available === true;
    }).sort((a, b) => (a.rank || 999) - (b.rank || 999));

    const numPlayers = availablePlayers.length;
    
    if (numPlayers < 4) {
      alert(`Need at least 4 players. Found ${numPlayers}.`);
      return;
    }

    const courts = [];

    // Group players intelligently
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
    } else {
      const groups = Math.floor(numPlayers / 4);
      for (let i = 0; i < groups; i++) {
        courts.push(availablePlayers.slice(i * 4, (i + 1) * 4));
      }
      if (numPlayers % 4 > 0) {
        courts.push(availablePlayers.slice(groups * 4));
      }
    }

    try {
      const fixturesToInsert = [];

      courts.forEach((courtPlayers, courtIndex) => {
        const courtNumber = courtIndex + 1;
        let gameNumber = 1;

        if (courtPlayers.length === 5) {
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

      const { error } = await supabase
        .from('match_fixtures')
        .insert(fixturesToInsert);

      if (error) {
        alert('Error: ' + error.message);
        return;
      }

      await Promise.all([
        fetchMatchFixtures(),
        fetchSeasons()
      ]);
    } catch (error) {
      alert('Error: ' + error.message);
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
      
      if (!error) {
        await Promise.all([
          fetchMatchResults(),
          fetchSeasons()
        ]);
        setShowScoreModal(false);
        setSelectedMatch(null);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const getMatchScore = (fixtureId) => {
    return matchResults.find(r => r.fixture_id === fixtureId);
  };

  const updateRankings = async () => {
    try {
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
        alert('Error: ' + error.message);
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
            
            if (wonMatch) stats.matchesWon += 1;
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
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  // Render logic
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Show auth screen for password reset or no user
  if (authMode === 'reset' || !currentUser) {
    return (
      <AuthScreen 
        onAuthChange={setCurrentUser}
        isPasswordReset={authMode === 'reset'}
        onPasswordResetComplete={handlePasswordResetComplete}
      />
    );
  }

  // Main app
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