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
import { X, Sparkles, Clock, ShieldCheck, Trophy, Play, Shield } from 'lucide-react-native';
import { startPlaySession, pingPlaySession, claimPlaySession } from '../api/clientApi';
import { logEvent } from '../services/firebase';

/**
 * Safe HTML5 Game Bridge & WebView Optimizer
 * 1. Rewrites target="_blank" links (like the Famobi Play button) to target="_self" so it navigates in-place instead of creating dead blank windows.
 * 2. Overrides window.open to keep gameplay inside the current WebView.
 * 3. Keeps all standard APIs intact so ad-loaders and game engines never hang or throw TypeErrors.
 */
const GAME_WEBVIEW_INJECTED_JS = `
(function() {
  if (window.__gameloot_game_bridge_installed) return;
  window.__gameloot_game_bridge_installed = true;

  // 1. Force target="_blank" links (such as game start/play buttons) to open in current window
  document.addEventListener('click', function(e) {
    var el = e.target;
    while (el && el.tagName !== 'A') {
      el = el.parentElement;
    }
    if (el && el.tagName === 'A') {
      if (el.getAttribute('target') === '_blank') {
        el.setAttribute('target', '_self');
      }
    }
  }, true);

  // 2. Prevent window.open from opening separate windows - navigate current window instead
  var _origOpen = window.open;
  window.open = function(url, target, features) {
    if (url && typeof url === 'string') {
      if (!target || target === '_blank' || target === '_self') {
        window.location.href = url;
        return window;
      }
    }
    return _origOpen ? _origOpen.apply(window, arguments) : null;
  };
})();
true;
`;

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

        logEvent('game_player_open', {
          game_id: game.id,
          game_title: game.title,
          category: game.category_name,
          app: 'gameloot'
        });

        const data = await startPlaySession(token, game.id);
        if (active) {
          const sToken =
            data?.session?.session_token ||
            data?.session?.session_id ||
            data?.session_token ||
            data?.session_id ||
            ('gses_' + Date.now().toString(36));

          const pingInterval =
            data?.session?.ping_interval_seconds ||
            data?.ping_interval_seconds ||
            45;

          const sessionObj = {
            session_id: sToken,
            session_token: sToken,
            ping_interval_seconds: Number(pingInterval) || 45
          };
          setSession(sessionObj);
          setPingCountdown(sessionObj.ping_interval_seconds);
        }
      } catch (err) {
        console.warn('Could not start play session:', err?.message || err);
        // Fallback session so player is never blocked from playing
        if (active) {
          const fallbackObj = {
            session_id: 'gses_' + Date.now(),
            session_token: 'gses_' + Date.now(),
            ping_interval_seconds: 45
          };
          setSession(fallbackObj);
          setPingCountdown(45);
        }
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
          return (session?.ping_interval_seconds) || 45;
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
      if (res?.success) {
        setClaimablePoints(res.current_reward || res.current_points_earned || (claimablePoints + 1));
      }
    } catch (err) {
      console.warn('Ping failed:', err?.message || err);
    }
  };

  const handleClaimAndExit = async () => {
    if (!session || !token) {
      logEvent('game_player_exit', {
        game_id: game?.id,
        seconds_played: sessionSeconds,
        claimable_points: claimablePoints,
        app: 'gameloot'
      });
      onClose();
      return;
    }

    try {
      setIsClaiming(true);
      const sId = session.session_id || session.session_token;
      const res = await claimPlaySession(token, sId);
      const earned = res?.reward_earned !== undefined ? res.reward_earned : (res?.points_earned || 0);

      logEvent('game_reward_claim', {
        game_id: game.id,
        reward_earned: earned,
        seconds_played: sessionSeconds,
        app: 'gameloot'
      });

      if (res?.success && earned > 0) {
        setClaimResult({ ...res, reward_earned: earned });
        if (onRewardClaimed) {
          onRewardClaimed({
            points: earned,
            newBalance: res.new_balance,
            gameTitle: game.title
          });
        }
      } else {
        onClose();
      }
    } catch (err) {
      console.warn('Claim error:', err?.message || err);
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
              <View style={styles.shieldPill}>
                <Shield size={10} color="#10b981" />
                <Text style={styles.shieldPillText}>Instant Play</Text>
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
              <Text style={styles.loadingSub}>Loading instant game canvas</Text>
            </View>
          ) : (
            <WebView
              source={{ uri: game.embed_url }}
              style={styles.webView}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              allowsInlineMediaPlayback={true}
              mediaPlaybackRequiresUserAction={false}
              mixedContentMode="always"
              originWhitelist={['*']}
              setSupportMultipleWindows={false}
              javaScriptCanOpenWindowsAutomatically={true}
              thirdPartyCookiesEnabled={true}
              sharedCookiesEnabled={true}
              androidHardwareAccelerationDisabled={false}
              androidLayerType="hardware"
              scalesPageToFit={true}
              startInLoadingState={true}
              injectedJavaScriptBeforeContentLoaded={GAME_WEBVIEW_INJECTED_JS}
              injectedJavaScript={GAME_WEBVIEW_INJECTED_JS}
              renderLoading={() => (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="large" color="#06b6d4" />
                  <Text style={styles.loadingText}>Loading game canvas...</Text>
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
  shieldPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  shieldPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#10b981'
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
