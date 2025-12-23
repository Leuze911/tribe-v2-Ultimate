import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { POI } from '../types';

const CACHE_KEYS = {
  POIS: 'offline_pois',
  PENDING_POIS: 'pending_pois',
  USER_DATA: 'user_data',
  LAST_SYNC: 'last_sync',
};

export interface PendingPOI {
  id: string;
  data: Partial<POI>;
  action: 'create' | 'update' | 'delete';
  createdAt: string;
}

class OfflineService {
  private isOnline: boolean = true;
  private listeners: ((online: boolean) => void)[] = [];

  constructor() {
    this.initNetworkListener();
  }

  private initNetworkListener() {
    NetInfo.addEventListener((state: NetInfoState) => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected ?? false;

      if (wasOnline !== this.isOnline) {
        this.notifyListeners();
        if (this.isOnline) {
          this.syncPendingChanges();
        }
      }
    });
  }

  addNetworkListener(callback: (online: boolean) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.isOnline));
  }

  getIsOnline(): boolean {
    return this.isOnline;
  }

  // Cache POIs
  async cachePOIs(pois: POI[]): Promise<void> {
    try {
      await AsyncStorage.setItem(CACHE_KEYS.POIS, JSON.stringify(pois));
      await AsyncStorage.setItem(CACHE_KEYS.LAST_SYNC, new Date().toISOString());
    } catch (error) {
      console.error('Error caching POIs:', error);
    }
  }

  async getCachedPOIs(): Promise<POI[]> {
    try {
      const data = await AsyncStorage.getItem(CACHE_KEYS.POIS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting cached POIs:', error);
      return [];
    }
  }

  async getLastSyncTime(): Promise<Date | null> {
    try {
      const data = await AsyncStorage.getItem(CACHE_KEYS.LAST_SYNC);
      return data ? new Date(data) : null;
    } catch (error) {
      return null;
    }
  }

  // Pending changes (when offline)
  async addPendingPOI(data: Partial<POI>, action: 'create' | 'update' | 'delete'): Promise<void> {
    try {
      const pendingPOIs = await this.getPendingPOIs();
      const pendingPOI: PendingPOI = {
        id: `pending_${Date.now()}`,
        data,
        action,
        createdAt: new Date().toISOString(),
      };
      pendingPOIs.push(pendingPOI);
      await AsyncStorage.setItem(CACHE_KEYS.PENDING_POIS, JSON.stringify(pendingPOIs));
    } catch (error) {
      console.error('Error adding pending POI:', error);
    }
  }

  async getPendingPOIs(): Promise<PendingPOI[]> {
    try {
      const data = await AsyncStorage.getItem(CACHE_KEYS.PENDING_POIS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting pending POIs:', error);
      return [];
    }
  }

  async clearPendingPOIs(): Promise<void> {
    try {
      await AsyncStorage.removeItem(CACHE_KEYS.PENDING_POIS);
    } catch (error) {
      console.error('Error clearing pending POIs:', error);
    }
  }

  async removePendingPOI(id: string): Promise<void> {
    try {
      const pendingPOIs = await this.getPendingPOIs();
      const filtered = pendingPOIs.filter((p) => p.id !== id);
      await AsyncStorage.setItem(CACHE_KEYS.PENDING_POIS, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error removing pending POI:', error);
    }
  }

  // Sync pending changes when back online
  async syncPendingChanges(): Promise<{ success: number; failed: number }> {
    const pendingPOIs = await this.getPendingPOIs();
    let success = 0;
    let failed = 0;

    for (const pending of pendingPOIs) {
      try {
        // Import dynamically to avoid circular dependencies
        const { poisService } = await import('./pois');

        switch (pending.action) {
          case 'create':
            await poisService.createPOI(pending.data as any);
            break;
          case 'update':
            if (pending.data.id) {
              await poisService.updatePOI(pending.data.id, pending.data as any);
            }
            break;
          case 'delete':
            if (pending.data.id) {
              await poisService.deletePOI(pending.data.id);
            }
            break;
        }

        await this.removePendingPOI(pending.id);
        success++;
      } catch (error) {
        console.error('Error syncing pending POI:', error);
        failed++;
      }
    }

    return { success, failed };
  }

  // User data cache
  async cacheUserData(userData: any): Promise<void> {
    try {
      await AsyncStorage.setItem(CACHE_KEYS.USER_DATA, JSON.stringify(userData));
    } catch (error) {
      console.error('Error caching user data:', error);
    }
  }

  async getCachedUserData(): Promise<any | null> {
    try {
      const data = await AsyncStorage.getItem(CACHE_KEYS.USER_DATA);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting cached user data:', error);
      return null;
    }
  }

  // Clear all cache
  async clearAllCache(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        CACHE_KEYS.POIS,
        CACHE_KEYS.PENDING_POIS,
        CACHE_KEYS.USER_DATA,
        CACHE_KEYS.LAST_SYNC,
      ]);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }
}

export const offlineService = new OfflineService();
export default offlineService;
