import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "../lib/supabase";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";

// -----------------------------------------------------------------------------
// Tipos e interfaces
// -----------------------------------------------------------------------------

export interface User {
  id: string;
  email: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  signUp: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
}

// -----------------------------------------------------------------------------
// Contexto
// -----------------------------------------------------------------------------

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// -----------------------------------------------------------------------------
// Provider
// -----------------------------------------------------------------------------

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // ---------------------------------------------------------------------------
  // Função auxiliar: converte SupabaseUser -> User local
  // ---------------------------------------------------------------------------
  const mapUser = (sbUser: SupabaseUser | null): User | null => {
    if (!sbUser) return null;
    return {
      id: sbUser.id,
      email: sbUser.email ?? "",
      created_at: sbUser.created_at ?? new Date().toISOString(),
    };
  };

  // ---------------------------------------------------------------------------
  // Inicializa sessão atual e escuta alterações
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;

    const initialize = async () => {
      try {
        // Obtém sessão atual
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) throw error;

        handleSessionChange(session);
      } catch (err) {
        console.error("[AuthContext] ❌ Erro ao recuperar sessão:", err);
      } finally {
        setIsLoading(false);
      }

      // Escuta mudanças (login, logout, refresh, etc.)
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        handleSessionChange(session);
      });

      subscription = data.subscription;
    };

    initialize();

    // Cleanup no unmount
    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Manipula mudanças de sessão
  // ---------------------------------------------------------------------------
  const handleSessionChange = (session: Session | null) => {
    if (session?.user) {
      const localUser = mapUser(session.user);
      setSupabaseUser(session.user);
      setUser(localUser);
      setIsAuthenticated(true);
      // Log opcional
      console.log(`[AuthContext] ✅ Sessão ativa para ${localUser?.email}`);
    } else {
      setSupabaseUser(null);
      setUser(null);
      setIsAuthenticated(false);
      console.log("[AuthContext] 🚪 Sessão finalizada");
    }
  };

  // ---------------------------------------------------------------------------
  // Login com e-mail e senha
  // ---------------------------------------------------------------------------
  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("[AuthContext] Erro no login:", error.message);
        return { success: false, error: error.message };
      }

      if (data.user) {
        const localUser = mapUser(data.user);
        setSupabaseUser(data.user);
        setUser(localUser);
        setIsAuthenticated(true);
        console.log(`[AuthContext] 👋 Login bem-sucedido: ${localUser.email}`);
        return { success: true };
      }

      return { success: false, error: "Usuário não encontrado" };
    } catch (err: any) {
      console.error("[AuthContext] Exceção no login:", err);
      return { success: false, error: "Erro inesperado ao fazer login." };
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Logout
  // ---------------------------------------------------------------------------
  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setSupabaseUser(null);
      setUser(null);
      setIsAuthenticated(false);
      console.log("[AuthContext] ✅ Logout realizado com sucesso.");
    } catch (err: any) {
      console.error("[AuthContext] Erro ao deslogar:", err?.message ?? err);
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Registro de novo usuário
  // ---------------------------------------------------------------------------
  const signUp = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase.auth.signUp({ email, password });

      if (error) {
        console.error("[AuthContext] Erro no cadastro:", error.message);
        return { success: false, error: error.message };
      }

      if (data.user) {
        console.log("[AuthContext] 🎉 Usuário cadastrado com sucesso:", email);
        return { success: true };
      }

      return { success: false, error: "Falha ao criar usuário" };
    } catch (err: any) {
      console.error("[AuthContext] Exceção no signUp:", err);
      return { success: false, error: "Erro inesperado durante o cadastro." };
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Renderização conditionally protegida para estado de carregamento
  // ---------------------------------------------------------------------------

  return (
    <AuthContext.Provider
      value={{
        user,
        supabaseUser,
        isAuthenticated,
        isLoading,
        login,
        logout,
        signUp,
      }}
    >
      {isLoading ? (
        <div style={{ padding: 24, fontFamily: "sans-serif" }}>
          🔄 Verificando autenticação...
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};
