import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from 'react';
import type {
  Transaction,
  AppContextType,
  MonthlyBalance,
  CategorySummary,
  CoupleProfile,
  TrendPoint,
  PersonStats,
  RecurrenceType,
  ReserveTotals,
  Budget,
  Goal,
  CustomCategory,
  PersonKey,
} from '../types';
import {
  StorageService,
  txFromDb,
  profileFromDb,
  budgetFromDb,
  goalFromDb,
  customCategoryFromDb,
} from '../services/storage';
import type {
  DbTransaction,
  DbCoupleProfile,
  DbBudget,
  DbGoal,
  DbCustomCategory,
} from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useCouple } from './CoupleContext';
import { useToast } from './ToastContext';
import { generateId, toISODate } from '../utils/formatters';

interface FinancesContextValue extends AppContextType {
  isLoaded: boolean;
}

const FinancesContext = createContext<FinancesContextValue | undefined>(undefined);

const DEFAULT_PROFILE: CoupleProfile = {
  person1Name: 'Eu',
  person1Salary: 0,
  person1Reserve: 0,
  person2Name: 'Parceiro(a)',
  person2Salary: 0,
  person2Reserve: 0,
};

const RECURRENCE_INTERVAL_MONTHS: Record<Exclude<RecurrenceType, 'none'>, number> = {
  monthly: 1,
  semiannual: 6,
  annual: 12,
};

/** Horizonte de geração de lançamentos futuros (meses) */
const RECURRENCE_HORIZON_MONTHS = 24;

function addMonthsToDate(dateStr: string, months: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const totalMonths = year * 12 + (month - 1) + months;
  const targetYear = Math.floor(totalMonths / 12);
  const targetMonth = (totalMonths % 12) + 1;
  const lastDay = new Date(targetYear, targetMonth, 0).getDate();
  const actualDay = Math.min(day, lastDay);
  return `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(actualDay).padStart(2, '0')}`;
}

function generateRecurringEntries(
  transaction: Omit<Transaction, 'id'>,
  groupId: string,
): Transaction[] {
  const recurrence = transaction.recurrence as Exclude<RecurrenceType, 'none'>;
  const interval = RECURRENCE_INTERVAL_MONTHS[recurrence];
  const count = Math.floor(RECURRENCE_HORIZON_MONTHS / interval) + 1;
  return Array.from({ length: count }, (_, i) => ({
    ...transaction,
    id: generateId(),
    date: addMonthsToDate(transaction.date, i * interval),
    recurrenceGroupId: groupId,
  }));
}

/**
 * Mantém as séries recorrentes sempre abastecidas: se a última ocorrência
 * de uma série ativa está a menos de RECURRENCE_HORIZON_MONTHS do presente,
 * gera as próximas (a série nunca "acaba" sozinha).
 */
function computeRecurrenceExtensions(transactions: Transaction[]): Transaction[] {
  const lastOfGroup = new Map<string, Transaction>();
  for (const t of transactions) {
    if (!t.recurrenceGroupId) continue;
    const current = lastOfGroup.get(t.recurrenceGroupId);
    if (!current || t.date > current.date) lastOfGroup.set(t.recurrenceGroupId, t);
  }

  const horizon = addMonthsToDate(toISODate(new Date()), RECURRENCE_HORIZON_MONTHS);
  const extensions: Transaction[] = [];

  for (const last of lastOfGroup.values()) {
    if (!last.recurrence || last.recurrence === 'none') continue; // série encerrada
    const interval = RECURRENCE_INTERVAL_MONTHS[last.recurrence];
    let nextDate = addMonthsToDate(last.date, interval);
    while (nextDate <= horizon) {
      extensions.push({ ...last, id: generateId(), date: nextDate });
      nextDate = addMonthsToDate(nextDate, interval);
    }
  }

  return extensions;
}

const SAVE_ERROR = 'Não foi possível salvar. Verifique sua conexão e tente de novo.';

