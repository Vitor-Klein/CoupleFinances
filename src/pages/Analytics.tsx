import React, { useState, useMemo } from 'react';
import { Header, MonthSelector, TrendChart, CategoryChart } from '../components';
import { DashboardSkeleton } from '../components/Skeleton';
import { useFinances } from '../context/FinancesContext';
import { usePrivacy } from '../context/PrivacyContext';
import { useCategories } from '../hooks/useCategories';
import { downloadCSV, csvNumber } from '../utils/csv';
import { useToast } from '../context/ToastContext';
import { Download, Printer, ChevronLeft, ChevronRight } from 'lucide-react';
import type { CategorySummary, TrendPoint } from '../types';

type ViewMode = 'month' | 'year';

export const Analytics: React.FC = () => {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [viewMode, setViewMode] = useState<ViewMode>('month');

  const {
    getMonthlyBalance,
    getTotalsByCategory,
    getMonthlyTrend,
    getPersonStats,
    getTransactionsByMonth,
    coupleProfile,
    isLoaded,
  } = useFinances();
  const { money } = usePrivacy();
  const categories = useCategories();
  const toast = useToast();

  const isYear = viewMode === 'year';

  // ---------- Agregados anuais ----------
  const yearData = useMemo(() => {
    if (!isYear) return null;
    let income = 0;
    let expenses = 0;
    let txCount = 0;
    const catTotals = new Map<string, number>();
    const trend: TrendPoint[] = [];
    const personTotals = {
      person1: { income: 0, expenses: 0, balance: 0 },
      person2: { income: 0, expenses: 0, balance: 0 },
    };

    for (let m = 1; m <= 12; m++) {
      const bal = getMonthlyBalance(year, m);
      income += bal.income;
      expenses += bal.expenses;
      trend.push({
        month: `${String(m).padStart(2, '0')}/${year}`,
        income: bal.income,
        expenses: bal.expenses,
        balance: bal.balance,
      });
      for (const c of getTotalsByCategory(year, m)) {
        catTotals.set(c.category, (catTotals.get(c.category) ?? 0) + c.total);
      }
      for (const person of ['person1', 'person2'] as const) {
        const stats = getPersonStats(year, m, person);
        personTotals[person].income += stats.income;
        personTotals[person].expenses += stats.expenses;
        personTotals[person].balance += stats.balance;
      }
      txCount += getTransactionsByMonth(year, m).filter((t) => !t.isSalaryFromProfile).length;
    }

    const catTotal = Array.from(catTotals.values()).reduce((s, v) => s + v, 0);
    const catSummaries: CategorySummary[] = Array.from(catTotals.entries())
      .map(([category, total]) => ({
        category,
        total,
        percentage: catTotal > 0 ? (total / catTotal) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);

    return { income, expenses, balance: income - expenses, txCount, catSummaries, trend, personTotals };
  }, [isYear, year, getMonthlyBalance, getTotalsByCategory, getPersonStats, getTransactionsByMonth]);

  if (!isLoaded) {
    return (
      <div className="page analytics">
        <Header title="Análises" />
        <DashboardSkeleton />
      </div>
    );
  }

  const handleMonthChange = (newYear: number, newMonth: number) => {
    setYear(newYear);
    setMonth(newMonth);
  };

  // ---------- Dados do modo selecionado ----------
  const monthlyBalance = getMonthlyBalance(year, month);
  const income = isYear ? yearData!.income : monthlyBalance.income;
  const expenses = isYear ? yearData!.expenses : monthlyBalance.expenses;
  const balance = income - expenses;
  const catSummaries = isYear ? yearData!.catSummaries : getTotalsByCategory(year, month);
  const trendData = isYear ? yearData!.trend : getMonthlyTrend(12);
  const meStats = isYear ? yearData!.personTotals.person1 : getPersonStats(year, month, 'person1');
  const partnerStats = isYear ? yearData!.personTotals.person2 : getPersonStats(year, month, 'person2');
  const totalTransactions = isYear
    ? yearData!.txCount
    : getTransactionsByMonth(year, month).filter((t) => !t.isSalaryFromProfile).length;

  const savingsRate = income > 0 ? ((balance / income) * 100).toFixed(1) : '0';
  const periodLabel = isYear ? String(year) : `${String(month).padStart(2, '0')}/${year}`;

  const handleExportCSV = () => {
    const rows: string[][] = [
      [`Relatório ${periodLabel}`, '', ''],
      ['Receitas', csvNumber(income), ''],
      ['Despesas', csvNumber(expenses), ''],
      ['Saldo', csvNumber(balance), ''],
      ['', '', ''],
      ['Categoria', 'Valor (R$)', '%'],
      ...catSummaries.map((c) => [
        categories.label(c.category),
        csvNumber(c.total),
        c.percentage.toFixed(1),
      ]),
    ];
    downloadCSV(`relatorio-${periodLabel.replace('/', '-')}.csv`, rows);
    toast.success('Relatório exportado');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="page analytics">
      <Header title="Análises" />

      <div className="page-content">
        <div className="view-mode-row">
          <div className="view-mode-toggle no-print">
            <button
              type="button"
              className={`view-mode-button ${!isYear ? 'active' : ''}`}
              onClick={() => setViewMode('month')}
            >
              Mês
            </button>
            <button
              type="button"
              className={`view-mode-button ${isYear ? 'active' : ''}`}
              onClick={() => setViewMode('year')}
            >
              Ano
            </button>
          </div>
          <div className="export-buttons no-print">
            <button
              type="button"
              className="button button-outline button-export"
              onClick={handleExportCSV}
              title="Exportar CSV"
            >
              <Download size={16} />
              <span>CSV</span>
            </button>
            <button
              type="button"
              className="button button-outline button-export"
              onClick={handlePrint}
              title="Salvar como PDF"
            >
              <Printer size={16} />
              <span>PDF</span>
            </button>
          </div>
        </div>

        {isYear ? (
          <div className="month-selector">
            <button
              className="month-button"
              onClick={() => setYear((y) => y - 1)}
              title="Ano anterior"
              aria-label="Ano anterior"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="month-text">{year}</span>
            <button
              className="month-button"
              onClick={() => setYear((y) => y + 1)}
              title="Próximo ano"
              aria-label="Próximo ano"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        ) : (
          <MonthSelector year={year} month={month} onMonthChange={handleMonthChange} />
        )}

        {/* Quick Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">Lançamentos</span>
            <strong className="stat-value">{totalTransactions}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">Receitas</span>
            <strong className="stat-value income">{money(income)}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">Despesas</span>
            <strong className="stat-value expense">{money(expenses)}</strong>
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
                <strong className="income">{money(meStats.income)}</strong>
              </div>
              <div>
                <span className="label">Despesas</span>
                <strong className="expense">{money(meStats.expenses)}</strong>
              </div>
              <div>
                <span className="label">Saldo</span>
                <strong className={meStats.balance >= 0 ? 'income' : 'expense'}>
                  {money(meStats.balance)}
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
                <strong className="income">{money(partnerStats.income)}</strong>
              </div>
              <div>
                <span className="label">Despesas</span>
                <strong className="expense">{money(partnerStats.expenses)}</strong>
              </div>
              <div>
                <span className="label">Saldo</span>
                <strong className={partnerStats.balance >= 0 ? 'income' : 'expense'}>
                  {money(partnerStats.balance)}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Chart controls */}
        <div className="chart-controls no-print">
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
        <CategoryChart data={catSummaries} />

        {catSummaries.length > 0 && (
          <div className="category-table">
            <h3>Detalhamento por Categoria {isYear && `— ${year}`}</h3>
            <table>
              <thead>
                <tr>
                  <th>Categoria</th>
                  <th>Valor</th>
                  <th>%</th>
                </tr>
              </thead>
              <tbody>
                {catSummaries.map((cat) => (
                  <tr key={cat.category}>
                    <td>
                      <span
                        className="category-dot"
                        style={{ backgroundColor: categories.color(cat.category) }}
                      />
                      {categories.label(cat.category)}
                    </td>
                    <td>{money(cat.total)}</td>
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
