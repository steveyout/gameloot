import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Banknote, CheckCircle2, XCircle, Clock, CheckCheck, 
  ExternalLink, Coins, AlertCircle, Sparkles, Filter 
} from 'lucide-react';
import { getRedemptions, updateRedemptionStatus, bulkRedemptionsAction } from '../services/api';
import Pagination from '../components/Pagination';
import { useAlert } from '../context/AlertContext';
import confetti from 'canvas-confetti';

export default function RedemptionsView() {
  const [redemptions, setRedemptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [adminNote, setAdminNote] = useState({});

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Bulk Selection state
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);

  const { success, error, confirm } = useAlert();

  const fetchRedemptions = async () => {
    try {
      setLoading(true);
      const res = await getRedemptions({ 
        status: statusFilter,
        page,
        limit 
      });
      if (res.success) {
        setRedemptions(res.redemptions);
        setTotalItems(res.total || res.redemptions.length);
        setTotalPages(res.totalPages || Math.ceil((res.total || res.redemptions.length) / limit) || 1);
      }
    } catch (err) {
      error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRedemptions();
  }, [statusFilter, page, limit]);

  useEffect(() => {
    setPage(1);
    setSelectedIds([]);
  }, [statusFilter]);

  const handleUpdate = async (r, status) => {
    const isReject = status === 'rejected';
    const ok = await confirm({
      title: isReject ? 'Reject & Refund Cashout?' : `Set Status to ${status.toUpperCase()}?`,
      message: isReject 
        ? `Rejecting this cashout will automatically refund ${Number(r.points_spent).toLocaleString()} PTS back to ${r.username}'s account.`
        : `Confirm updating withdrawal #${r.id} ($${Number(r.cash_value_usd).toFixed(2)}) to ${status}.`,
      confirmText: isReject ? 'Reject & Refund' : 'Update Status',
      type: isReject ? 'danger' : 'info'
    });

    if (!ok) return;

    const note = adminNote[r.id] || '';
    try {
      await updateRedemptionStatus(r.id, status, note);
      if (status === 'paid' || status === 'approved') {
        confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
        success(`Cashout marked as ${status}!`);
      } else {
        success(`Cashout rejected and points refunded.`);
      }
      fetchRedemptions();
    } catch (err) {
      error('Failed to update: ' + err.message);
    }
  };

  // Bulk Selection toggles
  const handleToggleSelectAll = () => {
    if (selectedIds.length === redemptions.length && redemptions.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(redemptions.map(r => r.id));
    }
  };

  const handleToggleSelectOne = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleBulkAction = async (action) => {
    if (selectedIds.length === 0) return;

    const isReject = action === 'rejected';
    const ok = await confirm({
      title: isReject ? 'Bulk Reject & Refund Cashouts' : `Bulk Mark as ${action.toUpperCase()}`,
      message: isReject
        ? `Are you sure you want to REJECT and automatically REFUND ${selectedIds.length} cashout requests?`
        : `Confirm updating ${selectedIds.length} cashout requests to ${action.toUpperCase()}.`,
      confirmText: isReject ? 'Reject & Refund All' : 'Confirm Action',
      type: isReject ? 'danger' : 'info'
    });

    if (!ok) return;

    setBulkProcessing(true);
    try {
      await bulkRedemptionsAction(selectedIds, action, 'Bulk Admin Fulfillment');
      if (action === 'paid') {
        confetti({ particleCount: 80, spread: 90, origin: { y: 0.6 } });
      }
      success(`Bulk action completed for ${selectedIds.length} cashout requests.`);
      setSelectedIds([]);
      fetchRedemptions();
    } catch (err) {
      error('Bulk action failed: ' + err.message);
    } finally {
      setBulkProcessing(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {['', 'pending', 'approved', 'paid', 'rejected'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer shrink-0 ${
                statusFilter === st
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {st || 'All Requests'}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-400">
          Total: <span className="text-white font-bold">{totalItems}</span> payout records
        </div>
      </div>

      {/* Bulk Action Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border border-emerald-500/40 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-lg shadow-emerald-950/40"
          >
            <div className="flex items-center gap-2.5 text-xs text-white">
              <span className="w-6 h-6 rounded-lg bg-emerald-500 text-black font-black flex items-center justify-center text-[11px]">
                {selectedIds.length}
              </span>
              <span className="font-semibold">Cashout(s) selected</span>
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
                onClick={() => handleBulkAction('paid')}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark Paid (Dispatch)</span>
              </button>

              <button
                type="button"
                disabled={bulkProcessing}
                onClick={() => handleBulkAction('approved')}
                className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approve Selected</span>
              </button>

              <button
                type="button"
                disabled={bulkProcessing}
                onClick={() => handleBulkAction('rejected')}
                className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Reject & Refund All</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Redemptions Table */}
      <div className="glass-card rounded-2xl border border-slate-800/80 bg-slate-900/60 overflow-hidden shadow-md">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">Loading cashout queue...</span>
          </div>
        ) : redemptions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No withdrawal requests match current criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="p-3.5 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === redemptions.length && redemptions.length > 0}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700 focus:ring-0 cursor-pointer"
                    />
                  </th>
                  <th className="p-3.5">ID / User</th>
                  <th className="p-3.5">Reward Item</th>
                  <th className="p-3.5">Value (USD)</th>
                  <th className="p-3.5">Points Spent</th>
                  <th className="p-3.5">Payout Address / Details</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Requested Date</th>
                  <th className="p-3.5 text-right">Fulfillment Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {redemptions.map((r) => {
                  const isSelected = selectedIds.includes(r.id);
                  return (
                    <tr key={r.id} className={`transition-colors ${
                      isSelected ? 'bg-emerald-950/20' : 'hover:bg-slate-800/30'
                    }`}>
                      <td className="p-3.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(r.id)}
                          className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700 focus:ring-0 cursor-pointer"
                        />
                      </td>

                      <td className="p-3.5">
                        <span className="font-mono text-slate-400 block text-[10px]">#{r.id}</span>
                        <span className="font-bold text-white block">{r.username}</span>
                        <span className="text-[11px] text-slate-400">{r.email}</span>
                      </td>

                      <td className="p-3.5">
                        <span className="font-bold text-slate-200 block">{r.reward_title}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-mono">{r.reward_type}</span>
                      </td>

                      <td className="p-3.5 font-mono font-bold text-emerald-400 text-sm">
                        ${Number(r.cash_value_usd).toFixed(2)}
                      </td>

                      <td className="p-3.5 font-mono text-slate-300 max-w-xs break-all bg-slate-950/40 p-2 rounded-lg">
                        {r.payout_details}
                      </td>

                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          r.status === 'pending' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                          r.status === 'approved' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
                          r.status === 'paid' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}>
                          {r.status}
                        </span>
                      </td>

                      <td className="p-3.5 text-slate-400 text-[11px]">
                        {new Date(r.created_at).toLocaleString()}
                      </td>

                      <td className="p-3.5 text-right">
                        {r.status === 'pending' && (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleUpdate(r, 'approved')}
                              className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Approve</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdate(r, 'rejected')}
                              className="px-2.5 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                            >
                              <XCircle className="w-3 h-3" />
                              <span>Reject & Refund</span>
                            </button>
                          </div>
                        )}

                        {r.status === 'approved' && (
                          <button
                            type="button"
                            onClick={() => handleUpdate(r, 'paid')}
                            className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] flex items-center gap-1.5 ml-auto cursor-pointer"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span>Mark as Paid (Dispatched)</span>
                          </button>
                        )}

                        {r.status === 'paid' && (
                          <span className="text-[11px] text-emerald-400 font-semibold flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Paid</span>
                          </span>
                        )}

                        {r.status === 'rejected' && (
                          <span className="text-[11px] text-rose-400 font-semibold flex items-center justify-end gap-1">
                            <XCircle className="w-3 h-3" />
                            <span>Refunded</span>
                          </span>
                        )}
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
    </div>
  );
}
