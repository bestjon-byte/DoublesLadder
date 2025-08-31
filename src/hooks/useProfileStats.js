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

      // Fetch all match data for the player
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

      // Create a lookup map for user names from passed allUsers
      const userLookup = allUsers.reduce((acc, user) => {
        acc[user.id] = user.name;
        return acc;
      }, {});

      // Process match data
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
            date: result.created_at,
            won,
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

      // Calculate overall stats
      const totalMatches = processedMatches.length;
      const matchesWon = processedMatches.filter(m => m.won).length;
      const winRate = totalMatches > 0 ? matchesWon / totalMatches : 0;

      // Calculate best partners
      const partnerStats = {};
      processedMatches.forEach(match => {
        if (!partnerStats[match.partnerId]) {
          partnerStats[match.partnerId] = {
            playerId: match.partnerId,
            name: match.partnerName,
            matches: 0,
            wins: 0
          };
        }
        partnerStats[match.partnerId].matches++;
        if (match.won) {
          partnerStats[match.partnerId].wins++;
        }
      });

      const bestPartners = Object.values(partnerStats)
        .map(partner => ({
          ...partner,
          winRate: partner.matches > 0 ? partner.wins / partner.matches : 0
        }))
        .filter(partner => partner.matches >= 2) // Only partners with 2+ matches
        .sort((a, b) => b.winRate - a.winRate);

      // Calculate nemesis opponent (individual player)
      const opponentStats = {};
      processedMatches.forEach(match => {
        match.opponentIds.forEach(opponentId => {
          if (!opponentStats[opponentId]) {
            opponentStats[opponentId] = {
              playerId: opponentId,
              name: userLookup[opponentId] || 'Unknown',
              matches: 0,
              wins: 0,
              losses: 0
            };
          }
          opponentStats[opponentId].matches++;
          if (match.won) {
            opponentStats[opponentId].wins++;
          } else {
            opponentStats[opponentId].losses++;
          }
        });
      });

      const nemesisOpponent = Object.values(opponentStats)
        .map(opponent => ({
          ...opponent,
          winRate: opponent.matches > 0 ? opponent.wins / opponent.matches : 0
        }))
        .filter(opponent => opponent.matches >= 2) // Only opponents faced 2+ times
        .sort((a, b) => a.winRate - b.winRate)[0]; // Lowest win rate first

      // Calculate nemesis pair
      const pairStats = {};
      processedMatches.forEach(match => {
        const pairKey = match.opponentIds.sort().join('-');
        if (!pairStats[pairKey]) {
          pairStats[pairKey] = {
            player1Id: match.opponentIds[0],
            player2Id: match.opponentIds[1],
            player1Name: userLookup[match.opponentIds[0]] || 'Unknown',
            player2Name: userLookup[match.opponentIds[1]] || 'Unknown',
            matches: 0,
            wins: 0,
            losses: 0
          };
        }
        pairStats[pairKey].matches++;
        if (match.won) {
          pairStats[pairKey].wins++;
        } else {
          pairStats[pairKey].losses++;
        }
      });

      const nemesisPair = Object.values(pairStats)
        .map(pair => ({
          ...pair,
          winRate: pair.matches > 0 ? pair.wins / pair.matches : 0
        }))
        .filter(pair => pair.matches >= 2) // Only pairs faced 2+ times
        .sort((a, b) => a.winRate - b.winRate)[0]; // Lowest win rate first

      // Calculate win streaks (need chronological order, oldest first)
      const chronologicalMatches = [...processedMatches].reverse();
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
      const formGuide = processedMatches.slice(0, 10);

      // Head-to-head records (only opponents faced multiple times)
      const headToHeadRecords = Object.values(opponentStats)
        .filter(opponent => opponent.matches > 1)
        .sort((a, b) => b.matches - a.matches);

      // Season progression (if looking at all time)
      let seasonProgression = [];
      if (allTime) {
        const seasonStats = {};
        processedMatches.forEach(match => {
          if (!seasonStats[match.seasonId]) {
            seasonStats[match.seasonId] = {
              seasonId: match.seasonId,
              seasonName: match.seasonName,
              matches: 0,
              wins: 0
            };
          }
          seasonStats[match.seasonId].matches++;
          if (match.won) {
            seasonStats[match.seasonId].wins++;
          }
        });

        seasonProgression = Object.values(seasonStats)
          .map(season => ({
            ...season,
            winRate: season.matches > 0 ? (season.wins / season.matches) * 100 : 0
          }))
          .sort((a, b) => new Date(a.seasonId) - new Date(b.seasonId)); // Rough chronological sort
      }

      setStats({
        matchHistory: processedMatches,
        overallStats: {
          totalMatches,
          matchesWon,
          winRate
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