import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Sparkles,
  Gamepad2,
  Play,
  Star,
  Flame,
  Gift,
  RefreshCw,
  Users,
  Disc,
  Trophy,
  Zap,
  RotateCcw,
  ChevronRight,
  Award
} from 'lucide-react-native';
import { getGames } from '../api/clientApi';
import AnimatedCard from '../components/AnimatedCard';
import { useTheme } from '../context/ThemeContext';
import { SkeletonGameList } from '../components/SkeletonLoader';

const RECENT_GAMES_STORAGE_KEY = '@gameloot_recent_games';

export default function LobbyScreen({
  onSelectGame,
  onOpenAdReward,
  onOpenDailyStreak,
  onOpenLuckyWheel,
  onCheckUpdate,
  isCheckingUpdate,
  updateInfo,
  payoutsEnabled = false
}) {
  const { colors, isDark } = useTheme();
  const [games, setGames] = useState([]);
  const [recentGames, setRecentGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [gamesRes, storedRecent] = await Promise.all([
        getGames(),
        AsyncStorage.getItem(RECENT_GAMES_STORAGE_KEY)
      ]);

      if (gamesRes.success) {
        setGames(gamesRes.games || []);
      }

      if (storedRecent) {
        try {
          const parsed = JSON.parse(storedRecent);
          if (Array.isArray(parsed)) {
            setRecentGames(parsed);
          }
        } catch (_) {}
      }
    } catch (err) {
      console.warn('Failed to load lobby:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleLaunchGame = async (game) => {
    // Record to recent games list
    try {
      const updatedRecent = [
        game,
        ...recentGames.filter((g) => g.id !== game.id)
      ].slice(0, 8);
      setRecentGames(updatedRecent);
      await AsyncStorage.setItem(RECENT_GAMES_STORAGE_KEY, JSON.stringify(updatedRecent));
    } catch (_) {}

    onSelectGame(game);
  };

  // Featured games: explicitly flagged or highest reward rates
  const featuredGames = games.filter((g) => g.featured);
  const heroGame = featuredGames[0] || games[0];
  const otherFeatured = featuredGames.length > 1
    ? featuredGames.slice(1, 6)
    : games.slice(1, 6);

  // Top games: ranked by play_count & rating
  const topGames = [...games]
    .sort((a, b) => (b.play_count || 0) - (a.play_count || 0))
    .slice(0, 10);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scroll}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Gamification Hooks: Daily Streak & Lucky Wheel (Learning OS Berry & Cobalt cards) */}
      <View style={styles.hooksRow}>
        <AnimatedCard
          style={styles.hookCardWrapper}
          onPress={onOpenDailyStreak}
        >
          <LinearGradient
            colors={['#d25087', '#9d174d']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hookCard}
          >
            <View style={styles.hookTopRow}>
              <View style={styles.hookIconWrap}>
                <Flame size={18} color="#ffffff" />
              </View>
              <View style={styles.hookBadgePill}>
                <Text style={styles.hookBadgeText}>STREAK</Text>
              </View>
            </View>

            <View style={styles.hookContent}>
              <Text style={styles.hookTitle}>Daily Streak</Text>
              <Text style={styles.hookSub}>
                {payoutsEnabled ? 'Claim up to +300 PTS 🔥' : 'Keep your win streak alive 🔥'}
              </Text>
            </View>

            <View style={styles.hookActionRow}>
              <Text style={styles.hookActionText}>Check In</Text>
              <Zap size={11} color="#fef08a" />
            </View>
          </LinearGradient>
        </AnimatedCard>

        <AnimatedCard
          style={styles.hookCardWrapper}
          onPress={onOpenLuckyWheel}
        >
          <LinearGradient
            colors={['#517bfd', '#3659c2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hookCard}
          >
            <View style={styles.hookTopRow}>
              <View style={[styles.hookIconWrap, { backgroundColor: 'rgba(255, 255, 255, 0.22)' }]}>
                <Disc size={18} color="#ffffff" />
              </View>
              <View style={[styles.hookBadgePill, { backgroundColor: 'rgba(255, 255, 255, 0.25)' }]}>
                <Text style={styles.hookBadgeText}>SPIN</Text>
              </View>
            </View>

            <View style={styles.hookContent}>
              <Text style={styles.hookTitle}>Lucky Wheel</Text>
              <Text style={styles.hookSub}>
                {payoutsEnabled ? 'Win 500 PTS Jackpot 🎡' : 'Spin for Mystery Perks 🎡'}
              </Text>
            </View>

            <View style={styles.hookActionRow}>
              <Text style={styles.hookActionText}>Spin Free</Text>
              <Sparkles size={11} color="#ffffff" />
            </View>
          </LinearGradient>
        </AnimatedCard>
      </View>

      {/* Daily Free Loot Chest (Rewarded Ad Sponsor) */}
      <AnimatedCard
        style={styles.chestWrapper}
        onPress={onOpenAdReward}
      >
        <View style={[styles.chestCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
          <View style={styles.chestLeft}>
            <LinearGradient
              colors={['#517bfd', '#3659c2']}
              style={styles.chestIconBadge}
            >
              <Gift size={20} color="#ffffff" />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.chestTitle, { color: colors.text }]}>Daily Free Loot Chest</Text>
                <View style={[styles.adTag, { backgroundColor: `${colors.primary}18`, borderColor: colors.primary }]}>
                  <Text style={[styles.adTagText, { color: colors.primary }]}>SPONSOR</Text>
                </View>
              </View>
              <Text style={[styles.chestSubtitle, { color: colors.textSecondary }]}>
                {payoutsEnabled
                  ? 'Watch quick 15s video to unlock free points'
                  : 'Watch quick 15s video to unlock bonus player perks'}
              </Text>
            </View>
          </View>

          <View style={[styles.chestRewardBadge, { backgroundColor: `${colors.accent}18`, borderColor: colors.accent }]}>
            <Sparkles size={12} color={colors.accent} />
            <Text style={[styles.chestRewardText, { color: colors.accent }]}>{payoutsEnabled ? '+3 PTS' : 'BONUS'}</Text>
          </View>
        </View>
      </AnimatedCard>

      {/* Continue Playing (Recently Played Games) */}
      {recentGames.length > 0 && (
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <View style={[styles.sectionIconWrap, { backgroundColor: `${colors.primary}18` }]}>
                <RotateCcw size={15} color={colors.primary} />
              </View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Continue Playing</Text>
            </View>
            <Text style={[styles.sectionSubBadge, { color: colors.textMuted }]}>
              {recentGames.length} recent
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {recentGames.map((game) => (
              <AnimatedCard
                key={`recent-${game.id}`}
                style={styles.continueCardWrapper}
                onPress={() => handleLaunchGame(game)}
              >
                <View style={[styles.continueCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
                  <View style={styles.continueThumbWrap}>
                    <Image
                      source={{ uri: game.thumbnail_url }}
                      style={styles.continueThumb}
                      resizeMode="cover"
                    />
                    <LinearGradient
                      colors={['transparent', 'rgba(0, 0, 0, 0.7)']}
                      style={styles.continueThumbOverlay}
                    >
                      <View style={[styles.continuePlayIcon, { backgroundColor: colors.primary }]}>
                        <Play size={12} color="#ffffff" fill="#ffffff" />
                      </View>
                    </LinearGradient>
                  </View>

                  <View style={styles.continueMeta}>
                    <Text style={[styles.continueTitle, { color: colors.text }]} numberOfLines={1}>
                      {game.title}
                    </Text>
                    <View style={styles.continueRateRow}>
                      <Sparkles size={10} color={colors.primary} />
                      <Text style={[styles.continueRateText, { color: colors.primary }]}>
                        {payoutsEnabled ? `${game.reward_rate || 1} PTS/MIN` : (game.category_name || 'Instant Play')}
                      </Text>
                    </View>
                  </View>
                </View>
              </AnimatedCard>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Featured Games Section */}
      <View style={styles.sectionWrap}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            <View style={[styles.sectionIconWrap, { backgroundColor: `${colors.accent}18` }]}>
              <Flame size={16} color={colors.accent} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Featured Games</Text>
          </View>
          <View style={[styles.featuredTagPill, { backgroundColor: `${colors.accent}18`, borderColor: `${colors.accent}55` }]}>
            <Sparkles size={11} color={colors.accent} />
            <Text style={[styles.featuredTagText, { color: colors.accent }]}>{payoutsEnabled ? '2X BOOST' : 'TOP PICK'}</Text>
          </View>
        </View>

        {/* Featured Hero Card */}
        {heroGame ? (
          <AnimatedCard
            style={styles.heroCardWrapper}
            onPress={() => handleLaunchGame(heroGame)}
          >
            <View style={[styles.heroCard, { borderColor: colors.border }]}>
              <Image
                source={{ uri: heroGame.banner_url || heroGame.thumbnail_url }}
                style={styles.heroImage}
                resizeMode="cover"
              />
              <LinearGradient
                colors={['transparent', 'rgba(11, 12, 18, 0.75)', isDark ? '#0b0c12' : '#151722']}
                locations={[0, 0.45, 1]}
                style={styles.heroOverlay}
              >
                <View style={styles.heroBadgeRow}>
                  <LinearGradient
                    colors={['#d25087', '#9d174d']}
                    style={styles.featuredBadge}
                  >
                    <Flame size={12} color="#ffffff" />
                    <Text style={styles.featuredText}>HOT DROP</Text>
                  </LinearGradient>

                  <View style={[styles.rateBadge, { backgroundColor: `${colors.primary}25`, borderColor: `${colors.primary}55` }]}>
                    <Sparkles size={11} color={colors.primary} />
                    <Text style={[styles.rateText, { color: colors.primary }]}>
                      {payoutsEnabled ? `${heroGame.reward_rate || 2} PTS / MIN` : 'POPULAR'}
                    </Text>
                  </View>

                  <View style={styles.playerCountBadge}>
                    <Users size={11} color="#979caf" />
                    <Text style={styles.playerCountText}>{(heroGame.play_count || 1840).toLocaleString()} plays</Text>
                  </View>
                </View>

                <Text style={styles.heroTitle}>{heroGame.title}</Text>
                <Text style={styles.heroDesc} numberOfLines={2}>
                  {heroGame.description || 'Jump into high-octane gameplay with instant access on any device!'}
                </Text>

                <View style={styles.heroActionRow}>
                  <LinearGradient
                    colors={colors.primaryGradient || ['#517bfd', '#3659c2']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.playNowBtn}
                  >
                    <Play size={14} color="#ffffff" fill="#ffffff" style={{ marginRight: 6 }} />
                    <Text style={styles.playNowText}>
                      {payoutsEnabled ? 'PLAY & EARN NOW' : 'PLAY NOW'}
                    </Text>
                  </LinearGradient>

                  <View style={styles.ratingBadge}>
                    <Star size={13} color="#fbbf24" fill="#fbbf24" />
                    <Text style={styles.ratingText}>{heroGame.rating || '4.9'}</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
          </AnimatedCard>
        ) : null}

        {/* Other Featured Enticing Cards (Horizontal Showcase) */}
        {otherFeatured.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {otherFeatured.map((game) => (
              <AnimatedCard
                key={`feat-${game.id}`}
                style={styles.showcaseCardWrapper}
                onPress={() => handleLaunchGame(game)}
              >
                <View style={[styles.showcaseCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
                  <View style={styles.showcaseThumbWrap}>
                    <Image
                      source={{ uri: game.banner_url || game.thumbnail_url }}
                      style={styles.showcaseThumb}
                      resizeMode="cover"
                    />
                    <LinearGradient
                      colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.85)']}
                      style={styles.showcaseGradient}
                    >
                      <View style={styles.showcaseTopRow}>
                        <View style={styles.showcaseBadge}>
                          <Sparkles size={10} color="#fbbf24" />
                          <Text style={styles.showcaseBadgeText}>FEATURED</Text>
                        </View>
                        <View style={styles.showcaseRating}>
                          <Star size={10} color="#fbbf24" fill="#fbbf24" />
                          <Text style={styles.showcaseRatingText}>{game.rating || '4.8'}</Text>
                        </View>
                      </View>

                      <View style={styles.showcaseBottomInfo}>
                        <Text style={styles.showcaseTitle} numberOfLines={1}>
                          {game.title}
                        </Text>
                        <View style={styles.showcaseActionRow}>
                          <Text style={[styles.showcaseRateText, { color: colors.primary }]}>
                            {payoutsEnabled ? `+${game.reward_rate || 1} PTS/MIN` : (game.category_name || 'Arcade')}
                          </Text>
                          <View style={[styles.showcasePlayBtn, { backgroundColor: colors.primary }]}>
                            <Play size={11} color="#ffffff" fill="#ffffff" />
                          </View>
                        </View>
                      </View>
                    </LinearGradient>
                  </View>
                </View>
              </AnimatedCard>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Top Games Section */}
      <View style={styles.sectionWrap}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            <View style={[styles.sectionIconWrap, { backgroundColor: `${colors.primary}18` }]}>
              <Trophy size={16} color={colors.primary} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Games</Text>
          </View>
          <Text style={[styles.sectionSubBadge, { color: colors.textMuted }]}>
            Leaderboard Rank
          </Text>
        </View>

        {loading ? (
          <SkeletonGameList count={4} />
        ) : (
          <View style={styles.topGamesList}>
            {topGames.map((game, index) => {
              const rank = index + 1;
              const isTopThree = rank <= 3;
              const rankColor = rank === 1 ? '#eab308' : rank === 2 ? '#94a3b8' : rank === 3 ? '#d25087' : colors.textMuted;

              return (
                <AnimatedCard
                  key={`top-${game.id}`}
                  style={styles.topGameCardWrapper}
                  onPress={() => handleLaunchGame(game)}
                >
                  <View style={[styles.topGameCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
                    {/* Rank Number */}
                    <View style={styles.rankContainer}>
                      <Text style={[styles.rankNumber, { color: rankColor, fontWeight: isTopThree ? '900' : '700' }]}>
                        #{rank}
                      </Text>
                      {rank === 1 ? (
                        <Award size={10} color="#eab308" />
                      ) : null}
                    </View>

                    {/* Game Thumbnail */}
                    <Image
                      source={{ uri: game.thumbnail_url }}
                      style={[styles.topGameThumb, { backgroundColor: colors.surfaceSubtle }]}
                      resizeMode="cover"
                    />

                    {/* Game Metadata */}
                    <View style={styles.topGameInfo}>
                      <View style={styles.topGameMetaRow}>
                        <View style={[styles.topRatePill, { backgroundColor: `${colors.primary}20` }]}>
                          <Sparkles size={9} color={colors.primary} />
                          <Text style={[styles.topRateText, { color: colors.primary }]}>
                            {payoutsEnabled ? `${game.reward_rate || 1} PTS/MIN` : (game.category_name || 'Instant Play')}
                          </Text>
                        </View>

                        <View style={styles.ratingChip}>
                          <Star size={9} color="#fbbf24" fill="#fbbf24" />
                          <Text style={styles.ratingChipText}>{game.rating || '4.8'}</Text>
                        </View>
                      </View>

                      <Text style={[styles.topGameTitle, { color: colors.text }]} numberOfLines={1}>
                        {game.title}
                      </Text>

                      <Text style={[styles.topGameSub, { color: colors.textSecondary }]} numberOfLines={1}>
                        {game.category_name || 'Arcade'} • {(game.play_count || 1200).toLocaleString()} players
                      </Text>
                    </View>

                    {/* Instant Play Action */}
                    <View style={[styles.playMiniBtn, { backgroundColor: colors.primary }]}>
                      <Play size={13} color="#ffffff" fill="#ffffff" />
                    </View>
                  </View>
                </AnimatedCard>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  scroll: {
    paddingBottom: 40
  },
  hooksRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingTop: 12,
    gap: 10
  },
  hookCardWrapper: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden'
  },
  hookCard: {
    padding: 12,
    borderRadius: 20,
    justifyContent: 'space-between',
    minHeight: 110
  },
  hookTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  hookIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  hookBadgePill: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8
  },
  hookBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  hookContent: {
    marginTop: 6
  },
  hookTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800'
  },
  hookSub: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 2
  },
  hookActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8
  },
  hookActionText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  chestWrapper: {
    marginHorizontal: 14,
    marginTop: 12,
    borderRadius: 20,
    overflow: 'hidden'
  },
  chestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 20,
    borderWidth: 1
  },
  chestLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1
  },
  chestIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  chestTitle: {
    fontSize: 13,
    fontWeight: '800'
  },
  adTag: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 0.5
  },
  adTagText: {
    fontSize: 8,
    fontWeight: '900'
  },
  chestSubtitle: {
    fontSize: 10.5,
    marginTop: 2
  },
  chestRewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1
  },
  chestRewardText: {
    fontSize: 10.5,
    fontWeight: '900'
  },
  sectionWrap: {
    marginTop: 22
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    marginBottom: 10
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  sectionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center'
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3
  },
  sectionSubBadge: {
    fontSize: 11,
    fontWeight: '600'
  },
  featuredTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1
  },
  featuredTagText: {
    fontSize: 9.5,
    fontWeight: '800'
  },
  heroCardWrapper: {
    marginHorizontal: 14,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#517bfd',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8
  },
  heroCard: {
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    height: 240,
    position: 'relative'
  },
  heroImage: {
    width: '100%',
    height: '100%',
    position: 'absolute'
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    padding: 16,
    justifyContent: 'flex-end'
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
    flexWrap: 'wrap'
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6
  },
  featuredText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  rateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1
  },
  rateText: {
    fontSize: 9.5,
    fontWeight: '800'
  },
  playerCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6
  },
  playerCountText: {
    color: '#979caf',
    fontSize: 9.5,
    fontWeight: '600'
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3
  },
  heroDesc: {
    color: '#cbd5e1',
    fontSize: 11.5,
    marginTop: 4,
    lineHeight: 16
  },
  heroActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12
  },
  playNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 14,
    shadowColor: '#517bfd',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 4
  },
  playNowText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10
  },
  ratingText: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '800'
  },
  horizontalScroll: {
    paddingHorizontal: 14,
    gap: 10
  },
  continueCardWrapper: {
    width: 140,
    borderRadius: 18,
    overflow: 'hidden'
  },
  continueCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden'
  },
  continueThumbWrap: {
    width: '100%',
    height: 90,
    position: 'relative'
  },
  continueThumb: {
    width: '100%',
    height: '100%'
  },
  continueThumbOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center'
  },
  continuePlayIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center'
  },
  continueMeta: {
    padding: 8
  },
  continueTitle: {
    fontSize: 12,
    fontWeight: '700'
  },
  continueRateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 3
  },
  continueRateText: {
    fontSize: 9.5,
    fontWeight: '700'
  },
  showcaseCardWrapper: {
    width: 170,
    height: 120,
    borderRadius: 18,
    overflow: 'hidden'
  },
  showcaseCard: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden'
  },
  showcaseThumbWrap: {
    width: '100%',
    height: '100%',
    position: 'relative'
  },
  showcaseThumb: {
    width: '100%',
    height: '100%'
  },
  showcaseGradient: {
    ...StyleSheet.absoluteFillObject,
    padding: 8,
    justifyContent: 'space-between'
  },
  showcaseTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  showcaseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5
  },
  showcaseBadgeText: {
    color: '#fbbf24',
    fontSize: 8,
    fontWeight: '800'
  },
  showcaseRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 5
  },
  showcaseRatingText: {
    color: '#fbbf24',
    fontSize: 9,
    fontWeight: '800'
  },
  showcaseBottomInfo: {
    marginTop: 'auto'
  },
  showcaseTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800'
  },
  showcaseActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4
  },
  showcaseRateText: {
    fontSize: 9.5,
    fontWeight: '800'
  },
  showcasePlayBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center'
  },
  topGamesList: {
    paddingHorizontal: 14,
    gap: 8
  },
  topGameCardWrapper: {
    borderRadius: 18,
    overflow: 'hidden'
  },
  topGameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 18,
    borderWidth: 1,
    gap: 10
  },
  rankContainer: {
    width: 22,
    alignItems: 'center',
    justifyContent: 'center'
  },
  rankNumber: {
    fontSize: 14
  },
  topGameThumb: {
    width: 48,
    height: 48,
    borderRadius: 12
  },
  topGameInfo: {
    flex: 1
  },
  topGameMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2
  },
  topRatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6
  },
  topRateText: {
    fontSize: 8.5,
    fontWeight: '800'
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2
  },
  ratingChipText: {
    color: '#fbbf24',
    fontSize: 9,
    fontWeight: '800'
  },
  topGameTitle: {
    fontSize: 13,
    fontWeight: '800'
  },
  topGameSub: {
    fontSize: 10.5,
    marginTop: 2
  },
  playMiniBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center'
  }
});
