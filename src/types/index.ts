export type TransactionType = 'income' | 'expense';
export type CategoryType =
  | 'salary' | 'freelance' | 'bonus'
  | 'housing' | 'food' | 'transport' | 'utilities' | 'health'
  | 'education' | 'entertainment' | 'shopping' | 'savings' | 'other';
export type RecurrenceType = 'none' | 'monthly' | 'semiannual' | 'annual';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: CategoryType;
  date: string;
  person: 'me' | 'partner';
  notes?: string;
  isRecurringSalary?: boolean;
  recurrence?: RecurrenceType;
  recurrenceGroupId?: string;
  isSalaryFromProfile?: boolean;
}

export interface CoupleProfile {
  person1Name: string;
  person1Salary: number;
  person2Name: string;
  person2Salary: number;
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

export interface AppContextType {
  transactions: Transaction[];
  coupleProfile: CoupleProfile;
  updateCoupleProfile: (profile: CoupleProfile) => void;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  addInstallmentTransactions: (transaction: Omit<Transaction, 'id'>, installments: number) => void;
  deleteTransaction: (id: string) => void;
  deleteRecurringGroup: (recurrenceGroupId: string, fromDate: string) => void;
  editTransaction: (id: string, updates: Partial<Transaction>) => void;
  editRecurringGroup: (recurrenceGroupId: string, fromDate: string, updates: Partial<Transaction>) => void;
  getTransactionsByMonth: (year: number, month: number) => Transaction[];
  getMonthlyBalance: (year: number, month: number) => MonthlyBalance;
  getTotalsByCategory: (year: number, month: number) => CategorySummary[];
  getMonthlyTrend: (months: number) => TrendPoint[];
  getPersonStats: (year: number, month: number, person: 'me' | 'partner') => PersonStats;
  isRecurringSalary: (id: string) => boolean;
}
