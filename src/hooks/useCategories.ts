import { useMemo } from 'react';
import { useFinances } from '../context/FinancesContext';
import {
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  CATEGORY_COLORS,
  CATEGORY_EMOJIS,
} from '../constants/categories';
import type { CategoryMeta, DefaultCategoryType, TransactionType } from '../types';

export interface CategoryOption {
  key: string;
  label: string;
  emoji: string;
  color: string;
  isCustom: boolean;
}

interface UseCategoriesResult {
  /** Metadados de todas as categorias (padrão + customizadas) */
  meta: Record<string, CategoryMeta>;
  incomeOptions: CategoryOption[];
  expenseOptions: CategoryOption[];
  optionsFor: (type: TransactionType) => CategoryOption[];
  label: (key: string) => string;
  emoji: (key: string) => string;
  color: (key: string) => string;
}

const FALLBACK: CategoryMeta = {
  label: 'Outros',
  emoji: '📌',
  color: '#9ca3af',
  type: 'expense',
  isCustom: false,
};

/**
 * Junta as categorias padrão do app com as categorias customizadas
 * do casal. Tudo que renderiza categoria deve passar por aqui.
 */
export function useCategories(): UseCategoriesResult {
  const { customCategories } = useFinances();

  return useMemo(() => {
    const meta: Record<string, CategoryMeta> = {};

    const register = (
      key: string,
      label: string,
      type: TransactionType,
      isCustom: boolean,
      emoji?: string,
      color?: string,
    ) => {
      meta[key] = {
        label,
        emoji: emoji ?? CATEGORY_EMOJIS[key as DefaultCategoryType] ?? '🏷️',
        color: color ?? CATEGORY_COLORS[key as DefaultCategoryType] ?? '#9ca3af',
        type,
        isCustom,
      };
    };

    Object.entries(INCOME_CATEGORIES).forEach(([key, label]) =>
      register(key, label, 'income', false),
    );
    Object.entries(EXPENSE_CATEGORIES).forEach(([key, label]) =>
      register(key, label, 'expense', false),
    );
    customCategories.forEach((c) => register(c.key, c.label, c.type, true, c.emoji, c.color));

    const toOption = ([key, m]: [string, CategoryMeta]): CategoryOption => ({
      key,
      label: m.label,
      emoji: m.emoji,
      color: m.color,
      isCustom: m.isCustom,
    });

    const incomeOptions = Object.entries(meta).filter(([, m]) => m.type === 'income').map(toOption);
    const expenseOptions = Object.entries(meta).filter(([, m]) => m.type === 'expense').map(toOption);

    return {
      meta,
      incomeOptions,
      expenseOptions,
      optionsFor: (type: TransactionType) =>
        type === 'income' ? incomeOptions : expenseOptions,
      label: (key: string) => (meta[key] ?? FALLBACK).label,
      emoji: (key: string) => (meta[key] ?? FALLBACK).emoji,
      color: (key: string) => (meta[key] ?? FALLBACK).color,
    };
  }, [customCategories]);
}
