import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState, useCallback } from 'react';
import { useRewards } from '../../src/hooks/useRewards';
import { Badge } from '../../src/services/rewards';
import { colors, spacing, borderRadius, fontSize, shadows, platformShadow } from '../../src/utils/theme';

const TIER_COLORS = {
  bronze: colors.orange[400],
  silver: colors.gray[400],
  gold: colors.yellow[500],
  platinum: colors.purple[400],
};

const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  compass: 'compass',
  'map-pin': 'location',
  navigation: 'navigate',
  map: 'map',
  award: 'ribbon',
  star: 'star',
  'trending-up': 'trending-up',
  trophy: 'trophy',
  flag: 'flag',
  camera: 'camera',
  calendar: 'calendar',
  utensils: 'restaurant',
};

export default function RewardsScreen() {
  const { data: rewardsData, isLoading, error, refetch } = useRewards();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const getIcon = (iconName: string): keyof typeof Ionicons.glyphMap => {
    return ICON_MAP[iconName] || 'ribbon';
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.gray[700]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Recompenses</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.loadingText}>Chargement des recompenses...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const badges = rewardsData?.badges || [];
  const earnedCount = rewardsData?.earnedBadges || 0;
  const totalBadges = rewardsData?.totalBadges || 0;
  const currentXp = rewardsData?.currentXp || 0;
  const currentLevel = rewardsData?.currentLevel || 1;
  const xpToNextLevel = rewardsData?.xpToNextLevel || 100;
  const progressToNext = currentXp / (currentXp + xpToNextLevel) * 100;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} testID="back-button">
          <Ionicons name="arrow-back" size={24} color={colors.gray[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recompenses</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        testID="rewards-list"
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.progressCard}>
          <View style={styles.progressRow}>
            <View>
              <Text style={styles.progressLabel}>Niveau {currentLevel}</Text>
              <Text style={styles.progressValue}>{earnedCount}/{totalBadges}</Text>
              <Text style={styles.progressSubtext}>badges obtenus</Text>
            </View>
            <View style={styles.trophyCircle}>
              <Ionicons name="trophy" size={40} color={colors.yellow[500]} />
            </View>
          </View>
          <View style={styles.xpProgress}>
            <View style={styles.xpLabels}>
              <Text style={styles.xpLabel}>XP Total</Text>
              <Text style={styles.xpValue}>{currentXp} XP</Text>
            </View>
            <View style={styles.xpBar}>
              <View style={[styles.xpFill, { width: `${Math.min(progressToNext, 100)}%` }]} />
            </View>
            <Text style={styles.xpNextLevel}>{xpToNextLevel} XP pour le niveau suivant</Text>
          </View>
        </View>

        {error && (
          <View style={styles.errorCard}>
            <Ionicons name="warning" size={24} color={colors.red[500]} />
            <Text style={styles.errorText}>Erreur de chargement. Tirez pour rafraichir.</Text>
          </View>
        )}

        <View style={styles.rewardsSection}>
          <Text style={styles.sectionTitle}>Tous les badges</Text>
          <View style={styles.rewardsGrid}>
            {badges.map((badge: Badge) => (
              <View key={badge.id} style={[styles.rewardCard, badge.isEarned && styles.rewardCardEarned]}>
                <View style={[
                  styles.rewardIcon,
                  badge.isEarned && styles.rewardIconEarned,
                  badge.isEarned && { backgroundColor: `${TIER_COLORS[badge.tier]}20` }
                ]}>
                  <Ionicons
                    name={getIcon(badge.icon)}
                    size={28}
                    color={badge.isEarned ? TIER_COLORS[badge.tier] : colors.gray[400]}
                  />
                </View>
                <View style={[styles.tierBadge, { backgroundColor: TIER_COLORS[badge.tier] }]}>
                  <Text style={styles.tierText}>{badge.tier.toUpperCase()}</Text>
                </View>
                <Text style={[styles.rewardName, !badge.isEarned && styles.rewardNameLocked]}>
                  {badge.name}
                </Text>
                <Text style={[styles.rewardDesc, !badge.isEarned && styles.rewardDescLocked]}>
                  {badge.description}
                </Text>
                {!badge.isEarned && badge.progress > 0 && (
                  <View style={styles.progressBarContainer}>
                    <View style={[styles.progressBarFill, { width: `${badge.progress}%` }]} />
                    <Text style={styles.progressText}>{badge.progress}%</Text>
                  </View>
                )}
                <View style={styles.rewardStatus}>
                  {badge.isEarned ? (
                    <>
                      <Ionicons name="checkmark-circle" size={16} color={colors.primary[500]} />
                      <Text style={styles.earnedText}>Obtenu</Text>
                      {badge.xpReward > 0 && (
                        <Text style={styles.xpRewardText}>+{badge.xpReward} XP</Text>
                      )}
                    </>
                  ) : (
                    <>
                      <Ionicons name="lock-closed" size={14} color={colors.gray[400]} />
                      <Text style={styles.lockedText}>
                        {badge.poisRequired > 0
                          ? `${badge.poisRequired} POIs requis`
                          : badge.xpRequired > 0
                            ? `${badge.xpRequired} XP requis`
                            : 'Verrouillee'}
                      </Text>
                    </>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50]
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.gray[900],
    textAlign: 'center'
  },
  content: { flex: 1 },
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
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.red[50],
    margin: spacing.lg,
    marginTop: 0,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  errorText: {
    color: colors.red[700],
    marginLeft: spacing.sm,
    flex: 1,
  },
  progressCard: {
    backgroundColor: colors.primary[500],
    margin: spacing.lg,
    borderRadius: borderRadius['2xl'],
    padding: spacing['2xl'],
    ...platformShadow({
      ios: shadows.lg,
      android: { elevation: 8 },
      web: { boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)' },
    }),
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  progressLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: fontSize.sm
  },
  progressValue: {
    color: colors.white,
    fontSize: fontSize['3xl'],
    fontWeight: 'bold',
    marginTop: spacing.xs
  },
  progressSubtext: { color: 'rgba(255,255,255,0.8)' },
  trophyCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  xpProgress: { marginTop: spacing['2xl'] },
  xpLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm
  },
  xpLabel: { color: 'rgba(255,255,255,0.8)' },
  xpValue: { color: colors.white, fontWeight: '600' },
  xpBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: borderRadius.full,
    overflow: 'hidden'
  },
  xpFill: {
    height: '100%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.full
  },
  xpNextLevel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: fontSize.xs,
    marginTop: spacing.sm,
    textAlign: 'right',
  },
  rewardsSection: { padding: spacing.lg },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: spacing.lg
  },
  rewardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md
  },
  rewardCard: {
    width: '47%',
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius['2xl'],
    padding: spacing.lg,
    position: 'relative',
  },
  rewardCardEarned: {
    backgroundColor: colors.white,
    ...platformShadow({
      ios: shadows.md,
      android: { elevation: 4 },
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
    }),
  },
  rewardIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  rewardIconEarned: { backgroundColor: colors.yellow[100] },
  tierBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  tierText: {
    color: colors.white,
    fontSize: 8,
    fontWeight: 'bold',
  },
  rewardName: {
    fontWeight: 'bold',
    color: colors.gray[900],
    fontSize: fontSize.base
  },
  rewardNameLocked: { color: colors.gray[400] },
  rewardDesc: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    marginTop: spacing.xs
  },
  rewardDescLocked: { color: colors.gray[400] },
  progressBarContainer: {
    height: 6,
    backgroundColor: colors.gray[200],
    borderRadius: borderRadius.full,
    marginTop: spacing.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary[400],
    borderRadius: borderRadius.full,
  },
  progressText: {
    position: 'absolute',
    right: 0,
    top: -14,
    fontSize: 10,
    color: colors.gray[500],
  },
  rewardStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md
  },
  earnedText: {
    color: colors.primary[600],
    fontSize: fontSize.xs,
    fontWeight: '600',
    marginLeft: spacing.xs
  },
  xpRewardText: {
    color: colors.yellow[600],
    fontSize: fontSize.xs,
    fontWeight: '600',
    marginLeft: 'auto',
  },
  lockedText: {
    color: colors.gray[400],
    fontSize: fontSize.xs,
    marginLeft: spacing.xs
  },
});
