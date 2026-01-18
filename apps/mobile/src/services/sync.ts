/**
 * TRIBE v2 - Sync Service
 *
 * Handles synchronization between local offline storage and remote API
 * - Monitors network status
 * - Processes sync queue
 * - Handles conflicts
 * - Background sync with expo-background-fetch
 */

import { Platform } from 'react-native';
import { databaseService, OfflinePOI, SyncQueueItem } from './database';
import { poisService } from './pois';

// Conditional imports for native-only modules
let NetInfo: any = null;
let TaskManager: any = null;
let BackgroundFetch: any = null;

if (Platform.OS !== 'web') {
  NetInfo = require('@react-native-community/netinfo').default;
  TaskManager = require('expo-task-manager');
  BackgroundFetch = require('expo-background-fetch');
}

const SYNC_TASK_NAME = 'background-sync';

export type SyncStatus = 'idle' | 'syncing' | 'error';

class SyncService {
  private isOnline: boolean = true;
  private isSyncing: boolean = false;
  private syncCallbacks: Array<(status: SyncStatus) => void> = [];

  /**
   * Initialize sync service
   * - Setup network listener
   * - Register background task
   * - Initialize database
   */
  async init(): Promise<void> {
    console.log('🔄 Initializing sync service...');

    // Skip database init on web (use localStorage fallback)
    if (Platform.OS === 'web') {
      console.log('📱 Web platform detected, using simplified sync');
      // Setup online/offline listeners for web
      if (typeof window !== 'undefined') {
        window.addEventListener('online', () => {
          this.isOnline = true;
          console.log('📡 Network status: ONLINE');
        });
        window.addEventListener('offline', () => {
          this.isOnline = false;
          console.log('📡 Network status: OFFLINE');
        });
        this.isOnline = navigator.onLine;
      }
      console.log('✅ Sync service initialized (web mode)');
      return;
    }

    // Initialize database (native only)
    await databaseService.init();

    // Setup network listener (native only)
    if (NetInfo) {
      NetInfo.addEventListener((state: any) => {
        const wasOnline = this.isOnline;
        this.isOnline = state.isConnected === true && state.isInternetReachable === true;

        console.log(`📡 Network status: ${this.isOnline ? 'ONLINE' : 'OFFLINE'}`);

        // Trigger sync when coming back online
        if (!wasOnline && this.isOnline) {
          console.log('✅ Back online, triggering sync...');
          this.sync().catch(console.error);
        }
      });

      // Get initial network status
      const state = await NetInfo.fetch();
      this.isOnline = state.isConnected === true && state.isInternetReachable === true;
    }

    // Register background sync task (native only)
    await this.registerBackgroundSync();

    console.log('✅ Sync service initialized');
  }

  /**
   * Register background sync task
   */
  private async registerBackgroundSync(): Promise<void> {
    // Skip on web
    if (Platform.OS === 'web' || !TaskManager || !BackgroundFetch) {
      console.log('⏭️ Background sync not available on this platform');
      return;
    }

    try {
      // Define the background task
      TaskManager.defineTask(SYNC_TASK_NAME, async () => {
        try {
          console.log('⏰ Background sync triggered');
          await this.sync();
          return BackgroundFetch.BackgroundFetchResult.NewData;
        } catch (error) {
          console.error('❌ Background sync failed:', error);
          return BackgroundFetch.BackgroundFetchResult.Failed;
        }
      });

      // Register the task
      await BackgroundFetch.registerTaskAsync(SYNC_TASK_NAME, {
        minimumInterval: 15 * 60, // 15 minutes
        stopOnTerminate: false,
        startOnBoot: true,
      });

      console.log('✅ Background sync task registered');
    } catch (error) {
      console.error('❌ Failed to register background sync:', error);
    }
  }

  /**
   * Check if device is online
   */
  isDeviceOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Subscribe to sync status changes
   */
  onSyncStatusChange(callback: (status: SyncStatus) => void): () => void {
    this.syncCallbacks.push(callback);
    return () => {
      this.syncCallbacks = this.syncCallbacks.filter((cb) => cb !== callback);
    };
  }

  /**
   * Notify all listeners of sync status change
   */
  private notifySyncStatus(status: SyncStatus): void {
    this.syncCallbacks.forEach((callback) => callback(status));
  }

