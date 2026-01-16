import { useState, useCallback } from 'react';
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
import { colors, spacing, borderRadius, fontSize } from '../../src/utils/theme';
import { useLeaderboard } from '../../src/hooks/useRewards';
import { LeaderboardEntry } from '../../src/services/rewards';

type PeriodType = 'all_time' | 'monthly' | 'weekly';

export default function LeaderboardScreen() {
  const [period, setPeriod] = useState<PeriodType>('all_time');
  const { data: leaderboardData, isLoading, refetch } = useLeaderboard(period, 50);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const leaderboard = leaderboardData?.entries || [];
  const currentUserRank = leaderboardData?.currentUserRank;

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

  const renderItem = ({ item }: { item: LeaderboardEntry }) => {
    const isTopThree = item.rank <= 3;

    return (
      <View style={[styles.rankItem, item.isCurrentUser && styles.currentUserItem]}>
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
            <Text style={styles.avatarText}>{item.username.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>{item.level}</Text>
          </View>
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.username}</Text>
          <View style={styles.statsRow}>
            <Text style={styles.userPoints}>{item.points.toLocaleString()} pts</Text>
            <Text style={styles.poiCount}>{item.poisCount} POIs</Text>
          </View>
        </View>

        {item.isCurrentUser && (
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
        {([
          { key: 'all_time', label: 'Global' },
          { key: 'monthly', label: 'Ce mois' },
          { key: 'weekly', label: 'Cette semaine' },
        ] as const).map((p) => (
          <TouchableOpacity
            key={p.key}
            style={[styles.periodButton, period === p.key && styles.periodButtonActive]}
            onPress={() => setPeriod(p.key)}
          >
            <Text style={[styles.periodButtonText, period === p.key && styles.periodButtonTextActive]}>
              {p.label}
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
              <Text style={styles.podiumAvatarText}>{leaderboard[1].username.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={[styles.podiumBar, styles.podiumBarSecond]}>
              <Ionicons name="trophy" size={20} color={colors.gray[400]} />
              <Text style={styles.podiumRank}>2</Text>
            </View>
            <Text style={styles.podiumName} numberOfLines={1}>{leaderboard[1].username}</Text>
            <Text style={styles.podiumPoints}>{leaderboard[1].points.toLocaleString()}</Text>
          </View>

          {/* 1st Place */}
          <View style={styles.podiumItem}>
            <View style={[styles.podiumAvatar, styles.podiumFirst]}>
              <Text style={styles.podiumAvatarText}>{leaderboard[0].username.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={[styles.podiumBar, styles.podiumBarFirst]}>
              <Ionicons name="trophy" size={24} color={colors.yellow[500]} />
              <Text style={styles.podiumRank}>1</Text>
            </View>
            <Text style={styles.podiumName} numberOfLines={1}>{leaderboard[0].username}</Text>
            <Text style={styles.podiumPoints}>{leaderboard[0].points.toLocaleString()}</Text>
          </View>

          {/* 3rd Place */}
          <View style={styles.podiumItem}>
            <View style={[styles.podiumAvatar, styles.podiumThird]}>
              <Text style={styles.podiumAvatarText}>{leaderboard[2].username.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={[styles.podiumBar, styles.podiumBarThird]}>
              <Ionicons name="trophy" size={18} color="#CD7F32" />
              <Text style={styles.podiumRank}>3</Text>
            </View>
            <Text style={styles.podiumName} numberOfLines={1}>{leaderboard[2].username}</Text>
            <Text style={styles.podiumPoints}>{leaderboard[2].points.toLocaleString()}</Text>
          </View>
        </View>
      )}

      {/* Current user rank if not in top */}
      {currentUserRank && currentUserRank.rank > 10 && (
        <View style={styles.currentUserSection}>
          <Text style={styles.currentUserLabel}>Votre position</Text>
          <View style={[styles.rankItem, styles.currentUserItem, styles.currentUserCard]}>
            <View style={styles.rankBadge}>
              <Text style={styles.rankNumber}>{currentUserRank.rank}</Text>
            </View>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{currentUserRank.username.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>{currentUserRank.level}</Text>
              </View>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{currentUserRank.username}</Text>
              <View style={styles.statsRow}>
                <Text style={styles.userPoints}>{currentUserRank.points.toLocaleString()} pts</Text>
                <Text style={styles.poiCount}>{currentUserRank.poisCount} POIs</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      <Text style={styles.listTitle}>Classement complet ({leaderboardData?.totalUsers || 0} joueurs)</Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={64} color={colors.gray[300]} />
      <Text style={styles.emptyText}>Aucun joueur dans le classement</Text>
      <Text style={styles.emptySubtext}>Soyez le premier a contribuer!</Text>
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

      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.loadingText}>Chargement du classement...</Text>
        </View>
      ) : (
        <FlatList
          data={leaderboard}
          renderItem={renderItem}
          keyExtractor={(item) => item.userId}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
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
  loadingText: {
    marginTop: spacing.md,
    color: colors.gray[500],
    fontSize: fontSize.base,
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
  currentUserSection: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  currentUserLabel: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginBottom: spacing.sm,
  },
  currentUserCard: {
    borderRadius: borderRadius.lg,
    marginHorizontal: 0,
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
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  userPoints: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
  },
  poiCount: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
    marginLeft: spacing.md,
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyText: {
    fontSize: fontSize.lg,
    color: colors.gray[500],
    marginTop: spacing.lg,
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
    marginTop: spacing.sm,
  },
});
