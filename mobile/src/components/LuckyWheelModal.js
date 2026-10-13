import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Easing,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, X, Trophy, Disc, Clock, Coins, Star, Frown } from 'lucide-react-native';
import { getWheelStatus, spinLuckyWheel } from '../api/clientApi';
import { playSound, triggerHaptic } from '../services/soundEffects';
import { useTheme } from '../context/ThemeContext';

// 8 Segments matching the server's exact probability model (45 degrees per sector)
const WHEEL_SEGMENTS = [
  { id: 0, label: 'TRY AGAIN', points: 0, isTryAgain: true, isJackpot: false, color: '#64748b' },
  { id: 1, label: '5 PTS', points: 5, isTryAgain: false, isJackpot: false, color: '#06b6d4' },
  { id: 2, label: '10 PTS', points: 10, isTryAgain: false, isJackpot: false, color: '#3b82f6' },
  { id: 3, label: 'TRY AGAIN', points: 0, isTryAgain: true, isJackpot: false, color: '#475569' },
  { id: 4, label: '25 PTS', points: 25, isTryAgain: false, isJackpot: false, color: '#8b5cf6' },
  { id: 5, label: '50 PTS', points: 50, isTryAgain: false, isJackpot: false, color: '#ec4899' },
  { id: 6, label: '100 PTS', points: 100, isTryAgain: false, isJackpot: false, color: '#f59e0b' },
  { id: 7, label: '500 PTS 👑', points: 500, isTryAgain: false, isJackpot: true, color: '#10b981' }
];

