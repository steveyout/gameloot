import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClipboardList, Plus, Trash2, Edit3, Play, CheckCircle, 
  Clock, Sparkles, X, Search, Award, Check
} from 'lucide-react';
import { getSurveys, createSurvey, updateSurvey, deleteSurvey } from '../services/api';
import SurveyModal from '../components/SurveyModal';
import { useAlert } from '../context/AlertContext';
import confetti from 'canvas-confetti';

export default function SurveysView() {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState(null);

  // Simulator state
  const [previewSurvey, setPreviewSurvey] = useState(null);
  const [answers, setAnswers] = useState({});
  const [completed, setCompleted] = useState(false);

  const { success, error, confirm } = useAlert();

  const fetchSurveys = async () => {
    try {
      setLoading(true);
      const res = await getSurveys();
      if (res.success) setSurveys(res.surveys || []);
    } catch (err) {
      error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurveys();
  }, []);

  const handleSaveSurvey = async (formData) => {
    try {
      if (editingSurvey) {
        await updateSurvey(editingSurvey.id, formData);
        success(`Survey "${formData.title}" updated.`);
      } else {
        await createSurvey(formData);
        success(`Survey "${formData.title}" published!`);
      }
      fetchSurveys();
    } catch (err) {
      error(err.message);
    }
  };

  const handleToggleActive = async (survey) => {
    try {
      const nextActive = !survey.is_active;
      await updateSurvey(survey.id, { is_active: nextActive });
      success(`"${survey.title}" marked as ${nextActive ? 'Active' : 'Draft'}.`);
      fetchSurveys();
    } catch (err) {
      error('Failed to change status: ' + err.message);
    }
  };

  const handleDelete = async (survey) => {
    const ok = await confirm({
      title: 'Remove Survey?',
      message: `Are you sure you want to delete "${survey.title}"?`,
      confirmText: 'Delete Survey',
      type: 'danger'
    });
    if (!ok) return;

    try {
      await deleteSurvey(survey.id);
      success(`Survey "${survey.title}" removed.`);
      fetchSurveys();
    } catch (err) {
      error(err.message);
    }
  };

  const handleStartSim = (s) => {
    setPreviewSurvey(s);
    setAnswers({});
    setCompleted(false);
  };

  const handleSubmitSurvey = (e) => {
    e.preventDefault();
    setCompleted(true);
    confetti({ particleCount: 75, spread: 80, origin: { y: 0.6 } });
    success(`Survey submitted successfully! (+${previewSurvey.reward_points} PTS)`);
  };

  const filteredSurveys = surveys.filter(s => {
    const matchesSearch = 
      s.title?.toLowerCase().includes(search.toLowerCase()) ||
      s.description?.toLowerCase().includes(search.toLowerCase()) ||
      s.provider?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = 
      statusFilter === '' ? true :
      statusFilter === 'active' ? s.is_active :
      !s.is_active;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white m-0 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-emerald-400" />
            <span>High-Reward Consumer Surveys</span>
          </h2>
          <p className="text-xs text-slate-400 m-0 mt-0.5">
            Configure partner questionnaires with point bonuses upon valid submission
          </p>
        </div>

        <button
          type="button"
          onClick={() => { setEditingSurvey(null); setModalOpen(true); }}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/25 flex items-center gap-2 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Survey</span>
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
            placeholder="Search surveys by title or provider..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="draft">Drafts Only</option>
          </select>

          <span className="text-xs text-slate-400 font-medium">
            Total: <span className="text-white font-bold">{filteredSurveys.length}</span>
          </span>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Loading survey questions...</span>
        </div>
      ) : filteredSurveys.length === 0 ? (
        <div className="p-12 rounded-2xl border border-slate-800 bg-slate-900/40 text-center">
          <ClipboardList className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white mb-1">No Surveys Found</h3>
          <p className="text-xs text-slate-400 mb-4">
            {search ? 'No surveys matched your search criteria.' : 'Create your first market research survey.'}
          </p>
          <button
            type="button"
            onClick={() => { setEditingSurvey(null); setModalOpen(true); }}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer"
          >
            Create First Survey
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSurveys.map((s) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl border border-slate-800/80 bg-slate-900/60 hover:border-slate-700 overflow-hidden flex flex-col justify-between group transition-all shadow-md"
            >
              <div>
                <div className="relative h-40 bg-slate-950 overflow-hidden">
                  <img
                    src={s.thumbnail_url || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=500&q=80'}
                    alt={s.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=500&q=80'; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                  
                  <div className="absolute top-3 left-3">
                    <span className="text-[10px] font-semibold text-emerald-300 px-2 py-0.5 rounded-md bg-emerald-500/20 backdrop-blur-md border border-emerald-500/40">
                      {s.provider || 'GameLoot Research'}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-md ${
                      s.is_active
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {s.is_active ? 'Active' : 'Draft'}
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-3">
                    <span className="text-xs font-mono font-bold text-amber-300 px-2.5 py-1 rounded-lg bg-slate-900/90 backdrop-blur-md border border-slate-700 flex items-center gap-1 shadow-sm">
                      <Award className="w-3.5 h-3.5 text-amber-400" />
                      +{s.reward_points} PTS
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="text-sm font-bold text-white mb-1 group-hover:text-emerald-300 transition-colors">
                    {s.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                    {s.description || 'No description provided.'}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 mb-2">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      ~{s.estimated_minutes || 3} min duration
                    </span>
                    <span>
                      {s.questions_json?.length || 0} questions
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500">
                    Responses: <strong className="text-slate-300">{s.response_count || 0}</strong> submissions
                  </div>
                </div>
              </div>

              <div className="p-4 pt-3 border-t border-slate-800/80 flex items-center justify-between bg-slate-950/20">
                <button
                  type="button"
                  onClick={() => handleStartSim(s)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Simulate Survey</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(s)}
                    className="text-[11px] font-semibold text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                    title={s.is_active ? 'Set to draft' : 'Activate in mobile app'}
                  >
                    {s.is_active ? 'Draft' : 'Activate'}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setEditingSurvey(s); setModalOpen(true); }}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                    title="Edit Survey"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(s)}
                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors cursor-pointer"
                    title="Delete Survey"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Survey Modal */}
      <SurveyModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveSurvey}
        survey={editingSurvey}
      />

      {/* Simulator Modal */}
      {previewSurvey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative max-w-lg w-full bg-slate-900 border border-emerald-500/40 rounded-2xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold text-emerald-400">{previewSurvey.title}</span>
              <button
                type="button"
                onClick={() => setPreviewSurvey(null)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!completed ? (
              <form onSubmit={handleSubmitSurvey} className="mt-4 space-y-4 text-xs">
                {previewSurvey.questions_json?.map((q, qIdx) => (
                  <div key={q.id || qIdx} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                    <span className="font-bold text-white block">
                      {qIdx + 1}. {q.question}
                    </span>
                    <div className="space-y-1.5">
                      {q.options?.map((opt, oIdx) => (
                        <label key={oIdx} className="flex items-center gap-2 text-slate-300 cursor-pointer hover:text-white">
                          <input
                            type="radio"
                            name={`q_${qIdx}`}
                            required
                            onChange={() => setAnswers(prev => ({ ...prev, [qIdx]: opt }))}
                            className="text-emerald-500 focus:ring-0"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-600/30 cursor-pointer"
                >
                  Submit Survey & Collect +{previewSurvey.reward_points} PTS
                </button>
              </form>
            ) : (
              <div className="py-6 text-center space-y-3">
                <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
                <h3 className="text-base font-bold text-white">Survey Completed!</h3>
                <p className="text-xs text-slate-300">
                  Bonus points successfully accredited to user profile.
                </p>
                <button
                  type="button"
                  onClick={() => setPreviewSurvey(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Close Simulator
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
