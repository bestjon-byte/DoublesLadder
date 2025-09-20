// src/components/Profile/ProfileTab.js
import React, { useState } from 'react';
import { useProfileStats } from '../../hooks/useProfileStats';
import { 
  Trophy, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Users,
  Target,
  Award,
  Activity,
  BarChart3,
  X,
  ChevronRight
} from 'lucide-react';

const ProfileTab = ({ 
  currentUser, 
  seasons = [], 
  selectedSeason = null,
  allUsers = [],
  selectedPlayerId = null,
  onPlayerSelect = null,
  onPlayerClear = null
}) => {
  const [filterType, setFilterType] = useState('current'); // 'current', 'all-time', 'season'
  const [selectedSeasonId, setSelectedSeasonId] = useState(selectedSeason?.id);
  const [selectedStatDetail, setSelectedStatDetail] = useState(null);
  const [showMatchDetail, setShowMatchDetail] = useState(null);

  // Determine which player to show (selected player or current user)
  const viewingPlayerId = selectedPlayerId || currentUser?.id;
  const viewingPlayer = allUsers.find(user => user.id === viewingPlayerId) || currentUser;

  const profileStats = useProfileStats(
    viewingPlayerId, 
    filterType === 'current' ? selectedSeason?.id : 
    filterType === 'season' ? selectedSeasonId : null,
    filterType === 'all-time',
    allUsers
  );

  const {
    matchHistory = [],
    overallStats = {},
    bestPartners = [],
    nemesisOpponent = null,
    nemesisPair = null,
    winStreaks = {},
    formGuide = [],
    headToHeadRecords = [],
    seasonProgression = [],
    eloData = { currentRating: null, recentChanges: [], rankingPosition: null },
    loading = true,
    error = null
  } = profileStats || {};

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5D1F1F]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Error loading profile stats: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Player and Season Filter */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {viewingPlayer?.name || 'Unknown Player'}'s Profile
              </h1>
              {selectedPlayerId && selectedPlayerId !== currentUser?.id && (
                <button
                  onClick={() => onPlayerClear && onPlayerClear()}
                  className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-full transition-colors min-h-[44px]"
                  style={{ touchAction: 'manipulation' }}
                >
                  View My Profile
                </button>
              )}
            </div>
            <p className="text-gray-600">Performance statistics and match history</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Player Selection Dropdown */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Player:</label>
              <select 
                value={viewingPlayerId || ''} 
                onChange={(e) => {
                  const newPlayerId = e.target.value;
                  if (newPlayerId === currentUser?.id) {
                    onPlayerClear && onPlayerClear();
                  } else {
                    onPlayerSelect && onPlayerSelect(newPlayerId);
                  }
                }}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5D1F1F] focus:border-transparent min-w-0"
              >
                {allUsers
                  .sort((a, b) => {
                    // Put current user first, then alphabetical
                    if (a.id === currentUser?.id) return -1;
                    if (b.id === currentUser?.id) return 1;
                    return (a.name || '').localeCompare(b.name || '');
                  })
                  .map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name}{user.id === currentUser?.id ? ' (You)' : ''}
                    </option>
                  ))}
              </select>
            </div>
            
            {/* Season Filter */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">View:</label>
              <select 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5D1F1F] focus:border-transparent"
              >
                <option value="current">Current Season</option>
                <option value="all-time">All Time</option>
                {seasons.length > 1 && <option value="season">Select Season</option>}
              </select>
              {filterType === 'season' && (
                <select 
                  value={selectedSeasonId || ''} 
                  onChange={(e) => setSelectedSeasonId(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5D1F1F] focus:border-transparent"
                >
                  <option value="">Select a season...</option>
                  {seasons.map(season => (
                    <option key={season.id} value={season.id}>
                      {season.name} ({season.season_type === 'league' ? 'League' : 'Ladder'})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Overview Stats Cards - Mobile First 2x2 Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Combined ELO Rating Card (show when any ELO data exists) */}
        {(eloData.currentRating || eloData.recentChanges.length > 0) && (
          <CombinedEloCard
            eloData={eloData}
            onClick={() => setSelectedStatDetail('combinedElo')}
          />
        )}
        
        {/* Combined Match Performance Card */}
        <CombinedMatchCard
          stats={overallStats}
          onClick={() => setSelectedStatDetail('combinedMatch')}
        />
        
        {/* Combined Game Performance Card */}
        <CombinedGameCard
          stats={overallStats}
          onClick={() => setSelectedStatDetail('combinedGame')}
        />
        
        {/* Combined Streak Card */}
        <CombinedStreakCard
          winStreaks={winStreaks}
          onClick={() => setSelectedStatDetail('combinedStreak')}
        />
      </div>

      {/* Stats Detail Modal */}
      {selectedStatDetail && (
        <StatsDetailModal 
          type={selectedStatDetail}
          stats={overallStats}
          winStreaks={winStreaks}
          matchHistory={matchHistory}
          eloData={eloData}
          allUsers={allUsers}
          onClose={() => setSelectedStatDetail(null)}
        />
      )}

      {/* Season Progression Chart */}
      {seasonProgression.length > 1 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-[#5D1F1F]" />
            Season Progression
          </h2>
          <SeasonProgressionChart data={seasonProgression} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best Partners */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2 text-[#5D1F1F]" />
            Best Partners
          </h2>
          <BestPartnersSection partners={bestPartners} allUsers={allUsers} />
        </div>

        {/* Nemesis Analysis */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingDown className="w-5 h-5 mr-2 text-red-600" />
            Nemesis Analysis
          </h2>
          <NemesisSection 
            nemesisOpponent={nemesisOpponent} 
            nemesisPair={nemesisPair}
            allUsers={allUsers} 
          />
        </div>
      </div>

      {/* Form Guide */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-[#5D1F1F]" />
          Recent Form (Last 10 Matches)
        </h2>
        <FormGuide 
          matches={formGuide} 
          allUsers={allUsers} 
          onMatchClick={(match) => setShowMatchDetail(match)}
        />
      </div>

      {/* Match History */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-[#5D1F1F]" />
          Match History
        </h2>
        <EnhancedMatchHistory matches={matchHistory} allUsers={allUsers} />
      </div>

      {/* Head-to-Head Records */}
      {headToHeadRecords.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2 text-[#5D1F1F]" />
            Head-to-Head Records
          </h2>
          <HeadToHeadSection 
            records={headToHeadRecords.sort((a, b) => {
              const aGameWinRate = a.totalGames > 0 ? a.gamesWon / a.totalGames : 0;
              const bGameWinRate = b.totalGames > 0 ? b.gamesWon / b.totalGames : 0;
              return bGameWinRate - aGameWinRate;
            })} 
            allUsers={allUsers} 
          />
        </div>
      )}

      {/* Match Detail Modal */}
      {showMatchDetail && (
        <MatchDetailModal 
          match={showMatchDetail}
          allUsers={allUsers}
          onClose={() => setShowMatchDetail(null)}
        />
      )}
    </div>
  );
};

// Combined ELO Card Component
const CombinedEloCard = ({ eloData, onClick }) => {
  const recentChange = eloData.recentChanges[0];
  const currentRating = Math.round(eloData.currentRating || 0);
  const change = recentChange ? recentChange.change : 0;
  
  // Simple line chart data for recent ELO changes (last 12 changes)
  const chartData = eloData.recentChanges.slice(0, 12).reverse();
  
  return (
    <div 
      className="rounded-lg border border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 p-6 transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Award className="w-5 h-5 text-purple-600" />
            </div>
            {/* Ranking badge on icon */}
            {eloData.rankingPosition && (
              <div className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {eloData.rankingPosition}
              </div>
            )}
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600">ELO Rating</h3>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-gray-900">{currentRating}</span>
              {change !== 0 && (
                <span className={`text-sm font-bold px-2 py-1 rounded-full ${
                  change > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {change > 0 ? '+' : ''}{change}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="text-xs text-gray-400 flex items-center">
          <span>Tap for history</span>
          <ChevronRight className="w-3 h-3 ml-1" />
        </div>
      </div>
      
      {/* Enhanced ELO progression line chart - Much Larger */}
      {chartData.length > 1 && (
        <div className="flex-1">
          <div className="h-24 relative">
            {/* Chart container */}
            <svg className="w-full h-full" viewBox="0 0 100 40">
              {/* Background grid lines */}
              <defs>
                <pattern id="grid" width="20" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 10" fill="none" stroke="#e5e7eb" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100" height="40" fill="url(#grid)" />
              
              {/* ELO line */}
              {(() => {
                const maxRating = Math.max(...chartData.map(c => c.newRating));
                const minRating = Math.min(...chartData.map(c => c.newRating));
                const range = Math.max(maxRating - minRating, 10); // Ensure minimum range
                const points = chartData.map((change, index) => {
                  const x = (index / (chartData.length - 1)) * 100;
                  const y = 40 - ((change.newRating - minRating) / range) * 35 - 2.5; // 2.5 padding
                  return `${x},${y}`;
                }).join(' ');
                
                return (
                  <g>
                    {/* Line path */}
                    <polyline
                      fill="none"
                      stroke="#7c3aed"
                      strokeWidth="1.5"
                      points={points}
                    />
                    
                    {/* Data points */}
                    {chartData.map((change, index) => {
                      const x = (index / (chartData.length - 1)) * 100;
                      const y = 40 - ((change.newRating - minRating) / range) * 35 - 2.5;
                      const isPositive = change.change > 0;
                      const isNegative = change.change < 0;
                      
                      return (
                        <g key={index}>
                          {/* Point circle */}
                          <circle
                            cx={x}
                            cy={y}
                            r="1.5"
                            fill={isPositive ? '#10b981' : isNegative ? '#ef4444' : '#6b7280'}
                            stroke="white"
                            strokeWidth="0.5"
                          />
                          
                          {/* Change indicator */}
                          {change.change !== 0 && (
                            <g>
                              {/* Arrow or indicator */}
                              {isPositive ? (
                                <polygon
                                  points={`${x-1},${y-3} ${x+1},${y-3} ${x},${y-5}`}
                                  fill="#10b981"
                                  opacity="0.8"
                                />
                              ) : (
                                <polygon
                                  points={`${x-1},${y+3} ${x+1},${y+3} ${x},${y+5}`}
                                  fill="#ef4444"
                                  opacity="0.8"
                                />
                              )}
                            </g>
                          )}
                        </g>
                      );
                    })}
                  </g>
                );
              })()}
            </svg>
            
            {/* Tooltip overlay */}
            <div className="absolute inset-0 flex">
              {chartData.map((change, index) => (
                <div
                  key={index}
                  className="flex-1 relative group cursor-pointer"
                  title={`${change.newRating} (${change.change > 0 ? '+' : ''}${change.change})`}
                >
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                    <div className={`text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap ${
                      change.change > 0 ? 'bg-green-100 text-green-800 border border-green-200' :
                      change.change < 0 ? 'bg-red-100 text-red-800 border border-red-200' :
                      'bg-gray-100 text-gray-800 border border-gray-200'
                    }`}>
                      {change.newRating} ({change.change > 0 ? '+' : ''}{change.change})
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Combined Match Card Component
const CombinedMatchCard = ({ stats, onClick }) => {
  const winRate = Math.round(((stats.matchesWon || 0) / Math.max(stats.totalMatches || 1, 1)) * 100);
  
  return (
    <div 
      className="rounded-lg border border-green-200 bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 p-6 transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <Trophy className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600">Match Performance</h3>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-green-600">{winRate}%</span>
              <span className="text-sm text-gray-500">win rate</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Win rate visual bar */}
      <div className="mb-3">
        <div className="w-full bg-green-200 rounded-full h-2">
          <div 
            className="bg-green-500 h-2 rounded-full transition-all duration-700"
            style={{ width: `${winRate}%` }}
          />
        </div>
      </div>
      
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600">
          {stats.matchesWon || 0}W - {stats.matchesLost || 0}L - {stats.matchesDrawn || 0}D
        </span>
        <div className="flex items-center text-gray-400">
          <span>Tap for details</span>
          <ChevronRight className="w-3 h-3 ml-1" />
        </div>
      </div>
    </div>
  );
};

// Combined Game Card Component
const CombinedGameCard = ({ stats, onClick }) => {
  const winRate = Math.round((stats.gameWinRate || 0) * 100);
  
  return (
    <div 
      className="rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 p-6 transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Target className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600">Game Performance</h3>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-blue-600">{winRate}%</span>
              <span className="text-sm text-gray-500">win rate</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Win rate visual bar */}
      <div className="mb-3">
        <div className="w-full bg-blue-200 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-700"
            style={{ width: `${winRate}%` }}
          />
        </div>
      </div>
      
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600">
          {stats.gamesWon || 0} of {stats.totalGames || 0} games won
        </span>
        <div className="flex items-center text-gray-400">
          <span>Tap for details</span>
          <ChevronRight className="w-3 h-3 ml-1" />
        </div>
      </div>
    </div>
  );
};

// Combined Streak Card Component
const CombinedStreakCard = ({ winStreaks, onClick }) => {
  const currentStreakType = winStreaks.currentType;
  const currentStreak = winStreaks.current || 0;
  const bestStreak = winStreaks.longest || 0;
  
  const getStreakClasses = (type) => {
    if (type === 'win') return {
      border: 'border-green-200',
      bg: 'bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      textColor: 'text-green-600'
    };
    if (type === 'loss') return {
      border: 'border-red-200',
      bg: 'bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-200',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      textColor: 'text-red-600'
    };
    return {
      border: 'border-gray-200',
      bg: 'bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200',
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-600',
      textColor: 'text-gray-600'
    };
  };
  
  const classes = getStreakClasses(currentStreakType);
  
  return (
    <div 
      className={`rounded-lg border ${classes.border} ${classes.bg} p-6 transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className={`w-10 h-10 ${classes.iconBg} rounded-full flex items-center justify-center`}>
            <Activity className={`w-5 h-5 ${classes.iconColor}`} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600">Current Streak</h3>
            <div className="flex items-center space-x-2">
              <span className={`text-2xl font-bold ${classes.textColor}`}>{currentStreak}</span>
              <span className="text-sm text-gray-500">
                {currentStreakType === 'win' ? 'wins' : currentStreakType === 'loss' ? 'losses' : 'none'}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Streak comparison */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Best streak:</span>
          <span className="font-bold text-orange-600">{bestStreak} wins</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
          <div 
            className="bg-orange-500 h-1 rounded-full transition-all duration-700"
            style={{ width: `${Math.min((currentStreakType === 'win' ? currentStreak : 0) / Math.max(bestStreak, 1) * 100, 100)}%` }}
          />
        </div>
      </div>
      
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600">
          {currentStreakType === 'win' && currentStreak === bestStreak && currentStreak > 0 ? 
            'Personal best!' : 
            `${Math.max(bestStreak - (currentStreakType === 'win' ? currentStreak : 0), 0)} from best`}
        </span>
        <div className="flex items-center text-gray-400">
          <span>Tap for details</span>
          <ChevronRight className="w-3 h-3 ml-1" />
        </div>
      </div>
    </div>
  );
};

// Enhanced Interactive Stats Card Component  
const StatsCard = ({ icon, title, value, subtitle, color, onClick, detailType }) => {
  const colorClasses = {
    yellow: 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 hover:from-yellow-100 hover:to-yellow-200',
    green: 'bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:from-green-100 hover:to-green-200',
    blue: 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:from-blue-100 hover:to-blue-200',
    teal: 'bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200 hover:from-teal-100 hover:to-teal-200',
    purple: 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:from-purple-100 hover:to-purple-200',
    indigo: 'bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200 hover:from-indigo-100 hover:to-indigo-200',
    orange: 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:from-orange-100 hover:to-orange-200',
    red: 'bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:from-red-100 hover:to-red-200',
    gray: 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 hover:from-gray-100 hover:to-gray-200'
  };

  const iconBackgrounds = {
    yellow: 'bg-yellow-100',
    green: 'bg-green-100',
    blue: 'bg-blue-100',
    teal: 'bg-teal-100',
    purple: 'bg-purple-100',
    indigo: 'bg-indigo-100',
    orange: 'bg-orange-100',
    red: 'bg-red-100',
    gray: 'bg-gray-100'
  };

  return (
    <div 
      className={`rounded-lg border p-6 transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer ${colorClasses[color] || colorClasses.blue}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
          <p className="text-xs text-gray-500">{subtitle}</p>
          <div className="flex items-center text-xs text-gray-400 mt-1">
            <span>Tap for details</span>
            <ChevronRight className="w-3 h-3 ml-1" />
          </div>
        </div>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${iconBackgrounds[color] || iconBackgrounds.blue}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

// Season Progression Chart Component
const SeasonProgressionChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded border-2 border-dashed border-gray-300">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">No season data available</p>
          <p className="text-sm text-gray-400">Play matches across multiple seasons to see progression</p>
        </div>
      </div>
    );
  }

  // Note: maxWinRate could be used for scaling if needed in future enhancements
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.map((season, index) => (
          <div key={season.seasonId} className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-900 truncate">
              {season.seasonName || `Season ${index + 1}`}
            </div>
            <div className="mt-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Win Rate</span>
                <span className="font-semibold text-[#5D1F1F]">{Math.round(season.winRate)}%</span>
              </div>
              <div className="mt-1 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-[#5D1F1F] to-red-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(season.winRate / 100) * 100}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {season.gamesWon}W - {season.totalGames - season.gamesWon}L ({season.totalGames} games)
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const BestPartnersSection = ({ partners, allUsers }) => {
  const [showAll, setShowAll] = useState(false);
  const displayedPartners = showAll ? partners : partners.slice(0, 5);

  return (
    <div className="space-y-3">
      {partners.length === 0 ? (
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm mb-1">No partnership data available</p>
          <p className="text-xs text-gray-400">Play matches with different partners to see statistics</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedPartners.map((partner, index) => {
          const winRate = Math.round(partner.winRate * 100);
          return (
            <div key={partner.playerId} className="group hover:bg-gray-50 rounded-lg p-3 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-yellow-100 text-yellow-800' :
                    index === 1 ? 'bg-gray-100 text-gray-600' :
                    index === 2 ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    #{index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {partner.name}
                    </div>
                    <div className="text-xs text-gray-500">{partner.totalGames} games, {partner.matches} matches together</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">{winRate}%</div>
                  <div className="w-16 bg-gray-200 rounded-full h-1.5 mt-1">
                    <div 
                      className="bg-green-500 h-1.5 rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${winRate}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {partners.length > 5 && (
          <div className="text-center pt-2 border-t border-gray-100">
            <button 
              onClick={() => setShowAll(!showAll)}
              className="text-sm text-[#5D1F1F] hover:text-red-800 font-medium transition-colors"
            >
              {showAll ? `Show less ↑` : `View all ${partners.length} partners ↓`}
            </button>
          </div>
        )}
      </div>
    )}
    </div>
  );
};

const NemesisSection = ({ nemesisOpponent, nemesisPair, allUsers }) => (
  <div className="space-y-4">
    {!nemesisOpponent && !nemesisPair ? (
      <div className="text-center py-8">
        <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm mb-1">No nemesis data available</p>
        <p className="text-xs text-gray-400">Play more matches to identify challenging opponents</p>
      </div>
    ) : (
      <>
        {nemesisOpponent && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
              <TrendingDown className="w-4 h-4 mr-1 text-red-500" />
              Toughest Opponent
            </h3>
            <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 font-bold text-lg">⚔️</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {nemesisOpponent.name}
                    </div>
                    <div className="text-xs text-gray-600">Your toughest individual opponent</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-red-600">
                    {Math.round(nemesisOpponent.winRate * 100)}%
                  </div>
                  <div className="text-xs text-gray-600">
                    {nemesisOpponent.gamesWon}W - {nemesisOpponent.gamesLost}L games ({nemesisOpponent.matches} matches)
                  </div>
                  <div className="w-16 bg-red-200 rounded-full h-1.5 mt-1">
                    <div 
                      className="bg-red-500 h-1.5 rounded-full"
                      style={{ width: `${nemesisOpponent.winRate * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {nemesisPair && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Users className="w-4 h-4 mr-1 text-red-500" />
              Toughest Pair
            </h3>
            <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 font-bold text-sm">👥</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {nemesisPair.player1Name} & {nemesisPair.player2Name}
                    </div>
                    <div className="text-xs text-gray-600">Your toughest doubles pair</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-red-600">
                    {Math.round(nemesisPair.winRate * 100)}%
                  </div>
                  <div className="text-xs text-gray-600">
                    {nemesisPair.gamesWon}W - {nemesisPair.gamesLost}L games ({nemesisPair.matches} matches)
                  </div>
                  <div className="w-16 bg-red-200 rounded-full h-1.5 mt-1">
                    <div 
                      className="bg-red-500 h-1.5 rounded-full"
                      style={{ width: `${nemesisPair.winRate * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    )}
  </div>
);

const FormGuide = ({ matches, allUsers, onMatchClick }) => (
  <div className="space-y-4">
    {matches.length === 0 ? (
      <div className="text-center py-8">
        <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm mb-1">No recent matches</p>
        <p className="text-xs text-gray-400">Your recent form will appear here after playing matches</p>
      </div>
    ) : (
      <>
        <div className="flex items-center justify-center space-x-1 mb-4 p-4 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium text-gray-600 mr-3">Recent form:</span>
          {matches.map((match, index) => (
            <div
              key={index}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm transition-all duration-300 hover:scale-110 cursor-pointer ${
                match.tie
                  ? 'bg-gray-500 text-white hover:bg-gray-600'
                  : match.won 
                    ? 'bg-green-500 text-white hover:bg-green-600' 
                    : 'bg-red-500 text-white hover:bg-red-600'
              }`}
              title={`${match.tie ? 'Drew' : match.won ? 'Won' : 'Lost'} ${match.score} vs ${match.opponentNames?.join(' & ')} - Click for details`}
              onClick={() => onMatchClick && onMatchClick(match)}
            >
              {match.tie ? 'D' : match.won ? 'W' : 'L'}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {matches.filter(m => m.won).length}
                </div>
                <div className="text-sm text-green-700">Recent wins</div>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-600">
                  {matches.filter(m => m.tie).length}
                </div>
                <div className="text-sm text-gray-700">Recent draws</div>
              </div>
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-gray-600 rounded"></div>
              </div>
            </div>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {matches.filter(m => !m.won && !m.tie).length}
                </div>
                <div className="text-sm text-red-700">Recent losses</div>
              </div>
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-red-600" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Win Rate Trend */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm font-medium text-blue-900 mb-2">Recent Form Analysis</div>
          <div className="text-xs text-blue-700">
            Last {matches.length} matches: {Math.round((matches.filter(m => m.won).length / Math.max(matches.filter(m => !m.tie).length, 1)) * 100)}% win rate (excluding draws)
          </div>
        </div>
      </>
    )}
  </div>
);

// Enhanced Match History Component
const EnhancedMatchHistory = ({ matches, allUsers }) => {
  const [showAll, setShowAll] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'wins', 'losses', 'draws'
  
  const filteredMatches = matches.filter(match => {
    if (filter === 'wins') return match.won;
    if (filter === 'losses') return !match.won && !match.tie;
    if (filter === 'draws') return match.tie;
    return true;
  });
  
  const displayedMatches = showAll ? filteredMatches : filteredMatches.slice(0, 15);

  return (
    <div className="space-y-4">
      {matches.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm mb-1">No match history available</p>
          <p className="text-xs text-gray-400">Your match history will appear here as you play</p>
        </div>
      ) : (
        <>
          {/* Filter buttons */}
          <div className="flex space-x-2 mb-4">
            {[
              { key: 'all', label: 'All', count: matches.length },
              { key: 'wins', label: 'Wins', count: matches.filter(m => m.won).length },
              { key: 'losses', label: 'Losses', count: matches.filter(m => !m.won && !m.tie).length },
              { key: 'draws', label: 'Draws', count: matches.filter(m => m.tie).length }
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  filter === key
                    ? 'bg-[#5D1F1F] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>
          
          <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
            {displayedMatches.map((match, index) => (
              <div key={index} className={`border rounded-lg p-3 transition-all duration-200 hover:shadow-md ${
                match.tie ? 'border-gray-200 bg-gray-50/30' :
                match.won ? 'border-green-200 bg-green-50/30' : 'border-red-200 bg-red-50/30'
              }`}>
                <div className="flex justify-between items-center">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <div className={`px-2 py-1 text-xs font-bold rounded ${
                        match.tie ? 'bg-gray-500 text-white' :
                        match.won ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                      }`}>
                        {match.tie ? 'D' : match.won ? 'W' : 'L'}
                      </div>
                      <span className="text-xs text-gray-600">
                        {new Date(match.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric'
                        })}
                      </span>
                      {match.seasonName && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {match.seasonName}
                        </span>
                      )}
                    </div>
                    
                    <div className="text-sm">
                      <div className="flex items-center space-x-1 text-gray-700">
                        {match.partnerName && (
                          <>
                            <span>with</span>
                            <span className="font-medium">{match.partnerName}</span>
                            <span>•</span>
                          </>
                        )}
                        <span>vs</span>
                        <span className="font-medium">
                          {match.opponentNames?.length > 0 ? 
                            match.opponentNames.join(' & ') : 
                            'Unknown opponents'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right ml-3">
                    <div className={`text-lg font-bold ${
                      match.tie ? 'text-gray-600' :
                      match.won ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {match.score}
                    </div>
                    {match.eloImpact && (
                      <div className={`text-xs font-bold ${
                        match.eloImpact.change > 0 ? 'text-green-600' :
                        match.eloImpact.change < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {match.eloImpact.change > 0 ? '+' : ''}{match.eloImpact.change}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {filteredMatches.length > 15 && (
            <div className="text-center pt-3 border-t border-gray-100">
              <button 
                onClick={() => setShowAll(!showAll)}
                className="text-sm text-[#5D1F1F] hover:text-red-800 font-medium transition-colors"
              >
                {showAll ? `Show less ↑` : `View all ${filteredMatches.length} ${filter} matches ↓`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const MatchHistory = ({ matches, allUsers }) => {
  const [showAll, setShowAll] = useState(false);
  const displayedMatches = showAll ? matches : matches.slice(0, 20);

  return (
    <div className="space-y-3">
      {matches.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm mb-1">No match history available</p>
          <p className="text-xs text-gray-400">Your match history will appear here as you play</p>
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
          {displayedMatches.map((match, index) => (
          <div key={index} className={`border rounded-lg p-4 transition-all duration-200 hover:shadow-md ${
            match.tie ? 'border-gray-200 bg-gray-50/30' :
            match.won ? 'border-green-200 bg-green-50/30' : 'border-red-200 bg-red-50/30'
          }`}>
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-2">
                  <div className={`px-3 py-1 text-xs font-bold rounded-full ${
                    match.tie ? 'bg-gray-500 text-white' :
                    match.won ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                  }`}>
                    {match.tie ? 'DRAW' : match.won ? 'WIN' : 'LOSS'}
                  </div>
                  <span className="text-sm text-gray-600">
                    {new Date(match.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: '2-digit' 
                    })}
                  </span>
                  {match.seasonName && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {match.seasonName}
                    </span>
                  )}
                  {match.eloImpact && (
                    <span className={`text-xs font-bold px-2 py-1 rounded ${
                      match.eloImpact.change > 0 
                        ? 'bg-green-100 text-green-800' 
                        : match.eloImpact.change < 0 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-gray-100 text-gray-800'
                    }`}>
                      ELO {match.eloImpact.change > 0 ? '+' : ''}{match.eloImpact.change}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <Users className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-600">with</span>
                    <span className="font-medium text-gray-900">
                      {match.partnerName || 'Unknown'}
                    </span>
                  </div>
                  
                  <div className="flex items-start space-x-1">
                    <Target className="w-3 h-3 text-gray-400 mt-0.5" />
                    <div>
                      <span className="text-gray-600 text-sm">vs</span>
                      <div className="font-medium text-gray-900">
                        {match.opponentNames?.length > 0 ? (
                          match.opponentNames.map((name, idx) => (
                            <div key={idx} className="text-sm leading-tight">
                              {name || 'Unknown'}
                            </div>
                          ))
                        ) : (
                          <div className="text-sm">Unknown opponents</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-right ml-4">
                <div className={`text-xl font-bold ${
                  match.tie ? 'text-gray-600' :
                  match.won ? 'text-green-600' : 'text-red-600'
                }`}>
                  {match.score}
                </div>
                {match.eloImpact && (
                  <div className={`text-sm font-bold ${
                    match.eloImpact.change > 0 ? 'text-green-600' :
                    match.eloImpact.change < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {match.eloImpact.change > 0 ? '+' : ''}{match.eloImpact.change}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {matches.length > 20 && (
          <div className="text-center pt-4 border-t border-gray-100">
            <button 
              onClick={() => setShowAll(!showAll)}
              className="text-sm text-[#5D1F1F] hover:text-red-800 font-medium transition-colors"
            >
              {showAll ? `Show less ↑` : `View all ${matches.length} matches ↓`}
            </button>
          </div>
        )}
      </div>
    )}
    </div>
  );
};

const HeadToHeadSection = ({ records, allUsers }) => {
  const [showAll, setShowAll] = useState(false);
  const displayedRecords = showAll ? records : records.slice(0, 5);
  
  if (records.length === 0) {
    return (
      <div className="text-center py-8">
        <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm mb-1">No head-to-head data available</p>
        <p className="text-xs text-gray-400">Face opponents multiple times to see detailed records</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {displayedRecords.map((record, index) => {
        const totalMatches = record.wins + record.losses + (record.draws || 0);
        const decisiveMatches = record.wins + record.losses;
        const matchWinRate = decisiveMatches > 0 ? Math.round((record.wins / decisiveMatches) * 100) : 0;
        
        // Use game-based win rate for the percentage bar (like nemesis analysis)
        const gameWinRate = record.totalGames > 0 ? Math.round((record.gamesWon / record.totalGames) * 100) : 0;
        
        return (
          <div key={index} className="group hover:bg-gray-50 rounded-lg p-3 transition-colors">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  gameWinRate >= 60 ? 'bg-green-100 text-green-600' :
                  gameWinRate >= 40 ? 'bg-yellow-100 text-yellow-600' :
                  'bg-red-100 text-red-600'
                }`}>
                  {gameWinRate >= 60 ? '💪' : gameWinRate >= 40 ? '⚖️' : '🔥'}
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {record.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {totalMatches} matches played
                    {record.draws > 0 && ` (${record.draws} draws)`}
                  </div>
                </div>
              </div>
              
              <div className="text-right min-w-0 flex-shrink-0">
                <div className="mb-2">
                  <div className="text-sm font-semibold text-gray-900">
                    {record.wins}W - {record.losses}L{record.draws > 0 ? ` - ${record.draws}D` : ''}
                  </div>
                  <div className="text-xs text-gray-500">
                    {record.gamesWon}G - {record.gamesLost}G ({record.totalGames} total)
                  </div>
                </div>
                <div className="flex items-center justify-end space-x-2 mb-1">
                  <span className="text-xs text-gray-600">Game win rate:</span>
                  <span className={`text-sm font-bold ${
                    gameWinRate >= 60 ? 'text-green-600' :
                    gameWinRate >= 40 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {gameWinRate}%
                  </span>
                </div>
                <div className="w-20 bg-gray-200 rounded-full h-1.5 ml-auto">
                  <div 
                    className={`h-1.5 rounded-full transition-all duration-700 ${
                      gameWinRate >= 60 ? 'bg-green-500' :
                      gameWinRate >= 40 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${gameWinRate}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
      
      {records.length > 5 && (
        <div className="text-center pt-2 border-t border-gray-100">
          <button 
            onClick={() => setShowAll(!showAll)}
            className="text-sm text-[#5D1F1F] hover:text-red-800 font-medium transition-colors"
          >
            {showAll ? `Show less ↑` : `View all ${records.length} opponents ↓`}
          </button>
        </div>
      )}
    </div>
  );
};

// Stats Detail Modal Component
const StatsDetailModal = ({ type, stats, winStreaks, matchHistory, eloData, allUsers, onClose }) => {
  const getModalContent = () => {
    switch (type) {
      case 'matches':
        const recentWins = matchHistory.filter(m => m.won).slice(0, 5);
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Match Wins</h3>
            <div className="grid gap-3">
              {recentWins.map((match, index) => (
                <div key={index} className="border border-green-200 bg-green-50 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-gray-900">{match.score}</div>
                      <div className="text-sm text-gray-600">
                        with {match.partnerName} vs {match.opponentNames?.join(' & ')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(match.date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded">
                      WIN
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm font-medium text-blue-900 mb-2">Match Statistics</div>
              <div className="text-xs text-blue-700 space-y-1">
                <div>Total Matches: {stats.totalMatches || 0}</div>
                <div>Wins: {stats.matchesWon || 0}</div>
                <div>Draws: {stats.matchesDrawn || 0}</div>
                <div>Losses: {stats.matchesLost || 0}</div>
                <div>Win Rate: {Math.round(((stats.matchesWon || 0) / Math.max(stats.totalMatches || 1, 1)) * 100)}%</div>
              </div>
            </div>
          </div>
        );
      
      case 'matchWinRate':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Match Win Rate Analysis</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">{stats.matchesWon || 0}</div>
                <div className="text-sm text-green-700">Wins</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-2xl font-bold text-red-600">{stats.matchesLost || 0}</div>
                <div className="text-sm text-red-700">Losses</div>
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-600">{stats.matchesDrawn || 0}</div>
              <div className="text-sm text-gray-700">Draws</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm font-medium text-blue-900 mb-2">Performance Breakdown</div>
              <div className="text-xs text-blue-700">
                Total matches played: {stats.totalMatches || 0}<br/>
                Win rate (including draws): {Math.round(((stats.matchesWon || 0) / Math.max(stats.totalMatches || 1, 1)) * 100)}%<br/>
                Win rate (excluding draws): {Math.round(((stats.matchesWon || 0) / Math.max((stats.matchesWon || 0) + (stats.matchesLost || 0), 1)) * 100)}%
              </div>
            </div>
          </div>
        );
      
      case 'combinedElo':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">ELO Rating History</h3>
            <div className="text-center p-8 rounded-lg bg-purple-50 border border-purple-200">
              <div className="text-6xl font-bold text-purple-600 mb-2">
                {Math.round(eloData.currentRating || 0)}
              </div>
              <div className="text-lg text-purple-700">Current ELO Rating</div>
              {eloData.rankingPosition && (
                <div className="text-sm text-purple-600 mt-2">
                  #{eloData.rankingPosition} in season
                </div>
              )}
            </div>
            
            {/* Recent matches with ELO changes */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              <h4 className="font-medium text-gray-900">Recent ELO Changes</h4>
              {eloData.recentChanges.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No recent ELO changes available
                </div>
              ) : (
                eloData.recentChanges.map((change, index) => {
                  // Find matching match from matchHistory for player names
                  const matchInfo = matchHistory.find(m => m.eloImpact?.change === change.change && 
                    Math.abs(new Date(m.date) - new Date(change.date)) < 24 * 60 * 60 * 1000);
                  
                  return (
                    <div key={change.id} className={`border rounded-lg p-3 ${
                      change.change > 0 ? 'border-green-200 bg-green-50' :
                      change.change < 0 ? 'border-red-200 bg-red-50' :
                      'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className={`text-lg font-bold ${
                              change.change > 0 ? 'text-green-600' :
                              change.change < 0 ? 'text-red-600' :
                              'text-gray-600'
                            }`}>
                              {change.change > 0 ? '+' : ''}{change.change}
                            </span>
                            <span className="text-sm text-gray-600">
                              {change.oldRating} → {change.newRating}
                            </span>
                          </div>
                          {matchInfo && (
                            <div className="text-sm text-gray-600">
                              vs {matchInfo.opponentNames?.join(' & ') || 'Unknown'}
                              {matchInfo.partnerName && ` (with ${matchInfo.partnerName})`}
                            </div>
                          )}
                          {change.score && (
                            <div className="text-sm text-gray-600">
                              Score: {change.score}
                            </div>
                          )}
                          <div className="text-xs text-gray-500">
                            {new Date(change.date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
        
      case 'combinedMatch':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Match Performance Details</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-green-600">{stats.matchesWon || 0}</div>
                <div className="text-sm text-green-700">Wins</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-red-600">{stats.matchesLost || 0}</div>
                <div className="text-sm text-red-700">Losses</div>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-gray-600">{stats.matchesDrawn || 0}</div>
                <div className="text-sm text-gray-700">Draws</div>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm font-medium text-blue-900 mb-2">Performance Analysis</div>
              <div className="text-xs text-blue-700 space-y-1">
                <div>Total matches played: {stats.totalMatches || 0}</div>
                <div>Win rate (including draws): {Math.round(((stats.matchesWon || 0) / Math.max(stats.totalMatches || 1, 1)) * 100)}%</div>
                <div>Win rate (excluding draws): {Math.round(((stats.matchesWon || 0) / Math.max((stats.matchesWon || 0) + (stats.matchesLost || 0), 1)) * 100)}%</div>
              </div>
            </div>
          </div>
        );
        
      case 'combinedGame':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Game Performance Details</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-blue-600">{stats.gamesWon || 0}</div>
                <div className="text-sm text-blue-700">Games Won</div>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-gray-600">{(stats.totalGames || 0) - (stats.gamesWon || 0)}</div>
                <div className="text-sm text-gray-700">Games Lost</div>
              </div>
            </div>
            
            <div className="text-center p-6 rounded-lg bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-200">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {Math.round((stats.gameWinRate || 0) * 100)}%
              </div>
              <div className="text-lg text-blue-700">Overall Game Win Rate</div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm font-medium text-blue-900 mb-2">Game Statistics</div>
              <div className="text-xs text-blue-700 space-y-1">
                <div>Total games played: {stats.totalGames || 0}</div>
                <div>Games won: {stats.gamesWon || 0}</div>
                <div>Games lost: {(stats.totalGames || 0) - (stats.gamesWon || 0)}</div>
                <div>Average games per match: {stats.totalMatches > 0 ? Math.round((stats.totalGames || 0) / stats.totalMatches) : 0}</div>
              </div>
            </div>
          </div>
        );
        
      case 'combinedStreak':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Streak Analysis</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className={`text-center p-6 rounded-lg border ${
                winStreaks.currentType === 'win' ? 'bg-green-50 border-green-200' : 
                winStreaks.currentType === 'loss' ? 'bg-red-50 border-red-200' : 
                'bg-gray-50 border-gray-200'
              }`}>
                <div className={`text-4xl font-bold mb-2 ${
                  winStreaks.currentType === 'win' ? 'text-green-600' : 
                  winStreaks.currentType === 'loss' ? 'text-red-600' : 
                  'text-gray-600'
                }`}>
                  {winStreaks.current || 0}
                </div>
                <div className={`text-lg ${
                  winStreaks.currentType === 'win' ? 'text-green-700' : 
                  winStreaks.currentType === 'loss' ? 'text-red-700' : 
                  'text-gray-700'
                }`}>
                  Current {winStreaks.currentType === 'win' ? 'winning' : winStreaks.currentType === 'loss' ? 'losing' : ''} streak
                </div>
              </div>
              
              <div className="text-center p-6 rounded-lg bg-orange-50 border border-orange-200">
                <div className="text-4xl font-bold text-orange-600 mb-2">
                  {winStreaks.longest || 0}
                </div>
                <div className="text-lg text-orange-700">
                  Best winning streak
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm font-medium text-blue-900 mb-2">Streak Progress</div>
              <div className="text-xs text-blue-700">
                {winStreaks.currentType === 'win' && winStreaks.current === winStreaks.longest && winStreaks.current > 0 ? 
                  'You\'re currently on your best winning streak!' : 
                  winStreaks.currentType === 'win' ? 
                    `${Math.max((winStreaks.longest || 0) - (winStreaks.current || 0), 0)} wins away from your best streak` :
                    `Your best winning streak was ${winStreaks.longest || 0} consecutive wins`}
              </div>
            </div>
          </div>
        );
        
      case 'currentStreak':
      case 'bestStreak':
        const isCurrentStreak = type === 'currentStreak';
        const streakValue = isCurrentStreak ? winStreaks.current : winStreaks.longest;
        const streakType = isCurrentStreak ? winStreaks.currentType : 'win';
        
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {isCurrentStreak ? 'Current Streak' : 'Best Winning Streak'}
            </h3>
            <div className={`text-center p-8 rounded-lg ${
              streakType === 'win' ? 'bg-green-50 border border-green-200' : 
              streakType === 'loss' ? 'bg-red-50 border border-red-200' : 
              'bg-gray-50 border border-gray-200'
            }`}>
              <div className={`text-6xl font-bold mb-2 ${
                streakType === 'win' ? 'text-green-600' : 
                streakType === 'loss' ? 'text-red-600' : 
                'text-gray-600'
              }`}>
                {streakValue || 0}
              </div>
              <div className={`text-lg ${
                streakType === 'win' ? 'text-green-700' : 
                streakType === 'loss' ? 'text-red-700' : 
                'text-gray-700'
              }`}>
                {isCurrentStreak 
                  ? `Current ${streakType === 'win' ? 'winning' : streakType === 'loss' ? 'losing' : ''} streak`
                  : 'Best winning streak'
                }
              </div>
            </div>
            {isCurrentStreak && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm font-medium text-blue-900 mb-2">Streak History</div>
                <div className="text-xs text-blue-700">
                  Current streak: {winStreaks.current || 0} {winStreaks.currentType === 'win' ? 'wins' : 'losses'}<br/>
                  Best winning streak: {winStreaks.longest || 0} consecutive wins
                </div>
              </div>
            )}
          </div>
        );

      case 'eloRating':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">ELO Rating Details</h3>
            <div className="text-center p-8 rounded-lg bg-purple-50 border border-purple-200">
              <div className="text-6xl font-bold text-purple-600 mb-2">
                {Math.round(eloData.currentRating || 0)}
              </div>
              <div className="text-lg text-purple-700">Current ELO Rating</div>
              {eloData.rankingPosition && (
                <div className="text-sm text-purple-600 mt-2">
                  #{eloData.rankingPosition} in season
                </div>
              )}
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm font-medium text-blue-900 mb-2">About ELO Rating</div>
              <div className="text-xs text-blue-700">
                ELO is a skill-based rating system that adjusts based on match results and opponent strength. 
                Higher ratings indicate stronger players. The system accounts for the skill level of your opponents 
                when calculating rating changes.
              </div>
            </div>
          </div>
        );

      case 'eloHistory':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent ELO Changes</h3>
            {eloData.recentChanges.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No recent ELO changes available
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {eloData.recentChanges.map((change, index) => (
                  <div key={change.id} className={`border rounded-lg p-3 ${
                    change.change > 0 ? 'border-green-200 bg-green-50' :
                    change.change < 0 ? 'border-red-200 bg-red-50' :
                    'border-gray-200 bg-gray-50'
                  }`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-lg font-bold ${
                            change.change > 0 ? 'text-green-600' :
                            change.change < 0 ? 'text-red-600' :
                            'text-gray-600'
                          }`}>
                            {change.change > 0 ? '+' : ''}{change.change}
                          </span>
                          <span className="text-sm text-gray-600">
                            {change.oldRating} → {change.newRating}
                          </span>
                        </div>
                        {change.score && (
                          <div className="text-sm text-gray-600 mt-1">
                            Match result: {change.score}
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          {new Date(change.date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm font-medium text-blue-900 mb-2">ELO Change History</div>
              <div className="text-xs text-blue-700">
                Showing your last {eloData.recentChanges.length} ELO rating changes. 
                Positive changes indicate rating gains, negative changes indicate rating losses.
              </div>
            </div>
          </div>
        );

      default:
        return <div>Details not available</div>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Statistics Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6">
          {getModalContent()}
        </div>
      </div>
    </div>
  );
};

// Match Detail Modal Component
const MatchDetailModal = ({ match, allUsers, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-lg">
          <h2 className="text-xl font-semibold text-gray-900">Match Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {/* Match Result */}
          <div className={`text-center p-6 rounded-lg ${
            match.tie ? 'bg-gray-50 border border-gray-200' :
            match.won ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <div className={`text-3xl font-bold mb-2 ${
              match.tie ? 'text-gray-600' :
              match.won ? 'text-green-600' : 'text-red-600'
            }`}>
              {match.score}
            </div>
            <div className={`px-3 py-1 text-sm font-bold rounded-full inline-block ${
              match.tie ? 'bg-gray-500 text-white' :
              match.won ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}>
              {match.tie ? 'DRAW' : match.won ? 'WIN' : 'LOSS'}
            </div>
            {match.eloImpact && (
              <div className={`mt-2 text-lg font-bold ${
                match.eloImpact.change > 0 ? 'text-green-600' :
                match.eloImpact.change < 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
                ELO {match.eloImpact.change > 0 ? '+' : ''}{match.eloImpact.change}
              </div>
            )}
          </div>

          {/* Match Info */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-sm">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">Date:</span>
              <span className="font-medium">
                {new Date(match.date).toLocaleDateString('en-US', { 
                  weekday: 'short',
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </span>
            </div>

            <div className="flex items-center space-x-2 text-sm">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">Partner:</span>
              <span className="font-medium">{match.partnerName || 'Unknown'}</span>
            </div>

            <div className="flex items-start space-x-2 text-sm">
              <Target className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <span className="text-gray-600">Opponents:</span>
                <div className="font-medium">
                  {match.opponentNames?.length > 0 ? (
                    match.opponentNames.map((name, idx) => (
                      <div key={idx} className="leading-tight">
                        {name || 'Unknown'}
                      </div>
                    ))
                  ) : (
                    <div>Unknown opponents</div>
                  )}
                </div>
              </div>
            </div>

            {match.courtNumber && (
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-4 h-4 bg-gray-400 rounded-sm"></div>
                <span className="text-gray-600">Court:</span>
                <span className="font-medium">Court {match.courtNumber}</span>
              </div>
            )}

            {match.seasonName && (
              <div className="flex items-center space-x-2 text-sm">
                <Trophy className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Season:</span>
                <span className="font-medium">{match.seasonName}</span>
              </div>
            )}

            {match.isLeagueMatch && match.opponentClub && (
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-4 h-4 bg-blue-400 rounded-sm"></div>
                <span className="text-gray-600">League Match vs:</span>
                <span className="font-medium">{match.opponentClub}</span>
              </div>
            )}
          </div>

          {/* Performance Details */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-sm font-medium text-blue-900 mb-2">Performance</div>
            <div className="text-xs text-blue-700 space-y-1">
              <div>Your score: {match.playerScore} games</div>
              <div>Opponents' score: {match.opponentScore} games</div>
              <div>Total games: {match.playerScore + match.opponentScore}</div>
              {match.playerScore + match.opponentScore > 0 && (
                <div>Your game win rate: {Math.round((match.playerScore / (match.playerScore + match.opponentScore)) * 100)}%</div>
              )}
              {match.eloImpact && (
                <>
                  <div>ELO before: {match.eloImpact.oldRating}</div>
                  <div>ELO after: {match.eloImpact.newRating}</div>
                  <div>ELO change: {match.eloImpact.change > 0 ? '+' : ''}{match.eloImpact.change}</div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileTab;