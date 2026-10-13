import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Sparkles, Clock, ShieldCheck, Trophy, Play } from 'lucide-react-native';
import { startPlaySession, pingPlaySession, claimPlaySession } from '../api/clientApi';

export default function GamePlayerModal({
  visible,
  game,
  token,
  onClose,
  onRewardClaimed
}) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [pingCountdown, setPingCountdown] = useState(45);
  const [claimablePoints, setClaimablePoints] = useState(0);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimResult, setClaimResult] = useState(null);

  const timerRef = useRef(null);

  // Initialize session when modal opens
  useEffect(() => {
    if (!visible || !game) {
      setSession(null);
      setSessionSeconds(0);
      setClaimablePoints(0);
      setClaimResult(null);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    let active = true;

    async function initSession() {
      try {
        setLoading(true);
        const data = await startPlaySession(token, game.id);
        if (active && data.success) {
          const sessionObj = data.session || {
            session_id: data.session_token,
            session_token: data.session_token,
            ping_interval_seconds: 45
          };
          setSession(sessionObj);
          setPingCountdown(sessionObj.ping_interval_seconds || 45);
        }
      } catch (err) {
        console.warn('Could not start play session:', err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    initSession();

    return () => {
      active = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [visible, game, token]);

  // Proof-of-play heartbeat ticker
  useEffect(() => {
    if (!visible || !session) return;

    timerRef.current = setInterval(async () => {
      setSessionSeconds(prev => prev + 1);

      setPingCountdown(prev => {
        if (prev <= 1) {
          // Send proof of play ping to backend
          sendPing();
          return session.ping_interval_seconds || 45;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [visible, session]);

  const sendPing = async () => {
    if (!session || !token) return;
    try {
      const pingHash = 'ping_' + Date.now();
      const sId = session.session_id || session.session_token;
      const res = await pingPlaySession(token, sId, pingHash);
      if (res.success) {
        setClaimablePoints(res.current_reward || res.current_points_earned || (claimablePoints + 1));
      }
    } catch (err) {
      console.warn('Ping failed:', err.message);
    }
  };

  const handleClaimAndExit = async () => {
    if (!session || !token) {
      onClose();
      return;
    }

    try {
      setIsClaiming(true);
      const sId = session.session_id || session.session_token;
      const res = await claimPlaySession(token, sId);
      const earned = res.reward_earned !== undefined ? res.reward_earned : (res.points_earned || 0);

      if (res.success && earned > 0) {
        setClaimResult({ ...res, reward_earned: earned });
        onRewardClaimed({
          points: earned,
          newBalance: res.new_balance,
          gameTitle: game.title
        });
      } else {
        onClose();
      }
    } catch (err) {
      console.warn('Claim error:', err.message);
      onClose();
    } finally {
      setIsClaiming(false);
    }
  };

  if (!visible || !game) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent={true}
      onRequestClose={handleClaimAndExit}
    >
      <View style={styles.container}>
        {/* Floating Top Game HUD Bar */}
        <SafeAreaView style={styles.hudBar} edges={['top', 'left', 'right']}>
          <View style={styles.hudLeft}>
            <Text style={styles.gameTitle} numberOfLines={1}>
              {game.title}
            </Text>
            <View style={styles.metaRow}>
              <View style={styles.ratePill}>
                <Sparkles size={11} color="#06b6d4" />
                <Text style={styles.ratePillText}>{game.reward_rate || 1} PTS / MIN</Text>
              </View>
              <View style={styles.timerPill}>
                <Clock size={11} color="#94a3b8" />
                <Text style={styles.timerPillText}>
                  {Math.floor(sessionSeconds / 60)}:{(sessionSeconds % 60).toString().padStart(2, '0')}
                </Text>
              </View>
            </View>
          </View>

          {/* Points earned counter + Claim / Exit */}
          <View style={styles.hudRight}>
            <View style={styles.earnedPill}>
              <Text style={styles.earnedLabel}>Accrued</Text>
              <Text style={styles.earnedValue}>+{claimablePoints} PTS</Text>
            </View>

            <TouchableOpacity
              style={styles.exitButton}
              onPress={handleClaimAndExit}
              activeOpacity={0.8}
              disabled={isClaiming}
            >
              <X size={18} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* Game WebView Container */}
        <View style={styles.webContainer}>
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#06b6d4" />
              <Text style={styles.loadingText}>Initializing {game.title}...</Text>
              <Text style={styles.loadingSub}>Verifying proof-of-play anti-cheat session</Text>
            </View>
          ) : (
            <WebView
              source={{ uri: game.embed_url }}
              style={styles.webView}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              allowsInlineMediaPlayback={true}
              mediaPlaybackRequiresUserAction={false}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="large" color="#06b6d4" />
                  <Text style={styles.loadingText}>Loading HTML5 canvas...</Text>
                </View>
              )}
            />
          )}
        </View>

        {/* Claim Success Celebration Overlay */}
        {claimResult ? (
          <View style={styles.claimOverlay}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={onClose}
            />
            <View style={styles.claimCard}>
              <LinearGradient
                colors={['#06b6d4', '#3b82f6']}
                style={styles.claimIconCircle}
              >
                <Trophy size={32} color="#ffffff" />
              </LinearGradient>

              <Text style={styles.claimTitle}>Points Claimed!</Text>
              <Text style={styles.claimSubtitle}>
                You earned rewards playing {game.title}.
              </Text>

              <View style={styles.rewardBox}>
                <Sparkles size={20} color="#f59e0b" />
                <Text style={styles.rewardText}>+{claimResult.reward_earned} PTS</Text>
                <Text style={styles.rewardUsd}>
                  (≈ ${(claimResult.reward_earned * 0.001).toFixed(3)} USD)
                </Text>
              </View>

              <TouchableOpacity
                style={styles.continueBtn}
                onPress={onClose}
                activeOpacity={0.85}
              >
                <Text style={styles.continueBtnText}>Back to Lobby</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16'
  },
  hudBar: {
    paddingHorizontal: 14,
    paddingBottom: 10,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  hudLeft: {
    flex: 1,
    marginRight: 10
  },
  gameTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff'
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4
  },
  ratePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  ratePillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#06b6d4'
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1e293b',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  timerPillText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#94a3b8'
  },
  hudRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  earnedPill: {
    alignItems: 'flex-end',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)'
  },
  earnedLabel: {
    fontSize: 8,
    color: '#94a3b8',
    fontWeight: '700'
  },
  earnedValue: {
    fontSize: 11,
    color: '#fbbf24',
    fontWeight: '800'
  },
  exitButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center'
  },
  webContainer: {
    flex: 1,
    backgroundColor: '#000000'
  },
  webView: {
    flex: 1,
    backgroundColor: '#000000'
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#090d16',
    padding: 20
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 12
  },
  loadingSub: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 4
  },
  claimOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 7, 15, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 999
  },
  claimCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155'
  },
  claimIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  claimTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff'
  },
  claimSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16
  },
  rewardBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1e293b',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f59e0b',
    marginBottom: 20
  },
  rewardText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fbbf24'
  },
  rewardUsd: {
    fontSize: 12,
    color: '#94a3b8'
  },
  continueBtn: {
    width: '100%',
    backgroundColor: '#06b6d4',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center'
  },
  continueBtnText: {
    color: '#090d16',
    fontSize: 14,
    fontWeight: '800'
  }
});
