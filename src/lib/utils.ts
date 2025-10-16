import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
/**
 * Formata um número como CPF: 000.000.000-00
 */
export const formatCPF = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

/**
 * Formata um número como CNPJ: 00.000.000/0000-00
 */
export const formatCNPJ = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
};

/**
 * Valida se o CPF é matematicamente válido
 */
export const validateCPF = (cpf: string): boolean => {
  const clean = cpf.replace(/\D/g, '');
  if (clean.length !== 11) return false;
  if (/^(\d)\1+$/.test(clean)) return false;

  let sum = 0;
  let pos = 10;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean[i]) * pos--;
  }
  let result = (sum % 11) < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(clean[9])) return false;

  sum = 0;
  pos = 11;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(clean[i]) * pos--;
  }
  result = (sum % 11) < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(clean[10])) return false;

  return true;
};

/**
 * Valida se o CNPJ é matematicamente válido
 */
export const validateCNPJ = (cnpj: string): boolean => {
  const clean = cnpj.replace(/\D/g, '');
  if (clean.length !== 14) return false;
  if (/^(\d)\1+$/.test(clean)) return false;

  let size = 12;
  let sum = 0;
  let pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += parseInt(clean[size - i]) * pos--;
    if (pos < 2) pos = 9;
  }
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(clean[12])) return false;

  size = 13;
  sum = 0;
  pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += parseInt(clean[size - i]) * pos--;
    if (pos < 2) pos = 9;
  }
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(clean[13])) return false;

  return true;
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatDate = (date: string | Date): string => {
  return new Intl.DateTimeFormat('pt-BR').format(
    typeof date === 'string' ? new Date(date) : date
  );
};
