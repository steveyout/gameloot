import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Gamepad2, Sparkles, RefreshCw, LogOut, ShieldCheck, Bell, Settings } from 'lucide-react-native';

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
  const usdValue = (pointsBalance * 0.001).toFixed(3);
  const balanceScale = useRef(new Animated.Value(1)).current;
  const prevBalanceRef = useRef(pointsBalance);

  useEffect(() => {
    if (prevBalanceRef.current !== pointsBalance) {
      prevBalanceRef.current = pointsBalance;
      // Trigger a satisfying pulse bounce when balance increases/changes
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
    <View style={styles.container}>
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
          <Text style={styles.brandTitle}>GameLoot</Text>
          <View style={styles.verifiedRow}>
            <ShieldCheck size={11} color="#06b6d4" />
            <Text style={styles.brandSubtitle}>Verified Gaming Hub</Text>
          </View>
        </View>
      </View>

      {/* Right side: Points balance badge + Notifications Bell + Settings + Logout */}
      <View style={styles.rightActions}>
        {/* Animated Points & USD conversion badge */}
        <Animated.View style={{ transform: [{ scale: balanceScale }] }}>
          <LinearGradient
            colors={['#1e293b', '#0f172a']}
            style={styles.pointsBadge}
          >
            <Sparkles size={13} color="#f59e0b" style={{ marginRight: 5 }} />
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.pointsNumber}>{pointsBalance.toLocaleString()} PTS</Text>
              <Text style={styles.usdText}>≈ ${usdValue} USD</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* In-App Notifications Bell with Animated Pulse Badge */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onOpenNotifications}
          activeOpacity={0.7}
        >
          <Bell size={16} color="#06b6d4" />
          {unreadNotificationsCount > 0 && (
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* In-App Settings Gear */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onOpenSettings}
          activeOpacity={0.7}
        >
          <Settings size={16} color="#cbd5e1" />
        </TouchableOpacity>

        {/* Update Checker Button */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onCheckUpdate}
          activeOpacity={0.7}
          disabled={isCheckingUpdate}
        >
          <RefreshCw size={14} color={isCheckingUpdate ? '#06b6d4' : '#64748b'} />
        </TouchableOpacity>

        {/* Logout */}
        {user ? (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onLogout}
            activeOpacity={0.7}
          >
            <LogOut size={14} color="#ef4444" />
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
    gap: 6
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
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
    width: 32,
    height: 32,
    borderRadius: 10,
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
