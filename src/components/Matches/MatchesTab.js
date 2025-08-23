// src/components/Matches/MatchesTab.js
import React, { useState } from 'react';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';

const MatchesTab = ({ 
  currentUser, 
  currentSeason, 
  setShowScheduleModal,
  matchFixtures,
  matchResults,
  availability,
  users,
  generateMatches,
  openScoreModal,
  getAvailabilityStats,
  getMatchScore
}) => {
  // State for managing which matches are expanded
  const [expandedMatches, setExpandedMatches] = useState({});

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
    const matchDate = new Date(match.match_date);
    
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Match Schedule</h2>
        {currentUser?.role === 'admin' && (
          <button
            onClick={() => setShowScheduleModal(true)}
            className="bg-[#5D1F1F] text-white px-4 py-2 rounded-md hover:bg-[#4A1818] transition-colors"
          >
            <Plus className="w-4 h-4 inline mr-2" />
            Add Match
          </button>
        )}
      </div>
      
      {!currentSeason?.matches || currentSeason.matches.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500">No matches scheduled yet.</p>
          {currentUser?.role === 'admin' && (
            <p className="text-sm text-gray-400 mt-2">Click "Add Match" to create your first match.</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {currentSeason.matches.map((match) => {
            const stats = getAvailabilityStats(match.id);
            const matchStatus = getMatchStatus(match);
            const isAdmin = currentUser?.role === 'admin';
            const courtFixtures = getCourtFixtures(match.id);
            const isExpanded = expandedMatches[match.id] !== false; // Default to expanded for upcoming/in-progress
            const isCompleted = matchStatus === 'completed';
            const shouldStartCollapsed = isCompleted || matchStatus === 'past-no-fixtures';
            const actuallyExpanded = expandedMatches[match.id] ?? !shouldStartCollapsed;
            
            return (
              <div key={match.id} className="bg-white rounded-lg shadow">
                {/* Collapsible Header */}
                <div 
                  className={`p-6 ${courtFixtures.length > 0 || matchStatus === 'future-no-fixtures' ? 'cursor-pointer hover:bg-gray-50' : ''} transition-colors`}
                  onClick={() => {
                    if (courtFixtures.length > 0 || matchStatus === 'future-no-fixtures') {
                      toggleMatchExpansion(match.id);
                    }
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold">Week {match.week_number}</h3>
                        <p className="text-gray-600">{new Date(match.match_date).toLocaleDateString('en-GB')}</p>
                        
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
                      
                      {/* Availability Info (only for future matches without fixtures) */}
                      {matchStatus === 'future-no-fixtures' && !actuallyExpanded && (
                        <div className="mt-2 text-sm text-gray-600">
                          Availability: {stats.available} available, {stats.pending} pending
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {/* Admin Controls - Always visible */}
                      {isAdmin && matchStatus === 'future-no-fixtures' && stats.available >= 4 && (
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
                      
                      {/* Expand/Collapse Icon */}
                      {(courtFixtures.length > 0 || matchStatus === 'future-no-fixtures') && (
                        <div className="text-gray-400">
                          {actuallyExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
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
                                    
                                    {/* Score Entry Button */}
                                    {!existingScore && canEnterScore && matchStatus !== 'future-no-fixtures' && (
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openScoreModal({
                                            fixtureId: fixture.id,
                                            pair1: pair1Names,
                                            pair2: pair2Names
                                          });
                                        }}
                                        className="text-xs bg-[#5D1F1F] text-white px-3 py-1 rounded hover:bg-[#4A1818]"
                                      >
                                        Enter Score
                                      </button>
                                    )}
                                    
                                    {/* Score Status */}
                                    {existingScore && (
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

const MatchesTab = ({ 
  currentUser, 
  currentSeason, 
  setShowScheduleModal,
  matchFixtures,
  matchResults,
  availability,
  users,
  generateMatches,
  openScoreModal,
  getAvailabilityStats,
  getMatchScore
}) => {
  // Helper function to determine match status
  const getMatchStatus = (match) => {
    const today = new Date();
    const matchDate = new Date(match.match_date);
    
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Match Schedule</h2>
        {currentUser?.role === 'admin' && (
          <button
            onClick={() => setShowScheduleModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 inline mr-2" />
            Add Match
          </button>
        )}
      </div>
      
      {!currentSeason?.matches || currentSeason.matches.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500">No matches scheduled yet.</p>
          {currentUser?.role === 'admin' && (
            <p className="text-sm text-gray-400 mt-2">Click "Add Match" to create your first match.</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {currentSeason.matches.map((match) => {
            const stats = getAvailabilityStats(match.id);
            const matchStatus = getMatchStatus(match);
            const isAdmin = currentUser?.role === 'admin';
            const courtFixtures = getCourtFixtures(match.id);
            
            return (
              <div key={match.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Week {match.week_number}</h3>
                    <p className="text-gray-600">{new Date(match.match_date).toLocaleDateString('en-GB')}</p>
                    
                    {/* Match Status Indicator */}
                    <div className="mt-2">
                      {matchStatus === 'completed' && (
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                          ✅ Match Completed
                        </span>
                      )}
                      {matchStatus === 'partially-complete' && (
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                          🔄 Scores Being Entered
                        </span>
                      )}
                      {matchStatus === 'future-in-progress' && (
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                          📋 Fixtures Generated
                        </span>
                      )}
                      {matchStatus === 'past-in-progress' && (
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded">
                          ⏰ Match Played - Enter Scores
                        </span>
                      )}
                    </div>
                    
                    {/* Availability Info (only for future matches without fixtures) */}
                    {matchStatus === 'future-no-fixtures' && (
                      <div className="mt-2 text-sm text-gray-600">
                        Availability: {stats.available} available, {stats.pending} pending response
                      </div>
                    )}
                  </div>
                  
                  {/* Admin Controls */}
                  {isAdmin && (
                    <div className="space-x-2">
                      {matchStatus === 'future-no-fixtures' && stats.available >= 4 && (
                        <button
                          onClick={() => generateMatches(match.id)}
                          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                        >
                          Generate Matches ({stats.available} available)
                        </button>
                      )}
                      {matchStatus === 'future-no-fixtures' && stats.available < 4 && (
                        <span className="text-gray-500 text-sm">Need 4+ players to generate matches</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Match Fixtures Display */}
                {courtFixtures.length > 0 && (
                  <div className="space-y-4">
                    {/* Available Players Info (Admin Debug) */}
                    {isAdmin && matchStatus !== 'completed' && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <h5 className="font-medium text-green-800 mb-2">
                          {matchStatus === 'completed' ? '✅ Match Complete' : '📋 Match Details'}
                        </h5>
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
                                
                                {/* Score Entry Button */}
                                {!existingScore && canEnterScore && matchStatus !== 'future-no-fixtures' && (
                                  <button 
                                    onClick={() => openScoreModal({
                                      fixtureId: fixture.id,
                                      pair1: pair1Names,
                                      pair2: pair2Names
                                    })}
                                    className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                                  >
                                    Enter Score
                                  </button>
                                )}
                                
                                {/* Score Status */}
                                {existingScore && (
                                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                    Complete
                                  </span>
                                )}
                                
                                {/* No Access Message */}
                                {!existingScore && !canEnterScore && matchStatus !== 'future-no-fixtures' && (
                                  <span className="text-xs text-gray-500 px-2 py-1">
                                    {currentUser?.role === 'admin' ? 'Admin can enter' : 'Not your match'}
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
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MatchesTab;