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
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy, Medal, Star, Flame, Play, Crown, Sparkles, Users } from 'lucide-react-native';
import { getGames } from '../api/clientApi';
import { useTheme } from '../context/ThemeContext';

export default function LeaderboardScreen({ onSelectGame, user }) {
  const { colors, isDark } = useTheme();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('games'); // 'games' | 'players'

  const topPlayers = [
    { rank: 1, username: 'CyberSamurai', score: 14500, avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150', tag: 'Grandmaster' },
    { rank: 2, username: 'NeonValkyrie', score: 12890, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', tag: 'Master' },
    { rank: 3, username: 'PixelGhost', score: 9420, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', tag: 'Diamond' },
    { rank: 4, username: 'SpeedDemon99', score: 7850, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', tag: 'Platinum' },
    { rank: 5, username: user?.username || 'You', score: user?.total_earned || 1000, avatar: user?.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=gameloot', tag: 'Rising Star', isCurrentUser: true },
    { rank: 6, username: 'ArcadeTitan', score: 560, avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150', tag: 'Gold' },
    { rank: 7, username: 'VortexPlayer', score: 420, avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150', tag: 'Silver' }
  ];

  const loadLeaderboardData = async () => {
    try {
      setLoading(true);
      const res = await getGames();
      if (res.success && res.games) {
        // Sort by rating & play count descending
        const sorted = [...res.games].sort((a, b) => (b.rating || 0) - (a.rating || 0) || (b.play_count || 0) - (a.play_count || 0));
        setGames(sorted);
      }
    } catch (e) {
      console.warn('Error loading leaderboard:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLeaderboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadLeaderboardData();
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
      {/* Header */}
      <View style={styles.header}>
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
      </View>

      {/* Segmented Sub Tabs - Learning OS Pill Switcher */}
      <View style={[styles.tabBar, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'games' && { backgroundColor: colors.primary }]}
          onPress={() => setActiveTab('games')}
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
          onPress={() => setActiveTab('players')}
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

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading rankings...</Text>
        </View>
      ) : activeTab === 'games' ? (
        <View style={styles.gamesList}>
          {games.map((game, index) => (
            <TouchableOpacity
              key={game.id}
              style={[
                styles.gameItemCard,
                { backgroundColor: colors.surfaceCard, borderColor: index < 3 ? `${colors.primary}44` : colors.border }
              ]}
              onPress={() => onSelectGame(game)}
              activeOpacity={0.85}
            >
              {/* Rank Position Badge */}
              <View
                style={[
                  styles.rankBadge,
                  index === 0
                    ? { backgroundColor: '#fbbf24' }
                    : index === 1
                    ? { backgroundColor: '#94a3b8' }
                    : index === 2
                    ? { backgroundColor: '#d25087' }
                    : { backgroundColor: colors.surfaceSubtle }
                ]}
              >
                {index === 0 ? (
                  <Crown size={12} color="#060507" />
                ) : (
                  <Text
                    style={[
                      styles.rankText,
                      { color: index < 3 ? '#ffffff' : colors.textSecondary }
                    ]}
                  >
                    #{index + 1}
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
                    • {game.play_count || 120} plays
                  </Text>
                </View>
              </View>

              {/* Action Button */}
              <View style={[styles.playBtn, { backgroundColor: colors.primary }]}>
                <Play size={12} color="#ffffff" fill="#ffffff" />
                <Text style={styles.playBtnText}>PLAY</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        /* Global Players Leaderboard */
        <View style={styles.playersWrap}>
          {/* Top 3 Podium */}
          <View style={styles.podiumRow}>
            {/* Rank 2 */}
            <View style={[styles.podiumCol, { marginTop: 24 }]}>
              <View style={[styles.podiumAvatarWrap, { borderColor: '#94a3b8' }]}>
                <Image source={{ uri: topPlayers[1].avatar }} style={styles.podiumAvatar} />
                <View style={[styles.podiumMedal, { backgroundColor: '#94a3b8' }]}>
                  <Text style={styles.podiumMedalText}>2</Text>
                </View>
              </View>
              <Text style={[styles.podiumUsername, { color: colors.text }]} numberOfLines={1}>
                {topPlayers[1].username}
              </Text>
              <Text style={styles.podiumScore}>{topPlayers[1].score.toLocaleString()} PTS</Text>
            </View>

            {/* Rank 1 */}
            <View style={styles.podiumCol}>
              <Crown size={22} color="#fbbf24" style={{ marginBottom: -4 }} />
              <View style={[styles.podiumAvatarWrap, { borderColor: '#fbbf24', width: 68, height: 68, borderRadius: 34 }]}>
                <Image source={{ uri: topPlayers[0].avatar }} style={[styles.podiumAvatar, { width: 64, height: 64, borderRadius: 32 }]} />
                <View style={[styles.podiumMedal, { backgroundColor: '#fbbf24' }]}>
                  <Text style={styles.podiumMedalText}>1</Text>
                </View>
              </View>
              <Text style={[styles.podiumUsername, { color: colors.text, fontWeight: '900' }]} numberOfLines={1}>
                {topPlayers[0].username}
              </Text>
              <Text style={[styles.podiumScore, { color: colors.gold }]}>{topPlayers[0].score.toLocaleString()} PTS</Text>
            </View>

            {/* Rank 3 */}
            <View style={[styles.podiumCol, { marginTop: 32 }]}>
              <View style={[styles.podiumAvatarWrap, { borderColor: '#d25087' }]}>
                <Image source={{ uri: topPlayers[2].avatar }} style={styles.podiumAvatar} />
                <View style={[styles.podiumMedal, { backgroundColor: '#d25087' }]}>
                  <Text style={styles.podiumMedalText}>3</Text>
                </View>
              </View>
              <Text style={[styles.podiumUsername, { color: colors.text }]} numberOfLines={1}>
                {topPlayers[2].username}
              </Text>
              <Text style={styles.podiumScore}>{topPlayers[2].score.toLocaleString()} PTS</Text>
            </View>
          </View>

          {/* Full Players List */}
          <View style={styles.playersList}>
            {topPlayers.map((player) => (
              <View
                key={player.rank}
                style={[
                  styles.playerRow,
                  { backgroundColor: colors.surfaceCard, borderColor: player.isCurrentUser ? colors.primary : colors.border },
                  player.isCurrentUser && { borderWidth: 1.5 }
                ]}
              >
                <Text style={[styles.playerRank, { color: player.rank <= 3 ? colors.primary : colors.textSecondary }]}>
                  #{player.rank}
                </Text>
                <Image source={{ uri: player.avatar }} style={styles.playerAvatar} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.playerName, { color: colors.text }]}>
                    {player.username} {player.isCurrentUser && '(You)'}
                  </Text>
                  <Text style={[styles.playerTag, { color: colors.textMuted }]}>{player.tag}</Text>
                </View>
                <View style={[styles.playerScorePill, { backgroundColor: `${colors.primary}18` }]}>
                  <Text style={[styles.playerScoreText, { color: colors.primary }]}>{player.score.toLocaleString()} PTS</Text>
                </View>
              </View>
            ))}
          </View>
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
  gamesList: {
    gap: 10
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
    width: 24,
    height: 24,
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
    borderRadius: 12
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
  playersWrap: {
    gap: 20
  },
  podiumRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingVertical: 14,
    paddingHorizontal: 8
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
  playersList: {
    gap: 8
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
    borderRadius: 18
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
  }
});
