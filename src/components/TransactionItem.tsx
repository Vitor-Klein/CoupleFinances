import React, { useRef, useState } from 'react';
import type { Transaction } from '../types';
import { formatDate } from '../utils/formatters';
import { RECURRENCE_LABELS } from '../constants/categories';
import { useCategories } from '../hooks/useCategories';
import { usePrivacy } from '../context/PrivacyContext';
import { Trash2, RefreshCw, Lock, Pencil } from 'lucide-react';

interface TransactionItemProps {
  transaction: Transaction;
  onDelete: (t: Transaction) => void;
  onEdit?: (transaction: Transaction) => void;
  person1Name?: string;
  person2Name?: string;
  /** Oculta a data (usado quando a lista já agrupa por dia) */
  hideDate?: boolean;
}

const SWIPE_REVEAL = -132;

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  onDelete,
  onEdit,
  person1Name = 'Eu',
  person2Name = 'Parceiro(a)',
  hideDate = false,
}) => {
  const categories = useCategories();
  const { money } = usePrivacy();
  const [swipeOffset, setSwipeOffset] = useState(0);
  const touchStart = useRef<{ x: number; y: number; base: number } | null>(null);
  const isHorizontal = useRef(false);

  const categoryColor = categories.color(transaction.category);
  const categoryLabel = categories.label(transaction.category);
  const personLabel = transaction.person === 'person1' ? person1Name : person2Name;
  const isIncome = transaction.type === 'income';
  const isSalaryFromProfile = transaction.isSalaryFromProfile === true;
  const isLocked = isSalaryFromProfile || transaction.isRecurringSalary === true;
  const hasRecurrence = transaction.recurrence && transaction.recurrence !== 'none';

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isLocked) return;
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY, base: swipeOffset };
    isHorizontal.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const t = e.touches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    if (!isHorizontal.current && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
      isHorizontal.current = true;
    }
    if (!isHorizontal.current) return;
    const next = Math.min(0, Math.max(SWIPE_REVEAL - 24, touchStart.current.base + dx));
    setSwipeOffset(next);
  };

  const handleTouchEnd = () => {
    if (!touchStart.current) return;
    setSwipeOffset((current) => (current < SWIPE_REVEAL / 2 ? SWIPE_REVEAL : 0));
    touchStart.current = null;
  };

  const closeSwipe = () => setSwipeOffset(0);

  const handleClick = () => {
    if (swipeOffset !== 0) {
      closeSwipe();
      return;
    }
    if (!isSalaryFromProfile) onEdit?.(transaction);
  };

  return (
    <div className="transaction-swipe-wrapper">
      {!isLocked && (
        <div className="transaction-swipe-actions" aria-hidden={swipeOffset === 0}>
          <button
            type="button"
            className="swipe-action swipe-action-edit"
            tabIndex={swipeOffset === 0 ? -1 : 0}
            onClick={() => { closeSwipe(); onEdit?.(transaction); }}
          >
            <Pencil size={18} />
            Editar
          </button>
          <button
            type="button"
            className="swipe-action swipe-action-delete"
            tabIndex={swipeOffset === 0 ? -1 : 0}
            onClick={() => { closeSwipe(); onDelete(transaction); }}
          >
            <Trash2 size={18} />
            Excluir
          </button>
        </div>
      )}

      <div
        className={`transaction-item ${isIncome ? 'income' : 'expense'} ${isSalaryFromProfile ? 'readonly' : ''}`}
        style={swipeOffset !== 0 ? { transform: `translateX(${swipeOffset}px)` } : undefined}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
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
              {isIncome ? '+' : '-'}{money(transaction.amount)}
            </span>
          </div>

          <div className="transaction-bottom">
            <span className="transaction-category">{categoryLabel}</span>
            <span className="transaction-person">{personLabel}</span>
            {!hideDate && <span className="transaction-date">{formatDate(transaction.date)}</span>}
          </div>
        </div>

        <button
          type="button"
          className={`transaction-delete ${isLocked ? 'locked' : ''}`}
          onClick={(e) => { e.stopPropagation(); onDelete(transaction); }}
          title={isLocked ? 'Gerenciado pelo perfil' : 'Excluir transação'}
          aria-label={isLocked ? 'Transação protegida' : 'Excluir transação'}
          disabled={isLocked}
        >
          {isLocked ? <Lock size={16} /> : <Trash2 size={16} />}
        </button>
      </div>
    </div>
  );
};
