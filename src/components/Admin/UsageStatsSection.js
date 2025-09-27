// src/components/Admin/UsageStatsSection.js - User Login Analytics
import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Activity,
  TrendingUp,
  Calendar,
  BarChart3,
  Clock,
  LogIn,
  RefreshCw,
  UserCheck
} from 'lucide-react';
import { supabase } from '../../supabaseClient';

const UsageStatsSection = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalLogins: 0,
    uniqueLoginsToday: 0,
    uniqueLoginsWeek: 0,
    uniqueLoginsMonth: 0,
    newUsersThisMonth: 0,
    activeSessions: 0,
    mostActiveUsers: [],
    lastLoginTime: null,
    loginFrequency: {
      daily: 0,
      weekly: 0,
      monthly: 0
    },
    totalMatches: 0,
    totalSeasons: 0,
    activeSeasons: 0,
    pendingApprovals: 0
  });
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('30');

  const fetchUsageStats = useCallback(async () => {
    setLoading(true);
    try {
      // Get login analytics from auth.users table
      const { data: loginStats, error: loginStatsError } = await supabase.rpc('get_login_analytics');

      // If RPC doesn't exist, fall back to direct query
      let loginData = null;
      if (loginStatsError) {
        const { data, error } = await supabase
          .from('auth.users')
          .select('id, email, last_sign_in_at, created_at');

        if (!error && data) {
          const now = new Date();
          const dayAgo = new Date(now - 24 * 60 * 60 * 1000);
          const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
          const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

          loginData = {
            totalUsers: data.length,
            loginsToday: data.filter(u => u.last_sign_in_at && new Date(u.last_sign_in_at) > dayAgo).length,
            loginsWeek: data.filter(u => u.last_sign_in_at && new Date(u.last_sign_in_at) > weekAgo).length,
            loginsMonth: data.filter(u => u.last_sign_in_at && new Date(u.last_sign_in_at) > monthAgo).length,
            newUsersThisMonth: data.filter(u => new Date(u.created_at) > monthAgo).length,
            lastLoginTime: data.reduce((latest, user) => {
              if (!user.last_sign_in_at) return latest;
              const loginTime = new Date(user.last_sign_in_at);
              return !latest || loginTime > latest ? loginTime : latest;
            }, null)
          };
        }
      } else {
        loginData = loginStats[0];
      }

      // Get profiles for approval status
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, created_at, status, name, email')
        .order('created_at', { ascending: false });
      if (profilesError) throw profilesError;

      // Get platform activity data
      const { data: matchResults, error: matchResultsError } = await supabase
        .from('match_results')
        .select('id, created_at');
      if (matchResultsError) throw matchResultsError;

      const { data: seasons, error: seasonsError } = await supabase
        .from('seasons')
        .select('id, name, status');
      if (seasonsError) throw seasonsError;

      // Calculate stats
      const approvedUsers = profiles.filter(u => u.status === 'approved');
      const pendingUsers = profiles.filter(u => u.status === 'pending');
      const totalMatches = matchResults.length;
      const activeSeasons = seasons.filter(s => s.status === 'active').length;

      setStats({
        totalUsers: approvedUsers.length,
        totalLogins: loginData?.totalUsers || 0,
        uniqueLoginsToday: loginData?.loginsToday || 0,
        uniqueLoginsWeek: loginData?.loginsWeek || 0,
        uniqueLoginsMonth: loginData?.loginsMonth || 0,
        newUsersThisMonth: loginData?.newUsersThisMonth || 0,
        activeSessions: 'N/A', // Sessions require special permissions
        mostActiveUsers: [], // Would need complex query with match data
        lastLoginTime: loginData?.lastLoginTime || null,
        loginFrequency: {
          daily: loginData?.loginsToday || 0,
          weekly: loginData?.loginsWeek || 0,
          monthly: loginData?.loginsMonth || 0
        },
        // Platform stats
        totalMatches,
        totalSeasons: seasons.length,
        activeSeasons,
        pendingApprovals: pendingUsers.length
      });

    } catch (error) {
      console.error('Error fetching login stats:', error);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

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
          <h3 className="text-lg font-semibold text-gray-900">User Login Analytics</h3>
          <p className="text-sm text-gray-600">
            Track user login activity and platform engagement
          </p>
        </div>
        <div className="flex items-center space-x-3">
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

      {/* Login Overview Stats */}
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-3">Login Overview</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Users}
            title="Total Users"
            value={stats.totalUsers}
            subtitle="Approved users"
            color="blue"
          />
          <StatCard
            icon={LogIn}
            title="All Auth Users"
            value={stats.totalLogins}
            subtitle="Including pending"
            color="green"
          />
          <StatCard
            icon={Activity}
            title="Total Matches"
            value={stats.totalMatches}
            subtitle="Platform activity"
            color="orange"
          />
          <StatCard
            icon={TrendingUp}
            title="New Users"
            value={stats.newUsersThisMonth}
            subtitle="This month"
            color="purple"
          />
        </div>
      </div>

      {/* Recent Login Activity */}
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-3">Recent Login Activity</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            icon={Clock}
            title="Today"
            value={stats.uniqueLoginsToday}
            subtitle="Users logged in today"
            color="green"
          />
          <StatCard
            icon={Calendar}
            title="This Week"
            value={stats.uniqueLoginsWeek}
            subtitle="Users logged in (7 days)"
            color="blue"
          />
          <StatCard
            icon={BarChart3}
            title="This Month"
            value={stats.uniqueLoginsMonth}
            subtitle="Users logged in (30 days)"
            color="purple"
          />
        </div>
      </div>

      {/* Platform Activity */}
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-3">Platform Activity</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            icon={BarChart3}
            title="Active Seasons"
            value={stats.activeSeasons}
            subtitle="Currently running"
            color="green"
          />
          <StatCard
            icon={Calendar}
            title="Total Seasons"
            value={stats.totalSeasons}
            subtitle="All seasons created"
            color="blue"
          />
          <StatCard
            icon={UserCheck}
            title="Pending Approvals"
            value={stats.pendingApprovals}
            subtitle="Awaiting approval"
            color="orange"
          />
        </div>
      </div>

      {/* Last Login Time */}
      {stats.lastLoginTime && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-600">
              Most Recent Login: {stats.lastLoginTime.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Login Analytics Note */}
      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-green-600" />
          <div>
            <p className="text-sm font-medium text-green-800">Login Analytics Active</p>
            <p className="text-sm text-green-700">
              Showing real-time login activity from auth.users table. Session tracking requires additional permissions.
            </p>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
            <span className="text-sm text-gray-600">Loading login statistics...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsageStatsSection;