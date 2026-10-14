import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Animated } from 'react-native';
import { Gamepad2, Search, Heart, Trophy, User, Sparkles, Gift, WalletCards } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

export default function Navbar({ activeTab, onTabSelect, payoutsEnabled = false }) {
  const { colors, isDark } = useTheme();

  // Learning OS Color Accents: Electric Blue (#517BFD), Berry Rose (#D25087), Slate Blue (#3659C2)
  const rewardTabs = [
    { id: 'lobby', label: 'Home', icon: Gamepad2, glow: '#517bfd' },
    { id: 'search', label: 'Search', icon: Search, glow: '#3659c2' },
    { id: 'earn', label: 'Earn Hub', icon: Sparkles, glow: '#d25087' },
    { id: 'rewards', label: 'Cashout', icon: Gift, glow: '#f59e0b' },
    { id: 'wallet', label: 'Wallet', icon: WalletCards, glow: '#10b981' }
  ];

  const playAppTabs = [
    { id: 'lobby', label: 'Home', icon: Gamepad2, glow: '#517bfd' },
    { id: 'search', label: 'Search', icon: Search, glow: '#3659c2' },
    { id: 'favorites', label: 'My Games', icon: Heart, glow: '#d25087' },
    { id: 'leaderboard', label: 'Top Rated', icon: Trophy, glow: '#f59e0b' },
    { id: 'wallet', label: 'Profile', icon: User, glow: '#517bfd' }
  ];

  const tabs = payoutsEnabled ? rewardTabs : playAppTabs;

  return (
    <View style={styles.outerWrapper}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: isDark ? 'rgba(21, 23, 34, 0.96)' : 'rgba(255, 255, 255, 0.97)',
            borderColor: colors.border,
            shadowColor: isDark ? '#000000' : '#517bfd'
          }
        ]}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const IconComponent = tab.icon;

          return (
            <NavTabButton
              key={tab.id}
              tab={tab}
              isActive={isActive}
              onPress={() => onTabSelect(tab.id)}
              IconComponent={IconComponent}
              colors={colors}
              isDark={isDark}
            />
          );
        })}
      </View>
    </View>
  );
}

function NavTabButton({ tab, isActive, onPress, IconComponent, colors, isDark }) {
  const scale = useRef(new Animated.Value(1)).current;
  const iconTranslate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isActive) {
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.15, duration: 120, useNativeDriver: true }),
          Animated.spring(scale, { toValue: 1.04, friction: 4, tension: 80, useNativeDriver: true })
        ]),
        Animated.spring(iconTranslate, { toValue: -2, friction: 5, tension: 70, useNativeDriver: true })
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }),
        Animated.spring(iconTranslate, { toValue: 0, friction: 6, useNativeDriver: true })
      ]).start();
    }
  }, [isActive]);

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.92, friction: 6, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, { toValue: isActive ? 1.04 : 1, friction: 5, useNativeDriver: true }).start();
  };

  const idleColor = colors?.textSecondary || '#979caf';

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.tabItem}
      activeOpacity={0.85}
    >
      <Animated.View
        style={[
          styles.iconWrap,
          {
            transform: [
              { scale },
              { translateY: iconTranslate }
            ]
          }
        ]}
      >
        {isActive ? (
          <LinearGradient
            colors={[`${tab.glow}28`, `${tab.glow}10`]}
            style={[styles.glowBadge, { borderColor: `${tab.glow}66` }]}
          >
            <IconComponent size={19} color={tab.glow} />
          </LinearGradient>
        ) : (
          <View style={styles.idleBadge}>
            <IconComponent size={19} color={idleColor} />
          </View>
        )}
      </Animated.View>

      <Text
        style={[
          styles.tabLabel,
          { color: idleColor },
          isActive && { color: tab.glow, fontWeight: '800' }
        ]}
        numberOfLines={1}
      >
        {tab.label}
      </Text>

      {isActive && (
        <View style={[styles.activeDot, { backgroundColor: tab.glow }]} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    paddingHorizontal: 12,
    paddingBottom: Platform.OS === 'android' ? 8 : 16,
    backgroundColor: 'transparent'
  },
  container: {
    height: 64,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 12
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  glowBadge: {
    width: 38,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center'
  },
  idleBadge: {
    width: 38,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center'
  },
  tabLabel: {
    fontSize: 9.5,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: -0.2
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2
  }
});
