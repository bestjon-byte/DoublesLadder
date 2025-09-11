// src/components/Matches/MatchesTab.js - FIXED for today's dates
import React, { useState, useEffect } from 'react';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { haptics } from '../../utils/haptics';
import LeagueMatchCard from './LeagueMatchCard';

const MatchesTab = ({ 
  currentUser, 
  currentSeason, 
  selectedSeason,
  setShowScheduleModal,
  matchFixtures,
  matchResults,
  availability,
  users,
  generateMatches,
  openScoreModal,
  getAvailabilityStats,
  getMatchScore,
  supabase,
  refetch
}) => {
  // State for managing which matches are expanded
  const [expandedMatches, setExpandedMatches] = useState({});
  // State for team filter
  const [teamFilter, setTeamFilter] = useState('all'); // 'all', '1sts', '2nds'

  // Refresh data when component mounts or season changes
  useEffect(() => {
    const refreshMatchData = async () => {
      try {
        // Refresh match-related data
        if (refetch?.fixtures) await refetch.fixtures();
        if (refetch?.results) await refetch.results();
        if (refetch?.selectedSeasonData) await refetch.selectedSeasonData();
        if (refetch?.availability) await refetch.availability();
      } catch (error) {
        console.error('Error refreshing match data:', error);
      }
    };

    refreshMatchData();
  }, [selectedSeason?.id]); // Removed refetch from dependencies to prevent infinite loop

  // Toggle expansion state for a match
  const toggleMatchExpansion = (matchId) => {
    setExpandedMatches(prev => ({
      ...prev,
      [matchId]: !prev[matchId]
    }));
  };

  // Helper function to determine match status
  const getMatchStatus = (match) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to start of day for accurate comparison
    
    const matchDate = new Date(match.match_date);
    matchDate.setHours(0, 0, 0, 0); // Reset to start of day for accurate comparison
    
    const hasFixtures = matchFixtures.some(f => f.match_id === match.id);
    
    if (!hasFixtures) {
      if (matchDate < today) {
        return 'past-no-fixtures';
      }
      return 'future-no-fixtures';
    }
    
    // Count total games and completed games for this match
    const matchGameFixtures = matchFixtures.filter(f => f.match_id === match.id);
    const completedGames = matchGameFixtures.filter(fixture => 
      matchResults.some(result => result.fixture_id === fixture.id)
    ).length;
    
    if (completedGames === 0) {
      return matchDate < today ? 'past-in-progress' : 'future-in-progress';
    } else if (completedGames < matchGameFixtures.length) {
      return 'partially-complete';
    } else {
      return 'completed';
    }
  };

  // Helper function to check if current user can enter scores for a fixture
  const canUserEnterScores = (fixture) => {
    if (currentUser?.role === 'admin') return true;
    
    // Check if current user is in this specific fixture
    return fixture.player1_id === currentUser?.id || 
           fixture.player2_id === currentUser?.id || 
           fixture.player3_id === currentUser?.id || 
           fixture.player4_id === currentUser?.id;
  };

  // Group fixtures by court for display
  const getCourtFixtures = (matchId) => {
    const fixtures = matchFixtures.filter(f => f.match_id === matchId);
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
  };

  // Check if a match is a league match
  const isLeagueMatch = (matchId) => {
    const fixtures = matchFixtures.filter(f => f.match_id === matchId);
    return fixtures.some(f => f.match_type === 'league');
  };

  // Get the league fixture for a match (there should only be one)
  const getLeagueFixture = (matchId) => {
    return matchFixtures.find(f => f.match_id === matchId && f.match_type === 'league');
  };

  // Filter matches based on team selection
  const getFilteredMatches = () => {
    if (!currentSeason?.matches) return [];
    
    return currentSeason.matches.filter(match => {
      // For ladder matches, always show them
      if (!isLeagueMatch(match.id)) {
        return teamFilter === 'all' || teamFilter === 'ladder';
      }
      
      // For league matches, filter by team
      if (teamFilter === 'all') return true;
      
      const leagueFixture = getLeagueFixture(match.id);
      return leagueFixture?.team === teamFilter;
    });
  };

  const isSeasonCompleted = selectedSeason?.status === 'completed';
  const filteredMatches = getFilteredMatches();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {selectedSeason?.name || 'Current'} Match Schedule
          </h2>
          {isSeasonCompleted && (
            <p className="text-sm text-blue-600 mt-1">
              🏆 This season has been completed - no modifications allowed
            </p>
          )}
        </div>
        <div className="flex items-center space-x-4">
          {/* Team Filter Dropdown */}
          {selectedSeason?.season_type === 'league' && (
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Team:</label>
              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="all">All Cawood</option>
                <option value="1sts">Cawood 1sts</option>
                <option value="2nds">Cawood 2nds</option>
              </select>
            </div>
          )}
          
          {/* Admin Controls */}
          {currentUser?.role === 'admin' && !isSeasonCompleted && (
            <button
              onClick={() => setShowScheduleModal(true)}
              className="bg-[#5D1F1F] text-white px-4 py-2 rounded-md hover:bg-[#4A1818] transition-colors"
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Add Match
            </button>
          )}
          {currentUser?.role === 'admin' && isSeasonCompleted && (
            <div className="bg-gray-100 text-gray-500 px-4 py-2 rounded-md">
              Season Completed
            </div>
          )}
      </div>
      
      {!filteredMatches || filteredMatches.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500">
            {teamFilter === 'all' ? 'No matches scheduled yet.' : `No matches found for ${teamFilter === '1sts' ? 'Cawood 1sts' : 'Cawood 2nds'}.`}
          </p>
          {currentUser?.role === 'admin' && teamFilter === 'all' && (
            <p className="text-sm text-gray-400 mt-2">Click "Add Match" to create your first match.</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMatches.map((match) => {
            const stats = getAvailabilityStats(match.id);
            const matchStatus = getMatchStatus(match);
            const isAdmin = currentUser?.role === 'admin';
            const courtFixtures = getCourtFixtures(match.id);
            const isCompleted = matchStatus === 'completed';
            const shouldStartCollapsed = isCompleted || matchStatus === 'past-no-fixtures';
            const actuallyExpanded = expandedMatches[match.id] ?? !shouldStartCollapsed;
            
            // Updated date comparison for status display
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const matchDate = new Date(match.match_date);
            matchDate.setHours(0, 0, 0, 0);
            
            // Check if this is a league match
            if (isLeagueMatch(match.id)) {
              const leagueFixture = getLeagueFixture(match.id);
              return (
                <LeagueMatchCard 
                  key={match.id}
                  match={match}
                  fixture={leagueFixture}
                  supabase={supabase}
                />
              );
            }

            return (
              <div key={match.id} className="bg-white rounded-lg shadow">
                {/* Enhanced Progressive Disclosure Header */}
                <div 
                  className={`p-4 sm:p-6 ${courtFixtures.length > 0 || matchStatus === 'future-no-fixtures' ? 'cursor-pointer hover:bg-gray-50 active:bg-gray-100' : ''} transition-colors`}
                  onClick={() => {
                    if (courtFixtures.length > 0 || matchStatus === 'future-no-fixtures') {
                      haptics.tap(); // Haptic feedback for card expansion
                      toggleMatchExpansion(match.id);
                    }
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold">Week {match.week_number}</h3>
                        <p className="text-gray-600">{matchDate.toLocaleDateString('en-GB')}</p>
                        
                        {/* Updated status indicators to show "Today" specially */}
                        {matchDate.getTime() === today.getTime() && (
                          <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                            📅 Today
                          </span>
                        )}
                        
                        {/* Match Status Indicator */}
                        {matchStatus === 'completed' && (
                          <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                            ✅ Completed
                          </span>
                        )}
                        {matchStatus === 'partially-complete' && (
                          <span className="inline-flex px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                            🔄 In Progress
                          </span>
                        )}
                        {matchStatus === 'future-in-progress' && (
                          <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                            📋 Scheduled
                          </span>
                        )}
                        {matchStatus === 'past-in-progress' && (
                          <span className="inline-flex px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded">
                            ⏰ Enter Scores
                          </span>
                        )}
                      </div>
                      
                      {/* Smart Summary - Show key info when collapsed */}
                      {!actuallyExpanded && (
                        <div className="mt-2 sm:mt-3">
                          {matchStatus === 'future-no-fixtures' && (
                            <div className="text-sm text-gray-600">
                              Availability: {stats.available} available, {stats.pending} pending
                            </div>
                          )}
                          {courtFixtures.length > 0 && (
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span>{courtFixtures.length} matches</span>
                              {matchStatus === 'completed' && <span className="text-green-600">All scores recorded</span>}
                              {matchStatus === 'partially-complete' && <span className="text-yellow-600">Some scores pending</span>}
                              {matchStatus === 'past-in-progress' && <span className="text-orange-600">Scores needed</span>}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {/* Admin Controls - Always visible - FIXED: Allow today's matches */}
                      {isAdmin && !isSeasonCompleted && matchStatus === 'future-no-fixtures' && stats.available >= 4 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            generateMatches(match.id);
                          }}
                          className="bg-[#5D1F1F] text-white px-4 py-2 rounded-md hover:bg-[#4A1818] transition-colors text-sm"
                        >
                          Generate ({stats.available})
                        </button>
                      )}
                      
                      {/* Enhanced Expand/Collapse Indicator */}
                      {(courtFixtures.length > 0 || matchStatus === 'future-no-fixtures') && (
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500 hidden sm:inline">
                            {actuallyExpanded ? 'Collapse' : 'Expand'}
                          </span>
                          <div className="text-gray-400 p-1 rounded-full bg-gray-100 transition-all duration-200 hover:bg-gray-200">
                            <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${actuallyExpanded ? 'rotate-180' : 'rotate-0'}`} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expandable Content */}
                {actuallyExpanded && (
                  <div className="border-t border-gray-200 p-6 pt-4">
                    {/* Availability info for matches without fixtures */}
                    {matchStatus === 'future-no-fixtures' && (
                      <div className="mb-4">
                        <div className="text-sm text-gray-600">
                          <div>Availability: {stats.available} available, {stats.pending} pending response</div>
                          {isAdmin && stats.available < 4 && (
                            <div className="text-red-600 mt-1">Need at least 4 players to generate matches</div>
                          )}
                          {isAdmin && stats.available >= 4 && (
                            <div className="text-green-600 mt-1 font-medium">
                              Ready to generate matches! {matchDate.getTime() === today.getTime() ? '(Today\'s match)' : ''}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Match Fixtures Display */}
                    {courtFixtures.length > 0 && (
                      <div className="space-y-4">
                        {/* Available Players Info (Admin Debug) */}
                        {isAdmin && matchStatus !== 'completed' && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <h5 className="font-medium text-green-800 mb-2">📋 Match Details</h5>
                            <div className="text-sm text-green-700">
                              <div><strong>Available Players:</strong> {
                                users.filter(user => {
                                  if (!user.in_ladder || user.status !== 'approved') return false;
                                  const userAvailability = availability.find(a => a.player_id === user.id && a.match_date === match.match_date);
                                  return userAvailability?.is_available === true;
                                })
                                .sort((a, b) => (a.rank || 999) - (b.rank || 999))
                                .map(p => `${p.name} (Rank ${p.rank})`)
                                .join(', ') || 'None'
                              }</div>
                              <div><strong>Courts Created:</strong> {courtFixtures.length}</div>
                            </div>
                          </div>
                        )}
                        
                        {/* Court Fixtures */}
                        {courtFixtures.map((court) => (
                          <div key={court.court} className="border border-gray-200 rounded-lg p-4">
                            <h4 className="font-semibold mb-2">Court {court.court}</h4>
                            <p className="text-sm text-gray-600 mb-3">
                              Players: {[...new Set([
                                ...court.fixtures.map(f => f.player1?.name),
                                ...court.fixtures.map(f => f.player2?.name),
                                ...court.fixtures.map(f => f.player3?.name),
                                ...court.fixtures.map(f => f.player4?.name)
                              ].filter(Boolean))].join(', ')}
                            </p>
                            <div className="space-y-2">
                              {court.fixtures.map((fixture) => {
                                const existingScore = getMatchScore(fixture.id);
                                const canEnterScore = canUserEnterScores(fixture);
                                
                                const pair1Names = [fixture.player1?.name, fixture.player2?.name].filter(Boolean);
                                const pair2Names = [fixture.player3?.name, fixture.player4?.name].filter(Boolean);
                                
                                return (
                                  <div key={fixture.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                    <div className="flex-1">
                                      <span className="text-sm">
                                        {pair1Names.join(' & ')} vs {pair2Names.join(' & ')}
                                        {fixture.sitting_player && ` (${fixture.sitting_player.name} sitting)`}
                                      </span>
                                      {existingScore && (
                                        <div className="text-xs text-gray-600 mt-1">
                                          Score: {existingScore.pair1_score} - {existingScore.pair2_score}
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Score Entry/View Button */}
                                    {canEnterScore && matchStatus !== 'future-no-fixtures' && (
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          haptics.click(); // Haptic feedback for score action
                                          openScoreModal({
                                            fixtureId: fixture.id,
                                            pair1: pair1Names,
                                            pair2: pair2Names
                                          });
                                        }}
                                        className={`text-sm px-4 py-3 rounded transition-colors min-h-[44px] ${
                                          existingScore 
                                            ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                            : 'bg-[#5D1F1F] text-white hover:bg-[#4A1818]'
                                        }`}
                                        style={{ touchAction: 'manipulation' }}
                                      >
                                        {existingScore ? 'View/Challenge' : 'Enter Score'}
                                      </button>
                                    )}

                                    {/* Score Status for non-players */}
                                    {existingScore && !canEnterScore && (
                                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                        Complete
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* No Fixtures Message for Past Matches */}
                    {matchStatus === 'past-no-fixtures' && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-yellow-800 text-sm">
                          This match date has passed but no fixtures were generated.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MatchesTab;