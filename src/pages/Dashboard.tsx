import React, { useState } from 'react';
import {
  Header,
  BalanceCard,
  MonthSelector,
  CategoryChart,
  TrendChart,
} from '../components';
import { DashboardSkeleton } from '../components/Skeleton';
import { useFinances } from '../context/FinancesContext';
import { usePrivacy } from '../context/PrivacyContext';
import { useCategories } from '../hooks/useCategories';
import { formatDate } from '../utils/formatters';
import { TrendingUp, TrendingDown, Minus, CalendarClock, ArrowDownRight, ArrowUpRight } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  const {
    getMonthlyBalance,
    getTotalsByCategory,
    getMonthlyTrend,
    getPersonStats,
    getUpcomingBills,
    coupleProfile,
    isLoaded,
  } = useFinances();
  const { money } = usePrivacy();
  const categoriesMeta = useCategories();

  if (!isLoaded) {
    return (
      <div className="page dashboard">
        <Header title="Dashboard" />
        <DashboardSkeleton />
      </div>
    );
  }

  const handleMonthChange = (newYear: number, newMonth: number) => {
    setYear(newYear);
    setMonth(newMonth);
  };

  const monthlyBalance = getMonthlyBalance(year, month);
  const categories = getTotalsByCategory(year, month);
  const trendData = getMonthlyTrend(6);
  const meStats = getPersonStats(year, month, 'person1');
  const partnerStats = getPersonStats(year, month, 'person2');
  const upcomingBills = getUpcomingBills(30).slice(0, 4);

  // Comparativo com o mês anterior
  const prevDate = new Date(year, month - 2, 1);
  const prevBalance = getMonthlyBalance(prevDate.getFullYear(), prevDate.getMonth() + 1);
  const expenseDelta =
    prevBalance.expenses > 0
      ? Math.round(((monthlyBalance.expenses - prevBalance.expenses) / prevBalance.expenses) * 100)
      : null;

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
            ? `${money(monthlyBalance.balance)} poupados este mês`
            : savingsRateNum >= 0
            ? 'Tente poupar pelo menos 20% da renda'
            : `Déficit de ${money(Math.abs(monthlyBalance.balance))}`}
        </span>
      </div>
    </div>
  );

  const comparisonBanner = expenseDelta !== null && monthlyBalance.expenses > 0 && (
    <div className={`comparison-banner ${expenseDelta <= 0 ? 'positive' : 'negative'}`}>
      {expenseDelta <= 0 ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
      <span>
        Vocês gastaram <strong>{Math.abs(expenseDelta)}% {expenseDelta <= 0 ? 'a menos' : 'a mais'}</strong>{' '}
        que no mês anterior
      </span>
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
            {comparisonBanner}

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

            {upcomingBills.length > 0 && (
              <div className="upcoming-bills">
                <div className="upcoming-bills-header">
                  <CalendarClock size={18} />
                  <h3>Próximos vencimentos</h3>
                </div>
                <ul className="upcoming-bills-list">
                  {upcomingBills.map((bill) => (
                    <li key={bill.id} className="upcoming-bill">
                      <span className="upcoming-bill-emoji" aria-hidden="true">
                        {categoriesMeta.emoji(bill.category)}
                      </span>
                      <div className="upcoming-bill-info">
                        <span className="upcoming-bill-description">{bill.description}</span>
                        <span className="upcoming-bill-date">{formatDate(bill.date)}</span>
                      </div>
                      <span className="upcoming-bill-amount">{money(bill.amount)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
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
