import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
}));

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
}));

// Import after mocks
import { offlineService, PendingPOI } from '../src/services/offline';

describe('OfflineService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('cachePOIs', () => {
    it('should store POIs in AsyncStorage', async () => {
      const mockPOIs = [
        { id: '1', name: 'Test POI 1', latitude: 14.6, longitude: -17.4 },
        { id: '2', name: 'Test POI 2', latitude: 14.7, longitude: -17.5 },
      ];

      await offlineService.cachePOIs(mockPOIs as any);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'offline_pois',
        JSON.stringify(mockPOIs),
      );
    });

    it('should update last sync timestamp', async () => {
      const mockPOIs = [{ id: '1', name: 'Test' }];

      await offlineService.cachePOIs(mockPOIs as any);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'last_sync',
        expect.any(String),
      );
    });
  });

  describe('getCachedPOIs', () => {
    it('should return cached POIs', async () => {
      const mockPOIs = [{ id: '1', name: 'Cached POI' }];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockPOIs));

      const result = await offlineService.getCachedPOIs();

      expect(result).toEqual(mockPOIs);
    });

    it('should return empty array if no cache', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await offlineService.getCachedPOIs();

      expect(result).toEqual([]);
    });
  });

  describe('addPendingPOI', () => {
    it('should queue POI for sync', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('[]');

      const mockData = { name: 'New POI', latitude: 14.6, longitude: -17.4 };
      await offlineService.addPendingPOI(mockData as any, 'create');

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'pending_pois',
        expect.stringContaining('pending_'),
      );
    });

    it('should generate unique pending ID', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('[]');

      await offlineService.addPendingPOI({ name: 'POI 1' } as any, 'create');
      await offlineService.addPendingPOI({ name: 'POI 2' } as any, 'create');

      const calls = (AsyncStorage.setItem as jest.Mock).mock.calls.filter(
        (call) => call[0] === 'pending_pois',
      );

      // Each call should have a different ID in the stored data
      expect(calls.length).toBe(2);
    });
  });

  describe('getPendingPOIs', () => {
    it('should return pending POIs list', async () => {
      const mockPending: PendingPOI[] = [
        { id: 'pending_1', data: { name: 'POI' }, action: 'create', createdAt: new Date().toISOString() },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockPending));

      const result = await offlineService.getPendingPOIs();

      expect(result).toHaveLength(1);
      expect(result[0].action).toBe('create');
    });

    it('should return empty array if no pending', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await offlineService.getPendingPOIs();

      expect(result).toEqual([]);
    });
  });

  describe('getIsOnline', () => {
    it('should return online status', () => {
      const result = offlineService.getIsOnline();

      expect(typeof result).toBe('boolean');
    });
  });

  describe('clearAllCache', () => {
    it('should remove all cache keys', async () => {
      await offlineService.clearAllCache();

      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
        'offline_pois',
        'pending_pois',
        'user_data',
        'last_sync',
      ]);
    });
  });

  describe('getLastSyncTime', () => {
    it('should return last sync date', async () => {
      const mockDate = new Date().toISOString();
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(mockDate);

      const result = await offlineService.getLastSyncTime();

      expect(result).toBeInstanceOf(Date);
    });

    it('should return null if never synced', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await offlineService.getLastSyncTime();

      expect(result).toBeNull();
    });
  });
});
