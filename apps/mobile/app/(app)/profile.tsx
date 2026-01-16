import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/store/auth';
import { colors, spacing, borderRadius, fontSize, shadows } from '../../src/utils/theme';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  const stats = [
    { label: 'POI crees', value: user?.totalPois || 0, icon: 'location' },
    { label: 'Niveau', value: user?.level || 1, icon: 'star' },
    { label: 'XP Total', value: user?.xp || 0, icon: 'flash' },
  ];

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.gray[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profil</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton} testID="logout-button">
          <Ionicons name="log-out-outline" size={24} color={colors.red[500]} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={48} color={colors.white} />
            </View>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>{user?.level || 1}</Text>
            </View>
          </View>
          <Text style={styles.userName}>{user?.displayName || user?.username || 'Utilisateur'}</Text>
          <Text style={styles.userHandle}>@{user?.username || 'user'}</Text>

          <View style={styles.xpContainer}>
            <View style={styles.xpLabels}>
              <Text style={styles.xpLevelText}>Niveau {user?.level || 1}</Text>
              <Text style={styles.xpValueText}>{user?.xp || 0} / {user?.xpToNextLevel || 100} XP</Text>
            </View>
            <View style={styles.xpBar}>
              <View style={[styles.xpFill, { width: `${((user?.xp || 0) / (user?.xpToNextLevel || 100)) * 100}%` }]} />
            </View>
          </View>
        </View>

        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <View key={stat.label} style={[styles.statItem, index < stats.length - 1 && styles.statBorder]}>
              <View style={styles.statIcon}>
                <Ionicons name={stat.icon as any} size={24} color={colors.primary[500]} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Badges</Text>
          <View style={styles.badgesEmpty}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="trophy-outline" size={48} color={colors.gray[300]} />
            </View>
            <Text style={styles.emptyText}>Pas encore de badges</Text>
            <Text style={styles.emptySubtext}>Continuez a explorer pour debloquer des badges !</Text>
          </View>
        </View>

        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/settings' as any)}>
            <View style={styles.actionIcon}>
              <Ionicons name="settings-outline" size={22} color={colors.gray[600]} />
            </View>
            <Text style={styles.actionText}>Parametres</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/profile/edit' as any)}>
            <View style={styles.actionIcon}>
              <Ionicons name="create-outline" size={22} color={colors.gray[600]} />
            </View>
            <Text style={styles.actionText}>Modifier le profil</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <View style={styles.actionIcon}>
              <Ionicons name="help-circle-outline" size={22} color={colors.gray[600]} />
            </View>
            <Text style={styles.actionText}>Aide et support</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.actionButtonDanger]}>
            <View style={[styles.actionIcon, styles.actionIconDanger]}>
              <Ionicons name="log-out-outline" size={22} color={colors.red[500]} />
            </View>
            <Text style={styles.actionTextDanger}>Deconnexion</Text>
          </TouchableOpacity>
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
    justifyContent: 'space-between',
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
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.gray[900]
  },
  logoutButton: { padding: spacing.sm },
  content: { flex: 1 },
  profileHeader: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing['3xl'],
    alignItems: 'center'
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: shadows.lg,
      android: { elevation: 8 },
      web: { boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)' },
    }),
  },
  levelBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.yellow[500],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.white,
  },
  levelBadgeText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: fontSize.sm,
  },
  userName: {
    fontSize: fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.gray[900]
  },
  userHandle: { color: colors.gray[500], marginTop: spacing.xs },
  xpContainer: {
    width: '100%',
    marginTop: spacing['2xl'],
    paddingHorizontal: spacing.lg
  },
  xpLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm
  },
  xpLevelText: {
    color: colors.primary[600],
    fontWeight: '600'
  },
  xpValueText: {
    color: colors.gray[500],
    fontSize: fontSize.sm
  },
  xpBar: {
    height: 12,
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.full,
    overflow: 'hidden'
  },
  xpFill: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.full
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    marginTop: spacing.sm,
    paddingVertical: spacing.lg,
    ...Platform.select({
      ios: shadows.sm,
      android: { elevation: 2 },
    }),
  },
  statItem: { flex: 1, alignItems: 'center' },
  statBorder: {
    borderRightWidth: 1,
    borderRightColor: colors.gray[100]
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.gray[900]
  },
  statLabel: {
    color: colors.gray[500],
    fontSize: fontSize.sm
  },
  section: {
    backgroundColor: colors.white,
    marginTop: spacing.sm,
    padding: spacing['2xl']
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: spacing.lg
  },
  badgesEmpty: {
    alignItems: 'center',
    paddingVertical: spacing['2xl']
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyText: {
    color: colors.gray[600],
    fontWeight: '500',
    fontSize: fontSize.base
  },
  emptySubtext: {
    color: colors.gray[400],
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  actionsSection: {
    backgroundColor: colors.white,
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  actionButtonDanger: {
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    marginTop: spacing.sm,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.gray[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  actionIconDanger: {
    backgroundColor: colors.red[100],
  },
  actionText: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.gray[700],
    fontWeight: '500',
  },
  actionTextDanger: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.red[600],
    fontWeight: '500',
  },
});
