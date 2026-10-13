import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Save,
  CheckCircle2,
  Sliders,
  DollarSign,
  Shield,
  Zap,
  Smartphone,
  Radio,
  ExternalLink,
  AlertTriangle,
  Send,
  Eye
} from 'lucide-react';
import { getSettings, updateSettings } from '../services/api';
import { useAlert } from '../context/AlertContext';

export default function SettingsView() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  const { success, error, info } = useAlert();

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await getSettings();
      if (res.success) setSettings(res.settings);
    } catch (err) {
      error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (key, val) => {
    setSettings(prev => prev.map(s => s.setting_key === key ? { ...s, setting_value: val } : s));
  };

  const getSettingVal = (key) => {
    return settings.find(s => s.setting_key === key)?.setting_value || '';
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      await updateSettings(settings);
      success('System variables successfully updated & broadcasted.');
    } catch (err) {
      error('Save failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleBroadcastUpdate = async () => {
    setSaving(true);
    try {
      await updateSettings(settings);
      success('Immediate Force Update push notification broadcasted to all connected mobile devices!');
    } catch (err) {
      error('Broadcast failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Group settings
  const appSettings = settings.filter(s => s.setting_key.startsWith('app_'));
  const economySettings = settings.filter(s =>
    ['points_per_usd', 'min_payout_points', 'daily_max_points_global', 'ad_video_reward_pts', 'ad_reward_cooldown_sec'].includes(s.setting_key)
  );
  const securitySettings = settings.filter(s =>
    ['ping_interval_seconds', 'maintenance_mode', 'google_play_disclaimer'].includes(s.setting_key)
  );
  const otherSettings = settings.filter(s =>
    !appSettings.includes(s) && !economySettings.includes(s) && !securitySettings.includes(s)
  );

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white m-0 flex items-center gap-2">
            <Settings className="w-5 h-5 text-cyan-400" />
            <span>App Version & Platform Control</span>
          </h2>
          <p className="text-xs text-slate-400 m-0 mt-0.5">
            Manage Android app updates, forced update enforcement, and Google Play ad economy
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPreviewModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Eye className="w-4 h-4 text-cyan-400" />
            <span>Preview Update Modal</span>
          </button>

          <button
            type="button"
            onClick={handleBroadcastUpdate}
            disabled={saving || loading}
            className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Radio className="w-4 h-4 animate-pulse" />
            <span>Broadcast Push</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Mobile App Version & Forced Update Guard */}
        <div className="glass-card rounded-2xl border border-cyan-500/30 bg-slate-900/80 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-cyan-400" />
              <div>
                <h3 className="text-sm font-bold text-white m-0">In-App Update & Force Update Engine</h3>
                <p className="text-[11px] text-slate-400 m-0">Enforces Android version compliance across client devices</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                getSettingVal('app_force_update') === 'true'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {getSettingVal('app_force_update') === 'true' ? 'FORCED UPDATE ENFORCED' : 'OPTIONAL UPDATES'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {appSettings.map((s) => (
              <div
                key={s.setting_key}
                className={`p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 ${
                  s.setting_type === 'textarea' ? 'md:col-span-2' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-1.5">
                  <label className="text-xs font-bold text-white block">
                    {s.setting_label || s.setting_key}
                  </label>
                  <span className="text-[10px] text-cyan-400/80 font-mono">
                    {s.setting_key}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">
                  {s.description}
                </p>

                {s.setting_type === 'boolean' ? (
                  <select
                    value={s.setting_value}
                    onChange={(e) => handleChange(s.setting_key, e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs font-medium focus:border-cyan-400 outline-none"
                  >
                    <option value="false">False (Allow users on older versions)</option>
                    <option value="true">True (Lock app with Mandatory Update Modal)</option>
                  </select>
                ) : s.setting_type === 'textarea' ? (
                  <textarea
                    rows={4}
                    value={s.setting_value}
                    onChange={(e) => handleChange(s.setting_key, e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs font-mono focus:border-cyan-400 outline-none resize-none leading-relaxed"
                  />
                ) : (
                  <input
                    type={s.setting_type === 'number' ? 'number' : 'text'}
                    value={s.setting_value}
                    onChange={(e) => handleChange(s.setting_key, e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs font-mono focus:border-cyan-400 outline-none"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Google Play Sustainable Economy */}
        <div className="glass-card rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <DollarSign className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-white m-0">Google Play Loyalty Rewards Economy</h3>
              <p className="text-[11px] text-slate-400 m-0">Calibrated to ensure ad revenue significantly exceeds cashout costs</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {economySettings.map((s) => (
              <div key={s.setting_key} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <label className="text-xs font-bold text-white block mb-0.5">
                  {s.setting_label || s.setting_key}
                </label>
                <p className="text-[11px] text-slate-400 mb-2">{s.description}</p>
                <input
                  type={s.setting_type === 'number' ? 'number' : 'text'}
                  value={s.setting_value}
                  onChange={(e) => handleChange(s.setting_key, e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs font-mono focus:border-amber-400 outline-none"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Anti-Cheat & System Flags */}
        <div className="glass-card rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Shield className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-white m-0">Anti-Cheat Proof-of-Play & Security Controls</h3>
              <p className="text-[11px] text-slate-400 m-0">Prevents bot tampering and enforces active session heartbeats</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {securitySettings.concat(otherSettings).map((s) => (
              <div key={s.setting_key} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <label className="text-xs font-bold text-white block mb-0.5">
                  {s.setting_label || s.setting_key}
                </label>
                <p className="text-[11px] text-slate-400 mb-2">{s.description}</p>
                {s.setting_type === 'boolean' ? (
                  <select
                    value={s.setting_value}
                    onChange={(e) => handleChange(s.setting_key, e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs font-medium focus:border-emerald-400 outline-none"
                  >
                    <option value="false">Disabled / Normal Mode</option>
                    <option value="true">Enabled / Maintenance Active</option>
                  </select>
                ) : (
                  <input
                    type={s.setting_type === 'number' ? 'number' : 'text'}
                    value={s.setting_value}
                    onChange={(e) => handleChange(s.setting_key, e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs font-mono focus:border-emerald-400 outline-none"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving || loading}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Applying System Configuration...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>

      {/* Simulated Preview Modal of Mobile App Update Screen */}
      {previewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-rose-500/40 rounded-3xl overflow-hidden shadow-2xl">
            {/* Red Gradient Banner */}
            <div className="bg-gradient-to-r from-rose-600 to-red-700 p-5 text-white">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-black/30">
                  ACTION REQUIRED
                </span>
              </div>
              <h4 className="text-xl font-extrabold m-0">Update Required</h4>
              <p className="text-xs text-white/80 mt-1 m-0">
                A critical update is necessary to continue earning points.
              </p>
            </div>

            <div className="p-5 space-y-4">
              {/* Version Box */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-xs">
                <div className="text-center">
                  <span className="text-slate-400 text-[10px] block">Installed</span>
                  <span className="text-rose-400 font-bold">v1.0.0</span>
                </div>
                <span className="text-slate-500 font-bold">→</span>
                <div className="text-center">
                  <span className="text-slate-400 text-[10px] block">Target</span>
                  <span className="text-emerald-400 font-bold">v{getSettingVal('app_latest_version') || '1.1.0'}</span>
                </div>
              </div>

              {/* Release Notes */}
              <div>
                <span className="text-xs font-bold text-slate-300 block mb-1">What's New:</span>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 max-h-24 overflow-y-auto whitespace-pre-line leading-relaxed font-mono">
                  {getSettingVal('app_release_notes') || '• Performance updates and bug fixes.'}
                </div>
              </div>

              {/* Action Buttons */}
              <button
                type="button"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Update on Google Play</span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-semibold text-xs border border-slate-700 cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
