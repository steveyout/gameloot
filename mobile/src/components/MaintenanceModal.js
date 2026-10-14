import React, { useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  BackHandler,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Wrench,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Server,
  Zap
} from 'lucide-react-native';

export default function MaintenanceModal({
  visible,
  onRetry,
  isChecking
}) {
  // Prevent Android hardware back button from closing mandatory maintenance modal
  useEffect(() => {
    if (!visible) return;

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      return true;
    });

    return () => backHandler.remove();
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={() => {}}
    >
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          {/* Header Gradient Banner */}
          <LinearGradient
            colors={['#b45309', '#78350f', '#451a03']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <View style={styles.badgeRow}>
              <View style={styles.iconCircle}>
                <Wrench size={24} color="#fef08a" />
              </View>
              <View style={styles.badgePill}>
                <Text style={styles.badgePillText}>SCHEDULED MAINTENANCE</Text>
              </View>
            </View>

            <Text style={styles.headerTitle}>System Upgrade in Progress</Text>
            <Text style={styles.headerSubtitle}>
              GameLoot servers are currently undergoing scheduled maintenance and reward pool optimizations.
            </Text>
          </LinearGradient>

          {/* Body Content */}
          <View style={styles.body}>
            <View style={styles.featureBox}>
              <View style={styles.featureRow}>
                <View style={styles.featureIconWrap}>
                  <Server size={16} color="#38bdf8" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureTitle}>Server Upgrades</Text>
                  <Text style={styles.featureDesc}>Improving game loading speed and network stability.</Text>
                </View>
              </View>

              <View style={styles.featureRow}>
                <View style={[styles.featureIconWrap, { backgroundColor: 'rgba(74, 222, 128, 0.15)' }]}>
                  <ShieldCheck size={16} color="#4ade80" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureTitle}>Accounts Fully Secured</Text>
                  <Text style={styles.featureDesc}>Your point balance, streak, and earnings are completely safe.</Text>
                </View>
              </View>

              <View style={styles.featureRow}>
                <View style={[styles.featureIconWrap, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                  <Zap size={16} color="#f59e0b" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureTitle}>Resuming Soon</Text>
                  <Text style={styles.featureDesc}>Services will automatically reconnect once completed.</Text>
                </View>
              </View>
            </View>

            {/* Check Status / Retry Button */}
            <TouchableOpacity
              style={styles.retryButton}
              activeOpacity={0.85}
              onPress={onRetry}
              disabled={isChecking}
            >
              <LinearGradient
                colors={['#06b6d4', '#2563eb']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.retryGradient}
              >
                {isChecking ? (
                  <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 8 }} />
                ) : (
                  <RefreshCw size={16} color="#ffffff" style={{ marginRight: 8 }} />
                )}
                <Text style={styles.retryButtonText}>
                  {isChecking ? 'Checking Server Status...' : 'Check Server Status'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
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
    alignItems: 'center',
    padding: 20
  },
  modalCard: {
    width: '100%',
    maxWidth: 390,
    backgroundColor: '#0f172a',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    overflow: 'hidden',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 20
  },
  headerGradient: {
    padding: 20,
    paddingTop: 24
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  badgePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.4)'
  },
  badgePillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#fef08a',
    letterSpacing: 0.5
  },
  headerTitle: {
    fontSize: 21,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 6,
    lineHeight: 17
  },
  body: {
    padding: 20
  },
  featureBox: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 12,
    marginBottom: 18
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10
  },
  featureIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  featureTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#f8fafc'
  },
  featureDesc: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 1,
    lineHeight: 15
  },
  retryButton: {
    borderRadius: 14,
    overflow: 'hidden'
  },
  retryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800'
  }
});
