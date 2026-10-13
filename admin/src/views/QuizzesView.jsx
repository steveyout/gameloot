import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HelpCircle, Plus, Edit3, Trash2, CheckCircle2, 
  Sparkles, Clock, Award, Check, X, Play
} from 'lucide-react';
import { getQuizzes, createQuiz, updateQuiz, deleteQuiz } from '../services/api';
import { useAlert } from '../context/AlertContext';
import confetti from 'canvas-confetti';

export default function QuizzesView() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [previewQuiz, setPreviewQuiz] = useState(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const { success, error, confirm } = useAlert();

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const res = await getQuizzes();
      if (res.success) setQuizzes(res.quizzes);
    } catch (err) {
      error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const handleDelete = async (quiz) => {
    const ok = await confirm({
      title: 'Delete Quiz Trivia?',
      message: `Are you sure you want to delete "${quiz.title}"? Players will no longer be able to earn points from this quiz.`,
      confirmText: 'Delete Quiz',
      type: 'danger'
    });

    if (!ok) return;

    try {
      await deleteQuiz(quiz.id);
      success(`Quiz "${quiz.title}" has been deleted.`);
      fetchQuizzes();
    } catch (err) {
      error(err.message);
    }
  };

  const handleStartSim = (quiz) => {
    setPreviewQuiz(quiz);
    setCurrentQIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setQuizFinished(false);
  };

  const handleAnswer = (idx) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(idx);

    const questions = previewQuiz.questions_json || [];
    const isCorrect = idx === questions[currentQIndex]?.correct_index;
    if (isCorrect) setScore(s => s + 1);

    setTimeout(() => {
      if (currentQIndex + 1 < questions.length) {
        setCurrentQIndex(q => q + 1);
        setSelectedAnswer(null);
      } else {
        setQuizFinished(true);
        confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
      }
    }, 1200);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white m-0 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-purple-400" />
            <span>Gaming Trivia & Quizzes</span>
          </h2>
          <p className="text-xs text-slate-400 m-0 mt-0.5">
            Create high-engagement knowledge quizzes that reward players upon completion
          </p>
        </div>

        <button
          type="button"
          onClick={() => { setEditingQuiz(null); setModalOpen(true); }}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-purple-600/25 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Trivia Quiz</span>
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">Loading quizzes...</div>
      ) : quizzes.length === 0 ? (
        <div className="p-12 rounded-2xl border border-slate-800 bg-slate-900/40 text-center text-slate-400 text-xs">
          No quizzes created yet. Click "New Trivia Quiz" to launch one!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quizzes.map((q) => (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl border border-slate-800/80 bg-slate-900/60 overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="relative h-36 bg-slate-950 overflow-hidden">
                  <img
                    src={q.thumbnail_url || 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=500'}
                    alt={q.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                  <div className="absolute top-3 left-3">
                    <span className="px-2 py-0.5 rounded-md bg-purple-500/20 backdrop-blur-md border border-purple-500/40 text-[10px] font-semibold text-purple-300">
                      {q.category}
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <span className="text-xs font-mono font-bold text-amber-300 px-2 py-0.5 rounded-md bg-slate-900/80 border border-slate-700">
                      +{q.reward_points} PTS
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="text-sm font-bold text-white mb-1">{q.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-3">{q.description}</p>

                  <div className="flex items-center gap-4 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      {q.time_limit_seconds}s limit
                    </span>
                    <span className="flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
                      {q.questions_count} questions
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 pt-0 border-t border-slate-800/60 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleStartSim(q)}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Test Trivia HUD</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => { setEditingQuiz(q); setModalOpen(true); }}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                    title="Edit Quiz"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(q)}
                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 cursor-pointer"
                    title="Delete Quiz"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Simulator Modal */}
      {previewQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative max-w-lg w-full bg-slate-900 border border-purple-500/40 rounded-2xl p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold text-purple-400">{previewQuiz.title}</span>
              <button
                type="button"
                onClick={() => setPreviewQuiz(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!quizFinished ? (
              <div className="mt-4 space-y-4">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Question {currentQIndex + 1} of {previewQuiz.questions_json?.length}</span>
                  <span className="text-amber-400 font-mono font-bold">Score: {score}</span>
                </div>

                <h4 className="text-sm font-bold text-white">
                  {previewQuiz.questions_json?.[currentQIndex]?.question}
                </h4>

                <div className="space-y-2">
                  {previewQuiz.questions_json?.[currentQIndex]?.options?.map((opt, idx) => {
                    const isSelected = selectedAnswer === idx;
                    const isCorrect = idx === previewQuiz.questions_json?.[currentQIndex]?.correct_index;

                    let btnStyle = 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700';
                    if (selectedAnswer !== null) {
                      if (isCorrect) btnStyle = 'bg-emerald-600 text-white border-emerald-500';
                      else if (isSelected) btnStyle = 'bg-rose-600 text-white border-rose-500';
                    }

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleAnswer(idx)}
                        disabled={selectedAnswer !== null}
                        className={`w-full text-left p-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${btnStyle}`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="py-6 text-center space-y-3">
                <Sparkles className="w-10 h-10 text-amber-400 mx-auto" />
                <h3 className="text-base font-bold text-white">Quiz Completed!</h3>
                <p className="text-xs text-slate-300">
                  You scored <span className="text-emerald-400 font-bold">{score}/{previewQuiz.questions_json?.length}</span>
                </p>
                <div className="text-sm font-mono font-bold text-amber-400">
                  Reward Earned: +{Math.round((score / previewQuiz.questions_json?.length) * previewQuiz.reward_points)} PTS
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewQuiz(null)}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold cursor-pointer"
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
