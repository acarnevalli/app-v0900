import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Users, 
  DollarSign, 
  Package, 
  BarChart3, 
  Settings, 
  LogOut, 
  Wifi, 
  WifiOff, 
  Cloud, 
  UserCog, 
  ShoppingCart, 
  ShoppingBag, 
  ChevronDown, 
  ChevronRight,
  FileText  // ✅ NOVO ÍCONE
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getStorageManager } from '../lib/storage';

interface SidebarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

const getInitial = (name: string): string => {
  if (!name || typeof name !== 'string' || name.length === 0) {
    return '?';
  }
  return name.charAt(0).toUpperCase();
};

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage }) => {
  const { user, userProfile, logout } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<any>(null);

  // Estados para controle de expansão dos grupos
  const [expandedGroups, setExpandedGroups] = useState({
    sales: true,
    purchases: true,
  });

  useEffect(() => {
    console.log('[Sidebar] User state:', user);
    console.log('[Sidebar] User profile:', userProfile);
  }, [user, userProfile]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const updateSyncStatus = () => {
      try {
        const manager = getStorageManager();
        setSyncStatus(manager.getSyncStatus());
      } catch (error) {
        console.error('Failed to get sync status:', error);
      }
    };

    updateSyncStatus();
    const interval = setInterval(updateSyncStatus, 5000);

    // Recupera o estado de expansão do localStorage
    const saved = localStorage.getItem('sidebar-expanded-groups');
    if (saved) {
      try {
        setExpandedGroups(JSON.parse(saved));
      } catch (e) {
        console.warn('Invalid sidebar-expanded-groups in localStorage');
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  // Salva estado de expansão
  useEffect(() => {
    localStorage.setItem('sidebar-expanded-groups', JSON.stringify(expandedGroups));
  }, [expandedGroups]);

  // Função para alternar grupo expandido
  const toggleGroup = (group: 'sales' | 'purchases') => {
    setExpandedGroups(prev => ({
      ...prev,
      [group]: !prev[group],
    }));
  };

  // ✅ ATUALIZADO: Define se o item está ativo
  const isActive = (pageId: string) => {
    return currentPage === pageId;
  };

  // ✅ ATUALIZADO: Ícone do grupo Vendas
  const salesIcon = isActive('clients') || isActive('products') || isActive('ordersandquotes')
    ? ShoppingBag
    : ShoppingCart;

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-amber-900 via-amber-800 to-orange-900 text-white shadow-2xl backdrop-blur-sm">
      <div className="p-6 border-b border-amber-700/50">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-br from-white to-amber-50 rounded-xl p-3 shadow-lg">
            <img src="favicon.svg" alt="Logo" className="h-14 w-14" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white drop-shadow-sm">MarcenariaPro</h1>
            <p className="text-sm text-amber-200/90">Gestão Completa</p>
          </div>
        </div>
        
        {/* Informações do usuário */}
        <div className="mt-4 pt-4 border-t border-amber-700/50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">
                {userProfile?.name ? getInitial(userProfile.name) : '?'}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                {userProfile?.name || user?.email || 'Carregando...'}
              </p>
              <p className="text-xs text-amber-200/80">
                {userProfile?.role === 'admin' ? 'Administrador' : 'Usuário'}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <nav className="mt-8 px-3 overflow-y-auto max-h-[calc(100vh-400px)]">
        {/* Dashboard */}
        <button
          key="dashboard"
          onClick={() => setCurrentPage('dashboard')}
          className={`w-full flex items-center space-x-3 px-4 py-3 mb-2 text-left transition-all duration-300 rounded-xl hover:bg-amber-700/70 hover:shadow-lg ${
            currentPage === 'dashboard'
              ? 'bg-gradient-to-r from-amber-700 to-orange-600 text-white shadow-lg transform translate-x-1'
              : 'text-amber-100 hover:text-white hover:translate-x-1'
          }`}
        >
          <Home className="h-5 w-5 flex-shrink-0" />
          <span className="font-medium text-sm">Dashboard</span>
        </button>

        {/* ✅ GRUPO VENDAS ATUALIZADO */}
        <div className="mb-1">
          <button
            onClick={() => toggleGroup('sales')}
            className="w-full flex items-center justify-between px-4 py-2.5 text-amber-200 hover:text-white hover:bg-amber-800/30 rounded-xl transition-all duration-200 text-sm font-medium"
            aria-expanded={expandedGroups.sales}
          >
            <div className="flex items-center space-x-3">
              <salesIcon className="h-5 w-5" />
              <span>Vendas</span>
            </div>
            {expandedGroups.sales ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>

          <div className={`pl-8 overflow-hidden transition-all duration-300 ${expandedGroups.sales ? 'max-h-60 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
            {[
              { id: 'clients', label: 'Clientes', icon: Users },
              { id: 'products', label: 'Produtos', icon: Package },
              // ✅ NOVO ITEM UNIFICADO (substituiu Projects e Sales)
              { id: 'ordersandquotes', label: 'Vendas e Orçamentos', icon: FileText },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 my-1 text-left transition-all duration-300 rounded-lg ${
                    currentPage === item.id
                      ? 'bg-gradient-to-r from-orange-700 to-red-600 text-white font-medium shadow-md'
                      : 'text-amber-100 hover:text-white hover:bg-amber-800/40'
                  }`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="text-xs">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* GRUPO COMPRAS */}
        <div className="mb-1">
          <button
            onClick={() => toggleGroup('purchases')}
            className="w-full flex items-center justify-between px-4 py-2.5 text-amber-200 hover:text-white hover:bg-amber-800/30 rounded-xl transition-all duration-200 text-sm font-medium"
            aria-expanded={expandedGroups.purchases}
          >
            <div className="flex items-center space-x-3">
              <Package className="h-5 w-5" />
              <span>Compras</span>
            </div>
            {expandedGroups.purchases ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>

          <div className={`pl-8 overflow-hidden transition-all duration-300 ${expandedGroups.purchases ? 'max-h-60 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
            {[
              { id: 'purchases', label: 'Pedidos', icon: ShoppingBag },
              { id: 'stock', label: 'Estoque', icon: BarChart3 },
              { id: 'suppliers', label: 'Fornecedores', icon: Users },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 my-1 text-left transition-all duration-300 rounded-lg ${
                    currentPage === item.id
                      ? 'bg-gradient-to-r from-orange-700 to-red-600 text-white font-medium shadow-md'
                      : 'text-amber-100 hover:text-white hover:bg-amber-800/40'
                  }`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="text-xs">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* FINANÇAS */}
        <button
          onClick={() => setCurrentPage('finance')}
          className={`w-full flex items-center space-x-3 px-4 py-3 mb-2 mt-1 text-left transition-all duration-300 rounded-xl hover:bg-amber-700/70 hover:shadow-lg ${
            currentPage === 'finance'
              ? 'bg-gradient-to-r from-amber-700 to-orange-600 text-white shadow-lg transform translate-x-1'
              : 'text-amber-100 hover:text-white hover:translate-x-1'
          }`}
        >
          <DollarSign className="h-5 w-5 flex-shrink-0" />
          <span className="font-medium text-sm">Finanças</span>
        </button>

        {/* Itens condicionais (admin) */}
        {userProfile?.role === 'admin' && (
          <>
            <button
              onClick={() => setCurrentPage('users')}
              className={`w-full flex items-center space-x-3 px-4 py-3 mb-2 text-left transition-all duration-300 rounded-xl hover:bg-amber-700/70 hover:shadow-lg ${
                currentPage === 'users'
                  ? 'bg-gradient-to-r from-amber-700 to-orange-600 text-white shadow-lg transform translate-x-1'
                  : 'text-amber-100 hover:text-white hover:translate-x-1'
              }`}
            >
              <UserCog className="h-5 w-5 flex-shrink-0" />
              <span className="font-medium text-sm">Usuários</span>
            </button>
            
            <button
              onClick={() => setCurrentPage('settings')}
              className={`w-full flex items-center space-x-3 px-4 py-3 mb-2 text-left transition-all duration-300 rounded-xl hover:bg-amber-700/70 hover:shadow-lg ${
                currentPage === 'settings'
                  ? 'bg-gradient-to-r from-amber-700 to-orange-600 text-white shadow-lg transform translate-x-1'
                  : 'text-amber-100 hover:text-white hover:translate-x-1'
              }`}
            >
              <Settings className="h-5 w-5 flex-shrink-0" />
              <span className="font-medium text-sm">Configurações</span>
            </button>
          </>
        )}
      </nav>
      
      <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-amber-700/50 bg-gradient-to-t from-amber-900/50 space-y-3">
        {syncStatus && (
          <div className="mb-2 px-3 py-2 bg-amber-800/30 rounded-lg border border-amber-700/30">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                {isOnline ? (
                  <Wifi className="h-3 w-3 text-green-400" />
                ) : (
                  <WifiOff className="h-3 w-3 text-orange-400" />
                )}
                <span className="text-amber-100">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                {syncStatus.provider === 'local' ? (
                  <span className="text-amber-200">Local</span>
                ) : (
                  <>
                    <Cloud className="h-3 w-3 text-blue-400" />
                    <span className="text-amber-200">Nuvem</span>
                  </>
                )}
              </div>
            </div>
            {syncStatus.pendingOperations > 0 && (
              <div className="mt-1 text-xs text-amber-300">
                {syncStatus.pendingOperations} pendente{syncStatus.pendingOperations > 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}

        <button
          onClick={logout}
          className="w-full flex items-center space-x-3 px-4 py-3 text-left transition-all duration-300 rounded-xl hover:bg-red-600/70 hover:shadow-lg text-amber-100 hover:text-white"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          <span className="font-medium text-sm">Sair do Sistema</span>
        </button>

        <div className="text-center text-amber-200/80">
          <p className="text-xs">Sistema de Gestão</p>
          <p className="text-xs">v1.0.0</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
