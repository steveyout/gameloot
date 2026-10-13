import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Tv, DollarSign, ShieldCheck, Play, Save, CheckCircle2, 
  Sparkles, TrendingUp, AlertTriangle, Layers, Smartphone
} from 'lucide-react';
import { getAdPlacements, updateAdPlacement } from '../services/api';
import { useAlert } from '../context/AlertContext';
import confetti from 'canvas-confetti';

export default function AdRevenueView() {
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [simulatingAd, setSimulatingAd] = useState(null);
  const [adCountdown, setAdCountdown] = useState(5);

  const { success, error } = useAlert();

  const fetchPlacements = async () => {
    try {
      setLoading(true);
      const res = await getAdPlacements();
      if (res.success) setPlacements(res.placements);
    } catch (err) {
      error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlacements();
  }, []);

  const handleUpdate = async (id, updatedValues) => {
    try {
      await updateAdPlacement(id, updatedValues);
      success('AdMob configuration updated.');
      setEditingId(null);
      fetchPlacements();
    } catch (err) {
      error(err.message);
    }
  };

  const handleSimulateAd = (p) => {
    setSimulatingAd(p);
    setAdCountdown(5);
  };

  useEffect(() => {
    if (!simulatingAd || adCountdown <= 0) return;
    const timer = setInterval(() => {
      setAdCountdown(c => {
        if (c <= 1) {
          clearInterval(timer);
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [simulatingAd, adCountdown]);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header & Policy Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white m-0 flex items-center gap-2">
            <Tv className="w-5 h-5 text-emerald-400" />
            <span>Ad Revenue & Google Play AdMob Economics</span>
          </h2>
          <p className="text-xs text-slate-400 m-0 mt-0.5">
            Balanced low-reward economics ensuring ad revenue consistently exceeds player cashouts
          </p>
        </div>
      </div>

      {/* Financial Health Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/20">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>Gross Profit Margin</span>
          </div>
          <div className="text-2xl font-black text-white font-mono">~75% - 85%</div>
          <p className="text-[11px] text-slate-400 mt-1">
            Rewarded video earns ~$0.015 (eCPM $15) while user reward is only $0.002 (2-3 PTS).
          </p>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-cyan-500/30 bg-cyan-950/20">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Google Play Policy Safe</span>
          </div>
          <div className="text-2xl font-black text-white font-mono">100% Compliant</div>
          <p className="text-[11px] text-slate-400 mt-1">
            90s cooldown prevents deceptive ad spam; clear disclaimer confirms points are loyalty tokens.
          </p>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-amber-500/30 bg-amber-950/20">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold mb-1">
            <DollarSign className="w-4 h-4" />
            <span>Max User Daily Liability</span>
          </div>
          <div className="text-2xl font-black text-white font-mono">$0.12 / User / Day</div>
          <p className="text-[11px] text-slate-400 mt-1">
            120 PTS daily global cap prevents exploit scripts from draining reserves.
          </p>
        </div>
      </div>

      {/* Ad Placements List */}
      <div className="glass-card rounded-2xl border border-slate-800/80 bg-slate-900/60 overflow-hidden shadow-md">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white m-0">Configured AdMob Placements</h3>
          <span className="text-[11px] text-slate-400 font-mono">Unit IDs, eCPM, and Points</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading ad configurations...</div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {placements.map((p) => {
              const estRevenuePerImpression = (parseFloat(p.est_ecpm_usd || 15) / 1000);
              const costPerImpression = (parseInt(p.reward_points || 0, 10) / 1000); // 1,000 pts = $1
              const margin = estRevenuePerImpression > 0 
                ? Math.round(((estRevenuePerImpression - costPerImpression) / estRevenuePerImpression) * 100) 
                : 100;

              return (
                <div key={p.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-800/20 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-sm">{p.name}</span>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                        {p.ad_type}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        p.is_active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'
                      }`}>
                        {p.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 font-mono">
                      Key: <span className="text-slate-300">{p.placement_key}</span> • AdMob Unit ID: <span className="text-slate-500">{p.ad_unit_id_android}</span>
                    </div>

                    <div className="flex items-center gap-4 text-xs pt-1 text-slate-300">
                      <span>Cooldown: <strong className="text-white">{p.cooldown_seconds}s</strong></span>
                      <span>Daily Cap: <strong className="text-white">{p.daily_cap} views</strong></span>
                      <span>User Earns: <strong className="text-amber-400">+{p.reward_points} PTS (${(p.reward_points / 1000).toFixed(3)})</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end md:self-center">
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block">Est. Profit Margin</span>
                      <span className={`text-sm font-mono font-bold ${margin >= 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {margin}%
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSimulateAd(p)}
                      className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-semibold flex items-center gap-1.5 cursor-pointer border border-cyan-500/30"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Simulate Ad Play</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Ad Simulator Modal */}
      {simulatingAd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative max-w-sm w-full bg-slate-900 border border-emerald-500/40 rounded-2xl p-6 shadow-2xl text-center space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <Tv className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white mb-0.5">Simulating Google AdMob</h3>
              <p className="text-xs text-slate-400">{simulatingAd.name}</p>
            </div>

            {adCountdown > 0 ? (
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="text-3xl font-black text-amber-400 font-mono animate-pulse">
                  {adCountdown}s
                </div>
                <span className="text-[11px] text-slate-400 block">
                  Playing 5-second simulated video impression...
                </span>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
                <span className="text-xs font-bold text-emerald-300 block">Ad Completed!</span>
                <span className="text-sm font-mono font-bold text-amber-400 block">
                  Awarded: +{simulatingAd.reward_points} PTS (${(simulatingAd.reward_points / 1000).toFixed(3)})
                </span>
                <span className="text-[10px] text-slate-400 block">
                  Ad Revenue Collected: ~${(parseFloat(simulatingAd.est_ecpm_usd) / 1000).toFixed(3)} USD
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={() => setSimulatingAd(null)}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Close Simulator
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
