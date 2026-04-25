import React, { useState } from 'react';
import {
  Header,
  BalanceCard,
  MonthSelector,
  CategoryChart,
  TrendChart,
} from '../components';
import { useFinances } from '../context/FinancesContext';
import { formatCurrency } from '../utils/formatters';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  const { getMonthlyBalance, getTotalsByCategory, getMonthlyTrend, getPersonStats, coupleProfile } =
    useFinances();

  const handleMonthChange = (newYear: number, newMonth: number) => {
    setYear(newYear);
    setMonth(newMonth);
  };

  const monthlyBalance = getMonthlyBalance(year, month);
  const categories = getTotalsByCategory(year, month);
  const trendData = getMonthlyTrend(6);
  const meStats = getPersonStats(year, month, 'me');
  const partnerStats = getPersonStats(year, month, 'partner');

  const savingsRate =
    monthlyBalance.income > 0
      ? ((monthlyBalance.balance / monthlyBalance.income) * 100).toFixed(0)
      : '0';
  const savingsRateNum = parseInt(savingsRate);
  const savingsBannerClass =
    savingsRateNum >= 20 ? 'positive' : savingsRateNum >= 0 ? 'neutral' : 'negative';

  const savingsBanner = monthlyBalance.income > 0 && (
    <div className={`savings-banner ${savingsBannerClass}`}>
      {savingsRateNum >= 20 ? (
        <TrendingUp size={20} />
      ) : savingsRateNum >= 0 ? (
        <Minus size={20} />
      ) : (
        <TrendingDown size={20} />
      )}
      <div className="savings-banner-text">
        <strong>
          {savingsRateNum >= 20
            ? `Vocês economizaram ${savingsRate}% da renda 🎉`
            : savingsRateNum >= 0
            ? `Taxa de poupança: ${savingsRate}%`
            : `Gastos acima da renda em ${Math.abs(savingsRateNum)}%`}
        </strong>
        <span>
          {savingsRateNum >= 20
            ? `${formatCurrency(monthlyBalance.balance)} poupados este mês`
            : savingsRateNum >= 0
            ? 'Tente poupar pelo menos 20% da renda'
            : `Déficit de ${formatCurrency(Math.abs(monthlyBalance.balance))}`}
        </span>
      </div>
    </div>
  );

  return (
    <div className="page dashboard">
      <Header title="Dashboard" />

      <div className="page-content">
        <MonthSelector year={year} month={month} onMonthChange={handleMonthChange} />

        {/* Desktop: 2-col layout. Mobile: single column */}
        <div className="dashboard-layout">
          <div className="dashboard-main">
            <BalanceCard
              title="Saldo Mensal"
              income={monthlyBalance.income}
              expenses={monthlyBalance.expenses}
              balance={monthlyBalance.balance}
            />

            {savingsBanner}

            <div className="person-cards">
              <BalanceCard
                title={coupleProfile.person1Name}
                income={meStats.income}
                expenses={meStats.expenses}
                balance={meStats.balance}
                variant="compact"
              />
              <BalanceCard
                title={coupleProfile.person2Name}
                income={partnerStats.income}
                expenses={partnerStats.expenses}
                balance={partnerStats.balance}
                variant="compact"
              />
            </div>
          </div>

          <div className="dashboard-charts">
            <CategoryChart data={categories} />
            <TrendChart data={trendData} type="line" />
          </div>
        </div>
      </div>
    </div>
  );
};
