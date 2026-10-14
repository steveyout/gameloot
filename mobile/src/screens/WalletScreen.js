import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator
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
  RefreshCw
} from 'lucide-react-native';
import { getUserProfile } from '../api/clientApi';
import { useTheme } from '../context/ThemeContext';

export default function WalletScreen({
  user,
  token,
  onRefreshUser,
  onCheckUpdate,
  isCheckingUpdate,
  updateInfo
}) {
  const { colors, isDark } = useTheme();
  const [profile, setProfile] = useState(user);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfile = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await getUserProfile(token);
      if (res.success && res.user) {
        setProfile(res.user);
        onRefreshUser(res.user);
      }
    } catch (err) {
      console.warn('Error loading profile:', err.message);
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

  const balance = profile?.points_balance || user?.points_balance || 0;
  const totalEarned = profile?.total_earned || user?.total_earned || 0;
  const totalWithdrawn = profile?.total_withdrawn || user?.total_withdrawn || 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scroll}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Wallet Card */}
      <LinearGradient
        colors={isDark ? ['#0f172a', '#1e293b'] : ['#ffffff', '#f1f5f9']}
        style={[styles.walletCard, { borderColor: colors.border }]}
      >
        <View style={styles.walletHeader}>
          <View style={styles.walletTitleRow}>
            <Wallet size={18} color={colors.primary} />
            <Text style={[styles.walletTitle, { color: colors.text }]}>Loyalty Vault</Text>
          </View>
          <View style={styles.statusPill}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Active Account</Text>
          </View>
        </View>

        <Text style={styles.balanceBig}>{balance.toLocaleString()} PTS</Text>
        <Text style={[styles.balanceUsd, { color: colors.textSecondary }]}>
          Cash Value: ${(balance * 0.001).toFixed(3)} USD (1,000 PTS = $1.00 USD)
        </Text>

        <View style={[styles.statsRow, { borderTopColor: colors.border }]}>
          <View style={styles.statBox}>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Lifetime Earned</Text>
            <Text style={[styles.statVal, { color: colors.text }]}>+{totalEarned.toLocaleString()}</Text>
          </View>

          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

          <View style={styles.statBox}>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Total Withdrawn</Text>
            <Text style={[styles.statVal, { color: colors.text }]}>${Number(totalWithdrawn).toFixed(2)}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* App Build & Version Checker Section */}
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
          <Text style={[styles.verVal, { color: updateInfo?.has_update ? '#fbbf24' : '#10b981' }]}>
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
          style={styles.verCheckBtn}
          onPress={onCheckUpdate}
          disabled={isCheckingUpdate}
          activeOpacity={0.8}
        >
          <RefreshCw size={14} color="#090d16" style={{ marginRight: 6 }} />
          <Text style={styles.verCheckBtnText}>
            {isCheckingUpdate ? 'Checking Server...' : 'Trigger Update Check'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Loyalty Reward Transparency Notice */}
      <View style={[styles.securityCard, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.25)' }]}>
        <ShieldCheck size={20} color="#10b981" />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.securityTitle}>Loyalty Reward Transparency</Text>
          <Text style={[styles.securityDesc, { color: isDark ? '#a7f3d0' : '#065f46' }]}>
            GameLoot provides verified advertising revenue sharing from game sponsorships and rewarded drops. Micro-rewards reflect genuine activity without real-money purchase requirements.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  scroll: {
    padding: 16,
    paddingBottom: 32
  },
  walletCard: {
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    marginBottom: 16
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  walletTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  walletTitle: {
    fontSize: 13,
    fontWeight: '700'
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981'
  },
  statusText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '700'
  },
  balanceBig: {
    color: '#fbbf24',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1
  },
  balanceUsd: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1
  },
  statBox: {
    flex: 1
  },
  statLabel: {
    fontSize: 11
  },
  statVal: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2
  },
  statDivider: {
    width: 1,
    height: 30,
    marginHorizontal: 16
  },
  versionBox: {
    borderRadius: 18,
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
    backgroundColor: '#06b6d4',
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 12
  },
  verCheckBtnText: {
    color: '#090d16',
    fontSize: 12,
    fontWeight: '800'
  },
  securityCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1
  },
  securityTitle: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '800'
  },
  securityDesc: {
    fontSize: 11,
    marginTop: 3,
    lineHeight: 16
  }
});
