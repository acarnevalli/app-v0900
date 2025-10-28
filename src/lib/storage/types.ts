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

export interface FinancialTransaction {
  id: string;
  type: 'income' | 'expense';
  category: string;                    // ← MUDOU: antes era category_id
  description?: string | null;
  amount: number;
  date: string;                        // ← NOVO: campo obrigatório
  due_date?: string | null;
  status?: string | null;
  payment_method?: string | null;
  reference_id?: string | null;
  reference_type?: string | null;
  client_id?: string | null;
  client_name?: string | null;
  supplier_id?: string | null;
  supplier_name?: string | null;
  installment_number?: number | null;
  total_installments?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateFinancialTransactionData {
  type: 'income' | 'expense';
  category: string;                    // ← MUDOU: antes era category_id
  description?: string;
  amount: number;
  due_date?: string;                   // Opcional, mas se não informar, usará a data atual
  status?: string;
  payment_method?: string;
  reference_id?: string;
  reference_type?: string;
  client_id?: string;
  client_name?: string;
  supplier_id?: string;
  supplier_name?: string;
  installment_number?: number;
  total_installments?: number;
  payment_date?: string;               // Usado como fallback para 'date'
}

export interface UpdateFinancialTransactionData {
  type?: 'income' | 'expense';
  category?: string;
  description?: string;
  amount?: number;
  payment_date?: string;
  due_date?: string;
  status?: string;
  payment_method?: string;
  reference_id?: string;
  reference_type?: string;
  client_id?: string;
  client_name?: string;
  supplier_id?: string;
  supplier_name?: string;
  installment_number?: number;
  total_installments?: number;
}

export interface PayTransactionData {
  payment_date: string;
  payment_method?: string;
  notes?: string;
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
