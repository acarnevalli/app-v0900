export const safeCharAt = (str: string | undefined | null, index: number): string => {
  // Adicione esta verificação completa
  if (str === null || str === undefined || typeof str !== 'string') {
    return '';
  }
  if (index < 0 || index >= str.length) {
    return '';
  }
  return str.charAt(index);
};

export const safeSubstring = (str: string | undefined | null, start: number, end?: number): string => {
  if (str === null || str === undefined || typeof str !== 'string') {
    return '';
  }
  return str.substring(start, end);
};
