import { useEffect, useState, useCallback } from 'react';
import { offlineService, PendingPOI } from '../services/offline';
import { POI } from '../types';

export function useOffline() {
  const [isOnline, setIsOnline] = useState(offlineService.getIsOnline());
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const unsubscribe = offlineService.addNetworkListener(setIsOnline);
    updatePendingCount();
    return unsubscribe;
  }, []);

  const updatePendingCount = useCallback(async () => {
    const pending = await offlineService.getPendingPOIs();
    setPendingCount(pending.length);
  }, []);

  const syncNow = useCallback(async () => {
    if (!isOnline || isSyncing) return { success: 0, failed: 0 };

    setIsSyncing(true);
    try {
      const result = await offlineService.syncPendingChanges();
      await updatePendingCount();
      return result;
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, updatePendingCount]);

  const cachePOIs = useCallback(async (pois: POI[]) => {
    await offlineService.cachePOIs(pois);
  }, []);

  const getCachedPOIs = useCallback(async () => {
    return await offlineService.getCachedPOIs();
  }, []);

  const addPendingPOI = useCallback(
    async (data: Partial<POI>, action: 'create' | 'update' | 'delete') => {
      await offlineService.addPendingPOI(data, action);
      await updatePendingCount();
    },
    [updatePendingCount],
  );

  const getLastSyncTime = useCallback(async () => {
    return await offlineService.getLastSyncTime();
  }, []);

  return {
    isOnline,
    pendingCount,
    isSyncing,
    syncNow,
    cachePOIs,
    getCachedPOIs,
    addPendingPOI,
    getLastSyncTime,
  };
}

export default useOffline;
