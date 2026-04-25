import React from 'react';
import type { Transaction } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { ALL_CATEGORIES, CATEGORY_COLORS, RECURRENCE_LABELS } from '../constants/categories';
import { Trash2, RefreshCw, Lock } from 'lucide-react';

interface TransactionItemProps {
  transaction: Transaction;
  onDelete: (t: Transaction) => void;
  onEdit?: (transaction: Transaction) => void;
  person1Name?: string;
  person2Name?: string;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  onDelete,
  onEdit,
  person1Name = 'Eu',
  person2Name = 'Parceiro(a)',
}) => {
  const categoryColor = CATEGORY_COLORS[transaction.category];
  const categoryLabel = ALL_CATEGORIES[transaction.category] ?? transaction.category;
  const personLabel = transaction.person === 'me' ? person1Name : person2Name;
  const isIncome = transaction.type === 'income';
  const isSalaryFromProfile = transaction.isSalaryFromProfile === true;
  const isLocked = isSalaryFromProfile || transaction.isRecurringSalary === true;
  const hasRecurrence = transaction.recurrence && transaction.recurrence !== 'none';

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(transaction);
  };

  return (
    <div
      className={`transaction-item ${isIncome ? 'income' : 'expense'} ${isSalaryFromProfile ? 'readonly' : ''}`}
      onClick={() => !isSalaryFromProfile && onEdit?.(transaction)}
    >
      <div
        className="transaction-dot"
        style={{ '--dot-color': categoryColor } as React.CSSProperties}
      />

      <div className="transaction-content">
        <div className="transaction-top">
          <div className="transaction-description-row">
            <span className="transaction-description">{transaction.description}</span>
            {isSalaryFromProfile && (
              <span className="transaction-badge badge-salary">
                <Lock size={10} />
                Perfil
              </span>
            )}
            {hasRecurrence && !isSalaryFromProfile && (
              <span className="transaction-badge badge-recurring">
                <RefreshCw size={10} />
                {RECURRENCE_LABELS[transaction.recurrence!]}
              </span>
            )}
          </div>
          <span className={`transaction-amount ${isIncome ? 'income' : 'expense'}`}>
            {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
          </span>
        </div>

        <div className="transaction-bottom">
          <span className="transaction-category">{categoryLabel}</span>
          <span className="transaction-person">{personLabel}</span>
          <span className="transaction-date">{formatDate(transaction.date)}</span>
        </div>
      </div>

      <button
        type="button"
        className={`transaction-delete ${isLocked ? 'locked' : ''}`}
        onClick={handleDelete}
        title={isLocked ? 'Gerenciado pelo perfil' : 'Deletar transação'}
        aria-label={isLocked ? 'Transação protegida' : 'Deletar transação'}
        disabled={isLocked}
      >
        {isLocked ? <Lock size={16} /> : <Trash2 size={16} />}
      </button>
    </div>
  );
};
