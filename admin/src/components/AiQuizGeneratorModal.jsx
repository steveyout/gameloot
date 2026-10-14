import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, X, BrainCircuit, Check, RefreshCw, Edit3,
  Award, Clock, CheckCircle2, ChevronRight, AlertCircle,
  HelpCircle, Layers, Sliders, Wand2
} from 'lucide-react';
import { generateAiQuiz } from '../services/api';

const QUICK_TOPICS = [
  { label: 'Super Mario & Nintendo', topic: 'Super Mario & Nintendo Classics', category: 'Nintendo' },
  { label: 'PlayStation Exclusives', topic: 'PlayStation Exclusives & Platinum Lore', category: 'PlayStation' },
  { label: '80s & 90s Arcades', topic: 'Retro Arcade Hits (Pac-Man, Street Fighter, Galaga)', category: 'Arcade & Retro' },
  { label: 'Tactical Esports (CS & Valorant)', topic: 'Competitive CS2 and Valorant Tactics', category: 'Esports' },
  { label: 'Elden Ring & Soulsborne', topic: 'Elden Ring & FromSoftware Boss Lore', category: 'RPG & Open Worlds' },
  { label: 'Minecraft & Sandbox', topic: 'Minecraft Redstone & Survival Secrets', category: 'Indie & Sandbox' },
  { label: 'GTA & Open World Games', topic: 'Grand Theft Auto & Vice City Lore', category: 'Action & Adventure' },
  { label: 'Pokemon Battle Mechanics', topic: 'Pokemon Types, Evolutions & Battle Mechanics', category: 'Nintendo' }
];

const CATEGORIES = [
  'Gaming Trivia',
  'Nintendo',
  'PlayStation',
  'Arcade & Retro',
  'Esports',
  'RPG & Open Worlds',
  'Indie & Sandbox',
  'Action & Adventure',
  'Casual & Puzzle',
  'Sports & Racing'
];

