import { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Platform, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, spacing, borderRadius, fontSize, shadows } from '../../src/utils/theme';
import { poisService } from '../../src/services/pois';
import { useOffline } from '../../src/hooks/useOffline';
import type { POI } from '../../src/types';

export default function MyPOIsScreen() {
  const [pois, setPois] = useState<POI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { offlinePOIs, isOnline } = useOffline();

  useEffect(() => {
    loadPOIs();
  }, []);

  const loadPOIs = async () => {
    try {
      if (isOnline) {
        const data = await poisService.getMyPOIs();
        setPois(data);
      } else {
        // Show offline POIs
        setPois(offlinePOIs as any);
      }
    } catch (error) {
      console.error('Failed to load POIs:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPOIs();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.gray[700]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mes POI</Text>
          <View style={styles.countBadge} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
          <TouchableOpacity
            style={styles.poiCard}
            onPress={() => {
              // Navigate to POI details or edit
              // router.push(`/poi/${item.id}`);
            }}
          >
            <View style={styles.poiIcon}>
              <Ionicons name="location" size={24} color={colors.primary[500]} />
            </View>
            <View style={styles.poiInfo}>
              <Text style={styles.poiName}>{item.name}</Text>
              <Text style={styles.poiCategory}>{item.category?.name || item.categoryId}</Text>
              <Text style={styles.poiStatus}>
                {item.status === 'validated' && '✅ Validé'}
                {item.status === 'pending' && '⏳ En attente'}
                {item.status === 'rejected' && '❌ Rejeté'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary[500]}
          />
        }
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
  poiStatus: {
    fontSize: fontSize.xs,
    color: colors.gray[600],
    marginTop: spacing.xs,
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
