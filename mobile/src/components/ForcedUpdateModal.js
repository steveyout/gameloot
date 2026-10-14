import React, { useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  BackHandler,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Sparkles,
  Download,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
  X
} from 'lucide-react-native';

export default function ForcedUpdateModal({
  visible,
  updateInfo,
  onUpdatePress,
  onApkDownloadPress
}) {
  // Prevent Android hardware back button from closing mandatory update modal
  useEffect(() => {
    if (!visible) return;

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Return true to prevent default back behavior
      return true;
    });

    return () => backHandler.remove();
  }, [visible]);

  if (!visible) return null;

  const currentVer = updateInfo?.client_version || '1.0.0';
  const latestVer = updateInfo?.latest_version || '1.1.0';
  const notes = updateInfo?.release_notes || [
    '• Performance enhancements and security fixes',
    '• New games added to library',
    '• Faster wallet payout processing'
  ].join('\n');

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={() => {
        // Blocks modal dismissal on Android
      }}
    >
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          {/* Header Gradient Banner */}
          <LinearGradient
            colors={['#ef4444', '#dc2626', '#991b1b']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <View style={styles.badgeRow}>
              <View style={styles.iconCircle}>
                <AlertTriangle size={26} color="#ffffff" />
              </View>
              <View style={styles.badgePill}>
                <Text style={styles.badgePillText}>ACTION REQUIRED</Text>
              </View>
            </View>

            <Text style={styles.headerTitle}>Update Required</Text>
            <Text style={styles.headerSubtitle}>
              A critical update is necessary to continue earning and redeeming points.
            </Text>
          </LinearGradient>

          {/* Version Comparison Card */}
          <View style={styles.body}>
            <View style={styles.versionBox}>
              <View style={styles.verColumn}>
                <Text style={styles.verLabel}>Installed</Text>
                <Text style={styles.verOldValue}>v{currentVer}</Text>
              </View>

              <View style={styles.arrowIcon}>
                <ArrowRight size={18} color="#64748b" />
              </View>

              <View style={styles.verColumn}>
                <Text style={styles.verLabel}>Latest Release</Text>
                <Text style={styles.verNewValue}>v{latestVer}</Text>
              </View>
            </View>

            {/* Release Notes */}
            <Text style={styles.notesTitle}>What's New in v{latestVer}</Text>
            <View style={styles.notesContainer}>
              <ScrollView
                style={styles.notesScroll}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
              >
                <Text style={styles.notesText}>{notes}</Text>
              </ScrollView>
            </View>

            {/* Anti-cheat disclaimer */}
            <View style={styles.securityBox}>
              <ShieldCheck size={16} color="#06b6d4" />
              <Text style={styles.securityText}>
                Verified official build with active security & payout protection.
              </Text>
            </View>

            {/* Action Buttons */}
            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.85}
              onPress={onUpdatePress}
            >
              <LinearGradient
                colors={['#06b6d4', '#3b82f6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryButtonGradient}
              >
                <ExternalLink size={18} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.primaryButtonText}>Update App Now</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              activeOpacity={0.7}
              onPress={onApkDownloadPress}
            >
              <Download size={16} color="#94a3b8" style={{ marginRight: 6 }} />
              <Text style={styles.secondaryButtonText}>Download Direct APK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Optional Update Non-Blocking Banner
export function OptionalUpdateBanner({
  visible,
  latestVersion,
  onUpdatePress,
  onDismiss
}) {
  if (!visible) return null;

  return (
    <View style={styles.bannerContainer}>
      <LinearGradient
        colors={['#1e293b', '#0f172a']}
        style={styles.bannerGradient}
      >
        <View style={styles.bannerLeft}>
          <Sparkles size={18} color="#06b6d4" style={{ marginRight: 8 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>New Version Available (v{latestVersion})</Text>
            <Text style={styles.bannerSubtitle}>Faster game load times & higher rewards.</Text>
          </View>
        </View>

        <View style={styles.bannerActions}>
          <TouchableOpacity
            style={styles.bannerUpdateButton}
            onPress={onUpdatePress}
            activeOpacity={0.8}
          >
            <Text style={styles.bannerUpdateText}>Update</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bannerCloseButton}
            onPress={onDismiss}
            activeOpacity={0.7}
          >
            <X size={16} color="#94a3b8" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 15, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalCard: {
    width: '100%',
    maxWidth: 390,
    backgroundColor: '#0f172a',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    overflow: 'hidden',
    shadowColor: '#ef4444',
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
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  badgePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.35)'
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fee2e2',
    letterSpacing: 0.5
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 4,
    lineHeight: 17
  },
  body: {
    padding: 20
  },
  versionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16
  },
  verColumn: {
    flex: 1,
    alignItems: 'center'
  },
  verLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 2
  },
  verOldValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f87171'
  },
  verNewValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4ade80'
  },
  arrowIcon: {
    paddingHorizontal: 8
  },
  notesTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#cbd5e1',
    marginBottom: 6
  },
  notesContainer: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 12,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#1f2937',
    marginBottom: 14
  },
  notesScroll: {
    maxHeight: 100
  },
  notesText: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 18
  },
  securityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.25)',
    marginBottom: 18
  },
  securityText: {
    fontSize: 11,
    color: '#67e8f9',
    flex: 1,
    lineHeight: 15
  },
  primaryButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 10
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700'
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155'
  },
  secondaryButtonText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600'
  },
  // Optional Banner Styles
  bannerContainer: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 36 : 48,
    left: 12,
    right: 12,
    zIndex: 9999,
    shadowColor: '#06b6d4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10
  },
  bannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.4)'
  },
  bannerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center'
  },
  bannerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff'
  },
  bannerSubtitle: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 1
  },
  bannerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8
  },
  bannerUpdateButton: {
    backgroundColor: '#06b6d4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8
  },
  bannerUpdateText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#090d16'
  },
  bannerCloseButton: {
    padding: 4
  }
});
