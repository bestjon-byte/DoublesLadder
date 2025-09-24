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
    }
  });
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('30');

  const fetchUsageStats = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      const dayAgo = new Date(now - (24 * 60 * 60 * 1000));
      const weekAgo = new Date(now - (7 * 24 * 60 * 60 * 1000));
      const monthAgo = new Date(now - (30 * 24 * 60 * 60 * 1000));

      // Get all users from auth schema
      const { data: authUsers, error: authUsersError } = await supabase.auth.admin.listUsers();
      if (authUsersError) throw authUsersError;

      // Get all users from profiles (for approved status)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, created_at, status, name, email')
        .order('created_at', { ascending: false });
      if (profilesError) throw profilesError;

      // Get login audit logs (requires RLS policy adjustment or service role)
      let auditLogs = [];
      try {
        const { data: logs, error: logsError } = await supabase
          .from('auth.audit_log_entries')
          .select('*')
          .or("payload->>action.eq.login,payload->>action.eq.logout")
          .order('created_at', { ascending: false })
          .limit(1000);

        if (!logsError) auditLogs = logs;
      } catch (err) {
        console.warn('Cannot access auth audit logs (requires elevated permissions)');
      }

      // Get active sessions
      let activeSessions = [];
      try {
        const { data: sessions, error: sessionsError } = await supabase
          .from('auth.sessions')
          .select('*')
          .order('created_at', { ascending: false });

        if (!sessionsError) activeSessions = sessions;
      } catch (err) {
        console.warn('Cannot access auth sessions (requires elevated permissions)');
      }

      // Calculate basic user stats
      const approvedUsers = profiles.filter(u => u.status === 'approved');
      const newUsersThisMonth = approvedUsers.filter(u =>
        new Date(u.created_at) > monthAgo
      ).length;

      // Calculate login stats from audit logs
      const loginEvents = auditLogs.filter(log => log.payload?.action === 'login');
      const totalLogins = loginEvents.length;

      // Track unique logins by time period
      const uniqueLoginsByPeriod = {
        daily: new Set(),
        weekly: new Set(),
        monthly: new Set()
      };

      loginEvents.forEach(event => {
        const loginDate = new Date(event.created_at);
        const userId = event.payload?.user_id;

        if (loginDate > dayAgo) uniqueLoginsByPeriod.daily.add(userId);
        if (loginDate > weekAgo) uniqueLoginsByPeriod.weekly.add(userId);
        if (loginDate > monthAgo) uniqueLoginsByPeriod.monthly.add(userId);
      });

      // Calculate login frequency by counting logins per user
      const loginCounts = {};
      loginEvents.forEach(event => {
        const userId = event.payload?.user_id;
        if (userId) {
          loginCounts[userId] = (loginCounts[userId] || 0) + 1;
        }
      });

      // Get most active users
      const mostActiveUsers = Object.entries(loginCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([userId, count]) => {
          const profile = profiles.find(p => p.id === userId);
          return {
            id: userId,
            name: profile?.name || profile?.email || 'Unknown User',
            loginCount: count
          };
        });

      // Get last login time from auth users
      const lastLoginTimes = authUsers.users
        .map(u => u.last_sign_in_at)
        .filter(time => time)
        .sort((a, b) => new Date(b) - new Date(a));

      const lastLoginTime = lastLoginTimes.length > 0 ? new Date(lastLoginTimes[0]) : null;

      // Count active sessions
      const currentActiveSessions = activeSessions.filter(session => {
        // Consider session active if updated within last hour
        const sessionUpdate = new Date(session.updated_at || session.created_at);
        return sessionUpdate > new Date(now - (60 * 60 * 1000));
      }).length;

      setStats({
        totalUsers: approvedUsers.length,
        totalLogins,
        uniqueLoginsToday: uniqueLoginsByPeriod.daily.size,
        uniqueLoginsWeek: uniqueLoginsByPeriod.weekly.size,
        uniqueLoginsMonth: uniqueLoginsByPeriod.monthly.size,
        newUsersThisMonth,
        activeSessions: currentActiveSessions,
        mostActiveUsers,
        lastLoginTime,
        loginFrequency: {
          daily: uniqueLoginsByPeriod.daily.size,
          weekly: uniqueLoginsByPeriod.weekly.size,
          monthly: uniqueLoginsByPeriod.monthly.size
        }
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
            Track user login activity and engagement patterns
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
            title="Total Logins"
            value={stats.totalLogins}
            subtitle="All time"
            color="green"
          />
          <StatCard
            icon={UserCheck}
            title="Active Sessions"
            value={stats.activeSessions}
            subtitle="Currently active"
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

      {/* Unique Login Stats */}
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-3">Unique User Logins</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            icon={Clock}
            title="Today"
            value={stats.uniqueLoginsToday}
            subtitle="Unique logins today"
            color="green"
          />
          <StatCard
            icon={Calendar}
            title="This Week"
            value={stats.uniqueLoginsWeek}
            subtitle="Unique logins (7 days)"
            color="blue"
          />
          <StatCard
            icon={BarChart3}
            title="This Month"
            value={stats.uniqueLoginsMonth}
            subtitle="Unique logins (30 days)"
            color="purple"
          />
        </div>
      </div>

      {/* Most Active Users */}
      {stats.mostActiveUsers.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-3">Most Active Users</h4>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Logins
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.mostActiveUsers.map((user, index) => (
                  <tr key={user.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center`}>
                          <span className="text-sm font-medium text-blue-600">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium">{user.loginCount}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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