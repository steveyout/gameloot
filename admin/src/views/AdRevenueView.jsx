import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tv, DollarSign, ShieldCheck, Play, Save, CheckCircle2,
  Sparkles, TrendingUp, AlertTriangle, Layers, Smartphone,
  Power, Settings2, Globe, Shield, RefreshCw, Plus, Edit2,
  Trash2, X, Check, Sliders, ExternalLink, Zap, Network,
  Cpu, Award, Database, ToggleLeft, ToggleRight
} from 'lucide-react';
import {
  getAdminAdConfig,
  updateAdminAdConfig,
  toggleGlobalAds,
  createAdPlacement,
  updateAdPlacement,
  deleteAdPlacement
} from '../services/api';
import { useAlert } from '../context/AlertContext';
import confetti from 'canvas-confetti';

const PROVIDER_INFO = {
  admob: {
    name: 'Google AdMob',
    icon: 'G',
    color: 'from-amber-500 to-emerald-600',
    badge: 'Official Play Services',
    testDefaults: {
      app_id_android: 'ca-app-pub-3940256099942544~3347511713',
      app_id_ios: 'ca-app-pub-3940256099942544~1458002511',
      rewarded_unit_id: 'ca-app-pub-3940256099942544/5224354917',
      interstitial_unit_id: 'ca-app-pub-3940256099942544/1033173712',
      banner_unit_id: 'ca-app-pub-3940256099942544/6300978111',
      app_open_unit_id: 'ca-app-pub-3940256099942544/3419832817'
    }
  },
  unity: {
    name: 'Unity Ads',
    icon: 'U',
    color: 'from-blue-500 to-indigo-600',
    badge: 'Mobile Gaming Native',
    testDefaults: {
      game_id_android: '5421980',
      game_id_ios: '5421981',
      rewarded_placement_id: 'Rewarded_Android',
      interstitial_placement_id: 'Interstitial_Android',
      banner_placement_id: 'Banner_Android'
    }
  },
  applovin: {
    name: 'AppLovin MAX',
    icon: 'M',
    color: 'from-purple-500 to-pink-600',
    badge: 'Real-Time Bidding',
    testDefaults: {
      sdk_key: 'applovin_max_demo_key_382109',
      rewarded_unit_id: 'max_rewarded_unit_01',
      interstitial_unit_id: 'max_interstitial_unit_01',
      banner_unit_id: 'max_banner_unit_01'
    }
  },
  ironsource: {
    name: 'ironSource (LevelPlay)',
    icon: 'i',
    color: 'from-cyan-500 to-blue-600',
    badge: 'LevelPlay Mediation',
    testDefaults: {
      app_key: 'ironsource_demo_key_918237',
      rewarded_instance: 'DefaultRewardedVideo',
      interstitial_instance: 'DefaultInterstitial',
      banner_instance: 'DefaultBanner'
    }
  },
  meta: {
    name: 'Meta Audience Network',
    icon: '∞',
    color: 'from-blue-600 to-cyan-500',
    badge: 'Facebook / Meta Network',
    testDefaults: {
      app_id: 'meta_demo_app_192837465',
      rewarded_placement_id: 'VID_HD_16_9_15S_REQ_APP_INSTALL#YOUR_PLACEMENT_ID',
      interstitial_placement_id: 'IMG_16_9_APP_INSTALL#YOUR_PLACEMENT_ID',
      banner_placement_id: 'IMG_16_9_APP_INSTALL#YOUR_PLACEMENT_ID'
    }
  },
  mintegral: {
    name: 'Mintegral',
    icon: 'M',
    color: 'from-emerald-500 to-teal-600',
    badge: 'Global Programmatic',
    testDefaults: {
      app_id: '118692',
      app_key: 'ef7673e44a9e4092b7754320',
      rewarded_unit_id: 'unit_mintegral_rewarded_01',
      interstitial_unit_id: 'unit_mintegral_interstitial_01',
      banner_unit_id: 'unit_mintegral_banner_01'
    }
  }
};

