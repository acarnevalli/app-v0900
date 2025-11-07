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

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'user';
  created_at?: string;
}

export interface AuthContextType {
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
  // Função: busca, cria e converte perfil do usuário do banco
  // ---------------------------------------------------------------------------

  const mapUser = async (
    sbUser: SupabaseUser | null
  ): Promise<User | null> => {
    if (!sbUser) return null;
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', sbUser.id)
        .single();

      if (error) {
        // Se não existir, criar perfil padrão
        if (error.code === 'PGRST116') {
          const { data: newProfile, error: createError } = await supabase
            .from('user_profiles')
            .insert([{
              id: sbUser.id,
              email: sbUser.email ?? "",
              name: sbUser.email?.split('@')[0] ?? "Usuário",
              role: 'user'
            }])
            .select()
            .single();
          if (!createError) {
            setUserProfile(newProfile as UserProfile);
            return {
              id: sbUser.id,
              email: sbUser.email ?? "",
              name: newProfile.name,
              role: newProfile.role,
              created_at: sbUser.created_at ?? new Date().toISOString(),
            };
          }
        }
        return null;
      }
      // Perfil existe
      setUserProfile(profile as UserProfile);
      return {
        id: sbUser.id,
        email: sbUser.email ?? "",
        name: profile.name,
        role: profile.role,
        created_at: sbUser.created_at ?? new Date().toISOString(),
      };
    } catch (err) {
      return null;
    }
  };

  // ---------------------------------------------------------------------------
  // Inicializa sessão atual e escuta alterações
  // ---------------------------------------------------------------------------

  useEffect(() => {
    let isMounted = true;
    let subscription: { unsubscribe: () => void } | null = null;
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          setIsLoading(false);
          setIsAuthenticated(false);
          return;
        }
        await handleSessionChange(session);
      } catch {
        setIsLoading(false);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
      const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (!isMounted) return;
        await handleSessionChange(session);
      });
      subscription = data.subscription;
    };
    initializeAuth();

    return () => {
      isMounted = false;
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
    } else {
      setSupabaseUser(null);
      setUser(null);
      setUserProfile(null);
      setIsAuthenticated(false);
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
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) {
        setIsLoading(false);
        return {
          success: false,
          error: error.message === 'Invalid login credentials'
            ? 'Email ou senha incorretos'
            : error.message,
        };
      }
      if (data.user) {
        const localUser = await mapUser(data.user);
        setSupabaseUser(data.user);
        setUser(localUser);
        setIsAuthenticated(true);
        setIsLoading(false);
        return { success: true };
      }
      setIsLoading(false);
      return {
        success: false,
        error: "Usuário não encontrado"
      };
    } catch (err: any) {
      setIsLoading(false);
      return {
        success: false,
        error: "Erro inesperado ao fazer login."
      };
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
    } catch (err: any) {} finally {
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
        setIsLoading(false);
        return { success: false, error: error.message };
      }
      if (data.user) {
        const newProfile: UserProfile = {
          id: data.user.id,
          email: data.user.email || email,
          name: email.split('@')[0],
          role: 'user',
        };
        await supabase.from('user_profiles').insert([newProfile]);
        if (data.session) {
          const localUser = await mapUser(data.user);
          setSupabaseUser(data.user);
          setUser(localUser);
          setIsAuthenticated(true);
          setIsLoading(false);
          return { success: true };
        }
      }
      setIsLoading(false);
      return { success: false, error: "Falha ao criar usuário" };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: "Erro inesperado durante o cadastro." };
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
        <div>🔄 Verificando autenticação...</div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};
