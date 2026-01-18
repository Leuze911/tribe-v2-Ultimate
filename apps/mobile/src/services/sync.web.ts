/**
 * TRIBE v2 - Sync Service (Web Version)
 *
 * Web-compatible sync service using online/offline events
 */

import { databaseService, OfflinePOI, SyncQueueItem } from './database';
import { poisService } from './pois';

export type SyncStatus = 'idle' | 'syncing' | 'error';

class SyncServiceWeb {
  private isOnline: boolean = true;
  private isSyncing: boolean = false;
  private syncCallbacks: Array<(status: SyncStatus) => void> = [];

  async init(): Promise<void> {
    console.log('🔄 Initializing sync service (web)...');

    // Initialize database
    await databaseService.init();

    // Setup online/offline listeners for web
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        const wasOnline = this.isOnline;
        this.isOnline = true;
        console.log('📡 Network status: ONLINE');
        if (!wasOnline) {
          console.log('✅ Back online, triggering sync...');
          this.sync().catch(console.error);
        }
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        console.log('📡 Network status: OFFLINE');
      });

      this.isOnline = navigator.onLine;
    }

    console.log('✅ Sync service initialized (web)');
  }

  isDeviceOnline(): boolean {
    return this.isOnline;
  }

  onSyncStatusChange(callback: (status: SyncStatus) => void): () => void {
    this.syncCallbacks.push(callback);
    return () => {
      this.syncCallbacks = this.syncCallbacks.filter((cb) => cb !== callback);
    };
  }

  private notifySyncStatus(status: SyncStatus): void {
    this.syncCallbacks.forEach((callback) => callback(status));
  }

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
      await this.syncPendingPOIs();
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

  private async syncPendingPOIs(): Promise<void> {
    const pendingPOIs = await databaseService.getPendingPOIs();

    if (pendingPOIs.length === 0) {
      console.log('📭 No pending POIs to sync');
      return;
    }

    console.log(`📤 Syncing ${pendingPOIs.length} pending POIs...`);

    for (const poi of pendingPOIs) {
      try {
        await databaseService.updatePOISyncStatus(poi.id, 'syncing');

        const remotePOI = await poisService.createPOI({
          name: poi.name,
          description: poi.description,
          categoryId: poi.categoryId,
          latitude: poi.latitude,
          longitude: poi.longitude,
        });

        await databaseService.updatePOISyncStatus(poi.id, 'synced', remotePOI.id);
        console.log(`✅ POI ${poi.id} synced successfully (remote ID: ${remotePOI.id})`);
      } catch (error) {
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
        console.error(`❌ Failed to process sync queue item ${item.id} (attempt ${attempts}):`, error);
      }
    }
  }

  private async processSyncQueueItem(item: SyncQueueItem): Promise<void> {
    const payload = JSON.parse(item.payload);

    switch (item.type) {
      case 'create_poi':
        await poisService.createPOI(payload);
        break;
      case 'update_poi':
        throw new Error('Update POI not implemented yet');
      case 'delete_poi':
        throw new Error('Delete POI not implemented yet');
      default:
        throw new Error(`Unknown sync queue item type: ${item.type}`);
    }
  }

  async forceSyncNow(): Promise<void> {
    console.log('🔄 Force sync triggered by user');
    await this.sync();
  }

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

export const syncService = new SyncServiceWeb();
