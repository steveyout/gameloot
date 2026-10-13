import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Brain,
  Globe,
  ClipboardList,
  Tv,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Flame,
  Disc,
  Zap,
  HelpCircle
} from 'lucide-react-native';
import { getQuizzes, getSurfTasks, getSurveys } from '../api/clientApi';
import AnimatedCard from '../components/AnimatedCard';
import { playSound, triggerHaptic } from '../services/soundEffects';
import { useTheme } from '../context/ThemeContext';

export default function EarnHubScreen({
  onSelectQuiz,
  onSelectSurf,
  onSelectSurvey,
  onOpenAdReward,
  onOpenDailyStreak,
  onOpenLuckyWheel
}) {
  const { colors, isDark } = useTheme();
  const [quizzes, setQuizzes] = useState([]);
  const [surfTasks, setSurfTasks] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadEarnData = async () => {
    try {
      setLoading(true);
      const [qRes, sRes, surRes] = await Promise.all([
        getQuizzes(),
        getSurfTasks(),
        getSurveys()
      ]);
      if (qRes.success) setQuizzes(qRes.quizzes || []);
      if (sRes.success) setSurfTasks(sRes.surfTasks || []);
      if (surRes.success) setSurveys(surRes.surveys || []);
    } catch (err) {
      console.warn('Error loading earn hub:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadEarnData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadEarnData();
  };

  const handleStreakPress = () => {
    playSound('coin');
    triggerHaptic('light');
    if (onOpenDailyStreak) onOpenDailyStreak();
  };

  const handleWheelPress = () => {
    playSound('spin');
    triggerHaptic('light');
    if (onOpenLuckyWheel) onOpenLuckyWheel();
  };

  const handleAdRewardPress = () => {
    playSound('chestOpen');
    triggerHaptic('medium');
    if (onOpenAdReward) onOpenAdReward();
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scroll}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Daily Retentive Bonuses: Streak & Wheel (Enhanced vertical cards that never truncate or squish) */}
      <View style={styles.retentionRow}>
        <AnimatedCard
          style={styles.retentionCardWrapper}
          onPress={handleStreakPress}
        >
          <LinearGradient
            colors={['#ea580c', '#991b1b', '#450a0a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.retentionCard}
          >
            <View style={styles.retentionTopRow}>
              <View style={styles.retentionIconWrap}>
                <Flame size={20} color="#ffffff" />
              </View>
              <View style={styles.retentionBadge}>
                <Text style={styles.retentionBadgeText}>STREAK</Text>
              </View>
            </View>

            <View style={styles.retentionContent}>
              <Text style={styles.retentionTitle}>Daily Streak</Text>
              <Text style={styles.retentionSub}>Collect Day Bonus 🔥</Text>
            </View>

            <View style={styles.retentionActionRow}>
              <Text style={styles.retentionActionText}>Check In</Text>
              <Zap size={12} color="#fef08a" />
            </View>
          </LinearGradient>
        </AnimatedCard>

        <AnimatedCard
          style={styles.retentionCardWrapper}
          onPress={handleWheelPress}
        >
          <LinearGradient
            colors={['#7c3aed', '#4338ca', '#1e1b4b']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.retentionCard}
          >
            <View style={styles.retentionTopRow}>
              <View style={[styles.retentionIconWrap, { backgroundColor: 'rgba(192, 132, 252, 0.3)' }]}>
                <Disc size={20} color="#e9d5ff" />
              </View>
              <View style={[styles.retentionBadge, { backgroundColor: 'rgba(168, 85, 247, 0.4)' }]}>
                <Text style={styles.retentionBadgeText}>JACKPOT</Text>
              </View>
            </View>

            <View style={styles.retentionContent}>
              <Text style={styles.retentionTitle}>Lucky Wheel</Text>
              <Text style={styles.retentionSub}>Win 500 PTS 🎡</Text>
            </View>

            <View style={styles.retentionActionRow}>
              <Text style={styles.retentionActionText}>Spin Free</Text>
              <Sparkles size={12} color="#e9d5ff" />
            </View>
          </LinearGradient>
        </AnimatedCard>
      </View>

      {/* Featured Sponsored Video Drop Card */}
      <AnimatedCard
        style={styles.adHeroWrapper}
        onPress={handleAdRewardPress}
      >
        <LinearGradient
          colors={['#312e81', '#1e1b4b', isDark ? '#0f172a' : '#1e1b4b']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.adHeroCard}
        >
          <View style={styles.adHeroTop}>
            <View style={styles.adHeroBadge}>
              <Tv size={13} color="#ffffff" />
              <Text style={styles.adHeroBadgeText}>SPONSORED VIDEO DROP</Text>
            </View>

            <View style={styles.ptsPill}>
              <Sparkles size={12} color="#fbbf24" />
              <Text style={styles.ptsPillText}>+3 PTS ($0.003)</Text>
            </View>
          </View>

          <Text style={styles.adHeroTitle}>Watch Sponsored Video</Text>
          <Text style={styles.adHeroSub}>
            Watch a quick 15-second sponsor video to earn instant loyalty points. Backed by verified advertiser impressions.
          </Text>

          <View style={styles.adHeroFooter}>
            <Text style={styles.adPolicyNote}>• 90s cooldown between reward drops</Text>
            <LinearGradient
              colors={['#06b6d4', '#2563eb']}
              style={styles.watchBtn}
            >
              <Text style={styles.watchBtnText}>Watch Now</Text>
              <ArrowRight size={13} color="#ffffff" />
            </LinearGradient>
          </View>
        </LinearGradient>
      </AnimatedCard>

      {/* Quizzes & Trivia */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Brain size={18} color="#a855f7" />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Trivia Quizzes</Text>
        </View>
        <Text style={[styles.sectionSub, { color: colors.textMuted }]}>Answer 3 questions</Text>
      </View>

      <View style={styles.taskList}>
        {quizzes.map((quiz) => (
          <AnimatedCard
            key={quiz.id}
            style={styles.taskWrapper}
            onPress={() => {
              triggerHaptic('light');
              onSelectQuiz(quiz);
            }}
          >
            <View style={[styles.taskCard, { backgroundColor: colors.surfaceCard, borderColor: isDark ? '#581c87' : colors.border }]}>
              <View style={styles.taskLeft}>
                <LinearGradient
                  colors={['#9333ea', '#6b21a8']}
                  style={styles.taskIconCircle}
                >
                  <Brain size={20} color="#ffffff" />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.taskTitle, { color: colors.text }]}>{quiz.title}</Text>
                  <View style={styles.metaRow}>
                    <Clock size={11} color={colors.textSecondary} />
                    <Text style={[styles.taskMeta, { color: colors.textSecondary }]}>
                      {quiz.category} • {quiz.time_limit_seconds || 60}s timer
                    </Text>
                  </View>
                </View>
              </View>

              <LinearGradient
                colors={['rgba(168, 85, 247, 0.25)', 'rgba(126, 34, 206, 0.25)']}
                style={[styles.taskRewardBadge, { borderColor: '#a855f7' }]}
              >
                <Sparkles size={11} color="#c084fc" />
                <Text style={[styles.taskRewardText, { color: isDark ? '#e9d5ff' : '#7e22ce' }]}>
                  +{quiz.reward_points} PTS
                </Text>
              </LinearGradient>
            </View>
          </AnimatedCard>
        ))}
      </View>

      {/* Web Surfing Tasks */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Globe size={18} color="#06b6d4" />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Web Surfing Tasks</Text>
        </View>
        <Text style={[styles.sectionSub, { color: colors.textMuted }]}>Browse for 30s</Text>
      </View>

      <View style={styles.taskList}>
        {surfTasks.map((surf) => (
          <AnimatedCard
            key={surf.id}
            style={styles.taskWrapper}
            onPress={() => {
              triggerHaptic('light');
              onSelectSurf(surf);
            }}
          >
            <View style={[styles.taskCard, { backgroundColor: colors.surfaceCard, borderColor: isDark ? '#0e7490' : colors.border }]}>
              <View style={styles.taskLeft}>
                <LinearGradient
                  colors={['#06b6d4', '#0284c7']}
                  style={styles.taskIconCircle}
                >
                  <Globe size={20} color="#ffffff" />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.taskTitle, { color: colors.text }]}>{surf.title}</Text>
                  <View style={styles.metaRow}>
                    <Clock size={11} color={colors.textSecondary} />
                    <Text style={[styles.taskMeta, { color: colors.textSecondary }]}>
                      Browse sponsor page for {surf.duration_seconds || 30}s
                    </Text>
                  </View>
                </View>
              </View>

              <LinearGradient
                colors={['rgba(6, 182, 212, 0.25)', 'rgba(2, 132, 199, 0.25)']}
                style={[styles.taskRewardBadge, { borderColor: '#06b6d4' }]}
              >
                <Sparkles size={11} color="#38bdf8" />
                <Text style={[styles.taskRewardText, { color: isDark ? '#bae6fd' : '#0284c7' }]}>
                  +{surf.reward_points} PTS
                </Text>
              </LinearGradient>
            </View>
          </AnimatedCard>
        ))}
      </View>

      {/* Market Research Surveys */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <ClipboardList size={18} color="#f59e0b" />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Sponsored Surveys</Text>
        </View>
        <Text style={[styles.sectionSub, { color: colors.textMuted }]}>Higher payout pool</Text>
      </View>

      <View style={styles.taskList}>
        {surveys.map((survey) => (
          <AnimatedCard
            key={survey.id}
            style={styles.taskWrapper}
            onPress={() => {
              triggerHaptic('light');
              onSelectSurvey(survey);
            }}
          >
            <View style={[styles.taskCard, { backgroundColor: colors.surfaceCard, borderColor: isDark ? '#b45309' : colors.border }]}>
              <View style={styles.taskLeft}>
                <LinearGradient
                  colors={['#f59e0b', '#d97706']}
                  style={styles.taskIconCircle}
                >
                  <ClipboardList size={20} color="#ffffff" />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.taskTitle, { color: colors.text }]}>{survey.title}</Text>
                  <View style={styles.metaRow}>
                    <Clock size={11} color={colors.textSecondary} />
                    <Text style={[styles.taskMeta, { color: colors.textSecondary }]}>
                      {survey.provider || 'Research Partner'} • ~{survey.estimated_minutes || 2} min
                    </Text>
                  </View>
                </View>
              </View>

              <LinearGradient
                colors={['rgba(245, 158, 11, 0.25)', 'rgba(217, 119, 6, 0.25)']}
                style={[styles.taskRewardBadge, { borderColor: '#f59e0b' }]}
              >
                <Sparkles size={11} color="#fbbf24" />
                <Text style={[styles.taskRewardText, { color: isDark ? '#fef3c7' : '#b45309' }]}>
                  +{survey.reward_points} PTS
                </Text>
              </LinearGradient>
            </View>
          </AnimatedCard>
        ))}
      </View>

      {/* Fair Play Reward Transparency Box */}
      <View style={[styles.transparencyCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
        <ShieldCheck size={20} color="#10b981" />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.transparencyTitle}>Sponsor-Funded Economics</Text>
          <Text style={[styles.transparencyDesc, { color: colors.textSecondary }]}>
            All points awarded are backed by verified advertiser ad impressions. We operate a sustainable loyalty revenue share so all cashouts are 100% honored and prompt.
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
    paddingBottom: 40
  },
  retentionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16
  },
  retentionCardWrapper: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6
  },
  retentionCard: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'space-between',
    minHeight: 122
  },
  retentionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  retentionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  retentionBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.35)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)'
  },
  retentionBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  retentionContent: {
    marginTop: 8
  },
  retentionTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: -0.2
  },
  retentionSub: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2
  },
  retentionActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8
  },
  retentionActionText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800'
  },
  adHeroWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 22,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6
  },
  adHeroCard: {
    padding: 18,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#4338ca'
  },
  adHeroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  adHeroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  adHeroBadgeText: {
    color: '#ffffff',
    fontSize: 9.5,
    fontWeight: '800'
  },
  ptsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)'
  },
  ptsPillText: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '800'
  },
  adHeroTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3
  },
  adHeroSub: {
    color: '#cbd5e1',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 17
  },
  adHeroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)'
  },
  adPolicyNote: {
    color: '#94a3b8',
    fontSize: 10,
    flex: 1,
    marginRight: 10
  },
  watchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10
  },
  watchBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800'
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 6
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7
  },
  sectionTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    letterSpacing: -0.2
  },
  sectionSub: {
    fontSize: 11,
    fontWeight: '600'
  },
  taskList: {
    gap: 10,
    marginBottom: 20
  },
  taskWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.2
  },
  taskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 10
  },
  taskIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  taskTitle: {
    fontSize: 13.5,
    fontWeight: '800'
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2
  },
  taskMeta: {
    fontSize: 11
  },
  taskRewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1.2
  },
  taskRewardText: {
    fontSize: 12,
    fontWeight: '900'
  },
  transparencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 10
  },
  transparencyTitle: {
    color: '#10b981',
    fontSize: 12.5,
    fontWeight: '800',
    marginBottom: 2
  },
  transparencyDesc: {
    fontSize: 10.5,
    lineHeight: 15
  }
});
