import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Globe, Link2, Image, Sparkles, Check, 
  Clock, Award, Upload, Loader2, Layers, Repeat
} from 'lucide-react';
import { uploadImage } from '../services/api';

const PRESET_SURF_TASKS = [
  {
    title: 'Steam Featured Specials & Deals',
    website_url: 'https://store.steampowered.com/specials',
    description: 'Browse the latest featured PC titles and weekly discounts on Steam community storefront.',
    thumbnail_url: 'https://images.unsplash.com/photo-1612287232230-6db174cb6e95?w=500&q=80',
    duration_seconds: 30,
    reward_points: 30,
    daily_limit: 5
  },
  {
    title: 'Epic Games Weekly Free Games Hub',
    website_url: 'https://store.epicgames.com/en-US/free-games',
    description: 'Explore this week’s rotation of free PC games and claimable community releases on Epic.',
    thumbnail_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&q=80',
    duration_seconds: 25,
    reward_points: 25,
    daily_limit: 5
  },
  {
    title: 'Indie DB Showcase & Spotlights',
    website_url: 'https://www.indiedb.com/',
    description: 'Discover trending indie games in development, creator devlogs, and upcoming alpha demos.',
    thumbnail_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500&q=80',
    duration_seconds: 45,
    reward_points: 40,
    daily_limit: 3
  },
  {
    title: 'Twitch Esports & Gaming Directory',
    website_url: 'https://www.twitch.tv/directory',
    description: 'Check out live gameplay streams, top speedrunners, and competitive gaming broadcasts.',
    thumbnail_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=500&q=80',
    duration_seconds: 30,
    reward_points: 35,
    daily_limit: 4
  }
];

