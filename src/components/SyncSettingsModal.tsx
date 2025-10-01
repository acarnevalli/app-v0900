import React, { useState, useEffect } from 'react';
import { X, Cloud, HardDrive, RefreshCw, CheckCircle, AlertCircle, Upload, Download } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { getStorageManager } from '../lib/storage';
import type { StorageConfig, SyncStatus } from '../lib/storage';

interface SyncSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SyncSettingsModal: React.FC<SyncSettingsModalProps> = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState<StorageConfig | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);

  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadConfig();
      updateSyncStatus();
    }
  }, [isOpen]);

  const loadConfig = () => {
    const manager = getStorageManager();
    const currentConfig = manager.getConfig();
    setConfig(currentConfig);
    setSupabaseUrl(currentConfig.supabase?.url || '');
    setSupabaseKey(currentConfig.supabase?.anonKey || '');
  };

  const updateSyncStatus = () => {
    const manager = getStorageManager();
    setSyncStatus(manager.getSyncStatus());
  };

  const handleProviderChange = async (provider: StorageConfig['provider']) => {
    if (!config) return;

    try {
      const manager = getStorageManager();
      await manager.updateConfig({ provider });
      loadConfig();
      updateSyncStatus();
    } catch (error) {
      console.error('Failed to change provider:', error);
      alert('Erro ao alterar provedor de armazenamento');
    }
  };

  const handleAutoSyncToggle = async () => {
    if (!config) return;

    try {
      const manager = getStorageManager();
      await manager.updateConfig({ autoSync: !config.autoSync });
      loadConfig();
    } catch (error) {
      console.error('Failed to toggle auto sync:', error);
      alert('Erro ao alterar sincronização automática');
    }
  };

  const handleSyncStrategyChange = async (strategy: StorageConfig['syncStrategy']) => {
    if (!config) return;

    try {
      const manager = getStorageManager();
      await manager.updateConfig({ syncStrategy: strategy });
      loadConfig();
    } catch (error) {
      console.error('Failed to change sync strategy:', error);
      alert('Erro ao alterar estratégia de sincronização');
    }
  };

  const handleSaveSupabaseConfig = async () => {
    if (!supabaseUrl || !supabaseKey) {
      alert('Preencha URL e chave do Supabase');
      return;
    }

    try {
      const manager = getStorageManager();
      await manager.updateConfig({
        provider: 'supabase',
        supabase: {
          url: supabaseUrl,
          anonKey: supabaseKey
        }
      });
      loadConfig();
      alert('Configuração do Supabase salva com sucesso');
    } catch (error) {
      console.error('Failed to save Supabase config:', error);
      alert('Erro ao salvar configuração do Supabase');
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const manager = getStorageManager();
      const success = await manager.testConnection();
      setTestResult(success ? 'success' : 'error');
    } catch (error) {
      console.error('Connection test failed:', error);
      setTestResult('error');
    } finally {
      setIsTesting(false);
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);

    try {
      const manager = getStorageManager();
      await manager.sync();
      updateSyncStatus();
      alert('Sincronização concluída com sucesso');
    } catch (error) {
      console.error('Sync failed:', error);
      alert('Erro ao sincronizar: ' + (error as Error).message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleMigrateFromSupabase = async () => {
    if (!confirm('Deseja migrar todos os dados do Supabase para o armazenamento local? Esta operação pode demorar alguns minutos.')) {
      return;
    }

    setIsMigrating(true);

    try {
      const manager = getStorageManager();
      await manager.migrateFromSupabase();
      alert('Migração concluída com sucesso! Todos os dados foram importados para o armazenamento local.');
    } catch (error) {
      console.error('Migration failed:', error);
      alert('Erro ao migrar dados: ' + (error as Error).message);
    } finally {
      setIsMigrating(false);
    }
  };

  const handleExportData = async () => {
    try {
      const manager = getStorageManager();
      const jsonData = await manager.exportData();

      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Erro ao exportar dados');
    }
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const manager = getStorageManager();
      await manager.importData(text);
      alert('Dados importados com sucesso!');
    } catch (error) {
      console.error('Import failed:', error);
      alert('Erro ao importar dados: arquivo inválido');
    }
  };

  if (!isOpen || !config) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Configurações de Sincronização</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Cloud className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900">Status da Sincronização</h3>
                <div className="mt-2 space-y-1 text-sm text-blue-800">
                  <p>Provedor: <strong>{config.provider === 'local' ? 'Local' : 'Supabase'}</strong></p>
                  {syncStatus && (
                    <>
                      <p>Status: <strong>{syncStatus.isOnline ? 'Online' : 'Offline'}</strong></p>
                      <p>Operações pendentes: <strong>{syncStatus.pendingOperations}</strong></p>
                      {syncStatus.lastSync && (
                        <p>Última sincronização: <strong>{new Date(syncStatus.lastSync).toLocaleString()}</strong></p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Provedor de Armazenamento</h3>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleProviderChange('local')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  config.provider === 'local'
                    ? 'border-[#8B4513] bg-[#8B4513]/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <HardDrive className="w-8 h-8 mx-auto mb-2 text-[#8B4513]" />
                <div className="font-medium">Local</div>
                <div className="text-xs text-gray-600 mt-1">Armazenamento offline</div>
              </button>

              <button
                onClick={() => handleProviderChange('supabase')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  config.provider === 'supabase'
                    ? 'border-[#8B4513] bg-[#8B4513]/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Cloud className="w-8 h-8 mx-auto mb-2 text-[#8B4513]" />
                <div className="font-medium">Supabase</div>
                <div className="text-xs text-gray-600 mt-1">Sincronização na nuvem</div>
              </button>
            </div>
          </div>

          {config.provider === 'supabase' && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold text-gray-900">Configuração Supabase</h3>

              <div>
                <Label htmlFor="supabase-url">URL do Projeto</Label>
                <Input
                  id="supabase-url"
                  type="url"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  placeholder="https://seu-projeto.supabase.co"
                />
              </div>

              <div>
                <Label htmlFor="supabase-key">Chave Anônima (Anon Key)</Label>
                <Input
                  id="supabase-key"
                  type="password"
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSaveSupabaseConfig} className="flex-1">
                  Salvar Configuração
                </Button>
                <Button
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  variant="outline"
                  className="flex-1"
                >
                  {isTesting ? 'Testando...' : 'Testar Conexão'}
                </Button>
              </div>

              {testResult && (
                <div className={`flex items-center gap-2 p-3 rounded-lg ${
                  testResult === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                  {testResult === 'success' ? (
                    <><CheckCircle className="w-5 h-5" /> Conexão bem-sucedida!</>
                  ) : (
                    <><AlertCircle className="w-5 h-5" /> Falha na conexão</>
                  )}
                </div>
              )}
            </div>
          )}

          {config.provider !== 'local' && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold text-gray-900">Opções de Sincronização</h3>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Sincronização Automática</div>
                  <div className="text-sm text-gray-600">Sincronizar automaticamente a cada 5 minutos</div>
                </div>
                <button
                  onClick={handleAutoSyncToggle}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    config.autoSync ? 'bg-[#8B4513]' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      config.autoSync ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div>
                <Label>Estratégia de Resolução de Conflitos</Label>
                <select
                  value={config.syncStrategy}
                  onChange={(e) => handleSyncStrategyChange(e.target.value as StorageConfig['syncStrategy'])}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="newest-wins">Mais recente vence</option>
                  <option value="local-wins">Local vence</option>
                  <option value="remote-wins">Remoto vence</option>
                  <option value="manual">Resolução manual</option>
                </select>
              </div>

              <Button
                onClick={handleManualSync}
                disabled={isSyncing}
                className="w-full"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Sincronizando...' : 'Sincronizar Agora'}
              </Button>
            </div>
          )}

          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold text-gray-900">Backup e Migração</h3>

            <div className="grid grid-cols-2 gap-2">
              <Button onClick={handleExportData} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Exportar Dados
              </Button>

              <Button variant="outline" className="relative">
                <Upload className="w-4 h-4 mr-2" />
                Importar Dados
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </Button>
            </div>

            {config.supabase && (
              <Button
                onClick={handleMigrateFromSupabase}
                disabled={isMigrating}
                variant="outline"
                className="w-full"
              >
                {isMigrating ? 'Migrando...' : 'Migrar Dados do Supabase para Local'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
