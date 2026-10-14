import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Gamepad2, Users, Banknote, FolderTree, 
  ShieldAlert, Settings, LogOut, X, PlaySquare,
  HelpCircle, Globe, ClipboardList, Tv, BellRing
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({
  activeTab,
  onSelectTab,
  setActiveTab,
  counts,
  onOpenSimulator,
  isMobileOpen,
  onCloseMobile
}) {
  const { logout, admin } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'games', label: 'Games Catalog', icon: Gamepad2 },
    { id: 'notifications', label: 'Push Broadcasts', icon: BellRing },
    { id: 'quizzes', label: 'Trivia Quizzes', icon: HelpCircle },
    { id: 'surf', label: 'Web Surfing', icon: Globe },
    { id: 'surveys', label: 'Surveys', icon: ClipboardList },
    { id: 'ads', label: 'Ad Revenue & AdMob', icon: Tv },
    { id: 'users', label: 'Players', icon: Users },
    { 
      id: 'redemptions', 
      label: 'Payouts & Rewards', 
      icon: Banknote,
      badge: counts?.pending_redemptions > 0 ? counts.pending_redemptions : null,
      badgeColor: 'bg-amber-500'
    },
    { id: 'categories', label: 'Categories', icon: FolderTree },
    { 
      id: 'fraud', 
      label: 'Anti-Cheat / Fraud', 
      icon: ShieldAlert,
      badge: counts?.unreviewed_fraud > 0 ? counts.unreviewed_fraud : null,
      badgeColor: 'bg-rose-500'
    },
    { id: 'settings', label: 'System Settings', icon: Settings },
  ];

  const handleNavClick = (id) => {
    if (typeof onSelectTab === 'function') {
      onSelectTab(id);
    } else if (typeof setActiveTab === 'function') {
      setActiveTab(id);
    }
    if (typeof onCloseMobile === 'function') {
      onCloseMobile();
    }
  };

  const content = (
    <div className="w-64 h-full bg-slate-950 border-r border-slate-800/80 flex flex-col shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
            <Gamepad2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-white m-0 leading-none">
              GAMELOOT
            </h1>
            <span className="text-[10px] font-semibold tracking-wider text-cyan-400 uppercase">
              Control Engine
            </span>
          </div>
        </div>

        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Simulator Quick Launch Card */}
      <div className="px-4 py-3">
        <button
          type="button"
          onClick={() => {
            if (typeof onOpenSimulator === 'function') onOpenSimulator();
            if (typeof onCloseMobile === 'function') onCloseMobile();
          }}
          className="w-full p-2.5 rounded-xl bg-gradient-to-r from-cyan-950/60 to-purple-950/60 border border-cyan-500/30 hover:border-cyan-400/60 text-left transition-all group cursor-pointer shadow-sm"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-cyan-300 mb-0.5">
            <span className="flex items-center gap-1.5">
              <PlaySquare className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span>Game Simulator</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300">
              Live
            </span>
          </div>
          <p className="text-[11px] text-slate-400 m-0">Test game embed with loot HUD</p>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer relative ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/25 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span className={`text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Admin Profile & Logout */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-cyan-400 shrink-0">
              {admin?.username?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-white truncate">{admin?.username || 'Admin'}</div>
              <div className="text-[10px] text-slate-500 truncate">{admin?.role || 'Superadmin'}</div>
            </div>
          </div>

          <button
            onClick={logout}
            title="Log Out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex shrink-0">
        {content}
      </aside>

      <AnimatePresence>
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobile}
              className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative z-10"
            >
              {content}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
