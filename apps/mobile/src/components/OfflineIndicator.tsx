/**
 * TRIBE v2 - Offline Indicator Component
 *
 * Shows network status and sync information
 * - Offline banner when device is offline
 * - Sync status indicator
 * - Pending POIs count
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../utils/theme';
import { useOffline } from '../hooks/useOffline';

interface OfflineIndicatorProps {
  showSyncButton?: boolean;
  compact?: boolean;
}

export function OfflineIndicator({
  showSyncButton = true,
  compact = false,
}: OfflineIndicatorProps) {
  const {
    isOnline,
    syncStatus,
    syncStats,
    triggerSync,
  } = useOffline();

  const pendingCount = syncStats.pendingPOIs;

  // Don't show anything if online and nothing pending
  if (isOnline && pendingCount === 0 && syncStatus === 'idle') {
    return null;
  }

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        {!isOnline && (
          <View style={styles.compactBadge}>
            <Ionicons name="cloud-offline" size={14} color={colors.white} />
          </View>
        )}
        {pendingCount > 0 && isOnline && (
          <TouchableOpacity
            style={styles.syncBadge}
            onPress={triggerSync}
            disabled={syncStatus === 'syncing'}
          >
            <Ionicons
              name={syncStatus === 'syncing' ? 'sync' : 'cloud-upload'}
              size={14}
              color={colors.white}
            />
            <Text style={styles.badgeText}>{pendingCount}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Offline Banner */}
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline" size={18} color={colors.white} />
          <Text style={styles.offlineText}>Mode hors ligne</Text>
          <Text style={styles.offlineSubtext}>
            Les POIs seront synchronises automatiquement
          </Text>
        </View>
      )}

      {/* Sync Status Banner */}
      {isOnline && pendingCount > 0 && (
        <View style={styles.syncBanner}>
          <View style={styles.syncInfo}>
            <Ionicons
              name={syncStatus === 'syncing' ? 'sync' : 'cloud-upload-outline'}
              size={18}
              color={colors.primary[600]}
            />
            <Text style={styles.syncText}>
              {syncStatus === 'syncing'
                ? 'Synchronisation en cours...'
                : `${pendingCount} POI${pendingCount > 1 ? 's' : ''} en attente`}
            </Text>
          </View>
          {showSyncButton && syncStatus !== 'syncing' && (
            <TouchableOpacity
              style={styles.syncButton}
              onPress={triggerSync}
            >
              <Text style={styles.syncButtonText}>Synchroniser</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Error Banner */}
      {syncStats.errorPOIs > 0 && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={18} color={colors.white} />
          <Text style={styles.errorText}>
            {syncStats.errorPOIs} POI{syncStats.errorPOIs > 1 ? 's' : ''} en erreur
          </Text>
        </View>
      )}
    </View>
  );
}

/**
 * Small status dot for headers/corners
 */
export function OfflineStatusDot() {
  const { isOnline, syncStats } = useOffline();

  if (isOnline && syncStats.pendingPOIs === 0) {
    return null;
  }

  return (
    <View
      style={[
        styles.statusDot,
        !isOnline ? styles.statusDotOffline : styles.statusDotPending,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  compactContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  compactBadge: {
    backgroundColor: colors.gray[600],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncBadge: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  badgeText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  offlineBanner: {
    backgroundColor: colors.gray[700],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  offlineText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: fontSize.sm,
  },
  offlineSubtext: {
    color: colors.gray[300],
    fontSize: fontSize.xs,
    width: '100%',
    marginLeft: spacing.lg + 18, // icon size + gap
  },
  syncBanner: {
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  syncInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  syncText: {
    color: colors.primary[700],
    fontSize: fontSize.sm,
  },
  syncButton: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  syncButtonText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  errorBanner: {
    backgroundColor: colors.red[500],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  errorText: {
    color: colors.white,
    fontSize: fontSize.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotOffline: {
    backgroundColor: colors.gray[500],
  },
  statusDotPending: {
    backgroundColor: colors.primary[500],
  },
});

export default OfflineIndicator;
