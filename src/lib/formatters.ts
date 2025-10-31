/**
 * Formatadores de Campos Brasileiros
 * Fornece funções para formatar e validar campos comuns no Brasil
 */

/**
 * Formata CNPJ: XX.XXX.XXX/XXXX-XX
 * @param value - Valor com apenas números
 * @returns CNPJ formatado
 */
export function formatCNPJ(value: string): string {
  const cleaned = value.replace(/\D/g, '');
  const match = cleaned.match(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/);
  
  if (match) {
    return `${match[1]}.${match[2]}.${match[3]}/${match[4]}-${match[5]}`;
  }
  
  return cleaned;
}

/**
 * Remove formatação do CNPJ
 * @param value - CNPJ formatado
 * @returns CNPJ com apenas números
 */
export function unformatCNPJ(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Formata CEP: XXXXX-XXX
 * @param value - Valor com apenas números
 * @returns CEP formatado
 */
export function formatCEP(value: string): string {
  const cleaned = value.replace(/\D/g, '');
  const match = cleaned.match(/(\d{5})(\d{3})/);
  
  if (match) {
    return `${match[1]}-${match[2]}`;
  }
  
  return cleaned;
}

/**
 * Remove formatação do CEP
 * @param value - CEP formatado
 * @returns CEP com apenas números
 */
export function unformatCEP(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Formata Telefone: (XX) XXXX-XXXX ou (XX) XXXXX-XXXX
 * @param value - Valor com apenas números
 * @returns Telefone formatado
 */
export function formatPhone(value: string): string {
  const cleaned = value.replace(/\D/g, '');
  
  // Telefone com 8 dígitos: (XX) XXXX-XXXX
  const match8 = cleaned.match(/(\d{2})(\d{4})(\d{4})/);
  if (match8 && cleaned.length === 10) {
    return `(${match8[1]}) ${match8[2]}-${match8[3]}`;
  }
  
  // Telefone com 9 dígitos: (XX) XXXXX-XXXX
  const match9 = cleaned.match(/(\d{2})(\d{5})(\d{4})/);
  if (match9 && cleaned.length === 11) {
    return `(${match9[1]}) ${match9[2]}-${match9[3]}`;
  }
  
  return cleaned;
}

/**
 * Remove formatação do Telefone
 * @param value - Telefone formatado
 * @returns Telefone com apenas números
 */
export function unformatPhone(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Formata Inscrição Estadual (SP): XXX.XXX.XXX.XXX
 * Nota: Cada estado tem um formato diferente, esta é para SP
 * @param value - Valor com apenas números
 * @returns IE formatado
 */
export function formatIE(value: string): string {
  const cleaned = value.replace(/\D/g, '');
  
  // SP: 12 dígitos XXX.XXX.XXX.XXX
  if (cleaned.length === 12) {
    const match = cleaned.match(/(\d{3})(\d{3})(\d{3})(\d{3})/);
    if (match) {
      return `${match[1]}.${match[2]}.${match[3]}.${match[4]}`;
    }
  }
  
  // RJ: 8 dígitos XX.XXX.XXX
  if (cleaned.length === 8) {
    const match = cleaned.match(/(\d{2})(\d{3})(\d{3})/);
    if (match) {
      return `${match[1]}.${match[2]}.${match[3]}`;
    }
  }
  
  return cleaned;
}

/**
 * Remove formatação da Inscrição Estadual
 * @param value - IE formatado
 * @returns IE com apenas números
 */
export function unformatIE(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Formata Inscrição Municipal: XX.XXX.XXX/XXXX-XX (formato genérico)
 * @param value - Valor com apenas números
 * @returns IM formatado
 */
export function formatIM(value: string): string {
  const cleaned = value.replace(/\D/g, '');
  const match = cleaned.match(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/);
  
  if (match) {
    return `${match[1]}.${match[2]}.${match[3]}/${match[4]}-${match[5]}`;
  }
  
  return cleaned;
}

/**
 * Remove formatação da Inscrição Municipal
 * @param value - IM formatado
 * @returns IM com apenas números
 */
export function unformatIM(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Formata CNAE: XXXX-X/XX
 * @param value - Valor com apenas números
 * @returns CNAE formatado
 */
export function formatCNAE(value: string): string {
  const cleaned = value.replace(/\D/g, '');
  const match = cleaned.match(/(\d{4})(\d{1})(\d{2})/);
  
  if (match) {
    return `${match[1]}-${match[2]}/${match[3]}`;
  }
  
  return cleaned;
}

/**
 * Remove formatação do CNAE
 * @param value - CNAE formatado
 * @returns CNAE com apenas números
 */
export function unformatCNAE(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Aplica formatação automática baseada no tipo de campo
 * @param value - Valor a formatar
 * @param fieldType - Tipo do campo
 * @returns Valor formatado
 */
export function formatField(value: string, fieldType: 'cnpj' | 'cep' | 'phone' | 'ie' | 'im' | 'cnae'): string {
  switch (fieldType) {
    case 'cnpj':
      return formatCNPJ(value);
    case 'cep':
      return formatCEP(value);
    case 'phone':
      return formatPhone(value);
    case 'ie':
      return formatIE(value);
    case 'im':
      return formatIM(value);
    case 'cnae':
      return formatCNAE(value);
    default:
      return value;
  }
}

/**
 * Remove formatação baseada no tipo de campo
 * @param value - Valor formatado
 * @param fieldType - Tipo do campo
 * @returns Valor sem formatação
 */
export function unformatField(value: string, fieldType: 'cnpj' | 'cep' | 'phone' | 'ie' | 'im' | 'cnae'): string {
  switch (fieldType) {
    case 'cnpj':
      return unformatCNPJ(value);
    case 'cep':
      return unformatCEP(value);
    case 'phone':
      return unformatPhone(value);
    case 'ie':
      return unformatIE(value);
    case 'im':
      return unformatIM(value);
    case 'cnae':
      return unformatCNAE(value);
    default:
      return value;
  }
}