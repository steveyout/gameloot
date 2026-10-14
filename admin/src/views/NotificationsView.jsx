import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Send,
  Sparkles,
  AlertCircle,
  Gift,
  Smartphone,
  Users,
  Radio,
  Trash2,
  CheckCircle2,
  RefreshCw,
  Clock,
  Coins,
  ChevronRight,
  Info,
  Flame,
  UserCheck
} from 'lucide-react';
import {
  getAdminNotifications,
  createAdminNotification,
  deleteAdminNotification,
  getUsers
} from '../services/api';
import { useAlert } from '../context/AlertContext';

const QUICK_TEMPLATES = [
  {
    title: '⚡ Weekend 2X Point Multiplier Active!',
    message: 'Double points are live on all arcade games for the next 48 hours! Play and maximize your daily wallet cashout.',
    type: 'announcement',
    bonus_points: 0,
    action_screen: 'lobby'
  },
  {
    title: '🎁 Surprise 50 PTS Loyalty Drop!',
    message: 'Thanks for playing on GameLoot! Here is an instant 50 PTS bonus credited straight to your vault. Tap to claim!',
    type: 'bonus',
    bonus_points: 50,
    action_screen: 'wallet'
  },
  {
    title: '🎮 New Release: Cyber Speed Racer & Hexagon Mania',
    message: 'Two brand new games have been added to the library with high reward rates. Jump in and set the high score!',
    type: 'reward',
    bonus_points: 15,
    action_screen: 'lobby'
  },
  {
    title: '🚨 Scheduled Server Optimization Tonight',
    message: 'GameLoot servers will undergo a 15-minute speed upgrade at 03:00 UTC. Your points and wallet balances will remain completely safe.',
    type: 'system',
    bonus_points: 0,
    action_screen: null
  }
];

