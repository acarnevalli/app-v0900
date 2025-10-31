export interface CompanyData {
  id?: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnaePrimario: string;
  dataFundacao: string;
  regimeTributacao: string;
  inscricaoMunicipal: string;
  inscricaoEstadual: string;
  endereco: string;
  numero: string;
  complemento?: string;
  colacao: string;
  bairro: string;
  cep: string;
  foneComercial: string;
  email: string;
  logoUrl?: string;
  criadoEm?: string;
  atualizadoEm?: string;
}
