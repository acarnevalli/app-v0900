import { supabase } from '../lib/supabase';
import { CompanyData } from '../types/company';

const TABLE_NAME = 'company_settings';

export const companyService = {
  async getCompanyData(): Promise<CompanyData | null> {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .single();

    if (error) {
      console.error('Erro ao buscar dados da empresa:', error);
      return null;
    }

    return data as CompanyData;
  },

  async updateCompanyData(companyData: CompanyData): Promise<CompanyData | null> {
    const { data: existingData } = await supabase
      .from(TABLE_NAME)
      .select('id')
      .single();

    if (existingData) {
      // Atualizar existente
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .update({
          ...companyData,
          atualizadoEm: new Date().toISOString(),
        })
        .eq('id', existingData.id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar dados da empresa:', error);
        return null;
      }

      return data as CompanyData;
    } else {
      // Criar novo
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .insert([
          {
            ...companyData,
            criadoEm: new Date().toISOString(),
            atualizadoEm: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar dados da empresa:', error);
        return null;
      }

      return data as CompanyData;
    }
  },
};
