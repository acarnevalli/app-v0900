import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

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
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          setSupabaseUser(session.user);
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            created_at: session.user.created_at || new Date().toISOString()
          });
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('[AuthContext] Error loading session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setSupabaseUser(session.user);
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          created_at: session.user.created_at || new Date().toISOString()
        });
        setIsAuthenticated(true);
      } else {
        setSupabaseUser(null);
        setUser(null);
        setIsAuthenticated(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('[AuthContext] Login error:', error.message);
        return false;
      }

      if (data.user) {
        setSupabaseUser(data.user);
        setUser({
          id: data.user.id,
          email: data.user.email || '',
          created_at: data.user.created_at || new Date().toISOString()
        });
        setIsAuthenticated(true);
        return true;
      }

      return false;
    } catch (error) {
      console.error('[AuthContext] Login exception:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setSupabaseUser(null);
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('[AuthContext] Logout error:', error);
    }
  };

  const signUp = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        return { success: true };
      }

      return { success: false, error: 'Failed to create user' };
    } catch (error) {
      console.error('[AuthContext] SignUp exception:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      supabaseUser,
      isAuthenticated,
      isLoading,
      login,
      logout,
      signUp
    }}>
      {children}
    </AuthContext.Provider>
  );
};
