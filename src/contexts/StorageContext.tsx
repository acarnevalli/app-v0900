import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { initializeStorage, StorageManager, getStorageManager } from '../lib/storage';

interface StorageContextType {
  isInitialized: boolean;
  storageManager: StorageManager | null;
  isOnline: boolean;
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

  useEffect(() => {
    const initialize = async () => {
      try {
        console.log('[StorageContext] Starting initialization...');

        const config: any = {
          provider: 'local',
          autoSync: false,
          syncStrategy: 'newest-wins'
        };

        console.log('[StorageContext] Initializing with local-only config');
        const manager = await initializeStorage(config);
        console.log('[StorageContext] Storage manager initialized successfully');

        setStorageManager(manager);
        setIsInitialized(true);
      } catch (error) {
        console.error('[StorageContext] Failed to initialize storage:', error);
        const fallbackManager = await initializeStorage({ provider: 'local' });
        setStorageManager(fallbackManager);
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
      storageManager?.destroy();
    };
  }, []);

  return (
    <StorageContext.Provider value={{ isInitialized, storageManager, isOnline }}>
      {children}
    </StorageContext.Provider>
  );
};
