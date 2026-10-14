import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Animated } from 'react-native';
import { Gamepad2, Search, Sparkles, Gift, WalletCards } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

export default function Navbar({ activeTab, onTabSelect }) {
  const { colors, isDark } = useTheme();

  const tabs = [
    { id: 'lobby', label: 'Home', icon: Gamepad2, glow: '#06b6d4' },
    { id: 'search', label: 'Search', icon: Search, glow: '#38bdf8' },
    { id: 'earn', label: 'Earn Hub', icon: Sparkles, glow: '#a855f7' },
    { id: 'rewards', label: 'Cashout', icon: Gift, glow: '#f59e0b' },
    { id: 'wallet', label: 'Wallet', icon: WalletCards, glow: '#10b981' }
  ];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#090d16' : (colors.surfaceCard || '#ffffff'),
          borderTopColor: colors.border || (isDark ? '#1e293b' : '#e2e8f0'),
          shadowColor: isDark ? '#000000' : '#64748b'
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
          Animated.spring(scale, { toValue: 1.04, friction: 4, tension: 80, useNativeDriver: true })\
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

  const idleColor = colors?.textSecondary || (isDark ? '#64748b' : '#64748b');

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
            colors={[`${tab.glow}33`, `${tab.glow}11`]}
            style={[styles.glowBadge, { borderColor: tab.glow }]}
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

const styles = StyleSheet.create({\n  container: {\n    height: Platform.OS === 'android' ? 68 : 78,\n    paddingBottom: Platform.OS === 'android' ? 8 : 18,\n    paddingHorizontal: 6,\n    borderTopWidth: 1,\n    flexDirection: 'row',\n    alignItems: 'center',\n    justifyContent: 'space-around',\n    shadowOffset: { width: 0, height: -4 },\n    shadowOpacity: 0.15,\n    shadowRadius: 8,\n    elevation: 20\n  },\n  tabItem: {\n    flex: 1,\n    alignItems: 'center',\n    justifyContent: 'center',\n    paddingVertical: 4\n  },\n  iconWrap: {\n    alignItems: 'center',\n    justifyContent: 'center'\n  },\n  glowBadge: {\n    width: 40,\n    height: 30,\n    borderRadius: 12,\n    borderWidth: 1.5,\n    justifyContent: 'center',\n    alignItems: 'center'\n  },\n  idleBadge: {\n    width: 40,\n    height: 30,\n    justifyContent: 'center',\n    alignItems: 'center'\n  },\n  tabLabel: {\n    fontSize: 10,\n    fontWeight: '600',\n    marginTop: 3,\n    letterSpacing: -0.2\n  },\n  activeDot: {\n    width: 4,\n    height: 4,\n    borderRadius: 2,\n    marginTop: 2\n  }\n});\n