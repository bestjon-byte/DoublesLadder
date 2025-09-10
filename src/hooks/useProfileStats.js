// src/hooks/useProfileStats.js
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

export const useProfileStats = (playerId, seasonId = null, allTime = false, allUsers = []) => {
  const [stats, setStats] = useState({
    matchHistory: [],
    overallStats: {},
    bestPartners: [],
    nemesisOpponent: null,
    nemesisPair: null,
    winStreaks: {},
    formGuide: [],
    headToHeadRecords: [],
    seasonProgression: [],
    loading: true,
    error: null
  });

  const calculateStats = useCallback(async () => {
    if (!playerId) return;

    try {
      setStats(prev => ({ ...prev, loading: true, error: null }));

      // Note: Season filtering is handled in the query logic below

      // Fetch ladder match data
      const { data: matchData, error: matchError } = await supabase
        .from('match_fixtures')
        .select(`
          id,
          match_id,
          court_number,
          game_number,
          pair1_player1_id,
          pair1_player2_id,
          pair2_player1_id,
          pair2_player2_id,
          match_results (
            id,
            pair1_score,
            pair2_score,
            created_at
          ),
          matches!match_fixtures_match_id_fkey (
            id,
            season_id,
            match_date,
            seasons (
              id,
              name
            )
          )
        `)
        .or(`pair1_player1_id.eq.${playerId},pair1_player2_id.eq.${playerId},pair2_player1_id.eq.${playerId},pair2_player2_id.eq.${playerId}`)
        .not('match_results', 'is', null);

      if (matchError) throw matchError;

      // Fetch league match data (rubbers)
      const { data: leagueData, error: leagueError } = await supabase
        .from('league_match_rubbers')
        .select(`
          id,
          rubber_number,
          cawood_player1_id,
          cawood_player2_id,
          opponent_player1_id,
          opponent_player2_id,
          cawood_games_won,
          opponent_games_won,
          created_at,
          match_fixture:match_fixture_id (
            id,
            court_number,
            match_id,
            opponent_club,
            matches:match_id (
              id,
              season_id,
              match_date,
              seasons (
                id,
                name
              )
            )
          ),
          opponent_player1:opponent_player1_id (
            id,
            name
          ),
          opponent_player2:opponent_player2_id (
            id,
            name
          )
        `)
        .or(`cawood_player1_id.eq.${playerId},cawood_player2_id.eq.${playerId}`);

      if (leagueError) throw leagueError;

      // Create a lookup map for user names from passed allUsers
      const userLookup = allUsers.reduce((acc, user) => {
        acc[user.id] = user.name;
        return acc;
      }, {});

      // Process ladder match data
      const processedMatches = matchData
        .filter(fixture => {
          // Filter by season if specified
          if (!allTime && seasonId && fixture.matches?.season_id !== seasonId) {
            return false;
          }
          return fixture.match_results && fixture.match_results.length > 0;
        })
        .map(fixture => {
          const result = fixture.match_results[0];
          const isInPair1 = fixture.pair1_player1_id === playerId || fixture.pair1_player2_id === playerId;
          const isInPair2 = fixture.pair2_player1_id === playerId || fixture.pair2_player2_id === playerId;
          
          if (!isInPair1 && !isInPair2) return null;

          const playerScore = isInPair1 ? result.pair1_score : result.pair2_score;
          const opponentScore = isInPair1 ? result.pair2_score : result.pair1_score;
          const won = playerScore > opponentScore;
          const tie = playerScore === opponentScore;
          
          // Get partner ID
          let partnerId;
          if (isInPair1) {
            partnerId = fixture.pair1_player1_id === playerId ? fixture.pair1_player2_id : fixture.pair1_player1_id;
          } else {
            partnerId = fixture.pair2_player1_id === playerId ? fixture.pair2_player2_id : fixture.pair2_player1_id;
          }

          // Get opponent IDs
          const opponentIds = isInPair1 
            ? [fixture.pair2_player1_id, fixture.pair2_player2_id]
            : [fixture.pair1_player1_id, fixture.pair1_player2_id];

          return {
            fixtureId: fixture.id,
            matchId: fixture.match_id,
            date: fixture.matches?.match_date || result.created_at,
            won,
            tie,
            score: `${playerScore} - ${opponentScore}`,
            partnerId,
            partnerName: userLookup[partnerId] || 'Unknown',
            opponentIds,
            opponentNames: opponentIds.map(id => userLookup[id] || 'Unknown'),
            playerScore,
            opponentScore,
            seasonId: fixture.matches?.season_id,
            seasonName: fixture.matches?.seasons?.name,
            courtNumber: fixture.court_number
          };
        })
        .filter(Boolean)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      // Process league match data (rubbers)
      const processedLeagueMatches = leagueData
        .filter(rubber => {
          // Filter by season if specified
          if (!allTime && seasonId && rubber.match_fixture?.matches?.season_id !== seasonId) {
            return false;
          }
          return rubber.cawood_games_won != null && rubber.opponent_games_won != null;
        })
        .map(rubber => {
          const isPlayer1 = rubber.cawood_player1_id === playerId;
          const isPlayer2 = rubber.cawood_player2_id === playerId;
          
          if (!isPlayer1 && !isPlayer2) return null;

          const playerScore = rubber.cawood_games_won || 0;
          const opponentScore = rubber.opponent_games_won || 0;
          const won = playerScore > opponentScore;
          const tie = playerScore === opponentScore;
          
          // Get partner ID (the other Cawood player)
          const partnerId = isPlayer1 ? rubber.cawood_player2_id : rubber.cawood_player1_id;
          
          // Get opponent names (external players)
          const opponentNames = [
            rubber.opponent_player1?.name || 'Unknown',
            rubber.opponent_player2?.name || 'Unknown'
          ];

          return {
            fixtureId: rubber.id, // Use rubber ID as unique identifier
            matchId: rubber.match_fixture?.match_id,
            date: rubber.match_fixture?.matches?.match_date || rubber.created_at,
            won,
            tie,
            score: `${playerScore} - ${opponentScore}`,
            partnerId,
            partnerName: userLookup[partnerId] || 'Unknown',
            opponentIds: [rubber.opponent_player1_id, rubber.opponent_player2_id],
            opponentNames,
            playerScore,
            opponentScore,
            seasonId: rubber.match_fixture?.matches?.season_id,
            seasonName: rubber.match_fixture?.matches?.seasons?.name,
            courtNumber: rubber.match_fixture?.court_number,
            isLeagueMatch: true, // Flag to identify league matches
            opponentClub: rubber.match_fixture?.opponent_club,
            rubberNumber: rubber.rubber_number
          };
        })
        .filter(Boolean)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      // Combine ladder and league matches
      const allMatches = [...processedMatches, ...processedLeagueMatches]
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      // Each fixture represents one complete match (or rubber for league)
      // Calculate overall stats using combined data
      const totalMatches = allMatches.length; // Each match/rubber is counted
      const matchesWon = allMatches.filter(match => match.won).length;
      const matchesDrawn = allMatches.filter(match => match.tie).length;
      const matchesLost = allMatches.filter(match => !match.won && !match.tie).length;
      const decisiveMatches = totalMatches - matchesDrawn;
      const matchWinRate = decisiveMatches > 0 ? matchesWon / decisiveMatches : 0;
      
      // Calculate game-level stats
      const totalGames = allMatches.reduce((sum, match) => sum + match.playerScore + match.opponentScore, 0);
      const gamesWon = allMatches.reduce((sum, match) => sum + match.playerScore, 0);
      const gameWinRate = totalGames > 0 ? gamesWon / totalGames : 0;

      // Calculate best partners based on GAMES across matches
      const partnerStats = {};
      allMatches.forEach(match => {
        if (!partnerStats[match.partnerId]) {
          partnerStats[match.partnerId] = {
            playerId: match.partnerId,
            name: match.partnerName,
            totalGames: 0,
            gamesWon: 0,
            matches: 0
          };
        }
        
        partnerStats[match.partnerId].totalGames += (match.playerScore + match.opponentScore);
        partnerStats[match.partnerId].gamesWon += match.playerScore;
        partnerStats[match.partnerId].matches++;
      });

      const bestPartners = Object.values(partnerStats)
        .map(partner => ({
          ...partner,
          winRate: partner.totalGames > 0 ? partner.gamesWon / partner.totalGames : 0
        }))
        .filter(partner => partner.totalGames >= 10) // Only partners with 10+ games
        .sort((a, b) => b.winRate - a.winRate);

      // Calculate nemesis opponent based on GAMES across matches
      const opponentStats = {};
      allMatches.forEach(match => {
        match.opponentIds.forEach(opponentId => {
          if (opponentId && !opponentStats[opponentId]) {
            // For league matches, use opponentNames array, for ladder matches use userLookup
            const opponentName = match.isLeagueMatch 
              ? match.opponentNames[match.opponentIds.indexOf(opponentId)] 
              : userLookup[opponentId] || 'Unknown';
            
            opponentStats[opponentId] = {
              playerId: opponentId,
              name: opponentName,
              totalGames: 0,
              gamesWon: 0,
              gamesLost: 0,
              matches: 0,
              wins: 0,
              losses: 0
            };
          }
          
          if (opponentId && opponentStats[opponentId]) {
            opponentStats[opponentId].totalGames += (match.playerScore + match.opponentScore);
            opponentStats[opponentId].gamesWon += match.playerScore;
            opponentStats[opponentId].gamesLost += match.opponentScore;
            opponentStats[opponentId].matches++;
            if (match.won) {
              opponentStats[opponentId].wins++;
            } else {
              opponentStats[opponentId].losses++;
            }
          }
        });
      });

      const nemesisOpponent = Object.values(opponentStats)
        .map(opponent => ({
          ...opponent,
          winRate: opponent.totalGames > 0 ? opponent.gamesWon / opponent.totalGames : 0
        }))
        .filter(opponent => opponent.totalGames >= 10) // Only opponents faced 10+ games
        .sort((a, b) => a.winRate - b.winRate)[0]; // Lowest win rate first

      // Calculate nemesis pair based on GAMES
      const pairStats = {};
      allMatches.forEach(match => {
        if (match.opponentIds[0] && match.opponentIds[1]) {
          const pairKey = match.opponentIds.sort().join('-');
          if (!pairStats[pairKey]) {
            // For league matches, use opponentNames, for ladder matches use userLookup
            const player1Name = match.isLeagueMatch 
              ? match.opponentNames[match.opponentIds.indexOf(match.opponentIds[0])] 
              : userLookup[match.opponentIds[0]] || 'Unknown';
            const player2Name = match.isLeagueMatch 
              ? match.opponentNames[match.opponentIds.indexOf(match.opponentIds[1])] 
              : userLookup[match.opponentIds[1]] || 'Unknown';
            
            pairStats[pairKey] = {
              player1Id: match.opponentIds[0],
              player2Id: match.opponentIds[1],
              player1Name: player1Name,
              player2Name: player2Name,
              totalGames: 0,
              gamesWon: 0,
              gamesLost: 0,
              matches: 0
            };
          }
          
          pairStats[pairKey].totalGames += (match.playerScore + match.opponentScore);
          pairStats[pairKey].gamesWon += match.playerScore;
          pairStats[pairKey].gamesLost += match.opponentScore;
          pairStats[pairKey].matches++;
        }
      });

      const nemesisPair = Object.values(pairStats)
        .map(pair => ({
          ...pair,
          winRate: pair.totalGames > 0 ? pair.gamesWon / pair.totalGames : 0
        }))
        .filter(pair => pair.totalGames >= 10) // Only pairs faced 10+ games
        .sort((a, b) => a.winRate - b.winRate)[0]; // Lowest win rate first

      // Calculate win streaks (need chronological order, oldest first)
      const chronologicalMatches = [...allMatches].reverse();
      let currentStreak = 0;
      let currentStreakType = null;
      let longestWinStreak = 0;
      let tempWinStreak = 0;

      chronologicalMatches.forEach((match, index) => {
        if (index === 0) {
          currentStreak = 1;
          currentStreakType = match.won ? 'win' : 'loss';
          if (match.won) tempWinStreak = 1;
        } else {
          const prevMatch = chronologicalMatches[index - 1];
          if (match.won === prevMatch.won) {
            currentStreak++;
            if (match.won) tempWinStreak++;
          } else {
            if (tempWinStreak > longestWinStreak) {
              longestWinStreak = tempWinStreak;
            }
            currentStreak = 1;
            currentStreakType = match.won ? 'win' : 'loss';
            tempWinStreak = match.won ? 1 : 0;
          }
        }
      });

      if (tempWinStreak > longestWinStreak) {
        longestWinStreak = tempWinStreak;
      }

      // Form guide (last 10 matches)
      const formGuide = allMatches.slice(0, 10);

      // Head-to-head records (only opponents faced multiple times)
      const headToHeadRecords = Object.values(opponentStats)
        .filter(opponent => opponent.matches > 1)
        .sort((a, b) => b.matches - a.matches);

      // Season progression (if looking at all time) - use games for accurate stats
      let seasonProgression = [];
      if (allTime) {
        const seasonStats = {};
        allMatches.forEach(match => {
          if (!seasonStats[match.seasonId]) {
            seasonStats[match.seasonId] = {
              seasonId: match.seasonId,
              seasonName: match.seasonName,
              totalGames: 0,
              gamesWon: 0,
              matches: 0,
              matchesWon: 0
            };
          }
          seasonStats[match.seasonId].totalGames += (match.playerScore + match.opponentScore);
          seasonStats[match.seasonId].gamesWon += match.playerScore;
          seasonStats[match.seasonId].matches++;
          if (match.won) {
            seasonStats[match.seasonId].matchesWon++;
          }
        });

        seasonProgression = Object.values(seasonStats)
          .map(season => ({
            ...season,
            winRate: season.totalGames > 0 ? (season.gamesWon / season.totalGames) * 100 : 0
          }))
          .sort((a, b) => new Date(a.seasonId) - new Date(b.seasonId)); // Rough chronological sort
      }

      setStats({
        matchHistory: allMatches,
        overallStats: {
          totalGames,
          gamesWon,
          gameWinRate,
          totalMatches,
          matchesWon,
          matchesDrawn,
          matchesLost,
          matchWinRate
        },
        bestPartners,
        nemesisOpponent,
        nemesisPair,
        winStreaks: {
          current: currentStreak,
          currentType: currentStreakType,
          longest: longestWinStreak
        },
        formGuide,
        headToHeadRecords,
        seasonProgression,
        loading: false,
        error: null
      });

    } catch (error) {
      console.error('Error calculating profile stats:', error);
      setStats(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
    }
  }, [playerId, seasonId, allTime, allUsers]);

  useEffect(() => {
    calculateStats();
  }, [calculateStats]);

  return stats;
};