export default function NotificationsView() {
  const { success, error, confirm } = useAlert();
  const [notifications, setNotifications] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('announcement');
  const [bonusPoints, setBonusPoints] = useState(0);
  const [actionScreen, setActionScreen] = useState('lobby');
  const [targetAudience, setTargetAudience] = useState('all');
  const [selectedUserId, setSelectedUserId] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [notifsRes, usersRes] = await Promise.all([
        getAdminNotifications(),
        getUsers({ limit: 50 })
      ]);
      if (notifsRes.success) setNotifications(notifsRes.notifications);
      if (usersRes.success) setPlayers(usersRes.users);
    } catch (err) {
      console.warn('Notifications load error:', err);
      error(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApplyTemplate = (tpl) => {
    setTitle(tpl.title);
    setMessage(tpl.message);
    setType(tpl.type);
    setBonusPoints(tpl.bonus_points);
    setActionScreen(tpl.action_screen || '');
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      error('Please provide both title and message.');
      return;
    }

    if (targetAudience === 'specific' && !selectedUserId) {
      error('Please select a specific recipient player.');
      return;
    }

    const isConfirmed = await confirm({
      title: 'Broadcast In-App Notification?',
      message: `Send "${title}" to ${
        targetAudience === 'all' ? 'ALL active players' : `Player ID #${selectedUserId}`
      }${bonusPoints > 0 ? ` with +${bonusPoints} claimable PTS attached` : ''}? It will immediately appear on user devices.`,
      confirmText: 'Broadcast Now',
      type: 'primary'
    });

    if (!isConfirmed) return;

    try {
      setSubmitting(true);
      const res = await createAdminNotification({
        title: title.trim(),
        message: message.trim(),
        type,
        bonus_points: parseInt(bonusPoints, 10) || 0,
        action_screen: actionScreen || null,
        target_audience: targetAudience,
        user_id: targetAudience === 'specific' ? selectedUserId : null
      });

      if (res.success) {
        success('Broadcast sent and pushed via WebSockets to player apps!');
        // Reset form
        setTitle('');
        setMessage('');
        setBonusPoints(0);
        loadData();
      }
    } catch (err) {
      error(err.message || 'Failed to send notification');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, notifTitle) => {
    const isConfirmed = await confirm({
      title: 'Remove Notification?',
      message: `Delete broadcast "${notifTitle}"? Players will no longer see it in their notification inbox.`,
      confirmText: 'Delete Notification',
      type: 'danger'
    });

    if (!isConfirmed) return;

    try {
      const res = await deleteAdminNotification(id);
      if (res.success) {
        success('Notification deleted.');
        setNotifications(prev => prev.filter(n => n.id !== id));
      }
    } catch (err) {
      error(err.message || 'Failed to delete notification');
    }
  };

  const getTypeTheme = (t) => {
    switch (t) {
      case 'bonus':
        return {
          bg: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
          dot: 'bg-amber-400',
          badge: 'Bonus Drop',
          Icon: Sparkles
        };
      case 'alert':
        return {
          bg: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
          dot: 'bg-rose-400',
          badge: 'Urgent Alert',
          Icon: AlertCircle
        };
      case 'reward':
        return {
          bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
          dot: 'bg-emerald-400',
          badge: 'Reward Update',
          Icon: Gift
        };
      case 'system':
        return {
          bg: 'bg-purple-500/15 border-purple-500/30 text-purple-400',
          dot: 'bg-purple-400',
          badge: 'System Notice',
          Icon: Radio
        };
      default:
        return {
          bg: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400',
          dot: 'bg-cyan-400',
          badge: 'Announcement',
          Icon: Bell
        };
    }
  };

  const previewTheme = getTypeTheme(type);
  const PreviewIcon = previewTheme.Icon;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-slate-950 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white m-0">Push & In-App Broadcast Center</h1>
            <p className="text-xs sm:text-sm text-slate-400 m-0 mt-1">
              Dispatch real-time in-app banners, push announcements, and bonus point drops directly to player devices.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          <span>Refresh Feeds</span>
        </button>
      </div>

      {/* Main Grid: Broadcast Composer & Live Phone Mockup */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <Send className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold text-white m-0">Compose New Broadcast</h2>
            </div>
            <span className="text-[11px] font-semibold text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full">
              Socket.IO Instant Delivery
            </span>
          </div>

          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Quick Preset Templates
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {QUICK_TEMPLATES.map((tpl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleApplyTemplate(tpl)}
                  className="text-left p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-slate-700 text-xs text-slate-300 transition-all cursor-pointer group"
                >
                  <div className="font-semibold text-white group-hover:text-cyan-300 truncate">
                    {tpl.title}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {tpl.bonus_points > 0 ? `+${tpl.bonus_points} PTS Bonus` : 'Informational announcement'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSendNotification} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Notification Headline / Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 🎉 Double Points Arcade Weekend!"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            {/* Message Body */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Message Body <span className="text-rose-400">*</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="Enter details displayed in the player's in-app notification center..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
              />
            </div>

            {/* Notification Type & Target Audience */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Notification Style</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="announcement">📢 Announcement (Cyan)</option>
                  <option value="bonus">🎁 Bonus Loot Drop (Amber)</option>
                  <option value="alert">🚨 Urgent Alert (Rose)</option>
                  <option value="reward">✨ Reward Update (Emerald)</option>
                  <option value="system">⚙️ System Maintenance (Purple)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Target Audience</label>
                <select
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="all">🌍 All Registered Players (Global)</option>
                  <option value="specific">👤 Specific Player (Targeted)</option>
                </select>
              </div>
            </div>

            {/* Target Player dropdown if specific */}
            {targetAudience === 'specific' && (
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Select Target Player <span className="text-rose-400">*</span>
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="">-- Choose Player --</option>
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
                      #{p.id} - {p.username} ({p.email}) - {p.points_balance} PTS
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Bonus Points Attachment & Deep-link screen */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Attach Free Bonus Points (Claimable)
                </label>
                <div className="relative">
                  <Coins className="w-4 h-4 text-amber-400 absolute left-3 top-3" />
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={bonusPoints}
                    onChange={(e) => setBonusPoints(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
                    placeholder="0"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  If &gt; 0, users see an interactive "Claim +X PTS" button.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Action Deep-Link Screen
                </label>
                <select
                  value={actionScreen}
                  onChange={(e) => setActionScreen(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="">None (Inbox only)</option>
                  <option value="lobby">🕹️ Games Arcade (Lobby)</option>
                  <option value="earn">✨ Earn Hub (Quizzes/Surf/Surveys)</option>
                  <option value="rewards">🎁 Cashout & Rewards</option>
                  <option value="wallet">💳 Loyalty Vault (Wallet)</option>
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  Tapping notification navigates player to this app screen.
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'Broadcasting...' : 'Broadcast Notification to Mobile Apps'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Live Smartphone Mockup Preview (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
            <Smartphone className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-bold text-white m-0">Live Smartphone Preview</h3>
          </div>
          <p className="text-xs text-slate-400 m-0">
            Real-time visual preview of how your message renders on iOS & Android screens:
          </p>

          {/* Smartphone Frame */}
          <div className="mx-auto max-w-[320px] rounded-[36px] bg-[#05070c] border-[6px] border-slate-800 p-3 shadow-2xl relative overflow-hidden">
            {/* Top Notch / Speaker bar */}
            <div className="w-24 h-4 bg-slate-800 rounded-full mx-auto mb-3" />

            {/* Mock Header */}
            <div className="flex items-center justify-between pb-3 px-1 border-b border-slate-900">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold">
                  GL
                </div>
                <span className="text-xs font-black text-white">GameLoot</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                  1,450 PTS
                </span>
                <div className="relative p-1">
                  <Bell className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-rose-500" />
                </div>
              </div>
            </div>

            {/* Notification Drawer Simulation */}
            <div className="mt-3 space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold text-slate-300">Notifications Inbox</span>
                <span className="text-[9px] text-cyan-400 font-semibold">Mark All Read</span>
              </div>

              {/* The Live Rendered Card */}
              <div className={`p-3 rounded-2xl border backdrop-blur-md transition-all ${previewTheme.bg}`}>
                <div className="flex items-start gap-2.5">
                  <div className={`p-1.5 rounded-xl shrink-0 ${previewTheme.bg}`}>
                    <PreviewIcon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-bold text-white truncate">
                        {title.trim() || 'Notification Title Preview'}
                      </span>
                      <span className="text-[9px] text-slate-400 shrink-0">Just now</span>
                    </div>

                    <p className="text-[10px] text-slate-300 mt-1 leading-snug line-clamp-3">
                      {message.trim() || 'Your message body will be displayed cleanly inside this card on player devices.'}
                    </p>

                    {/* Bonus Claim Badge if any */}
                    {parseInt(bonusPoints, 10) > 0 && (
                      <div className="mt-2.5 flex items-center justify-between bg-amber-500/20 border border-amber-500/40 rounded-xl px-2.5 py-1.5">
                        <div className="flex items-center gap-1.5 text-amber-300 text-[10px] font-bold">
                          <Coins className="w-3 h-3 text-amber-400" />
                          <span>+{bonusPoints} PTS Reward</span>
                        </div>
                        <span className="text-[9px] font-black bg-amber-400 text-slate-950 px-2 py-0.5 rounded-md">
                          CLAIM
                        </span>
                      </div>
                    )}

                    {/* Action pill if specified */}
                    {actionScreen && (
                      <div className="mt-2 flex items-center gap-1 text-[9px] font-semibold text-cyan-400">
                        <span>Tap to open {actionScreen.toUpperCase()}</span>
                        <ChevronRight className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sample Previous Notification Card */}
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60 flex items-start gap-2 opacity-60">
                <Gift className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold text-white">Daily Streak Bonus Claimed</div>
                  <div className="text-[9px] text-slate-400 truncate">+25 PTS added to your wallet balance</div>
                </div>
              </div>
            </div>

            {/* Bottom Safe Bar */}
            <div className="w-20 h-1 bg-slate-800 rounded-full mx-auto mt-6" />
          </div>
        </div>
      </div>

      {/* Broadcast History & Analytics Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white m-0">Broadcast History & Reach</h2>
          </div>
          <span className="text-xs text-slate-400">
            {notifications.length} Sent Broadcasts Recorded
          </span>
        </div>

        {notifications.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No broadcast notifications found. Send your first broadcast above!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Headline & Content</th>
                  <th className="py-3 px-3">Target</th>
                  <th className="py-3 px-3">Bonus</th>
                  <th className="py-3 px-3">Reads</th>
                  <th className="py-3 px-3">Sent Time</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {notifications.map((notif) => {
                  const theme = getTypeTheme(notif.type);
                  const Icon = theme.Icon;

                  return (
                    <tr key={notif.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 align-top">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${theme.bg}`}>
                          <Icon className="w-3 h-3" />
                          <span>{theme.badge}</span>
                        </span>
                      </td>

                      <td className="py-3 px-3 max-w-xs align-top">
                        <div className="font-bold text-white">{notif.title}</div>
                        <div className="text-slate-400 mt-0.5 line-clamp-2 leading-relaxed text-[11px]">
                          {notif.message}
                        </div>
                        {notif.action_screen && (
                          <span className="inline-block mt-1 text-[10px] text-cyan-400 font-semibold bg-cyan-500/10 px-1.5 py-0.5 rounded">
                            Action: {notif.action_screen}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 align-top whitespace-nowrap">
                        {notif.target_audience === 'specific' ? (
                          <span className="inline-flex items-center gap-1 text-purple-400 font-semibold text-[11px]">
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>@{notif.recipient_username || `ID #${notif.user_id}`}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-300 font-medium text-[11px]">
                            <Users className="w-3.5 h-3.5 text-slate-500" />
                            <span>All Players</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 align-top whitespace-nowrap">
                        {notif.bonus_points > 0 ? (
                          <span className="inline-flex items-center gap-1 text-amber-400 font-bold bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-lg">
                            <Sparkles className="w-3 h-3" />
                            +{notif.bonus_points} PTS
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      <td className="py-3 px-3 align-top whitespace-nowrap">
                        <div className="text-slate-300 font-semibold">
                          {notif.read_count || 0} reads
                        </div>
                        {notif.bonus_points > 0 && (
                          <div className="text-[10px] text-emerald-400">
                            {notif.claimed_count || 0} claimed
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 align-top whitespace-nowrap text-slate-400 text-[11px]">
                        {notif.created_at ? new Date(notif.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'Recent'}
                      </td>

                      <td className="py-3 px-3 align-top text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleDelete(notif.id, notif.title)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Delete broadcast"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
