import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Gamepad2, Shield, Lock, Mail, ArrowRight, Sparkles, Key, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginView() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      await login(email, password);
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDemo = () => {
    setEmail('admin@gameloot.com');
    setPassword('admin123');
  };

  const navigateToLegal = (e, path) => {
    e.preventDefault();
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-[#070b14] overflow-hidden text-slate-100">
      {/* Background neon ambient gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-2/3 left-1/3 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} 
      />

      <motion.div 
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative w-full max-w-md"
      >
        {/* Glow halo */}
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-emerald-500/20 rounded-3xl blur-xl" />

        <div className="relative glass-card bg-slate-900/90 border border-slate-800/80 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <motion.div 
              whileHover={{ rotate: [0, -10, 10, 0] }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-purple-600 text-white shadow-lg shadow-cyan-500/25 mb-4"
            >
              <Gamepad2 className="w-8 h-8" />
            </motion.div>
            <h1 className="text-2xl font-black tracking-tight text-white m-0">
              GAMELOOT <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">HQ</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">Games Arcade Control Engine</p>
          </div>

          {errorMsg && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-2"
            >
              <Shield className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@gameloot.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Master Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all text-sm"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-3 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-cyan-500 hover:from-cyan-400 to-blue-600 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all transform active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authorizing Node...</span>
                </>
              ) : (
                <>
                  <span>Authenticate & Enter</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Fill Button */}
          <div className="mt-6 pt-6 border-t border-slate-800/80">
            <button
              type="button"
              onClick={handleQuickDemo}
              className="w-full py-2 px-3 rounded-lg text-xs font-medium text-slate-400 hover:text-cyan-400 bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Click to auto-fill default admin credentials</span>
            </button>
          </div>

          {/* Public Legal Compliance Footer Links - No Login Required */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-center gap-3 text-xs text-slate-400">
            <a
              href="/privacy"
              onClick={(e) => navigateToLegal(e, '/privacy')}
              className="hover:text-cyan-400 transition-colors flex items-center gap-1"
            >
              <Shield className="w-3 h-3 text-cyan-400" />
              <span>Privacy Policy</span>
            </a>
            <span className="text-slate-600">•</span>
            <a
              href="/terms"
              onClick={(e) => navigateToLegal(e, '/terms')}
              className="hover:text-cyan-400 transition-colors flex items-center gap-1"
            >
              <FileText className="w-3 h-3 text-cyan-400" />
              <span>Terms of Service</span>
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
