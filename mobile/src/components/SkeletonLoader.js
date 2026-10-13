import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export function SkeletonBox({ width, height, borderRadius = 8, style }) {
  const { isDark } = useTheme();
  const pulse = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.85,
          duration: 750,
          useNativeDriver: true
        }),
        Animated.timing(pulse, {
          toValue: 0.35,
          duration: 750,
          useNativeDriver: true
        })
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const baseBg = isDark ? '#1e293b' : '#e2e8f0';

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: baseBg,
          opacity: pulse
        },
        style
      ]}
    />
  );
}

export function SkeletonNotificationCard() {
  const { isDark, colors } = useTheme();
  return (
    <View
      style={[
        styles.notifCard,
        {
          backgroundColor: isDark ? '#111c33' : '#ffffff',
          borderColor: isDark ? '#1e293b' : '#e2e8f0'
        }
      ]}
    >
      <View style={styles.notifHeader}>
        <View style={styles.row}>
          <SkeletonBox width={24} height={24} borderRadius={6} />
          <SkeletonBox width={70} height={14} borderRadius={4} style={{ marginLeft: 8 }} />
        </View>
        <SkeletonBox width={50} height={12} borderRadius={4} />
      </View>
      <SkeletonBox width="80%" height={16} borderRadius={4} style={{ marginTop: 10 }} />
      <SkeletonBox width="95%" height={12} borderRadius={4} style={{ marginTop: 8 }} />
      <SkeletonBox width="60%" height={12} borderRadius={4} style={{ marginTop: 6 }} />
      <View style={styles.notifFooter}>
        <SkeletonBox width={120} height={28} borderRadius={8} />
        <SkeletonBox width={80} height={28} borderRadius={8} />
      </View>
    </View>
  );
}

export function SkeletonNotificationList({ count = 3 }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonNotificationCard key={i} />
      ))}
    </View>
  );
}

export function SkeletonGameCard() {
  const { isDark } = useTheme();
  return (
    <View
      style={[
        styles.gameCard,
        {
          backgroundColor: isDark ? '#0f172a' : '#ffffff',
          borderColor: isDark ? '#1e293b' : '#e2e8f0'
        }
      ]}
    >
      <SkeletonBox width={68} height={68} borderRadius={12} />
      <View style={styles.gameInfo}>
        <View style={styles.row}>
          <SkeletonBox width={85} height={18} borderRadius={6} />
          <SkeletonBox width={45} height={18} borderRadius={6} style={{ marginLeft: 6 }} />
        </View>
        <SkeletonBox width="75%" height={16} borderRadius={4} style={{ marginTop: 8 }} />
        <SkeletonBox width="50%" height={12} borderRadius={4} style={{ marginTop: 6 }} />
      </View>
      <SkeletonBox width={38} height={38} borderRadius={12} />
    </View>
  );
}

export function SkeletonGameList({ count = 4 }) {
  return (
    <View style={styles.grid}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonGameCard key={i} />
      ))}
    </View>
  );
}

export function SkeletonTaskCard() {
  const { isDark } = useTheme();
  return (
    <View
      style={[
        styles.taskCard,
        {
          backgroundColor: isDark ? '#0f172a' : '#ffffff',
          borderColor: isDark ? '#1e293b' : '#e2e8f0'
        }
      ]}
    >
      <View style={styles.taskLeft}>
        <SkeletonBox width={40} height={40} borderRadius={12} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <SkeletonBox width="70%" height={15} borderRadius={4} />
          <SkeletonBox width="50%" height={12} borderRadius={4} style={{ marginTop: 6 }} />
        </View>
      </View>
      <SkeletonBox width={72} height={28} borderRadius={10} />
    </View>
  );
}

export function SkeletonTaskList({ count = 3 }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonTaskCard key={i} />
      ))}
    </View>
  );
}

export function SkeletonRewardCard() {
  const { isDark } = useTheme();
  return (
    <View
      style={[
        styles.rewardCard,
        {
          backgroundColor: isDark ? '#0f172a' : '#ffffff',
          borderColor: isDark ? '#1e293b' : '#e2e8f0'
        }
      ]}
    >
      <View style={styles.rewardHeader}>
        <SkeletonBox width={38} height={38} borderRadius={10} />
        <SkeletonBox width={70} height={24} borderRadius={8} />
      </View>
      <SkeletonBox width="60%" height={16} borderRadius={4} style={{ marginTop: 10 }} />
      <SkeletonBox width="90%" height={12} borderRadius={4} style={{ marginTop: 6 }} />
      <SkeletonBox width="100%" height={6} borderRadius={3} style={{ marginTop: 12 }} />
      <View style={styles.rewardFooter}>
        <SkeletonBox width={80} height={18} borderRadius={6} />
        <SkeletonBox width={90} height={30} borderRadius={10} />
      </View>
    </View>
  );
}

export function SkeletonRewardList({ count = 3 }) {
  return (
    <View style={styles.grid}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonRewardCard key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 12,
    marginBottom: 16
  },
  grid: {
    gap: 12,
    marginBottom: 20
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  notifCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1
  },
  notifHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  notifFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)'
  },
  gameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1
  },
  gameInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1
  },
  taskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10
  },
  rewardCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5
  },
  rewardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  rewardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)'
  }
});
