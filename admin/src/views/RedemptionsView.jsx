import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Banknote, CheckCircle2, XCircle, Clock, CheckCheck,
  ExternalLink, Coins, AlertCircle, Sparkles, Filter,
  Gift, Plus, Eye, EyeOff, Edit2, Trash2, Save, X, ToggleLeft, ToggleRight
} from 'lucide-react';
import {
  getRedemptions,
  updateRedemptionStatus,
  bulkRedemptionsAction,
  getRewardItems,
  createRewardItem,
  updateRewardItem,
  deleteRewardItem,
  toggleRewardItem,
  getSettings,
  updateSettings
} from '../services/api';
import Pagination from '../components/Pagination';
import { useAlert } from '../context/AlertContext';
import confetti from 'canvas-confetti';

export default function RedemptionsView() {
  const [activeMainTab, setActiveMainTab] = useState('requests'); // 'requests' | 'catalog'
  const [redemptions, setRedemptions] = useState([]);
  const [rewardItems, setRewardItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [adminNote, setAdminNote] = useState({});

  // Master payouts_enabled state
  const [payoutsEnabled, setPayoutsEnabled] = useState(true);

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Bulk Selection state
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // Payout Option Modal State
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemFormData, setItemFormData] = useState({
    title: '',
    type: 'paypal',
    cost_points: 1000,
    cash_value_usd: 1.00,
    icon_url: 'https://cdn-icons-png.flaticon.com/512/174/174861.png',
    description: '',
    stock: 999,
    is_active: true
  });

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

  const fetchCatalogData = async () => {
    try {
      setLoading(true);
      const [itemsRes, settingsRes] = await Promise.all([
        getRewardItems(),
        getSettings()
      ]);
      if (itemsRes.success) setRewardItems(itemsRes.rewardItems || []);
      if (settingsRes.success) {
        const pSetting = settingsRes.settings?.find(s => s.setting_key === 'payouts_enabled');
        setPayoutsEnabled(pSetting ? pSetting.setting_value !== 'false' : true);
      }
    } catch (err) {
      error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeMainTab === 'requests') {
      fetchRedemptions();
    } else {
      fetchCatalogData();
    }
  }, [activeMainTab, statusFilter, page, limit]);

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

  // Master Payouts Toggle
  const handleToggleMasterPayouts = async () => {
    const nextVal = payoutsEnabled ? 'false' : 'true';
    const ok = await confirm({
      title: payoutsEnabled ? 'Disable Cashout Tab & Payouts?' : 'Enable Cashout Tab & Payouts?',
      message: payoutsEnabled
        ? 'This will hide the Cashout tab from the mobile app and block any redemptions.'
        : 'This will restore the Cashout tab to the mobile app and allow redemptions.',
      confirmText: payoutsEnabled ? 'Disable & Hide Tab' : 'Enable Cashout Tab',
      type: payoutsEnabled ? 'danger' : 'info'
    });

    if (!ok) return;

    try {
      await updateSettings([{ setting_key: 'payouts_enabled', setting_value: nextVal }]);
      setPayoutsEnabled(nextVal === 'true');
      success(nextVal === 'true'
        ? '🟢 Cashouts ENABLED! Cashout tab restored in mobile app.'
        : '🔴 Cashouts DISABLED! Cashout tab hidden in mobile app.'
      );
    } catch (err) {
      error('Failed to update master payouts setting: ' + err.message);
    }
  };

  // Toggle single reward option
  const handleToggleItemStatus = async (item) => {
    try {
      await toggleRewardItem(item.id);
      success(`"${item.title}" is now ${!item.is_active ? 'ACTIVE (visible in app)' : 'HIDDEN from app'}.`);
      setRewardItems(prev => prev.map(i => i.id === item.id ? { ...i, is_active: !i.is_active } : i));
    } catch (err) {
      error('Failed to toggle option: ' + err.message);
    }
  };

  // Delete reward option
  const handleDeleteItem = async (item) => {
    const ok = await confirm({
      title: `Delete "${item.title}"?`,
      message: 'This will remove this payout option from the reward catalog.',
      confirmText: 'Delete Payout Option',
      type: 'danger'
    });

    if (!ok) return;

    try {
      await deleteRewardItem(item.id);
      success(`"${item.title}" deleted.`);
      setRewardItems(prev => prev.filter(i => i.id !== item.id));
    } catch (err) {
      error('Delete failed: ' + err.message);
    }
  };

  // Open modal for Create or Edit
  const handleOpenItemModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setItemFormData({
        title: item.title,
        type: item.type || 'paypal',
        cost_points: item.cost_points,
        cash_value_usd: item.cash_value_usd,
        icon_url: item.icon_url || 'https://cdn-icons-png.flaticon.com/512/174/174861.png',
        description: item.description || '',
        stock: item.stock !== undefined ? item.stock : 999,
        is_active: item.is_active !== undefined ? item.is_active : true
      });
    } else {
      setEditingItem(null);
      setItemFormData({
        title: '',
        type: 'paypal',
        cost_points: 1000,
        cash_value_usd: 1.00,
        icon_url: 'https://cdn-icons-png.flaticon.com/512/174/174861.png',
        description: '',
        stock: 999,
        is_active: true
      });
    }
    setShowItemModal(true);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await updateRewardItem(editingItem.id, itemFormData);
        success(`"${itemFormData.title}" updated successfully!`);
      } else {
        await createRewardItem(itemFormData);
        success(`"${itemFormData.title}" created successfully!`);
      }
      setShowItemModal(false);
      fetchCatalogData();
    } catch (err) {
      error('Failed to save payout option: ' + err.message);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white m-0 flex items-center gap-2">
            <Banknote className="w-5 h-5 text-emerald-400" />
            <span>Payouts & Rewards Management</span>
          </h2>
          <p className="text-xs text-slate-400 m-0 mt-0.5">
            Process player withdrawal queue and configure payout options & catalog visibility
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveMainTab('requests')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeMainTab === 'requests'
                ? 'bg-emerald-500 text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Payout Requests</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('catalog')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeMainTab === 'catalog'
                ? 'bg-cyan-500 text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>Payout Options & Catalog</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Payout Requests Queue */}
      {activeMainTab === 'requests' && (
        <div className="space-y-4">
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
      )}

      {/* TAB 2: Payout Options & Reward Catalog Management */}
      {activeMainTab === 'catalog' && (
        <div className="space-y-5">
          {/* Master Payouts Switch Banner */}
          <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            payoutsEnabled
              ? 'bg-slate-900/80 border-slate-800'
              : 'bg-amber-950/40 border-amber-500/50 shadow-lg shadow-amber-950/40'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                payoutsEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
              }`}>
                <Gift className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white m-0">Master Cashout Availability</h4>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    payoutsEnabled ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-amber-500 text-black'
                  }`}>
                    {payoutsEnabled ? 'TAB ENABLED' : 'TAB HIDDEN / DISABLED'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 m-0 mt-0.5">
                  {payoutsEnabled
                    ? 'Cashout tab is active in the mobile app bottom bar and players can submit redemption requests.'
                    : 'Cashout tab is completely hidden and disabled in the mobile app.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleMasterPayouts}
                className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                  payoutsEnabled
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-black'
                }`}
              >
                {payoutsEnabled ? 'Disable & Hide Tab' : 'Enable Cashout Tab'}
              </button>

              <button
                type="button"
                onClick={() => handleOpenItemModal()}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-cyan-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>Add Payout Option</span>
              </button>
            </div>
          </div>

          {/* Reward Items Cards / Grid */}
          <div className="glass-card rounded-2xl border border-slate-800/80 bg-slate-900/60 overflow-hidden shadow-md">
            {loading ? (
              <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
                <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs">Loading payout options...</span>
              </div>
            ) : rewardItems.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No payout options found in catalog. Click "Add Payout Option" to create one.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold text-[10px]">
                    <tr>
                      <th className="p-3.5">Payout Option</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5">Cost (PTS)</th>
                      <th className="p-3.5">USD Value</th>
                      <th className="p-3.5">Stock</th>
                      <th className="p-3.5">App Visibility Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {rewardItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            <img
                              src={item.icon_url || 'https://cdn-icons-png.flaticon.com/512/174/174861.png'}
                              alt={item.title}
                              className="w-9 h-9 rounded-xl object-contain bg-slate-950 p-1 border border-slate-800"
                              onError={(e) => { e.target.src = 'https://cdn-icons-png.flaticon.com/512/174/174861.png'; }}
                            />
                            <div>
                              <span className="font-bold text-white block">{item.title}</span>
                              <span className="text-[11px] text-slate-400">{item.description || 'Digital payout reward'}</span>
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                            {item.type}
                          </span>
                        </td>

                        <td className="p-3.5 font-mono font-bold text-amber-400 text-sm">
                          {Number(item.cost_points).toLocaleString()} PTS
                        </td>

                        <td className="p-3.5 font-mono font-bold text-emerald-400 text-sm">
                          ${Number(item.cash_value_usd).toFixed(2)}
                        </td>

                        <td className="p-3.5 font-mono text-slate-300">
                          {item.stock}
                        </td>

                        <td className="p-3.5">
                          <button
                            type="button"
                            onClick={() => handleToggleItemStatus(item)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                              item.is_active
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                            }`}
                          >
                            {item.is_active ? (
                              <>
                                <Eye className="w-3 h-3 text-emerald-400" />
                                <span>ACTIVE (Visible in App)</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3 h-3 text-slate-400" />
                                <span>HIDDEN (Disabled in App)</span>
                              </>
                            )}
                          </button>
                        </td>

                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleToggleItemStatus(item)}
                              title={item.is_active ? 'Hide from mobile app' : 'Make visible in mobile app'}
                              className={`p-1.5 rounded-lg border text-xs cursor-pointer ${
                                item.is_active
                                  ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30'
                                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              }`}
                            >
                              {item.is_active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenItemModal(item)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                              title="Edit Payout Option"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item)}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 cursor-pointer"
                              title="Delete Payout Option"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
        </div>
      )}

      {/* Add / Edit Payout Option Modal */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white m-0 flex items-center gap-2">
                <Gift className="w-4 h-4 text-cyan-400" />
                <span>{editingItem ? 'Edit Payout Option' : 'Add New Payout Option'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowItemModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-5 space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PayPal $5.00 Payout"
                  value={itemFormData.title}
                  onChange={(e) => setItemFormData({ ...itemFormData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-medium focus:border-cyan-400 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Payout Method / Type</label>
                  <select
                    value={itemFormData.type}
                    onChange={(e) => setItemFormData({ ...itemFormData, type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-medium focus:border-cyan-400 outline-none"
                  >
                    <option value="paypal">PayPal</option>
                    <option value="crypto">Crypto (USDT / Crypto)</option>
                    <option value="google_play">Google Play</option>
                    <option value="steam">Steam Wallet</option>
                    <option value="amazon">Amazon Gift Card</option>
                    <option value="apple">Apple App Store</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Stock Limit</label>
                  <input
                    type="number"
                    value={itemFormData.stock}
                    onChange={(e) => setItemFormData({ ...itemFormData, stock: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:border-cyan-400 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Points Cost (PTS)</label>
                  <input
                    type="number"
                    required
                    value={itemFormData.cost_points}
                    onChange={(e) => setItemFormData({ ...itemFormData, cost_points: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:border-cyan-400 outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Cash Value (USD $)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={itemFormData.cash_value_usd}
                    onChange={(e) => setItemFormData({ ...itemFormData, cash_value_usd: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:border-cyan-400 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Icon URL</label>
                <input
                  type="text"
                  value={itemFormData.icon_url}
                  onChange={(e) => setItemFormData({ ...itemFormData, icon_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:border-cyan-400 outline-none"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Description / Help Text</label>
                <input
                  type="text"
                  value={itemFormData.description}
                  onChange={(e) => setItemFormData({ ...itemFormData, description: e.target.value })}
                  placeholder="e.g. Sent directly to verified PayPal email address"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-medium focus:border-cyan-400 outline-none"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Visibility in Mobile App</label>
                <select
                  value={itemFormData.is_active ? 'true' : 'false'}
                  onChange={(e) => setItemFormData({ ...itemFormData, is_active: e.target.value === 'true' })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-medium focus:border-cyan-400 outline-none"
                >
                  <option value="true">Active (Visible to all mobile users)</option>
                  <option value="false">Hidden / Disabled (Not visible in app)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold cursor-pointer shadow-md"
                >
                  {editingItem ? 'Save Changes' : 'Create Payout Option'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
