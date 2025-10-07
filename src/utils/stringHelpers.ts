export const safeCharAt = (str: string | undefined | null, index: number): string => {
  if (!str || typeof str !== 'string') return '';
  return str.charAt(index);
};

export const safeSubstring = (str: string | undefined | null, start: number, end?: number): string => {
  if (!str || typeof str !== 'string') return '';
  return str.substring(start, end);
};

export const safeReplace = (str: string | undefined | null, pattern: string | RegExp, replacement: string): string => {
  if (!str || typeof str !== 'string') return '';
  return str.replace(pattern, replacement);
};
