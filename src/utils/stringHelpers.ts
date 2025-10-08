import { isValidString } from './stringUtils';

export const safeCharAt = (str: string | undefined | null, index: number): string => {
  if (!isValidString(str)) {
    console.warn('safeCharAt: Invalid input', { str, type: typeof str });
    return '';
  }
  
  if (index < 0 || index >= str.length) {
    return '';
  }
  
  try {
    return str.charAt(index);
  } catch (error) {
    console.error('charAt error in safeCharAt:', error);
    return '';
  }
};
