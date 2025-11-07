import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    console.error("❌ Uncaught error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24 }}>
          <h2>Ocorreu um erro inesperado 😢</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>Recarregar página</button>
        </div>
      );
    }

    return this.props.children;
  }
}
E envolva tudo no seu App.tsx:

📄 src/App.tsx

tsx
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AuthProvider } from "./contexts/AuthContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import { AppProvider } from "./contexts/AppContext";
import Dashboard from "./pages/Dashboard";
import LoginScreen from "./components/LoginScreen";

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SettingsProvider>
          <AppProvider>
            <MainRouter />
          </AppProvider>
        </SettingsProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

function MainRouter() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <div>Carregando...</div>;
  if (!isAuthenticated) return <LoginScreen />;
  return <Dashboard />;
}