export const FinancesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { couple } = useCouple();
  const toast = useToast();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [coupleProfile, setCoupleProfile] = useState<CoupleProfile>(DEFAULT_PROFILE);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const transactionsRef = useRef<Transaction[]>([]);
  useEffect(() => {
    transactionsRef.current = transactions;
  }, [transactions]);
  const extendedForCouple = useRef<string | null>(null);

  // Reset síncrono quando o casal muda (ajuste de estado durante o render)
  const coupleKey = user && couple ? couple.id : null;
  const [loadedForCouple, setLoadedForCouple] = useState<string | null>(coupleKey);
  if (loadedForCouple !== coupleKey) {
    setLoadedForCouple(coupleKey);
    setTransactions([]);
    setCoupleProfile(DEFAULT_PROFILE);
    setBudgets([]);
    setGoals([]);
    setCustomCategories([]);
    setIsLoaded(false);
  }

  // ---------- Carga inicial ----------
  useEffect(() => {
    if (!user || !couple) return;

    let cancelled = false;
    Promise.all([
      StorageService.loadTransactions(couple.id),
      StorageService.loadProfile(couple.id),
      StorageService.loadBudgets(couple.id),
      StorageService.loadGoals(couple.id),
      StorageService.loadCustomCategories(couple.id),
    ])
      .then(([txs, profile, budgetRows, goalRows, categoryRows]) => {
        if (cancelled) return;
        setTransactions(txs);
        setCoupleProfile(profile);
        setBudgets(budgetRows);
        setGoals(goalRows);
        setCustomCategories(categoryRows);
        setIsLoaded(true);
      })
      .catch((err) => {
        console.error('Erro ao carregar dados:', err);
        if (!cancelled) {
          setIsLoaded(true);
          toast.error('Não foi possível carregar os dados. Verifique sua conexão.');
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, couple?.id]);

  // ---------- Auto-extensão de séries recorrentes ----------
  useEffect(() => {
    if (!isLoaded || !user || !couple) return;
    if (extendedForCouple.current === couple.id) return;
    extendedForCouple.current = couple.id;

    const extensions = computeRecurrenceExtensions(transactionsRef.current);
    if (extensions.length === 0) return;

    StorageService.insertTransactions(user.id, couple.id, extensions)
      .then(() => {
        setTransactions((prev) => {
          const existing = new Set(prev.map((t) => t.id));
          return [...prev, ...extensions.filter((t) => !existing.has(t.id))];
        });
      })
      .catch((err) => console.error('Erro ao estender recorrências:', err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user, couple?.id]);

  // ---------- Realtime: sincroniza com o(a) parceiro(a) ----------
  useEffect(() => {
    if (!couple) return;
    const filter = `couple_id=eq.${couple.id}`;

    const upsertById = <T extends { id: string }>(list: T[], item: T): T[] => {
      const exists = list.some((i) => i.id === item.id);
      return exists ? list.map((i) => (i.id === item.id ? item : i)) : [...list, item];
    };
    const removeById = <T extends { id: string }>(list: T[], id: string): T[] =>
      list.filter((i) => i.id !== id);

    const channel = supabase
      .channel(`couple-${couple.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions', filter }, (p) =>
        setTransactions((prev) => upsertById(prev, txFromDb(p.new as DbTransaction))),
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'transactions', filter }, (p) =>
        setTransactions((prev) => upsertById(prev, txFromDb(p.new as DbTransaction))),
      )
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'transactions' }, (p) =>
        setTransactions((prev) => removeById(prev, (p.old as { id: string }).id)),
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'couple_profiles', filter }, (p) => {
        if (p.eventType !== 'DELETE') setCoupleProfile(profileFromDb(p.new as DbCoupleProfile));
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'budgets', filter }, (p) =>
        setBudgets((prev) => upsertById(prev, budgetFromDb(p.new as DbBudget))),
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'budgets', filter }, (p) =>
        setBudgets((prev) => upsertById(prev, budgetFromDb(p.new as DbBudget))),
      )
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'budgets' }, (p) =>
        setBudgets((prev) => removeById(prev, (p.old as { id: string }).id)),
      )
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'goals', filter }, (p) =>
        setGoals((prev) => upsertById(prev, goalFromDb(p.new as DbGoal))),
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'goals', filter }, (p) =>
        setGoals((prev) => upsertById(prev, goalFromDb(p.new as DbGoal))),
      )
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'goals' }, (p) =>
        setGoals((prev) => removeById(prev, (p.old as { id: string }).id)),
      )
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'custom_categories', filter }, (p) =>
        setCustomCategories((prev) => upsertById(prev, customCategoryFromDb(p.new as DbCustomCategory))),
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'custom_categories', filter }, (p) =>
        setCustomCategories((prev) => upsertById(prev, customCategoryFromDb(p.new as DbCustomCategory))),
      )
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'custom_categories' }, (p) =>
        setCustomCategories((prev) => removeById(prev, (p.old as { id: string }).id)),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [couple]);

  // ---------- Perfil ----------
  const updateCoupleProfile = useCallback(
    (profile: CoupleProfile) => {
      if (!user || !couple) return;
      const previous = coupleProfile;
      setCoupleProfile(profile);
      StorageService.upsertProfile(user.id, couple.id, profile).catch((err) => {
        console.error('Erro ao salvar perfil:', err);
        setCoupleProfile(previous);
        toast.error(SAVE_ERROR);
      });
    },
    [user, couple, coupleProfile, toast],
  );

  // ---------- Transações ----------
  const insertEntries = useCallback(
    (entries: Transaction[]) => {
      if (!user || !couple) return;
      setTransactions((prev) => [...prev, ...entries]);
      StorageService.insertTransactions(user.id, couple.id, entries).catch((err) => {
        console.error('Erro ao salvar transação:', err);
        const ids = new Set(entries.map((t) => t.id));
        setTransactions((prev) => prev.filter((t) => !ids.has(t.id)));
        toast.error(SAVE_ERROR);
      });
    },
    [user, couple, toast],
  );

  const addTransaction = useCallback(
    (transaction: Omit<Transaction, 'id'>) => {
      const recurrence = transaction.recurrence;
      if (recurrence && recurrence !== 'none') {
        insertEntries(generateRecurringEntries(transaction, generateId()));
      } else {
        insertEntries([{ ...transaction, id: generateId() }]);
      }
    },
    [insertEntries],
  );

  const addInstallmentTransactions = useCallback(
    (transaction: Omit<Transaction, 'id'>, installments: number) => {
      const groupId = generateId();
      const installmentAmount = Math.round((transaction.amount / installments) * 100) / 100;
      const entries: Transaction[] = Array.from({ length: installments }, (_, i) => ({
        ...transaction,
        id: generateId(),
        amount: installmentAmount,
        description: `${transaction.description} (${i + 1}/${installments})`,
        date: addMonthsToDate(transaction.date, i),
        recurrence: 'none' as RecurrenceType,
        recurrenceGroupId: groupId,
      }));
      insertEntries(entries);
    },
    [insertEntries],
  );

  const restoreTransaction = useCallback(
    (transaction: Transaction) => {
      insertEntries([transaction]);
    },
    [insertEntries],
  );

  const deleteTransaction = useCallback(
    (id: string) => {
      if (!user) return;
      const removed = transactionsRef.current.find((t) => t.id === id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      StorageService.deleteTransaction(id).catch((err) => {
        console.error('Erro ao deletar transação:', err);
        if (removed) setTransactions((prev) => [...prev, removed]);
        toast.error(SAVE_ERROR);
      });
    },
    [user, toast],
  );

  const deleteRecurringGroup = useCallback(
    (recurrenceGroupId: string, fromDate: string) => {
      if (!user) return;
      const previous = transactionsRef.current;
      setTransactions((prev) =>
        prev
          .filter((t) => t.recurrenceGroupId !== recurrenceGroupId || t.date < fromDate)
          .map((t) =>
            t.recurrenceGroupId === recurrenceGroupId ? { ...t, recurrence: 'none' as RecurrenceType } : t,
          ),
      );
      // encerra a série para a auto-extensão não recriar entradas futuras
      Promise.all([
        StorageService.deleteTransactionsByGroup(recurrenceGroupId, fromDate),
        StorageService.endRecurrenceSeries(recurrenceGroupId),
      ]).catch((err) => {
        console.error('Erro ao deletar grupo recorrente:', err);
        setTransactions(previous);
        toast.error(SAVE_ERROR);
      });
    },
    [user, toast],
  );

  const editTransaction = useCallback(
    (id: string, updates: Partial<Transaction>) => {
      if (!user) return;
      const previous = transactionsRef.current;
      setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
      StorageService.updateTransaction(id, updates).catch((err) => {
        console.error('Erro ao editar transação:', err);
        setTransactions(previous);
        toast.error(SAVE_ERROR);
      });
    },
    [user, toast],
  );

  const editRecurringGroup = useCallback(
    (recurrenceGroupId: string, fromDate: string, updates: Partial<Transaction>) => {
      if (!user) return;
      const previous = transactionsRef.current;
      setTransactions((prev) =>
        prev.map((t) => {
          if (t.recurrenceGroupId !== recurrenceGroupId) return t;
          if (t.date < fromDate) return t;
          return { ...t, ...updates, date: t.date };
        }),
      );
      StorageService.updateTransactionsByGroup(recurrenceGroupId, fromDate, updates).catch((err) => {
        console.error('Erro ao editar grupo recorrente:', err);
        setTransactions(previous);
        toast.error(SAVE_ERROR);
      });
    },
    [user, toast],
  );

  // ---------- Orçamentos ----------
  const upsertBudget = useCallback(
    (category: string, amount: number) => {
      if (!couple) return;
      const previous = budgets;
      const existing = budgets.find((b) => b.category === category);
      const optimistic: Budget = existing
        ? { ...existing, amount }
        : { id: generateId(), category, amount };
      setBudgets((prev) =>
        existing ? prev.map((b) => (b.id === existing.id ? optimistic : b)) : [...prev, optimistic],
      );
      StorageService.upsertBudget(couple.id, category, amount)
        .then((saved) =>
          setBudgets((prev) => prev.map((b) => (b.id === optimistic.id ? saved : b))),
        )
        .catch((err) => {
          console.error('Erro ao salvar orçamento:', err);
          setBudgets(previous);
          toast.error(SAVE_ERROR);
        });
    },
    [couple, budgets, toast],
  );

  const deleteBudget = useCallback(
    (id: string) => {
      const previous = budgets;
      setBudgets((prev) => prev.filter((b) => b.id !== id));
      StorageService.deleteBudget(id).catch((err) => {
        console.error('Erro ao remover orçamento:', err);
        setBudgets(previous);
        toast.error(SAVE_ERROR);
      });
    },
    [budgets, toast],
  );

  // ---------- Metas ----------
  const addGoal = useCallback(
    (goal: Omit<Goal, 'id'>) => {
      if (!couple) return;
      const entry: Goal = { ...goal, id: generateId() };
      setGoals((prev) => [...prev, entry]);
      StorageService.insertGoal(couple.id, entry).catch((err) => {
        console.error('Erro ao criar meta:', err);
        setGoals((prev) => prev.filter((g) => g.id !== entry.id));
        toast.error(SAVE_ERROR);
      });
    },
    [couple, toast],
  );

  const updateGoal = useCallback(
    (id: string, updates: Partial<Goal>) => {
      const previous = goals;
      setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...updates } : g)));
      StorageService.updateGoal(id, updates).catch((err) => {
        console.error('Erro ao atualizar meta:', err);
        setGoals(previous);
        toast.error(SAVE_ERROR);
      });
    },
    [goals, toast],
  );

  const deleteGoal = useCallback(
    (id: string) => {
      const previous = goals;
      setGoals((prev) => prev.filter((g) => g.id !== id));
      StorageService.deleteGoal(id).catch((err) => {
        console.error('Erro ao remover meta:', err);
        setGoals(previous);
        toast.error(SAVE_ERROR);
      });
    },
    [goals, toast],
  );

  // ---------- Categorias customizadas ----------
  const addCustomCategory = useCallback(
    (category: Omit<CustomCategory, 'id' | 'key'>) => {
      if (!couple) return;
      const slug = category.label
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 24);
      const entry: CustomCategory = {
        ...category,
        id: generateId(),
        key: `custom-${slug || generateId().slice(0, 8)}`,
      };
      if (customCategories.some((c) => c.key === entry.key)) {
        toast.error('Já existe uma categoria com esse nome.');
        return;
      }
      setCustomCategories((prev) => [...prev, entry]);
      StorageService.insertCustomCategory(couple.id, entry).catch((err) => {
        console.error('Erro ao criar categoria:', err);
        setCustomCategories((prev) => prev.filter((c) => c.id !== entry.id));
        toast.error(SAVE_ERROR);
      });
    },
    [couple, customCategories, toast],
  );

  const deleteCustomCategory = useCallback(
    (id: string) => {
      const previous = customCategories;
      setCustomCategories((prev) => prev.filter((c) => c.id !== id));
      StorageService.deleteCustomCategory(id).catch((err) => {
        console.error('Erro ao remover categoria:', err);
        setCustomCategories(previous);
        toast.error(SAVE_ERROR);
      });
    },
    [customCategories, toast],
  );

  // ---------- Consultas ----------
  const getSalaryTransactions = useCallback(
    (year: number, month: number): Transaction[] => {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-01`;
      const virtual: Transaction[] = [];

      if (coupleProfile.person1Salary > 0) {
        virtual.push({
          id: `profile-salary-person1-${year}-${month}`,
          description: `Salário — ${coupleProfile.person1Name}`,
          amount: coupleProfile.person1Salary,
          type: 'income',
          category: 'salary',
          date: dateStr,
          person: 'person1',
          isSalaryFromProfile: true,
        });
      }

      if (coupleProfile.person2Salary > 0) {
        virtual.push({
          id: `profile-salary-person2-${year}-${month}`,
          description: `Salário — ${coupleProfile.person2Name}`,
          amount: coupleProfile.person2Salary,
          type: 'income',
          category: 'salary',
          date: dateStr,
          person: 'person2',
          isSalaryFromProfile: true,
        });
      }

      return virtual;
    },
    [coupleProfile],
  );

  const getTransactionsByMonth = useCallback(
    (year: number, month: number): Transaction[] => {
      const monthStr = `${year}-${String(month).padStart(2, '0')}`;
      const real = transactions.filter((t) => t.date.startsWith(monthStr));
      const virtual = getSalaryTransactions(year, month);
      return [...virtual, ...real];
    },
    [transactions, getSalaryTransactions],
  );

  const getMonthlyBalance = useCallback(
    (year: number, month: number): MonthlyBalance => {
      const monthStr = `${year}-${String(month).padStart(2, '0')}`;
      const all = getTransactionsByMonth(year, month);
      const income = all.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const expenses = all.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      return { month: monthStr, income, expenses, balance: income - expenses };
    },
    [getTransactionsByMonth],
  );

  const getTotalsByCategory = useCallback(
    (year: number, month: number): CategorySummary[] => {
      const all = getTransactionsByMonth(year, month);
      const expenses = all.filter((t) => t.type === 'expense');
      const total = expenses.reduce((s, t) => s + t.amount, 0);
      const map = new Map<string, number>();
      expenses.forEach((t) => map.set(t.category, (map.get(t.category) ?? 0) + t.amount));
      return Array.from(map.entries())
        .map(([category, catTotal]) => ({
          category,
          total: catTotal,
          percentage: total > 0 ? (catTotal / total) * 100 : 0,
        }))
        .sort((a, b) => b.total - a.total);
    },
    [getTransactionsByMonth],
  );

  const getMonthlyTrend = useCallback(
    (months: number): TrendPoint[] => {
      const today = new Date();
      return Array.from({ length: months }, (_, i) => {
        const date = new Date(today.getFullYear(), today.getMonth() - (months - 1 - i), 1);
        const y = date.getFullYear();
        const m = date.getMonth() + 1;
        const bal = getMonthlyBalance(y, m);
        return {
          month: `${String(m).padStart(2, '0')}/${y}`,
          income: bal.income,
          expenses: bal.expenses,
          balance: bal.balance,
        };
      });
    },
    [getMonthlyBalance],
  );

  const getPersonStats = useCallback(
    (year: number, month: number, person: PersonKey): PersonStats => {
      const all = getTransactionsByMonth(year, month).filter((t) => t.person === person);
      const income = all.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const expenses = all.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      return { income, expenses, balance: income - expenses };
    },
    [getTransactionsByMonth],
  );

  const isRecurringSalary = useCallback(
    (id: string): boolean => {
      const t = transactions.find((t) => t.id === id);
      return t?.isRecurringSalary === true || t?.isSalaryFromProfile === true;
    },
    [transactions],
  );

  const getReserveTotals = useCallback((): ReserveTotals => {
    let person1 = coupleProfile.person1Reserve;
    let person2 = coupleProfile.person2Reserve;

    for (const t of transactions) {
      if (t.category !== 'savings') continue;
      if (t.person === 'person1') person1 += t.amount;
      else person2 += t.amount;
    }

    return { person1, person2, total: person1 + person2 };
  }, [transactions, coupleProfile.person1Reserve, coupleProfile.person2Reserve]);

  const getUpcomingBills = useCallback(
    (days: number): Transaction[] => {
      const today = toISODate(new Date());
      const limit = toISODate(new Date(Date.now() + days * 86400000));
      return transactions
        .filter((t) => t.type === 'expense' && t.date > today && t.date <= limit)
        .sort((a, b) => a.date.localeCompare(b.date));
    },
    [transactions],
  );

  const value: FinancesContextValue = {
    transactions,
    coupleProfile,
    budgets,
    goals,
    customCategories,
    isLoaded,
    updateCoupleProfile,
    addTransaction,
    addInstallmentTransactions,
    deleteTransaction,
    restoreTransaction,
    deleteRecurringGroup,
    editTransaction,
    editRecurringGroup,
    upsertBudget,
    deleteBudget,
    addGoal,
    updateGoal,
    deleteGoal,
    addCustomCategory,
    deleteCustomCategory,
    getTransactionsByMonth,
    getMonthlyBalance,
    getTotalsByCategory,
    getMonthlyTrend,
    getPersonStats,
    isRecurringSalary,
    getReserveTotals,
    getUpcomingBills,
  };

  return <FinancesContext.Provider value={value}>{children}</FinancesContext.Provider>;
};

export const useFinances = (): FinancesContextValue => {
  const context = useContext(FinancesContext);
  if (!context) throw new Error('useFinances deve ser usado dentro de FinancesProvider');
  return context;
};
