import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
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
  X,
  SlidersHorizontal,
  ArrowUpDown,
  TrendingUp,
  Award
} from 'lucide-react-native';
import { getCategories, getGames } from '../api/clientApi';
import AnimatedCard from '../components/AnimatedCard';
import { useTheme } from '../context/ThemeContext';
import { SkeletonGameList } from '../components/SkeletonLoader';

export default function SearchScreen({ onSelectGame }) {
  const { colors, isDark } = useTheme();
  const [categories, setCategories] = useState([]);
  const [games, setGames] = useState([]);
  const [selectedCat, setSelectedCat] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular'); // 'popular' | 'reward' | 'rating' | 'featured'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [catsRes, gamesRes] = await Promise.all([
        getCategories(),
        getGames(selectedCat, searchQuery)
      ]);
      if (catsRes.success) setCategories(catsRes.categories || []);
      if (gamesRes.success) setGames(gamesRes.games || []);
    } catch (err) {
      console.warn('Failed to load search games:', err.message);
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

  const handleSearchSubmit = () => {
    loadData();
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setLoading(true);
    getGames(selectedCat, '').then((res) => {
      if (res.success) setGames(res.games || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  // Filter & Sort client-side
  const filteredAndSortedGames = [...games].sort((a, b) => {
    if (sortBy === 'reward') {
      return (b.reward_rate || 0) - (a.reward_rate || 0);
    }
    if (sortBy === 'rating') {
      return parseFloat(b.rating || '4.5') - parseFloat(a.rating || '4.5');
    }
    if (sortBy === 'featured') {
      return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    }
    // Default: 'popular'
    return (b.play_count || 0) - (a.play_count || 0);
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Header Bar - Learning OS Style */}
      <View style={[styles.headerContainer, { backgroundColor: colors.surfaceCard, borderBottomColor: colors.border }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
          <Search size={18} color={colors.primary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search all games, genres, keywords..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
            autoCapitalize="none"
            clearButtonMode="never"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={handleClearSearch} style={styles.clearBtn} activeOpacity={0.7}>
              <X size={15} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Quick Sort Options */}
        <View style={styles.sortRow}>
          <TouchableOpacity
            style={[
              styles.sortChip,
              { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
              sortBy === 'popular' && { backgroundColor: `${colors.primary}22`, borderColor: colors.primary }
            ]}
            onPress={() => setSortBy('popular')}
            activeOpacity={0.75}
          >
            <TrendingUp size={11} color={sortBy === 'popular' ? colors.primary : colors.textSecondary} />
            <Text style={[styles.sortChipText, { color: sortBy === 'popular' ? colors.primary : colors.textSecondary }]}>
              Popular
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.sortChip,
              { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
              sortBy === 'reward' && { backgroundColor: `${colors.primary}22`, borderColor: colors.primary }
            ]}
            onPress={() => setSortBy('reward')}
            activeOpacity={0.75}
          >
            <Sparkles size={11} color={sortBy === 'reward' ? colors.primary : colors.textSecondary} />
            <Text style={[styles.sortChipText, { color: sortBy === 'reward' ? colors.primary : colors.textSecondary }]}>
              High Reward
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.sortChip,
              { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
              sortBy === 'rating' && { backgroundColor: `${colors.gold}22`, borderColor: colors.gold }
            ]}
            onPress={() => setSortBy('rating')}
            activeOpacity={0.75}
          >
            <Star size={11} color={sortBy === 'rating' ? colors.gold : colors.textSecondary} />
            <Text style={[styles.sortChipText, { color: sortBy === 'rating' ? colors.gold : colors.textSecondary }]}>
              Top Rated
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.sortChip,
              { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
              sortBy === 'featured' && { backgroundColor: `${colors.accent}22`, borderColor: colors.accent }
            ]}
            onPress={() => setSortBy('featured')}
            activeOpacity={0.75}
          >
            <Flame size={11} color={sortBy === 'featured' ? colors.accent : colors.textSecondary} />
            <Text style={[styles.sortChipText, { color: sortBy === 'featured' ? colors.accent : colors.textSecondary }]}>
              Featured
            </Text>
          </TouchableOpacity>
        </View>

        {/* Category Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catScroll}
        >
          <TouchableOpacity
            style={[
              styles.catPill,
              { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
              !selectedCat && { backgroundColor: colors.primary, borderColor: colors.primary }
            ]}
            onPress={() => setSelectedCat(null)}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.catPillText,
                { color: colors.textSecondary },
                !selectedCat && { color: '#ffffff', fontWeight: '800' }
              ]}
            >
              All Categories
            </Text>
          </TouchableOpacity>

          {categories.map((c) => {
            const isActive = selectedCat === c.id;
            return (
              <TouchableOpacity
                key={c.id}
                style={[
                  styles.catPill,
                  { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
                  isActive && { backgroundColor: colors.primary, borderColor: colors.primary }
                ]}
                onPress={() => setSelectedCat(c.id)}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.catPillText,
                    { color: colors.textSecondary },
                    isActive && { color: '#ffffff', fontWeight: '800' }
                  ]}
                >
                  {c.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Results Header */}
      <ScrollView
        style={styles.resultsScroll}
        contentContainerStyle={styles.resultsContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.resultsMetaRow}>
          <Text style={[styles.resultsTitle, { color: colors.text }]}>
            {searchQuery ? `Results for "${searchQuery}"` : 'Explore Games'}
          </Text>
          <Text style={[styles.resultsCount, { color: colors.textMuted }]}>
            {filteredAndSortedGames.length} titles
          </Text>
        </View>

        {loading ? (
          <SkeletonGameList count={5} />
        ) : filteredAndSortedGames.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
            <View style={[styles.emptyIconWrap, { backgroundColor: `${colors.primary}18` }]}>
              <Gamepad2 size={38} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No games found</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {searchQuery
                ? `We couldn't find any games matching "${searchQuery}". Try different keywords or browse all categories.`
                : 'No games available in this category yet. Check back soon!'}
            </Text>
            {(searchQuery || selectedCat) ? (
              <TouchableOpacity
                style={[styles.resetBtn, { backgroundColor: colors.primary }]}
                onPress={() => {
                  setSearchQuery('');
                  setSelectedCat(null);
                  loadData();
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.resetBtnText}>Clear All Filters</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : (
          <View style={styles.gamesGrid}>
            {filteredAndSortedGames.map((game) => (
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
                      <View style={[styles.gameRatePill, { backgroundColor: `${colors.primary}18`, borderColor: `${colors.primary}44` }]}>
                        <Sparkles size={10} color={colors.primary} />
                        <Text style={[styles.gameRateText, { color: colors.primary }]}>{game.reward_rate || 1} PTS/MIN</Text>
                      </View>

                      <View style={styles.ratingChip}>
                        <Star size={10} color="#fbbf24" fill="#fbbf24" />
                        <Text style={styles.ratingChipText}>{game.rating || '4.8'}</Text>
                      </View>

                      {game.featured ? (
                        <View style={[styles.featuredBadge, { backgroundColor: `${colors.accent}20`, borderColor: colors.accent }]}>
                          <Flame size={9} color={colors.accent} />
                          <Text style={[styles.featuredBadgeText, { color: colors.accent }]}>HOT</Text>
                        </View>
                      ) : null}
                    </View>

                    <Text style={[styles.gameCardTitle, { color: colors.text }]} numberOfLines={1}>
                      {game.title}
                    </Text>

                    <Text style={[styles.gameCategory, { color: colors.textSecondary }]} numberOfLines={1}>
                      {game.category_name || 'Arcade'} • {(game.play_count || 1200).toLocaleString()} plays
                    </Text>
                  </View>

                  <View style={[styles.playMiniBtn, { backgroundColor: colors.primary }]}>
                    <Play size={14} color="#ffffff" fill="#ffffff" />
                  </View>
                </View>
              </AnimatedCard>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  headerContainer: {
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 46,
    borderWidth: 1,
    marginBottom: 10
  },
  searchIcon: {
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 0
  },
  clearBtn: {
    padding: 6
  },
  sortRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1
  },
  sortChipText: {
    fontSize: 11,
    fontWeight: '700'
  },
  catScroll: {
    gap: 8,
    paddingBottom: 6
  },
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1
  },
  catPillText: {
    fontSize: 12,
    fontWeight: '600'
  },
  resultsScroll: {
    flex: 1
  },
  resultsContent: {
    padding: 16,
    paddingBottom: 40
  },
  resultsMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3
  },
  resultsCount: {
    fontSize: 12,
    fontWeight: '600'
  },
  gamesGrid: {
    gap: 12
  },
  gameCardWrapper: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#517bfd',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4
  },
  gameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    padding: 10,
    borderWidth: 1
  },
  gameThumb: {
    width: 68,
    height: 68,
    borderRadius: 14
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
    borderWidth: 1
  },
  gameRateText: {
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
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    borderWidth: 1
  },
  featuredBadgeText: {
    fontSize: 8.5,
    fontWeight: '900'
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
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#517bfd',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 3
  },
  emptyState: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    marginTop: 20
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4
  },
  emptySubtitle: {
    fontSize: 11.5,
    textAlign: 'center',
    lineHeight: 16
  },
  resetBtn: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12
  },
  resetBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800'
  }
});
