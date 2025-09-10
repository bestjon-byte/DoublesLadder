// LeagueMatchCard - Displays league matches with expandable rubber details
import React, { useState, useEffect } from 'react';
import { ChevronDown, Users, Trophy, Calendar } from 'lucide-react';

const LeagueMatchCard = ({ match, fixture, supabase }) => {
  const [expanded, setExpanded] = useState(false);
  const [rubberDetails, setRubberDetails] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch rubber details when expanded
  useEffect(() => {
    if (expanded && !rubberDetails.length) {
      fetchRubberDetails();
    }
  }, [expanded]);

  const fetchRubberDetails = async () => {
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
  };

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
    if (cawoodGames > opponentGames) return 'WIN';
    if (cawoodGames < opponentGames) return 'LOSS';
    return 'TIE';
  };

  const getResultColor = (result) => {
    switch (result) {
      case 'WIN': return 'text-green-600 bg-green-50';
      case 'LOSS': return 'text-red-600 bg-red-50';
      case 'TIE': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const calculateMatchSummary = () => {
    if (!rubberDetails.length) return { wins: 0, losses: 0, ties: 0 };
    
    return rubberDetails.reduce((acc, rubber) => {
      const result = getRubberResult(rubber.cawood_games_won, rubber.opponent_games_won);
      if (result === 'WIN') acc.wins++;
      else if (result === 'LOSS') acc.losses++;
      else acc.ties++;
      return acc;
    }, { wins: 0, losses: 0, ties: 0 });
  };

  const totalRubbers = rubberDetails.length;
  const summary = calculateMatchSummary();
  const matchResult = summary.wins > summary.losses ? 'WIN' : 
                     summary.wins < summary.losses ? 'LOSS' : 'TIE';

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Main Match Header */}
      <div 
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">
                  {fixture?.opponent_club} vs Cawood {fixture?.team}
                </h3>
              </div>
              
              {totalRubbers > 0 && (
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${getResultColor(matchResult)}`}>
                  {matchResult} ({summary.wins}-{summary.losses}-{summary.ties})
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>{formatMatchDate(match.match_date)}</span>
              </div>
              
              {totalRubbers > 0 && (
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{totalRubbers} rubbers played</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500 hidden sm:inline">
              {expanded ? 'Collapse' : 'View Details'}
            </span>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
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
              <h4 className="font-medium text-gray-900 mb-3">
                Rubber Results ({totalRubbers} played)
              </h4>
              
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
                              {result}
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
                          {result}
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