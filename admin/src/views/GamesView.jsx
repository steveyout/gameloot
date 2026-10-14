import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Gamepad2, Plus, Search, Filter, Play, Edit3, Trash2, 
  ExternalLink, Sparkles, Smartphone, Award, Flame, CheckCircle, XCircle,
  Star, CheckSquare, Square, Check, X, ShieldAlert
} from 'lucide-react';
import { getGames, getCategories, createGame, updateGame, deleteGame, bulkGamesAction } from '../services/api';
import GameModal from '../components/GameModal';
import Pagination from '../components/Pagination';
import { useAlert } from '../context/AlertContext';

export default function GamesView({ onTestGame }) {
  const [games, setGames] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [featuredFilter, setFeaturedFilter] = useState('');

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(6);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Bulk Selection state
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState(null);

  const { success, error, confirm } = useAlert();

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {
        search,
        category: selectedCategory,
        active: activeFilter,
        featured: featuredFilter,
        page,
        limit
      };

      const [gamesRes, catsRes] = await Promise.all([
        getGames(params),
        getCategories()
      ]);

      if (gamesRes.success) {
        setGames(gamesRes.games);
        setTotalItems(gamesRes.total || gamesRes.games.length);
        setTotalPages(gamesRes.totalPages || Math.ceil((gamesRes.total || gamesRes.games.length) / limit) || 1);
      }
      if (catsRes.success) setCategories(catsRes.categories);
    } catch (err) {
      error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, selectedCategory, activeFilter, featuredFilter, page, limit]);

  // Reset to page 1 when search or filters change
  useEffect(() => {
    setPage(1);
    setSelectedIds([]);
  }, [search, selectedCategory, activeFilter, featuredFilter]);

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
      title: 'Delete Game?',
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

  const handleToggleFeatured = async (game) => {
    try {
      const nextFeatured = !game.featured;
      await updateGame(game.id, { featured: nextFeatured });
      success(`"${game.title}" ${nextFeatured ? 'marked as Featured ⭐' : 'removed from Featured'}.`);
      fetchData();
    } catch (err) {
      error('Featured update failed: ' + err.message);
    }
  };

  // Bulk selection toggles
  const handleToggleSelectAll = () => {
    if (selectedIds.length === games.length && games.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(games.map(g => g.id));
    }
  };

  const handleToggleSelectOne = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleBulkAction = async (action) => {
    if (selectedIds.length === 0) return;

    const actionLabels = {
      feature: 'Mark as Featured ⭐',
      unfeature: 'Remove from Featured',
      activate: 'Activate Selected',
      deactivate: 'Deactivate Selected',
      delete: 'Delete Selected Games'
    };

    const isDanger = action === 'delete';
    const ok = await confirm({
      title: `Bulk Action: ${actionLabels[action] || action}`,
      message: `Are you sure you want to apply "${action}" to ${selectedIds.length} selected game(s)?`,
      confirmText: actionLabels[action] || 'Execute',
      type: isDanger ? 'danger' : 'info'
    });

    if (!ok) return;

    setBulkProcessing(true);
    try {
      await bulkGamesAction(selectedIds, action);
      success(`Bulk action "${action}" completed for ${selectedIds.length} games.`);
      setSelectedIds([]);
      fetchData();
    } catch (err) {
      error('Bulk action failed: ' + err.message);
    } finally {
      setBulkProcessing(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top action & filter bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
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

          <select
            value={featuredFilter}
            onChange={(e) => setFeaturedFilter(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none focus:border-amber-500 shrink-0"
          >
            <option value="">All Highlights</option>
            <option value="true">⭐ Featured Only</option>
            <option value="false">Non-Featured</option>
          </select>

          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none focus:border-cyan-500 shrink-0"
          >
            <option value="">All Statuses</option>
            <option value="true">Active Only</option>
            <option value="false">Drafts Only</option>
          </select>
        </div>

        <button
          onClick={() => { setEditingGame(null); setModalOpen(true); }}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Game Embed</span>
        </button>
      </div>

      {/* Bulk Action Sticky Bar (appears when items are selected) */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-cyan-500/40 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-lg shadow-cyan-950/40"
          >
            <div className="flex items-center gap-2.5 text-xs text-white">
              <span className="w-6 h-6 rounded-lg bg-cyan-500 text-black font-black flex items-center justify-center text-[11px]">
                {selectedIds.length}
              </span>
              <span className="font-semibold">Game(s) selected</span>
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
                onClick={() => handleBulkAction('feature')}
                className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Mark Featured</span>
              </button>

              <button
                type="button"
                disabled={bulkProcessing}
                onClick={() => handleBulkAction('unfeature')}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <span>Unset Featured</span>
              </button>

              <button
                type="button"
                disabled={bulkProcessing}
                onClick={() => handleBulkAction('activate')}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Activate</span>
              </button>

              <button
                type="button"
                disabled={bulkProcessing}
                onClick={() => handleBulkAction('deactivate')}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Deactivate</span>
              </button>

              <button
                type="button"
                disabled={bulkProcessing}
                onClick={() => handleBulkAction('delete')}
                className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Select All Bar Header */}
      {!loading && games.length > 0 && (
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <label className="flex items-center gap-2 cursor-pointer hover:text-white select-none">
            <input
              type="checkbox"
              checked={selectedIds.length === games.length && games.length > 0}
              onChange={handleToggleSelectAll}
              className="w-4 h-4 rounded text-cyan-500 bg-slate-900 border-slate-700 focus:ring-0 cursor-pointer"
            />
            <span>Select all on page ({games.length})</span>
          </label>

          <span>Total in catalog: <span className="text-white font-bold">{totalItems}</span> games</span>
        </div>
      )}

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
          <p className="text-xs text-slate-400 mb-4">Start by adding an game or clear filters.</p>
          <button
            onClick={() => { setEditingGame(null); setModalOpen(true); }}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold cursor-pointer"
          >
            Add First Game
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {games.map((g) => {
            const isSelected = selectedIds.includes(g.id);
            return (
              <motion.div
                key={g.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`glass-card rounded-2xl border overflow-hidden flex flex-col group transition-all shadow-md ${
                  isSelected 
                    ? 'border-cyan-500 bg-slate-900/90 shadow-cyan-500/10' 
                    : 'border-slate-800/80 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                {/* Thumbnail banner */}
                <div className="relative h-44 w-full bg-slate-950 overflow-hidden">
                  <img
                    src={g.thumbnail_url || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500'}
                    alt={g.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500'; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                  {/* Bulk Select Checkbox overlay on card */}
                  <div className="absolute top-3 left-3 z-10">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelectOne(g.id)}
                      className="w-4 h-4 rounded text-cyan-500 bg-slate-950/80 border-slate-600 focus:ring-0 cursor-pointer shadow-md"
                    />
                  </div>

                  {/* Badges on thumbnail */}
                  <div className="absolute top-3 left-9 flex gap-1.5 flex-wrap z-10">
                    <span className="px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-md border border-slate-700/60 text-[10px] font-semibold text-slate-200">
                      {g.category_name || 'Arcade'}
                    </span>
                    {g.featured ? (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/20 backdrop-blur-md border border-amber-500/50 text-[10px] font-bold text-amber-300 flex items-center gap-1 shadow-sm">
                        <Sparkles className="w-2.5 h-2.5" />
                        Featured
                      </span>
                    ) : null}
                  </div>

                  {/* 1-Click Feature Star Toggle in top right */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                    <button
                      type="button"
                      onClick={() => handleToggleFeatured(g)}
                      className={`p-1.5 rounded-lg backdrop-blur-md transition-all cursor-pointer ${
                        g.featured
                          ? 'bg-amber-500/30 text-amber-300 border border-amber-500/60 shadow-lg shadow-amber-500/20'
                          : 'bg-slate-900/80 text-slate-400 hover:text-amber-300 border border-slate-700/60'
                      }`}
                      title={g.featured ? 'Unmark from Featured' : 'Feature this game'}
                    >
                      <Star className={`w-3.5 h-3.5 ${g.featured ? 'fill-amber-400 text-amber-400' : ''}`} />
                    </button>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-md ${
                      g.is_active ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {g.is_active ? 'Active' : 'Draft'}
                    </span>
                  </div>

                  {/* Play Simulator Overlay Button */}
                  <button
                    type="button"
                    onClick={() => onTestGame(g)}
                    className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white text-xs font-bold shadow-lg shadow-cyan-500/30 flex items-center gap-1.5 transition-all transform active:scale-95 cursor-pointer z-10"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Test Simulator</span>
                  </button>
                </div>

                {/* Game details body */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white mb-1 group-hover:text-cyan-400 transition-colors flex items-center gap-1.5">
                      {g.title}
                      {g.featured && <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />}
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
                      <span>{Number(g.play_count || 0).toLocaleString()} plays</span>
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
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={(newLimit) => { setLimit(newLimit); setPage(1); }}
        limitOptions={[6, 12, 24, 48]}
      />

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
