/**
 * TRIBE v2 - useOffline Hook (Web Version)
 *
 * Web-compatible version that uses browser APIs instead of native modules.
 * Uses the web-compatible sync and database services.
 */

import { useEffect, useState } from 'react';
import { syncService, SyncStatus } from '../services/sync';
import { databaseService, OfflinePOI } from '../services/database';

export function useOffline() {
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [offlinePOIs, setOfflinePOIs] = useState<OfflinePOI[]>([]);
  const [syncStats, setSyncStats] = useState({
    totalOfflinePOIs: 0,
    pendingPOIs: 0,
    syncedPOIs: 0,
    errorPOIs: 0,
    queuedItems: 0,
    isOnline: true,
    isSyncing: false,
  });

  /**
   * Initialize and subscribe to sync status
   */
  useEffect(() => {
    const unsubscribe = syncService.onSyncStatusChange((status) => {
      setSyncStatus(status);
      // Reload data when sync status changes
      if (status === 'idle') {
        loadOfflinePOIs();
        loadSyncStats();
      }
    });

    // Update online status using browser API
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);

    // Initial data load
    loadOfflinePOIs();
    loadSyncStats();

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  /**
   * Load offline POIs
   */
  const loadOfflinePOIs = async () => {
    try {
      const pois = await databaseService.getAllPOIs();
      setOfflinePOIs(pois);
    } catch (error) {
      console.error('Failed to load offline POIs:', error);
    }
  };

  /**
   * Load sync statistics
   */
  const loadSyncStats = async () => {
    try {
      const stats = await syncService.getSyncStats();
      setSyncStats(stats);
    } catch (error) {
      console.error('Failed to load sync stats:', error);
    }
  };

  /**
   * Create POI offline
   */
  const createPOIOffline = async (
    poi: Omit<OfflinePOI, 'id' | 'createdAt' | 'syncStatus'>
  ): Promise<OfflinePOI> => {
    try {
      const savedPOI = await databaseService.insertPOI(poi);
      await loadOfflinePOIs(); // Refresh list
      await loadSyncStats(); // Refresh stats

      // Trigger sync if online
      if (isOnline) {
        syncService.sync().catch(console.error);
      }

      return savedPOI;
    } catch (error) {
      console.error('Failed to create POI offline:', error);
      throw error;
    }
  };

  /**
   * Force sync now
   */
  const triggerSync = async () => {
    try {
      await syncService.forceSyncNow();
      await loadOfflinePOIs();
      await loadSyncStats();
    } catch (error) {
      console.error('Failed to trigger sync:', error);
      throw error;
    }
  };

  /**
   * Get pending POIs count
   */
  const getPendingCount = () => {
    return offlinePOIs.filter((poi) => poi.syncStatus === 'pending').length;
  };

  /**
   * Clear all offline data (for testing/reset)
   */
  const clearOfflineData = async () => {
    try {
      await databaseService.clearAll();
      await loadOfflinePOIs();
      await loadSyncStats();
    } catch (error) {
      console.error('Failed to clear offline data:', error);
      throw error;
    }
  };

  return {
    // Status
    isOnline,
    syncStatus,
    isSyncing: syncStats.isSyncing,

    // Data
    offlinePOIs,
    syncStats,

    // Actions
    createPOIOffline,
    triggerSync,
    loadOfflinePOIs,
    loadSyncStats,
    clearOfflineData,

    // Utilities
    getPendingCount,
  };
}
