import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Search,
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
  Zap
} from 'lucide-react-native';
import { getCategories, getGames } from '../api/clientApi';
import AnimatedCard from '../components/AnimatedCard';
import { useTheme } from '../context/ThemeContext';

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
  const [categories, setCategories] = useState([]);
  const [games, setGames] = useState([]);
  const [selectedCat, setSelectedCat] = useState(null);
  const [filterFeatured, setFilterFeatured] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [catsRes, gamesRes] = await Promise.all([
        getCategories(),
        getGames(selectedCat, search)
      ]);
      if (catsRes.success) setCategories(catsRes.categories);
      if (gamesRes.success) setGames(gamesRes.games);
    } catch (err) {
      console.warn('Failed to load lobby:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCat]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const featuredGame = games.find(g => g.featured) || games[0];
  const displayedGames = filterFeatured ? games.filter(g => g.featured) : games;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scroll}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Gamification Hooks: High-impact Daily Streak & Lucky Wheel Cards */}
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

      {/* Daily Free Loot Chest (Rewarded Video Sponsor) */}
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

      {/* Featured Game Hero Card */}
      {featuredGame ? (
        <AnimatedCard
          style={styles.heroCardWrapper}
          onPress={() => onSelectGame(featuredGame)}
        >
          <View style={[styles.heroCard, { borderColor: colors.border }]}>
            <Image
              source={{ uri: featuredGame.banner_url || featuredGame.thumbnail_url }}
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
                  <Text style={styles.featuredText}>FEATURED DROP</Text>
                </LinearGradient>

                <View style={styles.rateBadge}>
                  <Sparkles size={12} color="#38bdf8" />
                  <Text style={styles.rateText}>{featuredGame.reward_rate || 2} PTS / MIN</Text>
                </View>

                <View style={styles.playerCountBadge}>
                  <Users size={11} color="#94a3b8" />
                  <Text style={styles.playerCountText}>{(featuredGame.play_count || 1840).toLocaleString()}</Text>
                </View>
              </View>

              <Text style={styles.heroTitle}>{featuredGame.title}</Text>
              <Text style={styles.heroDesc} numberOfLines={2}>{featuredGame.description}</Text>

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
                  <Text style={styles.ratingText}>{featuredGame.rating || '4.9'}</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        </AnimatedCard>
      ) : null}

      {/* Search Bar with glowing focus */}
      <View style={[styles.searchBar, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
        <Search size={16} color={colors.primary} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search games, arcade, puzzles..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={loadData}
        />
        {search ? (
          <TouchableOpacity onPress={() => { setSearch(''); loadData(); }}>
            <Text style={{ color: colors.textSecondary, fontSize: 12, paddingHorizontal: 6 }}>Clear</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Category Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.catScroll}
      >
        <TouchableOpacity
          style={[
            styles.catPill,
            { backgroundColor: colors.surfaceCard, borderColor: colors.border },
            !selectedCat && !filterFeatured && styles.catPillActive
          ]}
          onPress={() => { setSelectedCat(null); setFilterFeatured(false); }}
          activeOpacity={0.75}
        >
          <Text
            style={[
              styles.catPillText,
              { color: colors.textSecondary },
              !selectedCat && !filterFeatured && styles.catPillTextActive
            ]}
          >
            🎮 All Games
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.catPill,
            { backgroundColor: colors.surfaceCard, borderColor: colors.border },
            filterFeatured && styles.catPillFeaturedActive
          ]}
          onPress={() => { setFilterFeatured(!filterFeatured); setSelectedCat(null); }}
          activeOpacity={0.75}
        >
          <Text
            style={[
              styles.catPillText,
              { color: colors.textSecondary },
              filterFeatured && styles.catPillFeaturedTextActive
            ]}
          >
            ⭐ Featured
          </Text>
        </TouchableOpacity>

        {categories.map(c => {
          const isActive = selectedCat === c.id;
          return (
            <TouchableOpacity
              key={c.id}
              style={[
                styles.catPill,
                { backgroundColor: colors.surfaceCard, borderColor: colors.border },
                isActive && styles.catPillActive
              ]}
              onPress={() => { setSelectedCat(c.id); setFilterFeatured(false); }}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.catPillText,
                  { color: colors.textSecondary },
                  isActive && styles.catPillTextActive
                ]}
              >
                {c.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Games Catalog Section */}
      <View style={styles.sectionHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Gamepad2 size={18} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>HTML5 Instant Games</Text>
        </View>
        <Text style={[styles.sectionCount, { color: colors.textMuted }]}>{displayedGames.length} Verified Titles</Text>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Syncing games catalog...</Text>
        </View>
      ) : (
        <View style={styles.gamesGrid}>
          {displayedGames.map(game => (
            <AnimatedCard
              key={game.id}
              style={styles.gameCardWrapper}
              onPress={() => onSelectGame(game)}
            >
              <View style={[styles.gameCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
                <Image
                  source={{ uri: game.thumbnail_url }}
                  style={[styles.gameThumb, { backgroundColor: colors.surfaceSubtle }]}
                  resizeMode="cover"
                />

                <View style={styles.gameInfo}>
                  <View style={styles.gameTopMeta}>
                    <LinearGradient
                      colors={['rgba(6, 182, 212, 0.25)', 'rgba(37, 99, 235, 0.25)']}
                      style={styles.gameRatePill}
                    >
                      <Sparkles size={10} color="#06b6d4" />
                      <Text style={styles.gameRateText}>{game.reward_rate || 1} PTS/MIN</Text>
                    </LinearGradient>

                    <View style={styles.ratingChip}>
                      <Star size={10} color="#fbbf24" fill="#fbbf24" />
                      <Text style={styles.ratingChipText}>{game.rating || '4.8'}</Text>
                    </View>

                    {game.featured ? (
                      <View style={styles.cardFeaturedBadge}>
                        <Sparkles size={9} color="#fbbf24" />
                        <Text style={styles.cardFeaturedText}>FEATURED</Text>
                      </View>
                    ) : null}
                  </View>

                  <Text style={[styles.gameCardTitle, { color: colors.text }]} numberOfLines={1}>{game.title}</Text>
                  <Text style={[styles.gameCategory, { color: colors.textSecondary }]} numberOfLines={1}>
                    {game.category_name || 'Arcade'} • {(game.play_count || 1200).toLocaleString()} plays
                  </Text>
                </View>

                <View style={styles.playMiniBtn}>
                  <Play size={13} color="#ffffff" fill="#ffffff" />
                </View>
              </View>
            </AnimatedCard>
          ))}
        </View>
      )}

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
    marginBottom: 16,
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
  heroCardWrapper: {
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 18,
    shadowColor: '#06b6d4',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 8
  },
  heroCard: {
    height: 230,
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
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: -0.5
  },
  heroDesc: {
    color: '#cbd5e1',
    fontSize: 12,
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 44,
    marginBottom: 14,
    borderWidth: 1
  },
  searchIcon: {
    marginRight: 10
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500'
  },
  catScroll: {
    gap: 8,
    paddingBottom: 6,
    marginBottom: 16
  },
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1
  },
  catPillActive: {
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
    borderColor: '#06b6d4'
  },
  catPillText: {
    fontSize: 12,
    fontWeight: '600'
  },
  catPillTextActive: {
    color: '#06b6d4',
    fontWeight: '800'
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 2
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3
  },
  sectionCount: {
    fontSize: 11.5,
    fontWeight: '600'
  },
  loadingBox: {
    padding: 30,
    alignItems: 'center',
    gap: 10
  },
  loadingText: {
    fontSize: 12
  },
  gamesGrid: {
    gap: 12,
    marginBottom: 20
  },
  gameCardWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4
  },
  gameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1
  },
  gameThumb: {
    width: 68,
    height: 68,
    borderRadius: 12
  },
  gameInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8
  },
  gameTopMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4
  },
  gameRatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.4)'
  },
  gameRateText: {
    color: '#38bdf8',
    fontSize: 9.5,
    fontWeight: '800'
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2
  },
  ratingChipText: {
    color: '#fbbf24',
    fontSize: 9.5,
    fontWeight: '700'
  },
  gameCardTitle: {
    fontSize: 14,
    fontWeight: '800'
  },
  gameCategory: {
    fontSize: 11,
    marginTop: 2
  },
  playMiniBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
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
  },
  catPillFeaturedActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderColor: '#f59e0b'
  },
  catPillFeaturedTextActive: {
    color: '#f59e0b',
    fontWeight: '800'
  },
  cardFeaturedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.45)',
    marginLeft: 2
  },
  cardFeaturedText: {
    color: '#fbbf24',
    fontSize: 8.5,
    fontWeight: '900'
  }
});
