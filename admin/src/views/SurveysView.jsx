import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Plus, Trash2, Play, CheckCircle, Clock, Sparkles, X } from 'lucide-react';
import { getSurveys, deleteSurvey } from '../services/api';
import { useAlert } from '../context/AlertContext';
import confetti from 'canvas-confetti';

export default function SurveysView() {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewSurvey, setPreviewSurvey] = useState(null);
  const [answers, setAnswers] = useState({});
  const [completed, setCompleted] = useState(false);

  const { success, error, confirm } = useAlert();

  const fetchSurveys = async () => {
    try {
      setLoading(true);
      const res = await getSurveys();
      if (res.success) setSurveys(res.surveys);
    } catch (err) {
      error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurveys();
  }, []);

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

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {surveys.map((s) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl border border-slate-800/80 bg-slate-900/60 overflow-hidden flex flex-col justify-between"
          >
            <div>
              <div className="relative h-36 bg-slate-950 overflow-hidden">
                <img
                  src={s.thumbnail_url || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=500'}
                  alt={s.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                <div className="absolute top-3 left-3">
                  <span className="text-[10px] font-semibold text-emerald-300 px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40">
                    {s.provider}
                  </span>
                </div>
                <div className="absolute bottom-3 left-3">
                  <span className="text-xs font-mono font-bold text-amber-300 px-2 py-0.5 rounded-md bg-slate-900/80 border border-slate-700">
                    +{s.reward_points} PTS
                  </span>
                </div>
              </div>

              <div className="p-4">
                <h3 className="text-sm font-bold text-white mb-1">{s.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-2 mb-2">{s.description}</p>
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  ~{s.estimated_minutes} min duration
                </span>
              </div>
            </div>

            <div className="p-4 pt-0 border-t border-slate-800/60 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleStartSim(s)}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Simulate Survey</span>
              </button>

              <button
                type="button"
                onClick={() => handleDelete(s)}
                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 cursor-pointer"
                title="Delete Survey"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

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
