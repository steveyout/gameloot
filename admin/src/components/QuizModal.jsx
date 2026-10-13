import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, HelpCircle, Plus, Trash2, Check, Clock, Award, 
  Image, Sparkles, Upload, Loader2, ListChecks, CheckCircle2
} from 'lucide-react';
import { uploadImage } from '../services/api';

const PRESET_QUIZZES = [
  {
    title: 'Retro 90s & Arcade Classics',
    category: 'Retro Arcade',
    description: 'Test your knowledge on the greatest golden-era arcade, 16-bit, and early 3D video game milestones.',
    thumbnail_url: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=500&q=80',
    reward_points: 60,
    time_limit_seconds: 60,
    questions_json: [
      {
        question: 'What was the first commercial home console game to feature Mario under his original name?',
        options: ['Donkey Kong', 'Mario Bros. (1983)', 'Super Mario Bros.', 'Wrecking Crew'],
        correct_index: 1
      },
      {
        question: 'Which legendary game development studio originally created the groundbreaking 1993 FPS "DOOM"?',
        options: ['id Software', 'Epic MegaGames', 'Valve', '3D Realms'],
        correct_index: 0
      },
      {
        question: 'What is the canonical name of Sonic the Hedgehog’s twin-tailed fox sidekick?',
        options: ['Knuckles the Echidna', 'Miles Prower', 'Shadow the Hedgehog', 'Vector the Crocodile'],
        correct_index: 1
      },
      {
        question: 'In the Legend of Zelda series, what is the name of the green-clad heroic protagonist?',
        options: ['Zelda', 'Link', 'Ganon', 'Epona'],
        correct_index: 1
      }
    ]
  },
  {
    title: 'Competitive Esports & Legends',
    category: 'Esports',
    description: 'Prove your tactical mastery in Counter-Strike, MOBA strategies, and premier tournament trivia.',
    thumbnail_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&q=80',
    reward_points: 75,
    time_limit_seconds: 75,
    questions_json: [
      {
        question: 'In Counter-Strike, how long does it take to defuse the C4 explosive WITH a Defuse Kit equipped?',
        options: ['3 seconds', '5 seconds', '7.5 seconds', '10 seconds'],
        correct_index: 1
      },
      {
        question: 'In League of Legends, what epic neutral monster grants the "Hand of Baron" empowered minions buff?',
        options: ['Elder Dragon', 'Rift Herald', 'Baron Nashor', 'Vilemaw'],
        correct_index: 2
      },
      {
        question: 'In Valorant, how many total points are required to win a standard competitive overtime round without sudden death?',
        options: ['Lead by 1 round', 'Lead by 2 rounds', 'First to 14 wins', 'Lead by 3 rounds'],
        correct_index: 1
      }
    ]
  },
  {
    title: 'Sci-Fi RPGs & Cyberpunk Lore',
    category: 'RPG Lore',
    description: 'Explore dystopian megacities, interstellar colonies, and post-apocalyptic wasteland history.',
    thumbnail_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&q=80',
    reward_points: 80,
    time_limit_seconds: 90,
    questions_json: [
      {
        question: 'In Cyberpunk 2077, what is the fictional futuristic megalopolis where the game is set?',
        options: ['Neo-Tokyo', 'Night City', 'New Carthage', 'Rapture'],
        correct_index: 1
      },
      {
        question: 'What is the name of Commander Shepard’s stealth reconnaissance starship in Mass Effect?',
        options: ['SSV Normandy', 'Pillar of Autumn', 'USG Ishimura', 'Ebon Hawk'],
        correct_index: 0
      },
      {
        question: 'In the Fallout franchise, what is the iconic cheerful smiling mascot of Vault-Tec called?',
        options: ['Pip-Boy', 'Vault Boy', 'Mr. Handy', 'Brotherhood Knight'],
        correct_index: 1
      }
    ]
  }
];

