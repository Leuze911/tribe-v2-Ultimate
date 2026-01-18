/**
 * TRIBE v2 - Offline Database Service (Web Version)
 *
 * Uses localStorage for web platform (expo-sqlite not supported on web)
 */

export interface OfflinePOI {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  latitude: number;
  longitude: number;
  photos?: string[];
  createdAt: number;
  syncStatus: 'pending' | 'syncing' | 'synced' | 'error';
  syncError?: string;
  remoteId?: string;
}

export interface SyncQueueItem {
  id: string;
  type: 'create_poi' | 'update_poi' | 'delete_poi';
  payload: string;
  createdAt: number;
  attempts: number;
  lastAttemptAt?: number;
  error?: string;
}

const POIS_KEY = 'tribe_offline_pois';
const SYNC_QUEUE_KEY = 'tribe_sync_queue';

class DatabaseServiceWeb {
  private initialized = false;

  async init(): Promise<void> {
    this.initialized = true;
    console.log('📦 Web localStorage database initialized');
  }

  private getPOIs(): OfflinePOI[] {
    try {
      const data = localStorage.getItem(POIS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private savePOIs(pois: OfflinePOI[]): void {
    localStorage.setItem(POIS_KEY, JSON.stringify(pois));
  }

  private getSyncQueueItems(): SyncQueueItem[] {
    try {
      const data = localStorage.getItem(SYNC_QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveSyncQueue(items: SyncQueueItem[]): void {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(items));
  }

  async insertPOI(poi: Omit<OfflinePOI, 'id' | 'createdAt' | 'syncStatus'>): Promise<OfflinePOI> {
    const id = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const createdAt = Date.now();
    const syncStatus = 'pending';

    const fullPOI: OfflinePOI = {
      id,
      ...poi,
      createdAt,
      syncStatus,
    };

    const pois = this.getPOIs();
    pois.push(fullPOI);
    this.savePOIs(pois);

    console.log('💾 POI saved offline (web):', fullPOI.id);
    return fullPOI;
  }

  async getAllPOIs(): Promise<OfflinePOI[]> {
    return this.getPOIs().sort((a, b) => b.createdAt - a.createdAt);
  }

  async getPendingPOIs(): Promise<OfflinePOI[]> {
    return this.getPOIs()
      .filter(p => p.syncStatus === 'pending')
      .sort((a, b) => a.createdAt - b.createdAt);
  }

  async updatePOISyncStatus(
    id: string,
    status: OfflinePOI['syncStatus'],
    remoteId?: string,
    error?: string
  ): Promise<void> {
    const pois = this.getPOIs();
    const index = pois.findIndex(p => p.id === id);
    if (index !== -1) {
      pois[index].syncStatus = status;
      if (remoteId) pois[index].remoteId = remoteId;
      if (error) pois[index].syncError = error;
      this.savePOIs(pois);
    }
    console.log(`📝 POI ${id} sync status updated to ${status}`);
  }

  async deletePOI(id: string): Promise<void> {
    const pois = this.getPOIs().filter(p => p.id !== id);
    this.savePOIs(pois);
    console.log(`🗑️ POI ${id} deleted from offline storage`);
  }

  async addToSyncQueue(type: SyncQueueItem['type'], payload: unknown): Promise<void> {
    const id = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const item: SyncQueueItem = {
      id,
      type,
      payload: JSON.stringify(payload),
      createdAt: Date.now(),
      attempts: 0,
    };
    const queue = this.getSyncQueueItems();
    queue.push(item);
    this.saveSyncQueue(queue);
    console.log('📤 Added to sync queue:', type);
  }

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    return this.getSyncQueueItems()
      .filter(item => item.attempts < 5)
      .sort((a, b) => a.createdAt - b.createdAt)
      .slice(0, 10);
  }

  async updateSyncQueueItem(id: string, attempts: number, error?: string): Promise<void> {
    const queue = this.getSyncQueueItems();
    const index = queue.findIndex(item => item.id === id);
    if (index !== -1) {
      queue[index].attempts = attempts;
      queue[index].lastAttemptAt = Date.now();
      if (error) queue[index].error = error;
      this.saveSyncQueue(queue);
    }
  }

  async removeFromSyncQueue(id: string): Promise<void> {
    const queue = this.getSyncQueueItems().filter(item => item.id !== id);
    this.saveSyncQueue(queue);
    console.log('✅ Removed from sync queue:', id);
  }

  async clearAll(): Promise<void> {
    localStorage.removeItem(POIS_KEY);
    localStorage.removeItem(SYNC_QUEUE_KEY);
    console.log('🧹 All offline data cleared');
  }
}

export const databaseService = new DatabaseServiceWeb();
