import { IStorageAdapter, StorageConfig, StorageProvider, SyncStatus } from './types';
import { IndexedDBAdapter } from './indexeddb-adapter';
import { SupabaseAdapter } from './supabase-adapter';
import { SyncManager } from './sync-manager';

const DEFAULT_CONFIG: StorageConfig = {
  provider: 'local',
  autoSync: false,
  syncInterval: 300000,
  syncStrategy: 'newest-wins'
};

export class StorageManager {
  private config: StorageConfig;
  private localAdapter: IndexedDBAdapter;
  private remoteAdapter: IStorageAdapter | null = null;
  private syncManager: SyncManager;
  private syncInterval?: number;

  constructor(config?: Partial<StorageConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.localAdapter = new IndexedDBAdapter();
    this.syncManager = new SyncManager(
      this.localAdapter,
      null,
      this.config.syncStrategy
    );

    this.loadConfig();
  }

  private loadConfig(): void {
    const saved = localStorage.getItem('storage_config');
    if (saved) {
      try {
        this.config = { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
      } catch (error) {
        console.error('Failed to load storage config:', error);
      }
    }
  }

  private saveConfig(): void {
    localStorage.setItem('storage_config', JSON.stringify(this.config));
  }

  async initialize(): Promise<void> {
    await this.localAdapter.initialize();

    if (this.config.provider !== 'local' && this.config.provider === 'supabase') {
      await this.setupRemoteAdapter();
    }

    if (this.config.autoSync && this.remoteAdapter) {
      this.startAutoSync();
    }
  }

  private async setupRemoteAdapter(): Promise<void> {
    try {
      if (this.config.provider === 'supabase' && this.config.supabase) {
        this.remoteAdapter = new SupabaseAdapter(
          this.config.supabase.url,
          this.config.supabase.anonKey
        );
        await this.remoteAdapter.initialize();
        this.syncManager.setRemoteAdapter(this.remoteAdapter);
      }
    } catch (error) {
      console.error('Failed to setup remote adapter:', error);
      this.remoteAdapter = null;
      this.syncManager.setRemoteAdapter(null);
    }
  }

  async updateConfig(newConfig: Partial<StorageConfig>): Promise<void> {
    const oldProvider = this.config.provider;
    this.config = { ...this.config, ...newConfig };
    this.saveConfig();

    if (newConfig.provider && newConfig.provider !== oldProvider) {
      if (newConfig.provider === 'local') {
        this.remoteAdapter = null;
        this.syncManager.setRemoteAdapter(null);
        this.stopAutoSync();
      } else {
        await this.setupRemoteAdapter();
        if (this.config.autoSync) {
          this.startAutoSync();
        }
      }
    }

    if (newConfig.syncStrategy) {
      this.syncManager.setStrategy(newConfig.syncStrategy);
    }

    if (newConfig.autoSync !== undefined) {
      if (newConfig.autoSync && this.remoteAdapter) {
        this.startAutoSync();
      } else {
        this.stopAutoSync();
      }
    }
  }

  getConfig(): StorageConfig {
    return { ...this.config };
  }

  getAdapter(): IStorageAdapter {
    return this.localAdapter;
  }

  getRemoteAdapter(): IStorageAdapter | null {
    return this.remoteAdapter;
  }

  getSyncManager(): SyncManager {
    return this.syncManager;
  }

  getSyncStatus(): SyncStatus {
    return this.syncManager.getSyncStatus();
  }

  async sync(): Promise<void> {
    if (!this.remoteAdapter) {
      throw new Error('Remote adapter not configured. Enable cloud sync first.');
    }

    await this.syncManager.triggerSync();
  }

  private startAutoSync(): void {
    this.stopAutoSync();

    this.syncInterval = window.setInterval(() => {
      if (navigator.onLine && this.remoteAdapter) {
        this.syncManager.triggerSync().catch(error => {
          console.error('Auto-sync failed:', error);
        });
      }
    }, this.config.syncInterval || 300000);
  }

  private stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = undefined;
    }
  }

  async exportData(tables?: string[]): Promise<string> {
    const data = await this.localAdapter.export(tables);
    return JSON.stringify(data, null, 2);
  }

  async importData(jsonData: string): Promise<void> {
    try {
      const data = JSON.parse(jsonData);
      await this.localAdapter.import(data);
    } catch (error) {
      throw new Error('Failed to import data: Invalid JSON format');
    }
  }

  async migrateFromSupabase(): Promise<void> {
    if (!this.config.supabase) {
      throw new Error('Supabase configuration not found');
    }

    const tempAdapter = new SupabaseAdapter(
      this.config.supabase.url,
      this.config.supabase.anonKey
    );

    await tempAdapter.initialize();

    const data = await tempAdapter.export();

    await this.localAdapter.import(data);

    console.log('Migration from Supabase completed successfully');
  }

  async testConnection(): Promise<boolean> {
    if (!this.remoteAdapter) {
      return false;
    }

    try {
      await this.remoteAdapter.list('clients', { limit: 1 });
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  destroy(): void {
    this.stopAutoSync();
  }
}

let globalStorageManager: StorageManager | null = null;

export const getStorageManager = (): StorageManager => {
  if (!globalStorageManager) {
    globalStorageManager = new StorageManager();
  }
  return globalStorageManager;
};

export const initializeStorage = async (config?: Partial<StorageConfig>): Promise<StorageManager> => {
  if (globalStorageManager) {
    globalStorageManager.destroy();
  }

  globalStorageManager = new StorageManager(config);
  await globalStorageManager.initialize();

  return globalStorageManager;
};
