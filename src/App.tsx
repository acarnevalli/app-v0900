import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import LoginScreen from './components/LoginScreen';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Projects from './pages/Projects';
import Finance from './pages/Finance';
import Products from './pages/Products';
import Stock from './pages/Stock';
import Settings from './pages/Settings';
import { AppProvider } from './contexts/AppContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';

useEffect(() => {
  window.addEventListener('error', (event) => {
    if (event.message.includes('charAt')) {
      console.group('🔴 CharAt Error Details');
      console.error('Message:', event.message);
      console.error('Source:', event.filename);
      console.error('Line:Column:', `${event.lineno}:${event.colno}`);
      
      // Tenta extrair mais contexto do erro
      if (event.error && event.error.stack) {
        const stackLines = event.error.stack.split('\n');
        console.error('Stack trace:');
        stackLines.forEach((line: string, index: number) => {
          if (line.includes('charAt') || index < 5) {
            console.error(`  ${line}`);
          }
        });
      }
      
      console.groupEnd();
    }
  });
}, []);

useEffect(() => {
  // Log quando o contexto muda
  console.log('AppContext State:', {
    clients: Array.isArray(clients) ? clients.length : 'not array',
    projects: Array.isArray(projects) ? projects.length : 'not array',
    products: Array.isArray(products) ? products.length : 'not array',
  });
}, [clients, projects, products]);

// Mudanças Sugeridas por Claude Opus 4
useEffect(() => {
  // Handler para erros não capturados
  window.addEventListener('error', (event) => {
    console.error('=== ERRO DETALHADO ===');
    console.error('Mensagem:', event.message);
    console.error('Arquivo:', event.filename);
    console.error('Linha:', event.lineno);
    console.error('Coluna:', event.colno);
    console.error('Stack:', event.error?.stack);
    
    // Tenta identificar se é erro de charAt
    if (event.message.includes('charAt')) {
      console.error('Erro relacionado a charAt detectado!');
      // Adicione um debugger para pausar quando o erro ocorrer
      debugger;
    }
  });

  // Handler para promises rejeitadas
  window.addEventListener('unhandledrejection', (event) => {
    console.error('=== PROMISE REJEITADA ===');
    console.error('Razão:', event.reason);
  });

  return () => {
    window.removeEventListener('error', () => {});
    window.removeEventListener('unhandledrejection', () => {});
  };
}, []);

console.log('[App] Starting with env:', {
  url: import.meta.env.VITE_SUPABASE_URL ? 'SET' : 'NOT SET',
  key: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET'
});
window.addEventListener('error', (event) => {
  console.error('[Global Error]', event.error);
  if (event.error?.stack) {
  console.error('[CharAt Error] Stack:', event.error.stack);
}
});

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

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
      case 'projects':
        return <Projects />;
      case 'finance':
        return <Finance />;
      case 'products':
        return <Products />;
      case 'stock':
        return <Stock />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <main className="flex-1 ml-64 p-6">
        {renderPage()}
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;
