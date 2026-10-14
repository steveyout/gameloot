import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Gamepad2, Coins, Banknote, ShieldAlert, 
  TrendingUp, Award, Play, CheckCircle2, XCircle, ArrowUpRight, Flame
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { getDashboardStats, updateRedemptionStatus } from '../services/api';
import confetti from 'canvas-confetti';

export default function DashboardView({ onSelectTab, onTestGame }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await getDashboardStats();
      if (res.success) {
        setStats(res.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleApproveRedemption = async (id) => {
    try {
      await updateRedemptionStatus(id, 'approved', 'Approved by admin via dashboard');
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      fetchStats();
    } catch (err) {
      alert('Failed: ' + err.message);
    }
  };

  const handleRejectRedemption = async (id) => {
    try {
      await updateRedemptionStatus(id, 'rejected', 'Declined via dashboard');
      fetchStats();
    } catch (err) {
      alert('Failed: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400 min-h-[400px]">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm">Synthesizing platform analytics...</span>
      </div>
    );
  }

  const kpis = stats?.kpis || {};
  const topGames = stats?.topGames || [];
  const chartData = stats?.chartData || [];
  const recentRedemptions = stats?.recentRedemptions || [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Users */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="glass-card p-5 rounded-2xl border border-slate-800 bg-slate-900/60 relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Total Players</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono tracking-tight">
            {Number(kpis.total_users || 0).toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 mt-2 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{kpis.active_users || 0} active in network</span>
          </div>
        </motion.div>

        {/* KPI 2: Total Points in Circulation */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="glass-card p-5 rounded-2xl border border-slate-800 bg-slate-900/60 relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Points In Circulation</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-300 font-mono tracking-tight">
            {Number(kpis.total_points_circulation || 0).toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-2">
            <span>{Number(kpis.total_points_earned || 0).toLocaleString()} all-time earned</span>
          </div>
        </motion.div>

        {/* KPI 3: Cashout Volume */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="glass-card p-5 rounded-2xl border border-slate-800 bg-slate-900/60 relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Paid Out Rewards</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
            ${Number(kpis.total_paid_usd || 0).toFixed(2)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-amber-400 mt-2 font-medium">
            <span>{kpis.pending_redemptions || 0} cashouts awaiting approval</span>
          </div>
        </motion.div>

        {/* KPI 4: Total Game Plays */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="glass-card p-5 rounded-2xl border border-slate-800 bg-slate-900/60 relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Total Game Plays</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center">
              <Gamepad2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-300 font-mono tracking-tight">
            {Number(kpis.total_plays || 0).toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-2">
            <span>{kpis.active_games || 0} live games available</span>
          </div>
        </motion.div>
      </div>

      {/* Analytics Chart */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 bg-slate-900/60">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-bold text-white m-0 flex items-center gap-2">
              <span>Play Sessions & Rewards Minted</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
                Last 7 Days
              </span>
            </h3>
            <p className="text-xs text-slate-400 m-0 mt-0.5">Proof-of-play session volume versus points granted</p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0f172a', 
                  borderColor: '#334155', 
                  borderRadius: '12px', 
                  fontSize: '12px', 
                  color: '#fff' 
                }} 
              />
              <Area type="monotone" dataKey="points" name="Points Minted" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorPoints)" />
              <Area type="monotone" dataKey="sessions" name="Sessions" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorSessions)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid: Top Games + Recent Redemptions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Played Games */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white m-0 flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Top Played Games</span>
            </h3>
            <button
              onClick={() => onSelectTab('games')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 cursor-pointer"
            >
              <span>View Library</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5 flex-1">
            {topGames.map((g) => (
              <div 
                key={g.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 hover:bg-slate-950/80 border border-slate-800/80 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={g.thumbnail_url || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=100'}
                    alt={g.title}
                    className="w-10 h-10 rounded-lg object-cover border border-slate-700 shrink-0"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-white m-0">{g.title}</h4>
                    <span className="text-[11px] text-slate-400">
                      {g.reward_rate} pts/min • {g.category_name || 'Arcade'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-cyan-400 block">
                      {Number(g.play_count).toLocaleString()} plays
                    </span>
                    <span className="text-[10px] text-amber-400">★ {g.rating}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onTestGame(g)}
                    className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition-colors cursor-pointer"
                    title="Launch Test Simulator"
                  >
                    <Play className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Payout / Redemption Requests */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white m-0 flex items-center gap-2">
              <Banknote className="w-4 h-4 text-emerald-400" />
              <span>Recent Cashout Requests</span>
            </h3>
            <button
              onClick={() => onSelectTab('redemptions')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 cursor-pointer"
            >
              <span>Manage All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5 flex-1">
            {recentRedemptions.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-4 text-center">No cashout requests pending.</p>
            ) : (
              recentRedemptions.map((r) => (
                <div 
                  key={r.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 text-xs"
                >
                  <div>
                    <div className="font-bold text-white flex items-center gap-2">
                      <span>{r.reward_title}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full uppercase font-bold ${
                        r.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                        r.status === 'approved' ? 'bg-cyan-500/20 text-cyan-400' :
                        r.status === 'paid' ? 'bg-emerald-500/20 text-emerald-400' :
                        'bg-rose-500/20 text-rose-400'
                      }`}>
                        {r.status}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {r.username} • {r.payout_details}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      ${Number(r.cash_value_usd).toFixed(2)}
                    </span>
                    {r.status === 'pending' && (
                      <div className="flex gap-1 ml-1">
                        <button
                          type="button"
                          onClick={() => handleApproveRedemption(r.id)}
                          className="p-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 cursor-pointer"
                          title="Approve"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRejectRedemption(r.id)}
                          className="p-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 cursor-pointer"
                          title="Reject"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
