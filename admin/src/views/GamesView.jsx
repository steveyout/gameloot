import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Gamepad2, Plus, Search, Filter, Play, Edit3, Trash2, 
  ExternalLink, Sparkles, Smartphone, Award, Flame, CheckCircle, XCircle
} from 'lucide-react';
import { getGames, getCategories, createGame, updateGame, deleteGame } from '../services/api';
import GameModal from '../components/GameModal';
import { useAlert } from '../context/AlertContext';

export default function GamesView({ onTestGame }) {
  const [games, setGames] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [activeFilter, setActiveFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState(null);

  const { success, error, confirm } = useAlert();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [gamesRes, catsRes] = await Promise.all([
        getGames({ search, category: selectedCategory, active: activeFilter }),
        getCategories()
      ]);
      if (gamesRes.success) setGames(gamesRes.games);
      if (catsRes.success) setCategories(catsRes.categories);
    } catch (err) {
      error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, selectedCategory, activeFilter]);

  const handleSaveGame = async (formData) => {
    try {
      if (editingGame) {
        await updateGame(editingGame.id, formData);
        success(`Game "${formData.title}" updated.`);
      } else {
        await createGame(formData);
        success(`Game "${formData.title}" published!`);
      }
      fetchData();
    } catch (err) {
      error(err.message);
    }
  };

  const handleDelete = async (id, title) => {
    const ok = await confirm({
      title: 'Delete HTML5 Game?',
      message: `Are you sure you want to delete "${title}"? This will remove its embedded play container from the platform.`,
      confirmText: 'Delete Game',
      type: 'danger'
    });
    if (!ok) return;

    try {
      await deleteGame(id);
      success(`Game "${title}" deleted.`);
      fetchData();
    } catch (err) {
      error('Delete failed: ' + err.message);
    }
  };

  const handleToggleActive = async (game) => {
    try {
      await updateGame(game.id, { is_active: !game.is_active });
      success(`Game "${game.title}" marked as ${!game.is_active ? 'Active' : 'Draft'}.`);
      fetchData();
    } catch (err) {
      error('Status update failed: ' + err.message);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search games by title..."
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none focus:border-cyan-500 shrink-0"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => { setEditingGame(null); setModalOpen(true); }}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add HTML5 Game Embed</span>
        </button>
      </div>

      {/* Games Cards Grid */}
      {loading ? (
        <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Loading game repository...</span>
        </div>
      ) : games.length === 0 ? (
        <div className="p-12 rounded-2xl border border-slate-800 bg-slate-900/40 text-center">
          <Gamepad2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white mb-1">No Games Found</h3>
          <p className="text-xs text-slate-400 mb-4">Start by adding an embedded HTML5 game or clear filters.</p>
          <button
            onClick={() => { setEditingGame(null); setModalOpen(true); }}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold"
          >
            Add First Game
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {games.map((g) => (
            <motion.div
              key={g.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl border border-slate-800/80 bg-slate-900/60 overflow-hidden flex flex-col group hover:border-slate-700 transition-all shadow-md"
            >
              {/* Thumbnail banner */}
              <div className="relative h-44 w-full bg-slate-950 overflow-hidden">
                <img
                  src={g.thumbnail_url || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500'}
                  alt={g.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                {/* Badges on thumbnail */}
                <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-md border border-slate-700/60 text-[10px] font-semibold text-slate-200">
                    {g.category_name || 'Arcade'}
                  </span>
                  {g.featured ? (
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 backdrop-blur-md border border-amber-500/40 text-[10px] font-semibold text-amber-300 flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" />
                      Featured
                    </span>
                  ) : null}
                </div>

                <div className="absolute top-3 right-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    g.is_active ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {g.is_active ? 'Active' : 'Draft'}
                  </span>
                </div>

                {/* Play Simulator Overlay Button */}
                <button
                  type="button"
                  onClick={() => onTestGame(g)}
                  className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white text-xs font-bold shadow-lg shadow-cyan-500/30 flex items-center gap-1.5 transition-all transform active:scale-95 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Test Simulator</span>
                </button>
              </div>

              {/* Game details body */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white mb-1 group-hover:text-cyan-400 transition-colors">
                    {g.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                    {g.description || 'No description provided.'}
                  </p>
                </div>

                {/* Economics pill bar */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-mono font-bold text-amber-300">{g.reward_rate} pts/min</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                    <Smartphone className="w-3 h-3 text-cyan-400" />
                    <span className="capitalize">{g.orientation}</span>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Flame className="w-3 h-3 text-purple-400" />
                    <span>{Number(g.play_count).toLocaleString()}</span>
                  </div>
                </div>

                {/* Admin controls */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(g)}
                    className="text-[11px] font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {g.is_active ? 'Deactivate' : 'Activate'}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => { setEditingGame(g); setModalOpen(true); }}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                      title="Edit Game"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(g.id, g.title)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors cursor-pointer"
                      title="Delete Game"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Edit/Add Modal */}
      <GameModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveGame}
        game={editingGame}
        categories={categories}
      />
    </div>
  );
}
