/**
 * Utilitários de formatação
 */

/**
 * Formata valor monetário em BRL
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

/**
 * Formata data em formato legível
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString + 'T00:00:00');
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

/**
 * Formata data no formato ISO (YYYY-MM-DD)
 */
export const toISODate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Gera ID único
 */
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Formata mês para exibição
 */
export const formatMonth = (year: number, month: number): string => {
  const date = new Date(year, month - 1);
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(date);
};
