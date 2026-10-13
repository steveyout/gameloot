import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Gift, Sparkles, CheckCircle2, X, AlertCircle, ShieldCheck, ArrowRight, Wallet } from 'lucide-react-native';
import { getRewards, redeemReward } from '../api/clientApi';
import AnimatedCard from '../components/AnimatedCard';
import { useTheme } from '../context/ThemeContext';

export default function RewardsScreen({ user, token, onRedemptionSuccess, onErrorAlert }) {
  const { colors, isDark } = useTheme();
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);
  const [payoutDetails, setPayoutDetails] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  const loadRewards = async () => {
    try {
      setLoading(true);
      const res = await getRewards();
      if (res.success) {
        setRewards(res.rewards || []);
      }
    } catch (err) {
      console.warn('Error loading rewards:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRewards();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadRewards();
  };

  const handleOpenRedeem = (item) => {
    if ((user?.points_balance || 0) < item.cost_points) {
      onErrorAlert(`Insufficient points. You need ${item.cost_points.toLocaleString()} PTS (Balance: ${(user?.points_balance || 0).toLocaleString()} PTS)`);
      return;
    }
    setSelectedReward(item);
    setPayoutDetails(user?.email || '');
  };

  const handleConfirmRedeem = async () => {
    if (!payoutDetails.trim()) {
      onErrorAlert('Please provide your payout account details');
      return;
    }

    try {
      setRedeeming(true);
      const res = await redeemReward(token, selectedReward.id, payoutDetails.trim());
      if (res.success) {
        setSelectedReward(null);
        setPayoutDetails('');
        onRedemptionSuccess({
          rewardTitle: selectedReward.title,
          cashUsd: selectedReward.cash_value_usd,
          newBalance: res.new_balance
        });
      } else {
        onErrorAlert(res.message || 'Cashout request failed');
      }
    } catch (err) {
      onErrorAlert(err.message || 'Network error');
    } finally {
      setRedeeming(false);
    }
  };

  const userBalance = user?.points_balance || 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scroll}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Balance Summary Header with Glowing Border */}
      <LinearGradient
        colors={isDark ? ['#1e293b', '#0f172a', '#090d16'] : ['#e2e8f0', '#f1f5f9', '#ffffff']}
        style={[styles.summaryCard, { borderColor: colors.border }]}
      >
        <View style={styles.summaryLeft}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Available for Cashout</Text>
          <Text style={styles.summaryPoints}>{userBalance.toLocaleString()} PTS</Text>
          <Text style={styles.summaryUsd}>≈ ${(userBalance * 0.001).toFixed(2)} USD</Text>
        </View>

        <View style={styles.thresholdBadge}>
          <ShieldCheck size={14} color="#10b981" />
          <Text style={styles.thresholdText}>Min: 1,000 PTS ($1.00)</Text>
        </View>
      </LinearGradient>

      {/* Reward Catalog Section */}
      <View style={styles.sectionHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Gift size={18} color="#f59e0b" />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Cashout Method</Text>
        </View>
        <Text style={[styles.sectionSub, { color: colors.textMuted }]}>Honored within 24h</Text>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Syncing rewards catalog...</Text>
        </View>
      ) : (
        <View style={styles.rewardGrid}>
          {rewards.map((item) => {
            const canAfford = userBalance >= item.cost_points;
            const progress = Math.min(1, Math.max(0, userBalance / item.cost_points));
            const pct = Math.round(progress * 100);

            return (
              <AnimatedCard
                key={item.id}
                style={styles.rewardWrapper}
                onPress={() => handleOpenRedeem(item)}
              >
                <View style={[
                  styles.rewardCard,
                  { backgroundColor: colors.surfaceCard, borderColor: colors.border },
                  canAfford && styles.rewardCardAffordable
                ]}>
                  <View style={styles.rewardHeader}>
                    <Image
                      source={{ uri: item.icon_url }}
                      style={styles.rewardIcon}
                      resizeMode="contain"
                    />
                    <LinearGradient
                      colors={canAfford ? ['#10b981', '#059669'] : ['#334155', '#1e293b']}
                      style={styles.cashBadge}
                    >
                      <Text style={styles.cashBadgeText}>${Number(item.cash_value_usd).toFixed(2)} USD</Text>
                    </LinearGradient>
                  </View>

                  <Text style={[styles.rewardTitle, { color: colors.text }]}>{item.title}</Text>
                  <Text style={[styles.rewardDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                    {item.description}
                  </Text>

                  {/* Progress towards target */}
                  <View style={styles.progressContainer}>
                    <View style={[styles.progressBarBg, { backgroundColor: colors.surfaceSubtle }]}>
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            width: `${pct}%`,
                            backgroundColor: canAfford ? '#10b981' : colors.primary
                          }
                        ]}
                      />
                    </View>
                    <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                      {canAfford ? '✓ Ready to Claim!' : `${pct}% (${(item.cost_points - userBalance).toLocaleString()} PTS needed)`}
                    </Text>
                  </View>

                  <View style={[styles.rewardFooter, { borderTopColor: colors.border }]}>
                    <View style={styles.costBadge}>
                      <Sparkles size={12} color="#fbbf24" />
                      <Text style={styles.costText}>{item.cost_points.toLocaleString()} PTS</Text>
                    </View>

                    {canAfford ? (
                      <LinearGradient
                        colors={['#10b981', '#059669']}
                        style={styles.redeemBtnActive}
                      >
                        <Text style={styles.redeemBtnTextActive}>Claim Cashout</Text>
                        <ArrowRight size={12} color="#ffffff" />
                      </LinearGradient>
                    ) : (
                      <View style={[styles.redeemBtnDisabled, { backgroundColor: colors.surfaceSubtle }]}>
                        <Text style={[styles.redeemBtnTextDisabled, { color: colors.textMuted }]}>Need PTS</Text>
                      </View>
                    )}
                  </View>
                </View>
              </AnimatedCard>
            );
          })}
        </View>
      )}

      {/* Redemption Dialog Modal */}
      {selectedReward ? (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSelectedReward(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalCard, { backgroundColor: colors.surfaceCard, borderColor: colors.borderStrong }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Confirm Redemption</Text>
                <TouchableOpacity onPress={() => setSelectedReward(null)} style={styles.modalClose}>
                  <X size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={[styles.modalItemBox, { backgroundColor: colors.surfaceSubtle }]}>
                <Image source={{ uri: selectedReward.icon_url }} style={styles.modalIcon} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.modalItemTitle, { color: colors.text }]}>{selectedReward.title}</Text>
                  <Text style={styles.modalItemCost}>
                    Cost: {selectedReward.cost_points.toLocaleString()} PTS (${Number(selectedReward.cash_value_usd).toFixed(2)} USD)
                  </Text>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  {selectedReward.type === 'crypto'
                    ? 'BEP20 or Polygon Wallet Address'
                    : 'Recipient PayPal / Email Address'}
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border, color: colors.text }]}
                  placeholder="e.g. user@paypal.com or 0x..."
                  placeholderTextColor={colors.textMuted}
                  value={payoutDetails}
                  onChangeText={setPayoutDetails}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.noticeBox}>
                <CheckCircle2 size={14} color="#10b981" />
                <Text style={styles.noticeText}>
                  Instant admin approval queue. Processed within 24 hours.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleConfirmRedeem}
                disabled={redeeming}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#06b6d4', '#2563eb']}
                  style={styles.confirmGradient}
                >
                  {redeeming ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.confirmText}>Confirm Cashout Request</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      ) : null}
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
  summaryCard: {
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5
  },
  summaryLeft: {
    flex: 1
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600'
  },
  summaryPoints: {
    color: '#fbbf24',
    fontSize: 26,
    fontWeight: '900',
    marginTop: 2
  },
  summaryUsd: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2
  },
  thresholdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)'
  },
  thresholdText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '700'
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800'
  },
  sectionSub: {
    fontSize: 11,
    fontWeight: '600'
  },
  loadingBox: {
    padding: 30,
    alignItems: 'center'
  },
  loadingText: {
    fontSize: 12,
    marginTop: 8
  },
  rewardGrid: {
    gap: 12
  },
  rewardWrapper: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4
  },
  rewardCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5
  },
  rewardCardAffordable: {
    borderColor: 'rgba(16, 185, 129, 0.4)'
  },
  rewardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  rewardIcon: {
    width: 38,
    height: 38
  },
  cashBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  cashBadgeText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '900'
  },
  rewardTitle: {
    fontSize: 15,
    fontWeight: '800'
  },
  rewardDesc: {
    fontSize: 11.5,
    marginTop: 3,
    lineHeight: 16
  },
  progressContainer: {
    marginTop: 10,
    gap: 4
  },
  progressBarBg: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2
  },
  progressText: {
    fontSize: 10,
    fontWeight: '600'
  },
  rewardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1
  },
  costBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  costText: {
    color: '#fbbf24',
    fontSize: 12.5,
    fontWeight: '900'
  },
  redeemBtnActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 3
  },
  redeemBtnTextActive: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900'
  },
  redeemBtnDisabled: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10
  },
  redeemBtnTextDisabled: {
    fontSize: 11.5,
    fontWeight: '700'
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 15, 0.75)',
    justifyContent: 'center',
    padding: 20
  },
  modalCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800'
  },
  modalClose: {
    padding: 4
  },
  modalItemBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    marginBottom: 16
  },
  modalIcon: {
    width: 36,
    height: 36
  },
  modalItemTitle: {
    fontSize: 14,
    fontWeight: '800'
  },
  modalItemCost: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2
  },
  inputGroup: {
    marginBottom: 14
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6
  },
  input: {
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    borderWidth: 1
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: 10,
    borderRadius: 10,
    marginBottom: 16
  },
  noticeText: {
    color: '#10b981',
    fontSize: 11,
    flex: 1
  },
  confirmBtn: {
    borderRadius: 12,
    overflow: 'hidden'
  },
  confirmGradient: {
    paddingVertical: 14,
    alignItems: 'center'
  },
  confirmText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800'
  }
});
