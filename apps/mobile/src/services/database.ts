/**
 * TRIBE v2 - Offline Database Service
 *
 * SQLite database for offline POI storage and sync queue
 * Architecture decision: expo-sqlite for performance and native integration
 */

import { Platform } from 'react-native';

// Conditional import for SQLite (not available on web)
let SQLite: any = null;
if (Platform.OS !== 'web') {
  SQLite = require('expo-sqlite');
}

// Database schema version for migrations
const DB_VERSION = 1;
const DB_NAME = 'tribe.db';

export interface OfflinePOI {
  id: string; // Local UUID
  name: string;
  description?: string;
  categoryId: string;
  latitude: number;
  longitude: number;
  photos?: string[]; // Base64 or local file paths
  createdAt: number; // Timestamp
  syncStatus: 'pending' | 'syncing' | 'synced' | 'error';
  syncError?: string;
  remoteId?: string; // Set after successful sync
}

export interface SyncQueueItem {
  id: string;
  type: 'create_poi' | 'update_poi' | 'delete_poi';
  payload: string; // JSON stringified data
  createdAt: number;
  attempts: number;
  lastAttemptAt?: number;
  error?: string;
}

class DatabaseService {
  private db: any = null;
  private isWeb: boolean = Platform.OS === 'web';

  /**
   * Initialize database and create tables
   */
  async init(): Promise<void> {
    // Skip SQLite on web - use in-memory/localStorage fallback
    if (this.isWeb) {
      console.log('📦 Web platform detected, using in-memory storage');
      return;
    }

    if (!SQLite) {
      console.log('⚠️ SQLite not available');
      return;
    }

    try {
      this.db = await SQLite.openDatabaseAsync(DB_NAME);

      console.log('📦 SQLite database opened');

      await this.createTables();
      await this.runMigrations();

      console.log('✅ Database initialized successfully');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * Create database tables
   */
  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // POIs table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS pois (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        categoryId TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        photos TEXT,
        createdAt INTEGER NOT NULL,
        syncStatus TEXT NOT NULL DEFAULT 'pending',
        syncError TEXT,
        remoteId TEXT
      );
    `);

    // Sync queue table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        payload TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        lastAttemptAt INTEGER,
        error TEXT
      );
    `);

    // Indexes for performance
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_pois_syncStatus ON pois(syncStatus);
      CREATE INDEX IF NOT EXISTS idx_sync_queue_attempts ON sync_queue(attempts);
    `);

    console.log('✅ Database tables created');
  }

  /**
   * Run database migrations (future-proof)
   */
  private async runMigrations(): Promise<void> {
    // Check current version
    // For v1, no migrations needed
    // Future versions can add migration logic here
    console.log(`📊 Database version: ${DB_VERSION}`);
  }

  /**
   * Insert a POI for offline storage
   */
  async insertPOI(poi: Omit<OfflinePOI, 'id' | 'createdAt' | 'syncStatus'>): Promise<OfflinePOI> {
    if (!this.db) throw new Error('Database not initialized');

    const id = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const createdAt = Date.now();
    const syncStatus = 'pending';

    const fullPOI: OfflinePOI = {
      id,
      ...poi,
      createdAt,
      syncStatus,
    };

    await this.db.runAsync(
      `INSERT INTO pois (id, name, description, categoryId, latitude, longitude, photos, createdAt, syncStatus, remoteId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        fullPOI.id,
        fullPOI.name,
        fullPOI.description || null,
        fullPOI.categoryId,
        fullPOI.latitude,
        fullPOI.longitude,
        fullPOI.photos ? JSON.stringify(fullPOI.photos) : null,
        fullPOI.createdAt,
        fullPOI.syncStatus,
        fullPOI.remoteId || null,
      ]
    );

    console.log('💾 POI saved offline:', fullPOI.id);
    return fullPOI;
  }

  /**
   * Get all POIs
   */
  async getAllPOIs(): Promise<OfflinePOI[]> {
    if (!this.db) throw new Error('Database not initialized');

    const rows = await this.db.getAllAsync(
      'SELECT * FROM pois ORDER BY createdAt DESC'
    ) as OfflinePOI[];

    return rows.map((row: OfflinePOI) => ({
      ...row,
      photos: row.photos ? JSON.parse(row.photos as unknown as string) : undefined,
    }));
  }

  /**
   * Get pending POIs (not synced yet)
   */
  async getPendingPOIs(): Promise<OfflinePOI[]> {
    if (!this.db) throw new Error('Database not initialized');

    const rows = await this.db.getAllAsync(
      'SELECT * FROM pois WHERE syncStatus = ? ORDER BY createdAt ASC',
      ['pending']
    ) as OfflinePOI[];

    return rows.map((row: OfflinePOI) => ({
      ...row,
      photos: row.photos ? JSON.parse(row.photos as unknown as string) : undefined,
    }));
  }

  /**
   * Update POI sync status
   */
  async updatePOISyncStatus(
    id: string,
    status: OfflinePOI['syncStatus'],
    remoteId?: string,
    error?: string
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      'UPDATE pois SET syncStatus = ?, remoteId = ?, syncError = ? WHERE id = ?',
      [status, remoteId || null, error || null, id]
    );

    console.log(`📝 POI ${id} sync status updated to ${status}`);
  }

  /**
   * Delete a POI
   */
  async deletePOI(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync('DELETE FROM pois WHERE id = ?', [id]);
    console.log(`🗑️ POI ${id} deleted from offline storage`);
  }

  /**
   * Add item to sync queue
   */
  async addToSyncQueue(
    type: SyncQueueItem['type'],
    payload: unknown
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const id = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const createdAt = Date.now();

    await this.db.runAsync(
      `INSERT INTO sync_queue (id, type, payload, createdAt, attempts)
       VALUES (?, ?, ?, ?, ?)`,
      [id, type, JSON.stringify(payload), createdAt, 0]
    );

    console.log('📤 Added to sync queue:', type);
  }

  /**
   * Get pending sync items
   */
  async getSyncQueue(): Promise<SyncQueueItem[]> {
    if (!this.db) throw new Error('Database not initialized');

    const rows = await this.db.getAllAsync(
      'SELECT * FROM sync_queue WHERE attempts < 5 ORDER BY createdAt ASC LIMIT 10'
    ) as SyncQueueItem[];

    return rows;
  }

  /**
   * Update sync queue item
   */
  async updateSyncQueueItem(
    id: string,
    attempts: number,
    error?: string
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      'UPDATE sync_queue SET attempts = ?, lastAttemptAt = ?, error = ? WHERE id = ?',
      [attempts, Date.now(), error || null, id]
    );
  }

  /**
   * Remove item from sync queue
   */
  async removeFromSyncQueue(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync('DELETE FROM sync_queue WHERE id = ?', [id]);
    console.log('✅ Removed from sync queue:', id);
  }

  /**
   * Clear all data (for testing or reset)
   */
  async clearAll(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.execAsync('DELETE FROM pois; DELETE FROM sync_queue;');
    console.log('🧹 All offline data cleared');
  }
}

// Singleton instance
export const databaseService = new DatabaseService();
