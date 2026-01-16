import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Platform, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, spacing, borderRadius, fontSize, shadows } from '../../src/utils/theme';
import { poisService } from '../../src/services/pois';
import { useOffline } from '../../src/hooks/useOffline';
import { OfflineIndicator } from '../../src/components/OfflineIndicator';
import type { POI } from '../../src/types';
import { OfflinePOI } from '../../src/services/database';

interface DisplayPOI {
  id: string;
  name: string;
  category?: { name: string };
  categoryId?: string;
  status?: string;
  isOffline?: boolean;
  syncStatus?: OfflinePOI['syncStatus'];
  syncError?: string;
}

export default function MyPOIsScreen() {
  const [remotePois, setRemotePois] = useState<POI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const {
    offlinePOIs,
    isOnline,
    loadOfflinePOIs,
    loadSyncStats,
    triggerSync,
    syncStats,
  } = useOffline();

  useEffect(() => {
    loadAllPOIs();
  }, []);

  // Reload offline POIs when they change
  useEffect(() => {
    loadOfflinePOIs();
  }, []);

  const loadAllPOIs = async () => {
    try {
      // Load offline POIs first
      await loadOfflinePOIs();
      await loadSyncStats();

      // Try to load remote POIs if online
      if (isOnline) {
        try {
          const data = await poisService.getMyPOIs();
          setRemotePois(data);
        } catch (error) {
          console.error('Failed to load remote POIs:', error);
        }
      }
    } catch (error) {
      console.error('Failed to load POIs:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    // Trigger sync if online
    if (isOnline) {
      try {
        await triggerSync();
      } catch (error) {
        console.error('Sync failed:', error);
      }
    }

    await loadAllPOIs();
  }, [isOnline, triggerSync]);

  // Combine remote and pending offline POIs
  const combinedPOIs: DisplayPOI[] = [
    // Pending offline POIs first (not yet synced)
    ...offlinePOIs
      .filter(poi => poi.syncStatus !== 'synced')
      .map(poi => ({
        id: poi.id,
        name: poi.name,
        categoryId: poi.categoryId,
        status: 'pending',
        isOffline: true,
        syncStatus: poi.syncStatus,
        syncError: poi.syncError,
      })),
    // Remote POIs
    ...remotePois.map(poi => ({
      id: poi.id,
      name: poi.name,
      category: poi.category,
      categoryId: poi.category?.id,
      status: 'validated', // Remote POIs are validated
      isOffline: false,
    })),
  ];

  const getSyncStatusDisplay = (poi: DisplayPOI) => {
    if (!poi.isOffline) {
      if (poi.status === 'validated') return { text: 'Valide', icon: 'checkmark-circle', color: colors.primary[500] };
      if (poi.status === 'pending') return { text: 'En attente', icon: 'time', color: colors.yellow[500] };
      if (poi.status === 'rejected') return { text: 'Rejete', icon: 'close-circle', color: colors.red[500] };
      return { text: '', icon: 'ellipse', color: colors.gray[400] };
    }

    switch (poi.syncStatus) {
      case 'pending':
        return { text: 'A synchroniser', icon: 'cloud-upload-outline', color: colors.primary[500] };
      case 'syncing':
        return { text: 'Synchronisation...', icon: 'sync', color: colors.primary[500] };
      case 'error':
        return { text: poi.syncError || 'Erreur', icon: 'alert-circle', color: colors.red[500] };
      default:
        return { text: '', icon: 'ellipse', color: colors.gray[400] };
    }
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
          <Text style={styles.countText}>{combinedPOIs.length}</Text>
        </View>
      </View>

      {/* Offline/Sync Status */}
      <OfflineIndicator showSyncButton={true} />

      <FlatList
        data={combinedPOIs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const statusDisplay = getSyncStatusDisplay(item);

          return (
            <TouchableOpacity
              style={styles.poiCard}
              onPress={() => {
                if (!item.isOffline) {
                  // Navigate to POI details for synced POIs
                  router.push(`/poi/${item.id}` as any);
                }
                // Offline POIs can't be edited until synced
              }}
            >
              <View style={[
                styles.poiIcon,
                item.isOffline && styles.poiIconOffline,
              ]}>
                <Ionicons
                  name={item.isOffline ? 'cloud-offline' : 'location'}
                  size={24}
                  color={item.isOffline ? colors.gray[500] : colors.primary[500]}
                />
              </View>
              <View style={styles.poiInfo}>
                <View style={styles.poiNameRow}>
                  <Text style={styles.poiName}>{item.name}</Text>
                  {item.isOffline && (
                    <View style={styles.offlineBadge}>
                      <Text style={styles.offlineBadgeText}>Hors ligne</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.poiCategory}>
                  {item.category?.name || item.categoryId || 'Non catégorisé'}
                </Text>
                {statusDisplay.text && (
                  <View style={styles.statusRow}>
                    <Ionicons
                      name={statusDisplay.icon as any}
                      size={14}
                      color={statusDisplay.color}
                    />
                    <Text style={[styles.poiStatus, { color: statusDisplay.color }]}>
                      {statusDisplay.text}
                    </Text>
                  </View>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
            </TouchableOpacity>
          );
        }}
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
    borderRadius: borderRadius.full,
    minWidth: 32,
    alignItems: 'center',
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
    ...(Platform.OS === 'ios' ? shadows.md : {}),
    elevation: 2,
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
  poiIconOffline: {
    backgroundColor: colors.gray[100],
  },
  poiInfo: {
    flex: 1,
  },
  poiNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  poiName: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.gray[900],
    flex: 1,
  },
  offlineBadge: {
    backgroundColor: colors.gray[200],
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  offlineBadgeText: {
    fontSize: fontSize.xs,
    color: colors.gray[600],
  },
  poiCategory: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginTop: spacing.xs,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  poiStatus: {
    fontSize: fontSize.xs,
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
