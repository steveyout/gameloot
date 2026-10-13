import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Easing
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, X, Trophy, ShieldCheck, Gift, Lock, Coins, Zap, Frown } from 'lucide-react-native';
import { claimRewardedAd } from '../api/clientApi';
import { playSound, triggerHaptic } from '../services/soundEffects';
import { useTheme } from '../context/ThemeContext';

export default function AdRewardModal({ visible, token, onClose, onRewardClaimed }) {
  const { theme, isDark } = useTheme();
  const [secondsLeft, setSecondsLeft] = useState(15);
  const [adFinished, setAdFinished] = useState(false);
  const [isOpened, setIsOpened] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [rewardData, setRewardData] = useState(null);

  // Animations
  const floatAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const chestScaleAnim = useRef(new Animated.Value(1)).current;
  const rewardScaleAnim = useRef(new Animated.Value(0)).current;

  // Idle floating animation
  useEffect(() => {
    let loop = null;
    if (visible && !isOpened) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: -8,
            duration: 1200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true
          }),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: 1200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true
          })
        ])
      );
      loop.start();
    }
    return () => {
      if (loop) loop.stop();
    };
  }, [visible, isOpened]);

  // Timer logic
  useEffect(() => {
    if (!visible) {
      setSecondsLeft(15);
      setAdFinished(false);
      setIsOpened(false);
      setIsClaiming(false);
      setRewardData(null);
      chestScaleAnim.setValue(1);
      rewardScaleAnim.setValue(0);
      shakeAnim.setValue(0);
      return;
    }

    setSecondsLeft(15);
    setAdFinished(false);
    setIsOpened(false);

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setAdFinished(true);
          triggerChestWobble();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [visible]);

  // Energetic shake when unlocked
  const triggerChestWobble = () => {
    playSound('coin');
    triggerHaptic('medium');

    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true })
    ]).start();
  };

  const handleOpenChest = async () => {
    if (isOpened || isClaiming || !token) return;

    try {
      setIsClaiming(true);
      playSound('chestOpen');
      triggerHaptic('heavy');

      // Pop open animation
      Animated.parallel([
        Animated.sequence([
          Animated.timing(chestScaleAnim, { toValue: 1.25, duration: 180, useNativeDriver: true }),
          Animated.spring(chestScaleAnim, { toValue: 0.95, friction: 4, useNativeDriver: true })
        ]),
        Animated.spring(rewardScaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 70,
          useNativeDriver: true
        })
      ]).start();

      const res = await claimRewardedAd(token, 'rewarded_daily_chest');
      if (res.success) {
        setRewardData(res);
        setIsOpened(true);

        const pts = res.reward_earned !== undefined ? res.reward_earned : (res.tier?.points || 0);
        const isTryAgain = res.tier?.isTryAgain || pts === 0;

        if (isTryAgain) {
          playSound('tap');
          triggerHaptic('light');
        } else {
          playSound('win');
          triggerHaptic('success');
        }

        if (onRewardClaimed) {
          onRewardClaimed({
            points: pts,
            newBalance: res.new_balance,
            title: res.tier?.name || 'Daily Loot Chest'
          });
        }
      }
    } catch (err) {
      console.warn('Loot chest claim failed:', err.message);
    } finally {
      setIsClaiming(false);
    }
  };

  if (!visible) return null;

  const ptsEarned = rewardData?.reward_earned !== undefined ? rewardData.reward_earned : (rewardData?.tier?.points || 0);
  const isTryAgain = rewardData?.tier?.isTryAgain || ptsEarned === 0;
  const isJackpot = rewardData?.tier?.isJackpot;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={() => {
        if (adFinished || isOpened) onClose();
      }}
    >
      <View style={styles.backdrop}>
        {/* Dismiss on click outside once unlocked or completed */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={() => {
            if (adFinished || isOpened) onClose();
          }}
        />

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', borderBottomColor: theme.border }]}>
            <View style={styles.sponsorBadge}>
              <Gift size={15} color="#f59e0b" />
              <Text style={[styles.sponsorText, { color: theme.text }]}>Daily Free Loot Chest</Text>
            </View>

            {adFinished || isOpened ? (
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                <X size={18} color={theme.subtext} />
              </TouchableOpacity>
            ) : (
              <View style={styles.countdownBadge}>
                <Text style={styles.countdownText}>Unlocks in: {secondsLeft}s</Text>
              </View>
            )}
          </View>

          {/* Interactive Loot Chest Showcase */}
          <LinearGradient
            colors={isDark ? ['#1c1917', '#0f172a', '#030712'] : ['#f8fafc', '#f1f5f9', '#e2e8f0']}
            style={styles.adContent}
          >
            {/* Shimmering Chest Visual */}
            <Animated.View
              style={[
                styles.chestVisualContainer,
                {
                  transform: [
                    { translateY: floatAnim },
                    { translateX: shakeAnim },
                    { scale: chestScaleAnim }
                  ]
                }
              ]}
            >
              <LinearGradient
                colors={
                  isOpened
                    ? (isTryAgain ? ['#475569', '#334155', '#1e293b'] : ['#f59e0b', '#d97706', '#78350f'])
                    : ['#292524', '#1c1917', '#0c0a09']
                }
                style={[styles.chestBox, isOpened && !isTryAgain && styles.chestBoxOpened]}
              >
                {isOpened ? (
                  isTryAgain ? (
                    <Frown size={50} color="#94a3b8" />
                  ) : (
                    <Coins size={54} color="#fef08a" />
                  )
                ) : adFinished ? (
                  <Gift size={52} color="#fbbf24" />
                ) : (
                  <Lock size={44} color="#64748b" />
                )}
              </LinearGradient>

              {/* Glowing Aura Ring */}
              <View style={[styles.chestGlow, adFinished && styles.chestGlowActive]} />
            </Animated.View>

            {/* Stages */}
            {!adFinished ? (
              <View style={styles.simBox}>
                <ActivityIndicator size="small" color="#06b6d4" style={{ marginBottom: 12 }} />
                <Text style={[styles.simTitle, { color: theme.text }]}>Sponsored Loyalty Chest</Text>
                <Text style={[styles.simSub, { color: theme.subtext }]}>
                  Sponsor video in progress. Keep screen open to unlock your free bonus chest.
                </Text>
                <View style={styles.policyRow}>
                  <ShieldCheck size={14} color="#10b981" />
                  <Text style={styles.policyText}>Verified ad-funded reward drop</Text>
                </View>
              </View>
            ) : !isOpened ? (
              <View style={styles.simBox}>
                <Text style={styles.unlockedTitle}>✨ Chest Unlocked!</Text>
                <Text style={[styles.simSub, { color: theme.subtext }]}>Tap below to crack open your mystery bonus drop.</Text>

                <TouchableOpacity
                  style={styles.openBtn}
                  onPress={handleOpenChest}
                  disabled={isClaiming}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#f59e0b', '#d97706', '#b45309']}
                    style={styles.openBtnGradient}
                  >
                    <Sparkles size={18} color="#ffffff" style={{ marginRight: 8 }} />
                    <Text style={styles.openBtnText}>
                      {isClaiming ? 'CRACKING CHEST...' : 'TAP TO OPEN CHEST'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <Animated.View style={[styles.rewardClaimedBox, { transform: [{ scale: rewardScaleAnim }] }]}>
                {isTryAgain ? (
                  <View style={[styles.ptsBadge, styles.tryAgainBadge]}>
                    <Frown size={18} color="#94a3b8" />
                    <Text style={[styles.ptsBadgeText, { color: '#cbd5e1' }]}>EMPTY CHEST — TRY AGAIN</Text>
                  </View>
                ) : (
                  <View style={[styles.ptsBadge, isJackpot && styles.jackpotBadge]}>
                    <Sparkles size={18} color="#fbbf24" />
                    <Text style={styles.ptsBadgeText}>
                      {isJackpot ? `👑 +${ptsEarned} PTS JACKPOT!` : `+${ptsEarned} PTS ADDED!`}
                    </Text>
                  </View>
                )}

                <Text style={[styles.congratsText, { color: theme.subtext }]}>
                  {isTryAgain
                    ? 'No points this drop. Better luck next time!'
                    : 'Deposited straight into your loyalty vault.'}
                </Text>

                <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.85}>
                  <Text style={styles.doneBtnText}>Collect & Continue</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 15, 0.92)',
    justifyContent: 'center',
    padding: 20
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1
  },
  sponsorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7
  },
  sponsorText: {
    fontSize: 13,
    fontWeight: '800'
  },
  countdownBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)'
  },
  countdownText: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '800'
  },
  closeBtn: {
    padding: 4
  },
  adContent: {
    padding: 26,
    minHeight: 310,
    justifyContent: 'center',
    alignItems: 'center'
  },
  chestVisualContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  chestBox: {
    width: 90,
    height: 90,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#44403c',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8
  },
  chestBoxOpened: {
    borderColor: '#fef08a',
    shadowColor: '#f59e0b',
    shadowOpacity: 0.8,
    shadowRadius: 18,
    elevation: 15
  },
  chestGlow: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
    zIndex: -1
  },
  chestGlowActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)'
  },
  simBox: {
    alignItems: 'center',
    width: '100%'
  },
  simTitle: {
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center'
  },
  unlockedTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#f59e0b',
    textAlign: 'center',
    letterSpacing: -0.3
  },
  simSub: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    maxWidth: 270
  },
  policyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8
  },
  policyText: {
    color: '#6ee7b7',
    fontSize: 10,
    fontWeight: '600'
  },
  openBtn: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 18,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5
  },
  openBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14
  },
  openBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  rewardClaimedBox: {
    alignItems: 'center',
    width: '100%'
  },
  ptsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#f59e0b',
    marginBottom: 8
  },
  tryAgainBadge: {
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
    borderColor: '#64748b'
  },
  jackpotBadge: {
    backgroundColor: 'rgba(234, 179, 8, 0.3)',
    borderColor: '#eab308'
  },
  ptsBadgeText: {
    color: '#fef08a',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  congratsText: {
    fontSize: 12,
    marginBottom: 18
  },
  doneBtn: {
    width: '100%',
    backgroundColor: '#06b6d4',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center'
  },
  doneBtnText: {
    color: '#090d16',
    fontSize: 13,
    fontWeight: '900'
  }
});
