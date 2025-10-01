import { useCallback } from 'react';
import { IStorageAdapter, DataRecord, QueryOptions } from './types';
import { getStorageManager } from './storage-manager';

export const useStorageOperations = () => {
  const getAdapter = useCallback((): IStorageAdapter => {
    return getStorageManager().getAdapter();
  }, []);

  const addPendingSync = useCallback((table: string, operation: 'create' | 'update' | 'delete', data: any) => {
    const manager = getStorageManager();
    const syncManager = manager.getSyncManager();

    syncManager.addPendingOperation({
      table,
      operation,
      data
    });
  }, []);

  const get = useCallback(async <T extends DataRecord>(table: string, id: string): Promise<T | null> => {
    const adapter = getAdapter();
    return adapter.get<T>(table, id);
  }, [getAdapter]);

  const list = useCallback(async <T extends DataRecord>(table: string, options?: QueryOptions): Promise<T[]> => {
    const adapter = getAdapter();
    return adapter.list<T>(table, options);
  }, [getAdapter]);

  const create = useCallback(async <T extends DataRecord>(table: string, data: Omit<T, 'id' | 'created_at'>): Promise<T> => {
    const adapter = getAdapter();
    const result = await adapter.create<T>(table, data);
    addPendingSync(table, 'create', result);
    return result;
  }, [getAdapter, addPendingSync]);

  const update = useCallback(async <T extends DataRecord>(table: string, id: string, data: Partial<T>): Promise<T> => {
    const adapter = getAdapter();
    const result = await adapter.update<T>(table, id, data);
    addPendingSync(table, 'update', result);
    return result;
  }, [getAdapter, addPendingSync]);

  const remove = useCallback(async (table: string, id: string): Promise<void> => {
    const adapter = getAdapter();
    await adapter.delete(table, id);
    addPendingSync(table, 'delete', { id });
  }, [getAdapter, addPendingSync]);

  const query = useCallback(async <T extends DataRecord>(table: string, options: QueryOptions): Promise<T[]> => {
    const adapter = getAdapter();
    return adapter.query<T>(table, options);
  }, [getAdapter]);

  const count = useCallback(async (table: string, options?: QueryOptions): Promise<number> => {
    const adapter = getAdapter();
    return adapter.count(table, options);
  }, [getAdapter]);

  const exists = useCallback(async (table: string, id: string): Promise<boolean> => {
    const adapter = getAdapter();
    return adapter.exists(table, id);
  }, [getAdapter]);

  return {
    get,
    list,
    create,
    update,
    remove,
    query,
    count,
    exists
  };
};
