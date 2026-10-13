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
import { Sparkles, X, Trophy, ShieldCheck, Gift, Lock, Coins, Zap, Frown, AlertCircle } from 'lucide-react-native';
import { claimRewardedAd, getAdConfig } from '../api/clientApi';
import { playSound, triggerHaptic } from '../services/soundEffects';
import { useTheme } from '../context/ThemeContext';

export default function AdRewardModal({ visible, token, onClose, onRewardClaimed }) {
  const { theme, isDark } = useTheme();
  const [secondsLeft, setSecondsLeft] = useState(15);
  const [adFinished, setAdFinished] = useState(false);
  const [isOpened, setIsOpened] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [rewardData, setRewardData] = useState(null);
  const [adConfig, setAdConfig] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Animations
  const floatAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const chestScaleAnim = useRef(new Animated.Value(1)).current;
  const rewardScaleAnim = useRef(new Animated.Value(0)).current;

  // Fetch live ad config on open
  useEffect(() => {
    if (visible) {
      getAdConfig().then(res => {
        if (res && res.success) {
          setAdConfig(res);
          if (res.ads_enabled === false) {
            setErrorMessage(res.config?.message || 'Ad rewards are currently paused by administrator.');
          }
        }
      }).catch(() => {});
    } else {
      setErrorMessage(null);
    }
  }, [visible]);

  // Idle floating animation
  useEffect(() => {
    let loop = null;
    if (visible && !isOpened && !errorMessage) {
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
  }, [visible, isOpened, errorMessage]);

  // Timer logic
  useEffect(() => {
    if (!visible) {
      setSecondsLeft(15);
      setAdFinished(false);
      setIsOpened(false);
      setIsClaiming(false);
      setRewardData(null);
      setErrorMessage(null);
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
      } else {
        setErrorMessage(res.message || 'Ad claim failed');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Loot chest claim failed');
    } finally {
      setIsClaiming(false);
    }
  };

  if (!visible) return null;

  const ptsEarned = rewardData?.reward_earned !== undefined ? rewardData.reward_earned : (rewardData?.tier?.points || 0);
  const isTryAgain = rewardData?.tier?.isTryAgain || ptsEarned === 0;
  const isJackpot = rewardData?.tier?.isJackpot;
  const providerName = adConfig?.primary_provider?.name || 'Sponsor';

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={() => {
        if (adFinished || isOpened || errorMessage) onClose();
      }}
    >
      <View style={styles.backdrop}>
        {/* Dismiss on click outside once unlocked or completed */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={() => {
            if (adFinished || isOpened || errorMessage) onClose();
          }}
        />

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', borderBottomColor: theme.border }]}>
            <View style={styles.sponsorBadge}>
              <Gift size={15} color="#f59e0b" />
              <Text style={[styles.sponsorText, { color: theme.text }]}>
                {providerName} Free Loot Chest
              </Text>
            </View>

            {adFinished || isOpened || errorMessage ? (
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
            {errorMessage ? (
              <View style={styles.simBox}>
                <AlertCircle size={44} color="#f59e0b" style={{ marginBottom: 10, alignSelf: 'center' }} />
                <Text style={[styles.simTitle, { color: theme.text }]}>Campaign Paused</Text>
                <Text style={[styles.simSub, { color: theme.subtext, marginTop: 4 }]}>
                  {errorMessage}
                </Text>
                <TouchableOpacity
                  style={[styles.doneBtn, { marginTop: 16 }]}
                  onPress={onClose}
                  activeOpacity={0.85}
                >
                  <Text style={styles.doneBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
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
                    <Text style={[styles.simTitle, { color: theme.text }]}>{providerName} Video Drop</Text>
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
              </>
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
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 1.5,
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 20
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1
  },
  sponsorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  sponsorText: {
    fontSize: 13,
    fontWeight: '800'
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  countdownBadge: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)'
  },
  countdownText: {
    color: '#06b6d4',
    fontSize: 11,
    fontWeight: '800'
  },
  adContent: {
    padding: 24,
    alignItems: 'center'
  },
  chestVisualContainer: {
    width: 130,
    height: 130,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16
  },
  chestBox: {
    width: 108,
    height: 108,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#451a03',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 2
  },
  chestBoxOpened: {
    borderColor: '#fef08a',
    shadowOpacity: 0.7,
    shadowRadius: 25
  },
  chestGlow: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
    zIndex: 1
  },
  chestGlowActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.25)'
  },
  simBox: {
    alignItems: 'center',
    marginTop: 8,
    width: '100%'
  },
  simTitle: {
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center'
  },
  simSub: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 17,
    paddingHorizontal: 12
  },
  policyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)'
  },
  policyText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '700'
  },
  unlockedTitle: {
    color: '#fbbf24',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center'
  },
  openBtn: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 18,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6
  },
  openBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20
  },
  openBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  rewardClaimedBox: {
    alignItems: 'center',
    width: '100%',
    marginTop: 8
  },
  ptsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.5)'
  },
  jackpotBadge: {
    backgroundColor: 'rgba(234, 179, 8, 0.3)',
    borderColor: '#facc15'
  },
  tryAgainBadge: {
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
    borderColor: 'rgba(100, 116, 139, 0.4)'
  },
  ptsBadgeText: {
    color: '#fbbf24',
    fontSize: 15,
    fontWeight: '900'
  },
  congratsText: {
    fontSize: 12,
    marginTop: 10,
    textAlign: 'center'
  },
  doneBtn: {
    width: '100%',
    backgroundColor: '#06b6d4',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 18
  },
  doneBtnText: {
    color: '#090d16',
    fontSize: 13,
    fontWeight: '800'
  }
});
