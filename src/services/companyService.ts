import { supabase } from '../lib/supabase';
import { CompanyData } from '../types/company';

const TABLE_NAME = 'company_settings';

export const companyService = {
  async getCompanyData(): Promise<CompanyData | null> {
    try {
      // Tenta buscar dados existentes
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .maybeSingle(); // Usa maybeSingle ao invés de single para evitar erro se não houver dados

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = "results contain 0 rows"
        console.error('Erro ao buscar dados da empresa:', error);
        return null;
      }

      if (!data) {
        return null;
      }

      return mapDbDataToCompanyData(data);
    } catch (err) {
      console.error('Erro na requisição:', err);
      return null;
    }
  },

  async updateCompanyData(companyData: CompanyData): Promise<CompanyData | null> {
    try {
      const existingData = await this.getCompanyData();

      if (existingData && existingData.id) {
        // Atualizar existente
        const { data, error } = await supabase
          .from(TABLE_NAME)
          .update({
            cnpj: companyData.cnpj,
            razao_social: companyData.razaoSocial,
            nome_fantasia: companyData.nomeFantasia,
            cnae_primario: companyData.cnaePrimario,
            data_fundacao: companyData.dataFundacao,
            regime_tributacao: companyData.regimeTributacao,
            inscricao_municipal: companyData.inscricaoMunicipal,
            inscricao_estadual: companyData.inscricaoEstadual,
            endereco: companyData.endereco,
            numero: companyData.numero,
            complemento: companyData.complemento,
            colacao: companyData.colacao,
            bairro: companyData.bairro,
            cep: companyData.cep,
            fone_comercial: companyData.foneComercial,
            email: companyData.email,
            logo_url: companyData.logoUrl,
            atualizado_em: new Date().toISOString(),
          })
          .eq('id', existingData.id)
          .select()
          .single();

        if (error) {
          console.error('Erro ao atualizar dados da empresa:', error);
          return null;
        }

        return mapDbDataToCompanyData(data);
      } else {
        // Criar novo
        const { data, error } = await supabase
          .from(TABLE_NAME)
          .insert([
            {
              cnpj: companyData.cnpj,
              razao_social: companyData.razaoSocial,
              nome_fantasia: companyData.nomeFantasia,
              cnae_primario: companyData.cnaePrimario,
              data_fundacao: companyData.dataFundacao,
              regime_tributacao: companyData.regimeTributacao,
              inscricao_municipal: companyData.inscricaoMunicipal,
              inscricao_estadual: companyData.inscricaoEstadual,
              endereco: companyData.endereco,
              numero: companyData.numero,
              complemento: companyData.complemento,
              colacao: companyData.colacao,
              bairro: companyData.bairro,
              cep: companyData.cep,
              fone_comercial: companyData.foneComercial,
              email: companyData.email,
              logo_url: companyData.logoUrl,
              criado_em: new Date().toISOString(),
              atualizado_em: new Date().toISOString(),
            },
          ])
          .select()
          .single();

        if (error) {
          console.error('Erro ao criar dados da empresa:', error);
          return null;
        }

        return mapDbDataToCompanyData(data);
      }
    } catch (err) {
      console.error('Erro na requisição:', err);
      return null;
    }
  },

  async uploadLogo(file: File): Promise<string | null> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `company-logo-${Date.now()}.${fileExt}`;
      const filePath = `company-logos/${fileName}`;

      // Faz upload do arquivo
      const { data, error } = await supabase.storage
        .from('company-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('Erro ao fazer upload do logo:', error);
        return null;
      }

      // Retorna a URL pública
      const { data: publicUrl } = supabase.storage
        .from('company-assets')
        .getPublicUrl(filePath);

      return publicUrl.publicUrl;
    } catch (err) {
      console.error('Erro no upload:', err);
      return null;
    }
  },
};

// Função auxiliar para mapear dados do banco para o formato da interface
function mapDbDataToCompanyData(dbData: any): CompanyData {
  return {
    id: dbData.id,
    cnpj: dbData.cnpj,
    razaoSocial: dbData.razao_social,
    nomeFantasia: dbData.nome_fantasia,
    cnaePrimario: dbData.cnae_primario,
    dataFundacao: dbData.data_fundacao,
    regimeTributacao: dbData.regime_tributacao,
    inscricaoMunicipal: dbData.inscricao_municipal,
    inscricaoEstadual: dbData.inscricao_estadual,
    endereco: dbData.endereco,
    numero: dbData.numero,
    complemento: dbData.complemento,
    colacao: dbData.colacao,
    bairro: dbData.bairro,
    cep: dbData.cep,
    foneComercial: dbData.fone_comercial,
    email: dbData.email,
    logoUrl: dbData.logo_url,
    criadoEm: dbData.criado_em,
    atualizadoEm: dbData.atualizado_em,
  };
}
