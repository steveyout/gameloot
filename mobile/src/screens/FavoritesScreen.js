import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, Play, Star, Sparkles, Gamepad2, Compass } from 'lucide-react-native';
import { getGames } from '../api/clientApi';
import { useTheme } from '../context/ThemeContext';

const FAVORITES_STORAGE_KEY = '@gameloot_favorites';
const RECENT_GAMES_KEY = '@gameloot_recent_games';

export default function FavoritesScreen({ onSelectGame, onNavigateExplore }) {
  const { colors, isDark } = useTheme();
  const [favoriteGames, setFavoriteGames] = useState([]);
  const [recentGames, setRecentGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('favorites'); // 'favorites' | 'recents'

  const loadData = async () => {
    try {
      setLoading(true);
      const [favsJson, recentsJson, gamesRes] = await Promise.all([
        AsyncStorage.getItem(FAVORITES_STORAGE_KEY),
        AsyncStorage.getItem(RECENT_GAMES_KEY),
        getGames().catch(() => ({ success: false, games: [] }))
      ]);

      const allGames = gamesRes?.success ? gamesRes.games : [];

      let favIds = [];
      if (favsJson) {
        try {
          favIds = JSON.parse(favsJson) || [];
        } catch (_) {}
      }

      let recentsList = [];
      if (recentsJson) {
        try {
          recentsList = JSON.parse(recentsJson) || [];
        } catch (_) {}
      }

      // Filter all games by favorite IDs
      let matchedFavs = allGames.filter((g) => favIds.includes(g.id));
      // Fallback: If player has no favorites yet, recommend top-rated games as starter picks
      if (matchedFavs.length === 0 && allGames.length > 0) {
        matchedFavs = allGames.slice(0, 2);
      }

      setFavoriteGames(matchedFavs);
      setRecentGames(recentsList);
    } catch (e) {
      console.warn('Error loading favorites:', e.message);
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

  const handleToggleFavorite = async (gameId) => {
    try {
      const stored = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
      let list = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(list)) list = [];

      let updated;
      if (list.includes(gameId)) {
        updated = list.filter((id) => id !== gameId);
        setFavoriteGames((prev) => prev.filter((g) => g.id !== gameId));
      } else {
        updated = [...list, gameId];
      }
      await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updated));
    } catch (_) {}
  };

  const displayedList = activeSubTab === 'favorites' ? favoriteGames : recentGames;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scroll}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Screen Title */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={[styles.headerIconWrap, { backgroundColor: `${colors.accent}18` }]}>
            <Heart size={20} color={colors.accent} fill={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.text }]}>My Games & Library</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Quick access to your saved and recently launched arcades
            </Text>
          </View>
        </View>
      </View>

      {/* Segmented Sub Tabs - Learning OS Pill Switcher */}
      <View style={[styles.tabBar, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tabBtn, activeSubTab === 'favorites' && { backgroundColor: colors.accent }]}
          onPress={() => setActiveSubTab('favorites')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.tabBtnText,
              { color: activeSubTab === 'favorites' ? '#ffffff' : colors.textSecondary }
            ]}
          >
            Favorites ({favoriteGames.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeSubTab === 'recents' && { backgroundColor: colors.accent }]}
          onPress={() => setActiveSubTab('recents')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.tabBtnText,
              { color: activeSubTab === 'recents' ? '#ffffff' : colors.textSecondary }
            ]}
          >
            Recently Played ({recentGames.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content List */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading your arcade library...</Text>
        </View>
      ) : displayedList.length > 0 ? (
        <View style={styles.gamesGrid}>
          {displayedList.map((game) => (
            <TouchableOpacity
              key={game.id}
              style={[styles.gameCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}
              onPress={() => onSelectGame(game)}
              activeOpacity={0.9}
            >
              <Image
                source={{ uri: game.banner_url || game.thumbnail_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600' }}
                style={styles.cardBanner}
              />
              <LinearGradient
                colors={['transparent', 'rgba(11, 12, 18, 0.85)']}
                style={styles.cardGradient}
              />

              {/* Heart Favorite Toggle Button */}
              <TouchableOpacity
                style={[styles.heartBtn, { borderColor: `${colors.accent}66` }]}
                onPress={() => handleToggleFavorite(game.id)}
                activeOpacity={0.7}
              >
                <Heart size={16} color={colors.accent} fill={colors.accent} />
              </TouchableOpacity>

              {/* Game Info Bottom Row */}
              <View style={styles.cardInfo}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.gameTitle} numberOfLines={1}>
                    {game.title}
                  </Text>
                  <View style={styles.metaRow}>
                    <View style={styles.ratingBadge}>
                      <Star size={11} color="#fbbf24" fill="#fbbf24" />
                      <Text style={styles.ratingText}>{game.rating || 4.9}</Text>
                    </View>
                    <Text style={styles.categoryTag}>{game.category_name || 'Arcade'}</Text>
                  </View>
                </View>

                {/* Play Button */}
                <View style={[styles.playActionBadge, { backgroundColor: colors.primary }]}>
                  <Play size={14} color="#ffffff" fill="#ffffff" />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={[styles.emptyWrap, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
          <Gamepad2 size={44} color={colors.accent} style={{ opacity: 0.8 }} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {activeSubTab === 'favorites' ? 'No Favorites Saved Yet' : 'No Recent Games Yet'}
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            {activeSubTab === 'favorites'
              ? 'Tap the heart icon on any game in the arcade catalog to save it to your library!'
              : 'Launch any game from the home feed and it will appear here for fast resume.'}
          </Text>
        </View>
      )}
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
  header: {
    marginBottom: 16
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  headerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3
  },
  subtitle: {
    fontSize: 11,
    marginTop: 2
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 10
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700'
  },
  loadingWrap: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12
  },
  loadingText: {
    fontSize: 12
  },
  gamesGrid: {
    gap: 14
  },
  gameCard: {
    borderRadius: 20,
    overflow: 'hidden',
    height: 160,
    position: 'relative',
    borderWidth: 1
  },
  cardBanner: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover'
  },
  cardGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100
  },
  heartBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1
  },
  cardInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12
  },
  gameTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800'
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  ratingText: {
    color: '#fbbf24',
    fontSize: 10,
    fontWeight: '800'
  },
  categoryTag: {
    color: '#cbd5e1',
    fontSize: 10,
    fontWeight: '600',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  playActionBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#517bfd',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4
  },
  emptyWrap: {
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginTop: 10,
    gap: 10
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 6
  },
  emptySubtitle: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16
  }
});
