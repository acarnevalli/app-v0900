import { IStorageAdapter, DataRecord, QueryOptions } from './types';

const DB_NAME = 'marcenaria_db';
const DB_VERSION = 1;

const TABLES = [
  'clients',
  'products',
  'product_components',
  'projects',
  'project_products',
  'transactions',
  'stock_movements'
];

export class IndexedDBAdapter implements IStorageAdapter {
  private db: IDBDatabase | null = null;
  private deviceId: string;

  constructor() {
    this.deviceId = this.getOrCreateDeviceId();
  }

  private getOrCreateDeviceId(): string {
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
      deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('device_id', deviceId);
    }
    return deviceId;
  }

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        TABLES.forEach(table => {
          if (!db.objectStoreNames.contains(table)) {
            const store = db.createObjectStore(table, { keyPath: 'id' });
            store.createIndex('created_at', 'created_at', { unique: false });
            store.createIndex('updated_at', 'updated_at', { unique: false });
            store.createIndex('_sync_status', '_sync_status', { unique: false });
            store.createIndex('_version', '_version', { unique: false });

            if (table === 'products') {
              store.createIndex('name', 'name', { unique: false });
              store.createIndex('category', 'category', { unique: false });
              store.createIndex('type', 'type', { unique: false });
            } else if (table === 'clients') {
              store.createIndex('name', 'name', { unique: false });
              store.createIndex('email', 'email', { unique: false });
            } else if (table === 'projects') {
              store.createIndex('client_id', 'client_id', { unique: false });
              store.createIndex('status', 'status', { unique: false });
              store.createIndex('number', 'number', { unique: true });
            } else if (table === 'product_components') {
              store.createIndex('parent_product_id', 'parent_product_id', { unique: false });
              store.createIndex('component_product_id', 'component_product_id', { unique: false });
            } else if (table === 'project_products') {
              store.createIndex('project_id', 'project_id', { unique: false });
              store.createIndex('product_id', 'product_id', { unique: false });
            } else if (table === 'transactions') {
              store.createIndex('type', 'type', { unique: false });
              store.createIndex('date', 'date', { unique: false });
              store.createIndex('project_id', 'project_id', { unique: false });
            } else if (table === 'stock_movements') {
              store.createIndex('product_id', 'product_id', { unique: false });
              store.createIndex('project_id', 'project_id', { unique: false });
              store.createIndex('movement_date', 'movement_date', { unique: false });
            }
          }
        });
      };
    });
  }

  private ensureDb(): IDBDatabase {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  private addMetadata<T extends DataRecord>(data: Partial<T>): T {
    const now = new Date().toISOString();
    return {
      ...data,
      id: data.id || this.generateId(),
      created_at: data.created_at || now,
      updated_at: now,
      _version: (data._version || 0) + 1,
      _device_id: this.deviceId,
      _sync_status: 'pending'
    } as T;
  }

  async get<T extends DataRecord>(table: string, id: string): Promise<T | null> {
    const db = this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(table, 'readonly');
      const store = transaction.objectStore(table);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async list<T extends DataRecord>(table: string, options?: QueryOptions): Promise<T[]> {
    return this.query<T>(table, options || {});
  }

  async create<T extends DataRecord>(table: string, data: Omit<T, 'id' | 'created_at'>): Promise<T> {
    const db = this.ensureDb();
    const record = this.addMetadata<T>(data as Partial<T>);

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(table, 'readwrite');
      const store = transaction.objectStore(table);
      const request = store.add(record);

      request.onsuccess = () => resolve(record);
      request.onerror = () => reject(request.error);
    });
  }

  async update<T extends DataRecord>(table: string, id: string, data: Partial<T>): Promise<T> {
    const db = this.ensureDb();
    const existing = await this.get<T>(table, id);

    if (!existing) {
      throw new Error(`Record with id ${id} not found in ${table}`);
    }

    const updated = this.addMetadata<T>({
      ...existing,
      ...data,
      id
    });

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(table, 'readwrite');
      const store = transaction.objectStore(table);
      const request = store.put(updated);

      request.onsuccess = () => resolve(updated);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(table: string, id: string): Promise<void> {
    const db = this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(table, 'readwrite');
      const store = transaction.objectStore(table);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async query<T extends DataRecord>(table: string, options: QueryOptions): Promise<T[]> {
    const db = this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(table, 'readonly');
      const store = transaction.objectStore(table);

      let request: IDBRequest;

      if (options.where && Object.keys(options.where).length > 0) {
        const [key, value] = Object.entries(options.where)[0];
        if (store.indexNames.contains(key)) {
          const index = store.index(key);
          request = index.getAll(value);
        } else {
          request = store.getAll();
        }
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => {
        let results: T[] = request.result || [];

        if (options.where) {
          results = results.filter(item => {
            return Object.entries(options.where!).every(([key, value]) => {
              return (item as any)[key] === value;
            });
          });
        }

        if (options.orderBy) {
          const order = options.order || 'asc';
          results.sort((a, b) => {
            const aVal = (a as any)[options.orderBy!];
            const bVal = (b as any)[options.orderBy!];

            if (aVal < bVal) return order === 'asc' ? -1 : 1;
            if (aVal > bVal) return order === 'asc' ? 1 : -1;
            return 0;
          });
        }

        if (options.offset) {
          results = results.slice(options.offset);
        }

        if (options.limit) {
          results = results.slice(0, options.limit);
        }

        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async bulkCreate<T extends DataRecord>(table: string, data: Omit<T, 'id' | 'created_at'>[]): Promise<T[]> {
    const db = this.ensureDb();
    const records = data.map(item => this.addMetadata<T>(item as Partial<T>));

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(table, 'readwrite');
      const store = transaction.objectStore(table);

      const promises = records.map(record => {
        return new Promise<void>((res, rej) => {
          const request = store.add(record);
          request.onsuccess = () => res();
          request.onerror = () => rej(request.error);
        });
      });

      Promise.all(promises)
        .then(() => resolve(records))
        .catch(reject);
    });
  }

  async bulkUpdate<T extends DataRecord>(table: string, updates: { id: string; data: Partial<T> }[]): Promise<T[]> {
    const results: T[] = [];

    for (const update of updates) {
      const result = await this.update<T>(table, update.id, update.data);
      results.push(result);
    }

    return results;
  }

  async bulkDelete(table: string, ids: string[]): Promise<void> {
    const db = this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(table, 'readwrite');
      const store = transaction.objectStore(table);

      const promises = ids.map(id => {
        return new Promise<void>((res, rej) => {
          const request = store.delete(id);
          request.onsuccess = () => res();
          request.onerror = () => rej(request.error);
        });
      });

      Promise.all(promises)
        .then(() => resolve())
        .catch(reject);
    });
  }

  async count(table: string, options?: QueryOptions): Promise<number> {
    const results = await this.query(table, options || {});
    return results.length;
  }

  async exists(table: string, id: string): Promise<boolean> {
    const record = await this.get(table, id);
    return record !== null;
  }

  async clear(table: string): Promise<void> {
    const db = this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(table, 'readwrite');
      const store = transaction.objectStore(table);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async export(tables?: string[]): Promise<Record<string, any[]>> {
    const tablesToExport = tables || TABLES;
    const result: Record<string, any[]> = {};

    for (const table of tablesToExport) {
      result[table] = await this.list(table);
    }

    return result;
  }

  async import(data: Record<string, any[]>): Promise<void> {
    for (const [table, records] of Object.entries(data)) {
      if (TABLES.includes(table)) {
        await this.clear(table);

        if (records.length > 0) {
          await this.bulkCreate(table, records);
        }
      }
    }
  }
}
