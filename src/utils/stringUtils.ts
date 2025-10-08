// Função segura para charAt
export const safeCharAt = (str: any, index: number): string => {
  try {
    if (str === null || str === undefined) {
      console.warn('safeCharAt called with null/undefined');
      return '';
    }
    
    const stringValue = String(str);
    
    if (index < 0 || index >= stringValue.length) {
      return '';
    }
    
    return stringValue.charAt(index);
  } catch (error) {
    console.error('Error in safeCharAt:', error, { str, index });
    return '';
  }
};

// Função para obter inicial do nome com segurança
export const getInitial = (name: any): string => {
  if (!name) return '?';
  
  try {
    const stringName = String(name).trim();
    return stringName.length > 0 ? stringName[0].toUpperCase() : '?';
  } catch (error) {
    console.error('Error getting initial:', error);
    return '?';
  }
};

// Função para verificar se um valor é uma string válida
export const isValidString = (value: any): value is string => {
  return typeof value === 'string' && value !== null && value !== undefined;
};
