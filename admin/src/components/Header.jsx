import React from 'react';
import { Database, Bell, PlaySquare, Menu } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

export default function Header({ title, onOpenSimulator, onToggleMobileMenu, onOpenNotifications }) {
  const { unreadCount } = useSocket();

  return (
    <header className="h-16 px-4 sm:px-6 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between shrink-0 backdrop-blur-md sticky top-0 z-20">
      <div className="flex items-center gap-3">
        {/* Mobile menu toggle button */}
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <Menu className="w-4 h-4" />
        </button>

        <h2 className="text-base sm:text-lg font-bold text-white m-0 tracking-tight truncate max-w-[200px] sm:max-w-none">
          {title}
        </h2>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Unified Port & DB status */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs">
          <Database className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-400">ORM / MySQL:</span>
          <span className="flex items-center gap-1 font-semibold text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Port 5000 Active
          </span>
        </div>

        {/* Instant Notification Bell */}
        <button
          type="button"
          onClick={onOpenNotifications}
          className="relative p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500 text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Quick Simulator Launcher */}
        <button
          type="button"
          onClick={onOpenSimulator}
          className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
        >
          <PlaySquare className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Test Game Simulator</span>
          <span className="sm:hidden">Test</span>
        </button>
      </div>
    </header>
  );
}
