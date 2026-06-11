export type TransactionType = 'income' | 'expense';
export type PersonKey = 'person1' | 'person2';

/** Chaves de categoria padrão */
export type DefaultCategoryType =
  | 'salary' | 'freelance' | 'bonus'
  | 'housing' | 'food' | 'transport' | 'utilities' | 'health'
  | 'education' | 'entertainment' | 'shopping' | 'savings' | 'other';

/** Aberto para aceitar categorias customizadas (`custom-*`) */
export type CategoryType = string;

export type RecurrenceType = 'none' | 'monthly' | 'semiannual' | 'annual';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: CategoryType;
  date: string;
  person: PersonKey;
  notes?: string;
  isRecurringSalary?: boolean;
  recurrence?: RecurrenceType;
  recurrenceGroupId?: string;
  isSalaryFromProfile?: boolean;
}

export interface CoupleProfile {
  person1Name: string;
  person1Salary: number;
  person1Reserve: number;
  person2Name: string;
  person2Salary: number;
  person2Reserve: number;
}

export interface Couple {
  id: string;
  person1UserId: string | null;
  person2UserId: string | null;
  inviteCode: string;
}

export interface Budget {
  id: string;
  category: CategoryType;
  amount: number;
}

export interface Goal {
  id: string;
  name: string;
  emoji: string;
  targetAmount: number;
  savedAmount: number;
  targetDate?: string;
}

export interface CustomCategory {
  id: string;
  key: string;
  label: string;
  emoji: string;
  color: string;
  type: TransactionType;
}

export interface ReserveTotals {
  person1: number;
  person2: number;
  total: number;
}

export interface MonthlyBalance {
  month: string;
  income: number;
  expenses: number;
  balance: number;
}

export interface CategorySummary {
  category: CategoryType;
  total: number;
  percentage: number;
}

export interface TrendPoint {
  month: string;
  income: number;
  expenses: number;
  balance: number;
}

export interface PersonStats {
  income: number;
  expenses: number;
  balance: number;
}

export interface CategoryMeta {
  label: string;
  emoji: string;
  color: string;
  type: TransactionType;
  isCustom: boolean;
}

export interface AppContextType {
  transactions: Transaction[];
  coupleProfile: CoupleProfile;
  budgets: Budget[];
  goals: Goal[];
  customCategories: CustomCategory[];
  updateCoupleProfile: (profile: CoupleProfile) => void;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  addInstallmentTransactions: (transaction: Omit<Transaction, 'id'>, installments: number) => void;
  deleteTransaction: (id: string) => void;
  restoreTransaction: (transaction: Transaction) => void;
  deleteRecurringGroup: (recurrenceGroupId: string, fromDate: string) => void;
  editTransaction: (id: string, updates: Partial<Transaction>) => void;
  editRecurringGroup: (recurrenceGroupId: string, fromDate: string, updates: Partial<Transaction>) => void;
  upsertBudget: (category: CategoryType, amount: number) => void;
  deleteBudget: (id: string) => void;
  addGoal: (goal: Omit<Goal, 'id'>) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  addCustomCategory: (category: Omit<CustomCategory, 'id' | 'key'>) => void;
  deleteCustomCategory: (id: string) => void;
  getTransactionsByMonth: (year: number, month: number) => Transaction[];
  getMonthlyBalance: (year: number, month: number) => MonthlyBalance;
  getTotalsByCategory: (year: number, month: number) => CategorySummary[];
  getMonthlyTrend: (months: number) => TrendPoint[];
  getPersonStats: (year: number, month: number, person: PersonKey) => PersonStats;
  isRecurringSalary: (id: string) => boolean;
  getReserveTotals: () => ReserveTotals;
  getUpcomingBills: (days: number) => Transaction[];
}
