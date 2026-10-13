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

export default function WalletScreen({
  user,
  token,
  onRefreshUser,
  onCheckUpdate,
  isCheckingUpdate,
  updateInfo
}) {
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
      style={styles.container}
      contentContainerStyle={styles.scroll}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#06b6d4" />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Wallet Card */}
      <LinearGradient
        colors={['#0f172a', '#1e293b']}
        style={styles.walletCard}
      >
        <View style={styles.walletHeader}>
          <View style={styles.walletTitleRow}>
            <Wallet size={18} color="#06b6d4" />
            <Text style={styles.walletTitle}>Loyalty Vault</Text>
          </View>
          <View style={styles.statusPill}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Active Account</Text>
          </View>
        </View>

        <Text style={styles.balanceBig}>{balance.toLocaleString()} PTS</Text>
        <Text style={styles.balanceUsd}>
          Cash Value: ${(balance * 0.001).toFixed(3)} USD (1,000 PTS = $1.00 USD)
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Lifetime Earned</Text>
            <Text style={styles.statVal}>+{totalEarned.toLocaleString()}</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Total Withdrawn</Text>
            <Text style={styles.statVal}>${Number(totalWithdrawn).toFixed(2)}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* App Build & Version Checker Section */}
      <View style={styles.versionBox}>
        <View style={styles.verHeader}>
          <Smartphone size={16} color="#06b6d4" />
          <Text style={styles.verTitle}>Client Build & Update System</Text>
        </View>

        <View style={styles.verRow}>
          <Text style={styles.verKey}>Current Client Version:</Text>
          <Text style={styles.verVal}>v{updateInfo?.client_version || '1.0.0'}</Text>
        </View>
        <View style={styles.verRow}>
          <Text style={styles.verKey}>Latest Release Target:</Text>
          <Text style={[styles.verVal, { color: updateInfo?.has_update ? '#fbbf24' : '#4ade80' }]}>
            v{updateInfo?.latest_version || '1.1.0'} {updateInfo?.has_update ? '(New Version)' : '(Latest)'}
          </Text>
        </View>
        <View style={styles.verRow}>
          <Text style={styles.verKey}>Forced Update Policy:</Text>
          <Text style={[styles.verVal, { color: updateInfo?.force_update ? '#f87171' : '#94a3b8' }]}>
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
      <View style={styles.securityCard}>
        <ShieldCheck size={20} color="#10b981" />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.securityTitle}>Loyalty Reward Transparency</Text>
          <Text style={styles.securityDesc}>
            GameLoot provides verified advertising revenue sharing from HTML5 game sponsorships and rewarded drops. Micro-rewards reflect genuine activity without real-money purchase requirements.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16'
  },
  scroll: {
    padding: 16,
    paddingBottom: 32
  },
  walletCard: {
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
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
    color: '#cbd5e1',
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
    color: '#6ee7b7',
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
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155'
  },
  statBox: {
    flex: 1
  },
  statLabel: {
    color: '#64748b',
    fontSize: 11
  },
  statVal: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#334155',
    marginHorizontal: 16
  },
  versionBox: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 16
  },
  verHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b'
  },
  verTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800'
  },
  verRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4
  },
  verKey: {
    color: '#94a3b8',
    fontSize: 12
  },
  verVal: {
    color: '#ffffff',
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
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)'
  },
  securityTitle: {
    color: '#6ee7b7',
    fontSize: 12,
    fontWeight: '800'
  },
  securityDesc: {
    color: '#a7f3d0',
    fontSize: 11,
    marginTop: 3,
    lineHeight: 16
  }
});
