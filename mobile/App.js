import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Platform, Animated } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import io from 'socket.io-client';
import * as NavigationBar from 'expo-navigation-bar';

// Custom Hooks & Services
import { useAppUpdate } from './src/hooks/useAppUpdate';
import { userLogin, getNotifications } from './src/api/clientApi';
import { SOCKET_URL } from './src/api/config';

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
import NotificationModal from './src/components/NotificationModal';
import SettingsModal from './src/components/SettingsModal';
import DailyStreakModal from './src/components/DailyStreakModal';
import LuckyWheelModal from './src/components/LuckyWheelModal';

// Screens
import AuthScreen from './src/screens/AuthScreen';
import LobbyScreen from './src/screens/LobbyScreen';
import EarnHubScreen from './src/screens/EarnHubScreen';
import RewardsScreen from './src/screens/RewardsScreen';
import WalletScreen from './src/screens/WalletScreen';

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [activeTab, setActiveTab] = useState('lobby');
  const [alert, setAlert] = useState(null);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

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
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
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
    dismissForcedModal,
    currentVersion
  } = useAppUpdate();

  // Android Immersive Sticky Mode:
  // Hides bottom system navigation bar buttons so they don't obstruct or hinder the app navbar.
  // Accessible only by swiping up from the bottom edge, and automatically re-hides after interaction.
  useEffect(() => {
    if (Platform.OS === 'android') {
      const configureStickyImmersiveNav = async () => {
        try {
          await NavigationBar.setVisibilityAsync('hidden');
          await NavigationBar.setBehaviorAsync('overlay-swipe');
          await NavigationBar.setBackgroundColorAsync('#090d16');
          await NavigationBar.setButtonStyleAsync('light');
        } catch (e) {
          // Gracefully continue on unsupported environments
        }
      };

      configureStickyImmersiveNav();

      let listener = null;
      try {
        listener = NavigationBar.addVisibilityListener(({ visibility }) => {
          if (visibility === 'visible') {
            setTimeout(() => {
              NavigationBar.setVisibilityAsync('hidden').catch(() => {});
            }, 3000);
          }
        });
      } catch (e) {}

      return () => {
        if (listener && listener.remove) {
          listener.remove();
        }
      };
    }
  }, []);

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
    const socket = io(SOCKET_URL, {
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

    return () => {
      socket.disconnect();
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
    triggerCelebration(points, name);
    showAlert(
      `Earned from ${name}! Points added to balance.`,
      'points',
      'Reward Collected',
      points
    );
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
    triggerCelebration(points, `Lucky Wheel: ${label}`);
    showAlert(
      `Jackpot! Won ${label} from Lucky Wheel!`,
      'points',
      'Lucky Wheel Bonus',
      points
    );
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
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <ExpoStatusBar style="light" backgroundColor="#090d16" />

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
          <View style={styles.contentWrap}>
            {/* Top Status Header with Bell & Settings icons */}
            <Header
              user={user}
              pointsBalance={user.points_balance || 0}
              unreadNotificationsCount={unreadNotificationsCount}
              onOpenNotifications={() => setShowNotifications(true)}
              onOpenSettings={() => setShowSettings(true)}
              onCheckUpdate={handleManualUpdateCheck}
              isCheckingUpdate={isCheckingUpdate}
              onLogout={handleLogout}
            />

            {/* Active Screen Tab with smooth animated transition */}
            <View style={styles.screenContainer}>
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

        {/* In-App Notifications & Drops Center */}
        <NotificationModal
          visible={showNotifications}
          token={token}
          onClose={() => setShowNotifications(false)}
          onBonusClaimed={handleNotificationBonusClaimed}
          onNavigateTab={(tab) => {
            setActiveTab(tab);
            setShowNotifications(false);
          }}
          onUnreadChange={setUnreadNotificationsCount}
        />

        {/* In-App Settings & Preferences Modal */}
        <SettingsModal
          visible={showSettings}
          user={user}
          onClose={() => setShowSettings(false)}
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

        {/* CRITICAL: Forced Update Screen (Non-Dismissible in Prod, Bypassable in Dev) */}
        <ForcedUpdateModal
          visible={showForcedModal}
          updateInfo={updateInfo}
          onUpdatePress={openUpdateUrl}
          onApkDownloadPress={openApkDownloadUrl}
          onDismissDev={dismissForcedModal}
        />
      </SafeAreaView>
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
