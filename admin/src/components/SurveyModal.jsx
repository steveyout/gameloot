import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ClipboardList, Plus, Trash2, Check, Clock, Award, 
  Image, Sparkles, Upload, Loader2, ListOrdered
} from 'lucide-react';
import { uploadImage } from '../services/api';

const PRESET_SURVEYS = [
  {
    title: 'PC & Console Gaming Hardware Setup',
    provider: 'GameLoot Hardware Research',
    description: 'Help us learn what GPUs, monitors, consoles, and headsets the community is currently playing on.',
    thumbnail_url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=500&q=80',
    reward_points: 120,
    estimated_minutes: 3,
    questions_json: [
      {
        id: 'q1',
        question: 'What is your primary gaming platform of choice?',
        options: ['Custom Windows Gaming PC', 'PlayStation 5 / PS4', 'Xbox Series X|S / One', 'Nintendo Switch / Mobile Handheld']
      },
      {
        id: 'q2',
        question: 'What monitor refresh rate do you primarily game at?',
        options: ['60Hz standard', '120Hz – 144Hz high refresh', '165Hz – 240Hz competitive', '360Hz+ esports display']
      },
      {
        id: 'q3',
        question: 'How many hours per week do you spend playing games?',
        options: ['1 to 5 hours', '6 to 15 hours', '16 to 30 hours', '30+ hours intense gaming']
      }
    ]
  },
  {
    title: 'Mobile Gaming & Rewarded Ads Preferences',
    provider: 'BitLabs Market Insights',
    description: 'Share your thoughts on how rewarded video ads, battle passes, and point cashouts compare in mobile games.',
    thumbnail_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500&q=80',
    reward_points: 150,
    estimated_minutes: 4,
    questions_json: [
      {
        id: 'q1',
        question: 'Which reward format do you prefer most in free-to-play titles?',
        options: ['Watching opt-in rewarded video ads for coins', 'Completing web surfing sponsor tasks', 'Leveling up free battle pass tiers', 'Paid microtransactions']
      },
      {
        id: 'q2',
        question: 'What payout method would you prefer when redeeming gaming rewards?',
        options: ['PayPal USD direct transfer', 'Crypto (USDT / Bitcoin)', 'Gift cards (Steam, Amazon, Google Play)', 'In-game items & skins']
      }
    ]
  }
];

