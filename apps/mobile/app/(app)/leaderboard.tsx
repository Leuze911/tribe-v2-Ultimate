import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, spacing, borderRadius, fontSize, shadows } from '../../src/utils/theme';
import { useAuthStore } from '../../src/store/auth';
import api from '../../src/services/api';

interface LeaderboardEntry {
  id: string;
  rank: number;
  fullName: string;
  email: string;
  points: number;
  level: number;
  avatarUrl?: string;
}

export default function LeaderboardScreen() {
  const { user } = useAuthStore();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<'all' | 'month' | 'week'>('all');

  const fetchLeaderboard = async () => {
    try {
      // For demo, we'll create mock data since the endpoint doesn't exist yet
      const mockData: LeaderboardEntry[] = [
        { id: '1', rank: 1, fullName: 'Moussa Diop', email: 'moussa@tribe.sn', points: 2500, level: 6 },
        { id: '2', rank: 2, fullName: 'Fatou Sow', email: 'fatou@tribe.sn', points: 2100, level: 6 },
        { id: '3', rank: 3, fullName: 'Ibrahima Ndiaye', email: 'ibra@tribe.sn', points: 1850, level: 5 },
        { id: '4', rank: 4, fullName: 'Aminata Fall', email: 'aminata@tribe.sn', points: 1500, level: 5 },
        { id: '5', rank: 5, fullName: 'Ousmane Diallo', email: 'ousmane@tribe.sn', points: 1200, level: 4 },
        { id: '6', rank: 6, fullName: 'Aissatou Ba', email: 'aissatou@tribe.sn', points: 980, level: 4 },
        { id: '7', rank: 7, fullName: 'Mamadou Sy', email: 'mamadou@tribe.sn', points: 750, level: 3 },
        { id: '8', rank: 8, fullName: 'Mariama Dieng', email: 'mariama@tribe.sn', points: 620, level: 3 },
        { id: '9', rank: 9, fullName: 'Cheikh Kane', email: 'cheikh@tribe.sn', points: 450, level: 2 },
        { id: '10', rank: 10, fullName: 'Rokhaya Gueye', email: 'rokhaya@tribe.sn', points: 320, level: 2 },
      ];
      setLeaderboard(mockData);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [period]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeaderboard();
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return colors.yellow[500];
    if (rank === 2) return colors.gray[400];
    if (rank === 3) return '#CD7F32'; // Bronze
    return colors.gray[300];
  };

  const getRankIcon = (rank: number) => {
    if (rank <= 3) return 'trophy';
    return 'ribbon';
  };

  const renderItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
    const isCurrentUser = user?.id === item.id;
    const isTopThree = item.rank <= 3;

    return (
      <View style={[styles.rankItem, isCurrentUser && styles.currentUserItem]}>
        <View style={styles.rankBadge}>
          {isTopThree ? (
            <View style={[styles.trophyBadge, { backgroundColor: getRankColor(item.rank) }]}>
              <Ionicons name={getRankIcon(item.rank)} size={16} color={colors.white} />
            </View>
          ) : (
            <Text style={styles.rankNumber}>{item.rank}</Text>
          )}
        </View>

        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, isTopThree && styles.topThreeAvatar]}>
            <Text style={styles.avatarText}>{item.fullName.charAt(0)}</Text>
          </View>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>{item.level}</Text>
          </View>
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.fullName}</Text>
          <Text style={styles.userPoints}>{item.points.toLocaleString()} pts</Text>
        </View>

        {isCurrentUser && (
          <View style={styles.youBadge}>
            <Text style={styles.youBadgeText}>Vous</Text>
          </View>
        )}
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContent}>
      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {(['all', 'month', 'week'] as const).map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.periodButton, period === p && styles.periodButtonActive]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.periodButtonText, period === p && styles.periodButtonTextActive]}>
              {p === 'all' ? 'Global' : p === 'month' ? 'Ce mois' : 'Cette semaine'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Top 3 Podium */}
      {leaderboard.length >= 3 && (
        <View style={styles.podium}>
          {/* 2nd Place */}
          <View style={styles.podiumItem}>
            <View style={[styles.podiumAvatar, styles.podiumSecond]}>
              <Text style={styles.podiumAvatarText}>{leaderboard[1].fullName.charAt(0)}</Text>
            </View>
            <View style={[styles.podiumBar, styles.podiumBarSecond]}>
              <Ionicons name="trophy" size={20} color={colors.gray[400]} />
              <Text style={styles.podiumRank}>2</Text>
            </View>
            <Text style={styles.podiumName} numberOfLines={1}>{leaderboard[1].fullName}</Text>
            <Text style={styles.podiumPoints}>{leaderboard[1].points}</Text>
          </View>

          {/* 1st Place */}
          <View style={styles.podiumItem}>
            <View style={[styles.podiumAvatar, styles.podiumFirst]}>
              <Text style={styles.podiumAvatarText}>{leaderboard[0].fullName.charAt(0)}</Text>
            </View>
            <View style={[styles.podiumBar, styles.podiumBarFirst]}>
              <Ionicons name="trophy" size={24} color={colors.yellow[500]} />
              <Text style={styles.podiumRank}>1</Text>
            </View>
            <Text style={styles.podiumName} numberOfLines={1}>{leaderboard[0].fullName}</Text>
            <Text style={styles.podiumPoints}>{leaderboard[0].points}</Text>
          </View>

          {/* 3rd Place */}
          <View style={styles.podiumItem}>
            <View style={[styles.podiumAvatar, styles.podiumThird]}>
              <Text style={styles.podiumAvatarText}>{leaderboard[2].fullName.charAt(0)}</Text>
            </View>
            <View style={[styles.podiumBar, styles.podiumBarThird]}>
              <Ionicons name="trophy" size={18} color="#CD7F32" />
              <Text style={styles.podiumRank}>3</Text>
            </View>
            <Text style={styles.podiumName} numberOfLines={1}>{leaderboard[2].fullName}</Text>
            <Text style={styles.podiumPoints}>{leaderboard[2].points}</Text>
          </View>
        </View>
      )}

      <Text style={styles.listTitle}>Classement complet</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.gray[800]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Classement</Text>
        <View style={styles.headerRight} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      ) : (
        <FlatList
          data={leaderboard}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary[500]} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  backButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  headerRight: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    paddingBottom: spacing.lg,
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  periodButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray[100],
  },
  periodButtonActive: {
    backgroundColor: colors.primary[500],
  },
  periodButtonText: {
    color: colors.gray[600],
    fontWeight: '500',
    fontSize: fontSize.sm,
  },
  periodButtonTextActive: {
    color: colors.white,
  },
  podium: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    backgroundColor: colors.primary[50],
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
  },
  podiumItem: {
    flex: 1,
    alignItems: 'center',
  },
  podiumAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  podiumFirst: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.yellow[500],
  },
  podiumSecond: {
    backgroundColor: colors.gray[400],
  },
  podiumThird: {
    backgroundColor: '#CD7F32',
  },
  podiumAvatarText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: fontSize.lg,
  },
  podiumBar: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xs,
  },
  podiumBarFirst: {
    backgroundColor: colors.yellow[100],
    height: 80,
    justifyContent: 'center',
  },
  podiumBarSecond: {
    backgroundColor: colors.gray[100],
    height: 60,
    justifyContent: 'center',
  },
  podiumBarThird: {
    backgroundColor: '#FBE4C9',
    height: 50,
    justifyContent: 'center',
  },
  podiumRank: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.gray[800],
    marginTop: spacing.xs,
  },
  podiumName: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.gray[800],
    maxWidth: 80,
    textAlign: 'center',
  },
  podiumPoints: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    marginTop: spacing.xs,
  },
  listTitle: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.gray[900],
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  listContent: {
    paddingBottom: spacing['3xl'],
  },
  rankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[50],
  },
  currentUserItem: {
    backgroundColor: colors.primary[50],
  },
  rankBadge: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trophyBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumber: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.gray[500],
  },
  avatarContainer: {
    position: 'relative',
    marginRight: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  topThreeAvatar: {
    borderWidth: 2,
    borderColor: colors.yellow[500],
  },
  avatarText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: fontSize.base,
  },
  levelBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.yellow[500],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  levelText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.gray[900],
  },
  userPoints: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginTop: 2,
  },
  youBadge: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  youBadgeText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: 'bold',
  },
});
