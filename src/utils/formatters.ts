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

/** Valor mascarado para o modo privacidade */
export const HIDDEN_CURRENCY = 'R$ ••••';

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
 * Rótulo amigável de dia: "Hoje", "Ontem" ou "terça, 9 de junho"
 */
export const formatDayLabel = (dateString: string): string => {
  const date = new Date(dateString + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return 'Ontem';
  if (diffDays === -1) return 'Amanhã';
  const label = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
};

/**
 * Formata data no formato ISO (YYYY-MM-DD) usando o fuso local
 */
export const toISODate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * Gera ID único e imprevisível (UUID v4)
 */
export const generateId = (): string => {
  return crypto.randomUUID();
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
