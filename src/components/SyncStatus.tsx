import React from 'react';
import { Cloud, CloudOff, RefreshCw, Check, X } from 'lucide-react';
import { useStorage } from '../contexts/StorageContext';

const SyncStatus: React.FC = () => {
  const { isOnline, syncStatus, lastSyncTime, syncNow, isSupabaseEnabled } = useStorage();
  
  if (!isSupabaseEnabled) {
    return (
      <div className="flex items-center space-x-2 text-gray-500">
        <CloudOff className="h-4 w-4" />
        <span className="text-sm">Modo Local</span>
      </div>
    );
  }
  
  const getSyncIcon = () => {
    if (!isOnline) return <CloudOff className="h-4 w-4 text-gray-400" />;
    
    switch (syncStatus) {
      case 'syncing':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'success':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'error':
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return <Cloud className="h-4 w-4 text-gray-400" />;
    }
  };
  
  const getSyncText = () => {
    if (!isOnline) return 'Offline';
    
    switch (syncStatus) {
      case 'syncing':
        return 'Sincronizando...';
      case 'success':
        return lastSyncTime ? `Sincronizado ${lastSyncTime.toLocaleTimeString()}` : 'Sincronizado';
      case 'error':
        return 'Erro na sincronização';
      default:
        return 'Aguardando sincronização';
    }
  };
  
  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={syncNow}
        disabled={!isOnline || syncStatus === 'syncing'}
        className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {getSyncIcon()}
        <span className="text-sm">{getSyncText()}</span>
      </button>
    </div>
  );
};

export default SyncStatus;
