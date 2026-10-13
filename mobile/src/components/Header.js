import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Gamepad2, Sparkles, RefreshCw, LogOut, ShieldCheck, Bell, Settings, Sun, Moon } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

export default function Header({
  user,
  pointsBalance = 0,
  unreadNotificationsCount = 0,
  onOpenNotifications,
  onOpenSettings,
  onCheckUpdate,
  isCheckingUpdate,
  onLogout
}) {
  const { isDark, toggleTheme, colors } = useTheme();
  const usdValue = (pointsBalance * 0.001).toFixed(3);
  const balanceScale = useRef(new Animated.Value(1)).current;
  const prevBalanceRef = useRef(pointsBalance);

  useEffect(() => {
    if (prevBalanceRef.current !== pointsBalance) {
      prevBalanceRef.current = pointsBalance;
      Animated.sequence([
        Animated.timing(balanceScale, {
          toValue: 1.14,
          duration: 150,
          useNativeDriver: true
        }),
        Animated.spring(balanceScale, {
          toValue: 1,
          friction: 4,
          tension: 90,
          useNativeDriver: true
        })
      ]).start();
    }
  }, [pointsBalance]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
      {/* Brand logo & App title */}
      <View style={styles.brandRow}>
        <LinearGradient
          colors={['#06b6d4', '#3b82f6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.logoBadge}
        >
          <Gamepad2 size={20} color="#ffffff" />
        </LinearGradient>
        <View>
          <Text style={[styles.brandTitle, { color: colors.text }]}>GameLoot</Text>
          <View style={styles.verifiedRow}>
            <ShieldCheck size={11} color={colors.primary} />
            <Text style={[styles.brandSubtitle, { color: colors.textSecondary }]}>Verified Gaming Hub</Text>
          </View>
        </View>
      </View>

      {/* Right side: Points balance badge + Theme Switcher + Bell + Settings */}
      <View style={styles.rightActions}>
        {/* Animated Points & USD conversion badge */}
        <Animated.View style={{ transform: [{ scale: balanceScale }] }}>
          <LinearGradient
            colors={isDark ? ['#1e293b', '#0f172a'] : ['#e2e8f0', '#f8fafc']}
            style={[styles.pointsBadge, { borderColor: colors.borderStrong }]}
          >
            <Sparkles size={13} color="#f59e0b" style={{ marginRight: 5 }} />
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.pointsNumber}>{pointsBalance.toLocaleString()} PTS</Text>
              <Text style={[styles.usdText, { color: colors.textSecondary }]}>≈ ${usdValue} USD</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Instant Light/Dark Theme Switcher */}
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: colors.surfaceSubtle }]}
          onPress={toggleTheme}
          activeOpacity={0.7}
          accessibilityLabel="Toggle Theme"
        >
          {isDark ? (
            <Sun size={15} color="#fbbf24" />
          ) : (
            <Moon size={15} color="#6366f1" />
          )}
        </TouchableOpacity>

        {/* In-App Notifications Bell */}
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: colors.surfaceSubtle }]}
          onPress={onOpenNotifications}
          activeOpacity={0.7}
        >
          <Bell size={15} color={colors.primary} />
          {unreadNotificationsCount > 0 && (
            <View style={[styles.badgeContainer, { borderColor: colors.background }]}>
              <Text style={styles.badgeText}>
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* In-App Settings Gear */}
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: colors.surfaceSubtle }]}
          onPress={onOpenSettings}
          activeOpacity={0.7}
        >
          <Settings size={15} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Update Checker Button */}
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: colors.surfaceSubtle }]}
          onPress={onCheckUpdate}
          activeOpacity={0.7}
          disabled={isCheckingUpdate}
        >
          <RefreshCw size={13} color={isCheckingUpdate ? colors.primary : colors.textMuted} />
        </TouchableOpacity>

        {/* Logout */}
        {user ? (
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.surfaceSubtle }]}
            onPress={onLogout}
            activeOpacity={0.7}
          >
            <LogOut size={13} color="#ef4444" />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === 'android' ? 36 : 48,
    paddingHorizontal: 14,
    paddingBottom: 10,
    backgroundColor: '#090d16',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#06b6d4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 4
  },
  brandTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 1
  },
  brandSubtitle: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: '600'
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155'
  },
  pointsNumber: {
    color: '#f59e0b',
    fontSize: 12,
    fontWeight: '900'
  },
  usdText: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: '600'
  },
  iconButton: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center'
  },
  badgeContainer: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#ef4444',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#090d16'
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 8.5,
    fontWeight: '900'
  }
});
