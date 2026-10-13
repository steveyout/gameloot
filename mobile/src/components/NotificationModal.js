import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
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
  Clock
} from 'lucide-react-native';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  claimNotificationBonus
} from '../api/clientApi';

export default function NotificationModal({
  visible,
  token,
  onClose,
  onBonusClaimed,
  onNavigateTab,
  onUnreadChange
}) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'bonus'
  const [claimingId, setClaimingId] = useState(null);

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

  const getTheme = (type) => {
    switch (type) {
      case 'bonus':
        return {
          bg: '#1e1b4b',
          border: '#f59e0b',
          badgeColor: '#fbbf24',
          badgeText: 'Bonus Drop',
          Icon: Sparkles,
          iconColor: '#f59e0b'
        };
      case 'alert':
        return {
          bg: '#450a0a',
          border: '#ef4444',
          badgeColor: '#f87171',
          badgeText: 'Alert',
          Icon: AlertCircle,
          iconColor: '#ef4444'
        };
      case 'reward':
        return {
          bg: '#064e3b',
          border: '#10b981',
          badgeColor: '#34d399',
          badgeText: 'Reward',
          Icon: Gift,
          iconColor: '#10b981'
        };
      case 'system':
        return {
          bg: '#1e1e38',
          border: '#818cf8',
          badgeColor: '#a5b4fc',
          badgeText: 'System',
          Icon: Radio,
          iconColor: '#818cf8'
        };
      default:
        return {
          bg: '#082f49',
          border: '#0ea5e9',
          badgeColor: '#38bdf8',
          badgeText: 'Notice',
          Icon: Bell,
          iconColor: '#0ea5e9'
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
      <View style={styles.backdrop}>
        <View style={styles.modalSheet}>
          {/* Top handle bar */}
          <View style={styles.sheetHandle} />

          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleRow}>
              <View style={styles.titleIconBadge}>
                <Bell size={18} color="#06b6d4" />
              </View>
              <View>
                <Text style={styles.modalTitle}>Notifications & Drops</Text>
                <Text style={styles.modalSubtitle}>
                  {unreadCount > 0 ? `${unreadCount} unread updates` : 'All caught up!'}
                </Text>
              </View>
            </View>

            <View style={styles.headerRightActions}>
              {unreadCount > 0 && (
                <TouchableOpacity
                  style={styles.markAllBtn}
                  onPress={handleMarkAllRead}
                  activeOpacity={0.7}
                >
                  <CheckCheck size={14} color="#06b6d4" style={{ marginRight: 4 }} />
                  <Text style={styles.markAllText}>Mark Read</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <X size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Filter Pills */}
          <View style={styles.filtersRow}>
            <TouchableOpacity
              style={[styles.filterPill, filter === 'all' && styles.filterPillActive]}
              onPress={() => setFilter('all')}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
                All ({notifications.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterPill, filter === 'unread' && styles.filterPillActive]}
              onPress={() => setFilter('unread')}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, filter === 'unread' && styles.filterTextActive]}>
                Unread ({unreadCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterPill, filter === 'bonus' && styles.filterPillActive]}
              onPress={() => setFilter('bonus')}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, filter === 'bonus' && styles.filterTextActive]}>
                🎁 Bonus Drops
              </Text>
            </TouchableOpacity>
          </View>

          {/* Notifications List */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#06b6d4" />
              <Text style={styles.loadingText}>Fetching your updates...</Text>
            </View>
          ) : filteredNotifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Bell size={42} color="#334155" />
              <Text style={styles.emptyTitle}>No Notifications</Text>
              <Text style={styles.emptySubtitle}>
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
                const theme = getTheme(item.type);
                const IconComp = theme.Icon;
                const isClaiming = claimingId === item.id;

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.card,
                      !item.is_read && styles.cardUnread
                    ]}
                    onPress={() => handleNotificationPress(item)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.cardTypeRow}>
                        <View style={[styles.cardIconWrap, { backgroundColor: theme.bg }]}>
                          <IconComp size={14} color={theme.iconColor} />
                        </View>
                        <Text style={[styles.cardTypeBadge, { color: theme.badgeColor }]}>
                          {theme.badgeText}
                        </Text>
                      </View>

                      <View style={styles.cardTimeRow}>
                        {!item.is_read && <View style={styles.unreadDot} />}
                        <Text style={styles.cardTimeText}>
                          {item.created_at
                            ? new Date(item.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                              })
                            : 'Recent'}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardMessage}>{item.message}</Text>

                    {/* Bonus Points Claim Box if present */}
                    {item.bonus_points > 0 && (
                      <View style={styles.bonusBox}>
                        <View style={styles.bonusLeft}>
                          <Coins size={16} color="#fbbf24" />
                          <Text style={styles.bonusPointsText}>
                            +{item.bonus_points} PTS Bonus
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
                      <View style={styles.actionRow}>
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end'
  },
  modalSheet: {
    backgroundColor: '#0b111e',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: '#1e293b',
    maxHeight: '85%',
    minHeight: '55%',
    paddingBottom: Platform.OS === 'android' ? 20 : 34
  },
  sheetHandle: {
    width: 38,
    height: 4,
    backgroundColor: '#334155',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b'
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
    fontWeight: '900',
    color: '#ffffff'
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
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
    backgroundColor: '#1e293b',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155'
  },
  markAllText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#06b6d4'
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center'
  },
  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#162032'
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9,
    backgroundColor: '#1e293b'
  },
  filterPillActive: {
    backgroundColor: '#06b6d4'
  },
  filterText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8'
  },
  filterTextActive: {
    color: '#090d16',
    fontWeight: '900'
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 8
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 12
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748b',
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
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  cardUnread: {
    borderColor: 'rgba(6, 182, 212, 0.4)',
    backgroundColor: '#131e33'
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
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#06b6d4'
  },
  cardTimeText: {
    fontSize: 10,
    color: '#64748b'
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4
  },
  cardMessage: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 17
  },
  bonusBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
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
    fontSize: 12,
    fontWeight: '800',
    color: '#fbbf24'
  },
  claimBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f59e0b',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8
  },
  claimBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#090d16'
  },
  claimedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  claimedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#34d399'
  },
  actionRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
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
