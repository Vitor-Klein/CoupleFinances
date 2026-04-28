import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { Heart } from 'lucide-react';
import type {
  Transaction,
  AppContextType,
  MonthlyBalance,
  CategorySummary,
  CoupleProfile,
  TrendPoint,
  PersonStats,
  RecurrenceType,
} from '../types';
import { StorageService } from '../services/storage';
import { useAuth } from './AuthContext';
import { generateId } from '../utils/formatters';

const FinancesContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_PROFILE: CoupleProfile = {
  person1Name: 'Eu',
  person1Salary: 0,
  person2Name: 'Parceiro(a)',
  person2Salary: 0,
};

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
  const recurrence = transaction.recurrence as RecurrenceType;
  let monthOffsets: number[] = [];

  if (recurrence === 'monthly') {
    monthOffsets = Array.from({ length: 24 }, (_, i) => i);
  } else if (recurrence === 'semiannual') {
    monthOffsets = [0, 6, 12, 18, 24, 30];
  } else if (recurrence === 'annual') {
    monthOffsets = [0, 12, 24, 36, 48];
  }

  return monthOffsets.map((offset) => ({
    ...transaction,
    id: generateId(),
    date: addMonthsToDate(transaction.date, offset),
    recurrenceGroupId: groupId,
  }));
}

export const FinancesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [coupleProfile, setCoupleProfile] = useState<CoupleProfile>(DEFAULT_PROFILE);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setCoupleProfile(DEFAULT_PROFILE);
      setIsLoaded(false);
      return;
    }

    setIsLoaded(false);
    Promise.all([
      StorageService.loadTransactions(user.id),
      StorageService.loadProfile(user.id),
    ])
      .then(([txs, profile]) => {
        setTransactions(txs);
        setCoupleProfile(profile);
        setIsLoaded(true);
      })
      .catch((err) => {
        console.error('Erro ao carregar dados:', err);
        setIsLoaded(true);
      });
  }, [user]);

  const updateCoupleProfile = useCallback(
    (profile: CoupleProfile) => {
      if (!user) return;
      setCoupleProfile(profile);
      StorageService.upsertProfile(user.id, profile).catch((err) =>
        console.error('Erro ao salvar perfil:', err),
      );
    },
    [user],
  );

  const addTransaction = useCallback(
    (transaction: Omit<Transaction, 'id'>) => {
      if (!user) return;

      const recurrence = transaction.recurrence;
      let entries: Transaction[];

      if (recurrence && recurrence !== 'none') {
        const groupId = generateId();
        entries = generateRecurringEntries(transaction, groupId);
      } else {
        entries = [{ ...transaction, id: generateId() }];
      }

      setTransactions((prev) => [...prev, ...entries]);
      StorageService.insertTransactions(user.id, entries).catch((err) =>
        console.error('Erro ao salvar transação:', err),
      );
    },
    [user],
  );

  const addInstallmentTransactions = useCallback(
    (transaction: Omit<Transaction, 'id'>, installments: number) => {
      if (!user) return;
      const groupId = generateId();
      const installmentAmount = Math.round((transaction.amount / installments) * 100) / 100;
      const entries: Transaction[] = Array.from({ length: installments }, (_, i) => ({
        ...transaction,
        id: generateId(),
        amount: installmentAmount,
        description: `${transaction.description} (${i + 1}/${installments})`,
        date: addMonthsToDate(transaction.date, i),
        recurrenceGroupId: groupId,
      }));
      setTransactions((prev) => [...prev, ...entries]);
      StorageService.insertTransactions(user.id, entries).catch((err) =>
        console.error('Erro ao salvar parcelas:', err),
      );
    },
    [user],
  );

  const deleteTransaction = useCallback(
    (id: string) => {
      if (!user) return;
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      StorageService.deleteTransaction(id).catch((err) =>
        console.error('Erro ao deletar transação:', err),
      );
    },
    [user],
  );

  const deleteRecurringGroup = useCallback(
    (recurrenceGroupId: string, fromDate: string) => {
      if (!user) return;
      setTransactions((prev) =>
        prev.filter((t) => {
          if (t.recurrenceGroupId !== recurrenceGroupId) return true;
          return t.date < fromDate;
        }),
      );
      StorageService.deleteTransactionsByGroup(recurrenceGroupId, fromDate).catch((err) =>
        console.error('Erro ao deletar grupo recorrente:', err),
      );
    },
    [user],
  );

  const editTransaction = useCallback(
    (id: string, updates: Partial<Transaction>) => {
      if (!user) return;
      setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
      StorageService.updateTransaction(id, updates).catch((err) =>
        console.error('Erro ao editar transação:', err),
      );
    },
    [user],
  );

  const editRecurringGroup = useCallback(
    (recurrenceGroupId: string, fromDate: string, updates: Partial<Transaction>) => {
      if (!user) return;
      setTransactions((prev) =>
        prev.map((t) => {
          if (t.recurrenceGroupId !== recurrenceGroupId) return t;
          if (t.date < fromDate) return t;
          return { ...t, ...updates };
        }),
      );
      StorageService.updateTransactionsByGroup(recurrenceGroupId, fromDate, updates).catch((err) =>
        console.error('Erro ao editar grupo recorrente:', err),
      );
    },
    [user],
  );

  const getSalaryTransactions = useCallback(
    (year: number, month: number): Transaction[] => {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-01`;
      const virtual: Transaction[] = [];

      if (coupleProfile.person1Salary > 0) {
        virtual.push({
          id: `profile-salary-me-${year}-${month}`,
          description: `Salário — ${coupleProfile.person1Name}`,
          amount: coupleProfile.person1Salary,
          type: 'income',
          category: 'salary',
          date: dateStr,
          person: 'me',
          isSalaryFromProfile: true,
        });
      }

      if (coupleProfile.person2Salary > 0) {
        virtual.push({
          id: `profile-salary-partner-${year}-${month}`,
          description: `Salário — ${coupleProfile.person2Name}`,
          amount: coupleProfile.person2Salary,
          type: 'income',
          category: 'salary',
          date: dateStr,
          person: 'partner',
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
          category: category as CategorySummary['category'],
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
    (year: number, month: number, person: 'me' | 'partner'): PersonStats => {
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

  if (!isLoaded) {
    return (
      <div className="app-loading">
        <Heart size={32} />
        <p>Carregando...</p>
      </div>
    );
  }

  const value: AppContextType = {
    transactions,
    coupleProfile,
    updateCoupleProfile,
    addTransaction,
    addInstallmentTransactions,
    deleteTransaction,
    deleteRecurringGroup,
    editTransaction,
    editRecurringGroup,
    getTransactionsByMonth,
    getMonthlyBalance,
    getTotalsByCategory,
    getMonthlyTrend,
    getPersonStats,
    isRecurringSalary,
  };

  return <FinancesContext.Provider value={value}>{children}</FinancesContext.Provider>;
};

export const useFinances = (): AppContextType => {
  const context = useContext(FinancesContext);
  if (!context) throw new Error('useFinances deve ser usado dentro de FinancesProvider');
  return context;
};
