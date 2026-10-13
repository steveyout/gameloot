import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Filter, Coins, Award, Shield, Eye, CheckCircle2, AlertTriangle, Ban } from 'lucide-react';
import { getUsers, updateUserStatus } from '../services/api';
import UserDetailModal from '../components/UserDetailModal';

export default function UsersView() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await getUsers({ search, status: statusFilter });
      if (res.success) setUsers(res.users);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, statusFilter]);

  const handleQuickStatus = async (e, id, currentStatus) => {
    e.stopPropagation();
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await updateUserStatus(id, nextStatus);
      fetchUsers();
    } catch (err) {
      alert('Failed: ' + err.message);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by player username or email..."
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none focus:border-cyan-500 shrink-0"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="banned">Banned</option>
          </select>
        </div>

        <div className="text-xs text-slate-400 font-medium">
          Total: <span className="text-white font-bold">{users.length}</span> registered players
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-card rounded-2xl border border-slate-800/80 bg-slate-900/60 overflow-hidden shadow-md">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">Fetching player database...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No player accounts matched criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="p-3.5">Player</th>
                  <th className="p-3.5">Points Balance</th>
                  <th className="p-3.5">Total Earned</th>
                  <th className="p-3.5">Withdrawn</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Registered</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((u) => (
                  <tr 
                    key={u.id}
                    onClick={() => setSelectedUserId(u.id)}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center text-white font-bold shrink-0">
                          {u.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-white group-hover:text-cyan-400 transition-colors block">
                            {u.username}
                          </span>
                          <span className="text-[11px] text-slate-400">{u.email}</span>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <span className="font-mono font-bold text-amber-400 text-sm">
                        {Number(u.points_balance).toLocaleString()} PTS
                      </span>
                    </td>

                    <td className="p-3.5">
                      <span className="font-mono text-cyan-400">
                        {Number(u.total_earned).toLocaleString()}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <span className="font-mono text-emerald-400">
                        ${Number(u.total_withdrawn || 0).toFixed(2)}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        u.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        u.status === 'suspended' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        {u.status}
                      </span>
                    </td>

                    <td className="p-3.5 text-slate-400">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>

                    <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedUserId(u.id)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Dossier Modal */}
      {selectedUserId && (
        <UserDetailModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          onUserUpdated={fetchUsers}
        />
      )}
    </div>
  );
}
