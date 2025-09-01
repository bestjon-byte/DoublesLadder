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
  BarChart3
} from 'lucide-react';

const ProfileTab = ({ 
  currentUser, 
  seasons = [], 
  selectedSeason = null,
  allUsers = []
}) => {
  const [filterType, setFilterType] = useState('current'); // 'current', 'all-time', 'season'
  const [selectedSeasonId, setSelectedSeasonId] = useState(selectedSeason?.id);

  const profileStats = useProfileStats(
    currentUser?.id, 
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
      {/* Header with Season Filter */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{currentUser?.name}'s Profile</h1>
            <p className="text-gray-600 mt-1">Performance statistics and match history</p>
          </div>
          <div className="flex items-center space-x-3">
            <label className="text-sm font-medium text-gray-700">View:</label>
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
                  <option key={season.id} value={season.id}>{season.name}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={<Trophy className="w-6 h-6 text-yellow-600" />}
          title="Matches Won"
          value={overallStats.matchesWon || 0}
          subtitle={`of ${overallStats.totalMatches || 0} total`}
          color="yellow"
        />
        <StatsCard
          icon={<Target className="w-6 h-6 text-green-600" />}
          title="Win Rate"
          value={`${Math.round((overallStats.winRate || 0) * 100)}%`}
          subtitle="overall performance"
          color="green"
        />
        <StatsCard
          icon={<Activity className="w-6 h-6 text-blue-600" />}
          title="Current Streak"
          value={winStreaks.current || 0}
          subtitle={winStreaks.currentType === 'win' ? 'wins' : 'losses'}
          color={winStreaks.currentType === 'win' ? 'green' : 'red'}
        />
        <StatsCard
          icon={<Award className="w-6 h-6 text-purple-600" />}
          title="Best Streak"
          value={winStreaks.longest || 0}
          subtitle="consecutive wins"
          color="purple"
        />
      </div>

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
        <FormGuide matches={formGuide} allUsers={allUsers} />
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
          <HeadToHeadSection records={headToHeadRecords} allUsers={allUsers} />
        </div>
      )}
    </div>
  );
};

// Enhanced Stats Card Component
const StatsCard = ({ icon, title, value, subtitle, color }) => {
  const colorClasses = {
    yellow: 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 hover:from-yellow-100 hover:to-yellow-200',
    green: 'bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:from-green-100 hover:to-green-200',
    blue: 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:from-blue-100 hover:to-blue-200',
    purple: 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:from-purple-100 hover:to-purple-200',
    red: 'bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:from-red-100 hover:to-red-200'
  };

  const iconBackgrounds = {
    yellow: 'bg-yellow-100',
    green: 'bg-green-100',
    blue: 'bg-blue-100',
    purple: 'bg-purple-100',
    red: 'bg-red-100'
  };

  return (
    <div className={`rounded-lg border p-6 transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer ${colorClasses[color] || colorClasses.blue}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
          <p className="text-xs text-gray-500">{subtitle}</p>
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
                {season.wins}W - {season.matches - season.wins}L ({season.matches} total)
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const BestPartnersSection = ({ partners, allUsers }) => (
  <div className="space-y-3">
    {partners.length === 0 ? (
      <div className="text-center py-8">
        <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm mb-1">No partnership data available</p>
        <p className="text-xs text-gray-400">Play matches with different partners to see statistics</p>
      </div>
    ) : (
      <div className="space-y-3">
        {partners.slice(0, 5).map((partner, index) => {
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
                    <div className="text-xs text-gray-500">{partner.matches} matches together</div>
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
          <div className="text-center pt-2">
            <button className="text-sm text-[#5D1F1F] hover:text-red-800 font-medium">
              View all {partners.length} partners →
            </button>
          </div>
        )}
      </div>
    )}
  </div>
);

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
                    {nemesisOpponent.wins}W - {nemesisOpponent.losses}L
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
                    {nemesisPair.wins}W - {nemesisPair.losses}L
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

const FormGuide = ({ matches, allUsers }) => (
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
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm transition-all duration-300 hover:scale-110 ${
                match.won 
                  ? 'bg-green-500 text-white hover:bg-green-600' 
                  : 'bg-red-500 text-white hover:bg-red-600'
              }`}
              title={`${match.won ? 'Won' : 'Lost'} ${match.score} vs ${match.opponentNames?.join(' & ')}`}
            >
              {match.won ? 'W' : 'L'}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
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
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {matches.filter(m => !m.won).length}
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
            Last 10 matches: {Math.round((matches.filter(m => m.won).length / matches.length) * 100)}% win rate
          </div>
        </div>
      </>
    )}
  </div>
);

const MatchHistory = ({ matches, allUsers }) => (
  <div className="space-y-3">
    {matches.length === 0 ? (
      <div className="text-center py-8">
        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm mb-1">No match history available</p>
        <p className="text-xs text-gray-400">Your match history will appear here as you play</p>
      </div>
    ) : (
      <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
        {matches.slice(0, 20).map((match, index) => (
          <div key={index} className={`border rounded-lg p-4 transition-all duration-200 hover:shadow-md ${
            match.won ? 'border-green-200 bg-green-50/30' : 'border-red-200 bg-red-50/30'
          }`}>
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-2">
                  <div className={`px-3 py-1 text-xs font-bold rounded-full ${
                    match.won ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                  }`}>
                    {match.won ? 'WIN' : 'LOSS'}
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
          <div className="text-center pt-4">
            <button className="text-sm text-[#5D1F1F] hover:text-red-800 font-medium">
              View all {matches.length} matches →
            </button>
          </div>
        )}
      </div>
    )}
  </div>
);

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
        const totalMatches = record.wins + record.losses;
        const winRate = Math.round((record.wins / totalMatches) * 100);
        
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
                  <div className="text-xs text-gray-500">{totalMatches} matches played</div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm font-semibold text-gray-900">
                    {record.wins}W - {record.losses}L
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

export default ProfileTab;