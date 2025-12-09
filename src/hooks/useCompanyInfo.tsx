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
    console.log('🟡 [useCompanyInfo] Iniciando loadCompanyInfo...');

    if (!user) {
      console.warn('⚠️ [useCompanyInfo] Nenhum usuário autenticado. Encerrando loadCompanyInfo.');
      setLoading(false);
      setCompanyInfo(null);
      return;
    }

    console.log('🔍 [useCompanyInfo] Buscando company_info para user:', user.id);

    try {
      const { data, error } = await supabase
        .from('company_info')
        .select('*')
        .eq('user_id', user.id)
        .single();

      console.log('📦 [useCompanyInfo] Resposta Supabase loadCompanyInfo:', { data, error });

      if (error) {
        console.error('❌ [useCompanyInfo] Erro Supabase em loadCompanyInfo:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });

        // Se não existe registro, usar dados padrão
        if (error.code === 'PGRST116') {
          console.warn('⚠️ [useCompanyInfo] Nenhum company_info encontrado. Usando dados padrão.');
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
        console.log('✅ [useCompanyInfo] Company info carregado:', data);
        setCompanyInfo(data);
      }
    } catch (err: any) {
      console.error('💥 [useCompanyInfo] Erro ao carregar informações da empresa:', err);
      setError(err.message);
      // Não bloquear o app; apenas mantém companyInfo como está ou null
    } finally {
      console.log('🔚 [useCompanyInfo] Finalizando loadCompanyInfo.');
      setLoading(false);
    }
  };

  const updateCompanyInfo = async (data: Partial<CompanyInfo>) => {
    if (!user) {
      console.error('❌ [useCompanyInfo] Tentativa de updateCompanyInfo sem usuário autenticado.');
      throw new Error('Usuário não autenticado');
    }

    console.log('🟡 [useCompanyInfo] Iniciando updateCompanyInfo para user:', user.id);
    console.log('✏️ [useCompanyInfo] Dados recebidos para update:', data);

    try {
      setLoading(true);

      console.log('🔍 [useCompanyInfo] Verificando se já existe company_info para user:', user.id);
      const { data: existing, error: existingError } = await supabase
        .from('company_info')
        .select('id')
        .eq('user_id', user.id)
        .single();

      console.log('📦 [useCompanyInfo] Resposta Supabase (verificação existente):', {
        existing,
        existingError,
      });

      if (existingError && existingError.code !== 'PGRST116') {
        console.error('❌ [useCompanyInfo] Erro ao verificar registro existente:', {
          code: existingError.code,
          message: existingError.message,
          details: existingError.details,
          hint: existingError.hint,
        });
        throw existingError;
      }

      if (existing) {
        console.log('🔄 [useCompanyInfo] Registro existente encontrado. Atualizando...');
        const { error } = await supabase
          .from('company_info')
          .update(data)
          .eq('user_id', user.id);

        if (error) {
          console.error('❌ [useCompanyInfo] Erro ao atualizar company_info:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
          });
          throw error;
        }

        console.log('✅ [useCompanyInfo] company_info atualizado com sucesso.');
      } else {
        console.log('🆕 [useCompanyInfo] Nenhum registro existente. Inserindo novo company_info...');
        const payload = { ...data, user_id: user.id };
        console.log('📤 [useCompanyInfo] Payload de inserção:', payload);

        const { error } = await supabase
          .from('company_info')
          .insert([payload]);

        if (error) {
          console.error('❌ [useCompanyInfo] Erro ao inserir company_info:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
          });
          throw error;
        }

        console.log('✅ [useCompanyInfo] company_info inserido com sucesso.');
      }

      console.log('🔁 [useCompanyInfo] Recarregando dados após update/insert...');
      await loadCompanyInfo();
    } catch (err: any) {
      console.error('💥 [useCompanyInfo] Erro ao salvar informações da empresa:', err);
      setError(err.message);
      throw err;
    } finally {
      console.log('🔚 [useCompanyInfo] Finalizando updateCompanyInfo.');
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🧩 [useCompanyInfo] useEffect disparado. user:', user?.id);
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
