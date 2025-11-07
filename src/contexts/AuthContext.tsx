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
  name: string;
  role: 'admin' | 'manager' | 'user';
  created_at: string;
}

// Interface para UserProfile do banco
interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'user';
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
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
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // ---------------------------------------------------------------------------
  // Função auxiliar: busca perfil do usuário e converte SupabaseUser -> User local
  // ---------------------------------------------------------------------------
  const mapUser = async (sbUser: SupabaseUser | null): Promise<User | null> => {
    if (!sbUser) return null;

    try {
      console.log('[AuthContext] Buscando perfil para usuário:', sbUser.id, sbUser.email);

      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', sbUser.id)
        .maybeSingle();

      if (error) {
        // Se for erro de recursão infinita, usar perfil básico
        if (error.code === '42P17') {
          console.error('[AuthContext] Erro de recursão infinita, usando perfil básico');
          const fallbackProfile: UserProfile = {
            id: sbUser.id,
            email: sbUser.email ?? "",
            name: sbUser.email?.split('@')[0] ?? "Usuário",
            role: 'user',
          };
          setUserProfile(fallbackProfile);
          return {
            ...fallbackProfile,
            created_at: sbUser.created_at ?? new Date().toISOString(),
          };
        }
        console.error('[AuthContext] Erro ao buscar perfil:', error);
      }

      // Se não encontrou perfil, tentar criar
      if (!profile) {
        console.log('[AuthContext] Perfil não encontrado, criando...');
        
        const newProfile: UserProfile = {
          id: sbUser.id,
          email: sbUser.email || '',
          name: sbUser.email?.split('@')[0] || 'Usuário',
          role: 'user',
        };

        const { data: createdProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert([newProfile])
          .select()
          .maybeSingle();

        if (createError) {
          console.error('[AuthContext] Erro ao criar perfil:', createError);
          // Retornar perfil básico mesmo se falhar
          setUserProfile(newProfile);
          return {
            ...newProfile,
            created_at: sbUser.created_at ?? new Date().toISOString(),
          };
        }

        if (createdProfile) {
          setUserProfile(createdProfile as UserProfile);
          return {
            ...createdProfile,
            created_at: createdProfile.created_at || new Date().toISOString(),
          };
        }
      }

      console.log('[AuthContext] Perfil encontrado:', profile);
      setUserProfile(profile as UserProfile);

      const user: User = {
        id: sbUser.id,
        email: sbUser.email ?? "",
        name: profile?.name ?? sbUser.email?.split('@')[0] ?? "",
        role: profile?.role ?? 'user',
        created_at: sbUser.created_at ?? new Date().toISOString(),
      };

      console.log('[AuthContext] Usuário mapeado:', user);

      return user;
    } catch (err) {
      console.error('[AuthContext] Exceção ao buscar perfil:', err);
      const fallbackProfile: UserProfile = {
        id: sbUser.id,
        email: sbUser.email ?? "",
        name: sbUser.email?.split('@')[0] ?? "Usuário",
        role: 'user',
      };
      setUserProfile(fallbackProfile);
      return {
        ...fallbackProfile,
        created_at: sbUser.created_at ?? new Date().toISOString(),
      };
    }
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

        await handleSessionChange(session);
      } catch (err) {
        console.error("[AuthContext] ❌ Erro ao recuperar sessão:", err);
      } finally {
        setIsLoading(false);
      }

      // Escuta mudanças (login, logout, refresh, etc.)
      const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
        await handleSessionChange(session);
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
  const handleSessionChange = async (session: Session | null) => {
    if (session?.user) {
      const localUser = await mapUser(session.user);
      setSupabaseUser(session.user);
      setUser(localUser);
      setIsAuthenticated(true);
      console.log(`[AuthContext] ✅ Sessão ativa para ${localUser?.email} (${localUser?.role})`);
    } else {
      setSupabaseUser(null);
      setUser(null);
      setUserProfile(null);
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
        const localUser = await mapUser(data.user);
        setSupabaseUser(data.user);
        setUser(localUser);
        setIsAuthenticated(true);
        console.log(`[AuthContext] 👋 Login bem-sucedido: ${localUser?.email} (${localUser?.role})`);
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
      setUserProfile(null);
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
        // Criar perfil imediatamente após o cadastro
        const newProfile: UserProfile = {
          id: data.user.id,
          email: data.user.email || email,
          name: email.split('@')[0],
          role: 'user',
        };

        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert([newProfile]);

        if (profileError) {
          console.error("[AuthContext] Erro ao criar perfil no signup:", profileError);
        }

        if (data.session) {
          const localUser = await mapUser(data.user);
          setSupabaseUser(data.user);
          setUser(localUser);
          setIsAuthenticated(true);
          console.log("[AuthContext] 🎉 Usuário cadastrado e logado automaticamente:", email, `(${localUser?.role})`);
          return { success: true };
        }
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
        userProfile,
        supabaseUser,
        isAuthenticated,
        isLoading,
        login,
        logout,
        signUp,
      }}
    >
      {isLoading ? (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">🔄 Verificando autenticação...</p>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};
