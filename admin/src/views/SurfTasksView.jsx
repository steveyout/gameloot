import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Globe, Plus, Trash2, Edit3, ExternalLink, Play, Clock, 
  Sparkles, X, Search, CheckCircle, XCircle, Award, Repeat
} from 'lucide-react';
import { getSurfTasks, createSurfTask, updateSurfTask, deleteSurfTask } from '../services/api';
import SurfTaskModal from '../components/SurfTaskModal';
import { useAlert } from '../context/AlertContext';
import confetti from 'canvas-confetti';

export default function SurfTasksView() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Simulator HUD
  const [previewTask, setPreviewTask] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [earned, setEarned] = useState(false);

  const { success, error, confirm } = useAlert();

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await getSurfTasks();
      if (res.success) setTasks(res.tasks || []);
    } catch (err) {
      error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleSaveTask = async (formData) => {
    try {
      if (editingTask) {
        await updateSurfTask(editingTask.id, formData);
        success(`Surf task "${formData.title}" updated.`);
      } else {
        await createSurfTask(formData);
        success(`Surf task "${formData.title}" published!`);
      }
      fetchTasks();
    } catch (err) {
      error(err.message);
    }
  };

  const handleToggleActive = async (task) => {
    try {
      const nextActive = !task.is_active;
      await updateSurfTask(task.id, { is_active: nextActive });
      success(`"${task.title}" is now ${nextActive ? 'Active' : 'Draft'}.`);
      fetchTasks();
    } catch (err) {
      error('Failed to change status: ' + err.message);
    }
  };

  const handleDelete = async (task) => {
    const ok = await confirm({
      title: 'Remove Web Surf Task?',
      message: `Are you sure you want to delete "${task.title}"? Players will no longer be able to earn points from this task.`,
      confirmText: 'Delete Task',
      type: 'danger'
    });
    if (!ok) return;

    try {
      await deleteSurfTask(task.id);
      success(`Surf task "${task.title}" deleted.`);
      fetchTasks();
    } catch (err) {
      error(err.message);
    }
  };

  const handleStartSim = (task) => {
    setPreviewTask(task);
    setTimeLeft(task.duration_seconds || 30);
    setEarned(false);
  };

  useEffect(() => {
    if (!previewTask || timeLeft <= 0 || earned) return;
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(t);
          setEarned(true);
          confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [previewTask, timeLeft, earned]);

  // Filter tasks
  const filteredTasks = tasks.filter(t => {
    const matchesSearch = 
      t.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.website_url?.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = 
      statusFilter === '' ? true :
      statusFilter === 'active' ? t.is_active :
      !t.is_active;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white m-0 flex items-center gap-2">
            <Globe className="w-5 h-5 text-teal-400" />
            <span>Web Surfing & Sponsor Tasks</span>
          </h2>
          <p className="text-xs text-slate-400 m-0 mt-0.5">
            Players earn points by exploring sponsored pages, partner game portals, and featured web releases
          </p>
        </div>

        <button
          type="button"
          onClick={() => { setEditingTask(null); setModalOpen(true); }}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-semibold text-xs shadow-lg shadow-teal-500/20 flex items-center gap-2 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Web Surf Task</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by task title or URL..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none focus:border-teal-500"
          >
            <option value="">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="draft">Drafts Only</option>
          </select>

          <span className="text-xs text-slate-400 font-medium">
            Total: <span className="text-white font-bold">{filteredTasks.length}</span>
          </span>
        </div>
      </div>

      {/* Grid of Surf Tasks */}
      {loading ? (
        <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Loading web surfing catalog...</span>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="p-12 rounded-2xl border border-slate-800 bg-slate-900/40 text-center">
          <Globe className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white mb-1">No Web Surf Tasks Found</h3>
          <p className="text-xs text-slate-400 mb-4">
            {search ? 'No tasks matched your search query.' : 'Configure your first sponsor or partner browsing task.'}
          </p>
          <button
            type="button"
            onClick={() => { setEditingTask(null); setModalOpen(true); }}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold cursor-pointer"
          >
            Create First Surf Task
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTasks.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl border border-slate-800/80 bg-slate-900/60 hover:border-slate-700 overflow-hidden flex flex-col justify-between group transition-all shadow-md"
            >
              <div>
                {/* Thumbnail banner */}
                <div className="relative h-40 bg-slate-950 overflow-hidden">
                  <img
                    src={t.thumbnail_url || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&q=80'}
                    alt={t.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&q=80'; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

                  {/* Badges on banner */}
                  <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                    <span className="text-[10px] font-semibold text-teal-300 px-2 py-0.5 rounded-md bg-teal-500/20 backdrop-blur-md border border-teal-500/40 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {t.duration_seconds}s Browsing
                    </span>
                  </div>

                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-md ${
                      t.is_active
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {t.is_active ? 'Active' : 'Draft'}
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-3">
                    <span className="text-xs font-mono font-bold text-amber-300 px-2.5 py-1 rounded-lg bg-slate-900/90 backdrop-blur-md border border-slate-700 flex items-center gap-1 shadow-sm">
                      <Award className="w-3.5 h-3.5 text-amber-400" />
                      +{t.reward_points} PTS
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-sm font-bold text-white mb-1 group-hover:text-teal-300 transition-colors">
                    {t.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                    {t.description || 'No description provided.'}
                  </p>

                  <div className="flex items-center gap-1.5 text-[11px] text-cyan-400 font-mono truncate bg-slate-950/60 p-2 rounded-lg border border-slate-800/80 mb-3">
                    <ExternalLink className="w-3 h-3 shrink-0" />
                    <span className="truncate">{t.website_url}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                    <span className="flex items-center gap-1">
                      <Repeat className="w-3 h-3 text-purple-400" />
                      Daily cap: {t.daily_limit || 5}/user
                    </span>
                    <span>
                      Completed: <strong className="text-slate-200">{t.surf_count || 0}</strong> times
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer Controls */}
              <div className="p-4 pt-3 border-t border-slate-800/80 flex items-center justify-between bg-slate-950/20">
                <button
                  type="button"
                  onClick={() => handleStartSim(t)}
                  className="px-3 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Simulate HUD</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(t)}
                    className="text-[11px] font-semibold text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                    title={t.is_active ? 'Unpublish to draft' : 'Publish to live app'}
                  >
                    {t.is_active ? 'Draft' : 'Activate'}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setEditingTask(t); setModalOpen(true); }}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                    title="Edit Task"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(t)}
                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors cursor-pointer"
                    title="Delete Task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <SurfTaskModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveTask}
        task={editingTask}
      />

      {/* Simulator Modal */}
      {previewTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative max-w-4xl w-full h-[80vh] bg-slate-900 border border-teal-500/40 rounded-2xl flex flex-col overflow-hidden shadow-2xl"
          >
            <div className="px-5 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-teal-400">{previewTask.title}</span>
                <span className="text-xs text-slate-400 font-mono hidden sm:inline truncate max-w-xs">{previewTask.website_url}</span>
              </div>

              <div className="flex items-center gap-3">
                {earned ? (
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Reward Earned (+{previewTask.reward_points} PTS)!</span>
                  </span>
                ) : (
                  <span className="text-xs font-mono font-bold text-amber-400 bg-slate-800 px-2.5 py-1 rounded-lg">
                    Timer: {timeLeft}s remaining
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => setPreviewTask(null)}
                  className="p-1 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-black">
              <iframe
                src={previewTask.website_url}
                title={previewTask.title}
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
