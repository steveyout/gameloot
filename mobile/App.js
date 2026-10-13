import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Platform, Animated, StatusBar as NativeStatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import io from 'socket.io-client';
import * as NavigationBar from 'expo-navigation-bar';

// Custom Hooks & Services
import { useAppUpdate } from './src/hooks/useAppUpdate';
import { userLogin, getNotifications } from './src/api/clientApi';
import { SOCKET_URL } from './src/api/config';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

// Components
import Header from './src/components/Header';
import Navbar from './src/components/Navbar';
import AlertBanner from './src/components/AlertBanner';
import PointsCelebration from './src/components/PointsCelebration';
import ForcedUpdateModal, { OptionalUpdateBanner } from './src/components/ForcedUpdateModal';
import GamePlayerModal from './src/components/GamePlayerModal';
import QuizModal from './src/components/QuizModal';
import SurfModal from './src/components/SurfModal';
import SurveyModal from './src/components/SurveyModal';
import AdRewardModal from './src/components/AdRewardModal';
import SwappableDrawerModal from './src/components/SwappableDrawerModal';
import DailyStreakModal from './src/components/DailyStreakModal';
import LuckyWheelModal from './src/components/LuckyWheelModal';
import SplashScreen from './src/components/SplashScreen';

// Screens
import AuthScreen from './src/screens/AuthScreen';
import LobbyScreen from './src/screens/LobbyScreen';
import EarnHubScreen from './src/screens/EarnHubScreen';
import RewardsScreen from './src/screens/RewardsScreen';
import WalletScreen from './src/screens/WalletScreen';

