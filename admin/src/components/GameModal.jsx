import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gamepad2, Link2, Image, Layers, Sparkles, Check, Sliders, Smartphone, Upload, Loader2 } from 'lucide-react';
import { uploadImage } from '../services/api';

const PRESET_GAMES = [
  {
    title: 'Flappy Bird Classic HTML5',
    embed_url: 'https://flappybird.io/',
    category: 'arcade',
    orientation: 'portrait',
    reward_rate: 15,
    thumbnail_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500&q=80',
    description: 'Tap to flap through treacherous green pipes in the world-famous arcade frenzy.'
  },
  {
    title: 'Pacman HTML5 Retro',
    embed_url: 'https://freepacman.org/',
    category: 'arcade',
    orientation: 'landscape',
    reward_rate: 20,
    thumbnail_url: 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=500&q=80',
    description: 'Chomp pellets and escape ghosts in the quintessential maze chase classic.'
  },
  {
    title: 'Wordle Clone Unlimited',
    embed_url: 'https://wordplay.com/',
    category: 'puzzle',
    orientation: 'portrait',
    reward_rate: 18,
    thumbnail_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&q=80',
    description: 'Guess the secret 5-letter word in 6 attempts. Daily mental brain workout.'
  }
];

export default function GameModal({ isOpen, onClose, onSave, game, categories }) {
  const [formData, setFormData] = useState({
    title: '',
    category_id: '',
    description: '',
    thumbnail_url: '',
    banner_url: '',
    embed_url: '',
    orientation: 'any',
    reward_rate: 15,
    max_daily_reward: 500,
    min_play_seconds: 30,
    featured: false,
    is_active: true
  });
  const [saving, setSaving] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (game) {
      setFormData({
        title: game.title || '',
        category_id: game.category_id || '',
        description: game.description || '',
        thumbnail_url: game.thumbnail_url || '',
        banner_url: game.banner_url || '',
        embed_url: game.embed_url || '',
        orientation: game.orientation || 'any',
        reward_rate: game.reward_rate || 15,
        max_daily_reward: game.max_daily_reward || 500,
        min_play_seconds: game.min_play_seconds || 30,
        featured: !!game.featured,
        is_active: game.is_active !== undefined ? !!game.is_active : true
      });
    } else {
      setFormData({
        title: '',
        category_id: categories?.[0]?.id || '',
        description: '',
        thumbnail_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500&q=80',
        banner_url: '',
        embed_url: '',
        orientation: 'any',
        reward_rate: 15,
        max_daily_reward: 500,
        min_play_seconds: 30,
        featured: false,
        is_active: true
      });
    }
    setError('');
  }, [game, categories, isOpen]);

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
      title: preset.title,
      embed_url: preset.embed_url,
      orientation: preset.orientation,
      reward_rate: preset.reward_rate,
      thumbnail_url: preset.thumbnail_url,
      description: preset.description
    }));
  };

  const handleFileUpload = (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const setUploading = field === 'thumbnail_url' ? setUploadingThumb : setUploadingBanner;
    setUploading(true);
    setError('');

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await uploadImage(reader.result, file.name, 'games');
        if (res.success && res.url) {
          setFormData(prev => ({ ...prev, [field]: res.url }));
        } else {
          setError(res.message || 'Image upload failed');
        }
      } catch (err) {
        setError('Upload error: ' + err.message);
      } finally {
        setUploading(false);
      }
    };
    reader.onerror = () => {
      setError('Failed reading file');
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.embed_url) {
      setError('Title and Embed URL are required.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save game');
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
          className="relative bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60 sticky top-0 z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <Gamepad2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white m-0">
                  {game ? 'Edit HTML5 Game Embed' : 'Add New HTML5 Game Embed'}
                </h3>
                <p className="text-xs text-slate-400 m-0">Configure title, embed iframe URL, images & reward economics</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick presets for new games */}
          {!game && (
            <div className="px-6 pt-4 pb-1 bg-slate-950/30 border-b border-slate-800/60">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Quick One-Click Presets:
              </span>
              <div className="flex flex-wrap gap-2 pb-3">
                {PRESET_GAMES.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-cyan-950/60 text-slate-300 hover:text-cyan-300 border border-slate-700 hover:border-cyan-700 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3 h-3 text-cyan-400" />
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

            {/* Title & Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Game Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. 2048 Cyber Edition"
                  className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Category
                </label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500 text-sm"
                >
                  <option value="">Uncategorized</option>
                  {categories?.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Embed URL */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Link2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>HTML5 Embed / Iframe URL *</span>
              </label>
              <input
                type="url"
                name="embed_url"
                value={formData.embed_url}
                onChange={handleChange}
                placeholder="https://play2048.co/ or https://hextris.io/"
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm font-mono"
                required
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Must be an HTTPS web game URL that allows iframe embedding without restricting headers.
              </span>
            </div>

            {/* Thumbnail Image (URL + File Upload) */}
            <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Image className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Thumbnail Image (Square / Card)</span>
                </label>
                <label className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors">
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
                    onChange={(e) => handleFileUpload(e, 'thumbnail_url')}
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
                  placeholder="https://images.unsplash.com/... or /uploads/games/..."
                  className="flex-1 px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs font-mono"
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

            {/* Banner Image (Wide Hero / Header) */}
            <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Image className="w-3.5 h-3.5 text-purple-400" />
                  <span>Banner Image (Landscape / Hero)</span>
                </label>
                <label className="px-2.5 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors">
                  {uploadingBanner ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3 h-3" />
                      <span>Upload Banner</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'banner_url')}
                    disabled={uploadingBanner}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="flex gap-3 items-center">
                <input
                  type="text"
                  name="banner_url"
                  value={formData.banner_url}
                  onChange={handleChange}
                  placeholder="Optional hero banner (e.g. 16:9)..."
                  className="flex-1 px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 text-xs font-mono"
                />
                {formData.banner_url && (
                  <img
                    src={formData.banner_url}
                    alt="Banner Preview"
                    className="w-16 h-10 rounded-lg object-cover border border-slate-700 shrink-0 bg-slate-900"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                )}
              </div>
            </div>

            {/* Reward Rate & Min Play Time & Daily Cap */}
            <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
                <Sliders className="w-3.5 h-3.5" />
                <span>Play-to-Earn Reward Economics</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Reward Rate (pts/min)
                  </label>
                  <input
                    type="number"
                    name="reward_rate"
                    value={formData.reward_rate}
                    onChange={handleChange}
                    min="1"
                    max="500"
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Min Play Time (sec)
                  </label>
                  <input
                    type="number"
                    name="min_play_seconds"
                    value={formData.min_play_seconds}
                    onChange={handleChange}
                    min="10"
                    max="600"
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Max Daily Cap (pts)
                  </label>
                  <input
                    type="number"
                    name="max_daily_reward"
                    value={formData.max_daily_reward}
                    onChange={handleChange}
                    min="50"
                    max="50000"
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Orientation & Featured / Active Switches */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Screen Orientation</span>
                </label>
                <select
                  name="orientation"
                  value={formData.orientation}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500 text-sm"
                >
                  <option value="any">Adaptive / Any</option>
                  <option value="portrait">Portrait Only (9:16)</option>
                  <option value="landscape">Landscape Only (16:9)</option>
                </select>
              </div>

              <div className="flex gap-4 pt-2">
                <label className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition-all ${
                  formData.featured
                    ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                }`}>
                  <input
                    type="checkbox"
                    name="featured"
                    checked={formData.featured}
                    onChange={handleChange}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-0 bg-slate-900 border-slate-700 cursor-pointer"
                  />
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-bold">Featured Game</span>
                </label>

                <label className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition-all ${
                  formData.is_active
                    ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                }`}>
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-0 bg-slate-900 border-slate-700 cursor-pointer"
                  />
                  <span className="text-xs font-bold">Active & Playable</span>
                </label>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Description / Play Instructions
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={2}
                placeholder="Brief explanation of game rules and reward perks..."
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm"
              />
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
                disabled={saving || uploadingThumb || uploadingBanner}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all cursor-pointer flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{game ? 'Update Game' : 'Publish Game'}</span>
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
