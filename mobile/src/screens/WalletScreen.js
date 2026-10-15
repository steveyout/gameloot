import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  ActivityIndicator,
  Linking,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Wallet,
  Sparkles,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Smartphone,
  RefreshCw,
  User,
  Trophy,
  Gamepad2,
  Flame,
  Shield,
  FileText,
  LogOut,
  Trash2
} from 'lucide-react-native';
import { getUserProfile } from '../api/clientApi';
import { useTheme } from '../context/ThemeContext';
import LegalModal from '../components/LegalModal';

export default function WalletScreen({
  user,
  token,
  payoutsEnabled = false,
  onRefreshUser,
  onCheckUpdate,
  isCheckingUpdate,
  updateInfo,
  onLogout
}) {
  const { colors, isDark } = useTheme();
  const [profile, setProfile] = useState(user);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [legalModalVisible, setLegalModalVisible] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState('privacy');

  const fetchProfile = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await getUserProfile(token);
      if (res.success && res.user) {
        setProfile(res.user);
        if (onRefreshUser) onRefreshUser(res.user);
      }
    } catch (e) {
      console.warn('Failed to refresh profile:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfile();
  };

  const handleOpenLegal = (tab) => {
    setLegalModalTab(tab);
    setLegalModalVisible(true);
  };

  const balance = profile?.points_balance || user?.points_balance || 0;
  const cashUsd = (balance * 0.001).toFixed(2);
  const playerRankTier = balance >= 5000 ? 'Master' : balance >= 2000 ? 'Diamond' : balance >= 500 ? 'Gold' : 'Arcade Rookie';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scroll}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Dynamic Profile or Wallet Card - Styled with high-contrast, crystal-clear typography */}
      {payoutsEnabled ? (
        <LinearGradient
          colors={['#1c2242', '#121528']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.balanceCard, { borderColor: '#2e386b' }]}
        >
          <View style={styles.cardTopRow}>
            <View>
              <Text style={styles.cardSub}>LOYALTY VAULT</Text>
              <Text style={styles.balanceBig}>{balance.toLocaleString()} PTS</Text>
              <Text style={styles.balanceUsd}>
                Available Cash Value: <Text style={{ color: '#34d399', fontWeight: '800' }}>${cashUsd} USD</Text>
              </Text>
            </View>
            <View style={styles.vaultIconBadge}>
              <Wallet size={24} color="#93c5fd" />
            </View>
          </View>
        </LinearGradient>
      ) : (
        <LinearGradient
          colors={['#1c2242', '#121528']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.balanceCard, { borderColor: '#2e386b' }]}
        >
          <View style={styles.profileHeaderRow}>
            <Image
              source={{ uri: profile?.avatar || user?.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=gameloot' }}
              style={styles.profileAvatar}
            />
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.profileUsername}>
                {profile?.username || user?.username || 'Player'}
              </Text>
              <Text style={styles.profileEmail}>
                {profile?.email || user?.email || 'Registered Player'}
              </Text>
              <View style={styles.rankTag}>
                <Trophy size={11} color="#93c5fd" />
                <Text style={styles.rankTagText}>{playerRankTier}</Text>
              </View>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Total Score</Text>
              <Text style={[styles.statVal, { color: '#fbbf24' }]}>{balance.toLocaleString()} PTS</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Player Status</Text>
              <Text style={[styles.statVal, { color: '#34d399' }]}>Active</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Level</Text>
              <Text style={[styles.statVal, { color: '#60a5fa' }]}>Lv. {Math.floor(balance / 100) + 1}</Text>
            </View>
          </View>
        </LinearGradient>
      )}

      {/* App Build & Version Checker Section - Learning OS styling */}
      <View style={[styles.versionBox, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
        <View style={[styles.verHeader, { borderBottomColor: colors.border }]}>
          <Smartphone size={16} color={colors.primary} />
          <Text style={[styles.verTitle, { color: colors.text }]}>Client Build & Update System</Text>
        </View>

        <View style={styles.verRow}>
          <Text style={[styles.verKey, { color: colors.textSecondary }]}>Current Client Version:</Text>
          <Text style={[styles.verVal, { color: colors.text }]}>v{updateInfo?.client_version || '1.0.0'}</Text>
        </View>
        <View style={styles.verRow}>
          <Text style={[styles.verKey, { color: colors.textSecondary }]}>Latest Release Target:</Text>
          <Text style={[styles.verVal, { color: updateInfo?.has_update ? colors.gold : '#10b981' }]}>
            v{updateInfo?.latest_version || '1.1.0'} {updateInfo?.has_update ? '(New Version)' : '(Latest)'}
          </Text>
        </View>
        <View style={styles.verRow}>
          <Text style={[styles.verKey, { color: colors.textSecondary }]}>Forced Update Policy:</Text>
          <Text style={[styles.verVal, { color: updateInfo?.force_update ? '#ef4444' : colors.textSecondary }]}>
            {updateInfo?.force_update ? 'Active (Forced On Outdated)' : 'Optional'}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.verCheckBtn, { backgroundColor: colors.primary }]}
          onPress={onCheckUpdate}
          disabled={isCheckingUpdate}
          activeOpacity={0.8}
        >
          <RefreshCw size={14} color="#ffffff" style={{ marginRight: 6 }} />
          <Text style={styles.verCheckBtnText}>
            {isCheckingUpdate ? 'Checking Server...' : 'Trigger Update Check'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Quick Legal & Policies Buttons */}
      <View style={[styles.legalCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
        <TouchableOpacity
          style={styles.legalBtn}
          onPress={() => handleOpenLegal('privacy')}
          activeOpacity={0.7}
        >
          <Shield size={16} color={colors.primary} />
          <Text style={[styles.legalBtnText, { color: colors.text }]}>Privacy Policy</Text>
          <Text style={[styles.legalBtnArrow, { color: colors.textMuted }]}>→</Text>
        </TouchableOpacity>

        <View style={[styles.legalDivider, { backgroundColor: colors.border }]} />

        <TouchableOpacity
          style={styles.legalBtn}
          onPress={() => handleOpenLegal('terms')}
          activeOpacity={0.7}
        >
          <FileText size={16} color={colors.primary} />
          <Text style={[styles.legalBtnText, { color: colors.text }]}>Terms of Service</Text>
          <Text style={[styles.legalBtnArrow, { color: colors.textMuted }]}>→</Text>
        </TouchableOpacity>

        <View style={[styles.legalDivider, { backgroundColor: colors.border }]} />

        <TouchableOpacity
          style={styles.legalBtn}
          onPress={() => {
            Alert.alert(
              'Delete Account & Data',
              'In compliance with Google Play Developer policies, you can request permanent deletion of your account and associated personal data via our public web portal.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Open Deletion Form',
                  style: 'destructive',
                  onPress: () => Linking.openURL('https://gameloot.youplex.cc/delete-account').catch(() => {})
                }
              ]
            );
          }}
          activeOpacity={0.7}
        >
          <Trash2 size={16} color="#ef4444" />
          <Text style={[styles.legalBtnText, { color: '#ef4444' }]}>Delete Account & Data</Text>
          <Text style={[styles.legalBtnArrow, { color: colors.textMuted }]}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      {user ? (
        <TouchableOpacity
          style={[styles.logoutBtn, { borderColor: 'rgba(239, 68, 68, 0.3)' }]}
          onPress={onLogout}
          activeOpacity={0.8}
        >
          <LogOut size={16} color="#ef4444" style={{ marginRight: 8 }} />
          <Text style={styles.logoutBtnText}>Sign Out of GameLoot</Text>
        </TouchableOpacity>
      ) : null}

      {/* Legal Modal Component */}
      <LegalModal
        visible={legalModalVisible}
        initialTab={legalModalTab}
        onClose={() => setLegalModalVisible(false)}
        isDark={isDark}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  scroll: {
    padding: 16,
    paddingBottom: 40
  },
  balanceCard: {
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#517bfd',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  cardSub: {
    color: '#93c5fd',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 4
  },
  vaultIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(81, 123, 253, 0.22)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  balanceBig: {
    color: '#fbbf24',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5
  },
  balanceUsd: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 3
  },
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  profileAvatar: {
    width: 58,
    height: 58,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(81, 123, 253, 0.4)'
  },
  profileUsername: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2
  },
  profileEmail: {
    color: '#cbd5e1',
    fontSize: 11.5,
    marginTop: 2
  },
  rankTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(81, 123, 253, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 6
  },
  rankTagText: {
    color: '#93c5fd',
    fontSize: 10,
    fontWeight: '800'
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)'
  },
  statBox: {
    flex: 1
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: 10.5,
    fontWeight: '600'
  },
  statVal: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    marginHorizontal: 12
  },
  versionBox: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16
  },
  verHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1
  },
  verTitle: {
    fontSize: 13,
    fontWeight: '800'
  },
  verRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4
  },
  verKey: {
    fontSize: 12
  },
  verVal: {
    fontSize: 12,
    fontWeight: '700'
  },
  verCheckBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 10,
    marginTop: 12
  },
  verCheckBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800'
  },
  legalCard: {
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden'
  },
  legalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12
  },
  legalBtnText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700'
  },
  legalBtnArrow: {
    fontSize: 14,
    fontWeight: '700'
  },
  legalDivider: {
    height: 1,
    width: '100%'
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: 'rgba(239, 68, 68, 0.08)'
  },
  logoutBtnText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '800'
  }
});
