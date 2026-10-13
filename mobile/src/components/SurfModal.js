import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Globe, X, Sparkles, Trophy } from 'lucide-react-native';
import { claimSurfReward } from '../api/clientApi';

export default function SurfModal({ visible, task, token, onClose, onRewardClaimed }) {
  const [secondsLeft, setSecondsLeft] = useState(30);
  const [canClaim, setCanClaim] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    if (!visible || !task) {
      setSecondsLeft(30);
      setCanClaim(false);
      setIsClaiming(false);
      setClaimed(false);
      return;
    }

    const duration = task.duration_seconds || 30;
    setSecondsLeft(duration);
    setCanClaim(false);

    const timer = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanClaim(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [visible, task]);

  if (!visible || !task) return null;

  const handleClaim = async () => {
    if (!token || !canClaim) return;
    try {
      setIsClaiming(true);
      const res = await claimSurfReward(token, task.id);
      if (res.success) {
        setClaimed(true);
        onRewardClaimed({
          points: res.reward_earned,
          newBalance: res.new_balance,
          title: task.title
        });
      }
    } catch (err) {
      console.warn('Surf claim failed:', err.message);
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent={true} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Top Surf HUD */}
        <View style={styles.hud}>
          <View style={styles.hudLeft}>
            <Globe size={16} color="#06b6d4" />
            <Text style={styles.taskTitle} numberOfLines={1}>{task.title}</Text>
          </View>

          <View style={styles.hudRight}>
            {!canClaim && !claimed ? (
              <View style={styles.timerPill}>
                <Text style={styles.timerText}>Surf: {secondsLeft}s</Text>
              </View>
            ) : null}

            {canClaim && !claimed ? (
              <TouchableOpacity
                style={styles.claimBtn}
                onPress={handleClaim}
                disabled={isClaiming}
              >
                {isClaiming ? (
                  <ActivityIndicator size="small" color="#090d16" />
                ) : (
                  <>
                    <Sparkles size={12} color="#090d16" style={{ marginRight: 4 }} />
                    <Text style={styles.claimBtnText}>Claim +{task.reward_points} PTS</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={18} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* WebView */}
        <View style={styles.webWrap}>
          <WebView
            source={{ uri: task.website_url }}
            style={styles.web}
            javaScriptEnabled={true}
            domStorageEnabled={true}
          />
        </View>

        {/* Success Modal */}
        {claimed ? (
          <View style={styles.successOverlay}>
            <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
            <View style={styles.successCard}>
              <Trophy size={40} color="#fbbf24" style={{ marginBottom: 12 }} />
              <Text style={styles.successTitle}>Surf Reward Claimed!</Text>
              <Text style={styles.successSub}>Points credited to your balance.</Text>
              <View style={styles.ptsBadge}>
                <Text style={styles.ptsBadgeText}>+{task.reward_points} PTS</Text>
              </View>
              <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
                <Text style={styles.doneBtnText}>Continue</Text>
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
  hud: {
    paddingTop: 36,
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  hudLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 10
  },
  taskTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700'
  },
  hudRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  timerPill: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  timerText: {
    color: '#06b6d4',
    fontSize: 12,
    fontWeight: '700'
  },
  claimBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fbbf24',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8
  },
  claimBtnText: {
    color: '#090d16',
    fontSize: 11,
    fontWeight: '800'
  },
  closeBtn: {
    padding: 6,
    backgroundColor: '#1e293b',
    borderRadius: 8
  },
  webWrap: {
    flex: 1
  },
  web: {
    flex: 1
  },
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 7, 15, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  successCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155'
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff'
  },
  successSub: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4
  },
  ptsBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#f59e0b'
  },
  ptsBadgeText: {
    color: '#fbbf24',
    fontSize: 16,
    fontWeight: '800'
  },
  doneBtn: {
    width: '100%',
    backgroundColor: '#06b6d4',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center'
  },
  doneBtnText: {
    color: '#090d16',
    fontSize: 13,
    fontWeight: '800'
  }
});