  /**
   * Main sync function
   * - Process pending POIs
   * - Process sync queue
   * - Handle conflicts
   */
  async sync(): Promise<void> {
    if (!this.isOnline) {
      console.log('📡 Cannot sync: device is offline');
      return;
    }

    if (this.isSyncing) {
      console.log('⏳ Sync already in progress');
      return;
    }

    this.isSyncing = true;
    this.notifySyncStatus('syncing');

    try {
      console.log('🔄 Starting sync...');

      // Step 1: Sync pending POIs
      await this.syncPendingPOIs();

      // Step 2: Process sync queue
      await this.processSyncQueue();

      console.log('✅ Sync completed successfully');
      this.notifySyncStatus('idle');
    } catch (error) {
      console.error('❌ Sync error:', error);
      this.notifySyncStatus('error');
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sync pending POIs to the server
   */
  private async syncPendingPOIs(): Promise<void> {
    const pendingPOIs = await databaseService.getPendingPOIs();

    if (pendingPOIs.length === 0) {
      console.log('📭 No pending POIs to sync');
      return;
    }

    console.log(`📤 Syncing ${pendingPOIs.length} pending POIs...`);

    for (const poi of pendingPOIs) {
      try {
        // Update status to syncing
        await databaseService.updatePOISyncStatus(poi.id, 'syncing');

        // Send to server
        const remotePOI = await poisService.createPOI({
          name: poi.name,
          description: poi.description,
          categoryId: poi.categoryId,
          latitude: poi.latitude,
          longitude: poi.longitude,
          // photos: poi.photos, // TODO: Upload photos to MinIO first
        });

        // Update status to synced with remote ID
        await databaseService.updatePOISyncStatus(
          poi.id,
          'synced',
          remotePOI.id
        );

        console.log(`✅ POI ${poi.id} synced successfully (remote ID: ${remotePOI.id})`);
      } catch (error) {
        // Update status to error
        await databaseService.updatePOISyncStatus(
          poi.id,
          'error',
          undefined,
          error instanceof Error ? error.message : 'Unknown error'
        );

        console.error(`❌ Failed to sync POI ${poi.id}:`, error);
      }
    }
  }

  /**
   * Process sync queue items
   */
  private async processSyncQueue(): Promise<void> {
    const queueItems = await databaseService.getSyncQueue();

    if (queueItems.length === 0) {
      console.log('📭 No items in sync queue');
      return;
    }

    console.log(`📤 Processing ${queueItems.length} sync queue items...`);

    for (const item of queueItems) {
      try {
        await this.processSyncQueueItem(item);
        await databaseService.removeFromSyncQueue(item.id);
        console.log(`✅ Sync queue item ${item.id} processed`);
      } catch (error) {
        const attempts = item.attempts + 1;
        await databaseService.updateSyncQueueItem(
          item.id,
          attempts,
          error instanceof Error ? error.message : 'Unknown error'
        );

        console.error(
          `❌ Failed to process sync queue item ${item.id} (attempt ${attempts}):`,
          error
        );
      }
    }
  }

  /**
   * Process individual sync queue item
   */
  private async processSyncQueueItem(item: SyncQueueItem): Promise<void> {
    const payload = JSON.parse(item.payload);

    switch (item.type) {
      case 'create_poi':
        await poisService.createPOI(payload);
        break;

      case 'update_poi':
        // TODO: Implement update POI endpoint
        throw new Error('Update POI not implemented yet');

      case 'delete_poi':
        // TODO: Implement delete POI endpoint
        throw new Error('Delete POI not implemented yet');

      default:
        throw new Error(`Unknown sync queue item type: ${item.type}`);
    }
  }

  /**
   * Force sync now (manual trigger)
   */
  async forceSyncNow(): Promise<void> {
    console.log('🔄 Force sync triggered by user');
    await this.sync();
  }

  /**
   * Get sync statistics
   */
  async getSyncStats() {
    const pendingPOIs = await databaseService.getPendingPOIs();
    const allPOIs = await databaseService.getAllPOIs();
    const syncQueue = await databaseService.getSyncQueue();

    return {
      totalOfflinePOIs: allPOIs.length,
      pendingPOIs: pendingPOIs.length,
      syncedPOIs: allPOIs.filter((p) => p.syncStatus === 'synced').length,
      errorPOIs: allPOIs.filter((p) => p.syncStatus === 'error').length,
      queuedItems: syncQueue.length,
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
    };
  }
}

// Singleton instance
export const syncService = new SyncService();
