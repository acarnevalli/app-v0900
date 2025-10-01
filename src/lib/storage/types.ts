export type StorageProvider = 'local' | 'supabase' | 'firebase' | 'custom';

export type SyncStrategy = 'local-wins' | 'remote-wins' | 'manual' | 'newest-wins';

export interface StorageConfig {
  provider: StorageProvider;
  autoSync: boolean;
  syncInterval?: number;
  syncStrategy: SyncStrategy;
  supabase?: {
    url: string;
    anonKey: string;
  };
  firebase?: {
    apiKey: string;
    projectId: string;
  };
  custom?: {
    endpoint: string;
    apiKey: string;
  };
}

export interface SyncStatus {
  lastSync?: Date;
  pendingOperations: number;
  isOnline: boolean;
  isSyncing: boolean;
  conflicts: number;
  provider: StorageProvider;
}

export interface DataRecord {
  id: string;
  created_at: string;
  updated_at?: string;
  _version?: number;
  _device_id?: string;
  _sync_status?: 'synced' | 'pending' | 'conflict';
}

export interface QueryOptions {
  orderBy?: string;
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  where?: Record<string, any>;
}

export interface IStorageAdapter {
  initialize(): Promise<void>;

  get<T extends DataRecord>(table: string, id: string): Promise<T | null>;

  list<T extends DataRecord>(table: string, options?: QueryOptions): Promise<T[]>;

  create<T extends DataRecord>(table: string, data: Omit<T, 'id' | 'created_at'>): Promise<T>;

  update<T extends DataRecord>(table: string, id: string, data: Partial<T>): Promise<T>;

  delete(table: string, id: string): Promise<void>;

  query<T extends DataRecord>(table: string, options: QueryOptions): Promise<T[]>;

  bulkCreate<T extends DataRecord>(table: string, data: Omit<T, 'id' | 'created_at'>[]): Promise<T[]>;

  bulkUpdate<T extends DataRecord>(table: string, updates: { id: string; data: Partial<T> }[]): Promise<T[]>;

  bulkDelete(table: string, ids: string[]): Promise<void>;

  count(table: string, options?: QueryOptions): Promise<number>;

  exists(table: string, id: string): Promise<boolean>;

  clear(table: string): Promise<void>;

  export(tables?: string[]): Promise<Record<string, any[]>>;

  import(data: Record<string, any[]>): Promise<void>;
}
