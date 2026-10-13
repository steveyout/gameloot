import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Search, Filter, Coins, Award, Shield, Eye, CheckCircle2, 
  AlertTriangle, Ban, Sparkles, Check, Gift
} from 'lucide-react';
import { getUsers, updateUserStatus, bulkUsersAction } from '../services/api';
import UserDetailModal from '../components/UserDetailModal';
import Pagination from '../components/Pagination';
import { useAlert } from '../context/AlertContext';

export default function UsersView() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Bulk Selection state
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);

  const { success, error, confirm } = useAlert();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await getUsers({
        search,
        status: statusFilter,
        page,
        limit
      });
      if (res.success) {
        setUsers(res.users);
        setTotalItems(res.total || res.users.length);
        setTotalPages(res.totalPages || Math.ceil((res.total || res.users.length) / limit) || 1);
      }
    } catch (err) {
      error('Failed to load users: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, statusFilter, page, limit]);

  useEffect(() => {
    setPage(1);
    setSelectedIds([]);
  }, [search, statusFilter]);

  const handleQuickStatus = async (e, id, currentStatus) => {
    e.stopPropagation();
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await updateUserStatus(id, nextStatus);
      success(`Player status updated to ${nextStatus}.`);
      fetchUsers();
    } catch (err) {
      error('Failed: ' + err.message);
    }
  };

  // Bulk Selection toggles
  const handleToggleSelectAll = () => {
    if (selectedIds.length === users.length && users.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(users.map(u => u.id));
    }
  };

  const handleToggleSelectOne = (e, id) => {
    e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleBulkAction = async (action, amount = 100) => {
    if (selectedIds.length === 0) return;

    const actionLabels = {
      active: 'Activate Players',
      suspended: 'Suspend Accounts',
      banned: 'Ban Players from Platform',
      bonus: `Award +${amount} PTS Loyalty Bonus`
    };

    const isDanger = action === 'banned';
    const ok = await confirm({
      title: `Bulk Action: ${actionLabels[action] || action}`,
      message: `Are you sure you want to apply "${actionLabels[action] || action}" to ${selectedIds.length} selected player(s)?`,
      confirmText: actionLabels[action] || 'Confirm',
      type: isDanger ? 'danger' : 'info'
    });

    if (!ok) return;

    setBulkProcessing(true);
    try {
      await bulkUsersAction(selectedIds, action, amount, 'Bulk Admin Player Action');
      success(`Bulk action completed for ${selectedIds.length} players.`);
      setSelectedIds([]);
      fetchUsers();
    } catch (err) {
      error('Bulk action failed: ' + err.message);
    } finally {
      setBulkProcessing(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
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
          Total: <span className="text-white font-bold">{totalItems}</span> registered players
        </div>
      </div>

      {/* Bulk Action Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 border border-purple-500/40 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-lg shadow-purple-950/40"
          >
            <div className="flex items-center gap-2.5 text-xs text-white">
              <span className="w-6 h-6 rounded-lg bg-purple-500 text-white font-black flex items-center justify-center text-[11px]">
                {selectedIds.length}
              </span>
              <span className="font-semibold">Player(s) selected</span>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="text-[11px] text-slate-400 hover:text-white underline ml-2 cursor-pointer"
              >
                Clear selection
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs">
              <button
                type="button"
                disabled={bulkProcessing}
                onClick={() => handleBulkAction('active')}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Activate</span>
              </button>

              <button
                type="button"
                disabled={bulkProcessing}
                onClick={() => handleBulkAction('suspended')}
                className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Suspend</span>
              </button>

              <button
                type="button"
                disabled={bulkProcessing}
                onClick={() => handleBulkAction('banned')}
                className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Ban Accounts</span>
              </button>

              <button
                type="button"
                disabled={bulkProcessing}
                onClick={() => handleBulkAction('bonus', 100)}
                className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Gift className="w-3.5 h-3.5" />
                <span>Gift +100 PTS</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                  <th className="p-3.5 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === users.length && users.length > 0}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 rounded text-purple-500 bg-slate-900 border-slate-700 focus:ring-0 cursor-pointer"
                    />
                  </th>
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
                {users.map((u) => {
                  const isSelected = selectedIds.includes(u.id);
                  return (
                    <tr 
                      key={u.id}
                      onClick={() => setSelectedUserId(u.id)}
                      className={`transition-colors cursor-pointer group ${
                        isSelected ? 'bg-purple-950/20' : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="p-3.5" onClick={(e) => handleToggleSelectOne(e, u.id)}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleToggleSelectOne(e, u.id)}
                          className="w-4 h-4 rounded text-purple-500 bg-slate-900 border-slate-700 focus:ring-0 cursor-pointer"
                        />
                      </td>

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

                          <button
                            type="button"
                            onClick={(e) => handleQuickStatus(e, u.id, u.status)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${
                              u.status === 'active'
                                ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            }`}
                          >
                            {u.status === 'active' ? 'Suspend' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={(newLimit) => { setLimit(newLimit); setPage(1); }}
        limitOptions={[10, 25, 50, 100]}
      />

      {/* User Detail Dossier Modal */}
      {selectedUserId && (
        <UserDetailModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          onRefresh={fetchUsers}
        />
      )}
    </div>
  );
}
