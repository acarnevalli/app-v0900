import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { initializeStorage, StorageManager } from '../lib/storage';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface StorageContextType {
  isInitialized: boolean;
  storageManager: StorageManager | null;
  isOnline: boolean;
  syncStatus: 'idle' | 'syncing' | 'error' | 'success';
  lastSyncTime: Date | null;
  syncNow: () => Promise<void>;
  isSupabaseEnabled: boolean;
}

const StorageContext = createContext<StorageContextType | undefined>(undefined);

export const useStorage = () => {
  const context = useContext(StorageContext);
  if (!context) {
    throw new Error('useStorage must be used within a StorageProvider');
  }
  return context;
};

export const StorageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [storageManager, setStorageManager] = useState<StorageManager | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error' | 'success'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isSupabaseEnabled] = useState(isSupabaseConfigured());

  // Remover syncWithSupabase da lista de dependências do useEffect
  const syncWithSupabase = async () => {
    if (!isSupabaseEnabled || !storageManager || syncStatus === 'syncing') return;
    
    setSyncStatus('syncing');
    try {
      console.log('[StorageContext] Sync with Supabase - Feature coming soon');
      
      // TODO: Implementar sincronização quando os métodos estiverem disponíveis
      // Por enquanto, apenas simular sucesso
      setTimeout(() => {
        setSyncStatus('success');
        setLastSyncTime(new Date());
        console.log('[StorageContext] ✅ Sync simulation completed');
      }, 1000);
      
    } catch (error) {
      console.error('[StorageContext] Sync error:', error);
      setSyncStatus('error');
    }
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        console.log('[StorageContext] Starting initialization...');
        
        // Sempre usar local por enquanto
        const config: any = {
          provider: 'local',
          autoSync: false,
          syncStrategy: 'newest-wins'
        };

        if (isSupabaseEnabled) {
          console.log('[StorageContext] Supabase detected - will enable sync when ready');
        } else {
          console.log('[StorageContext] Running in local-only mode');
        }

        const manager = await initializeStorage(config);
        setStorageManager(manager);
        setIsInitialized(true);
        
      } catch (error) {
        console.error('[StorageContext] Failed to initialize storage:', error);
        // Fallback para garantir que o app funcione
        setIsInitialized(true);
      }
    };

    initialize();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (storageManager && typeof storageManager.destroy === 'function') {
        storageManager.destroy();
      }
    };
  }, []); // Sem dependências para evitar re-execução

  const syncNow = async () => {
    if (isSupabaseEnabled && isOnline) {
      await syncWithSupabase();
    }
  };

  return (
    <StorageContext.Provider 
      value={{ 
        isInitialized, 
        storageManager, 
        isOnline,
        syncStatus,
        lastSyncTime,
        syncNow,
        isSupabaseEnabled
      }}
    >
      {children}
    </StorageContext.Provider>
  );
};
