import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/store/auth';
import { colors, spacing, borderRadius, fontSize, shadows } from '../../src/utils/theme';

const REWARDS = [
  { id: '1', name: 'Explorateur', description: 'Creez votre premier POI', icon: 'compass', xpRequired: 0 },
  { id: '2', name: 'Decouvreur', description: 'Creez 5 POI', icon: 'search', xpRequired: 50 },
  { id: '3', name: 'Voyageur', description: 'Creez 10 POI', icon: 'airplane', xpRequired: 100 },
  { id: '4', name: 'Cartographe', description: 'Creez 25 POI', icon: 'map', xpRequired: 250 },
  { id: '5', name: 'Guide Local', description: 'Atteignez le niveau 5', icon: 'trophy', xpRequired: 500 },
  { id: '6', name: 'Expert', description: 'Atteignez le niveau 10', icon: 'star', xpRequired: 1000 },
];

export default function RewardsScreen() {
  const { user } = useAuthStore();
  const userXP = user?.xp || 0;
  const earnedCount = REWARDS.filter((r) => userXP >= r.xpRequired).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.gray[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recompenses</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.progressCard}>
          <View style={styles.progressRow}>
            <View>
              <Text style={styles.progressLabel}>Progression</Text>
              <Text style={styles.progressValue}>{earnedCount}/{REWARDS.length}</Text>
              <Text style={styles.progressSubtext}>recompenses obtenues</Text>
            </View>
            <View style={styles.trophyCircle}>
              <Ionicons name="trophy" size={40} color={colors.yellow[500]} />
            </View>
          </View>
          <View style={styles.xpProgress}>
            <View style={styles.xpLabels}>
              <Text style={styles.xpLabel}>XP Total</Text>
              <Text style={styles.xpValue}>{userXP} XP</Text>
            </View>
            <View style={styles.xpBar}>
              <View style={[styles.xpFill, { width: `${Math.min((userXP / 2500) * 100, 100)}%` }]} />
            </View>
          </View>
        </View>

        <View style={styles.rewardsSection}>
          <Text style={styles.sectionTitle}>Toutes les recompenses</Text>
          <View style={styles.rewardsGrid}>
            {REWARDS.map((reward) => {
              const isEarned = userXP >= reward.xpRequired;
              return (
                <View key={reward.id} style={[styles.rewardCard, isEarned && styles.rewardCardEarned]}>
                  <View style={[styles.rewardIcon, isEarned && styles.rewardIconEarned]}>
                    <Ionicons
                      name={reward.icon as any}
                      size={28}
                      color={isEarned ? colors.yellow[600] : colors.gray[400]}
                    />
                  </View>
                  <Text style={[styles.rewardName, !isEarned && styles.rewardNameLocked]}>{reward.name}</Text>
                  <Text style={[styles.rewardDesc, !isEarned && styles.rewardDescLocked]}>{reward.description}</Text>
                  <View style={styles.rewardStatus}>
                    {isEarned ? (
                      <>
                        <Ionicons name="checkmark-circle" size={16} color={colors.primary[500]} />
                        <Text style={styles.earnedText}>Obtenu</Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="lock-closed" size={14} color={colors.gray[400]} />
                        <Text style={styles.lockedText}>{reward.xpRequired} XP requis</Text>
                      </>
                    )}
                  </View>
                </View>
              );
            })}
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
  progressCard: {
    backgroundColor: colors.primary[500],
    margin: spacing.lg,
    borderRadius: borderRadius['2xl'],
    padding: spacing['2xl'],
    ...Platform.select({
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
  },
  rewardCardEarned: {
    backgroundColor: colors.white,
    ...Platform.select({
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
  lockedText: {
    color: colors.gray[400],
    fontSize: fontSize.xs,
    marginLeft: spacing.xs
  },
});