export default function LuckyWheelModal({
  visible,
  token,
  onClose,
  onRewardWon
}) {
  const { colors, isDark } = useTheme();
  const [wheelData, setWheelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [wonPrize, setWonPrize] = useState(null);

  const spinAnim = useRef(new Animated.Value(0)).current;
  const needleAnim = useRef(new Animated.Value(0)).current;
  const prizeScaleAnim = useRef(new Animated.Value(0)).current;

  // Track the current rotation degrees so spins accumulate smoothly
  const currentRotationRef = useRef(0);

  const fetchWheel = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await getWheelStatus(token);
      if (res.success) {
        setWheelData(res);
      }
    } catch (err) {
      console.warn('Failed to load wheel:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && token) {
      setWonPrize(null);
      prizeScaleAnim.setValue(0);
      fetchWheel();
    }
  }, [visible, token]);

  const handleSpin = async () => {
    if (spinning || !wheelData?.can_spin || !token) return;

    try {
      setSpinning(true);
      setWonPrize(null);
      prizeScaleAnim.setValue(0);

      playSound('spin');
      triggerHaptic('medium');

      // Call server first to determine winning segment
      const res = await spinLuckyWheel(token);
      if (!res.success) {
        setSpinning(false);
        return;
      }

      // Exact Pointer Matching Geometry:
      // Pointer is at the TOP (0 deg / 12 o'clock).
      // Each segment i is at angle (i * 45) deg from the top.
      // To bring segment wonId right under the top pointer:
      // Required final angular position = (360 - wonAngle) % 360
      const wonSegment = res.won_segment || WHEEL_SEGMENTS[0];
      const wonId = (wonSegment.id !== undefined && wonSegment.id >= 0 && wonSegment.id <= 7)
        ? wonSegment.id
        : 0;

      const wonSegmentAngle = wonId * 45;
      const targetOffset = (360 - wonSegmentAngle) % 360;

      // Spin 7 full rotations plus exact offset to align target under top pointer
      const fullRotations = 7;
      const startDeg = currentRotationRef.current % 360;
      const targetDeg = currentRotationRef.current + (fullRotations * 360) + ((targetOffset - startDeg + 360) % 360);
      currentRotationRef.current = targetDeg;

      // Realistic mechanical wheel ticks that decelerate with the wheel
      const tickIntervals = [
        120, 240, 360, 480, 610, 750, 900, 1060, 1230, 1420,
        1630, 1860, 2120, 2410, 2730, 3080, 3450, 3750
      ];

      tickIntervals.forEach((time) => {
        setTimeout(() => {
          playSound('tick');
          triggerHaptic('light');

          // Needle deflection flick
          Animated.sequence([
            Animated.timing(needleAnim, { toValue: -16, duration: 45, useNativeDriver: true }),
            Animated.spring(needleAnim, { toValue: 0, friction: 3, tension: 90, useNativeDriver: true })
          ]).start();
        }, time);
      });

      // Smooth deceleration cubic curve
      Animated.timing(spinAnim, {
        toValue: targetDeg,
        duration: 4000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }).start(() => {
        // Needle final settle snap
        Animated.sequence([
          Animated.timing(needleAnim, { toValue: -6, duration: 50, useNativeDriver: true }),
          Animated.spring(needleAnim, { toValue: 0, friction: 4, tension: 120, useNativeDriver: true })
        ]).start();

        setWonPrize(wonSegment);
        setWheelData((prev) => ({ ...prev, can_spin: false, seconds_remaining: 8 * 3600 }));
        setSpinning(false);

        if (wonSegment.isTryAgain || wonSegment.points === 0) {
          playSound('tap');
          triggerHaptic('light');
        } else {
          playSound('win');
          triggerHaptic('success');
        }

        Animated.spring(prizeScaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 80,
          useNativeDriver: true
        }).start();

        if (onRewardWon) {
          onRewardWon({
            points: wonSegment.points || 0,
            newBalance: res.new_balance,
            label: wonSegment.label
          });
        }
      });
    } catch (err) {
      setSpinning(false);
      console.warn('Spin error:', err);
    }
  };

  if (!visible) return null;

  const spinInterpolate = spinAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg']
  });

  const needleRotate = needleAnim.interpolate({
    inputRange: [-20, 20],
    outputRange: ['-20deg', '20deg']
  });

  const canSpin = wheelData?.can_spin;
  const hoursLeft = Math.floor((wheelData?.seconds_remaining || 0) / 3600);
  const minsLeft = Math.floor(((wheelData?.seconds_remaining || 0) % 3600) / 60);

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

        <View style={[
          styles.modalSheet,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border
          }
        ]}>
          <View style={[styles.sheetHandle, { backgroundColor: isDark ? '#334155' : '#cbd5e1' }]} />

          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <LinearGradient
                colors={['#8b5cf6', '#6366f1']}
                style={styles.discBadge}
              >
                <Disc size={20} color="#ffffff" />
              </LinearGradient>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Daily Lucky Wheel</Text>
                <Text style={styles.modalSubtitle}>Spin & Win up to 500 PTS Jackpot!</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: colors.surfaceSubtle }]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#8b5cf6" />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading wheel rewards...</Text>
            </View>
          ) : (
            <View style={styles.content}>
              {/* Wheel Graphic Container */}
              <View style={styles.wheelContainer}>
                {/* Mechanical Deflecting Needle Pointer (Fixed at Top Center 0°) */}
                <Animated.View
                  style={[
                    styles.needlePointerContainer,
                    { transform: [{ rotate: needleRotate }] }
                  ]}
                >
                  <View style={styles.needlePointer} />
                  <View style={styles.needlePin} />
                </Animated.View>

                {/* Animated Rotating Disc with mathematically accurate radial segments */}
                <Animated.View
                  style={[
                    styles.wheelDisc,
                    { transform: [{ rotate: spinInterpolate }] }
                  ]}
                >
                  <LinearGradient
                    colors={['#1e1b4b', '#312e81', '#1e1b4b']}
                    style={styles.wheelDiscGradient}
                  >
                    {/* Radially positioned segment labels (45° sectors) */}
                    {WHEEL_SEGMENTS.map((seg, idx) => {
                      const angle = idx * 45;
                      return (
                        <View
                          key={seg.id}
                          style={[
                            styles.segmentSlice,
                            {
                              transform: [
                                { rotate: `${angle}deg` },
                                { translateY: -68 }
                              ]
                            }
                          ]}
                        >
                          <Text
                            style={[
                              styles.segLabelText,
                              seg.isJackpot && styles.segLabelJackpot,
                              seg.isTryAgain && styles.segLabelTryAgain
                            ]}
                            numberOfLines={1}
                          >
                            {seg.label}
                          </Text>
                        </View>
                      );
                    })}

                    {/* Perimeter Carnival Pegs dividing the segments (at +22.5° offset) */}
                    {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                      <View
                        key={deg}
                        style={[
                          styles.peg,
                          {
                            transform: [
                              { rotate: `${deg + 22.5}deg` },
                              { translateY: -94 }
                            ]
                          }
                        ]}
                      />
                    ))}

                    {/* Center Hub */}
                    <View style={styles.wheelCenterHub}>
                      <Sparkles size={20} color="#fbbf24" />
                    </View>
                  </LinearGradient>
                </Animated.View>
              </View>

              {/* Prize / Try Again Announcement */}
              {wonPrize && (
                <Animated.View
                  style={[
                    styles.wonBanner,
                    (wonPrize.isTryAgain || wonPrize.points === 0) ? styles.tryAgainBanner : null,
                    wonPrize.isJackpot ? styles.jackpotBanner : null,
                    { transform: [{ scale: prizeScaleAnim }] }
                  ]}
                >
                  {(wonPrize.isTryAgain || wonPrize.points === 0) ? (
                    <Frown size={22} color="#94a3b8" style={{ marginRight: 10 }} />
                  ) : (
                    <Trophy size={22} color="#fbbf24" style={{ marginRight: 10 }} />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={[
                      styles.wonBannerTitle,
                      (wonPrize.isTryAgain || wonPrize.points === 0) && { color: '#94a3b8' },
                      wonPrize.isJackpot && { color: '#f59e0b', fontSize: 13 }
                    ]}>
                      {wonPrize.isJackpot
                        ? '👑 MEGA JACKPOT HIT!'
                        : (wonPrize.isTryAgain || wonPrize.points === 0)
                        ? '💔 TRY AGAIN NEXT TIME'
                        : '🎉 REWARD WON!'}
                    </Text>
                    <Text style={[styles.wonBannerText, (wonPrize.isTryAgain || wonPrize.points === 0) && { color: '#cbd5e1' }]}>
                      {(wonPrize.isTryAgain || wonPrize.points === 0)
                        ? 'Better luck on your next free spin!'
                        : `Won ${wonPrize.label} (+${wonPrize.points} PTS)`}
                    </Text>
                  </View>
                </Animated.View>
              )}

              {/* Action Button */}
              {canSpin ? (
                <TouchableOpacity
                  style={styles.spinBtn}
                  onPress={handleSpin}
                  disabled={spinning}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#8b5cf6', '#6366f1']}
                    style={styles.spinGradient}
                  >
                    <Sparkles size={16} color="#ffffff" style={{ marginRight: 6 }} />
                    <Text style={styles.spinBtnText}>
                      {spinning ? 'SPINNING WHEEL...' : 'SPIN FREE DAILY WHEEL'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <View style={[styles.cooldownBanner, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
                  <Clock size={16} color={colors.textSecondary} style={{ marginRight: 6 }} />
                  <Text style={[styles.cooldownText, { color: colors.textSecondary }]}>
                    Next free spin in {hoursLeft}h {minsLeft}m
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
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
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
  discBadge: {
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
    color: '#8b5cf6',
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
    padding: 20,
    alignItems: 'center'
  },
  wheelContainer: {
    width: 230,
    height: 230,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 14,
    position: 'relative'
  },
  needlePointerContainer: {
    position: 'absolute',
    top: -8,
    alignItems: 'center',
    zIndex: 30
  },
  needlePointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 11,
    borderRightWidth: 11,
    borderTopWidth: 22,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#ef4444'
  },
  needlePin: {
    position: 'absolute',
    top: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff'
  },
  wheelDisc: {
    width: 216,
    height: 216,
    borderRadius: 108,
    overflow: 'hidden',
    borderWidth: 6,
    borderColor: '#4338ca',
    elevation: 10,
    shadowColor: '#8b5cf6',
    shadowOpacity: 0.6,
    shadowRadius: 14
  },
  wheelDiscGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  segmentSlice: {
    position: 'absolute',
    width: 76,
    alignItems: 'center',
    justifyContent: 'center'
  },
  segLabelText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#e2e8f0',
    textAlign: 'center'
  },
  segLabelJackpot: {
    color: '#fbbf24',
    fontSize: 10.5
  },
  segLabelTryAgain: {
    color: '#94a3b8',
    fontSize: 8.5
  },
  peg: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fbbf24'
  },
  wheelCenterHub: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#090d16',
    borderWidth: 3.5,
    borderColor: '#fbbf24',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10
  },
  wonBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#f59e0b',
    marginBottom: 16,
    width: '100%'
  },
  tryAgainBanner: {
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
    borderColor: '#64748b'
  },
  jackpotBanner: {
    backgroundColor: 'rgba(234, 179, 8, 0.25)',
    borderColor: '#eab308'
  },
  wonBannerTitle: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  wonBannerText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2
  },
  spinBtn: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden'
  },
  spinGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14
  },
  spinBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5
  },
  cooldownBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    width: '100%'
  },
  cooldownText: {
    fontSize: 12,
    fontWeight: '700'
  }
});
