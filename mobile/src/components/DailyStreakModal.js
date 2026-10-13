import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Flame, Sparkles, CheckCircle2, X, Gift, Lock, Trophy } from 'lucide-react-native';
import { getStreakStatus, claimDailyStreak } from '../api/clientApi';
import { playSound, triggerHaptic } from '../services/soundEffects';
import { useTheme } from '../context/ThemeContext';

export default function DailyStreakModal({
  visible,
  token,
  onClose,
  onStreakClaimed
}) {
  const { theme, isDark } = useTheme();
  const [streakData, setStreakData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  const fetchStreak = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await getStreakStatus(token);
      if (res.success) {
        setStreakData(res);
      }
    } catch (err) {
      console.warn('Failed to load streak:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && token) {
      fetchStreak();
    }
  }, [visible, token]);

  const handleClaim = async () => {
    if (claiming) return;
    try {
      setClaiming(true);
      playSound('coin');
      triggerHaptic('medium');

      const res = await claimDailyStreak(token);
      if (res.success) {
        playSound('win');
        triggerHaptic('success');

        setStreakData((prev) => ({
          ...prev,
          current_streak: res.current_streak,
          can_checkin: false
        }));
        if (onStreakClaimed) {
          onStreakClaimed({
            points: res.reward.points,
            newBalance: res.new_balance,
            day: res.reward.day
          });
        }
      }
    } catch (err) {
      console.warn('Streak claim error:', err);
    } finally {
      setClaiming(false);
    }
  };

  if (!visible) return null;

  const currentStreak = streakData?.current_streak || 0;
  const canCheckIn = streakData?.can_checkin;
  const currentDay = streakData?.current_day || 1;
  const schedule = streakData?.schedule || [
    { day: 1, points: 15, tickets: 1, label: 'Day 1' },
    { day: 2, points: 25, tickets: 1, label: 'Day 2' },
    { day: 3, points: 40, tickets: 2, label: 'Day 3' },
    { day: 4, points: 60, tickets: 2, label: 'Day 4' },
    { day: 5, points: 90, tickets: 3, label: 'Day 5' },
    { day: 6, points: 130, tickets: 3, label: 'Day 6' },
    { day: 7, points: 300, tickets: 5, label: 'MEGA LOOT' }
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        {/* Tap outside sheet to dismiss */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={[styles.modalSheet, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {/* Sheet Handle */}
          <View style={[styles.sheetHandle, { backgroundColor: isDark ? '#334155' : '#cbd5e1' }]} />

          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <View style={styles.headerLeft}>
              <LinearGradient
                colors={['#f59e0b', '#d97706']}
                style={styles.flameBadge}
              >
                <Flame size={20} color="#ffffff" />
              </LinearGradient>
              <View>
                <Text style={[styles.modalTitle, { color: theme.text }]}>7-Day Daily Streak</Text>
                <Text style={styles.modalSubtitle}>
                  Current: {currentStreak} Consecutive Days Active 🔥
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <X size={18} color={theme.subtext} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#f59e0b" />
              <Text style={[styles.loadingText, { color: theme.subtext }]}>Loading streak calendar...</Text>
            </View>
          ) : (
            <View style={styles.content}>
              {/* 7-Day Grid */}
              <View style={styles.daysGrid}>
                {schedule.map((item) => {
                  const isPast = item.day < currentDay || (!canCheckIn && item.day <= currentDay);
                  const isToday = item.day === currentDay && canCheckIn;
                  const isDay7 = item.day === 7;

                  return (
                    <View
                      key={item.day}
                      style={[
                        styles.dayCard,
                        { backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: theme.border },
                        isDay7 && styles.dayCard7,
                        isToday && styles.dayCardToday,
                        isPast && styles.dayCardClaimed
                      ]}
                    >
                      <Text style={[styles.dayNumber, isToday && styles.dayNumberToday]}>
                        Day {item.day}
                      </Text>

                      <View style={styles.rewardIconWrap}>
                        {isPast ? (
                          <CheckCircle2 size={18} color="#10b981" />
                        ) : isDay7 ? (
                          <Trophy size={20} color="#fbbf24" />
                        ) : (
                          <Gift size={16} color={isToday ? '#f59e0b' : '#64748b'} />
                        )}
                      </View>

                      <Text style={[styles.pointsVal, { color: theme.text }, isToday && styles.pointsValToday]}>
                        +{item.points} PTS
                      </Text>

                      {isPast ? (
                        <Text style={styles.claimedSub}>Collected</Text>
                      ) : isToday ? (
                        <Text style={styles.todaySub}>Ready!</Text>
                      ) : (
                        <Text style={styles.lockSub}>Locked</Text>
                      )}
                    </View>
                  );
                })}
              </View>

              {/* Action Button */}
              {canCheckIn ? (
                <TouchableOpacity
                  style={styles.claimActionBtn}
                  onPress={handleClaim}
                  disabled={claiming}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#f59e0b', '#d97706']}
                    style={styles.claimGradient}
                  >
                    <Sparkles size={16} color="#090d16" style={{ marginRight: 6 }} />
                    <Text style={styles.claimActionText}>
                      {claiming ? 'Collecting Bonus...' : `Claim Day ${currentDay} Streak Bonus`}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <View style={styles.claimedBanner}>
                  <CheckCircle2 size={16} color="#10b981" style={{ marginRight: 6 }} />
                  <Text style={styles.claimedBannerText}>
                    Streak reward collected for today! Come back tomorrow for Day {((currentStreak) % 7) + 1}.
                  </Text>
                </View>
              )}
            </View>
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
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'android' ? 24 : 38
  },
  sheetHandle: {
    width: 38,
    height: 4,
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
    borderBottomWidth: 1
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  flameBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900'
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#fbbf24',
    fontWeight: '700',
    marginTop: 1
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingBox: {
    padding: 40,
    alignItems: 'center'
  },
  loadingText: {
    fontSize: 12,
    marginTop: 8
  },
  content: {
    padding: 18
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
    marginBottom: 16
  },
  dayCard: {
    width: '31%',
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1
  },
  dayCard7: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.4)'
  },
  dayCardToday: {
    borderColor: '#f59e0b',
    backgroundColor: 'rgba(245, 158, 11, 0.15)'
  },
  dayCardClaimed: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.3)'
  },
  dayNumber: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 4
  },
  dayNumberToday: {
    color: '#fbbf24',
    fontWeight: '900'
  },
  rewardIconWrap: {
    marginVertical: 4
  },
  pointsVal: {
    fontSize: 11,
    fontWeight: '800'
  },
  pointsValToday: {
    color: '#f59e0b'
  },
  claimedSub: {
    fontSize: 9,
    color: '#10b981',
    fontWeight: '700',
    marginTop: 2
  },
  todaySub: {
    fontSize: 9,
    color: '#f59e0b',
    fontWeight: '900',
    marginTop: 2
  },
  lockSub: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 2
  },
  claimActionBtn: {
    borderRadius: 14,
    overflow: 'hidden'
  },
  claimGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13
  },
  claimActionText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#090d16'
  },
  claimedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)'
  },
  claimedBannerText: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '700',
    textAlign: 'center',
    flex: 1
  }
});