function MainApp() {
  const { theme, colors, isDark } = useTheme();
  const activeColors = colors || theme || {};
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [activeTab, setActiveTab] = useState('lobby');
  const [alert, setAlert] = useState(null);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [showSplash, setShowSplash] = useState(true);

  // Screen transition animations
  const screenFade = useRef(new Animated.Value(1)).current;
  const screenTranslateY = useRef(new Animated.Value(0)).current;
  const screenScale = useRef(new Animated.Value(1)).current;

  // Reward points celebration burst state
  const [celebration, setCelebration] = useState({ visible: false, points: 0, title: '' });

  // Active Modals
  const [activeGame, setActiveGame] = useState(null);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [activeSurf, setActiveSurf] = useState(null);
  const [activeSurvey, setActiveSurvey] = useState(null);
  const [showAdReward, setShowAdReward] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [drawerTab, setDrawerTab] = useState('notifications');
  const [showDailyStreak, setShowDailyStreak] = useState(false);
  const [showLuckyWheel, setShowLuckyWheel] = useState(false);

  // App Update Checker & Forced Update Hook
  const {
    updateInfo,
    isChecking: isCheckingUpdate,
    showForcedModal,
    showOptionalBanner,
    checkForUpdate,
    openUpdateUrl,
    openApkDownloadUrl,
    dismissOptionalBanner,
    currentVersion
  } = useAppUpdate();

  // Explicit Native Status Bar Sync
  useEffect(() => {
    NativeStatusBar.setBarStyle(isDark ? 'light-content' : 'dark-content', true);
    if (Platform.OS === 'android') {
      NativeStatusBar.setBackgroundColor(activeColors.background || (isDark ? '#090d16' : '#f8fafc'), true);
    }
  }, [isDark, activeColors.background]);

  // Android Immersive Sticky Mode:
  // Hides bottom system navigation bar buttons so they don't obstruct or hinder the app navbar.
  useEffect(() => {
    if (Platform.OS === 'android') {
      const configureStickyImmersiveNav = async () => {
        try {
          if (NavigationBar?.setVisibilityAsync) {
            await NavigationBar.setVisibilityAsync('hidden');
          }
          if (NavigationBar?.setBehaviorAsync) {
            await NavigationBar.setBehaviorAsync('overlay-swipe');
          }
          if (NavigationBar?.setBackgroundColorAsync) {
            await NavigationBar.setBackgroundColorAsync(activeColors.background || '#090d16');
          }
          if (NavigationBar?.setButtonStyleAsync) {
            await NavigationBar.setButtonStyleAsync(isDark ? 'light' : 'dark');
          }
        } catch (e) {
          // Gracefully continue on unsupported environments
        }
      };

      configureStickyImmersiveNav();

      let listener = null;
      try {
        if (typeof NavigationBar?.addVisibilityListener === 'function') {
          listener = NavigationBar.addVisibilityListener(({ visibility }) => {
            if (visibility === 'visible') {
              setTimeout(() => {
                try {
                  NavigationBar?.setVisibilityAsync?.('hidden').catch(() => {});
                } catch (_) {}
              }, 3000);
            }
          });
        }
      } catch (e) {}

      return () => {
        try {
          if (listener && typeof listener.remove === 'function') {
            listener.remove();
          }
        } catch (e) {}
      };
    }
  }, [activeColors.background, isDark]);

  // Smooth screen tab transition animation
  useEffect(() => {
    screenFade.setValue(0);
    screenTranslateY.setValue(10);
    screenScale.setValue(0.985);

    Animated.parallel([
      Animated.timing(screenFade, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true
      }),
      Animated.spring(screenTranslateY, {
        toValue: 0,
        friction: 8,
        tension: 85,
        useNativeDriver: true
      }),
      Animated.spring(screenScale, {
        toValue: 1,
        friction: 8,
        tension: 85,
        useNativeDriver: true
      })
    ]).start();
  }, [activeTab]);

  // Show customized in-app overlay alert toast (floating over UI, never pushes top nav!)
  const showAlert = (message, type = 'info', title = null, pts = null) => {
    setAlert({ message, type, title, pts });
  };

  const triggerCelebration = (points, title = '') => {
    if (points > 0) {
      setCelebration({ visible: true, points, title });
    }
  };

  // Real-time WebSocket connection for instant push broadcasts & bonus drops
  useEffect(() => {
    if (!token || !user) return;

    // Fetch initial unread count
    getNotifications(token)
      .then((res) => {
        if (res.success) {
          setUnreadNotificationsCount(res.unread_count || 0);
        }
      })
      .catch(() => {});

    // Listen for live broadcasts
    let socket = null;
    try {
      socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true
      });

      socket.on('connect', () => {
        socket.emit('join_client', { userId: user.id });
      });

      socket.on('client_notification', (notif) => {
        setUnreadNotificationsCount((prev) => prev + 1);
        showAlert(
          notif.message,
          notif.type === 'bonus' ? 'points' : notif.type === 'alert' ? 'error' : 'info',
          notif.title,
          notif.bonus_points > 0 ? notif.bonus_points : null
        );
        if (notif.bonus_points > 0) {
          triggerCelebration(notif.bonus_points, notif.title);
        }
      });
    } catch (e) {
      // Gracefully ignore socket failures
    }

    return () => {
      try {
        if (socket) socket.disconnect();
      } catch (_) {}
    };
  }, [token, user?.id]);

  const handleManualUpdateCheck = async () => {
    showAlert('Checking server for updates...', 'info', 'Version Guard');
    const result = await checkForUpdate();
    if (result && result.has_update) {
      if (result.update_required) {
        showAlert(`Critical update v${result.latest_version} required!`, 'error', 'Update Mandatory');
      } else {
        showAlert(`New version v${result.latest_version} available.`, 'info', 'Update Available');
      }
    } else {
      showAlert(`You are running the latest version (v${currentVersion}).`, 'success', 'Up to Date');
    }
  };

  const handleAuthSuccess = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    showAlert(`Welcome back, ${userData.username}!`, 'success', 'Session Authenticated');
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    showAlert('Signed out of GameLoot', 'info');
  };

  const handleRewardClaimed = ({ points, newBalance, gameTitle, title }) => {
    if (newBalance !== undefined && user) {
      setUser((prev) => ({ ...prev, points_balance: newBalance }));
    }
    const name = gameTitle || title || 'Task';
    if (points > 0) {
      triggerCelebration(points, name);
      showAlert(
        `Earned from ${name}! Points added to balance.`,
        'points',
        'Reward Collected',
        points
      );
    } else {
      showAlert(
        'Loot box was empty! Better luck on your next drop.',
        'info',
        'Try Again'
      );
    }
  };

  const handleStreakClaimed = ({ points, newBalance, day }) => {
    if (newBalance !== undefined && user) {
      setUser((prev) => ({ ...prev, points_balance: newBalance }));
    }
    triggerCelebration(points, `Day ${day} Streak 🔥`);
    showAlert(
      `Day ${day} streak bonus claimed! Points added to vault.`,
      'points',
      'Daily Check-in',
      points
    );
  };

  const handleWheelWon = ({ points, newBalance, label }) => {
    if (newBalance !== undefined && user) {
      setUser((prev) => ({ ...prev, points_balance: newBalance }));
    }
    if (points > 0) {
      triggerCelebration(points, `Lucky Wheel: ${label}`);
      showAlert(
        `Won ${label} (+${points} PTS) from Lucky Wheel!`,
        'points',
        'Lucky Wheel Bonus',
        points
      );
    } else {
      showAlert(
        'Better luck on your next daily spin!',
        'info',
        'Try Again'
      );
    }
  };

  const handleNotificationBonusClaimed = ({ points, newBalance, title }) => {
    if (newBalance !== undefined && user) {
      setUser((prev) => ({ ...prev, points_balance: newBalance }));
    }
    triggerCelebration(points, 'Bonus Drop 🎁');
    showAlert(
      `Bonus drop claimed: +${points} PTS added to your wallet!`,
      'points',
      'Bonus Claimed',
      points
    );
  };

  const handleRedemptionSuccess = ({ rewardTitle, cashUsd, newBalance }) => {
    if (newBalance !== undefined && user) {
      setUser((prev) => ({ ...prev, points_balance: newBalance }));
    }
    showAlert(
      `$${Number(cashUsd).toFixed(2)} (${rewardTitle}) request submitted for 24h payout.`,
      'success',
      'Cashout Processing'
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: activeColors.background || '#090d16' }]} edges={['top', 'left', 'right']}>
      <NativeStatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={activeColors.background || (isDark ? '#090d16' : '#f8fafc')}
        translucent={false}
      />
      <ExpoStatusBar
        style={isDark ? 'light' : 'dark'}
        backgroundColor={activeColors.background || (isDark ? '#090d16' : '#f8fafc')}
      />

      {/* Non-blocking Optional Update Banner */}
      <OptionalUpdateBanner
        visible={showOptionalBanner}
        latestVersion={updateInfo?.latest_version}
        onUpdatePress={openUpdateUrl}
        onDismiss={dismissOptionalBanner}
      />

      {/* Floating Overlay In-App Alert (Never pushes the top navigation or content) */}
      <AlertBanner alert={alert} onDismiss={() => setAlert(null)} />

      {/* Points Celebration Particles Burst */}
      <PointsCelebration
        points={celebration.points}
        title={celebration.title}
        visible={celebration.visible}
        onComplete={() => setCelebration({ visible: false, points: 0, title: '' })}
      />

      {/* Main View Container */}
      {!user ? (
        <AuthScreen
          onAuthSuccess={handleAuthSuccess}
          onErrorAlert={(msg) => showAlert(msg, 'error', 'Error')}
        />
      ) : (
        <View style={[styles.contentWrap, { backgroundColor: activeColors.background || '#090d16' }]}>
          {/* Top Status Header with Bell & Settings icons */}
          <Header
            user={user}
            pointsBalance={user.points_balance || 0}
            unreadNotificationsCount={unreadNotificationsCount}
            onOpenNotifications={() => {
              setDrawerTab('notifications');
              setShowDrawer(true);
            }}
            onOpenSettings={() => {
              setDrawerTab('settings');
              setShowDrawer(true);
            }}
            onCheckUpdate={handleManualUpdateCheck}
            isCheckingUpdate={isCheckingUpdate}
            onLogout={handleLogout}
          />

          {/* Active Screen Tab with smooth animated transition */}
          <View style={[styles.screenContainer, { backgroundColor: activeColors.background || '#090d16' }]}>
            <Animated.View
              style={[
                styles.animatedScreenWrap,
                {
                  opacity: screenFade,
                  transform: [
                    { translateY: screenTranslateY },
                    { scale: screenScale }
                  ]
                }
              ]}
            >
              {activeTab === 'lobby' && (
                <LobbyScreen
                  onSelectGame={(g) => setActiveGame(g)}
                  onOpenAdReward={() => setShowAdReward(true)}
                  onOpenDailyStreak={() => setShowDailyStreak(true)}
                  onOpenLuckyWheel={() => setShowLuckyWheel(true)}
                  onCheckUpdate={handleManualUpdateCheck}
                  isCheckingUpdate={isCheckingUpdate}
                  updateInfo={updateInfo}
                />
              )}

              {activeTab === 'earn' && (
                <EarnHubScreen
                  onSelectQuiz={(q) => setActiveQuiz(q)}
                  onSelectSurf={(s) => setActiveSurf(s)}
                  onSelectSurvey={(sur) => setActiveSurvey(sur)}
                  onOpenAdReward={() => setShowAdReward(true)}
                  onOpenDailyStreak={() => setShowDailyStreak(true)}
                  onOpenLuckyWheel={() => setShowLuckyWheel(true)}
                />
              )}

              {activeTab === 'rewards' && (
                <RewardsScreen
                  user={user}
                  token={token}
                  onRedemptionSuccess={handleRedemptionSuccess}
                  onErrorAlert={(msg) => showAlert(msg, 'error', 'Cashout Notice')}
                />
              )}

              {activeTab === 'wallet' && (
                <WalletScreen
                  user={user}
                  token={token}
                  onRefreshUser={(u) => setUser(u)}
                  onCheckUpdate={handleManualUpdateCheck}
                  isCheckingUpdate={isCheckingUpdate}
                  updateInfo={updateInfo}
                />
              )}
            </Animated.View>
          </View>

          {/* Bottom Navigation Bar with tactile spring physics */}
          <Navbar activeTab={activeTab} onTabSelect={setActiveTab} />
        </View>
      )}

      {/* HTML5 Game Player Container */}
      <GamePlayerModal
        visible={!!activeGame}
        game={activeGame}
        token={token}
        onClose={() => setActiveGame(null)}
        onRewardClaimed={handleRewardClaimed}
      />

      {/* Quizzes & Trivia Modal */}
      <QuizModal
        visible={!!activeQuiz}
        quiz={activeQuiz}
        token={token}
        onClose={() => setActiveQuiz(null)}
        onRewardClaimed={handleRewardClaimed}
      />

      {/* Web Surf Modal */}
      <SurfModal
        visible={!!activeSurf}
        task={activeSurf}
        token={token}
        onClose={() => setActiveSurf(null)}
        onRewardClaimed={handleRewardClaimed}
      />

      {/* Survey Modal */}
      <SurveyModal
        visible={!!activeSurvey}
        survey={activeSurvey}
        token={token}
        onClose={() => setActiveSurvey(null)}
        onRewardClaimed={handleRewardClaimed}
      />

      {/* Google AdMob Rewarded Video Simulation */}
      <AdRewardModal
        visible={showAdReward}
        token={token}
        onClose={() => setShowAdReward(false)}
        onRewardClaimed={handleRewardClaimed}
      />

      {/* Unified Swappable Drawer (Notifications & Drops <-> Settings & Preferences) */}
      <SwappableDrawerModal
        visible={showDrawer}
        initialTab={drawerTab}
        user={user}
        token={token}
        onClose={() => setShowDrawer(false)}
        onBonusClaimed={handleNotificationBonusClaimed}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          setShowDrawer(false);
        }}
        onUnreadChange={setUnreadNotificationsCount}
        onLogout={handleLogout}
        onCheckUpdate={handleManualUpdateCheck}
        isCheckingUpdate={isCheckingUpdate}
        updateInfo={updateInfo}
        onShowAlert={showAlert}
      />

      {/* 7-Day Daily Streak Check-in Calendar */}
      <DailyStreakModal
        visible={showDailyStreak}
        token={token}
        onClose={() => setShowDailyStreak(false)}
        onStreakClaimed={handleStreakClaimed}
      />

      {/* Daily Lucky Wheel / Spin to Win */}
      <LuckyWheelModal
        visible={showLuckyWheel}
        token={token}
        onClose={() => setShowLuckyWheel(false)}
        onRewardWon={handleWheelWon}
      />

      {/* CRITICAL: Forced Update Screen (Non-Dismissible in Production) */}
      <ForcedUpdateModal
        visible={showForcedModal}
        updateInfo={updateInfo}
        onUpdatePress={openUpdateUrl}
        onApkDownloadPress={openApkDownloadUrl}
      />

      {/* Animated Startup Splash Screen */}
      {showSplash && (
        <SplashScreen onFinish={() => setShowSplash(false)} />
      )}
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <MainApp />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16'
  },
  contentWrap: {
    flex: 1
  },
  screenContainer: {
    flex: 1
  },
  animatedScreenWrap: {
    flex: 1
  }
});