export default function AdRevenueView() {
  const [config, setConfig] = useState(null);
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingGlobal, setTogglingGlobal] = useState(false);
  const [activeProviderTab, setActiveProviderTab] = useState('admob');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Placements modal states
  const [editPlacementModal, setEditPlacementModal] = useState(null);
  const [newPlacementModal, setNewPlacementModal] = useState(false);
  const [newPlacementData, setNewPlacementData] = useState({
    placement_key: '',
    name: '',
    ad_type: 'rewarded_video',
    ad_unit_id_android: '',
    cooldown_seconds: 60,
    daily_cap: 15,
    reward_points: 3,
    est_ecpm_usd: 15.00,
    is_active: true
  });

  // Simulator state
  const [simulatingAd, setSimulatingAd] = useState(null);
  const [adCountdown, setAdCountdown] = useState(5);

  const { success, error } = useAlert();

  const fetchAdSystem = async () => {
    try {
      setLoading(true);
      const res = await getAdminAdConfig();
      if (res.success) {
        setConfig(res.config);
        setPlacements(res.placements || []);
        setHasUnsavedChanges(false);
      }
    } catch (err) {
      error(err.message || 'Failed to fetch ad configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdSystem();
  }, []);

  // Quick Global Master Toggle (Enable or Disable all ads)
  const handleToggleGlobalAds = async () => {
    if (!config) return;
    const nextState = !config.ads_enabled;
    try {
      setTogglingGlobal(true);
      const res = await toggleGlobalAds(nextState);
      if (res.success) {
        setConfig(prev => ({ ...prev, ads_enabled: nextState }));
        success(res.message);
      }
    } catch (err) {
      error(err.message || 'Failed to toggle ads');
    } finally {
      setTogglingGlobal(false);
    }
  };

  // Save all config changes
  const handleSaveConfig = async () => {
    if (!config) return;
    try {
      setSaving(true);
      const res = await updateAdminAdConfig(config);
      if (res.success) {
        success('Ad system settings and provider credentials saved successfully!');
        setHasUnsavedChanges(false);
      }
    } catch (err) {
      error(err.message || 'Failed to save ad configuration');
    } finally {
      setSaving(false);
    }
  };

  // Update nested provider config field
  const handleUpdateProvider = (providerKey, field, value) => {
    setConfig(prev => {
      const updatedProviders = { ...prev.providers };
      updatedProviders[providerKey] = {
        ...updatedProviders[providerKey],
        [field]: value
      };
      return {
        ...prev,
        providers: updatedProviders
      };
    });
    setHasUnsavedChanges(true);
  };

  // Auto-fill official test IDs for a provider
  const handleFillTestCredentials = (providerKey) => {
    const info = PROVIDER_INFO[providerKey];
    if (!info || !info.testDefaults) return;
    setConfig(prev => {
      const updatedProviders = { ...prev.providers };
      updatedProviders[providerKey] = {
        ...updatedProviders[providerKey],
        ...info.testDefaults,
        test_mode: true
      };
      return {
        ...prev,
        providers: updatedProviders
      };
    });
    setHasUnsavedChanges(true);
    success(`Applied official test IDs for ${info.name}`);
  };

  // Toggle placement active status directly
  const handleTogglePlacement = async (p) => {
    try {
      const nextActive = !p.is_active;
      await updateAdPlacement(p.id, { is_active: nextActive });
      setPlacements(prev => prev.map(item => item.id === p.id ? { ...item, is_active: nextActive } : item));
      success(`Placement "${p.name}" is now ${nextActive ? 'Active' : 'Disabled'}.`);
    } catch (err) {
      error(err.message || 'Failed to toggle placement');
    }
  };

  // Save placement edit
  const handleSavePlacementEdit = async (e) => {
    e.preventDefault();
    if (!editPlacementModal) return;
    try {
      await updateAdPlacement(editPlacementModal.id, editPlacementModal);
      success('Placement updated.');
      setEditPlacementModal(null);
      fetchAdSystem();
    } catch (err) {
      error(err.message || 'Failed to update placement');
    }
  };

  // Create placement
  const handleCreatePlacement = async (e) => {
    e.preventDefault();
    try {
      const res = await createAdPlacement(newPlacementData);
      if (res.success) {
        success('New ad placement created successfully!');
        setNewPlacementModal(false);
        setNewPlacementData({
          placement_key: '',
          name: '',
          ad_type: 'rewarded_video',
          ad_unit_id_android: '',
          cooldown_seconds: 60,
          daily_cap: 15,
          reward_points: 3,
          est_ecpm_usd: 15.00,
          is_active: true
        });
        fetchAdSystem();
      }
    } catch (err) {
      error(err.message || 'Failed to create placement');
    }
  };

  // Delete placement
  const handleDeletePlacement = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ad placement "${name}"?`)) return;
    try {
      await deleteAdPlacement(id);
      success(`Ad placement "${name}" deleted.`);
      setPlacements(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      error(err.message || 'Failed to delete placement');
    }
  };

  // Simulator
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

  if (loading || !config) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center p-8 text-slate-400 gap-3">
        <div className="w-10 h-10 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Loading Ad Engine Config...</span>
      </div>
    );
  }

  const currentProvider = config.providers[activeProviderTab] || {};
  const currentProviderInfo = PROVIDER_INFO[activeProviderTab] || {};

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Top Master Controller Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-2xl p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
                <Tv className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white m-0 tracking-tight flex items-center gap-2.5">
                  <span>Ad Networks & Revenue Economics</span>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                    config.ads_enabled
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}>
                    {config.ads_enabled ? '● Live Serving' : '○ Disabled'}
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 m-0">
                  Manage global master switches, mediation providers (AdMob, Unity, AppLovin, ironSource), unit IDs & points payout
                </p>
              </div>
            </div>
          </div>

          {/* Master Switch & Save Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Global Master Enable/Disable Button */}
            <button
              type="button"
              onClick={handleToggleGlobalAds}
              disabled={togglingGlobal}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-lg cursor-pointer border ${
                config.ads_enabled
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-400 shadow-emerald-500/20'
                  : 'bg-rose-500 hover:bg-rose-400 text-white border-rose-400 shadow-rose-500/20'
              }`}
            >
              <Power className="w-4 h-4" />
              <span>{config.ads_enabled ? 'Ads ENABLED (Global)' : 'Ads DISABLED (Global)'}</span>
            </button>

            {/* Test Mode Toggle */}
            <button
              type="button"
              onClick={() => {
                setConfig(prev => ({ ...prev, test_mode: !prev.test_mode }));
                setHasUnsavedChanges(true);
              }}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
                config.test_mode
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>{config.test_mode ? 'Test Mode: ON' : 'Production Mode'}</span>
            </button>

            {/* Save Config Changes */}
            <button
              type="button"
              onClick={handleSaveConfig}
              disabled={saving}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                hasUnsavedChanges
                  ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/30 animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : hasUnsavedChanges ? 'Save Changes *' : 'Save Config'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Financial Sustainability Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 shadow-md">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-bold mb-1">
            <span className="flex items-center gap-1.5"><TrendingUp className="w-4 h-4" /> Gross Profit Margin</span>
            <span className="text-[10px] font-mono bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-300">Sustainable</span>
          </div>
          <div className="text-2xl font-black text-white font-mono">~75% - 85%</div>
          <p className="text-[11px] text-slate-400 mt-1">
            Rewarded video earns ~$0.015 (eCPM $15) vs user reward cost ~$0.002 (2-3 PTS).
          </p>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-cyan-500/30 bg-cyan-950/20 shadow-md">
          <div className="flex items-center justify-between text-cyan-400 text-xs font-bold mb-1">
            <span className="flex items-center gap-1.5"><Network className="w-4 h-4" /> Primary Network</span>
            <span className="text-[10px] uppercase font-mono bg-cyan-500/20 px-2 py-0.5 rounded text-cyan-300">{config.primary_provider}</span>
          </div>
          <div className="text-xl font-black text-white capitalize">{PROVIDER_INFO[config.primary_provider]?.name || config.primary_provider}</div>
          <p className="text-[11px] text-slate-400 mt-1">
            Fallback waterfall routes to <strong>{PROVIDER_INFO[config.fallback_provider]?.name || config.fallback_provider}</strong>.
          </p>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-amber-500/30 bg-amber-950/20 shadow-md">
          <div className="flex items-center justify-between text-amber-400 text-xs font-bold mb-1">
            <span className="flex items-center gap-1.5"><DollarSign className="w-4 h-4" /> Max User Daily Liability</span>
            <span className="text-[10px] font-mono bg-amber-500/20 px-2 py-0.5 rounded text-amber-300">Cap</span>
          </div>
          <div className="text-2xl font-black text-white font-mono">${((config.daily_cap_per_user * config.rewarded_pts) / 1000).toFixed(2)} / User</div>
          <p className="text-[11px] text-slate-400 mt-1">
            {config.daily_cap_per_user} views × {config.rewarded_pts} PTS prevents bot exploits from draining payout pool.
          </p>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-purple-500/30 bg-purple-950/20 shadow-md">
          <div className="flex items-center justify-between text-purple-400 text-xs font-bold mb-1">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4" /> Google Play Policy</span>
            <span className="text-[10px] font-mono bg-purple-500/20 px-2 py-0.5 rounded text-purple-300">Verified</span>
          </div>
          <div className="text-2xl font-black text-white font-mono">{config.global_cooldown_sec}s Cooldown</div>
          <p className="text-[11px] text-slate-400 mt-1">
            Mandatory spacing between ad requests prevents deceptive app spam strikes.
          </p>
        </div>
      </div>

      {/* Global Routing & Economics Controls */}
      <div className="glass-card rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white m-0">Ad Mediation Routing & Reward Economics</h3>
          </div>
          <span className="text-xs text-slate-400">Settings apply across Android & Web</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Primary Network</label>
            <select
              value={config.primary_provider}
              onChange={(e) => {
                setConfig(prev => ({ ...prev, primary_provider: e.target.value }));
                setHasUnsavedChanges(true);
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="admob">Google AdMob (Recommended)</option>
              <option value="unity">Unity Ads</option>
              <option value="applovin">AppLovin MAX</option>
              <option value="ironsource">ironSource (LevelPlay)</option>
              <option value="meta">Meta Audience Network</option>
              <option value="mintegral">Mintegral</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Fallback Network</label>
            <select
              value={config.fallback_provider}
              onChange={(e) => {
                setConfig(prev => ({ ...prev, fallback_provider: e.target.value }));
                setHasUnsavedChanges(true);
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="unity">Unity Ads (Recommended Fallback)</option>
              <option value="admob">Google AdMob</option>
              <option value="applovin">AppLovin MAX</option>
              <option value="ironsource">ironSource (LevelPlay)</option>
              <option value="meta">Meta Audience Network</option>
              <option value="mintegral">Mintegral</option>
              <option value="none">None (No Fallback)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Rewarded Video Points</label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="50"
                value={config.rewarded_pts}
                onChange={(e) => {
                  setConfig(prev => ({ ...prev, rewarded_pts: parseInt(e.target.value || '1', 10) }));
                  setHasUnsavedChanges(true);
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-amber-400 focus:outline-none focus:border-cyan-500"
              />
              <span className="absolute right-3 top-2 text-[10px] text-slate-400 font-mono">PTS/ad</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Global Cooldown</label>
            <div className="relative">
              <input
                type="number"
                min="10"
                max="600"
                value={config.global_cooldown_sec}
                onChange={(e) => {
                  setConfig(prev => ({ ...prev, global_cooldown_sec: parseInt(e.target.value || '60', 10) }));
                  setHasUnsavedChanges(true);
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-cyan-500"
              />
              <span className="absolute right-3 top-2 text-[10px] text-slate-400 font-mono">seconds</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Daily Cap per Player</label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="100"
                value={config.daily_cap_per_user}
                onChange={(e) => {
                  setConfig(prev => ({ ...prev, daily_cap_per_user: parseInt(e.target.value || '10', 10) }));
                  setHasUnsavedChanges(true);
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-cyan-500"
              />
              <span className="absolute right-3 top-2 text-[10px] text-slate-400 font-mono">views/day</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ad Providers Multi-Network Manager */}
      <div className="glass-card rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white m-0 flex items-center gap-2">
              <Network className="w-4 h-4 text-emerald-400" />
              <span>Supported Ad Providers & SDK Credentials</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Configure credentials, unit IDs, placement keys, and test modes for each partner network
            </p>
          </div>

          {/* Provider Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {Object.keys(PROVIDER_INFO).map((key) => {
              const prov = config.providers[key] || {};
              const info = PROVIDER_INFO[key];
              const isSelected = activeProviderTab === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveProviderTab(key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer border ${
                    isSelected
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-800'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${prov.enabled ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                  <span>{info.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Provider Form */}
        <div className="p-5 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${currentProviderInfo.color} flex items-center justify-center font-black text-white text-xl shadow-lg`}>
                {currentProviderInfo.icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold text-white m-0">{currentProviderInfo.name}</h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {currentProviderInfo.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{currentProvider.notes || currentProvider.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Provider Enable / Disable Switch */}
              <button
                type="button"
                onClick={() => handleUpdateProvider(activeProviderTab, 'enabled', !currentProvider.enabled)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  currentProvider.enabled
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                }`}
              >
                {currentProvider.enabled ? <ToggleRight className="w-4 h-4 text-emerald-400" /> : <ToggleLeft className="w-4 h-4 text-slate-500" />}
                <span>{currentProvider.enabled ? 'Provider Enabled' : 'Provider Disabled'}</span>
              </button>

              {/* Load Test IDs Helper Button */}
              <button
                type="button"
                onClick={() => handleFillTestCredentials(activeProviderTab)}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                title="Fill official Google/Unity/AppLovin test IDs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Fill Test IDs</span>
              </button>
            </div>
          </div>

          {/* Provider Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* AdMob Specific Inputs */}
            {activeProviderTab === 'admob' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Android App ID</label>
                  <input
                    type="text"
                    value={currentProvider.app_id_android || ''}
                    onChange={(e) => handleUpdateProvider('admob', 'app_id_android', e.target.value)}
                    placeholder="ca-app-pub-XXXXX~XXXXX"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">iOS App ID (Optional)</label>
                  <input
                    type="text"
                    value={currentProvider.app_id_ios || ''}
                    onChange={(e) => handleUpdateProvider('admob', 'app_id_ios', e.target.value)}
                    placeholder="ca-app-pub-XXXXX~XXXXX"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Rewarded Video Unit ID</label>
                  <input
                    type="text"
                    value={currentProvider.rewarded_unit_id || ''}
                    onChange={(e) => handleUpdateProvider('admob', 'rewarded_unit_id', e.target.value)}
                    placeholder="ca-app-pub-XXXXX/XXXXX"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-emerald-400 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Interstitial Ad Unit ID</label>
                  <input
                    type="text"
                    value={currentProvider.interstitial_unit_id || ''}
                    onChange={(e) => handleUpdateProvider('admob', 'interstitial_unit_id', e.target.value)}
                    placeholder="ca-app-pub-XXXXX/XXXXX"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Banner Ad Unit ID</label>
                  <input
                    type="text"
                    value={currentProvider.banner_unit_id || ''}
                    onChange={(e) => handleUpdateProvider('admob', 'banner_unit_id', e.target.value)}
                    placeholder="ca-app-pub-XXXXX/XXXXX"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">App Open Unit ID</label>
                  <input
                    type="text"
                    value={currentProvider.app_open_unit_id || ''}
                    onChange={(e) => handleUpdateProvider('admob', 'app_open_unit_id', e.target.value)}
                    placeholder="ca-app-pub-XXXXX/XXXXX"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </>
            )}

            {/* Unity Specific Inputs */}
            {activeProviderTab === 'unity' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Android Game ID</label>
                  <input
                    type="text"
                    value={currentProvider.game_id_android || ''}
                    onChange={(e) => handleUpdateProvider('unity', 'game_id_android', e.target.value)}
                    placeholder="e.g. 5421980"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">iOS Game ID</label>
                  <input
                    type="text"
                    value={currentProvider.game_id_ios || ''}
                    onChange={(e) => handleUpdateProvider('unity', 'game_id_ios', e.target.value)}
                    placeholder="e.g. 5421981"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Rewarded Placement ID</label>
                  <input
                    type="text"
                    value={currentProvider.rewarded_placement_id || ''}
                    onChange={(e) => handleUpdateProvider('unity', 'rewarded_placement_id', e.target.value)}
                    placeholder="Rewarded_Android"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-emerald-400 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Interstitial Placement ID</label>
                  <input
                    type="text"
                    value={currentProvider.interstitial_placement_id || ''}
                    onChange={(e) => handleUpdateProvider('unity', 'interstitial_placement_id', e.target.value)}
                    placeholder="Interstitial_Android"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Banner Placement ID</label>
                  <input
                    type="text"
                    value={currentProvider.banner_placement_id || ''}
                    onChange={(e) => handleUpdateProvider('unity', 'banner_placement_id', e.target.value)}
                    placeholder="Banner_Android"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </>
            )}

            {/* AppLovin MAX Inputs */}
            {activeProviderTab === 'applovin' && (
              <>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">AppLovin SDK Key</label>
                  <input
                    type="text"
                    value={currentProvider.sdk_key || ''}
                    onChange={(e) => handleUpdateProvider('applovin', 'sdk_key', e.target.value)}
                    placeholder="Enter AppLovin SDK Key from MAX Dashboard"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Rewarded Ad Unit ID</label>
                  <input
                    type="text"
                    value={currentProvider.rewarded_unit_id || ''}
                    onChange={(e) => handleUpdateProvider('applovin', 'rewarded_unit_id', e.target.value)}
                    placeholder="e.g. max_rewarded_unit_01"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-emerald-400 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Interstitial Ad Unit ID</label>
                  <input
                    type="text"
                    value={currentProvider.interstitial_unit_id || ''}
                    onChange={(e) => handleUpdateProvider('applovin', 'interstitial_unit_id', e.target.value)}
                    placeholder="e.g. max_interstitial_unit_01"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Banner Ad Unit ID</label>
                  <input
                    type="text"
                    value={currentProvider.banner_unit_id || ''}
                    onChange={(e) => handleUpdateProvider('applovin', 'banner_unit_id', e.target.value)}
                    placeholder="e.g. max_banner_unit_01"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </>
            )}

            {/* ironSource Inputs */}
            {activeProviderTab === 'ironsource' && (
              <>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">ironSource App Key</label>
                  <input
                    type="text"
                    value={currentProvider.app_key || ''}
                    onChange={(e) => handleUpdateProvider('ironsource', 'app_key', e.target.value)}
                    placeholder="Enter ironSource App Key"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Rewarded Video Instance</label>
                  <input
                    type="text"
                    value={currentProvider.rewarded_instance || ''}
                    onChange={(e) => handleUpdateProvider('ironsource', 'rewarded_instance', e.target.value)}
                    placeholder="DefaultRewardedVideo"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-emerald-400 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Interstitial Instance</label>
                  <input
                    type="text"
                    value={currentProvider.interstitial_instance || ''}
                    onChange={(e) => handleUpdateProvider('ironsource', 'interstitial_instance', e.target.value)}
                    placeholder="DefaultInterstitial"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Banner Instance</label>
                  <input
                    type="text"
                    value={currentProvider.banner_instance || ''}
                    onChange={(e) => handleUpdateProvider('ironsource', 'banner_instance', e.target.value)}
                    placeholder="DefaultBanner"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </>
            )}

            {/* Meta Audience Network Inputs */}
            {activeProviderTab === 'meta' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Meta App ID</label>
                  <input
                    type="text"
                    value={currentProvider.app_id || ''}
                    onChange={(e) => handleUpdateProvider('meta', 'app_id', e.target.value)}
                    placeholder="Enter Meta App ID"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Rewarded Placement ID</label>
                  <input
                    type="text"
                    value={currentProvider.rewarded_placement_id || ''}
                    onChange={(e) => handleUpdateProvider('meta', 'rewarded_placement_id', e.target.value)}
                    placeholder="VID_HD_16_9_15S_REQ_APP_INSTALL#PLACEMENT_ID"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-emerald-400 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Interstitial Placement ID</label>
                  <input
                    type="text"
                    value={currentProvider.interstitial_placement_id || ''}
                    onChange={(e) => handleUpdateProvider('meta', 'interstitial_placement_id', e.target.value)}
                    placeholder="IMG_16_9_APP_INSTALL#PLACEMENT_ID"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </>
            )}

            {/* Mintegral Inputs */}
            {activeProviderTab === 'mintegral' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Mintegral App ID</label>
                  <input
                    type="text"
                    value={currentProvider.app_id || ''}
                    onChange={(e) => handleUpdateProvider('mintegral', 'app_id', e.target.value)}
                    placeholder="e.g. 118692"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Mintegral App Key</label>
                  <input
                    type="text"
                    value={currentProvider.app_key || ''}
                    onChange={(e) => handleUpdateProvider('mintegral', 'app_key', e.target.value)}
                    placeholder="e.g. ef7673e44a9e4092b7754320"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Rewarded Unit ID</label>
                  <input
                    type="text"
                    value={currentProvider.rewarded_unit_id || ''}
                    onChange={(e) => handleUpdateProvider('mintegral', 'rewarded_unit_id', e.target.value)}
                    placeholder="unit_mintegral_rewarded_01"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-emerald-400 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Ad Placements Inventory Section */}
      <div className="glass-card rounded-2xl border border-slate-800/80 bg-slate-900/60 overflow-hidden shadow-md">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white m-0 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Ad Placements Inventory ({placements.length})</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Enable, disable, or adjust points rewards and daily caps for specific touchpoints
            </p>
          </div>

          <button
            type="button"
            onClick={() => setNewPlacementModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-cyan-500/20 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Placement</span>
          </button>
        </div>

        <div className="divide-y divide-slate-800/60">
          {placements.map((p) => {
            const estRev = (parseFloat(p.est_ecpm_usd || 15) / 1000);
            const cost = (parseInt(p.reward_points || 0, 10) / 1000);
            const margin = estRev > 0 ? Math.round(((estRev - cost) / estRev) * 100) : 100;

            return (
              <div
                key={p.id}
                className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                  p.is_active ? 'hover:bg-slate-800/20' : 'bg-slate-950/40 opacity-75'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white text-sm">{p.name}</span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                      {p.ad_type}
                    </span>

                    {/* Quick Active Toggle Button */}
                    <button
                      type="button"
                      onClick={() => handleTogglePlacement(p)}
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full transition-colors cursor-pointer border ${
                        p.is_active
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/30 hover:bg-rose-500/30'
                      }`}
                    >
                      {p.is_active ? '● Active' : '○ Disabled'}
                    </button>
                  </div>

                  <div className="text-[11px] text-slate-400 font-mono">
                    Key: <span className="text-slate-300">{p.placement_key}</span> • Unit ID: <span className="text-slate-500">{p.ad_unit_id_android || 'Default Provider Unit'}</span>
                  </div>

                  <div className="flex items-center gap-4 text-xs pt-1 text-slate-300 flex-wrap">
                    <span>Cooldown: <strong className="text-white">{p.cooldown_seconds}s</strong></span>
                    <span>Daily Cap: <strong className="text-white">{p.daily_cap} views</strong></span>
                    <span>Reward: <strong className="text-amber-400">+{p.reward_points} PTS (${(p.reward_points / 1000).toFixed(3)})</strong></span>
                    <span>Est. eCPM: <strong className="text-slate-200">${p.est_ecpm_usd}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-center">
                  <div className="text-right hidden sm:block">
                    <span className="text-[10px] text-slate-400 block uppercase">Est. Margin</span>
                    <span className={`text-sm font-mono font-bold ${margin >= 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {margin}%
                    </span>
                  </div>

                  {/* Simulate Play Button */}
                  <button
                    type="button"
                    onClick={() => handleSimulateAd(p)}
                    className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-semibold flex items-center gap-1.5 cursor-pointer border border-cyan-500/30"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Test</span>
                  </button>

                  {/* Edit Button */}
                  <button
                    type="button"
                    onClick={() => setEditPlacementModal({ ...p })}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer border border-slate-700"
                    title="Edit Placement"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleDeletePlacement(p.id, p.name)}
                    className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs cursor-pointer border border-rose-500/30"
                    title="Delete Placement"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Placement Modal */}
      {editPlacementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white m-0">Edit Ad Placement</h3>
              <button
                type="button"
                onClick={() => setEditPlacementModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePlacementEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Placement Name</label>
                <input
                  type="text"
                  value={editPlacementModal.name}
                  onChange={(e) => setEditPlacementModal({ ...editPlacementModal, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Ad Type</label>
                  <select
                    value={editPlacementModal.ad_type}
                    onChange={(e) => setEditPlacementModal({ ...editPlacementModal, ad_type: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="rewarded_video">Rewarded Video</option>
                    <option value="interstitial">Interstitial</option>
                    <option value="banner">Banner</option>
                    <option value="app_open">App Open</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Reward Points</label>
                  <input
                    type="number"
                    min="0"
                    value={editPlacementModal.reward_points}
                    onChange={(e) => setEditPlacementModal({ ...editPlacementModal, reward_points: parseInt(e.target.value || '0', 10) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Specific Unit ID (Overrides Provider Default)</label>
                <input
                  type="text"
                  value={editPlacementModal.ad_unit_id_android || ''}
                  onChange={(e) => setEditPlacementModal({ ...editPlacementModal, ad_unit_id_android: e.target.value })}
                  placeholder="e.g. ca-app-pub-3940256099942544/5224354917"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Cooldown (sec)</label>
                  <input
                    type="number"
                    min="0"
                    value={editPlacementModal.cooldown_seconds}
                    onChange={(e) => setEditPlacementModal({ ...editPlacementModal, cooldown_seconds: parseInt(e.target.value || '0', 10) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Daily Cap</label>
                  <input
                    type="number"
                    min="1"
                    value={editPlacementModal.daily_cap}
                    onChange={(e) => setEditPlacementModal({ ...editPlacementModal, daily_cap: parseInt(e.target.value || '1', 10) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Est. eCPM ($)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={editPlacementModal.est_ecpm_usd}
                    onChange={(e) => setEditPlacementModal({ ...editPlacementModal, est_ecpm_usd: parseFloat(e.target.value || '0') })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="placement_active_check"
                  checked={editPlacementModal.is_active}
                  onChange={(e) => setEditPlacementModal({ ...editPlacementModal, is_active: e.target.checked })}
                  className="w-4 h-4 text-cyan-500 rounded border-slate-700"
                />
                <label htmlFor="placement_active_check" className="text-xs text-slate-300 font-semibold cursor-pointer">
                  Placement is active and enabled
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditPlacementModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-md shadow-cyan-500/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Add Placement Modal */}
      {newPlacementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white m-0">Add New Ad Placement</h3>
              <button
                type="button"
                onClick={() => setNewPlacementModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePlacement} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Unique Key</label>
                  <input
                    type="text"
                    value={newPlacementData.placement_key}
                    onChange={(e) => setNewPlacementData({ ...newPlacementData, placement_key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                    placeholder="e.g. rewarded_spin_boost"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Display Name</label>
                  <input
                    type="text"
                    value={newPlacementData.name}
                    onChange={(e) => setNewPlacementData({ ...newPlacementData, name: e.target.value })}
                    placeholder="e.g. Extra Wheel Spin Multiplier"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Ad Type</label>
                  <select
                    value={newPlacementData.ad_type}
                    onChange={(e) => setNewPlacementData({ ...newPlacementData, ad_type: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="rewarded_video">Rewarded Video</option>
                    <option value="interstitial">Interstitial</option>
                    <option value="banner">Banner</option>
                    <option value="app_open">App Open</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Reward Points</label>
                  <input
                    type="number"
                    min="0"
                    value={newPlacementData.reward_points}
                    onChange={(e) => setNewPlacementData({ ...newPlacementData, reward_points: parseInt(e.target.value || '0', 10) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Unit ID (Optional, overrides provider)</label>
                <input
                  type="text"
                  value={newPlacementData.ad_unit_id_android}
                  onChange={(e) => setNewPlacementData({ ...newPlacementData, ad_unit_id_android: e.target.value })}
                  placeholder="ca-app-pub-XXXX/XXXX"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Cooldown (sec)</label>
                  <input
                    type="number"
                    min="0"
                    value={newPlacementData.cooldown_seconds}
                    onChange={(e) => setNewPlacementData({ ...newPlacementData, cooldown_seconds: parseInt(e.target.value || '0', 10) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Daily Cap</label>
                  <input
                    type="number"
                    min="1"
                    value={newPlacementData.daily_cap}
                    onChange={(e) => setNewPlacementData({ ...newPlacementData, daily_cap: parseInt(e.target.value || '1', 10) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Est. eCPM ($)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newPlacementData.est_ecpm_usd}
                    onChange={(e) => setNewPlacementData({ ...newPlacementData, est_ecpm_usd: parseFloat(e.target.value || '0') })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setNewPlacementModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-md shadow-cyan-500/20"
                >
                  Create Placement
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Interactive Ad Simulation Testing Modal */}
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
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-bold uppercase mb-1">
                <span>Network: {PROVIDER_INFO[config.primary_provider]?.name || config.primary_provider}</span>
              </div>
              <h3 className="text-base font-bold text-white mb-0.5">{simulatingAd.name}</h3>
              <p className="text-xs text-slate-400 font-mono">{simulatingAd.placement_key}</p>
            </div>

            {adCountdown > 0 ? (
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="text-3xl font-black text-amber-400 font-mono animate-pulse">
                  {adCountdown}s
                </div>
                <span className="text-[11px] text-slate-400 block">
                  Playing 5-second simulated rewarded video impression...
                </span>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
                <span className="text-xs font-bold text-emerald-300 block">Impression Completed!</span>
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
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Close Simulator
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
