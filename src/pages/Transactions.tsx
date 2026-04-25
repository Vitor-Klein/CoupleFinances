import React, { useState, useMemo } from 'react';
import {
  Header,
  MonthSelector,
  TransactionItem,
  EditTransactionModal,
} from '../components';
import { useFinances } from '../context/FinancesContext';
import type { Transaction } from '../types';

interface DeleteConfirmState {
  transaction: Transaction;
  mode: 'single' | 'group';
}

export const Transactions: React.FC = () => {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState | null>(null);

  const {
    getTransactionsByMonth,
    deleteTransaction,
    deleteRecurringGroup,
    editTransaction,
    editRecurringGroup,
    isRecurringSalary,
    coupleProfile,
  } = useFinances();

  const handleMonthChange = (newYear: number, newMonth: number) => {
    setYear(newYear);
    setMonth(newMonth);
  };

  const transactions = getTransactionsByMonth(year, month);

  const filteredTransactions = useMemo(() => {
    let result = transactions;
    if (filterType !== 'all') result = result.filter((t) => t.type === filterType);
    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filterType]);

  const handleDeleteRequest = (transaction: Transaction) => {
    if (transaction.isSalaryFromProfile) {
      alert(
        'Este salário é gerenciado pelo perfil do casal. Para alterar, acesse a aba Perfil.',
      );
      return;
    }
    if (transaction.recurrenceGroupId) {
      setDeleteConfirm({ transaction, mode: 'single' });
    } else {
      deleteTransaction(transaction.id);
    }
  };

  const handleConfirmDelete = (mode: 'single' | 'group') => {
    if (!deleteConfirm) return;
    const { transaction } = deleteConfirm;
    if (mode === 'single') {
      deleteTransaction(transaction.id);
    } else if (transaction.recurrenceGroupId) {
      deleteRecurringGroup(transaction.recurrenceGroupId, transaction.date);
    }
    setDeleteConfirm(null);
  };

  const handleSaveEdit = (updates: Partial<Transaction>, editMode?: 'single' | 'group') => {
    if (!editingTransaction) return;
    if (editMode === 'group' && editingTransaction.recurrenceGroupId) {
      editRecurringGroup(editingTransaction.recurrenceGroupId, editingTransaction.date, updates);
    } else {
      editTransaction(editingTransaction.id, updates);
    }
    setEditingTransaction(null);
  };

  const totalIncome = transactions.filter((t) => t.type === 'income').length;
  const totalExpense = transactions.filter((t) => t.type === 'expense').length;

  return (
    <div className="page transactions">
      <Header title="Transações" />

      <div className="page-content">
        <MonthSelector year={year} month={month} onMonthChange={handleMonthChange} />

        <div className="filter-tabs">
          <button
            type="button"
            className={`filter-tab ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            Todas ({transactions.length})
          </button>
          <button
            type="button"
            className={`filter-tab income ${filterType === 'income' ? 'active' : ''}`}
            onClick={() => setFilterType('income')}
          >
            Receitas ({totalIncome})
          </button>
          <button
            type="button"
            className={`filter-tab expense ${filterType === 'expense' ? 'active' : ''}`}
            onClick={() => setFilterType('expense')}
          >
            Despesas ({totalExpense})
          </button>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p>Nenhuma transação neste período</p>
            <small>Adicione uma transação para começar</small>
          </div>
        ) : (
          <div className="transactions-list">
            {filteredTransactions.map((transaction) => (
              <TransactionItem
                key={transaction.id}
                transaction={transaction}
                onDelete={handleDeleteRequest}
                onEdit={setEditingTransaction}
                person1Name={coupleProfile.person1Name}
                person2Name={coupleProfile.person2Name}
              />
            ))}
          </div>
        )}
      </div>

      {editingTransaction && (
        <EditTransactionModal
          transaction={editingTransaction}
          isOpen
          onClose={() => setEditingTransaction(null)}
          onSave={handleSaveEdit}
          isRecurringSalary={isRecurringSalary(editingTransaction.id)}
          person1Name={coupleProfile.person1Name}
          person2Name={coupleProfile.person2Name}
        />
      )}

      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Deletar transação recorrente</h3>
            <p>
              <strong>{deleteConfirm.transaction.description}</strong> faz parte de uma série
              recorrente. O que deseja fazer?
            </p>
            <div className="delete-modal-actions">
              <button
                type="button"
                className="button button-outline"
                onClick={() => handleConfirmDelete('single')}
              >
                Só esta entrada
              </button>
              <button
                type="button"
                className="button button-danger"
                onClick={() => handleConfirmDelete('group')}
              >
                Esta e as próximas
              </button>
              <button type="button" className="button button-ghost" onClick={() => setDeleteConfirm(null)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
