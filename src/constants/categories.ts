import type { DefaultCategoryType, RecurrenceType } from '../types';

export const INCOME_CATEGORIES: Record<string, string> = {
  salary: 'Salário',
  freelance: 'Freelance',
  bonus: 'Bônus/Comissão',
};

export const EXPENSE_CATEGORIES: Record<string, string> = {
  housing: 'Moradia',
  food: 'Alimentação',
  transport: 'Transporte',
  utilities: 'Contas',
  health: 'Saúde',
  education: 'Educação',
  entertainment: 'Entretenimento',
  shopping: 'Compras',
  savings: 'Poupança',
  other: 'Outros',
};

export const ALL_CATEGORIES: Record<string, string> = {
  ...INCOME_CATEGORIES,
  ...EXPENSE_CATEGORIES,
};

export const CATEGORY_COLORS: Record<DefaultCategoryType, string> = {
  salary: '#10b981',
  freelance: '#3b82f6',
  bonus: '#8b5cf6',
  housing: '#f97316',
  food: '#f59e0b',
  transport: '#06b6d4',
  utilities: '#6b7280',
  health: '#ef4444',
  education: '#a855f7',
  entertainment: '#ec4899',
  shopping: '#14b8a6',
  savings: '#22c55e',
  other: '#9ca3af',
};

export const CATEGORY_EMOJIS: Record<DefaultCategoryType, string> = {
  salary: '💰',
  freelance: '💻',
  bonus: '🎁',
  housing: '🏠',
  food: '🍽️',
  transport: '🚗',
  utilities: '⚡',
  health: '❤️',
  education: '📚',
  entertainment: '🎮',
  shopping: '🛍️',
  savings: '🏦',
  other: '📌',
};

/** Cores disponíveis para categorias customizadas */
export const CUSTOM_CATEGORY_COLORS = [
  '#6366f1', '#ec4899', '#f97316', '#f59e0b', '#10b981',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6',
];

export const RECURRENCE_LABELS: Record<RecurrenceType, string> = {
  none: 'Não repete',
  monthly: 'Mensal',
  semiannual: 'Semestral',
  annual: 'Anual',
};

export const RECURRENCE_BADGE_COLORS: Record<RecurrenceType, string> = {
  none: '#9ca3af',
  monthly: '#3b82f6',
  semiannual: '#8b5cf6',
  annual: '#f59e0b',
};
