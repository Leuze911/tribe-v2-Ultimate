import { View, Text, FlatList, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, spacing, borderRadius, fontSize, shadows } from '../../src/utils/theme';

export default function MyPOIsScreen() {
  const pois: any[] = []; // Would come from useMyPOIs()

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.gray[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes POI</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{pois.length}</Text>
        </View>
      </View>

      <FlatList
        data={pois}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.poiCard}>
            <View style={styles.poiIcon}>
              <Ionicons name="location" size={24} color={colors.primary[500]} />
            </View>
            <View style={styles.poiInfo}>
              <Text style={styles.poiName}>{item.name}</Text>
              <Text style={styles.poiCategory}>{item.category}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
          </View>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="location-outline" size={64} color={colors.gray[300]} />
            </View>
            <Text style={styles.emptyTitle}>Aucun POI cree</Text>
            <Text style={styles.emptySubtext}>
              Explorez la carte et ajoutez vos premiers points d'interet !
            </Text>
            <TouchableOpacity
              style={styles.addFirstButton}
              onPress={() => router.back()}
            >
              <Ionicons name="add" size={20} color={colors.white} />
              <Text style={styles.addFirstButtonText}>Ajouter un POI</Text>
            </TouchableOpacity>
          </View>
        }
      />
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
    marginRight: spacing.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.gray[900]
  },
  countBadge: {
    backgroundColor: colors.primary[100],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full
  },
  countText: {
    color: colors.primary[600],
    fontWeight: '600'
  },
  listContent: {
    padding: spacing.lg,
    flexGrow: 1
  },
  poiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...Platform.select({
      ios: shadows.md,
      android: { elevation: 2 },
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
    }),
  },
  poiIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  poiInfo: {
    flex: 1,
  },
  poiName: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.gray[900]
  },
  poiCategory: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginTop: spacing.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
    flex: 1,
    justifyContent: 'center'
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  emptyTitle: {
    color: colors.gray[700],
    fontSize: fontSize.xl,
    fontWeight: '600',
  },
  emptySubtext: {
    color: colors.gray[500],
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing['3xl'],
    lineHeight: 22,
  },
  addFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  addFirstButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: fontSize.base,
  },
});
