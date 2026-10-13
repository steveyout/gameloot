import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Bell,
  Sparkles,
  Gift,
  AlertCircle,
  Radio,
  CheckCircle2,
  X,
  ChevronRight,
  Coins,
  CheckCheck,
  Clock,
  Maximize2,
  Minimize2
} from 'lucide-react-native';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  claimNotificationBonus
} from '../api/clientApi';
import { useTheme } from '../context/ThemeContext';
import { SkeletonNotificationList } from './SkeletonLoader';
import { playSound, triggerHaptic } from '../services/soundEffects';

export default function NotificationModal({
  visible,
  token,
  onClose,
  onBonusClaimed,
  onNavigateTab,
  onUnreadChange
}) {
  const { theme, colors, isDark } = useTheme();
  const activeColors = colors || theme || {};
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'bonus'
  const [claimingId, setClaimingId] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [claimedBanner, setClaimedBanner] = useState(null);

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await getNotifications(token);
      if (res.success) {
        setNotifications(res.notifications || []);
        if (onUnreadChange) onUnreadChange(res.unread_count || 0);
      }
    } catch (err) {
      console.warn('Failed to load notifications:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (visible && token) {
      setClaimedBanner(null);
      fetchNotifications();
    }
  }, [visible, token]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
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
    // Mark as read
    if (!item.is_read) {
      try {
        await markNotificationRead(token, item.id);
        setNotifications(prev =>
          prev.map(n => (n.id === item.id ? { ...n, is_read: true } : n))
        );
        if (onUnreadChange) {
          onUnreadChange(prev => Math.max(0, prev - 1));
        }
      } catch (e) {}
    }

    // If deep link screen provided
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

  const getThemeConfig = (type) => {
    switch (type) {
      case 'bonus':
        return {
          bg: isDark ? '#2e1065' : '#ede9fe',
          border: '#f59e0b',
          badgeColor: '#f59e0b',
          badgeText: 'Bonus Drop',
          Icon: Sparkles,
          iconColor: '#f59e0b'
        };
      case 'alert':
        return {
          bg: isDark ? '#450a0a' : '#fee2e2',
          border: '#ef4444',
          badgeColor: '#ef4444',
          badgeText: 'Alert',
          Icon: AlertCircle,
          iconColor: '#ef4444'
        };
      case 'reward':
        return {
          bg: isDark ? '#064e3b' : '#d1fae5',
          border: '#10b981',
          badgeColor: '#10b981',
          badgeText: 'Reward',
          Icon: Gift,
          iconColor: '#10b981'
        };
      case 'system':
        return {
          bg: isDark ? '#1e1b4b' : '#e0e7ff',
          border: '#6366f1',
          badgeColor: '#6366f1',
          badgeText: 'System',
          Icon: Radio,
          iconColor: '#6366f1'
        };
      default:
        return {
          bg: isDark ? '#083344' : '#e0f2fe',
          border: '#06b6d4',
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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.backdrop, isFullscreen && styles.backdropFullscreen]}>
        {/* Tap outside to dismiss (when in drawer mode) */}
        {!isFullscreen && (
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={onClose}
          />
        )}

        <View
          style={[
            styles.modalSheet,
            {
              backgroundColor: isDark ? '#0b1120' : '#ffffff',
              borderColor: activeColors.border || (isDark ? '#1e293b' : '#e2e8f0')
            },
            isFullscreen && styles.modalSheetFullscreen
          ]}
        >
          {/* Top handle bar (only in drawer mode) */}
          {!isFullscreen && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setIsFullscreen(true)}
              style={styles.sheetHandleTouch}
            >
              <View style={[styles.sheetHandle, { backgroundColor: isDark ? '#334155' : '#cbd5e1' }]} />
            </TouchableOpacity>
          )}

          {/* Modal Header */}
          <View
            style={[
              styles.modalHeader,
              { borderBottomColor: activeColors.border || (isDark ? '#1e293b' : '#e2e8f0') }
            ]}
          >
            <View style={styles.modalTitleRow}>
              <View style={styles.titleIconBadge}>
                <Bell size={18} color="#06b6d4" />
              </View>
              <View>
                <Text style={[styles.modalTitle, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                  Notifications & Drops
                </Text>
                <Text style={[styles.modalSubtitle, { color: activeColors.textSecondary || '#94a3b8' }]}>
                  {unreadCount > 0 ? `${unreadCount} unread updates` : 'All caught up!'}
                </Text>
              </View>
            </View>

            <View style={styles.headerRightActions}>
              {unreadCount > 0 && (
                <TouchableOpacity
                  style={[
                    styles.markAllBtn,
                    {
                      backgroundColor: isDark ? '#172545' : '#f1f5f9',
                      borderColor: activeColors.border || (isDark ? '#1e293b' : '#cbd5e1')
                    }
                  ]}
                  onPress={handleMarkAllRead}
                  activeOpacity={0.7}
                >
                  <CheckCheck size={14} color="#06b6d4" style={{ marginRight: 4 }} />
                  <Text style={styles.markAllText}>Mark Read</Text>
                </TouchableOpacity>
              )}

              {/* Fullscreen Drawer Toggle Button */}
              <TouchableOpacity
                style={[
                  styles.controlBtn,
                  { backgroundColor: isDark ? '#172545' : '#f1f5f9' }
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

              {/* Close Button */}
              <TouchableOpacity
                style={[
                  styles.controlBtn,
                  { backgroundColor: isDark ? '#172545' : '#f1f5f9' }
                ]}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <X size={18} color={activeColors.textSecondary || '#94a3b8'} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Filter Pills */}
          <View
            style={[
              styles.filtersRow,
              { borderBottomColor: activeColors.border || (isDark ? '#1e293b' : '#e2e8f0') }
            ]}
          >
            <TouchableOpacity
              style={[
                styles.filterPill,
                { backgroundColor: isDark ? '#172545' : '#f1f5f9' },
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
                { backgroundColor: isDark ? '#172545' : '#f1f5f9' },
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
                { backgroundColor: isDark ? '#172545' : '#f1f5f9' },
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
                🎁 Bonus Drops
              </Text>
            </TouchableOpacity>
          </View>

          {/* In-Modal Claim Success Alert Banner */}
          {claimedBanner && (
            <View style={styles.inModalAlertBanner}>
              <Sparkles size={16} color="#fbbf24" style={{ marginRight: 6 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.inModalAlertTitle}>
                  Claimed +{claimedBanner.points} PTS!
                </Text>
                <Text style={styles.inModalAlertSub}>
                  {claimedBanner.title} added to your vault balance.
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

          {/* Notifications List or Skeleton Loader */}
          {loading ? (
            <ScrollView
              style={styles.listScroll}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            >
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
                  refreshing={refreshing}
                  onRefresh={onRefresh}
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

                    {/* Bonus Points Claim Box (Solid, Opaque, High Contrast) */}
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

                    {/* Action Deep Link if provided */}
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
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1.5,
    maxHeight: '85%',
    minHeight: '55%',
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
    paddingTop: Platform.OS === 'android' ? 36 : 48
  },
  sheetHandleTouch: {
    paddingVertical: 8,
    alignItems: 'center'
  },
  sheetHandle: {
    width: 38,
    height: 4.5,
    borderRadius: 2.5
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  titleIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)'
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900'
  },
  modalSubtitle: {
    fontSize: 11,
    marginTop: 1
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1
  },
  markAllText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#06b6d4'
  },
  controlBtn: {
    width: 32,
    height: 32,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center'
  },
  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9
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
  }
});