export default function SurfTaskModal({ isOpen, onClose, onSave, task }) {
  const [formData, setFormData] = useState({
    title: '',
    website_url: '',
    description: '',
    thumbnail_url: '',
    duration_seconds: 30,
    reward_points: 25,
    daily_limit: 5,
    is_active: true
  });
  const [saving, setSaving] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        website_url: task.website_url || '',
        description: task.description || '',
        thumbnail_url: task.thumbnail_url || '',
        duration_seconds: task.duration_seconds || 30,
        reward_points: task.reward_points || 25,
        daily_limit: task.daily_limit || 5,
        is_active: task.is_active !== undefined ? !!task.is_active : true
      });
    } else {
      setFormData({
        title: '',
        website_url: '',
        description: '',
        thumbnail_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&q=80',
        duration_seconds: 30,
        reward_points: 25,
        daily_limit: 5,
        is_active: true
      });
    }
    setError('');
  }, [task, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleApplyPreset = (preset) => {
    setFormData(prev => ({
      ...prev,
      ...preset,
      is_active: true
    }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingThumb(true);
    setError('');

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await uploadImage(reader.result, file.name, 'surf');
        if (res.success && res.url) {
          setFormData(prev => ({ ...prev, thumbnail_url: res.url }));
        } else {
          setError(res.message || 'Image upload failed');
        }
      } catch (err) {
        setError('Upload error: ' + err.message);
      } finally {
        setUploadingThumb(false);
      }
    };
    reader.onerror = () => {
      setError('Failed reading file');
      setUploadingThumb(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.website_url) {
      setError('Title and Target Website URL are required.');
      return;
    }

    if (!formData.website_url.startsWith('http://') && !formData.website_url.startsWith('https://')) {
      setError('Website URL must start with http:// or https://');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await onSave({
        ...formData,
        duration_seconds: parseInt(formData.duration_seconds, 10) || 30,
        reward_points: parseInt(formData.reward_points, 10) || 25,
        daily_limit: parseInt(formData.daily_limit, 10) || 5
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save surf task');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60 sticky top-0 z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white m-0">
                  {task ? 'Edit Web Surfing Task' : 'Create Web Surfing Task'}
                </h3>
                <p className="text-xs text-slate-400 m-0">Configure sponsored URL, browsing timer & reward points</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Presets for new tasks */}
          {!task && (
            <div className="px-6 pt-4 pb-2 bg-slate-950/30 border-b border-slate-800/60">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Quick 1-Click Task Presets:
              </span>
              <div className="flex flex-wrap gap-2 pb-2">
                {PRESET_SURF_TASKS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-teal-950/60 text-slate-300 hover:text-teal-300 border border-slate-700 hover:border-teal-700 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3 h-3 text-teal-400" />
                    <span>{p.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {error}
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Task Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Visit Steam Community Workshop"
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 text-sm"
                required
              />
            </div>

            {/* Target Website URL */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Link2 className="w-3.5 h-3.5 text-teal-400" />
                <span>Sponsored Website / Page URL *</span>
              </label>
              <input
                type="url"
                name="website_url"
                value={formData.website_url}
                onChange={handleChange}
                placeholder="https://store.steampowered.com/..."
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 text-sm font-mono"
                required
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Target page will open inside player proof-of-browsing HUD with countdown timer.
              </span>
            </div>

            {/* Thumbnail Image (URL + File Upload) */}
            <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Image className="w-3.5 h-3.5 text-teal-400" />
                  <span>Task Thumbnail Image</span>
                </label>
                <label className="px-2.5 py-1 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors">
                  {uploadingThumb ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3 h-3" />
                      <span>Upload from Device</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploadingThumb}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="flex gap-3 items-center">
                <input
                  type="text"
                  name="thumbnail_url"
                  value={formData.thumbnail_url}
                  onChange={handleChange}
                  placeholder="https://images.unsplash.com/... or /uploads/surf/..."
                  className="flex-1 px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 text-xs font-mono"
                />
                {formData.thumbnail_url && (
                  <img
                    src={formData.thumbnail_url}
                    alt="Preview"
                    className="w-10 h-10 rounded-lg object-cover border border-slate-700 shrink-0 bg-slate-900"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                )}
              </div>
            </div>

            {/* Reward & Duration & Daily Limit */}
            <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
                <Award className="w-3.5 h-3.5" />
                <span>Task Reward & Browsing Economics</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1 flex items-center gap-1">
                    <Award className="w-3 h-3 text-amber-400" />
                    <span>Reward (PTS)</span>
                  </label>
                  <input
                    type="number"
                    name="reward_points"
                    value={formData.reward_points}
                    onChange={handleChange}
                    min="1"
                    max="1000"
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-teal-400" />
                    <span>Duration (seconds)</span>
                  </label>
                  <input
                    type="number"
                    name="duration_seconds"
                    value={formData.duration_seconds}
                    onChange={handleChange}
                    min="5"
                    max="600"
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1 flex items-center gap-1">
                    <Repeat className="w-3 h-3 text-purple-400" />
                    <span>Daily Limit / User</span>
                  </label>
                  <input
                    type="number"
                    name="daily_limit"
                    value={formData.daily_limit}
                    onChange={handleChange}
                    min="1"
                    max="50"
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Task Instructions / Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={2}
                placeholder="Browse the destination page for the timer duration to claim your points bonus..."
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 text-sm"
              />
            </div>

            {/* Status Switch */}
            <div className="pt-2">
              <label className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer transition-all ${
                formData.is_active
                  ? 'bg-teal-500/15 border-teal-500/50 text-teal-300'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
              }`}>
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="w-4 h-4 rounded text-teal-500 focus:ring-0 bg-slate-900 border-slate-700 cursor-pointer"
                />
                <span className="text-xs font-bold">Active & Published to Mobile Hub</span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || uploadingThumb}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-semibold text-xs shadow-lg shadow-teal-500/20 disabled:opacity-50 transition-all cursor-pointer flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving Task...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{task ? 'Update Surf Task' : 'Publish Surf Task'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
