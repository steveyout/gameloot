import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Text as SvgText, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { Gamepad2, Sparkles, RefreshCw, LogOut, Bell, Settings, Sun, Moon } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

export default function Header({
  user,
  pointsBalance = 0,
  unreadNotificationsCount = 0,
  payoutsEnabled = true,
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
      {/* Brand logo & App title - Enticing gradient title without "Arcade OS" */}
      <View style={styles.brandRow}>
        <LinearGradient
          colors={['#517bfd', '#8b5cf6', '#d25087']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.logoBadge}
        >
          <Gamepad2 size={20} color="#ffffff" />
        </LinearGradient>
        <Svg height="26" width="118" viewBox="0 0 118 26">
          <Defs>
            <SvgGradient id="gameLootTitleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#517bfd" />
              <Stop offset="50%" stopColor="#8b5cf6" />
              <Stop offset="100%" stopColor="#d25087" />
            </SvgGradient>
          </Defs>
          <SvgText
            fill="url(#gameLootTitleGrad)"
            fontSize="20"
            fontWeight="900"
            letterSpacing="-0.5"
            x="0"
            y="20"
          >
            GameLoot
          </SvgText>
        </Svg>
      </View>

      {/* Right side: Points balance badge + Theme Switcher + Bell + Settings */}
      <View style={styles.rightActions}>
        {/* Animated Points & Score / USD conversion badge */}
        <Animated.View style={{ transform: [{ scale: balanceScale }] }}>
          <View
            style={[
              styles.pointsBadge,
              {
                backgroundColor: colors.surfaceCard,
                borderColor: colors.border
              }
            ]}
          >
            <View style={[styles.sparkleWrap, { backgroundColor: `${colors.primary}20` }]}>
              <Sparkles size={11} color={colors.primary} />
            </View>
            <View style={{ alignItems: 'flex-end', marginLeft: 6 }}>
              <Text style={[styles.pointsNumber, { color: colors.text }]}>
                {pointsBalance.toLocaleString()} <Text style={{ color: colors.primary, fontSize: 10 }}>PTS</Text>
              </Text>
              {payoutsEnabled ? (
                <Text style={[styles.usdText, { color: colors.textSecondary }]}>≈ ${usdValue} USD</Text>
              ) : (
                <Text style={[styles.usdText, { color: colors.accent, fontWeight: '800' }]}>LEVEL 1</Text>
              )}
            </View>
          </View>
        </Animated.View>

        {/* Instant Light/Dark Theme Switcher */}
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}
          onPress={toggleTheme}
          activeOpacity={0.7}
          accessibilityLabel="Toggle Theme"
        >
          {isDark ? (
            <Sun size={15} color="#fbbf24" />
          ) : (
            <Moon size={15} color="#517bfd" />
          )}
        </TouchableOpacity>

        {/* In-App Notifications Bell */}
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}
          onPress={onOpenNotifications}
          activeOpacity={0.7}
        >
          <Bell size={15} color={colors.textSecondary} />
          {unreadNotificationsCount > 0 && (
            <View style={[styles.badgeContainer, { backgroundColor: colors.accent, borderColor: colors.background }]}>
              <Text style={styles.badgeText}>
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* In-App Settings Gear */}
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}
          onPress={onOpenSettings}
          activeOpacity={0.7}
        >
          <Settings size={15} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Update Checker Button */}
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}
          onPress={onCheckUpdate}
          activeOpacity={0.7}
          disabled={isCheckingUpdate}
        >
          <RefreshCw size={13} color={isCheckingUpdate ? colors.primary : colors.textMuted} />
        </TouchableOpacity>

        {/* Logout */}
        {user ? (
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}
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
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#517bfd',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 5
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
    borderRadius: 14,
    borderWidth: 1
  },
  sparkleWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  pointsNumber: {
    fontSize: 12,
    fontWeight: '900'
  },
  usdText: {
    fontSize: 8.5,
    fontWeight: '700'
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 11,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  badgeContainer: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 8.5,
    fontWeight: '900'
  }
});
