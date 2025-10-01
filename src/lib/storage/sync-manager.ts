import { IStorageAdapter, DataRecord, SyncStrategy, SyncStatus } from './types';

export interface ConflictResolution<T> {
  record: T;
  local: T;
  remote: T;
  resolution: 'local' | 'remote' | 'manual';
  resolvedData?: T;
}

export interface SyncOperation {
  id: string;
  table: string;
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: string;
  retries: number;
}

export class SyncManager {
  private isOnline: boolean = navigator.onLine;
  private isSyncing: boolean = false;
  private conflicts: Map<string, ConflictResolution<any>> = new Map();
  private pendingOperations: SyncOperation[] = [];
  private lastSyncTime?: Date;

  constructor(
    private localAdapter: IStorageAdapter,
    private remoteAdapter: IStorageAdapter | null,
    private strategy: SyncStrategy = 'newest-wins'
  ) {
    this.setupOnlineListener();
    this.loadPendingOperations();
  }

  private setupOnlineListener(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.triggerSync();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  private loadPendingOperations(): void {
    const saved = localStorage.getItem('pending_sync_operations');
    if (saved) {
      try {
        this.pendingOperations = JSON.parse(saved);
      } catch (error) {
        console.error('Failed to load pending operations:', error);
        this.pendingOperations = [];
      }
    }
  }

  private savePendingOperations(): void {
    localStorage.setItem('pending_sync_operations', JSON.stringify(this.pendingOperations));
  }

  addPendingOperation(operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retries'>): void {
    const syncOp: SyncOperation = {
      ...operation,
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      retries: 0
    };

    this.pendingOperations.push(syncOp);
    this.savePendingOperations();

    if (this.isOnline && this.remoteAdapter) {
      this.triggerSync();
    }
  }

  async triggerSync(): Promise<void> {
    if (this.isSyncing || !this.remoteAdapter || !this.isOnline) {
      return;
    }

    this.isSyncing = true;

    try {
      await this.processPendingOperations();
      await this.syncFromRemote();
      this.lastSyncTime = new Date();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  private async processPendingOperations(): Promise<void> {
    if (!this.remoteAdapter) return;

    const operations = [...this.pendingOperations];
    const successfulOps: string[] = [];

    for (const op of operations) {
      try {
        switch (op.operation) {
          case 'create':
            await this.remoteAdapter.create(op.table, op.data);
            break;
          case 'update':
            await this.remoteAdapter.update(op.table, op.data.id, op.data);
            break;
          case 'delete':
            await this.remoteAdapter.delete(op.table, op.data.id);
            break;
        }

        successfulOps.push(op.id);
      } catch (error) {
        console.error(`Failed to sync operation ${op.id}:`, error);
        op.retries++;

        if (op.retries > 3) {
          console.error(`Operation ${op.id} failed after 3 retries, removing from queue`);
          successfulOps.push(op.id);
        }
      }
    }

    this.pendingOperations = this.pendingOperations.filter(
      op => !successfulOps.includes(op.id)
    );
    this.savePendingOperations();
  }

  private async syncFromRemote(): Promise<void> {
    if (!this.remoteAdapter) return;

    const tables = [
      'clients',
      'products',
      'product_components',
      'projects',
      'project_products',
      'transactions',
      'stock_movements'
    ];

    for (const table of tables) {
      try {
        const remoteRecords = await this.remoteAdapter.list(table);
        const localRecords = await this.localAdapter.list(table);

        const localMap = new Map(localRecords.map(r => [r.id, r]));
        const remoteMap = new Map(remoteRecords.map(r => [r.id, r]));

        for (const remoteRecord of remoteRecords) {
          const localRecord = localMap.get(remoteRecord.id);

          if (!localRecord) {
            await this.localAdapter.create(table, remoteRecord);
          } else {
            const resolution = this.resolveConflict(localRecord, remoteRecord);

            if (resolution === 'remote') {
              await this.localAdapter.update(table, remoteRecord.id, remoteRecord);
            } else if (resolution === 'local') {
              await this.remoteAdapter.update(table, localRecord.id, localRecord);
            }
          }
        }

        for (const localRecord of localRecords) {
          if (!remoteMap.has(localRecord.id) && localRecord._sync_status === 'synced') {
            await this.localAdapter.delete(table, localRecord.id);
          }
        }
      } catch (error) {
        console.error(`Failed to sync table ${table}:`, error);
      }
    }
  }

  private resolveConflict<T extends DataRecord>(local: T, remote: T): 'local' | 'remote' | 'manual' {
    if (this.strategy === 'local-wins') {
      return 'local';
    }

    if (this.strategy === 'remote-wins') {
      return 'remote';
    }

    if (this.strategy === 'newest-wins') {
      const localTime = new Date(local.updated_at || local.created_at).getTime();
      const remoteTime = new Date(remote.updated_at || remote.created_at).getTime();

      return localTime > remoteTime ? 'local' : 'remote';
    }

    const conflictId = `${local.id}_${Date.now()}`;
    this.conflicts.set(conflictId, {
      record: local,
      local,
      remote,
      resolution: 'manual'
    });

    return 'manual';
  }

  getConflicts(): ConflictResolution<any>[] {
    return Array.from(this.conflicts.values());
  }

  async resolveConflictManually<T extends DataRecord>(
    conflictId: string,
    resolution: 'local' | 'remote',
    customData?: T
  ): Promise<void> {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict) {
      throw new Error(`Conflict ${conflictId} not found`);
    }

    const resolvedData = customData || (resolution === 'local' ? conflict.local : conflict.remote);

    const tableMatch = Array.from(this.conflicts.values()).find(c => c.record.id === conflict.record.id);
    if (!tableMatch) return;

    await this.localAdapter.update('unknown_table', conflict.record.id, resolvedData);

    if (this.remoteAdapter) {
      await this.remoteAdapter.update('unknown_table', conflict.record.id, resolvedData);
    }

    this.conflicts.delete(conflictId);
  }

  getSyncStatus(): SyncStatus {
    return {
      lastSync: this.lastSyncTime,
      pendingOperations: this.pendingOperations.length,
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      conflicts: this.conflicts.size,
      provider: this.remoteAdapter ? 'supabase' : 'local'
    };
  }

  setStrategy(strategy: SyncStrategy): void {
    this.strategy = strategy;
  }

  setRemoteAdapter(adapter: IStorageAdapter | null): void {
    this.remoteAdapter = adapter;
  }

  clearPendingOperations(): void {
    this.pendingOperations = [];
    this.savePendingOperations();
  }

  async performFullSync(): Promise<void> {
    if (!this.remoteAdapter) {
      throw new Error('Remote adapter not configured');
    }

    await this.triggerSync();
  }
}
