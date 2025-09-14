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

      {/* Enhanced Overview Stats Cards - Mobile First 2x3 Layout */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Match Performance Group */}
        <StatsCard
          icon={<Trophy className="w-6 h-6 text-yellow-600" />}
          title="Matches Won"
          value={`${overallStats.matchesWon || 0}/${overallStats.totalMatches || 0}`}
          subtitle={`${overallStats.matchesDrawn || 0} draws`}
          color="yellow"
          onClick={() => setSelectedStatDetail('matches')}
          detailType="matches"
        />
        <StatsCard
          icon={<Target className="w-6 h-6 text-green-600" />}
          title="Match Win Rate"
          value={`${Math.round(((overallStats.matchesWon || 0) / Math.max(overallStats.totalMatches || 1, 1)) * 100)}%`}
          subtitle="including draws"
          color="green"
          onClick={() => setSelectedStatDetail('matchWinRate')}
          detailType="matchWinRate"
        />
        
        {/* Game Performance Group */}
        <StatsCard
          icon={<Trophy className="w-6 h-6 text-blue-600" />}
          title="Games Won"
          value={overallStats.gamesWon || 0}
          subtitle={`of ${overallStats.totalGames || 0} total`}
          color="blue"
          onClick={() => setSelectedStatDetail('games')}
          detailType="games"
        />
        <StatsCard
          icon={<Target className="w-6 h-6 text-teal-600" />}
          title="Game Win Rate"
          value={`${Math.round((overallStats.gameWinRate || 0) * 100)}%`}
          subtitle="overall performance"
          color="teal"
          onClick={() => setSelectedStatDetail('gameWinRate')}
          detailType="gameWinRate"
        />
        
        {/* Streak Group */}
        <StatsCard
          icon={<Activity className="w-6 h-6 text-purple-600" />}
          title="Current Streak"
          value={winStreaks.current || 0}
          subtitle={winStreaks.currentType === 'win' ? 'wins' : winStreaks.currentType === 'loss' ? 'losses' : 'none'}
          color={winStreaks.currentType === 'win' ? 'green' : winStreaks.currentType === 'loss' ? 'red' : 'gray'}
          onClick={() => setSelectedStatDetail('currentStreak')}
          detailType="currentStreak"
        />
        <StatsCard
          icon={<Award className="w-6 h-6 text-orange-600" />}
          title="Best Streak"
          value={winStreaks.longest || 0}
          subtitle="consecutive wins"
          color="orange"
          onClick={() => setSelectedStatDetail('bestStreak')}
          detailType="bestStreak"
        />
      </div>

      {/* Stats Detail Modal */}
      {selectedStatDetail && (
        <StatsDetailModal 
          type={selectedStatDetail}
          stats={overallStats}
          winStreaks={winStreaks}
          matchHistory={matchHistory}
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
        <MatchHistory matches={matchHistory} allUsers={allUsers} />
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
              const aWinRate = a.wins / (a.wins + a.losses);
              const bWinRate = b.wins / (b.wins + b.losses);
              return bWinRate - aWinRate;
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

// Enhanced Interactive Stats Card Component  
const StatsCard = ({ icon, title, value, subtitle, color, onClick, detailType }) => {
  const colorClasses = {
    yellow: 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 hover:from-yellow-100 hover:to-yellow-200',
    green: 'bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:from-green-100 hover:to-green-200',
    blue: 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:from-blue-100 hover:to-blue-200',
    teal: 'bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200 hover:from-teal-100 hover:to-teal-200',
    purple: 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:from-purple-100 hover:to-purple-200',
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
                </div>
                
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <Users className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-600">with</span>
                    <span className="font-medium text-gray-900">
                      {match.partnerName || 'Unknown'}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Target className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-600">vs</span>
                    <span className="font-medium text-gray-900 truncate">
                      {match.opponentNames?.join(' & ') || 'Unknown opponents'}
                    </span>
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
                {match.courtNumber && (
                  <div className="text-xs text-gray-500">Court {match.courtNumber}</div>
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
        const winRate = decisiveMatches > 0 ? Math.round((record.wins / decisiveMatches) * 100) : 0;
        
        return (
          <div key={index} className="group hover:bg-gray-50 rounded-lg p-3 transition-colors">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  winRate >= 60 ? 'bg-green-100 text-green-600' :
                  winRate >= 40 ? 'bg-yellow-100 text-yellow-600' :
                  'bg-red-100 text-red-600'
                }`}>
                  {winRate >= 60 ? '💪' : winRate >= 40 ? '⚖️' : '🔥'}
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
              
              <div className="text-right">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm font-semibold text-gray-900">
                    {record.wins}W - {record.losses}L
                    {record.draws > 0 && ` - ${record.draws}D`}
                  </span>
                  <span className={`text-sm font-bold ${
                    winRate >= 60 ? 'text-green-600' :
                    winRate >= 40 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {winRate}%
                  </span>
                </div>
                <div className="w-20 bg-gray-200 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full transition-all duration-700 ${
                      winRate >= 60 ? 'bg-green-500' :
                      winRate >= 40 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${winRate}%` }}
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
const StatsDetailModal = ({ type, stats, winStreaks, matchHistory, allUsers, onClose }) => {
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

            <div className="flex items-center space-x-2 text-sm">
              <Target className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">Opponents:</span>
              <span className="font-medium">
                {match.opponentNames?.join(' & ') || 'Unknown opponents'}
              </span>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileTab;