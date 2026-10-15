import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy, Medal, Star, Flame, Play, Crown, Sparkles, Users } from 'lucide-react-native';
import { getGameLeaderboard, getPlayerLeaderboard } from '../api/clientApi';
import { useTheme } from '../context/ThemeContext';

const PAGE_SIZE = 20;

export default function LeaderboardScreen({ onSelectGame, user }) {
  const { colors, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('games'); // 'games' | 'players'

  // Games Leaderboard State
  const [games, setGames] = useState([]);
  const [gamePage, setGamePage] = useState(1);
  const [hasMoreGames, setHasMoreGames] = useState(true);
  const [loadingGames, setLoadingGames] = useState(true);
  const [loadingMoreGames, setLoadingMoreGames] = useState(false);

  // Players Leaderboard State
  const [players, setPlayers] = useState([]);
  const [playerPage, setPlayerPage] = useState(1);
  const [hasMorePlayers, setHasMorePlayers] = useState(true);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [loadingMorePlayers, setLoadingMorePlayers] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  // 1. Fetch Games Leaderboard (Page 1 or next)
  const fetchGames = useCallback(async (pageToLoad = 1, append = false) => {
    try {
      if (pageToLoad === 1 && !append) {
        setLoadingGames(true);
      } else {
        setLoadingMoreGames(true);
      }

      const res = await getGameLeaderboard(pageToLoad, PAGE_SIZE);
      if (res && res.success) {
        const newGames = res.games || [];
        setGames(prev => append ? [...prev, ...newGames] : newGames);
        setHasMoreGames(res.hasMore ?? (newGames.length === PAGE_SIZE));
        setGamePage(pageToLoad);
      }
    } catch (e) {
      console.warn('Error loading games leaderboard:', e.message);
    } finally {
      setLoadingGames(false);
      setLoadingMoreGames(false);
      setRefreshing(false);
    }
  }, []);

  // 2. Fetch Players Leaderboard (Page 1 or next)
  const fetchPlayers = useCallback(async (pageToLoad = 1, append = false) => {
    try {
      if (pageToLoad === 1 && !append) {
        setLoadingPlayers(true);
      } else {
        setLoadingMorePlayers(true);
      }

      const res = await getPlayerLeaderboard(pageToLoad, PAGE_SIZE);
      if (res && res.success) {
        const newPlayers = res.players || [];
        setPlayers(prev => append ? [...prev, ...newPlayers] : newPlayers);
        setHasMorePlayers(res.hasMore ?? (newPlayers.length === PAGE_SIZE));
        setPlayerPage(pageToLoad);
      }
    } catch (e) {
      console.warn('Error loading players leaderboard:', e.message);
    } finally {
      setLoadingPlayers(false);
      setLoadingMorePlayers(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchGames(1, false);
  }, [fetchGames]);

  // Tab switch
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'players' && players.length === 0) {
      fetchPlayers(1, false);
    } else if (tab === 'games' && games.length === 0) {
      fetchGames(1, false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (activeTab === 'games') {
      fetchGames(1, false);
    } else {
      fetchPlayers(1, false);
    }
  };

  // Lazy loading infinite scroll handlers
  const handleLoadMore = () => {
    if (activeTab === 'games') {
      if (loadingGames || loadingMoreGames || !hasMoreGames) return;
      fetchGames(gamePage + 1, true);
    } else {
      if (loadingPlayers || loadingMorePlayers || !hasMorePlayers) return;
      fetchPlayers(playerPage + 1, true);
    }
  };

  // Top 3 podium players
  const topThree = useMemo(() => {
    if (players.length < 3) return null;
    return [players[0], players[1], players[2]];
  }, [players]);

  // Remaining players for list
  const remainingPlayers = useMemo(() => {
    if (players.length <= 3) return [];
    return players.slice(3);
  }, [players]);

  // Render Game Item Card
  const renderGameItem = useCallback(({ item: game, index }) => {
    const rank = game.rank || index + 1;
    const isTopThree = rank <= 3;
    const badgeColor =
      rank === 1 ? '#fbbf24' :
      rank === 2 ? '#94a3b8' :
      rank === 3 ? '#d25087' : colors.surfaceSubtle;

    return (
      <TouchableOpacity
        style={[
          styles.gameItemCard,
          { backgroundColor: colors.surfaceCard, borderColor: isTopThree ? `${colors.primary}44` : colors.border }
        ]}
        onPress={() => onSelectGame(game)}
        activeOpacity={0.85}
      >
        {/* Rank Position Badge */}
        <View style={[styles.rankBadge, { backgroundColor: badgeColor }]}>
          {rank === 1 ? (
            <Crown size={12} color="#060507" />
          ) : (
            <Text
              style={[
                styles.rankText,
                { color: isTopThree ? '#ffffff' : colors.textSecondary }
              ]}
            >
              #{rank}
            </Text>
          )}
        </View>

        {/* Game Thumbnail */}
        <Image
          source={{ uri: game.thumbnail_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200' }}
          style={styles.thumbImage}
        />

        {/* Title & Stats */}
        <View style={styles.gameInfoCol}>
          <Text style={[styles.gameTitle, { color: colors.text }]} numberOfLines={1}>
            {game.title}
          </Text>
          <View style={styles.metaRow}>
            <View style={styles.ratingRow}>
              <Star size={11} color="#fbbf24" fill="#fbbf24" />
              <Text style={styles.ratingVal}>{game.rating || 4.9}</Text>
            </View>
            <Text style={[styles.playCountText, { color: colors.textSecondary }]}>
              • {(game.play_count || 120).toLocaleString()} plays
            </Text>
            {game.category_name ? (
              <Text style={[styles.categoryPill, { color: colors.textMuted }]}>
                • {game.category_name}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Action Button */}
        <View style={[styles.playBtn, { backgroundColor: colors.primary }]}>
          <Play size={12} color="#ffffff" fill="#ffffff" />
          <Text style={styles.playBtnText}>PLAY</Text>
        </View>
      </TouchableOpacity>
    );
  }, [colors, onSelectGame]);

  // Render Player Row
  const renderPlayerItem = useCallback(({ item: player }) => {
    const isCurrentUser = user && (user.id === player.id || user.username?.toLowerCase() === player.username?.toLowerCase());

    return (
      <View
        style={[
          styles.playerRow,
          {
            backgroundColor: isCurrentUser ? `${colors.primary}15` : colors.surfaceCard,
            borderColor: isCurrentUser ? colors.primary : colors.border
          },
          isCurrentUser && { borderWidth: 1.5 }
        ]}
      >
        <Text style={[styles.playerRank, { color: player.rank <= 3 ? colors.primary : colors.textSecondary }]}>
          #{player.rank}
        </Text>
        <Image source={{ uri: player.avatar }} style={styles.playerAvatar} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.playerName, { color: colors.text }]}>
            {player.username} {isCurrentUser ? '(You)' : ''}
          </Text>
          <Text style={[styles.playerTag, { color: colors.textMuted }]}>{player.tag}</Text>
        </View>
        <View style={[styles.playerScorePill, { backgroundColor: `${colors.primary}18` }]}>
          <Text style={[styles.playerScoreText, { color: colors.primary }]}>
            {(player.score || 0).toLocaleString()} PTS
          </Text>
        </View>
      </View>
    );
  }, [colors, user]);

  // Header Component (Title, description, segmented pill tab bar, podium)
  const renderHeader = () => (
    <View style={styles.header}>
      {/* Title */}
      <View style={styles.titleRow}>
        <View style={[styles.headerIconWrap, { backgroundColor: `${colors.gold}20` }]}>
          <Trophy size={20} color={colors.gold} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>Top Rated & Hall of Fame</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Highest rated arcades and global community high scores
          </Text>
        </View>
      </View>

      {/* Segmented Sub Tabs */}
      <View style={[styles.tabBar, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'games' && { backgroundColor: colors.primary }]}
          onPress={() => handleTabChange('games')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.tabBtnText,
              { color: activeTab === 'games' ? '#ffffff' : colors.textSecondary }
            ]}
          >
            Top Arcades
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'players' && { backgroundColor: colors.primary }]}
          onPress={() => handleTabChange('players')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.tabBtnText,
              { color: activeTab === 'players' ? '#ffffff' : colors.textSecondary }
            ]}
          >
            Global Rankings
          </Text>
        </TouchableOpacity>
      </View>

      {/* Top 3 Podium (Only on Players Tab) */}
      {activeTab === 'players' && topThree && (
        <View style={styles.podiumRow}>
          {/* Rank 2 */}
          <View style={[styles.podiumCol, { marginTop: 24 }]}>
            <View style={[styles.podiumAvatarWrap, { borderColor: '#94a3b8' }]}>
              <Image source={{ uri: topThree[1].avatar }} style={styles.podiumAvatar} />
              <View style={[styles.podiumMedal, { backgroundColor: '#94a3b8' }]}>
                <Text style={styles.podiumMedalText}>2</Text>
              </View>
            </View>
            <Text style={[styles.podiumUsername, { color: colors.text }]} numberOfLines={1}>
              {topThree[1].username}
            </Text>
            <Text style={styles.podiumScore}>{(topThree[1].score || 0).toLocaleString()} PTS</Text>
          </View>

          {/* Rank 1 */}
          <View style={styles.podiumCol}>
            <Crown size={22} color="#fbbf24" style={{ marginBottom: -4 }} />
            <View style={[styles.podiumAvatarWrap, { borderColor: '#fbbf24', width: 68, height: 68, borderRadius: 34 }]}>
              <Image source={{ uri: topThree[0].avatar }} style={[styles.podiumAvatar, { width: 64, height: 64, borderRadius: 32 }]} />
              <View style={[styles.podiumMedal, { backgroundColor: '#fbbf24' }]}>
                <Text style={styles.podiumMedalText}>1</Text>
              </View>
            </View>
            <Text style={[styles.podiumUsername, { color: colors.text, fontWeight: '900' }]} numberOfLines={1}>
              {topThree[0].username}
            </Text>
            <Text style={[styles.podiumScore, { color: colors.gold }]}>{(topThree[0].score || 0).toLocaleString()} PTS</Text>
          </View>

          {/* Rank 3 */}
          <View style={[styles.podiumCol, { marginTop: 32 }]}>
            <View style={[styles.podiumAvatarWrap, { borderColor: '#d25087' }]}>
              <Image source={{ uri: topThree[2].avatar }} style={styles.podiumAvatar} />
              <View style={[styles.podiumMedal, { backgroundColor: '#d25087' }]}>
                <Text style={styles.podiumMedalText}>3</Text>
              </View>
            </View>
            <Text style={[styles.podiumUsername, { color: colors.text }]} numberOfLines={1}>
              {topThree[2].username}
            </Text>
            <Text style={styles.podiumScore}>{(topThree[2].score || 0).toLocaleString()} PTS</Text>
          </View>
        </View>
      )}
    </View>
  );

  // Footer Component (Loading more spinner or end notice)
  const renderFooter = () => {
    const isFetchingMore = activeTab === 'games' ? loadingMoreGames : loadingMorePlayers;
    if (!isFetchingMore) return <View style={{ height: 24 }} />;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={[styles.footerText, { color: colors.textMuted }]}>
          Loading more {activeTab === 'games' ? 'arcades' : 'players'}...
        </Text>
      </View>
    );
  };

  const isInitialLoading = activeTab === 'games' ? loadingGames : loadingPlayers;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {isInitialLoading && !refreshing ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading {activeTab === 'games' ? 'rankings' : 'global players'}...
          </Text>
        </View>
      ) : activeTab === 'games' ? (
        <FlatList
          data={games}
          keyExtractor={(item, index) => `game-${item.id || index}`}
          renderItem={renderGameItem}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={Platform.OS === 'android'}
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      ) : (
        <FlatList
          data={remainingPlayers}
          keyExtractor={(item, index) => `player-${item.id || index}`}
          renderItem={renderPlayerItem}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={Platform.OS === 'android'}
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      )}
    </View>
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
  header: {
    marginBottom: 12
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14
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
    flex: 1,
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12
  },
  loadingText: {
    fontSize: 12
  },
  gameItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12
  },
  rankBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  rankText: {
    fontSize: 11,
    fontWeight: '900'
  },
  thumbImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)'
  },
  gameInfoCol: {
    flex: 1
  },
  gameTitle: {
    fontSize: 13,
    fontWeight: '700'
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3
  },
  ratingVal: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '800'
  },
  playCountText: {
    fontSize: 10
  },
  categoryPill: {
    fontSize: 10
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10
  },
  playBtnText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900'
  },
  podiumRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingVertical: 14,
    paddingHorizontal: 8,
    marginBottom: 8
  },
  podiumCol: {
    alignItems: 'center',
    width: 95
  },
  podiumAvatarWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    padding: 2,
    position: 'relative'
  },
  podiumAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 26
  },
  podiumMedal: {
    position: 'absolute',
    bottom: -6,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center'
  },
  podiumMedalText: {
    color: '#060507',
    fontSize: 10,
    fontWeight: '900'
  },
  podiumUsername: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'center'
  },
  podiumScore: {
    fontSize: 10,
    fontWeight: '800',
    marginTop: 1
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12
  },
  playerRank: {
    fontSize: 12,
    fontWeight: '800',
    width: 26
  },
  playerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)'
  },
  playerName: {
    fontSize: 12,
    fontWeight: '700'
  },
  playerTag: {
    fontSize: 10,
    marginTop: 1
  },
  playerScorePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  playerScoreText: {
    fontSize: 11,
    fontWeight: '800'
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8
  },
  footerText: {
    fontSize: 11
  }
});
