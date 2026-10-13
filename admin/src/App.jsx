import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { AlertProvider } from './context/AlertContext';
import LoginView from './views/LoginView';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './views/DashboardView';
import GamesView from './views/GamesView';
import QuizzesView from './views/QuizzesView';
import SurfTasksView from './views/SurfTasksView';
import SurveysView from './views/SurveysView';
import AdRevenueView from './views/AdRevenueView';
import UsersView from './views/UsersView';
import RedemptionsView from './views/RedemptionsView';
import CategoriesView from './views/CategoriesView';
import FraudView from './views/FraudView';
import SettingsView from './views/SettingsView';
import NotificationsView from './views/NotificationsView';
import GameSimulatorModal from './components/GameSimulatorModal';
import { NotificationToast, NotificationDrawer } from './components/NotificationToast';
import { getGames, getDashboardStats } from './services/api';

function MainLayout() {
  const { admin, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [simulatorGame, setSimulatorGame] = useState(null);
  const [allGames, setAllGames] = useState([]);
  const [counts, setCounts] = useState({ pending_redemptions: 0, unreviewed_fraud: 0 });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    if (admin) {
      loadInitialData();
    }
  }, [admin]);

  const loadInitialData = async () => {
    try {
      const [gamesRes, statsRes] = await Promise.all([
        getGames(),
        getDashboardStats()
      ]);
      if (gamesRes.success) setAllGames(gamesRes.games);
      if (statsRes.success) {
        setCounts({
          pending_redemptions: statsRes.data.kpis.pending_redemptions || 0,
          unreviewed_fraud: statsRes.data.kpis.unreviewed_fraud || 0
        });
      }
    } catch (err) {
      console.warn('Initial data load warning:', err);
    }
  };

  const handleOpenSimulator = (game = null) => {
    if (game && game.embed_url) {
      setSimulatorGame(game);
    } else if (allGames.length > 0) {
      setSimulatorGame(allGames[0]);
    } else {
      setSimulatorGame({
        title: '2048 Cyber Edition',
        embed_url: 'https://play2048.co/',
        reward_rate: 1, // 1 pt/min
        orientation: 'portrait'
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-10 h-10 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold tracking-wider uppercase text-cyan-400">Loading GameLoot Engine...</span>
      </div>
    );
  }

  if (!admin) {
    return <LoginView />;
  }

  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Command Center Overview';
      case 'games': return 'HTML5 Game Embeds';
      case 'notifications': return 'Push & In-App Broadcasts';
      case 'quizzes': return 'Trivia & Knowledge Quizzes';
      case 'surf': return 'Web Surfing & Sponsor Tasks';
      case 'surveys': return 'Market Research & Surveys';
      case 'ads': return 'Ad Revenue & AdMob Economics';
      case 'users': return 'Players & Economy Ledger';
      case 'redemptions': return 'Reward Redemptions & Cashouts';
      case 'categories': return 'Game Genres & Categories';
      case 'fraud': return 'Security & Proof-of-Play Inspector';
      case 'settings': return 'System Settings & Config';
      default: return 'GameLoot Control Panel';
    }
  };

  return (
    <div className="flex h-screen bg-[#070b14] text-slate-100 overflow-hidden font-sans">
      {/* Toast Notification Container */}
      <NotificationToast />

      {/* Notifications History Drawer */}
      <NotificationDrawer
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />

      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        counts={counts}
        onOpenSimulator={() => handleOpenSimulator()}
        isMobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          title={getTabTitle()}
          onOpenSimulator={() => handleOpenSimulator()}
          onToggleMobileMenu={() => setMobileMenuOpen(prev => !prev)}
          onOpenNotifications={() => setNotificationsOpen(true)}
        />

        <main className="flex-1 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              onSelectTab={setActiveTab}
              onTestGame={handleOpenSimulator}
            />
          )}
          {activeTab === 'games' && (
            <GamesView onTestGame={handleOpenSimulator} />
          )}
          {activeTab === 'notifications' && <NotificationsView />}
          {activeTab === 'quizzes' && <QuizzesView />}
          {activeTab === 'surf' && <SurfTasksView />}
          {activeTab === 'surveys' && <SurveysView />}
          {activeTab === 'ads' && <AdRevenueView />}
          {activeTab === 'users' && <UsersView />}
          {activeTab === 'redemptions' && <RedemptionsView />}
          {activeTab === 'categories' && <CategoriesView />}
          {activeTab === 'fraud' && <FraudView />}
          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Global Interactive HTML5 Game Simulator Modal */}
      {simulatorGame && (
        <GameSimulatorModal
          game={simulatorGame}
          onClose={() => setSimulatorGame(null)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <AlertProvider>
          <MainLayout />
        </AlertProvider>
      </SocketProvider>
    </AuthProvider>
  );
}
