import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Globe, Plus, Trash2, Edit3, ExternalLink, Play, Clock, Sparkles, X } from 'lucide-react';
import { getSurfTasks, createSurfTask, deleteSurfTask } from '../services/api';
import { useAlert } from '../context/AlertContext';
import confetti from 'canvas-confetti';

export default function SurfTasksView() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewTask, setPreviewTask] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [earned, setEarned] = useState(false);

  const { success, error, confirm } = useAlert();

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await getSurfTasks();
      if (res.success) setTasks(res.tasks);
    } catch (err) {
      error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleDelete = async (task) => {
    const ok = await confirm({
      title: 'Remove Web Surf Task?',
      message: `Are you sure you want to delete "${task.title}"?`,
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

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white m-0 flex items-center gap-2">
            <Globe className="w-5 h-5 text-teal-400" />
            <span>Web Surfing & Sponsor Tasks</span>
          </h2>
          <p className="text-xs text-slate-400 m-0 mt-0.5">
            Players earn rewards by browsing sponsored pages, partner portals, and game stores
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl border border-slate-800/80 bg-slate-900/60 overflow-hidden flex flex-col justify-between"
          >
            <div>
              <div className="relative h-36 bg-slate-950 overflow-hidden">
                <img
                  src={t.thumbnail_url || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500'}
                  alt={t.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                <div className="absolute top-3 left-3">
                  <span className="text-[10px] font-semibold text-teal-300 px-2 py-0.5 rounded-md bg-teal-500/20 border border-teal-500/40">
                    {t.duration_seconds}s Browsing
                  </span>
                </div>
                <div className="absolute bottom-3 left-3">
                  <span className="text-xs font-mono font-bold text-amber-300 px-2 py-0.5 rounded-md bg-slate-900/80 border border-slate-700">
                    +{t.reward_points} PTS
                  </span>
                </div>
              </div>

              <div className="p-4">
                <h3 className="text-sm font-bold text-white mb-1">{t.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-2 mb-2">{t.description}</p>
                <span className="text-[11px] text-cyan-400 font-mono truncate block">{t.website_url}</span>
              </div>
            </div>

            <div className="p-4 pt-0 border-t border-slate-800/60 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleStartSim(t)}
                className="px-3 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Simulate Surf Task</span>
              </button>

              <button
                type="button"
                onClick={() => handleDelete(t)}
                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 cursor-pointer"
                title="Delete Task"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

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
                <span className="text-xs text-slate-400 font-mono">{previewTask.website_url}</span>
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
