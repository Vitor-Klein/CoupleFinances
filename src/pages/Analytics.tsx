import React, { useState } from 'react';
import { Header, MonthSelector, TrendChart, CategoryChart } from '../components';
import { useFinances } from '../context/FinancesContext';
import { formatCurrency } from '../utils/formatters';
import { ALL_CATEGORIES, CATEGORY_COLORS } from '../constants/categories';

export const Analytics: React.FC = () => {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');

  const { getMonthlyBalance, getTotalsByCategory, getMonthlyTrend, getPersonStats, getTransactionsByMonth, coupleProfile } =
    useFinances();

  const handleMonthChange = (newYear: number, newMonth: number) => {
    setYear(newYear);
    setMonth(newMonth);
  };

  const categories = getTotalsByCategory(year, month);
  const trendData = getMonthlyTrend(12);
  const monthlyBalance = getMonthlyBalance(year, month);
  const meStats = getPersonStats(year, month, 'me');
  const partnerStats = getPersonStats(year, month, 'partner');
  const monthTransactions = getTransactionsByMonth(year, month);
  const totalTransactions = monthTransactions.filter((t) => !t.isSalaryFromProfile).length;

  const savingsRate =
    monthlyBalance.income > 0
      ? ((monthlyBalance.balance / monthlyBalance.income) * 100).toFixed(1)
      : '0';

  return (
    <div className="page analytics">
      <Header title="Análises" />

      <div className="page-content">
        <MonthSelector year={year} month={month} onMonthChange={handleMonthChange} />

        {/* Quick Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">Lançamentos</span>
            <strong className="stat-value">{totalTransactions}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">Receitas</span>
            <strong className="stat-value income">{formatCurrency(monthlyBalance.income)}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">Despesas</span>
            <strong className="stat-value expense">{formatCurrency(monthlyBalance.expenses)}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">Poupança</span>
            <strong
              className={`stat-value ${parseFloat(savingsRate) >= 0 ? 'income' : 'expense'}`}
            >
              {savingsRate}%
            </strong>
          </div>
        </div>

        {/* Person comparison */}
        <div className="comparison-cards">
          <div className="comparison-card">
            <div className="comparison-card-header">
              <div className="comparison-avatar person1-avatar-sm">
                {coupleProfile.person1Name[0].toUpperCase()}
              </div>
              <h3>{coupleProfile.person1Name}</h3>
            </div>
            <div className="comparison-values">
              <div>
                <span className="label">Receitas</span>
                <strong className="income">{formatCurrency(meStats.income)}</strong>
              </div>
              <div>
                <span className="label">Despesas</span>
                <strong className="expense">{formatCurrency(meStats.expenses)}</strong>
              </div>
              <div>
                <span className="label">Saldo</span>
                <strong className={meStats.balance >= 0 ? 'income' : 'expense'}>
                  {formatCurrency(meStats.balance)}
                </strong>
              </div>
            </div>
          </div>

          <div className="comparison-card">
            <div className="comparison-card-header">
              <div className="comparison-avatar person2-avatar-sm">
                {coupleProfile.person2Name[0].toUpperCase()}
              </div>
              <h3>{coupleProfile.person2Name}</h3>
            </div>
            <div className="comparison-values">
              <div>
                <span className="label">Receitas</span>
                <strong className="income">{formatCurrency(partnerStats.income)}</strong>
              </div>
              <div>
                <span className="label">Despesas</span>
                <strong className="expense">{formatCurrency(partnerStats.expenses)}</strong>
              </div>
              <div>
                <span className="label">Saldo</span>
                <strong className={partnerStats.balance >= 0 ? 'income' : 'expense'}>
                  {formatCurrency(partnerStats.balance)}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Chart controls */}
        <div className="chart-controls">
          <button
            type="button"
            className={`chart-button ${chartType === 'line' ? 'active' : ''}`}
            onClick={() => setChartType('line')}
          >
            Linhas
          </button>
          <button
            type="button"
            className={`chart-button ${chartType === 'bar' ? 'active' : ''}`}
            onClick={() => setChartType('bar')}
          >
            Barras
          </button>
        </div>

        <TrendChart data={trendData} type={chartType} />
        <CategoryChart data={categories} />

        {categories.length > 0 && (
          <div className="category-table">
            <h3>Detalhamento por Categoria</h3>
            <table>
              <thead>
                <tr>
                  <th>Categoria</th>
                  <th>Valor</th>
                  <th>%</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.category}>
                    <td>
                      <span
                        className="category-dot"
                        style={{ backgroundColor: CATEGORY_COLORS[cat.category] }}
                      />
                      {ALL_CATEGORIES[cat.category] ?? cat.category}
                    </td>
                    <td>{formatCurrency(cat.total)}</td>
                    <td>{cat.percentage.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
