import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import {
  Users,
  Shield,
  Trash2,
  UserCheck,
  UserX,
  Search,
  ChevronDown,
  Loader2,
  AlertTriangle,
  Check,
  Radio,
  RefreshCw
} from 'lucide-react';

interface UserProfile {
  id: string;
  full_name: string;
  bio: string;
  church_name: string;
  country: string;
  avatar_url: string;
  role: string;
  is_active: boolean;
  preferred_language: string;
  created_at: string;
  last_login: string;
  email?: string;
}

type AdminTab = 'users' | 'sessions' | 'analytics';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    adminCount: 0,
    activeSessions: 0,
  });

  useEffect(() => {
    fetchUsers();
    fetchSessions();
    fetchStats();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      showMessage('error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setSessions(data || []);
    } catch (err) {
      console.error('Error fetching sessions:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const [usersRes, sessionsRes] = await Promise.all([
        supabase.from('profiles').select('role, is_active', { count: 'exact' }),
        supabase.from('sessions').select('is_active', { count: 'exact' }).eq('is_active', true),
      ]);

      const profiles = usersRes.data || [];
      setStats({
        totalUsers: usersRes.count || 0,
        activeUsers: profiles.filter(p => p.is_active).length,
        adminCount: profiles.filter(p => p.role === 'admin').length,
        activeSessions: sessionsRes.count || 0,
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const changeRole = async (userId: string, newRole: string) => {
    setActionLoading(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      showMessage('success', `Role updated to ${newRole}`);
    } catch (err) {
      showMessage('error', 'Failed to update role');
    } finally {
      setActionLoading(null);
    }
  };

  const toggleActive = async (userId: string, currentStatus: boolean) => {
    setActionLoading(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: !currentStatus } : u));
      showMessage('success', `Account ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchStats();
    } catch (err) {
      showMessage('error', 'Failed to update account status');
    } finally {
      setActionLoading(null);
    }
  };

  const deleteUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => prev.filter(u => u.id !== userId));
      setConfirmDelete(null);
      showMessage('success', 'User deleted');
      fetchStats();
    } catch (err) {
      showMessage('error', 'Failed to delete user');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter(u => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.church_name || '').toLowerCase().includes(q) ||
      (u.country || '').toLowerCase().includes(q)
    );
  });

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-amber-500" />
            Admin Panel
          </h2>
          <p className="text-slate-500 text-sm mt-1">Manage users, sessions and analytics</p>
        </div>
        <button
          onClick={() => { fetchUsers(); fetchSessions(); fetchStats(); }}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Active', value: stats.activeUsers, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Admins', value: stats.adminCount, icon: Shield, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Live Sessions', value: stats.activeSessions, icon: Radio, color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {(['users', 'sessions', 'analytics'] as AdminTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
              activeTab === tab
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Message */}
      {message && (
        <div className={`flex items-center gap-3 p-3 rounded-xl border text-sm ${
          message.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {message.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {/* Search */}
          <div className="p-4 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, church, or country..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
              <Users className="w-10 h-10 mb-2" />
              <p>No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-4 py-3">User</th>
                    <th className="text-left px-4 py-3 hidden sm:table-cell">Church</th>
                    <th className="text-left px-4 py-3 hidden md:table-cell">Joined</th>
                    <th className="text-left px-4 py-3">Role</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-right px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map(userItem => (
                    <tr key={userItem.id} className={`hover:bg-slate-50 transition-colors ${!userItem.is_active ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0">
                            {userItem.avatar_url ? (
                              <img src={userItem.avatar_url} alt="" className="w-full h-full rounded-xl object-cover" />
                            ) : (
                              <span className="text-white text-xs font-bold">
                                {(userItem.full_name || 'U').charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900 leading-tight">
                              {userItem.full_name || 'Unknown'}
                            </p>
                            <p className="text-xs text-slate-400">{userItem.country || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <p className="text-sm text-slate-600">{userItem.church_name || '—'}</p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <p className="text-xs text-slate-500">{formatDate(userItem.created_at)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative">
                          <select
                            value={userItem.role}
                            onChange={(e) => changeRole(userItem.id, e.target.value)}
                            disabled={actionLoading === userItem.id}
                            className={`text-xs font-semibold px-2 py-1 rounded-lg border appearance-none cursor-pointer ${
                              userItem.role === 'admin'
                                ? 'bg-amber-50 border-amber-200 text-amber-700'
                                : 'bg-slate-50 border-slate-200 text-slate-600'
                            }`}
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleActive(userItem.id, userItem.is_active)}
                          disabled={actionLoading === userItem.id}
                          className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg transition-colors ${
                            userItem.is_active
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-red-50 text-red-600 hover:bg-red-100'
                          }`}
                        >
                          {actionLoading === userItem.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : userItem.is_active ? (
                            <UserCheck className="w-3 h-3" />
                          ) : (
                            <UserX className="w-3 h-3" />
                          )}
                          {userItem.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {confirmDelete === userItem.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs text-red-600 font-medium">Sure?</span>
                            <button
                              onClick={() => deleteUser(userItem.id)}
                              disabled={actionLoading === userItem.id}
                              className="text-xs bg-red-600 text-white px-2 py-1 rounded-lg hover:bg-red-700 font-medium"
                            >
                              Delete
                            </button>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1 rounded-lg"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDelete(userItem.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Sessions Tab */}
      {activeTab === 'sessions' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Recent Sessions</h3>
          </div>
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
              <Radio className="w-10 h-10 mb-2" />
              <p>No sessions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-4 py-3">Code</th>
                    <th className="text-left px-4 py-3">Created</th>
                    <th className="text-left px-4 py-3">Expires</th>
                    <th className="text-left px-4 py-3">Devices</th>
                    <th className="text-left px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sessions.map(session => (
                    <tr key={session.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-blue-600 tracking-widest text-sm">
                          {session.session_code}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{formatDate(session.created_at)}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{formatDate(session.expires_at)}</td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold text-slate-700">
                          {session.connected_devices_count ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg ${
                          session.is_active
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {session.is_active && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />}
                          {session.is_active ? 'Live' : 'Ended'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">User Distribution</h3>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-600">Regular Users</span>
                  <span className="text-sm font-semibold">{stats.totalUsers - stats.adminCount}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: stats.totalUsers > 0 ? `${((stats.totalUsers - stats.adminCount) / stats.totalUsers) * 100}%` : '0%' }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-600">Admins</span>
                  <span className="text-sm font-semibold">{stats.adminCount}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: stats.totalUsers > 0 ? `${(stats.adminCount / stats.totalUsers) * 100}%` : '0%' }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-600">Active Accounts</span>
                  <span className="text-sm font-semibold">{stats.activeUsers}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: stats.totalUsers > 0 ? `${(stats.activeUsers / stats.totalUsers) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Platform Overview</h3>
            <div className="space-y-4">
              {[
                { label: 'Total Users', value: stats.totalUsers },
                { label: 'Active Users', value: stats.activeUsers },
                { label: 'Admin Users', value: stats.adminCount },
                { label: 'Live Remote Sessions', value: stats.activeSessions },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <span className="text-sm text-slate-600">{label}</span>
                  <span className="text-sm font-bold text-slate-900">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
