// LeagueMatchCard - Displays league matches with expandable rubber details
import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, Users, Trophy, Calendar } from 'lucide-react';

const LeagueMatchCard = ({ match, fixture, supabase }) => {
  const [expanded, setExpanded] = useState(false);
  const [rubberDetails, setRubberDetails] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch rubber details on component mount for immediate score display
  useEffect(() => {
    if (!rubberDetails.length) {
      fetchRubberDetails();
    }
  }, [fetchRubberDetails, rubberDetails.length]);

  // Additional fetch when expanded if needed
  useEffect(() => {
    if (expanded && !rubberDetails.length) {
      fetchRubberDetails();
    }
  }, [expanded, fetchRubberDetails, rubberDetails.length]);

  const fetchRubberDetails = useCallback(async () => {
    if (!supabase || !fixture?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('league_match_rubbers')
        .select(`
          *,
          cawood_player1:cawood_player1_id(name),
          cawood_player2:cawood_player2_id(name),
          opponent_player1:opponent_player1_id(name),
          opponent_player2:opponent_player2_id(name)
        `)
        .eq('match_fixture_id', fixture.id)
        .order('rubber_number');

      if (error) throw error;
      setRubberDetails(data || []);
    } catch (error) {
      console.error('Error fetching rubber details:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase, fixture?.id]);

  const formatMatchDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getRubberResult = (cawoodGames, opponentGames) => {
    if (cawoodGames >= 7 && cawoodGames > opponentGames) return 'WIN';
    if (opponentGames >= 7 && opponentGames > cawoodGames) return 'LOSS';
    if (cawoodGames === 6 && opponentGames === 6) return 'DRAW';
    if (cawoodGames < 7 && opponentGames < 7) return 'INCOMPLETE';
    return cawoodGames > opponentGames ? 'WIN' : 'LOSS';
  };

  const getResultColor = (result) => {
    switch (result) {
      case 'WIN': return 'text-green-600 bg-green-50';
      case 'LOSS': return 'text-red-600 bg-red-50';
      case 'DRAW': return 'text-yellow-600 bg-yellow-50';
      case 'INCOMPLETE': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const calculateMatchSummary = () => {
    if (!rubberDetails.length) return { 
      cawoodPoints: 0, 
      opponentPoints: 0, 
      cawoodGamesTotal: 0, 
      opponentGamesTotal: 0,
      teamBonusCawood: 0,
      teamBonusOpponent: 0,
      rubberStats: { wins: 0, losses: 0, draws: 0, incomplete: 0 }
    };
    
    const stats = rubberDetails.reduce((acc, rubber) => {
      const result = getRubberResult(rubber.cawood_games_won, rubber.opponent_games_won);
      
      // Count rubber results for display
      if (result === 'WIN') acc.rubberStats.wins++;
      else if (result === 'LOSS') acc.rubberStats.losses++;
      else if (result === 'DRAW') acc.rubberStats.draws++;
      else acc.rubberStats.incomplete++;
      
      // Calculate points according to league rules
      if (result === 'WIN') {
        acc.cawoodPoints += 1;
      } else if (result === 'LOSS') {
        acc.opponentPoints += 1;
      } else if (result === 'DRAW') {
        acc.cawoodPoints += 0.5;
        acc.opponentPoints += 0.5;
      }
      
      // Accumulate total games
      acc.cawoodGamesTotal += rubber.cawood_games_won || 0;
      acc.opponentGamesTotal += rubber.opponent_games_won || 0;
      
      return acc;
    }, { 
      cawoodPoints: 0, 
      opponentPoints: 0, 
      cawoodGamesTotal: 0, 
      opponentGamesTotal: 0,
      rubberStats: { wins: 0, losses: 0, draws: 0, incomplete: 0 }
    });
    
    // Calculate team bonus (3 points for winning more than 54 games out of 108)
    if (stats.cawoodGamesTotal > 54) {
      stats.teamBonusCawood = 3;
      stats.teamBonusOpponent = 0;
    } else if (stats.opponentGamesTotal > 54) {
      stats.teamBonusCawood = 0;
      stats.teamBonusOpponent = 3;
    } else if (stats.cawoodGamesTotal === 54 && stats.opponentGamesTotal === 54) {
      stats.teamBonusCawood = 1.5;
      stats.teamBonusOpponent = 1.5;
    } else {
      stats.teamBonusCawood = 0;
      stats.teamBonusOpponent = 0;
    }
    
    // Add team bonus to final scores
    stats.cawoodPoints += stats.teamBonusCawood;
    stats.opponentPoints += stats.teamBonusOpponent;
    
    return stats;
  };

  const totalRubbers = rubberDetails.length;
  const summary = calculateMatchSummary();
  const matchResult = summary.cawoodPoints > summary.opponentPoints ? 'WIN' :
                     summary.cawoodPoints < summary.opponentPoints ? 'LOSS' : 'DRAW';

  // Get timeline border color based on match result
  const getBorderColor = () => {
    if (totalRubbers === 0) return 'border-l-blue-400'; // No rubbers yet
    if (matchResult === 'WIN') return 'border-l-green-500';
    if (matchResult === 'LOSS') return 'border-l-red-500';
    return 'border-l-yellow-500'; // Draw
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm border-l-4 ${getBorderColor()}`}>
      {/* Main Match Header */}
      <div
        className="p-4 sm:p-5 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Title Row */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <h3 className="font-semibold text-gray-900">
                  {fixture?.opponent_club} vs Cawood {fixture?.team}
                </h3>
              </div>

              {totalRubbers > 0 && (
                <span className={`px-2.5 py-1 rounded-full text-sm font-medium ${getResultColor(matchResult)}`}>
                  {summary.cawoodPoints}-{summary.opponentPoints}
                </span>
              )}
            </div>

            {/* Info Row */}
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>{formatMatchDate(match.match_date)}</span>
              </div>

              {totalRubbers > 0 && (
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">{totalRubbers} rubbers</span>
                  <span className="sm:hidden">{totalRubbers} games</span>
                </div>
              )}
            </div>
          </div>

          <div className="text-gray-400 p-1.5 rounded-full bg-gray-100 transition-all duration-200 hover:bg-gray-200 cursor-pointer flex-shrink-0">
            <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${
              expanded ? 'rotate-180' : 'rotate-0'
            }`} />
          </div>
        </div>
      </div>

      {/* Expandable Rubber Details */}
      {expanded && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          {loading ? (
            <div className="text-center py-4 text-gray-500">
              Loading rubber details...
            </div>
          ) : rubberDetails.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No rubber details available
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                <h4 className="font-medium text-gray-900 mb-2 sm:mb-0">
                  Rubber Results ({totalRubbers} played)
                </h4>
                
                {/* Match Score Summary */}
                <div className="bg-white border border-gray-300 rounded-lg p-3 shadow-sm">
                  <div className="text-sm text-gray-600 mb-2">Final Match Score</div>
                  <div className="flex items-center justify-between space-x-4">
                    <div className="text-center">
                      <div className="font-bold text-lg text-blue-600">Cawood</div>
                      <div className="text-2xl font-bold">{summary.cawoodPoints}</div>
                    </div>
                    <div className="text-gray-400">-</div>
                    <div className="text-center">
                      <div className="font-bold text-lg text-red-600">{fixture?.opponent_club}</div>
                      <div className="text-2xl font-bold">{summary.opponentPoints}</div>
                    </div>
                  </div>
                  
                  {/* Games Total and Bonus Points */}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="text-xs text-gray-500 mb-2">Game Totals</div>
                    <div className="flex justify-between text-sm">
                      <span>Cawood: {summary.cawoodGamesTotal}</span>
                      <span>{fixture?.opponent_club}: {summary.opponentGamesTotal}</span>
                    </div>
                    
                    {(summary.teamBonusCawood > 0 || summary.teamBonusOpponent > 0) && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <div className="text-xs text-gray-500 mb-1">Team Bonus</div>
                        <div className="flex justify-between text-sm font-medium">
                          {summary.teamBonusCawood > 0 && (
                            <span className="text-green-600">+{summary.teamBonusCawood} to Cawood</span>
                          )}
                          {summary.teamBonusOpponent > 0 && (
                            <span className="text-green-600">+{summary.teamBonusOpponent} to {fixture?.opponent_club}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-white">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rubber
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cawood Pair
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Opponent Pair
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Score
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Result
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {rubberDetails.map((rubber) => {
                      const result = getRubberResult(rubber.cawood_games_won, rubber.opponent_games_won);
                      return (
                        <tr key={rubber.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm font-medium text-gray-900">
                            #{rubber.rubber_number}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-700">
                            {rubber.cawood_player1?.name} & {rubber.cawood_player2?.name}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-700">
                            {rubber.opponent_player1?.name} & {rubber.opponent_player2?.name}
                          </td>
                          <td className="px-4 py-2 text-sm font-mono text-gray-900">
                            {rubber.cawood_games_won}-{rubber.opponent_games_won}
                          </td>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getResultColor(result)}`}>
                              {result === 'WIN' ? 'WON' : result === 'LOSS' ? 'LOST' : result === 'DRAW' ? 'DRAWN' : 'INCOMPLETE'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {rubberDetails.map((rubber) => {
                  const result = getRubberResult(rubber.cawood_games_won, rubber.opponent_games_won);
                  return (
                    <div key={rubber.id} className="bg-white border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">Rubber #{rubber.rubber_number}</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getResultColor(result)}`}>
                          {result === 'WIN' ? 'WON' : result === 'LOSS' ? 'LOST' : result === 'DRAW' ? 'DRAWN' : 'INCOMPLETE'}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-500">Cawood:</span>{' '}
                          <span className="text-gray-900">
                            {rubber.cawood_player1?.name} & {rubber.cawood_player2?.name}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Opponent:</span>{' '}
                          <span className="text-gray-900">
                            {rubber.opponent_player1?.name} & {rubber.opponent_player2?.name}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Score:</span>{' '}
                          <span className="font-mono text-gray-900">
                            {rubber.cawood_games_won}-{rubber.opponent_games_won}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LeagueMatchCard;