import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { IStorageAdapter, DataRecord, QueryOptions } from './types';

export class SupabaseAdapter implements IStorageAdapter {
  private client: SupabaseClient | null = null;
  private deviceId: string;

  constructor(private url?: string, private anonKey?: string) {
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
    if (!this.url || !this.anonKey) {
      throw new Error('Supabase URL and anon key are required');
    }

    this.client = createClient(this.url, this.anonKey);
  }

  private ensureClient(): SupabaseClient {
    if (!this.client) {
      throw new Error('Supabase client not initialized. Call initialize() first.');
    }
    return this.client;
  }

  private addMetadata<T extends DataRecord>(data: Partial<T>): Partial<T> {
    const now = new Date().toISOString();
    return {
      ...data,
      updated_at: now,
      _version: (data._version || 0) + 1,
      _device_id: this.deviceId,
      _sync_status: 'synced'
    };
  }

  async get<T extends DataRecord>(table: string, id: string): Promise<T | null> {
    const client = this.ensureClient();
    const { data, error } = await client
      .from(table)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data as T | null;
  }

  async list<T extends DataRecord>(table: string, options?: QueryOptions): Promise<T[]> {
    return this.query<T>(table, options || {});
  }

  async create<T extends DataRecord>(table: string, data: Omit<T, 'id' | 'created_at'>): Promise<T> {
    const client = this.ensureClient();
    const record = this.addMetadata(data);

    const { data: created, error } = await client
      .from(table)
      .insert(record)
      .select()
      .single();

    if (error) throw error;
    return created as T;
  }

  async update<T extends DataRecord>(table: string, id: string, data: Partial<T>): Promise<T> {
    const client = this.ensureClient();
    const updated = this.addMetadata(data);

    const { data: result, error } = await client
      .from(table)
      .update(updated)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return result as T;
  }

  async delete(table: string, id: string): Promise<void> {
    const client = this.ensureClient();
    const { error } = await client
      .from(table)
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async query<T extends DataRecord>(table: string, options: QueryOptions): Promise<T[]> {
    const client = this.ensureClient();
    let query = client.from(table).select('*');

    if (options.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    if (options.orderBy) {
      query = query.order(options.orderBy, { ascending: options.order !== 'desc' });
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 1000) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as T[];
  }

  async bulkCreate<T extends DataRecord>(table: string, data: Omit<T, 'id' | 'created_at'>[]): Promise<T[]> {
    const client = this.ensureClient();
    const records = data.map(item => this.addMetadata(item));

    const { data: created, error } = await client
      .from(table)
      .insert(records)
      .select();

    if (error) throw error;
    return (created || []) as T[];
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
    const client = this.ensureClient();
    const { error } = await client
      .from(table)
      .delete()
      .in('id', ids);

    if (error) throw error;
  }

  async count(table: string, options?: QueryOptions): Promise<number> {
    const client = this.ensureClient();
    let query = client.from(table).select('*', { count: 'exact', head: true });

    if (options?.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    const { count, error } = await query;

    if (error) throw error;
    return count || 0;
  }

  async exists(table: string, id: string): Promise<boolean> {
    const record = await this.get(table, id);
    return record !== null;
  }

  async clear(table: string): Promise<void> {
    const client = this.ensureClient();
    const { error } = await client
      .from(table)
      .delete()
      .neq('id', '');

    if (error) throw error;
  }

  async export(tables?: string[]): Promise<Record<string, any[]>> {
    const tablesToExport = tables || [
      'clients',
      'products',
      'product_components',
      'projects',
      'project_products',
      'transactions',
      'stock_movements'
    ];

    const result: Record<string, any[]> = {};

    for (const table of tablesToExport) {
      result[table] = await this.list(table);
    }

    return result;
  }

  async import(data: Record<string, any[]>): Promise<void> {
    for (const [table, records] of Object.entries(data)) {
      if (records.length > 0) {
        await this.bulkCreate(table, records);
      }
    }
  }
}