export default function AiQuizGeneratorModal({
  isOpen,
  onClose,
  onPublishQuiz,
  onOpenInEditor
}) {
  const [topic, setTopic] = useState('');
  const [category, setCategory] = useState('Gaming Trivia');
  const [difficulty, setDifficulty] = useState('Medium');
  const [questionsCount, setQuestionsCount] = useState(5);
  const [rewardPoints, setRewardPoints] = useState(50);

  const [loading, setLoading] = useState(false);
  const [generatedQuiz, setGeneratedQuiz] = useState(null);
  const [error, setError] = useState('');
  const [publishing, setPublishing] = useState(false);

  if (!isOpen) return null;

  const handleSelectTopicPill = (item) => {
    setTopic(item.topic);
    setCategory(item.category);
    setError('');
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError('Please provide a gaming topic or select one of the suggested prompts below.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await generateAiQuiz({
        topic: topic.trim(),
        category,
        questions_count: parseInt(questionsCount, 10) || 5,
        difficulty,
        reward_points: parseInt(rewardPoints, 10) || 50
      });

      if (res.success && res.quiz) {
        setGeneratedQuiz(res.quiz);
      } else {
        throw new Error(res.message || 'AI failed to generate quiz');
      }
    } catch (err) {
      setError(err.message || 'Generation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePublishDirectly = async () => {
    if (!generatedQuiz) return;
    setPublishing(true);
    setError('');
    try {
      await onPublishQuiz(generatedQuiz);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to publish quiz');
    } finally {
      setPublishing(false);
    }
  };

  const handleCustomize = () => {
    if (!generatedQuiz) return;
    onOpenInEditor(generatedQuiz);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative bg-slate-900 border border-purple-500/40 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20 text-white">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white m-0 flex items-center gap-2">
                  <span>AI Trivia Quiz Generator</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 border border-purple-500/40 text-purple-300">
                    Smart Engine
                  </span>
                </h3>
                <p className="text-xs text-slate-400 m-0">
                  Generate rich, accurate gaming quizzes with multiple-choice questions & answers
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto flex-1 space-y-5">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {!generatedQuiz ? (
              /* Configuration View */
              <div className="space-y-5">
                {/* Topic / Prompt */}
                <div>
                  <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <BrainCircuit className="w-4 h-4 text-purple-400" />
                    <span>Gaming Topic / Franchise Prompt *</span>
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Nintendo Switch & Zelda Lore, Speedrun History, Counter-Strike Weapons..."
                    className="w-full px-4 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                {/* Quick Topic Suggestions */}
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                    Or select an instant popular prompt:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_TOPICS.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectTopicPill(item)}
                        className={`text-xs px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                          topic === item.topic
                            ? 'bg-purple-600 border-purple-400 text-white shadow-md shadow-purple-600/30'
                            : 'bg-slate-800/70 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                        }`}
                      >
                        <Sparkles className="w-3 h-3 text-purple-400" />
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tuning Parameters Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  {/* Category */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-purple-500"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Difficulty */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Difficulty Level
                    </label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-purple-500"
                    >
                      <option value="Easy">Easy (Casual Gamers)</option>
                      <option value="Medium">Medium (Regulars)</option>
                      <option value="Hard">Hard (Dedicated Fans)</option>
                      <option value="Expert">Expert (Grandmasters)</option>
                    </select>
                  </div>

                  {/* Questions Count */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Number of Questions
                    </label>
                    <select
                      value={questionsCount}
                      onChange={(e) => setQuestionsCount(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-purple-500"
                    >
                      <option value={3}>3 Questions (Quick Sprint)</option>
                      <option value={5}>5 Questions (Standard)</option>
                      <option value={8}>8 Questions (Extended)</option>
                      <option value={10}>10 Questions (Mastery Cup)</option>
                    </select>
                  </div>

                  {/* Reward Points */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
                      <Award className="w-3 h-3 text-amber-400" />
                      <span>Reward Points</span>
                    </label>
                    <input
                      type="number"
                      value={rewardPoints}
                      onChange={(e) => setRewardPoints(Number(e.target.value))}
                      min="10"
                      max="500"
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-amber-300 font-mono text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* Generate Button Banner */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={loading || !topic.trim()}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:via-indigo-500 hover:to-pink-500 text-white font-bold text-sm shadow-xl shadow-purple-600/25 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        <span>AI is Synthesizing Questions & Options...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 text-pink-300" />
                        <span>Generate Complete Trivia via AI</span>
                      </>
                    )}
                  </button>
                  <span className="text-[11px] text-slate-500 text-center block mt-2">
                    Powered by intelligent game knowledge modeling. Verifies accurate keys & generates high-res cover art.
                  </span>
                </div>
              </div>
            ) : (
              /* Review & Preview View */
              <div className="space-y-5">
                {/* Generated Quiz Header Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-purple-500/40 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <img
                    src={generatedQuiz.thumbnail_url || 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=500&q=80'}
                    alt={generatedQuiz.title}
                    className="w-20 h-20 rounded-xl object-cover border border-purple-500/30 shrink-0 bg-slate-800"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-bold">
                        {generatedQuiz.category}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold flex items-center gap-1">
                        <Award className="w-3 h-3 text-amber-400" />
                        +{generatedQuiz.reward_points} PTS
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3 text-cyan-400" />
                        {generatedQuiz.time_limit_seconds}s
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-white mb-1">
                      {generatedQuiz.title}
                    </h4>
                    <p className="text-xs text-slate-400 line-clamp-2">
                      {generatedQuiz.description}
                    </p>
                  </div>
                </div>

                {/* Generated Questions List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-purple-400" />
                      <span>Generated Questions ({generatedQuiz.questions_json?.length})</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setGeneratedQuiz(null)}
                      className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Regenerate / Change Prompt</span>
                    </button>
                  </div>

                  {generatedQuiz.questions_json?.map((q, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-white">
                          <strong className="text-purple-400 mr-1.5">#{idx + 1}</strong>
                          {q.question}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {q.options?.map((opt, oIdx) => {
                          const isCorrect = q.correct_index === oIdx;
                          return (
                            <div
                              key={oIdx}
                              className={`p-2 rounded-lg text-xs flex items-center justify-between border ${
                                isCorrect
                                  ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200 font-semibold'
                                  : 'bg-slate-900 border-slate-800 text-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                  isCorrect ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                                }`}>
                                  {String.fromCharCode(65 + oIdx)}
                                </span>
                                <span>{opt}</span>
                              </div>
                              {isCorrect && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {q.explanation && (
                        <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded-lg border border-slate-800/80 flex items-start gap-1.5">
                          <HelpCircle className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                          <span><strong>Fun Fact:</strong> {q.explanation}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
            >
              Cancel
            </button>

            {generatedQuiz && (
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleCustomize}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Customize in Editor</span>
                </button>

                <button
                  type="button"
                  onClick={handlePublishDirectly}
                  disabled={publishing}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/25 flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
                >
                  {publishing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Publish Directly (+{generatedQuiz.reward_points} PTS)</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
