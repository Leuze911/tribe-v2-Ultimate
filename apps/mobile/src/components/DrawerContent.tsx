import { View, Text, TouchableOpacity, StyleSheet, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '../store/auth';
import { colors, spacing, borderRadius, fontSize, shadows } from '../utils/theme';

type DrawerContentProps = {
  closeDrawer: () => void;
};

type MenuItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  route: string;
  badge?: number;
};

const menuItems: MenuItem[] = [
  { icon: 'location', label: 'Mes POI', route: '/my-pois' },
  { icon: 'trophy', label: 'Recompenses', route: '/rewards' },
  { icon: 'podium', label: 'Classement', route: '/leaderboard' },
  { icon: 'chatbubbles', label: 'Assistant IA', route: '/chat' },
  { icon: 'settings', label: 'Parametres', route: '/settings' },
];

export default function DrawerContent({ closeDrawer }: DrawerContentProps) {
  const { user, logout } = useAuthStore();

  const handleNavigation = (route: string) => {
    closeDrawer();
    router.push(route as any);
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  // XP to next level: level * 100 (simple formula)
  const xpToNextLevel = user?.xpToNextLevel ?? (user?.level ?? 1) * 100;
  const xpProgress = user ? (user.points / xpToNextLevel) * 100 : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Profile Header */}
      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={32} color={colors.white} />
          </View>
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>{user?.level || 1}</Text>
          </View>
        </View>

        <Text style={styles.userName}>{user?.fullName || 'Utilisateur'}</Text>
        <Text style={styles.userEmail}>{user?.email || 'email@exemple.com'}</Text>

        {/* XP Progress Bar */}
        <View style={styles.xpContainer}>
          <View style={styles.xpInfo}>
            <Text style={styles.xpText}>{user?.points || 0} XP</Text>
            <Text style={styles.xpNextLevel}>Niveau {(user?.level || 1) + 1}</Text>
          </View>
          <View style={styles.xpBarBackground}>
            <View style={[styles.xpBarFill, { width: `${xpProgress}%` }]} />
          </View>
          <Text style={styles.xpRemaining}>{xpToNextLevel - (user?.points || 0)} XP restants</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="location" size={18} color={colors.primary[500]} />
            <Text style={styles.statValue}>{user?.totalPois || 0}</Text>
            <Text style={styles.statLabel}>POI</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="medal" size={18} color={colors.yellow[500]} />
            <Text style={styles.statValue}>3</Text>
            <Text style={styles.statLabel}>Badges</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="flame" size={18} color={colors.red[500]} />
            <Text style={styles.statValue}>7</Text>
            <Text style={styles.statLabel}>Serie</Text>
          </View>
        </View>
      </View>

      {/* Menu Items */}
      <View style={styles.menuSection}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.route}
            style={styles.menuItem}
            onPress={() => handleNavigation(item.route)}
          >
            <View style={styles.menuItemIcon}>
              <Ionicons name={item.icon} size={22} color={colors.gray[600]} />
            </View>
            <Text style={styles.menuItemLabel}>{item.label}</Text>
            {item.badge && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.badge}</Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color={colors.red[500]} />
          <Text style={styles.logoutText}>Deconnexion</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Tribe v2.0.0</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  profileSection: {
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  avatarContainer: {
    position: 'relative',
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
  levelBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
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
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.gray[900],
    textAlign: 'center',
  },
  userEmail: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  xpContainer: {
    marginTop: spacing.lg,
  },
  xpInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  xpText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.primary[600],
  },
  xpNextLevel: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
  },
  xpBarBackground: {
    height: 8,
    backgroundColor: colors.gray[100],
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: 4,
  },
  xpRemaining: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginTop: spacing.xs,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.gray[100],
  },
  menuSection: {
    flex: 1,
    paddingTop: spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.gray[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  menuItemLabel: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.gray[700],
    fontWeight: '500',
  },
  badge: {
    backgroundColor: colors.primary[500],
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginRight: spacing.sm,
  },
  badgeText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: 'bold',
  },
  footer: {
    padding: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.red[100],
  },
  logoutText: {
    marginLeft: spacing.sm,
    color: colors.red[600],
    fontWeight: '600',
    fontSize: fontSize.base,
  },
  version: {
    textAlign: 'center',
    fontSize: fontSize.xs,
    color: colors.gray[400],
    marginTop: spacing.md,
  },
});
