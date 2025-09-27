// src/components/Matches/MatchesTab.js - FIXED for today's dates
import React, { useState, useEffect } from 'react';
import { ChevronDown, MessageCircle } from 'lucide-react';
import { haptics } from '../../utils/haptics';
import LeagueMatchCard from './LeagueMatchCard';
import EnhancedMatchResult from './EnhancedMatchResult';
import SchedulingOptionsModal from '../Modals/SchedulingOptionsModal';
import WhatsAppPostGenerator from '../WhatsApp/WhatsAppPostGenerator';
import ReorderableMatchList from './ReorderableMatchList';

const MatchesTab = ({ 
  currentUser, 
  currentSeason, 
  selectedSeason,
  matchFixtures,
  matchResults,
  availability,
  users,
  generateMatches,
  openScoreModal,
  getAvailabilityStats,
  getMatchScore,
  supabase,
  refetch,
  reorderMatchFixtures
}) => {
  // State for managing which matches are expanded
  const [expandedMatches, setExpandedMatches] = useState({});
  // State for team filter
  const [teamFilter, setTeamFilter] = useState('all'); // 'all', '1sts', '2nds'
  // State for scheduling options modal
  const [showSchedulingModal, setShowSchedulingModal] = useState(false);
  const [pendingMatchId, setPendingMatchId] = useState(null);
  const [pendingAvailableCount, setPendingAvailableCount] = useState(0);
  const [winPercentPreview, setWinPercentPreview] = useState([]);
  const [eloPreview, setEloPreview] = useState([]);
  const [isLoadingPreviews, setIsLoadingPreviews] = useState(false);
  // State for WhatsApp post generator
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsAppMatchData, setWhatsAppMatchData] = useState(null);

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

  // Handle scheduling method selection
  const handleSchedulingMethodSelect = (schedulingMethod) => {
    if (pendingMatchId) {
      generateMatches(pendingMatchId, schedulingMethod);
      setPendingMatchId(null);
      setPendingAvailableCount(0);
      setWinPercentPreview([]);
      setEloPreview([]);
    }
  };

  // Generate court groupings for preview (mirrors useApp.js logic)
  const generateCourtPreview = (sortedPlayers) => {
    const numPlayers = sortedPlayers.length;
    const courts = [];

    if (numPlayers % 4 === 0) {
      for (let i = 0; i < numPlayers; i += 4) {
        courts.push(sortedPlayers.slice(i, i + 4));
      }
    } else if (numPlayers === 5) {
      courts.push(sortedPlayers);
    } else if (numPlayers === 9) {
      courts.push(sortedPlayers.slice(0, 4));
      courts.push(sortedPlayers.slice(4, 9));
    } else if (numPlayers === 10) {
      courts.push(sortedPlayers.slice(0, 5));
      courts.push(sortedPlayers.slice(5, 10));
    } else {
      const groups = Math.floor(numPlayers / 4);
      for (let i = 0; i < groups; i++) {
        courts.push(sortedPlayers.slice(i * 4, (i + 1) * 4));
      }
      if (numPlayers % 4 > 0) {
        courts.push(sortedPlayers.slice(groups * 4));
      }
    }

    return courts;
  };

  // Generate previews for both scheduling methods
  const generatePreviews = async (matchId) => {
    setIsLoadingPreviews(true);
    
    try {
      // Find the match
      const match = currentSeason?.matches?.find(m => m.id === matchId) || 
                    selectedSeason?.matches?.find(m => m.id === matchId);
      
      if (!match) {
        console.error('Match not found for preview');
        return;
      }

      console.log('Generating preview for match:', match);

      // Use the users prop directly - it now contains the correct season players from ladderPlayers
      // The users prop is now passed as ladderPlayers from App.js, so we don't need complex lookup logic
      const ladderPlayers = users || [];
      console.log('Using ladder players from props:', ladderPlayers.length, 'players');
      
      // Filter available players for this match
      const availablePlayers = ladderPlayers.filter(user => {
        const userAvailability = availability.find(
          a => a.player_id === user.id && a.match_date === match.match_date
        );
        console.log(`User ${user.name || user.id} availability:`, userAvailability);
        return userAvailability?.is_available === true;
      });

      console.log('Available players for this match:', availablePlayers);

      if (availablePlayers.length === 0) {
        console.warn('No available players found for preview');
        setWinPercentPreview([]);
        setEloPreview([]);
        return;
      }

      // Generate Win% preview (sorted by rank)
      const winPercentSorted = availablePlayers
        .sort((a, b) => (a.rank || 999) - (b.rank || 999))
        .map(player => ({
          ...player,
          win_percentage: Math.round((player.games_won || 0) / Math.max(player.games_played || 1, 1) * 100)
        }));
      
      console.log('Win% sorted players:', winPercentSorted);
      const winPercentCourts = generateCourtPreview(winPercentSorted);
      console.log('Win% courts:', winPercentCourts);
      setWinPercentPreview(winPercentCourts);

      // Generate ELO preview (sorted by ELO rating)
      const initialRating = selectedSeason?.elo_initial_rating || 1200;
      const eloSorted = availablePlayers
        .sort((a, b) => {
          const aRating = a.elo_rating || initialRating;
          const bRating = b.elo_rating || initialRating;
          return bRating - aRating; // Highest ELO first
        })
        .map(player => ({
          ...player,
          initialRating
        }));
      
      console.log('ELO sorted players:', eloSorted);
      const eloCourts = generateCourtPreview(eloSorted);
      console.log('ELO courts:', eloCourts);
      setEloPreview(eloCourts);

    } catch (error) {
      console.error('Error generating previews:', error);
      setWinPercentPreview([]);
      setEloPreview([]);
    } finally {
      setIsLoadingPreviews(false);
    }
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

  // Group singles matches by date for Singles Championships
  const getGroupedSinglesMatches = () => {
    if (!currentSeason?.matches) return [];
    
    const matchGroups = new Map();
    
    currentSeason.matches.forEach(match => {
      const dateKey = match.match_date;
      if (!matchGroups.has(dateKey)) {
        matchGroups.set(dateKey, {
          date: dateKey,
          matches: [],
          weekNumber: Math.min(...currentSeason.matches.filter(m => m.match_date === dateKey).map(m => m.week_number))
        });
      }
      matchGroups.get(dateKey).matches.push(match);
    });
    
    // Sort groups by date
    return Array.from(matchGroups.values()).sort((a, b) => new Date(a.date) - new Date(b.date));
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
  const isSinglesChampionship = selectedSeason?.season_type === 'singles_championship';
  const singlesMatchGroups = isSinglesChampionship ? getGroupedSinglesMatches() : [];
  const filteredMatches = isSinglesChampionship ? [] : getFilteredMatches();

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
          
          {/* Season Status Indicator */}
          {isSeasonCompleted && (
            <div className="bg-gray-100 text-gray-500 px-4 py-2 rounded-md">
              Season Completed
            </div>
          )}
        </div>
      </div>
      
      {/* Singles Championship View */}
      {isSinglesChampionship ? (
        !singlesMatchGroups || singlesMatchGroups.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-500">No singles matches scheduled yet.</p>
            {currentUser?.role === 'admin' && (
              <p className="text-sm text-gray-400 mt-2">
                Go to Admin tab to import singles matches.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {singlesMatchGroups.map((group, groupIndex) => {
              // Get all fixtures for this date group
              const allGroupFixtures = group.matches.reduce((acc, match) => {
                return acc.concat(matchFixtures.filter(f => f.match_id === match.id));
              }, []);
              
              // Calculate group status
              const completedFixtures = allGroupFixtures.filter(fixture => 
                matchResults.some(result => result.fixture_id === fixture.id)
              ).length;
              
              const groupStatus = completedFixtures === 0 ? 'pending' : 
                                completedFixtures < allGroupFixtures.length ? 'partially-complete' : 'completed';
              
              const groupDate = new Date(group.date);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              groupDate.setHours(0, 0, 0, 0);
              
              const actuallyExpanded = expandedMatches[`group-${groupIndex}`] ?? true; // Default to expanded for singles
              
              return (
                <div key={`group-${groupIndex}`} className="bg-white rounded-lg shadow">
                  {/* Group Header */}
                  <div 
                    className="p-4 sm:p-6 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors"
                    onClick={() => {
                      haptics.tap();
                      setExpandedMatches(prev => ({
                        ...prev,
                        [`group-${groupIndex}`]: !prev[`group-${groupIndex}`]
                      }));
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-semibold">Week {groupIndex + 1}</h3>
                          <p className="text-gray-600">{groupDate.toLocaleDateString('en-GB')}</p>
                          
                          {/* Date status indicators */}
                          {groupDate.getTime() === today.getTime() && (
                            <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                              📅 Today
                            </span>
                          )}
                          
                          {/* Group Status Indicator */}
                          {groupStatus === 'completed' && (
                            <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                              ✅ All Completed
                            </span>
                          )}
                          {groupStatus === 'partially-complete' && (
                            <span className="inline-flex px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                              🔄 In Progress
                            </span>
                          )}
                          {groupStatus === 'pending' && (
                            <span className="inline-flex px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded">
                              ⏰ Enter Scores
                            </span>
                          )}
                        </div>
                        
                        {/* Summary when collapsed */}
                        {!actuallyExpanded && (
                          <div className="mt-2 sm:mt-3">
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span>{group.matches.length} matches</span>
                              {groupStatus === 'completed' && <span className="text-green-600">All results recorded</span>}
                              {groupStatus === 'partially-complete' && <span className="text-yellow-600">{completedFixtures}/{allGroupFixtures.length} completed</span>}
                              {groupStatus === 'pending' && <span className="text-orange-600">Results needed</span>}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {/* Expand/Collapse Indicator */}
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500 hidden sm:inline">
                            {actuallyExpanded ? 'Collapse' : 'Expand'}
                          </span>
                          <div className="text-gray-400 p-1 rounded-full bg-gray-100 transition-all duration-200 hover:bg-gray-200">
                            <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${actuallyExpanded ? 'rotate-180' : 'rotate-0'}`} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Content - All Singles Matches for this Date */}
                  {actuallyExpanded && (
                    <div className="border-t border-gray-200 p-6 pt-4">
                      <div className="space-y-3">
                        {group.matches.map((match) => {
                          const matchFixturesForThisMatch = matchFixtures.filter(f => f.match_id === match.id);
                          
                          return matchFixturesForThisMatch.map((fixture) => {
                            const existingScore = getMatchScore(fixture.id);
                            const canEnterScore = canUserEnterScores(fixture);
                            
                            return (
                              <div key={fixture.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                                {/* Enhanced Match Result Display */}
                                {existingScore ? (
                                  <EnhancedMatchResult 
                                    fixture={fixture}
                                    score={existingScore}
                                    selectedSeason={selectedSeason}
                                    currentUser={currentUser}
                                    users={users}
                                  />
                                ) : (
                                  /* Placeholder for matches without scores */
                                  <div className="p-4">
                                    <div className="flex justify-between items-center">
                                      <div className="font-medium text-gray-900">
                                        {fixture.player1?.name} vs {fixture.player2?.name}
                                      </div>
                                      <div className="text-sm text-gray-500">No score yet</div>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Integrated Challenge Button */}
                                {canEnterScore && !isSeasonCompleted && (
                                  <div className="border-t border-gray-100">
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        haptics.click();
                                        openScoreModal({
                                          fixtureId: fixture.id,
                                          pair1: [fixture.player1?.name],
                                          pair2: [fixture.player2?.name]
                                        });
                                      }}
                                      className={`text-sm px-6 py-3 transition-colors min-h-[44px] w-full font-medium border-0 rounded-none rounded-b-xl ${
                                        existingScore 
                                          ? 'bg-blue-600 text-white hover:bg-blue-700 focus:bg-blue-700' 
                                          : 'bg-[#5D1F1F] text-white hover:bg-[#4A1818] focus:bg-[#4A1818]'
                                      }`}
                                      style={{ touchAction: 'manipulation' }}
                                    >
                                      {existingScore ? 'Challenge Score' : 'Enter Score'}
                                    </button>
                                  </div>
                                )}

                                {/* Score Status for non-players */}
                                {existingScore && !canEnterScore && (
                                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                    Complete
                                  </span>
                                )}
                                
                                {/* No score yet indicator */}
                                {!existingScore && !canEnterScore && (
                                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                    Pending
                                  </span>
                                )}
                              </div>
                            );
                          });
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Regular Ladder/League View */
        !filteredMatches || filteredMatches.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-500">
              {teamFilter === 'all' ? 'No matches scheduled yet.' : `No matches found for ${teamFilter === '1sts' ? 'Cawood 1sts' : 'Cawood 2nds'}.`}
            </p>
            {currentUser?.role === 'admin' && teamFilter === 'all' && (
              <p className="text-sm text-gray-400 mt-2">
                {selectedSeason?.season_type === 'ladder' 
                  ? 'Go to Admin tab to add ladder matches.'
                  : 'League matches are added via import in the Admin tab.'
                }
              </p>
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
                      {/* WhatsApp button - Admin only */}
                      {selectedSeason?.season_type === 'ladder' && isAdmin && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const matchFixtures = courtFixtures.length > 0 ?
                              courtFixtures.flatMap(court => court.fixtures) :
                              null;
                            setWhatsAppMatchData({
                              match,
                              fixtures: matchFixtures,
                              users,
                              availabilityStats: stats
                            });
                            setShowWhatsAppModal(true);
                          }}
                          className="bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 transition-colors text-sm flex items-center space-x-1"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>WhatsApp</span>
                        </button>
                      )}

                      {/* Admin Controls - Always visible - FIXED: Allow today's matches */}
                      {isAdmin && !isSeasonCompleted && matchStatus === 'future-no-fixtures' && stats.available >= 4 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPendingMatchId(match.id);
                            setPendingAvailableCount(stats.available);
                            setShowSchedulingModal(true);
                            generatePreviews(match.id);
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

                        {/* Reorderable Court Fixtures */}
                        <ReorderableMatchList
                          courtFixtures={courtFixtures}
                          getMatchScore={getMatchScore}
                          canUserEnterScores={canUserEnterScores}
                          openScoreModal={openScoreModal}
                          selectedSeason={selectedSeason}
                          currentUser={currentUser}
                          users={users}
                          onReorderMatches={reorderMatchFixtures}
                          isSeasonCompleted={isSeasonCompleted}
                        />
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
        )
      )}

      {/* WhatsApp Post Generator Modal */}
      {showWhatsAppModal && whatsAppMatchData && (
        <WhatsAppPostGenerator
          match={whatsAppMatchData.match}
          fixtures={whatsAppMatchData.fixtures}
          users={whatsAppMatchData.users}
          availabilityStats={whatsAppMatchData.availabilityStats}
          onClose={() => {
            setShowWhatsAppModal(false);
            setWhatsAppMatchData(null);
          }}
        />
      )}

      {/* Scheduling Options Modal */}
      <SchedulingOptionsModal
        showModal={showSchedulingModal}
        setShowModal={setShowSchedulingModal}
        availablePlayersCount={pendingAvailableCount}
        seasonEloEnabled={selectedSeason?.elo_enabled || false}
        onConfirm={handleSchedulingMethodSelect}
        winPercentPreview={winPercentPreview}
        eloPreview={eloPreview}
        isLoadingPreviews={isLoadingPreviews}
      />
    </div>
  );
};

export default MatchesTab;