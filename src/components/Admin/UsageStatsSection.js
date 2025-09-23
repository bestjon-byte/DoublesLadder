// src/components/Admin/UsageStatsSection.js - App Usage Analytics
import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Activity,
  TrendingUp,
  Calendar,
  BarChart3,
  Clock,
  Target,
  RefreshCw
} from 'lucide-react';
import { supabase } from '../../supabaseClient';

const UsageStatsSection = ({ currentSeason, selectedSeason }) => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    newUsersThisMonth: 0,
    totalMatches: 0,
    matchesThisMonth: 0,
    averageMatchesPerPlayer: 0,
    lastActivityDate: null,
    seasonStats: {},
    userEngagement: {
      daily: 0,
      weekly: 0,
      monthly: 0
    }
  });
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('30'); // 7, 30, 90 days

  const fetchUsageStats = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      const timeRangeDate = new Date(now - (parseInt(timeRange) * 24 * 60 * 60 * 1000));
      const monthAgo = new Date(now - (30 * 24 * 60 * 60 * 1000));
      const weekAgo = new Date(now - (7 * 24 * 60 * 60 * 1000));
      const dayAgo = new Date(now - (24 * 60 * 60 * 1000));

      // Get all users stats
      const { data: allUsers, error: usersError } = await supabase
        .from('profiles')
        .select('id, created_at, last_seen, status')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // Get match results for activity metrics
      const { data: matchResults, error: matchError } = await supabase
        .from('match_results')
        .select(`
          id,
          created_at,
          submitted_by,
          fixture:fixture_id(
            match:match_id(
              season_id,
              match_date
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (matchError) throw matchError;

      // Get season players for engagement
      const { data: seasonPlayers, error: seasonError } = await supabase
        .from('season_players')
        .select('player_id, season_id, matches_played, last_match_date')
        .eq('season_id', currentSeason?.id || selectedSeason?.id);

      if (seasonError) throw seasonError;

      // Calculate user stats
      const approvedUsers = allUsers.filter(u => u.status === 'approved');
      const newUsersThisMonth = approvedUsers.filter(u =>
        new Date(u.created_at) > monthAgo
      ).length;

      // Calculate activity stats
      const recentMatches = matchResults.filter(m =>
        new Date(m.created_at) > timeRangeDate
      );

      const matchesThisMonth = matchResults.filter(m =>
        new Date(m.created_at) > monthAgo
      ).length;

      // Calculate user engagement
      const recentlyActiveUsers = {
        daily: new Set(),
        weekly: new Set(),
        monthly: new Set()
      };

      // Track activity from match submissions
      matchResults.forEach(match => {
        const matchDate = new Date(match.created_at);
        if (matchDate > dayAgo) recentlyActiveUsers.daily.add(match.submitted_by);
        if (matchDate > weekAgo) recentlyActiveUsers.weekly.add(match.submitted_by);
        if (matchDate > monthAgo) recentlyActiveUsers.monthly.add(match.submitted_by);
      });

      // Track activity from last_seen (if available)
      allUsers.forEach(user => {
        if (user.last_seen) {
          const lastSeen = new Date(user.last_seen);
          if (lastSeen > dayAgo) recentlyActiveUsers.daily.add(user.id);
          if (lastSeen > weekAgo) recentlyActiveUsers.weekly.add(user.id);
          if (lastSeen > monthAgo) recentlyActiveUsers.monthly.add(user.id);
        }
      });

      // Calculate average matches per player
      const playersWithMatches = seasonPlayers.filter(p => p.matches_played > 0);
      const averageMatchesPerPlayer = playersWithMatches.length > 0
        ? (playersWithMatches.reduce((sum, p) => sum + p.matches_played, 0) / playersWithMatches.length).toFixed(1)
        : 0;

      // Get most recent activity
      const lastActivityDate = matchResults.length > 0
        ? new Date(matchResults[0].created_at)
        : null;

      // Calculate season-specific stats
      const seasonMatchResults = matchResults.filter(m =>
        m.fixture?.match?.season_id === (currentSeason?.id || selectedSeason?.id)
      );

      const seasonStats = {
        totalMatches: seasonMatchResults.length,
        activePlayers: seasonPlayers.filter(p => p.matches_played > 0).length,
        totalPlayers: seasonPlayers.length,
        averageMatchesPerPlayer: parseFloat(averageMatchesPerPlayer)
      };

      setStats({
        totalUsers: approvedUsers.length,
        activeUsers: recentlyActiveUsers.monthly.size,
        newUsersThisMonth,
        totalMatches: matchResults.length,
        matchesThisMonth,
        averageMatchesPerPlayer: parseFloat(averageMatchesPerPlayer),
        lastActivityDate,
        seasonStats,
        userEngagement: {
          daily: recentlyActiveUsers.daily.size,
          weekly: recentlyActiveUsers.weekly.size,
          monthly: recentlyActiveUsers.monthly.size
        }
      });

    } catch (error) {
      console.error('Error fetching usage stats:', error);
    } finally {
      setLoading(false);
    }
  }, [currentSeason?.id, selectedSeason?.id, timeRange]);

  useEffect(() => {
    fetchUsageStats();
  }, [fetchUsageStats]);

  const StatCard = ({ icon: Icon, title, value, subtitle, trend, color = "blue" }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg bg-${color}-50`}>
            <Icon className={`w-5 h-5 text-${color}-600`} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-500">{subtitle}</p>
            )}
          </div>
        </div>
        {trend && (
          <div className={`flex items-center space-x-1 text-${trend > 0 ? 'green' : 'red'}-600`}>
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">{trend > 0 ? '+' : ''}{trend}%</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Usage Analytics</h3>
          <p className="text-sm text-gray-600">
            App usage and engagement statistics
            {(currentSeason || selectedSeason) && ` for ${(currentSeason || selectedSeason).name}`}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <button
            onClick={fetchUsageStats}
            disabled={loading}
            className="flex items-center space-x-2 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Overall Stats */}
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-3">Overall Platform Stats</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Users}
            title="Total Users"
            value={stats.totalUsers}
            subtitle="Approved users"
            color="blue"
          />
          <StatCard
            icon={Activity}
            title="Active Users"
            value={stats.activeUsers}
            subtitle="Active this month"
            color="green"
          />
          <StatCard
            icon={TrendingUp}
            title="New Users"
            value={stats.newUsersThisMonth}
            subtitle="This month"
            color="purple"
          />
          <StatCard
            icon={Target}
            title="Total Matches"
            value={stats.totalMatches}
            subtitle="All time"
            color="orange"
          />
        </div>
      </div>

      {/* Engagement Stats */}
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-3">User Engagement</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            icon={Clock}
            title="Daily Active"
            value={stats.userEngagement.daily}
            subtitle="Last 24 hours"
            color="green"
          />
          <StatCard
            icon={Calendar}
            title="Weekly Active"
            value={stats.userEngagement.weekly}
            subtitle="Last 7 days"
            color="blue"
          />
          <StatCard
            icon={BarChart3}
            title="Monthly Active"
            value={stats.userEngagement.monthly}
            subtitle="Last 30 days"
            color="purple"
          />
        </div>
      </div>

      {/* Season Stats */}
      {(currentSeason || selectedSeason) && (
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-3">
            Current Season Stats ({(currentSeason || selectedSeason).name})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={Users}
              title="Season Players"
              value={stats.seasonStats.totalPlayers}
              subtitle={`${stats.seasonStats.activePlayers} active`}
              color="blue"
            />
            <StatCard
              icon={Target}
              title="Season Matches"
              value={stats.seasonStats.totalMatches}
              subtitle="Total played"
              color="green"
            />
            <StatCard
              icon={BarChart3}
              title="Avg Matches/Player"
              value={stats.seasonStats.averageMatchesPerPlayer}
              subtitle="Per active player"
              color="orange"
            />
            <StatCard
              icon={Activity}
              title="Recent Matches"
              value={stats.matchesThisMonth}
              subtitle="This month"
              color="purple"
            />
          </div>
        </div>
      )}

      {/* Last Activity */}
      {stats.lastActivityDate && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-600">
              Last Activity: {stats.lastActivityDate.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
            <span className="text-sm text-gray-600">Loading usage statistics...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsageStatsSection;