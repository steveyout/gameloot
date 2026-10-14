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
  updateInfo
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
      {/* Gamification Hooks: Daily Streak & Lucky Wheel */}
      <View style={styles.hooksRow}>
        <AnimatedCard
          style={styles.hookCardWrapper}
          onPress={onOpenDailyStreak}
        >
          <LinearGradient
            colors={['#ea580c', '#991b1b', '#450a0a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hookCard}
          >
            <View style={styles.hookTopRow}>
              <View style={styles.hookIconWrap}>
                <Flame size={20} color="#ffffff" />
              </View>
              <View style={styles.hookBadgePill}>
                <Text style={styles.hookBadgeText}>STREAK</Text>
              </View>
            </View>

            <View style={styles.hookContent}>
              <Text style={styles.hookTitle}>Daily Streak</Text>
              <Text style={styles.hookSub}>Claim up to +300 PTS 🔥</Text>
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
            colors={['#7c3aed', '#4338ca', '#1e1b4b']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hookCard}
          >
            <View style={styles.hookTopRow}>
              <View style={[styles.hookIconWrap, { backgroundColor: 'rgba(192, 132, 252, 0.3)' }]}>
                <Disc size={20} color="#e9d5ff" />
              </View>
              <View style={[styles.hookBadgePill, { backgroundColor: 'rgba(168, 85, 247, 0.4)' }]}>
                <Text style={styles.hookBadgeText}>JACKPOT</Text>
              </View>
            </View>

            <View style={styles.hookContent}>
              <Text style={styles.hookTitle}>Lucky Wheel</Text>
              <Text style={styles.hookSub}>Win 500 PTS Jackpot 🎡</Text>
            </View>

            <View style={styles.hookActionRow}>
              <Text style={styles.hookActionText}>Spin Free</Text>
              <Sparkles size={11} color="#e9d5ff" />
            </View>
          </LinearGradient>
        </AnimatedCard>
      </View>

      {/* Daily Free Loot Chest (Rewarded Ad Sponsor) */}
      <AnimatedCard
        style={styles.chestWrapper}
        onPress={onOpenAdReward}
      >
        <LinearGradient
          colors={['#292524', '#1c1917', '#0c0a09']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.chestCard}
        >
          <View style={styles.chestGlowBorder} />
          <View style={styles.chestLeft}>
            <LinearGradient
              colors={['#f59e0b', '#d97706']}
              style={styles.chestIconBadge}
            >
              <Gift size={24} color="#ffffff" />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.chestTitle}>Daily Free Loot Chest</Text>
                <View style={styles.adTag}>
                  <Text style={styles.adTagText}>SPONSOR</Text>
                </View>
              </View>
              <Text style={styles.chestSubtitle}>Watch quick 15s video to unlock free points</Text>
            </View>
          </View>

          <View style={styles.chestRewardBadge}>
            <Sparkles size={13} color="#fef08a" />
            <Text style={styles.chestRewardText}>+3 PTS</Text>
          </View>
        </LinearGradient>
      </AnimatedCard>

      {/* Continue Playing (Recently Played Games) */}
      {recentGames.length > 0 && (
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <View style={[styles.sectionIconWrap, { backgroundColor: 'rgba(6, 182, 212, 0.15)' }]}>
                <RotateCcw size={15} color="#06b6d4" />
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
                      <View style={styles.continuePlayIcon}>
                        <Play size={12} color="#ffffff" fill="#ffffff" />
                      </View>
                    </LinearGradient>
                  </View>

                  <View style={styles.continueMeta}>
                    <Text style={[styles.continueTitle, { color: colors.text }]} numberOfLines={1}>
                      {game.title}
                    </Text>
                    <View style={styles.continueRateRow}>
                      <Sparkles size={10} color="#06b6d4" />
                      <Text style={styles.continueRateText}>{game.reward_rate || 1} PTS/MIN</Text>
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
            <View style={[styles.sectionIconWrap, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <Flame size={16} color="#f59e0b" />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Featured Games</Text>
          </View>
          <View style={styles.featuredTagPill}>
            <Sparkles size={11} color="#f59e0b" />
            <Text style={styles.featuredTagText}>2X BOOST</Text>
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
                colors={['transparent', 'rgba(15, 23, 42, 0.75)', isDark ? '#090d16' : '#0f172a']}
                locations={[0, 0.45, 1]}
                style={styles.heroOverlay}
              >
                <View style={styles.heroBadgeRow}>
                  <LinearGradient
                    colors={['#f59e0b', '#ea580c']}
                    style={styles.featuredBadge}
                  >
                    <Flame size={12} color="#ffffff" />
                    <Text style={styles.featuredText}>HOT DROP</Text>
                  </LinearGradient>

                  <View style={styles.rateBadge}>
                    <Sparkles size={12} color="#38bdf8" />
                    <Text style={styles.rateText}>{heroGame.reward_rate || 2} PTS / MIN</Text>
                  </View>

                  <View style={styles.playerCountBadge}>
                    <Users size={11} color="#94a3b8" />
                    <Text style={styles.playerCountText}>{(heroGame.play_count || 1840).toLocaleString()} plays</Text>
                  </View>
                </View>

                <Text style={styles.heroTitle}>{heroGame.title}</Text>
                <Text style={styles.heroDesc} numberOfLines={2}>
                  {heroGame.description || 'Jump into high-octane gameplay and accumulate reward points with every minute!'}
                </Text>

                <View style={styles.heroActionRow}>
                  <LinearGradient
                    colors={['#06b6d4', '#2563eb']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.playNowBtn}
                  >
                    <Play size={14} color="#ffffff" fill="#ffffff" style={{ marginRight: 6 }} />
                    <Text style={styles.playNowText}>PLAY & EARN NOW</Text>
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
                      colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.8)']}
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
                          <Text style={styles.showcaseRateText}>
                            +{game.reward_rate || 1} PTS/MIN
                          </Text>
                          <View style={styles.showcasePlayBtn}>
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
            <View style={[styles.sectionIconWrap, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
              <Trophy size={16} color="#a855f7" />
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
              const rankColor = rank === 1 ? '#eab308' : rank === 2 ? '#94a3b8' : rank === 3 ? '#d97706' : colors.textMuted;

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
                        <LinearGradient
                          colors={['rgba(6, 182, 212, 0.25)', 'rgba(37, 99, 235, 0.25)']}
                          style={styles.topRatePill}
                        >
                          <Sparkles size={9} color="#06b6d4" />
                          <Text style={styles.topRateText}>{game.reward_rate || 1} PTS/MIN</Text>
                        </LinearGradient>

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
                    <View style={styles.playMiniBtn}>
                      <Play size={13} color="#ffffff" fill="#ffffff" />
                    </View>
                  </View>
                </AnimatedCard>
              );
            })}
          </View>
        )}
      </View>

      {/* App Version Info & Update Checker Box */}
      <View style={[styles.updateStatusCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
        <View style={styles.updateStatusTop}>
          <View style={styles.verInfo}>
            <Text style={[styles.verTitle, { color: colors.text }]}>App Version Guard</Text>
            <Text style={[styles.verSub, { color: colors.textSecondary }]}>
              Installed: v{updateInfo?.client_version || '1.0.0'} (Code {updateInfo?.client_version_code || 1})
            </Text>
          </View>

          <TouchableOpacity
            style={styles.checkUpdateBtn}
            onPress={onCheckUpdate}
            disabled={isCheckingUpdate}
            activeOpacity={0.8}
          >
            <RefreshCw size={12} color="#090d16" style={{ marginRight: 4 }} />
            <Text style={styles.checkUpdateBtnText}>
              {isCheckingUpdate ? 'Checking...' : 'Check Update'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.updateStatusDetails, { borderTopColor: colors.border }]}>
          <Text style={[styles.serverVerText, { color: colors.textSecondary }]}>
            Latest Server Target: v{updateInfo?.latest_version || '1.1.0'} | Forced: {updateInfo?.force_update ? 'ENABLED' : 'DISABLED'}
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
  hooksRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14
  },
  hookCardWrapper: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6
  },
  hookCard: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'space-between',
    minHeight: 120
  },
  hookTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  hookIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  hookBadgePill: {
    backgroundColor: 'rgba(239, 68, 68, 0.35)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)'
  },
  hookBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  hookContent: {
    marginTop: 8
  },
  hookTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: -0.2
  },
  hookSub: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
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
    fontSize: 11,
    fontWeight: '800'
  },
  chestWrapper: {
    marginBottom: 18,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5
  },
  chestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#78350f'
  },
  chestGlowBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)'
  },
  chestLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1
  },
  chestIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 4
  },
  chestTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900'
  },
  adTag: {
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4
  },
  adTagText: {
    color: '#fbbf24',
    fontSize: 8.5,
    fontWeight: '800'
  },
  chestSubtitle: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2
  },
  chestRewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#f59e0b',
    marginLeft: 10
  },
  chestRewardText: {
    color: '#fef08a',
    fontSize: 12.5,
    fontWeight: '900'
  },
  sectionWrap: {
    marginBottom: 20
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 2
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  sectionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.3
  },
  sectionSubBadge: {
    fontSize: 11.5,
    fontWeight: '600'
  },
  featuredTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)'
  },
  featuredTagText: {
    color: '#f59e0b',
    fontSize: 10,
    fontWeight: '900'
  },
  horizontalScroll: {
    gap: 12,
    paddingBottom: 6
  },
  continueCardWrapper: {
    width: 140,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4
  },
  continueCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1
  },
  continueThumbWrap: {
    width: '100%',
    height: 85,
    position: 'relative'
  },
  continueThumb: {
    width: '100%',
    height: '100%'
  },
  continueThumbOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: 6
  },
  continuePlayIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#06b6d4',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#06b6d4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3
  },
  continueMeta: {
    padding: 8
  },
  continueTitle: {
    fontSize: 12,
    fontWeight: '800'
  },
  continueRateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3
  },
  continueRateText: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '700'
  },
  heroCardWrapper: {
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: '#06b6d4',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 8
  },
  heroCard: {
    height: 220,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1.5
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
    gap: 8,
    marginBottom: 8
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8
  },
  featuredText: {
    color: '#ffffff',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  rateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(6, 182, 212, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.4)'
  },
  rateText: {
    color: '#38bdf8',
    fontSize: 9.5,
    fontWeight: '800'
  },
  playerCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  playerCountText: {
    color: '#94a3b8',
    fontSize: 9.5,
    fontWeight: '700'
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5
  },
  heroDesc: {
    color: '#cbd5e1',
    fontSize: 11.5,
    marginTop: 4,
    lineHeight: 15
  },
  heroActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10
  },
  playNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: '#06b6d4',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
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
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155'
  },
  ratingText: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '800'
  },
  showcaseCardWrapper: {
    width: 200,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5
  },
  showcaseCard: {
    height: 130,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1
  },
  showcaseThumbWrap: {
    width: '100%',
    height: '100%',
    position: 'relative'
  },
  showcaseThumb: {
    width: '100%',
    height: '100%',
    position: 'absolute'
  },
  showcaseGradient: {
    ...StyleSheet.absoluteFillObject,
    padding: 10,
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
    backgroundColor: 'rgba(245, 158, 11, 0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#f59e0b'
  },
  showcaseBadgeText: {
    color: '#fef08a',
    fontSize: 8,
    fontWeight: '900'
  },
  showcaseRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
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
    fontSize: 13,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3
  },
  showcaseActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4
  },
  showcaseRateText: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '800'
  },
  showcasePlayBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#06b6d4',
    justifyContent: 'center',
    alignItems: 'center'
  },
  topGamesList: {
    gap: 10
  },
  topGameCardWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3
  },
  topGameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1
  },
  rankContainer: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center'
  },
  rankNumber: {
    fontSize: 14
  },
  topGameThumb: {
    width: 62,
    height: 62,
    borderRadius: 12,
    marginLeft: 4
  },
  topGameInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8
  },
  topGameMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3
  },
  topRatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.4)'
  },
  topRateText: {
    color: '#38bdf8',
    fontSize: 9,
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
    fontWeight: '700'
  },
  topGameTitle: {
    fontSize: 13.5,
    fontWeight: '800'
  },
  topGameSub: {
    fontSize: 10.5,
    marginTop: 2
  },
  playMiniBtn: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: '#06b6d4',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#06b6d4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 3
  },
  updateStatusCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    marginTop: 8
  },
  updateStatusTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  verInfo: {
    flex: 1
  },
  verTitle: {
    fontSize: 13,
    fontWeight: '800'
  },
  verSub: {
    fontSize: 11,
    marginTop: 2
  },
  checkUpdateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#06b6d4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9
  },
  checkUpdateBtnText: {
    color: '#090d16',
    fontSize: 11,
    fontWeight: '800'
  },
  updateStatusDetails: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1
  },
  serverVerText: {
    fontSize: 10,
    fontWeight: '600'
  }
});