export default function SurveyModal({ isOpen, onClose, onSave, survey }) {
  const [formData, setFormData] = useState({
    title: '',
    provider: 'GameLoot Research',
    description: '',
    thumbnail_url: '',
    reward_points: 120,
    estimated_minutes: 3,
    is_active: true,
    questions_json: []
  });

  const [saving, setSaving] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (survey) {
      setFormData({
        title: survey.title || '',
        provider: survey.provider || 'GameLoot Research',
        description: survey.description || '',
        thumbnail_url: survey.thumbnail_url || '',
        reward_points: survey.reward_points || 120,
        estimated_minutes: survey.estimated_minutes || 3,
        is_active: survey.is_active !== undefined ? !!survey.is_active : true,
        questions_json: Array.isArray(survey.questions_json) && survey.questions_json.length > 0
          ? JSON.parse(JSON.stringify(survey.questions_json))
          : [
              {
                id: 'q1',
                question: '',
                options: ['', '']
              }
            ]
      });
    } else {
      setFormData({
        title: '',
        provider: 'GameLoot Research',
        description: '',
        thumbnail_url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=500&q=80',
        reward_points: 120,
        estimated_minutes: 3,
        is_active: true,
        questions_json: [
          {
            id: 'q1',
            question: '',
            options: ['', '']
          }
        ]
      });
    }
    setError('');
  }, [survey, isOpen]);

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
        const res = await uploadImage(reader.result, file.name, 'surveys');
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

  // Questions and options management
  const handleAddQuestion = () => {
    setFormData(prev => ({
      ...prev,
      questions_json: [
        ...prev.questions_json,
        {
          id: `q_${Date.now()}`,
          question: '',
          options: ['', '']
        }
      ]
    }));
  };

  const handleRemoveQuestion = (qIdx) => {
    if (formData.questions_json.length <= 1) {
      setError('A survey must contain at least one question.');
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

  const handleAddOption = (qIdx) => {
    setFormData(prev => {
      const updated = [...prev.questions_json];
      const opts = [...(updated[qIdx].options || []), ''];
      updated[qIdx] = { ...updated[qIdx], options: opts };
      return { ...prev, questions_json: updated };
    });
  };

  const handleRemoveOption = (qIdx, oIdx) => {
    setFormData(prev => {
      const updated = [...prev.questions_json];
      const opts = updated[qIdx].options.filter((_, idx) => idx !== oIdx);
      if (opts.length < 2) return prev;
      updated[qIdx] = { ...updated[qIdx], options: opts };
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Survey Title is required.');
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
        setError(`Question #${i + 1} is missing prompt text.`);
        return;
      }
      if (!q.options || q.options.length < 2) {
        setError(`Question #${i + 1} must have at least 2 choices.`);
        return;
      }
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].trim()) {
          setError(`Question #${i + 1} option #${j + 1} is empty.`);
          return;
        }
      }
    }

    setSaving(true);
    setError('');
    try {
      await onSave({
        ...formData,
        reward_points: parseInt(formData.reward_points, 10) || 120,
        estimated_minutes: parseInt(formData.estimated_minutes, 10) || 3
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save survey');
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
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <ClipboardList className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white m-0">
                  {survey ? 'Edit Survey Questionnaire' : 'Create High-Reward Survey'}
                </h3>
                <p className="text-xs text-slate-400 m-0">Configure partner research questions, choices & reward points</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Presets */}
          {!survey && (
            <div className="px-6 pt-3 pb-2 bg-slate-950/30 border-b border-slate-800/60 shrink-0">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Quick 1-Click Survey Presets:
              </span>
              <div className="flex flex-wrap gap-2 pb-1">
                {PRESET_SURVEYS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-950/60 text-slate-300 hover:text-emerald-300 border border-slate-700 hover:border-emerald-700 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    <span>{p.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 text-sm">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {error}
              </div>
            )}

            {/* Title & Provider */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Survey Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Gamer Hardware & Peripherals"
                  className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Partner / Provider
                </label>
                <input
                  type="text"
                  name="provider"
                  value={formData.provider}
                  onChange={handleChange}
                  placeholder="GameLoot Research, BitLabs, Pollfish..."
                  className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>
            </div>

            {/* Thumbnail Image (URL + File Upload) */}
            <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Image className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Thumbnail Image</span>
                </label>
                <label className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors">
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
                  placeholder="https://images.unsplash.com/... or /uploads/surveys/..."
                  className="flex-1 px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs font-mono"
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

            {/* Reward & Estimated Minutes */}
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
                  min="10"
                  max="5000"
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  <span>Estimated Duration (minutes)</span>
                </label>
                <input
                  type="number"
                  name="estimated_minutes"
                  value={formData.estimated_minutes}
                  onChange={handleChange}
                  min="1"
                  max="60"
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-sm"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Description / Scope
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={2}
                placeholder="Target demographic and reward notes..."
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>

            {/* Dynamic Questions Builder */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ListOrdered className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Questions ({formData.questions_json.length})
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Question</span>
                </button>
              </div>

              {formData.questions_json.map((q, qIdx) => (
                <div 
                  key={qIdx}
                  className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400">
                      Question #{qIdx + 1}
                    </span>

                    {formData.questions_json.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(qIdx)}
                        className="p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                        title="Delete question"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    value={q.question}
                    onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                    placeholder="Enter question prompt..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    required
                  />

                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 font-medium">
                        Answer Options:
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAddOption(qIdx)}
                        className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Option</span>
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      {q.options?.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-2">
                          <span className="w-5 text-center text-[10px] font-bold text-slate-500">
                            {oIdx + 1}.
                          </span>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => handleOptionChange(qIdx, oIdx, e.target.value)}
                            placeholder={`Choice ${oIdx + 1}...`}
                            className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500"
                            required
                          />
                          {q.options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveOption(qIdx, oIdx)}
                              className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                              title="Remove option"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Active Status */}
            <div className="pt-2">
              <label className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer transition-all ${
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
                <span className="text-xs font-bold">Active & Open for Player Responses</span>
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
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition-all cursor-pointer flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving Survey...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{survey ? 'Update Survey' : 'Publish Survey'}</span>
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
