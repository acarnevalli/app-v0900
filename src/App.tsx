import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import LoginScreen from './components/LoginScreen';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import OrdersAndQuotes from './pages/OrdersAndQuotes';  // ✅ CORRIGIDO
import Purchases from './pages/Purchases';
import Finance from './pages/Finance';
import Products from './pages/Products';
import Stock from './pages/Stock';
import Suppliers from './pages/Suppliers';
import Settings from './pages/Settings';
import Users from './pages/Users';
import { AppProvider } from './contexts/AppContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { DebugAuth } from './components/DebugAuth';
import { ToastProvider } from './contexts/ToastContext';
import { CompanySettings } from '../components/CompanySettings';


// Componente AppContent separado - FORA do return
const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.message.includes('charAt') || event.message.includes('undefined')) {
        console.error('[Global Error]', {
          message: event.message,
          filename: event.filename,
          line: event.lineno,
          column: event.colno,
          stack: event.error?.stack
        });
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'clients':
        return <Clients />;
      case 'suppliers':
        return <Suppliers />;
      
      // ✅ NOVA ROTA UNIFICADA
      case 'ordersandquotes':
        return <OrdersAndQuotes />;
      
      // ✅ REDIRECIONAMENTOS DAS ROTAS ANTIGAS
      case 'projects':
      case 'sales':
        // Redireciona automaticamente para a nova página
        setTimeout(() => setCurrentPage('ordersandquotes'), 0);
        return <OrdersAndQuotes />;
      
      case 'purchases':
        return <Purchases />;
      case 'finance':
        return <Finance />;
      case 'products':
        return <Products />;
      case 'stock':
        return <Stock />;
      case 'users':
        return <Users />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <>
      <div className="flex min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
        <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
        <main className="flex-1 ml-64 p-6">
          {renderPage()}
        </main>
      </div>
      <DebugAuth />
    </>
  );
};

// Componente App principal
function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <SettingsProvider>
          <AppProvider>
            <AppContent />
          </AppProvider>
        </SettingsProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
