// src/hooks/useCompanyInfo.tsx

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface CompanyInfo {
  id?: string;
  company_name: string;
  cnpj: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  logo_url: string;
  user_id?: string;
}

export const useCompanyInfo = () => {
  const { user } = useAuth();
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCompanyInfo = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('company_info')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // Se não existe, retornar dados padrão
        if (error.code === 'PGRST116') {
          setCompanyInfo({
            company_name: 'Sua Empresa',
            cnpj: '00.000.000/0000-00',
            address: 'Rua Exemplo, 123',
            city: 'Cidade',
            phone: '(00) 0000-0000',
            email: 'contato@empresa.com',
            logo_url: '',
          });
        } else {
          throw error;
        }
      } else {
        setCompanyInfo(data);
      }
    } catch (err: any) {
      console.error('Erro ao carregar informações da empresa:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateCompanyInfo = async (data: Partial<CompanyInfo>) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      setLoading(true);

      // Verificar se já existe registro
      const { data: existing } = await supabase
        .from('company_info')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existing) {
        // Update
        const { error } = await supabase
          .from('company_info')
          .update(data)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('company_info')
          .insert([{ ...data, user_id: user.id }]);

        if (error) throw error;
      }

      // Recarregar dados
      await loadCompanyInfo();
    } catch (err: any) {
      console.error('Erro ao salvar informações da empresa:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanyInfo();
  }, [user]);

  return {
    companyInfo,
    loading,
    error,
    updateCompanyInfo,
    reloadCompanyInfo: loadCompanyInfo,
  };
};
