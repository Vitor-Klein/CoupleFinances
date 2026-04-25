import React from 'react';
import { formatCurrency } from '../utils/formatters';
import { ArrowUp, ArrowDown, Wallet } from 'lucide-react';

interface BalanceCardProps {
  title: string;
  income: number;
  expenses: number;
  balance: number;
  variant?: 'default' | 'compact';
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  title,
  income,
  expenses,
  balance,
  variant = 'default',
}) => {
  const isPositive = balance >= 0;

  if (variant === 'compact') {
    return (
      <div className={`balance-card compact ${isPositive ? 'positive' : 'negative'}`}>
        <h3>{title}</h3>
        <div className="balance-compact-values">
          <div className="balance-compact-row">
            <ArrowUp size={12} className="icon-income" />
            <span>{formatCurrency(income)}</span>
          </div>
          <div className="balance-compact-row">
            <ArrowDown size={12} className="icon-expense" />
            <span>{formatCurrency(expenses)}</span>
          </div>
        </div>
        <div className={`balance-compact-total ${isPositive ? 'positive' : 'negative'}`}>
          {formatCurrency(balance)}
        </div>
      </div>
    );
  }

  return (
    <div className="balance-card">
      <div className="balance-card-header">
        <h3>{title}</h3>
        <div className="balance-card-icon">
          <Wallet size={20} />
        </div>
      </div>
      <div className="balance-values">
        <div className="value-item income">
          <div className="value-icon">
            <ArrowUp size={16} />
          </div>
          <div>
            <div className="value-label">Receitas</div>
            <div className="value-amount">{formatCurrency(income)}</div>
          </div>
        </div>
        <div className="value-item expense">
          <div className="value-icon">
            <ArrowDown size={16} />
          </div>
          <div>
            <div className="value-label">Despesas</div>
            <div className="value-amount">{formatCurrency(expenses)}</div>
          </div>
        </div>
      </div>
      <div className={`balance-total ${isPositive ? 'positive' : 'negative'}`}>
        <span>Saldo do mês</span>
        <strong>{formatCurrency(balance)}</strong>
      </div>
    </div>
  );
};
