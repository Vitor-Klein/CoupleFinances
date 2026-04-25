/**
 * Serviço de cálculos financeiros
 */

import type { Transaction, MonthlyBalance, CategorySummary } from '../types';

export const CalculationService = {
  /**
   * Calcula o balanço mensal (receitas, despesas e saldo)
   */
  getMonthlyBalance: (transactions: Transaction[], year: number, month: number): MonthlyBalance => {
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    
    const monthTransactions = transactions.filter(t => t.date.startsWith(monthStr));
    
    const income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      month: monthStr,
      income,
      expenses,
      balance: income - expenses,
    };
  },

  /**
   * Agrupa transações por categoria com totais
   */
  getTotalsByCategory: (transactions: Transaction[], year: number, month: number): CategorySummary[] => {
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    
    const monthTransactions = transactions.filter(t => t.date.startsWith(monthStr));
    
    const expenseTransactions = monthTransactions.filter(t => t.type === 'expense');
    const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);

    const categoryMap = new Map<string, number>();

    expenseTransactions.forEach(t => {
      const current = categoryMap.get(t.category) || 0;
      categoryMap.set(t.category, current + t.amount);
    });

    const result: CategorySummary[] = [];
    
    categoryMap.forEach((total, category) => {
      result.push({
        category: category as any,
        total,
        percentage: totalExpenses > 0 ? (total / totalExpenses) * 100 : 0,
      });
    });

    return result.sort((a, b) => b.total - a.total);
  },

  /**
   * Calcula estatísticas por pessoa
   */
  getPersonStatistics: (transactions: Transaction[], year: number, month: number, person: 'me' | 'partner') => {
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    
    const personTransactions = transactions.filter(t => 
      t.date.startsWith(monthStr) && t.person === person
    );
    
    const income = personTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = personTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      income,
      expenses,
      balance: income - expenses,
      count: personTransactions.length,
    };
  },

  /**
   * Calcula tendências mensais
   */
  getMonthlyTrend: (transactions: Transaction[], months: number = 6) => {
    const today = new Date();
    const result = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      
      const balance = CalculationService.getMonthlyBalance(transactions, year, month);
      result.push({
        month: `${String(month).padStart(2, '0')}/${year}`,
        income: balance.income,
        expenses: balance.expenses,
        balance: balance.balance,
      });
    }

    return result;
  },
};
