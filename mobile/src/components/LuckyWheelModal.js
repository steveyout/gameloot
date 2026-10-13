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
import { Sparkles, X, Trophy, Disc, Clock, Coins, Star } from 'lucide-react-native';
import { getWheelStatus, spinLuckyWheel } from '../api/clientApi';
import { playSound, triggerHaptic } from '../services/soundEffects';

export default function LuckyWheelModal({
  visible,
  token,
  onClose,
  onRewardWon
}) {
  const [wheelData, setWheelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [wonPrize, setWonPrize] = useState(null);

  const spinAnim = useRef(new Animated.Value(0)).current;
  const needleAnim = useRef(new Animated.Value(0)).current;
  const prizeScaleAnim = useRef(new Animated.Value(0)).current;

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
    if (spinning || !wheelData?.can_spin) return;

    try {
      setSpinning(true);
      setWonPrize(null);
      prizeScaleAnim.setValue(0);

      playSound('spin');
      triggerHaptic('medium');

      // Start animation
      spinAnim.setValue(0);
      const fullRotations = 6;
      const randomOffset = Math.floor(Math.random() * 360);
      const targetDeg = fullRotations * 360 + randomOffset;

      // Realistic mechanical wheel ticks that decelerate
      const tickIntervals = [
        100, 200, 300, 400, 500, 600, 720, 840, 980, 1120,
        1280, 1460, 1660, 1900, 2180, 2500, 2850, 3200, 3450
      ];

      tickIntervals.forEach((time) => {
        setTimeout(() => {
          playSound('tick');
          triggerHaptic('light');

          // Needle deflection flick
          Animated.sequence([
            Animated.timing(needleAnim, { toValue: -15, duration: 40, useNativeDriver: true }),
            Animated.spring(needleAnim, { toValue: 0, friction: 3, tension: 90, useNativeDriver: true })
          ]).start();
        }, time);
      });

      Animated.timing(spinAnim, {
        toValue: targetDeg,
        duration: 3600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }).start();

      const res = await spinLuckyWheel(token);
      if (res.success) {
        setTimeout(() => {
          setWonPrize(res.won_segment);
          setWheelData((prev) => ({ ...prev, can_spin: false, seconds_remaining: 8 * 3600 }));
          setSpinning(false);

          playSound('win');
          triggerHaptic('success');

          Animated.spring(prizeScaleAnim, {
            toValue: 1,
            friction: 4,
            tension: 80,
            useNativeDriver: true
          }).start();

          if (onRewardWon) {
            onRewardWon({
              points: res.won_segment.points,
              newBalance: res.new_balance,
              label: res.won_segment.label
            });
          }
        }, 3650);
      } else {
        setSpinning(false);
      }
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
        <View style={styles.modalSheet}>
          <View style={styles.sheetHandle} />

          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <LinearGradient
                colors={['#8b5cf6', '#6366f1']}
                style={styles.discBadge}
              >
                <Disc size={20} color="#ffffff" />
              </LinearGradient>
              <View>
                <Text style={styles.modalTitle}>Daily Lucky Wheel</Text>
                <Text style={styles.modalSubtitle}>Spin & Win up to 500 PTS Jackpot!</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <X size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#8b5cf6" />
              <Text style={styles.loadingText}>Loading wheel rewards...</Text>
            </View>
          ) : (
            <View style={styles.content}>
              {/* Wheel Graphic Container */}
              <View style={styles.wheelContainer}>
                {/* Mechanical Deflecting Needle Pointer */}
                <Animated.View
                  style={[
                    styles.needlePointerContainer,
                    { transform: [{ rotate: needleRotate }] }
                  ]}
                >
                  <View style={styles.needlePointer} />
                  <View style={styles.needlePin} />
                </Animated.View>

                {/* Animated Rotating Disc with Carnival Pegs */}
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
                    {/* Visual Segment Labels */}
                    <View style={[styles.segmentLabel, { top: 22 }]}>
                      <Text style={styles.segTextGold}>500 PTS 👑</Text>
                    </View>
                    <View style={[styles.segmentLabel, { bottom: 22 }]}>
                      <Text style={styles.segText}>15 PTS</Text>
                    </View>
                    <View style={[styles.segmentLabel, { right: 22 }]}>
                      <Text style={styles.segText}>100 PTS</Text>
                    </View>
                    <View style={[styles.segmentLabel, { left: 22 }]}>
                      <Text style={styles.segText}>50 PTS</Text>
                    </View>

                    {/* Perimeter Carnival Pegs */}
                    {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                      <View
                        key={deg}
                        style={[
                          styles.peg,
                          {
                            transform: [
                              { rotate: `${deg}deg` },
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

              {/* Prize Announcement if Won */}
              {wonPrize && (
                <Animated.View style={[styles.wonBanner, { transform: [{ scale: prizeScaleAnim }] }]}>
                  <Trophy size={20} color="#fbbf24" style={{ marginRight: 8 }} />
                  <View>
                    <Text style={styles.wonBannerTitle}>🎉 JACKPOT WINNER!</Text>
                    <Text style={styles.wonBannerText}>
                      Won {wonPrize.label} (+{wonPrize.points} PTS)
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
                <View style={styles.cooldownBanner}>
                  <Clock size={16} color="#94a3b8" style={{ marginRight: 6 }} />
                  <Text style={styles.cooldownText}>
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
    backgroundColor: '#0b111e',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: '#1e293b',
    paddingBottom: Platform.OS === 'android' ? 24 : 38
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
    fontWeight: '900',
    color: '#ffffff'
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#a5b4fc',
    fontWeight: '700',
    marginTop: 1
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingBox: {
    padding: 40,
    alignItems: 'center'
  },
  loadingText: {
    fontSize: 12,
    color: '#64748b',
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
  peg: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fbbf24'
  },
  segmentLabel: {
    position: 'absolute',
    alignItems: 'center'
  },
  segText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#e2e8f0'
  },
  segTextGold: {
    fontSize: 12,
    fontWeight: '900',
    color: '#fbbf24'
  },
  wheelCenterHub: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#f59e0b',
    marginBottom: 16
  },
  wonBannerTitle: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  wonBannerText: {
    color: '#ffffff',
    fontSize: 14,
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
    backgroundColor: '#1e293b',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    width: '100%'
  },
  cooldownText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700'
  }
});
