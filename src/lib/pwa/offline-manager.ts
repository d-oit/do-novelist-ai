import { logger } from '@/lib/logging/logger';

interface OfflineData {
  id: string;
  type: 'chapter' | 'character' | 'world' | 'project';
  projectId: string;
  data: Record<string, unknown>;
  lastModified: number;
  synced: boolean;
}

class OfflineManager {
  private db: IDBDatabase | null = null;
  private dbName = 'novelist-offline-db';
  private dbVersion = 1;
  private isOnline = true;
  private syncInProgress = false;
  private offlineListeners: Array<(isOffline: boolean) => void> = [];

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        logger.error('Failed to open IndexedDB', {
          component: 'OfflineManager',
          error: new Error(request.error?.message || 'Unknown error'),
        });
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        logger.info('IndexedDB initialized', { component: 'OfflineManager' });
        resolve();
      };

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('offline-data')) {
          const store = db.createObjectStore('offline-data', { keyPath: 'id' });
          store.createIndex('projectId', 'projectId', { unique: false });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('synced', 'synced', { unique: false });
          logger.info('Created offline-data object store', { component: 'OfflineManager' });
        }
      };
    });
  }

  public initialize(): void {
    if (typeof window === 'undefined') return;

    this.init().catch(error => {
      logger.error('Failed to initialize offline manager', {
        component: 'OfflineManager',
        error,
      });
    });

    this.isOnline = navigator.onLine;
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);

    logger.info('Offline manager initialized', {
      component: 'OfflineManager',
      isOnline: this.isOnline,
    });
  }

  private handleOnline = (): void => {
    if (!this.isOnline) {
      this.isOnline = true;
      this.notifyListeners(false);
      logger.info('Connection restored', { component: 'OfflineManager' });
      void this.syncPendingData();
    }
  };

  private handleOffline = (): void => {
    this.isOnline = false;
    this.notifyListeners(true);
    logger.warn('Connection lost - offline mode', { component: 'OfflineManager' });
  };

  private notifyListeners(isOffline: boolean): void {
    this.offlineListeners.forEach(listener => listener(isOffline));
  }

  public isOffline(): boolean {
    return !this.isOnline;
  }

  public onOfflineChange(callback: (isOffline: boolean) => void): () => void {
    this.offlineListeners.push(callback);
    callback(!this.isOnline);

    return () => {
      this.offlineListeners = this.offlineListeners.filter(l => l !== callback);
    };
  }

  public async saveOfflineData(data: OfflineData): Promise<void> {
    if (!this.db) {
      logger.warn('IndexedDB not initialized', { component: 'OfflineManager' });
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offline-data'], 'readwrite');
      const store = transaction.objectStore('offline-data');
      const request = store.put(data);

      request.onsuccess = () => {
        logger.info('Data saved offline', {
          component: 'OfflineManager',
          dataId: data.id,
          dataType: data.type,
        });
        resolve();
      };

      request.onerror = () => {
        logger.error('Failed to save offline data', {
          component: 'OfflineManager',
          dataId: data.id,
          error: new Error(request.error?.message || 'Unknown error'),
        });
        reject(new Error('Failed to save offline data'));
      };
    });
  }

  public async getOfflineData(id: string): Promise<OfflineData | undefined> {
    if (!this.db) {
      logger.warn('IndexedDB not initialized', { component: 'OfflineManager' });
      return undefined;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offline-data'], 'readonly');
      const store = transaction.objectStore('offline-data');
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result as OfflineData | undefined);
      };

      request.onerror = () => {
        logger.error('Failed to get offline data', {
          component: 'OfflineManager',
          dataId: id,
          error: new Error(request.error?.message || 'Unknown error'),
        });
        reject(new Error('Failed to get offline data'));
      };
    });
  }

  public async getUnsyncedData(): Promise<OfflineData[]> {
    if (!this.db) {
      logger.warn('IndexedDB not initialized', { component: 'OfflineManager' });
      return [];
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offline-data'], 'readonly');
      const store = transaction.objectStore('offline-data');
      const index = store.index('synced');
      const request = index.getAll(IDBKeyRange.only(false));

      request.onsuccess = () => {
        const unsyncedData = request.result as OfflineData[];
        logger.info('Found unsynced data', {
          component: 'OfflineManager',
          count: unsyncedData.length,
        });
        resolve(unsyncedData);
      };

      request.onerror = () => {
        logger.error('Failed to get unsynced data', {
          component: 'OfflineManager',
          error: new Error(request.error?.message || 'Unknown error'),
        });
        reject(new Error('Failed to get unsynced data'));
      };
    });
  }

  public async markAsSynced(id: string): Promise<void> {
    if (!this.db) {
      logger.warn('IndexedDB not initialized', { component: 'OfflineManager' });
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offline-data'], 'readwrite');
      const store = transaction.objectStore('offline-data');
      const request = store.get(id);

      request.onsuccess = () => {
        const data = request.result as OfflineData | undefined;
        if (data) {
          data.synced = true;
          const updateRequest = store.put(data);
          updateRequest.onsuccess = () => {
            logger.info('Data marked as synced', {
              component: 'OfflineManager',
              dataId: id,
            });
            resolve();
          };
          updateRequest.onerror = () => {
            logger.error('Failed to mark data as synced', {
              component: 'OfflineManager',
              dataId: id,
              error: new Error(updateRequest.error?.message || 'Unknown error'),
            });
            reject(new Error('Failed to mark data as synced'));
          };
        } else {
          resolve();
        }
      };

      request.onerror = () => {
        logger.error('Failed to get data for sync marking', {
          component: 'OfflineManager',
          dataId: id,
          error: new Error(request.error?.message || 'Unknown error'),
        });
        reject(new Error('Failed to mark data as synced'));
      };
    });
  }

  public async deleteOfflineData(id: string): Promise<void> {
    if (!this.db) {
      logger.warn('IndexedDB not initialized', { component: 'OfflineManager' });
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offline-data'], 'readwrite');
      const store = transaction.objectStore('offline-data');
      const request = store.delete(id);

      request.onsuccess = () => {
        logger.info('Offline data deleted', {
          component: 'OfflineManager',
          dataId: id,
        });
        resolve();
      };

      request.onerror = () => {
        logger.error('Failed to delete offline data', {
          component: 'OfflineManager',
          dataId: id,
          error: new Error(request.error?.message || 'Unknown error'),
        });
        reject(new Error('Failed to delete offline data'));
      };
    });
  }

  private async syncPendingData(): Promise<void> {
    if (this.syncInProgress || !this.isOnline) {
      return;
    }

    this.syncInProgress = true;

    try {
      const unsyncedData = await this.getUnsyncedData();
      logger.info('Starting sync of pending data', {
        component: 'OfflineManager',
        count: unsyncedData.length,
      });

      for (const data of unsyncedData) {
        try {
          await this.syncItem(data);
          await this.markAsSynced(data.id);
        } catch (error) {
          logger.error('Failed to sync item', {
            component: 'OfflineManager',
            dataId: data.id,
            error: error as Error,
          });
        }
      }

      logger.info('Sync completed', {
        component: 'OfflineManager',
        syncedCount: unsyncedData.length,
      });
    } catch (error) {
      logger.error('Sync failed', {
        component: 'OfflineManager',
        error: error as Error,
      });
    } finally {
      this.syncInProgress = false;
    }
  }

  private async syncItem(data: OfflineData): Promise<void> {
    // This would integrate with your actual sync mechanism
    // For now, we'll just simulate the sync
    logger.info('Syncing item', {
      component: 'OfflineManager',
      dataId: data.id,
      dataType: data.type,
    });

    // In a real implementation, you would:
    // 1. Send data to server via API
    // 2. Handle conflicts if any
    // 3. Update local state
  }

  public destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }
    this.offlineListeners = [];
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

export const offlineManager = new OfflineManager();
