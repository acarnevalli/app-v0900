// src/contexts/StorageContext.tsx
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

  useEffect(() => {
    const initialize = async () => {
      try {
        console.log('[StorageContext] Starting initialization...');
        
        // Configuração baseada na disponibilidade do Supabase
        const config: any = {
          provider: isSupabaseEnabled ? 'hybrid' : 'local', // hybrid = local + supabase
          autoSync: isSupabaseEnabled && isOnline,
          syncStrategy: 'newest-wins'
        };

        if (isSupabaseEnabled) {
          console.log('[StorageContext] Supabase detected - initializing with cloud sync');
          // Testar conexão com Supabase
          const { error } = await supabase.from('projects').select('count').limit(1);
          if (error && error.code !== 'PGRST116') {
            console.error('[StorageContext] Supabase connection error:', error);
          } else {
            console.log('[StorageContext] ✅ Supabase connected successfully');
          }
        } else {
          console.log('[StorageContext] Running in local-only mode');
        }

        const manager = await initializeStorage(config);
        setStorageManager(manager);
        setIsInitialized(true);
        
        // Se Supabase estiver configurado, fazer sync inicial
        if (isSupabaseEnabled && isOnline) {
          syncWithSupabase();
        }
      } catch (error) {
        console.error('[StorageContext] Failed to initialize storage:', error);
        // Fallback para local
        const fallbackManager = await initializeStorage({ provider: 'local' });
        setStorageManager(fallbackManager);
        setIsInitialized(true);
      }
    };

    initialize();

    const handleOnline = () => {
      setIsOnline(true);
      if (isSupabaseEnabled) {
        syncWithSupabase();
      }
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Auto-sync a cada 5 minutos se online e Supabase configurado
    let syncInterval: NodeJS.Timeout | null = null;
    if (isSupabaseEnabled) {
      syncInterval = setInterval(() => {
        if (isOnline) {
          syncWithSupabase();
        }
      }, 5 * 60 * 1000); // 5 minutos
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (syncInterval) clearInterval(syncInterval);
      storageManager?.destroy();
    };
  }, [isSupabaseEnabled, isOnline]);

  const syncWithSupabase = async () => {
    if (!isSupabaseEnabled || !storageManager || syncStatus === 'syncing') return;
    
    setSyncStatus('syncing');
    try {
      console.log('[StorageContext] Starting sync with Supabase...');
      
      // Aqui você implementa a lógica de sincronização
      // Por exemplo, sincronizar projetos:
      const localProjects = await storageManager.getAllProjects();
      
      // Enviar projetos locais para Supabase
      for (const project of localProjects) {
        const { error } = await supabase
          .from('projects')
          .upsert(project, { onConflict: 'id' });
        
        if (error) {
          console.error('[StorageContext] Error syncing project:', error);
        }
      }
      
      // Buscar projetos do Supabase
      const { data: remoteProjects, error } = await supabase
        .from('projects')
        .select('*');
      
      if (!error && remoteProjects) {
        // Atualizar storage local com dados remotos
        for (const project of remoteProjects) {
          await storageManager.saveProject(project);
        }
      }
      
      setSyncStatus('success');
      setLastSyncTime(new Date());
      console.log('[StorageContext] ✅ Sync completed successfully');
    } catch (error) {
      console.error('[StorageContext] Sync error:', error);
      setSyncStatus('error');
    }
  };

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
