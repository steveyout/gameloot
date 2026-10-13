import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, User, Shield, Coins, History, Award, AlertTriangle, 
  Ban, CheckCircle, PlusCircle, MinusCircle, Clock, Send, MessageSquare
} from 'lucide-react';
import { getUserDetails, updateUserStatus, adjustUserPoints, createAdminNotification } from '../services/api';
import { useAlert } from '../context/AlertContext';

export default function UserDetailModal({ userId, onClose, onUserUpdated }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  // Direct In-App Message Form State
  const [msgTitle, setMsgTitle] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [msgBonus, setMsgBonus] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  const { success, error, confirm } = useAlert();

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getUserDetails(userId);
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) loadData();
  }, [userId]);

  const handleStatusChange = async (newStatus) => {
    const isBan = newStatus === 'banned';
    const ok = await confirm({
      title: isBan ? 'Ban Player Account?' : `Set Status to ${newStatus.toUpperCase()}?`,
      message: isBan 
        ? 'Banning this player will immediately block all game earning sessions, void pending payouts, and prevent login.' 
        : `Are you sure you want to mark this account as ${newStatus}?`,
      confirmText: isBan ? 'Ban Account' : 'Update Status',
      type: isBan ? 'danger' : 'info'
    });

    if (!ok) return;

    try {
      await updateUserStatus(userId, newStatus);
      success(`Player marked as ${newStatus}.`);
      await loadData();
      if (onUserUpdated) onUserUpdated();
    } catch (err) {
      error(err.message);
    }
  };

  const handleAdjustPoints = async (isAddition) => {
    const amt = parseInt(adjustAmount, 10);
    if (isNaN(amt) || amt <= 0) {
      error('Please enter a valid positive number');
      return;
    }
    const finalAmt = isAddition ? amt : -amt;

    setAdjusting(true);
    try {
      await adjustUserPoints(userId, finalAmt, adjustReason || 'Admin Manual Adjustment');
      success(`Points adjusted by ${finalAmt > 0 ? '+' : ''}${finalAmt} PTS.`);
      setAdjustAmount('');
      setAdjustReason('');
      await loadData();
      if (onUserUpdated) onUserUpdated();
    } catch (err) {
      error('Points adjustment failed: ' + err.message);
    } finally {
      setAdjusting(false);
    }
  };

  const handleSendDirectMessage = async (e) => {
    e.preventDefault();
    if (!msgTitle.trim() || !msgBody.trim()) {
      error('Please provide a message headline and body');
      return;
    }

    setSendingMsg(true);
    try {
      const res = await createAdminNotification({
        title: msgTitle.trim(),
        message: msgBody.trim(),
        type: parseInt(msgBonus, 10) > 0 ? 'bonus' : 'announcement',
        bonus_points: parseInt(msgBonus, 10) || 0,
        action_screen: 'wallet',
        target_audience: 'specific',
        user_id: userId
      });

      if (res.success) {
        success(`Direct in-app notification pushed to @${user?.username}!`);
        setMsgTitle('');
        setMsgBody('');
        setMsgBonus('');
      }
    } catch (err) {
      error('Failed to send notification: ' + err.message);
    } finally {
      setSendingMsg(false);
    }
  };

  if (!userId) return null;

  const user = data?.user;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center text-white font-bold">
                {user ? user.username.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <h3 className="text-base font-bold text-white m-0 flex items-center gap-2">
                  <span>{user?.username || 'Player Dossier'}</span>
                  {user && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${
                      user.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      user.status === 'suspended' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}>
                      {user.status}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-400 m-0">{user?.email}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
              <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs">Fetching player records...</span>
            </div>
          ) : user ? (
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
              {/* Quick stats grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-1">Points Balance</span>
                  <div className="text-lg font-black text-amber-400 font-mono">
                    {Number(user.points_balance).toLocaleString()} PTS
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-1">Total Earned</span>
                  <div className="text-lg font-black text-cyan-400 font-mono">
                    {Number(user.total_earned).toLocaleString()} PTS
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-1">Cash Out USD</span>
                  <div className="text-lg font-black text-emerald-400 font-mono">
                    ${Number(user.total_withdrawn || 0).toFixed(2)}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-1">Registered</span>
                  <div className="text-xs text-slate-300 font-medium pt-1">
                    {new Date(user.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Status Controls */}
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 flex items-center justify-between flex-wrap gap-3">
                <span className="text-xs text-slate-300 font-medium">Account Sanctions & Status:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleStatusChange('active')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      user.status === 'active' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-emerald-400'
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Activate</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStatusChange('suspended')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      user.status === 'suspended' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-amber-400'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Suspend</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStatusChange('banned')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      user.status === 'banned' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-rose-400'
                    }`}
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Ban Account</span>
                  </button>
                </div>
              </div>

              {/* Points Adjustment Panel */}
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800">
                <span className="text-xs font-semibold text-slate-300 block mb-2.5">
                  Manual Points Ledger Adjustment
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                  <input
                    type="number"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                    placeholder="Points Amount (e.g. 500)"
                    className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs"
                  />
                  <input
                    type="text"
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    placeholder="Reason (e.g. Tourney bonus)"
                    className="md:col-span-2 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={adjusting || !adjustAmount}
                    onClick={() => handleAdjustPoints(true)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Credit Points (+)</span>
                  </button>
                  <button
                    type="button"
                    disabled={adjusting || !adjustAmount}
                    onClick={() => handleAdjustPoints(false)}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <MinusCircle className="w-3.5 h-3.5" />
                    <span>Debit Points (-)</span>
                  </button>
                </div>
              </div>

              {/* Send Direct Notification / Bonus Gift to this Player */}
              <div className="p-4 rounded-xl bg-slate-950/40 border border-purple-500/20">
                <div className="flex items-center gap-2 mb-2.5">
                  <MessageSquare className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-white">
                    Send Direct In-App Message or Bonus Drop to @{user.username}
                  </span>
                </div>
                <form onSubmit={handleSendDirectMessage} className="space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      required
                      value={msgTitle}
                      onChange={(e) => setMsgTitle(e.target.value)}
                      placeholder="Title (e.g. VIP Gift!)"
                      className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs"
                    />
                    <input
                      type="number"
                      min="0"
                      value={msgBonus}
                      onChange={(e) => setMsgBonus(e.target.value)}
                      placeholder="Bonus PTS (optional)"
                      className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs"
                    />
                    <button
                      type="submit"
                      disabled={sendingMsg}
                      className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-3 h-3" />
                      <span>{sendingMsg ? 'Sending...' : 'Dispatch Message'}</span>
                    </button>
                  </div>
                  <textarea
                    required
                    rows={2}
                    value={msgBody}
                    onChange={(e) => setMsgBody(e.target.value)}
                    placeholder="Enter customized message that will appear in this player's mobile notification drawer..."
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs resize-none"
                  />
                </form>
              </div>

              {/* Recent Sessions */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Recent Play Sessions</span>
                </h4>
                {data.sessions?.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No games played yet.</p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="p-2.5">Game</th>
                          <th className="p-2.5">Duration</th>
                          <th className="p-2.5">Points</th>
                          <th className="p-2.5">Status</th>
                          <th className="p-2.5">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
                        {data.sessions.map((s) => (
                          <tr key={s.id}>
                            <td className="p-2.5 font-medium text-slate-200">{s.game_title}</td>
                            <td className="p-2.5 font-mono text-slate-400">{s.duration_seconds}s</td>
                            <td className="p-2.5 font-mono font-bold text-amber-400">+{s.points_earned}</td>
                            <td className="p-2.5">
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                                {s.status}
                              </span>
                            </td>
                            <td className="p-2.5 text-slate-500 text-[11px]">
                              {new Date(s.start_time).toLocaleTimeString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-slate-400 text-xs">Player record not found.</div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
