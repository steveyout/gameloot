import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  RefreshControl,
  ActivityIndicator,
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
  TrendingUp
} from 'lucide-react-native';
import { getCategories, getGames } from '../api/clientApi';
import AnimatedCard from '../components/AnimatedCard';
import { useTheme } from '../context/ThemeContext';
import { SkeletonGameList } from '../components/SkeletonLoader';
import { logEvent } from '../services/firebase';

const PAGE_SIZE = 16;

export default function SearchScreen({ onSelectGame }) {
  const { colors } = useTheme();
  const [categories, setCategories] = useState([]);
  const [games, setGames] = useState([]);
  const [selectedCat, setSelectedCat] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular'); // 'popular' | 'reward' | 'rating' | 'featured'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Lazy loading pagination state
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Debounce search query input (250ms) to ensure instant, fluid typing across hundreds of games
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
      if (searchQuery.trim().length > 1) {
        logEvent('search_games', {
          query: searchQuery.trim(),
          category: selectedCat || 'all',
          app: 'gameloot'
        });
      }
    }, 250);
    return () => clearTimeout(handler);
  }, [searchQuery, selectedCat]);

  // Reset lazy load page when filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [debouncedQuery, selectedCat, sortBy]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [catsRes, gamesRes] = await Promise.all([
        getCategories(),
        getGames(selectedCat, debouncedQuery)
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
    setVisibleCount(PAGE_SIZE);
    loadData();
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setDebouncedQuery('');
    setVisibleCount(PAGE_SIZE);
  };

  // Filter & Sort client-side
  const filteredAndSortedGames = useMemo(() => {
    let result = [...games];

    if (debouncedQuery) {
      const q = debouncedQuery.toLowerCase();
      result = result.filter(
        g => (g.title && g.title.toLowerCase().includes(q)) ||
             (g.description && g.description.toLowerCase().includes(q)) ||
             (g.category_name && g.category_name.toLowerCase().includes(q))
      );
    }

    result.sort((a, b) => {
      if (sortBy === 'reward') {
        return (b.reward_rate || 0) - (a.reward_rate || 0);
      }
      if (sortBy === 'rating') {
        return parseFloat(b.rating || '4.5') - parseFloat(a.rating || '4.5');
      }
      if (sortBy === 'featured') {
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      }
      return (b.play_count || 0) - (a.play_count || 0);
    });

    return result;
  }, [games, debouncedQuery, sortBy]);

  // Virtualized sliced list for lazy loading
  const displayedGames = useMemo(() => {
    return filteredAndSortedGames.slice(0, visibleCount);
  }, [filteredAndSortedGames, visibleCount]);

  const handleLoadMore = useCallback(() => {
    if (visibleCount >= filteredAndSortedGames.length || isLoadingMore || loading) return;

    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount(prev => Math.min(prev + PAGE_SIZE, filteredAndSortedGames.length));
      setIsLoadingMore(false);
    }, 120);
  }, [visibleCount, filteredAndSortedGames.length, isLoadingMore, loading]);

  const renderGameCard = useCallback(({ item: game }) => (
    <AnimatedCard
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
            {game.category_name || 'Instant Game'} • {(game.play_count || 1200).toLocaleString()} plays
          </Text>
        </View>

        <View style={[styles.playMiniBtn, { backgroundColor: colors.primary }]}>
          <Play size={14} color="#ffffff" fill="#ffffff" />
        </View>
      </View>
    </AnimatedCard>
  ), [colors, onSelectGame]);

  const renderHeader = () => (
    <View style={[styles.headerContainer, { backgroundColor: colors.surfaceCard, borderBottomColor: colors.border }]}>
      {/* Search Bar */}
      <View style={[styles.searchBar, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
        <Search size={18} color={colors.primary} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search all 600+ instant games, genres..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
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

      {/* Results Header Count */}
      <View style={styles.resultsMetaRow}>
        <Text style={[styles.resultsTitle, { color: colors.text }]}>
          {searchQuery ? `Results for "${searchQuery}"` : 'Explore Games'}
        </Text>
        <Text style={[styles.resultsCount, { color: colors.textMuted }]}>
          Showing {displayedGames.length} of {filteredAndSortedGames.length}
        </Text>
      </View>
    </View>
  );

  const renderFooter = () => {
    if (visibleCount < filteredAndSortedGames.length) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.footerLoaderText, { color: colors.textMuted }]}>
            Lazy loading more games... ({displayedGames.length}/{filteredAndSortedGames.length})
          </Text>
        </View>
      );
    }

    if (filteredAndSortedGames.length > PAGE_SIZE) {
      return (
        <View style={styles.footerEnd}>
          <Text style={[styles.footerEndText, { color: colors.textMuted }]}>
            ✨ All {filteredAndSortedGames.length} games loaded
          </Text>
        </View>
      );
    }

    return null;
  };

  const renderEmpty = () => {
    if (loading) return <SkeletonGameList count={5} />;

    return (
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
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={displayedGames}
        renderItem={renderGameCard}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  listContent: {
    paddingBottom: 40
  },
  headerContainer: {
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    marginBottom: 12
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
    paddingBottom: 10
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
  resultsMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4
  },
  resultsTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3
  },
  resultsCount: {
    fontSize: 12,
    fontWeight: '600'
  },
  gameCardWrapper: {
    borderRadius: 18,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#517bfd',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3
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
  footerLoader: {
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  footerLoaderText: {
    fontSize: 12,
    fontWeight: '600'
  },
  footerEnd: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  footerEndText: {
    fontSize: 12,
    fontWeight: '700'
  },
  emptyState: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    marginHorizontal: 16,
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
