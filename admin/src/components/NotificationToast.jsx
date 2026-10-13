import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, CheckCircle2, ShieldAlert, Banknote, Sparkles, Trash2, Clock } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

export function NotificationToast() {
  const { activeToast, setActiveToast } = useSocket();

  if (!activeToast) return null;

  const getIcon = () => {
    switch (activeToast.type) {
      case 'cashout': return <Banknote className="w-5 h-5 text-emerald-400" />;
      case 'fraud': return <ShieldAlert className="w-5 h-5 text-rose-400" />;
      case 'success': return <CheckCircle2 className="w-5 h-5 text-teal-400" />;
      default: return <Sparkles className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className="fixed top-5 right-5 z-50 max-w-sm w-full p-4 rounded-2xl bg-slate-900/95 border border-cyan-500/40 shadow-2xl shadow-cyan-950/60 backdrop-blur-xl flex items-start gap-3 select-none"
      >
        <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 shrink-0">
          {getIcon()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-xs font-bold text-white truncate">{activeToast.title}</span>
            <span className="text-[10px] text-slate-500 font-mono">Just now</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed break-words m-0">
            {activeToast.message}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setActiveToast(null)}
          className="text-slate-500 hover:text-white p-1 rounded-lg transition-colors cursor-pointer shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

export function NotificationDrawer({ isOpen, onClose }) {
  const { notifications, unreadCount, markAllRead, clearNotifications } = useSocket();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-sm bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl"
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white m-0">Live Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500 text-white font-bold font-mono">
                  {unreadCount}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={clearNotifications}
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Clear All"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs flex flex-col items-center">
                <Bell className="w-8 h-8 text-slate-600 mb-2 opacity-50" />
                <span>No instant notifications yet. Real-time events will stream here!</span>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 hover:border-slate-700 transition-all text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white">{n.title}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px] m-0">{n.message}</p>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