export default function QuizModal({ isOpen, onClose, onSave, quiz }) {
  const [formData, setFormData] = useState({
    title: '',
    category: 'Gaming Trivia',
    description: '',
    thumbnail_url: '',
    reward_points: 50,
    time_limit_seconds: 60,
    is_active: true,
    questions_json: []
  });

  const [saving, setSaving] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (quiz) {
      setFormData({
        title: quiz.title || '',
        category: quiz.category || 'Gaming Trivia',
        description: quiz.description || '',
        thumbnail_url: quiz.thumbnail_url || '',
        reward_points: quiz.reward_points || 50,
        time_limit_seconds: quiz.time_limit_seconds || 60,
        is_active: quiz.is_active !== undefined ? !!quiz.is_active : true,
        questions_json: Array.isArray(quiz.questions_json) && quiz.questions_json.length > 0 
          ? JSON.parse(JSON.stringify(quiz.questions_json))
          : [
              {
                question: '',
                options: ['', '', '', ''],
                correct_index: 0
              }
            ]
      });
    } else {
      setFormData({
        title: '',
        category: 'Gaming Trivia',
        description: '',
        thumbnail_url: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=500&q=80',
        reward_points: 50,
        time_limit_seconds: 60,
        is_active: true,
        questions_json: [
          {
            question: '',
            options: ['', '', '', ''],
            correct_index: 0
          }
        ]
      });
    }
    setError('');
  }, [quiz, isOpen]);

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
        const res = await uploadImage(reader.result, file.name, 'quizzes');
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

  // Question Management
  const handleAddQuestion = () => {
    setFormData(prev => ({
      ...prev,
      questions_json: [
        ...prev.questions_json,
        {
          question: '',
          options: ['', '', '', ''],
          correct_index: 0
        }
      ]
    }));
  };

  const handleRemoveQuestion = (qIdx) => {
    if (formData.questions_json.length <= 1) {
      setError('A quiz must have at least one question.');
      return;
    }
    setFormData(prev => ({
      ...prev,
      questions_json: prev.questions_json.filter((_, idx) => idx !== qIdx)
    }));
  };

  const handleQuestionTextChange = (qIdx, text) => {
    setFormData(prev => {
      const updated = [...prev.questions_json];
      updated[qIdx] = { ...updated[qIdx], question: text };
      return { ...prev, questions_json: updated };
    });
  };

  const handleOptionChange = (qIdx, oIdx, text) => {
    setFormData(prev => {
      const updated = [...prev.questions_json];
      const opts = [...updated[qIdx].options];
      opts[oIdx] = text;
      updated[qIdx] = { ...updated[qIdx], options: opts };
      return { ...prev, questions_json: updated };
    });
  };

  const handleCorrectAnswerChange = (qIdx, oIdx) => {
    setFormData(prev => {
      const updated = [...prev.questions_json];
      updated[qIdx] = { ...updated[qIdx], correct_index: oIdx };
      return { ...prev, questions_json: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Quiz Title is required.');
      return;
    }

    if (!formData.questions_json || formData.questions_json.length === 0) {
      setError('Please add at least one question.');
      return;
    }

    // Validate that questions and options are filled out
    for (let i = 0; i < formData.questions_json.length; i++) {
      const q = formData.questions_json[i];
      if (!q.question.trim()) {
        setError(`Question #${i + 1} is missing question text.`);
        return;
      }
      for (let j = 0; j < 4; j++) {
        if (!q.options?.[j] || !q.options[j].trim()) {
          setError(`Question #${i + 1} is missing choice Option ${String.fromCharCode(65 + j)}.`);
          return;
        }
      }
    }

    setSaving(true);
    setError('');
    try {
      await onSave({
        ...formData,
        reward_points: parseInt(formData.reward_points, 10) || 50,
        time_limit_seconds: parseInt(formData.time_limit_seconds, 10) || 60,
        questions_count: formData.questions_json.length
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save quiz');
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
          className="relative bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white m-0">
                  {quiz ? 'Edit Gaming Trivia Quiz' : 'Create New Gaming Trivia Quiz'}
                </h3>
                <p className="text-xs text-slate-400 m-0">Configure title, questions, answer options & reward points</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Presets */}
          {!quiz && (
            <div className="px-6 pt-3 pb-2 bg-slate-950/30 border-b border-slate-800/60 shrink-0">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Quick 1-Click Trivia Presets:
              </span>
              <div className="flex flex-wrap gap-2 pb-1">
                {PRESET_QUIZZES.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-purple-950/60 text-slate-300 hover:text-purple-300 border border-slate-700 hover:border-purple-700 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3 h-3 text-purple-400" />
                    <span>{p.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Form Body - Scrollable */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 text-sm">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {error}
              </div>
            )}

            {/* Title & Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Quiz Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Retro Arcade Champions"
                  className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  placeholder="Gaming Trivia, Esports, Retro Arcade..."
                  className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500 text-sm"
                />
              </div>
            </div>

            {/* Thumbnail Image (URL + File Upload) */}
            <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Image className="w-3.5 h-3.5 text-purple-400" />
                  <span>Thumbnail Image</span>
                </label>
                <label className="px-2.5 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors">
                  {uploadingThumb ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3 h-3" />
                      <span>Upload Image</span>
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
                  placeholder="https://images.unsplash.com/... or /uploads/quizzes/..."
                  className="flex-1 px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 text-xs font-mono"
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

            {/* Reward Points & Time Limit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950/50 border border-slate-800">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1 flex items-center gap-1">
                  <Award className="w-3 h-3 text-amber-400" />
                  <span>Completion Reward (PTS)</span>
                </label>
                <input
                  type="number"
                  name="reward_points"
                  value={formData.reward_points}
                  onChange={handleChange}
                  min="5"
                  max="1000"
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  <span>Time Limit (seconds)</span>
                </label>
                <input
                  type="number"
                  name="time_limit_seconds"
                  value={formData.time_limit_seconds}
                  onChange={handleChange}
                  min="15"
                  max="600"
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-sm"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Description / Overview
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={2}
                placeholder="Brief summary of quiz topic and challenge rules..."
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 text-sm"
              />
            </div>

            {/* Dynamic Questions Builder */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ListChecks className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Questions ({formData.questions_json.length})
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="px-3 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Question</span>
                </button>
              </div>

              {formData.questions_json.map((q, qIdx) => (
                <div 
                  key={qIdx}
                  className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-400">
                      Question #{qIdx + 1}
                    </span>

                    {formData.questions_json.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(qIdx)}
                        className="p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                        title="Delete this question"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    value={q.question}
                    onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                    placeholder={`e.g. Which developer created this franchise?`}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    required
                  />

                  <div className="space-y-2 pt-1">
                    <span className="text-[11px] text-slate-400 block font-medium">
                      Answer Choices (Select the radio of the correct answer):
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {['A', 'B', 'C', 'D'].map((letter, oIdx) => {
                        const isCorrect = q.correct_index === oIdx;
                        return (
                          <div 
                            key={oIdx}
                            className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                              isCorrect 
                                ? 'bg-emerald-950/40 border-emerald-500/60' 
                                : 'bg-slate-900 border-slate-800'
                            }`}
                          >
                            <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
                              <input
                                type="radio"
                                name={`correct_${qIdx}`}
                                checked={isCorrect}
                                onChange={() => handleCorrectAnswerChange(qIdx, oIdx)}
                                className="w-3.5 h-3.5 text-emerald-500 focus:ring-0 cursor-pointer"
                              />
                              <span className={`text-[11px] font-bold ${isCorrect ? 'text-emerald-400' : 'text-slate-400'}`}>
                                {letter}
                              </span>
                            </label>

                            <input
                              type="text"
                              value={q.options[oIdx] || ''}
                              onChange={(e) => handleOptionChange(qIdx, oIdx, e.target.value)}
                              placeholder={`Option ${letter}...`}
                              className="flex-1 bg-transparent border-0 text-white text-xs focus:outline-none placeholder-slate-600"
                              required
                            />

                            {isCorrect && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Active Status Toggle */}
            <div className="pt-2">
              <label className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer transition-all ${
                formData.is_active
                  ? 'bg-purple-500/15 border-purple-500/50 text-purple-300'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
              }`}>
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="w-4 h-4 rounded text-purple-500 focus:ring-0 bg-slate-900 border-slate-700 cursor-pointer"
                />
                <span className="text-xs font-bold">Active & Playable in Trivia Rotation</span>
              </label>
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3 sticky bottom-0 bg-slate-900 py-2">
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
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-purple-600/20 disabled:opacity-50 transition-all cursor-pointer flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving Quiz...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{quiz ? 'Update Quiz' : 'Publish Quiz'}</span>
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
