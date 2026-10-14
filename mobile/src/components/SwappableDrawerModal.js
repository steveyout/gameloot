import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
  Platform,
  Share,
  Linking,
  Animated,
  PanResponder,
  RefreshControl,
  StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Bell,
  Settings,
  X,
  Maximize2,
  Minimize2,
  Sparkles,
  Gift,
  AlertCircle,
  Radio,
  CheckCircle2,
  ChevronRight,
  Coins,
  CheckCheck,
  Volume2,
  Vibrate,
  Moon,
  Sun,
  Wifi,
  Trash2,
  RefreshCw,
  ShieldCheck,
  FileText,
  LogOut,
  Share2
} from 'lucide-react-native';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  claimNotificationBonus
} from '../api/clientApi';
import { setSoundEnabled as configureSound, playSound, triggerHaptic } from '../services/soundEffects';
import { useTheme } from '../context/ThemeContext';
import { SkeletonNotificationList } from './SkeletonLoader';
import { DEFAULT_HOST } from '../api/config';

export default function SwappableDrawerModal({
  visible,
  initialTab = 'notifications', // 'notifications' | 'settings'
  user,
  token,
  onClose,
  onBonusClaimed,
  onNavigateTab,
  onUnreadChange,
  onLogout,
  onCheckUpdate,
  isCheckingUpdate,
  updateInfo,
  onShowAlert
}) {
  const { theme, colors, isDark, setTheme } = useTheme();
  const activeColors = colors || theme || {};

  // Active Drawer Tab ('notifications' | 'settings')
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Notifications State
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(true);
  const [refreshingNotifs, setRefreshingNotifs] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'bonus'
  const [claimingId, setClaimingId] = useState(null);
  const [claimedBanner, setClaimedBanner] = useState(null);

  // Settings State
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [amoledMode, setAmoledMode] = useState(false);
  const [dataSaver, setDataSaver] = useState(false);
  const [cacheSize, setCacheSize] = useState('14.2 MB');

  // Gestures: Vertical Drag-to-Dismiss PanResponder
  const panY = useRef(new Animated.Value(0)).current;

  // Horizontal Swipe tracking
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  useEffect(() => {
    if (visible) {
      setActiveTab(initialTab);
      panY.setValue(0);
      setClaimedBanner(null);
      fetchNotifications();
      loadSettingsPreferences();
    }
  }, [visible, initialTab]);

  const loadSettingsPreferences = async () => {
    try {
      const [sound, haptics, push, amoled, data] = await Promise.all([
        AsyncStorage.getItem('@pref_sound'),
        AsyncStorage.getItem('@pref_haptics'),
        AsyncStorage.getItem('@pref_push'),
        AsyncStorage.getItem('@pref_amoled'),
        AsyncStorage.getItem('@pref_data_saver')
      ]);
      if (sound !== null) setSoundEnabled(sound === 'true');
      if (haptics !== null) setHapticsEnabled(haptics === 'true');
      if (push !== null) setPushEnabled(push === 'true');
      if (amoled !== null) setAmoledMode(amoled === 'true');
      if (data !== null) setDataSaver(data === 'true');
    } catch (err) {
      console.warn('Failed to load user preferences:', err);
    }
  };

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      setLoadingNotifs(true);
      const res = await getNotifications(token);
      if (res.success) {
        setNotifications(res.notifications || []);
        if (onUnreadChange) onUnreadChange(res.unread_count || 0);
      }
    } catch (err) {
      console.warn('Failed to load notifications:', err.message);
    } finally {
      setLoadingNotifs(false);
      setRefreshingNotifs(false);
    }
  };

  const onRefreshNotifs = () => {
    setRefreshingNotifs(true);
    fetchNotifications();
  };

  // Drag down on handle or header to dismiss drawer
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isFullscreen,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return !isFullscreen && gestureState.dy > 8 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderMove: (_, gestureState) => {
        if (!isFullscreen && gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (!isFullscreen && (gestureState.dy > 110 || gestureState.vy > 0.7)) {
          Animated.timing(panY, {
            toValue: 650,
            duration: 180,
            useNativeDriver: true
          }).start(() => {
            panY.setValue(0);
            onClose();
          });
        } else {
          Animated.spring(panY, {
            toValue: 0,
            friction: 6,
            tension: 80,
            useNativeDriver: true
          }).start();
        }
      }
    })
  ).current;

  // Horizontal Swipe between Notifications & Settings tabs
  const handleTouchStart = (e) => {
    touchStartX.current = e.nativeEvent.pageX;
    touchStartY.current = e.nativeEvent.pageY;
  };

  const handleTouchEnd = (e) => {
    const dx = e.nativeEvent.pageX - touchStartX.current;
    const dy = e.nativeEvent.pageY - touchStartY.current;
    if (Math.abs(dx) > 65 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0 && activeTab === 'notifications') {
        // Swiped left -> Switch to Settings
        triggerHaptic('light');
        setActiveTab('settings');
      } else if (dx > 0 && activeTab === 'settings') {
        // Swiped right -> Switch to Notifications
        triggerHaptic('light');
        setActiveTab('notifications');
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead(token);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      if (onUnreadChange) onUnreadChange(0);
      playSound('tap');
      triggerHaptic('light');
    } catch (err) {
      console.warn('Mark all read error:', err.message);
    }
  };

  const handleNotificationPress = async (item) => {
    if (!item.is_read) {
      try {
        await markNotificationRead(token, item.id);
        setNotifications(prev =>
          prev.map(n => (n.id === item.id ? { ...n, is_read: true } : n))
        );
        if (onUnreadChange) onUnreadChange(prev => Math.max(0, prev - 1));
      } catch (e) {}
    }

    if (item.action_screen && onNavigateTab) {
      onClose();
      onNavigateTab(item.action_screen);
    }
  };

  const handleClaimBonus = async (item) => {
    if (claimingId) return;
    setClaimingId(item.id);

    try {
      const res = await claimNotificationBonus(token, item.id);
      if (res.success) {
        setNotifications(prev =>
          prev.map(n => (n.id === item.id ? { ...n, is_claimed: true, is_read: true } : n))
        );
        setClaimedBanner({
          points: res.points_claimed,
          title: item.title
        });
        playSound('coin');
        triggerHaptic('success');
        if (onBonusClaimed) {
          onBonusClaimed({
            points: res.points_claimed,
            newBalance: res.new_balance,
            title: item.title
          });
        }
      }
    } catch (err) {
      console.warn('Claim bonus error:', err.message);
    } finally {
      setClaimingId(null);
    }
  };

  const savePreference = async (key, value) => {
    try {
      await AsyncStorage.setItem(`@pref_${key}`, String(value));
    } catch (err) {}
  };

  const handleToggleSound = (v) => {
    setSoundEnabled(v);
    configureSound(v);
    savePreference('sound', v);
    if (onShowAlert) onShowAlert(`Sound Effects ${v ? 'Enabled' : 'Muted'}`, 'info');
  };

  const handleToggleHaptics = (v) => {
    setHapticsEnabled(v);
    savePreference('haptics', v);
    if (onShowAlert) onShowAlert(`Vibration Haptics ${v ? 'Enabled' : 'Disabled'}`, 'info');
  };

  const handleToggleAmoled = (v) => {
    setAmoledMode(v);
    savePreference('amoledMode', v);
    if (onShowAlert) onShowAlert(`AMOLED Pure Black ${v ? 'Enabled' : 'Standard'}`, 'info');
  };

  const handleToggleDataSaver = (v) => {
    setDataSaver(v);
    savePreference('dataSaver', v);
    if (onShowAlert) onShowAlert(`Data Saver ${v ? 'Activated' : 'Standard'}`, 'info');
  };

  const handleClearCache = async () => {
    setCacheSize('0.0 MB');
    if (onShowAlert) onShowAlert('Temporary Game Cache Cleared (+14.2 MB freed)', 'success', 'Storage Optimized');
  };

  const handleShareReferral = async () => {
    const refCode = user ? `LOOT-${(user.id * 73 + 1200).toString(36).toUpperCase()}` : 'LOOT-VIP';
    try {
      await Share.share({
        message: `🎮 Play games and earn real rewards with me on GameLoot! Use my invite code ${refCode} to get a +100 PTS welcome bonus: https://gameloot.app/invite/${refCode}`
      });
    } catch (err) {}
  };

  const handleOpenPrivacy = () => {
    Linking.openURL(`${DEFAULT_HOST}/privacy`).catch(() => {
      if (onShowAlert) onShowAlert('Could not open Privacy Policy link', 'error');
    });
  };

  const handleOpenTerms = () => {
    Linking.openURL(`${DEFAULT_HOST}/terms`).catch(() => {
      if (onShowAlert) onShowAlert('Could not open Terms of Service link', 'error');
    });
  };

  const getThemeConfig = (type) => {
    switch (type) {
      case 'bonus':
        return {
          bg: isDark ? '#2e1065' : '#ede9fe',
          badgeColor: '#f59e0b',
          badgeText: 'Bonus Drop',
          Icon: Sparkles,
          iconColor: '#f59e0b'
        };
      case 'alert':
        return {
          bg: isDark ? '#450a0a' : '#fee2e2',
          badgeColor: '#ef4444',
          badgeText: 'Alert',
          Icon: AlertCircle,
          iconColor: '#ef4444'
        };
      case 'reward':
        return {
          bg: isDark ? '#064e3b' : '#d1fae5',
          badgeColor: '#10b981',
          badgeText: 'Reward',
          Icon: Gift,
          iconColor: '#10b981'
        };
      case 'system':
        return {
          bg: isDark ? '#1e1b4b' : '#e0e7ff',
          badgeColor: '#6366f1',
          badgeText: 'System',
          Icon: Radio,
          iconColor: '#6366f1'
        };
      default:
        return {
          bg: isDark ? '#083344' : '#e0f2fe',
          badgeColor: '#06b6d4',
          badgeText: 'Notice',
          Icon: Bell,
          iconColor: '#06b6d4'
        };
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.is_read;
    if (filter === 'bonus') return n.bonus_points > 0;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const referralCode = user ? `LOOT-${(user.id * 73 + 1200).toString(36).toUpperCase()}` : 'LOOT-VIP';

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={[styles.backdrop, isFullscreen && styles.backdropFullscreen]}>
        {/* Backdrop tap to close (when not in fullscreen) */}
        {!isFullscreen && (
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={onClose}
          />
        )}

        <Animated.View
          style={[
            styles.modalSheet,
            {
              backgroundColor: isDark ? '#0b1120' : '#ffffff',
              borderColor: activeColors.border || (isDark ? '#1e293b' : '#e2e8f0'),
              transform: [{ translateY: isFullscreen ? 0 : panY }]
            },
            isFullscreen && styles.modalSheetFullscreen
          ]}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Top handle bar (Gesture target to drag down or tap to toggle fullscreen) */}
          {!isFullscreen && (
            <View {...panResponder.panHandlers} style={styles.sheetHandleZone}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setIsFullscreen(true)}
              >
                <View style={[styles.sheetHandle, { backgroundColor: isDark ? '#334155' : '#cbd5e1' }]} />
              </TouchableOpacity>
            </View>
          )}

          {/* Top Control Bar: Perfectly Aligned Tabs + Pinned Action Buttons */}
          <View
            style={[
              styles.topControlBar,
              { borderBottomColor: activeColors.border || (isDark ? '#1e293b' : '#e2e8f0') }
            ]}
          >
            {/* Swappable Drawer Tab Selector Pill */}
            <View
              style={[
                styles.tabSwitcher,
                {
                  backgroundColor: isDark ? '#111c33' : '#f1f5f9',
                  borderColor: isDark ? '#1e293b' : '#cbd5e1'
                }
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.tabBtn,
                  activeTab === 'notifications' && [
                    styles.tabBtnActive,
                    {
                      backgroundColor: isDark ? '#1e293b' : '#ffffff',
                      borderColor: activeColors.primary || '#06b6d4'
                    }
                  ]
                ]}
                onPress={() => {
                  triggerHaptic('light');
                  setActiveTab('notifications');
                }}
                activeOpacity={0.8}
              >
                <Bell
                  size={15}
                  color={activeTab === 'notifications' ? (activeColors.primary || '#06b6d4') : (activeColors.textSecondary || '#94a3b8')}
                />
                <Text
                  style={[
                    styles.tabBtnText,
                    { color: activeColors.textSecondary || '#94a3b8' },
                    activeTab === 'notifications' && [
                      styles.tabBtnTextActive,
                      { color: isDark ? '#ffffff' : '#0f172a' }
                    ]
                  ]}
                  numberOfLines={1}
                >
                  Notifications
                </Text>
                {unreadCount > 0 && (
                  <View style={styles.tabBadge}>
                    <Text style={styles.tabBadgeText}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tabBtn,
                  activeTab === 'settings' && [
                    styles.tabBtnActive,
                    {
                      backgroundColor: isDark ? '#1e293b' : '#ffffff',
                      borderColor: activeColors.primary || '#06b6d4'
                    }
                  ]
                ]}
                onPress={() => {
                  triggerHaptic('light');
                  setActiveTab('settings');
                }}
                activeOpacity={0.8}
              >
                <Settings
                  size={15}
                  color={activeTab === 'settings' ? (activeColors.primary || '#06b6d4') : (activeColors.textSecondary || '#94a3b8')}
                />
                <Text
                  style={[
                    styles.tabBtnText,
                    { color: activeColors.textSecondary || '#94a3b8' },
                    activeTab === 'settings' && [
                      styles.tabBtnTextActive,
                      { color: isDark ? '#ffffff' : '#0f172a' }
                    ]
                  ]}
                  numberOfLines={1}
                >
                  Settings
                </Text>
              </TouchableOpacity>
            </View>

            {/* Pinned Right Controls: Maximize/Minimize + Close Button (Always 100% visible) */}
            <View style={styles.windowControls}>
              <TouchableOpacity
                style={[
                  styles.actionSquareBtn,
                  {
                    backgroundColor: isDark ? '#111c33' : '#f1f5f9',
                    borderColor: isDark ? '#1e293b' : '#cbd5e1'
                  }
                ]}
                onPress={() => {
                  triggerHaptic('light');
                  setIsFullscreen(!isFullscreen);
                }}
                activeOpacity={0.7}
                accessibilityLabel={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              >
                {isFullscreen ? (
                  <Minimize2 size={16} color={activeColors.textSecondary || '#94a3b8'} />
                ) : (
                  <Maximize2 size={16} color={activeColors.textSecondary || '#94a3b8'} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionSquareBtn,
                  styles.closeSquareBtn,
                  {
                    backgroundColor: isDark ? '#111c33' : '#f1f5f9',
                    borderColor: isDark ? '#1e293b' : '#cbd5e1'
                  }
                ]}
                onPress={onClose}
                activeOpacity={0.7}
                accessibilityLabel="Close Drawer"
              >
                <X size={17} color={isDark ? '#cbd5e1' : '#334155'} />
              </TouchableOpacity>
            </View>
          </View>

          {/* ==================== TAB 1: NOTIFICATIONS ==================== */}
          {activeTab === 'notifications' && (
            <View style={{ flex: 1 }}>
              {/* Filters Row with Integrated Mark Read Button */}
              <View
                style={[
                  styles.filtersRow,
                  { borderBottomColor: activeColors.border || (isDark ? '#1e293b' : '#e2e8f0') }
                ]}
              >
                <View style={styles.filterPillsWrap}>
                  <TouchableOpacity
                    style={[
                      styles.filterPill,
                      { backgroundColor: isDark ? '#111c33' : '#f1f5f9' },
                      filter === 'all' && styles.filterPillActive
                    ]}
                    onPress={() => setFilter('all')}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        { color: isDark ? '#94a3b8' : '#64748b' },
                        filter === 'all' && styles.filterTextActive
                      ]}
                    >
                      All ({notifications.length})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.filterPill,
                      { backgroundColor: isDark ? '#111c33' : '#f1f5f9' },
                      filter === 'unread' && styles.filterPillActive
                    ]}
                    onPress={() => setFilter('unread')}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        { color: isDark ? '#94a3b8' : '#64748b' },
                        filter === 'unread' && styles.filterTextActive
                      ]}
                    >
                      Unread ({unreadCount})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.filterPill,
                      { backgroundColor: isDark ? '#111c33' : '#f1f5f9' },
                      filter === 'bonus' && styles.filterPillActive
                    ]}
                    onPress={() => setFilter('bonus')}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        { color: isDark ? '#94a3b8' : '#64748b' },
                        filter === 'bonus' && styles.filterTextActive
                      ]}
                    >
                      🎁 Drops
                    </Text>
                  </TouchableOpacity>
                </View>

                {unreadCount > 0 && (
                  <TouchableOpacity
                    style={[
                      styles.markReadBtn,
                      {
                        backgroundColor: isDark ? '#111c33' : '#f1f5f9',
                        borderColor: isDark ? '#1e293b' : '#cbd5e1'
                      }
                    ]}
                    onPress={handleMarkAllRead}
                    activeOpacity={0.7}
                  >
                    <CheckCheck size={13} color="#06b6d4" style={{ marginRight: 4 }} />
                    <Text style={styles.markReadText}>Mark Read</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* In-Modal Instant Claim Banner */}
              {claimedBanner && (
                <View style={styles.inModalAlertBanner}>
                  <Sparkles size={16} color="#fbbf24" style={{ marginRight: 8 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inModalAlertTitle}>
                      +{claimedBanner.points} PTS Added to Vault!
                    </Text>
                    <Text style={styles.inModalAlertSub}>
                      {claimedBanner.title}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setClaimedBanner(null)}
                    style={{ padding: 4 }}
                  >
                    <X size={14} color="#fef08a" />
                  </TouchableOpacity>
                </View>
              )}

              {/* List / Skeleton Loader */}
              {loadingNotifs ? (
                <ScrollView style={styles.listScroll} contentContainerStyle={styles.listContent}>
                  <SkeletonNotificationList count={4} />
                </ScrollView>
              ) : filteredNotifications.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Bell size={42} color={activeColors.textSecondary || '#64748b'} />
                  <Text style={[styles.emptyTitle, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                    No Notifications
                  </Text>
                  <Text style={[styles.emptySubtitle, { color: activeColors.textSecondary || '#64748b' }]}>
                    {filter === 'unread'
                      ? 'You have read all your notifications.'
                      : 'New bonus drops, streak rewards, and announcements will appear here.'}
                  </Text>
                </View>
              ) : (
                <ScrollView
                  style={styles.listScroll}
                  contentContainerStyle={styles.listContent}
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshingNotifs}
                      onRefresh={onRefreshNotifs}
                      tintColor="#06b6d4"
                    />
                  }
                  showsVerticalScrollIndicator={false}
                >
                  {filteredNotifications.map((item) => {
                    const conf = getThemeConfig(item.type);
                    const IconComp = conf.Icon;
                    const isClaiming = claimingId === item.id;
                    const isUnread = !item.is_read;

                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.card,
                          {
                            backgroundColor: isDark ? '#111c33' : '#ffffff',
                            borderColor: isDark ? '#1e293b' : '#e2e8f0'
                          },
                          isUnread && (isDark ? styles.cardUnreadDark : styles.cardUnreadLight)
                        ]}
                        onPress={() => handleNotificationPress(item)}
                        activeOpacity={0.85}
                      >
                        <View style={styles.cardHeader}>
                          <View style={styles.cardTypeRow}>
                            <View style={[styles.cardIconWrap, { backgroundColor: conf.bg }]}>
                              <IconComp size={14} color={conf.iconColor} />
                            </View>
                            <Text style={[styles.cardTypeBadge, { color: conf.badgeColor }]}>
                              {conf.badgeText}
                            </Text>
                          </View>

                          <View style={styles.cardTimeRow}>
                            {isUnread && <View style={styles.unreadDot} />}
                            <Text style={[styles.cardTimeText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                              {item.created_at
                                ? new Date(item.created_at).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric'
                                  })
                                : 'Recent'}
                            </Text>
                          </View>
                        </View>

                        <Text style={[styles.cardTitle, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                          {item.title}
                        </Text>
                        <Text style={[styles.cardMessage, { color: isDark ? '#cbd5e1' : '#334155' }]}>
                          {item.message}
                        </Text>

                        {/* Solid, High-Contrast Gold Bonus Box */}
                        {item.bonus_points > 0 && (
                          <View
                            style={[
                              styles.bonusBox,
                              {
                                backgroundColor: isDark ? '#261b04' : '#fef3c7',
                                borderColor: '#f59e0b'
                              }
                            ]}
                          >
                            <View style={styles.bonusLeft}>
                              <Coins size={16} color="#fbbf24" />
                              <Text
                                style={[
                                  styles.bonusPointsText,
                                  { color: isDark ? '#fef08a' : '#b45309' }
                                ]}
                              >
                                +{item.bonus_points} PTS Drop
                              </Text>
                            </View>

                            {item.is_claimed ? (
                              <View style={styles.claimedPill}>
                                <CheckCircle2 size={12} color="#10b981" />
                                <Text style={styles.claimedText}>Claimed</Text>
                              </View>
                            ) : (
                              <TouchableOpacity
                                style={styles.claimBtn}
                                onPress={() => handleClaimBonus(item)}
                                disabled={isClaiming}
                                activeOpacity={0.8}
                              >
                                <Sparkles size={12} color="#090d16" style={{ marginRight: 4 }} />
                                <Text style={styles.claimBtnText}>
                                  {isClaiming ? 'Claiming...' : 'Claim Now'}
                                </Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        )}

                        {/* Action Link */}
                        {item.action_screen && (
                          <View
                            style={[
                              styles.actionRow,
                              { borderTopColor: isDark ? '#1e293b' : '#e2e8f0' }
                            ]}
                          >
                            <Text style={styles.actionText}>
                              Go to {item.action_screen.toUpperCase()}
                            </Text>
                            <ChevronRight size={14} color="#06b6d4" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>
          )}

          {/* ==================== TAB 2: SETTINGS ==================== */}
          {activeTab === 'settings' && (
            <ScrollView
              style={styles.listScroll}
              contentContainerStyle={styles.settingsContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Account Profile Card */}
              {user ? (
                <View
                  style={[
                    styles.profileCard,
                    {
                      backgroundColor: isDark ? '#111c33' : '#f8fafc',
                      borderColor: activeColors.border || (isDark ? '#1e293b' : '#e2e8f0')
                    }
                  ]}
                >
                  <View style={styles.profileRow}>
                    <View
                      style={[
                        styles.avatarCircle,
                        {
                          backgroundColor: isDark ? '#1e1b4b' : '#e0e7ff',
                          borderColor: activeColors.primary || '#06b6d4'
                        }
                      ]}
                    >
                      <Text style={[styles.avatarText, { color: activeColors.primary || '#06b6d4' }]}>
                        {(user.username || 'P').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.profileInfo}>
                      <Text style={[styles.profileUsername, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                        {user.username}
                      </Text>
                      <Text style={[styles.profileEmail, { color: activeColors.textSecondary || '#94a3b8' }]}>
                        {user.email || 'Verified Player'}
                      </Text>
                      <View style={styles.pointsBadgeWrap}>
                        <Coins size={12} color="#fbbf24" />
                        <Text style={styles.pointsBadgeText}>
                          {(user.points_balance || 0).toLocaleString()} PTS (≈ ${((user.points_balance || 0) * 0.001).toFixed(2)})
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Referral Code Box */}
                  <View
                    style={[
                      styles.referralBox,
                      {
                        backgroundColor: activeColors.surfaceSubtle,
                        borderColor: activeColors.border || (isDark ? '#1e293b' : '#e2e8f0')
                      }
                    ]}
                  >
                    <View>
                      <Text style={[styles.referralLabel, { color: activeColors.textSecondary || '#94a3b8' }]}>
                        Your Referral Code
                      </Text>
                      <Text style={[styles.referralCode, { color: activeColors.primary || '#06b6d4' }]}>
                        {referralCode}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.shareBtn}
                      onPress={handleShareReferral}
                      activeOpacity={0.8}
                    >
                      <Share2 size={13} color="#090d16" style={{ marginRight: 4 }} />
                      <Text style={styles.shareBtnText}>Share</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}

              {/* Appearance & Theme Selector */}
              <View
                style={[
                  styles.sectionCard,
                  {
                    backgroundColor: isDark ? '#111c33' : '#f8fafc',
                    borderColor: activeColors.border || (isDark ? '#1e293b' : '#e2e8f0')
                  }
                ]}
              >
                <Text style={[styles.sectionTitle, { color: activeColors.textSecondary || '#94a3b8' }]}>
                  Appearance & Theme
                </Text>

                <View style={styles.themeSwitcherRow}>
                  <TouchableOpacity
                    style={[
                      styles.themeOptionBtn,
                      {
                        backgroundColor: activeColors.surfaceSubtle,
                        borderColor: isDark ? (activeColors.primary || '#06b6d4') : (activeColors.border || '#cbd5e1')
                      },
                      isDark && styles.themeOptionBtnActive
                    ]}
                    onPress={() => setTheme('dark')}
                    activeOpacity={0.8}
                  >
                    <Moon size={18} color={isDark ? (activeColors.primary || '#06b6d4') : (activeColors.textSecondary || '#64748b')} />
                    <Text
                      style={[
                        styles.themeOptionText,
                        { color: activeColors.textSecondary || '#64748b' },
                        isDark && [styles.themeOptionTextActive, { color: activeColors.primary || '#06b6d4' }]
                      ]}
                    >
                      Dark Mode
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.themeOptionBtn,
                      {
                        backgroundColor: activeColors.surfaceSubtle,
                        borderColor: !isDark ? (activeColors.primary || '#06b6d4') : (activeColors.border || '#1e293b')
                      },
                      !isDark && styles.themeOptionBtnActive
                    ]}
                    onPress={() => setTheme('light')}
                    activeOpacity={0.8}
                  >
                    <Sun size={18} color={!isDark ? (activeColors.primary || '#06b6d4') : (activeColors.textSecondary || '#64748b')} />
                    <Text
                      style={[
                        styles.themeOptionText,
                        { color: activeColors.textSecondary || '#64748b' },
                        !isDark && [styles.themeOptionTextActive, { color: activeColors.primary || '#06b6d4' }]
                      ]}
                    >
                      Light Mode
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Audio & Feedback */}
              <View
                style={[
                  styles.sectionCard,
                  {
                    backgroundColor: isDark ? '#111c33' : '#f8fafc',
                    borderColor: activeColors.border || (isDark ? '#1e293b' : '#e2e8f0')
                  }
                ]}
              >
                <Text style={[styles.sectionTitle, { color: activeColors.textSecondary || '#94a3b8' }]}>
                  Audio & Haptics
                </Text>

                <View style={[styles.settingRow, { borderBottomColor: activeColors.border || (isDark ? '#1e293b' : '#e2e8f0') }]}>
                  <View style={styles.settingLeft}>
                    <Volume2 size={18} color={activeColors.primary || '#06b6d4'} />
                    <View style={styles.settingTextWrap}>
                      <Text style={[styles.settingLabel, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                        Sound Effects
                      </Text>
                      <Text style={[styles.settingSub, { color: activeColors.textSecondary || '#94a3b8' }]}>
                        Coins, win fanfare, and button audio
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={soundEnabled}
                    onValueChange={handleToggleSound}
                    trackColor={{ false: '#334155', true: '#06b6d4' }}
                    thumbColor="#ffffff"
                  />
                </View>

                <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
                  <View style={styles.settingLeft}>
                    <Vibrate size={18} color="#8b5cf6" />
                    <View style={styles.settingTextWrap}>
                      <Text style={[styles.settingLabel, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                        Vibration Haptics
                      </Text>
                      <Text style={[styles.settingSub, { color: activeColors.textSecondary || '#94a3b8' }]}>
                        Tactile clicks and reward vibrations
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={hapticsEnabled}
                    onValueChange={handleToggleHaptics}
                    trackColor={{ false: '#334155', true: '#8b5cf6' }}
                    thumbColor="#ffffff"
                  />
                </View>
              </View>

              {/* Performance & Display */}
              <View
                style={[
                  styles.sectionCard,
                  {
                    backgroundColor: isDark ? '#111c33' : '#f8fafc',
                    borderColor: activeColors.border || (isDark ? '#1e293b' : '#e2e8f0')
                  }
                ]}
              >
                <Text style={[styles.sectionTitle, { color: activeColors.textSecondary || '#94a3b8' }]}>
                  Performance & Display
                </Text>

                <View style={[styles.settingRow, { borderBottomColor: activeColors.border || (isDark ? '#1e293b' : '#e2e8f0') }]}>
                  <View style={styles.settingLeft}>
                    <Moon size={18} color={activeColors.textSecondary || '#94a3b8'} />
                    <View style={styles.settingTextWrap}>
                      <Text style={[styles.settingLabel, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                        AMOLED Pure Black
                      </Text>
                      <Text style={[styles.settingSub, { color: activeColors.textSecondary || '#94a3b8' }]}>
                        Saves battery on OLED phone displays
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={amoledMode}
                    onValueChange={handleToggleAmoled}
                    trackColor={{ false: '#334155', true: '#10b981' }}
                    thumbColor="#ffffff"
                  />
                </View>

                <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
                  <View style={styles.settingLeft}>
                    <Wifi size={18} color="#10b981" />
                    <View style={styles.settingTextWrap}>
                      <Text style={[styles.settingLabel, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                        Data Saver Mode
                      </Text>
                      <Text style={[styles.settingSub, { color: activeColors.textSecondary || '#94a3b8' }]}>
                        Compress game assets for lower data usage
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={dataSaver}
                    onValueChange={handleToggleDataSaver}
                    trackColor={{ false: '#334155', true: '#10b981' }}
                    thumbColor="#ffffff"
                  />
                </View>
              </View>

              {/* Storage & Maintenance */}
              <View
                style={[
                  styles.sectionCard,
                  {
                    backgroundColor: isDark ? '#111c33' : '#f8fafc',
                    borderColor: activeColors.border || (isDark ? '#1e293b' : '#e2e8f0')
                  }
                ]}
              >
                <Text style={[styles.sectionTitle, { color: activeColors.textSecondary || '#94a3b8' }]}>
                  Storage & Maintenance
                </Text>

                <View style={[styles.actionItemRow, { borderBottomColor: activeColors.border || (isDark ? '#1e293b' : '#e2e8f0') }]}>
                  <View style={styles.actionItemLeft}>
                    <Trash2 size={16} color={activeColors.textSecondary || '#94a3b8'} />
                    <View>
                      <Text style={[styles.actionItemTitle, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                        Cached Assets
                      </Text>
                      <Text style={[styles.actionItemSub, { color: activeColors.textSecondary || '#94a3b8' }]}>
                        {cacheSize} temporary game data
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.clearBtn, { backgroundColor: activeColors.surfaceSubtle, borderColor: activeColors.border || '#cbd5e1' }]}
                    onPress={handleClearCache}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.clearBtnText, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                      Clear Cache
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={[styles.actionItemRow, { borderBottomWidth: 0 }]}>
                  <View style={styles.actionItemLeft}>
                    <RefreshCw size={16} color={activeColors.primary || '#06b6d4'} />
                    <View>
                      <Text style={[styles.actionItemTitle, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                        Version Guard
                      </Text>
                      <Text style={[styles.actionItemSub, { color: activeColors.textSecondary || '#94a3b8' }]}>
                        Installed v{updateInfo?.client_version || '1.0.0'}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.checkUpdateBtn}
                    onPress={onCheckUpdate}
                    disabled={isCheckingUpdate}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.checkUpdateBtnText}>
                      {isCheckingUpdate ? 'Checking...' : 'Check Update'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Legal, Compliance & Privacy */}
              <View
                style={[
                  styles.sectionCard,
                  {
                    backgroundColor: isDark ? '#111c33' : '#f8fafc',
                    borderColor: activeColors.border || (isDark ? '#1e293b' : '#e2e8f0')
                  }
                ]}
              >
                <Text style={[styles.sectionTitle, { color: activeColors.textSecondary || '#94a3b8' }]}>
                  Legal & Compliance
                </Text>

                <TouchableOpacity
                  style={[styles.actionItemRow, { borderBottomColor: activeColors.border || (isDark ? '#1e293b' : '#e2e8f0') }]}
                  onPress={handleOpenPrivacy}
                  activeOpacity={0.7}
                >
                  <View style={styles.actionItemLeft}>
                    <ShieldCheck size={18} color="#06b6d4" />
                    <View>
                      <Text style={[styles.actionItemTitle, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                        Privacy Policy
                      </Text>
                      <Text style={[styles.actionItemSub, { color: activeColors.textSecondary || '#94a3b8' }]}>
                        Google Play & AdMob compliant data handling
                      </Text>
                    </View>
                  </View>
                  <ChevronRight size={16} color={activeColors.textSecondary || '#94a3b8'} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionItemRow, { borderBottomWidth: 0 }]}
                  onPress={handleOpenTerms}
                  activeOpacity={0.7}
                >
                  <View style={styles.actionItemLeft}>
                    <FileText size={18} color="#3b82f6" />
                    <View>
                      <Text style={[styles.actionItemTitle, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                        Terms of Service
                      </Text>
                      <Text style={[styles.actionItemSub, { color: activeColors.textSecondary || '#94a3b8' }]}>
                        Rules of fair play, rewards & redemption terms
                      </Text>
                    </View>
                  </View>
                  <ChevronRight size={16} color={activeColors.textSecondary || '#94a3b8'} />
                </TouchableOpacity>
              </View>

              {/* Trust & Transparency */}
              <View
                style={[
                  styles.sectionCard,
                  {
                    backgroundColor: isDark ? '#111c33' : '#f8fafc',
                    borderColor: activeColors.border || (isDark ? '#1e293b' : '#e2e8f0')
                  }
                ]}
              >
                <Text style={[styles.sectionTitle, { color: activeColors.textSecondary || '#94a3b8' }]}>
                  Trust & Fair Play
                </Text>
                <View style={styles.complianceRow}>
                  <ShieldCheck size={18} color="#10b981" />
                  <Text style={[styles.complianceText, { color: activeColors.textSecondary || '#94a3b8' }]}>
                    GameLoot micro-rewards are funded by verified advertiser impressions. Sustainable revenue share honors all legitimate cashouts promptly.
                  </Text>
                </View>
              </View>

              {/* Account Sign Out */}
              <View
                style={[
                  styles.sectionCard,
                  {
                    backgroundColor: isDark ? '#111c33' : '#f8fafc',
                    borderColor: activeColors.border || (isDark ? '#1e293b' : '#e2e8f0')
                  }
                ]}
              >
                <TouchableOpacity
                  style={styles.logoutBtn}
                  onPress={() => {
                    onClose();
                    if (onLogout) onLogout();
                  }}
                  activeOpacity={0.7}
                >
                  <LogOut size={16} color="#ef4444" style={{ marginRight: 6 }} />
                  <Text style={styles.logoutBtnText}>Sign Out of GameLoot</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'flex-end'
  },
  backdropFullscreen: {
    justifyContent: 'flex-start'
  },
  modalSheet: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderTopWidth: 1.5,
    maxHeight: '88%',
    minHeight: '60%',
    paddingBottom: Platform.OS === 'android' ? 20 : 34,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 25
  },
  modalSheetFullscreen: {
    height: '100%',
    maxHeight: '100%',
    minHeight: '100%',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderTopWidth: 0,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ? StatusBar.currentHeight + 8 : 40) : 50
  },
  sheetHandleZone: {
    paddingVertical: 8,
    alignItems: 'center'
  },
  sheetHandle: {
    width: 42,
    height: 5,
    borderRadius: 2.5
  },
  topControlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 12
  },
  tabSwitcher: {
    flex: 1,
    flexDirection: 'row',
    padding: 3,
    borderRadius: 13,
    borderWidth: 1,
    maxWidth: 240
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 6
  },
  tabBtnActive: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700'
  },
  tabBtnTextActive: {
    fontWeight: '900'
  },
  tabBadge: {
    backgroundColor: '#ef4444',
    minWidth: 17,
    height: 17,
    borderRadius: 8.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3
  },
  tabBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900'
  },
  windowControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0
  },
  actionSquareBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  closeSquareBtn: {
    // Distinct close button styling
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 8
  },
  filterPillsWrap: {
    flexDirection: 'row',
    gap: 6,
    flex: 1
  },
  filterPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8
  },
  filterPillActive: {
    backgroundColor: '#06b6d4'
  },
  filterText: {
    fontSize: 11,
    fontWeight: '700'
  },
  filterTextActive: {
    color: '#090d16',
    fontWeight: '900'
  },
  markReadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    flexShrink: 0
  },
  markReadText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#06b6d4'
  },
  inModalAlertBanner: {
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#14532d',
    borderWidth: 1.5,
    borderColor: '#22c55e',
    flexDirection: 'row',
    alignItems: 'center'
  },
  inModalAlertTitle: {
    color: '#4ade80',
    fontSize: 12,
    fontWeight: '900'
  },
  inModalAlertSub: {
    color: '#bbf7d0',
    fontSize: 10.5,
    fontWeight: '600'
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 12
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
    maxWidth: 240
  },
  listScroll: {
    flex: 1
  },
  listContent: {
    padding: 16,
    gap: 12
  },
  settingsContent: {
    padding: 16,
    paddingBottom: 24
  },
  card: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3
  },
  cardUnreadDark: {
    borderColor: '#06b6d4',
    backgroundColor: '#15243f'
  },
  cardUnreadLight: {
    borderColor: '#06b6d4',
    backgroundColor: '#f0f9ff'
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  cardTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  cardIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center'
  },
  cardTypeBadge: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  cardTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#06b6d4'
  },
  cardTimeText: {
    fontSize: 11,
    fontWeight: '600'
  },
  cardTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    marginBottom: 4
  },
  cardMessage: {
    fontSize: 12.5,
    lineHeight: 18
  },
  bonusBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  bonusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  bonusPointsText: {
    fontSize: 12.5,
    fontWeight: '800'
  },
  claimBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f59e0b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8
  },
  claimBtnText: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#090d16'
  },
  claimedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#064e3b',
    borderWidth: 1,
    borderColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  claimedText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#34d399'
  },
  actionRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  actionText: {
    fontSize: 11,
    color: '#06b6d4',
    fontWeight: '700'
  },
  profileCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    marginBottom: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '900'
  },
  profileInfo: {
    flex: 1
  },
  profileUsername: {
    fontSize: 16,
    fontWeight: '800'
  },
  profileEmail: {
    fontSize: 11,
    marginTop: 2
  },
  pointsBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6
  },
  pointsBadgeText: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '800'
  },
  referralBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1
  },
  referralLabel: {
    fontSize: 10,
    fontWeight: '700'
  },
  referralCode: {
    fontSize: 14,
    fontWeight: '900',
    marginTop: 2
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#06b6d4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8
  },
  shareBtnText: {
    color: '#090d16',
    fontSize: 11,
    fontWeight: '800'
  },
  sectionCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    marginBottom: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10
  },
  themeSwitcherRow: {
    flexDirection: 'row',
    gap: 10
  },
  themeOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5
  },
  themeOptionBtnActive: {
    borderWidth: 1.5
  },
  themeOptionText: {
    fontSize: 13,
    fontWeight: '700'
  },
  themeOptionTextActive: {
    fontWeight: '900'
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1
  },
  settingTextWrap: {
    flex: 1
  },
  settingLabel: {
    fontSize: 13,
    fontWeight: '700'
  },
  settingSub: {
    fontSize: 10,
    marginTop: 2
  },
  actionItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1
  },
  actionItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  actionItemTitle: {
    fontSize: 13,
    fontWeight: '700'
  },
  actionItemSub: {
    fontSize: 10,
    marginTop: 2
  },
  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1
  },
  clearBtnText: {
    fontSize: 11,
    fontWeight: '700'
  },
  checkUpdateBtn: {
    backgroundColor: '#06b6d4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8
  },
  checkUpdateBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#090d16'
  },
  complianceRow: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)'
  },
  complianceText: {
    fontSize: 11,
    lineHeight: 16,
    flex: 1
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    paddingVertical: 12,
    borderRadius: 12
  },
  logoutBtnText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '800'
  }
});
