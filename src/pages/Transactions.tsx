import React, { useState, useMemo } from 'react';
import {
  Header,
  MonthSelector,
  TransactionItem,
  EditTransactionModal,
} from '../components';
import { ListSkeleton } from '../components/Skeleton';
import { Modal } from '../components/Modal';
import { useFinances } from '../context/FinancesContext';
import { useToast } from '../context/ToastContext';
import { usePrivacy } from '../context/PrivacyContext';
import { useCategories } from '../hooks/useCategories';
import { formatDayLabel, formatMonth } from '../utils/formatters';
import { downloadCSV, csvNumber } from '../utils/csv';
import { Search, Download, X } from 'lucide-react';
import type { Transaction } from '../types';

interface DeleteConfirmState {
  transaction: Transaction;
}

export const Transactions: React.FC = () => {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPerson, setFilterPerson] = useState<'all' | 'person1' | 'person2'>('all');
  const [search, setSearch] = useState('');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState | null>(null);

  const {
    getTransactionsByMonth,
    deleteTransaction,
    restoreTransaction,
    deleteRecurringGroup,
    editTransaction,
    editRecurringGroup,
    isRecurringSalary,
    coupleProfile,
    isLoaded,
  } = useFinances();
  const toast = useToast();
  const { money } = usePrivacy();
  const categories = useCategories();

  const transactions = getTransactionsByMonth(year, month);

  const usedCategories = useMemo(() => {
    const keys = new Set(transactions.map((t) => t.category));
    return Array.from(keys).map((key) => ({ key, label: categories.label(key) }));
  }, [transactions, categories]);

  const filteredTransactions = useMemo(() => {
    let result = transactions;
    if (filterType !== 'all') result = result.filter((t) => t.type === filterType);
    if (filterCategory !== 'all') result = result.filter((t) => t.category === filterCategory);
    if (filterPerson !== 'all') result = result.filter((t) => t.person === filterPerson);
    const term = search.trim().toLowerCase();
    if (term) {
      result = result.filter(
        (t) =>
          t.description.toLowerCase().includes(term) ||
          (t.notes ?? '').toLowerCase().includes(term) ||
          categories.label(t.category).toLowerCase().includes(term),
      );
    }
    return [...result].sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, filterType, filterCategory, filterPerson, search, categories]);

  /** Agrupa por dia preservando a ordem (mais recente primeiro) */
  const groupedByDay = useMemo(() => {
    const groups: { date: string; items: Transaction[]; total: number }[] = [];
    for (const t of filteredTransactions) {
      const last = groups[groups.length - 1];
      if (last && last.date === t.date) {
        last.items.push(t);
      } else {
        groups.push({ date: t.date, items: [t], total: 0 });
      }
    }
    for (const g of groups) {
      g.total = g.items.reduce(
        (sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount),
        0,
      );
    }
    return groups;
  }, [filteredTransactions]);

  const handleMonthChange = (newYear: number, newMonth: number) => {
    setYear(newYear);
    setMonth(newMonth);
  };

  const handleDeleteRequest = (transaction: Transaction) => {
    if (transaction.isSalaryFromProfile) {
      toast.info('Este salário é gerenciado pelo perfil do casal. Altere na aba Perfil.');
      return;
    }
    if (transaction.recurrenceGroupId) {
      setDeleteConfirm({ transaction });
    } else {
      deleteTransaction(transaction.id);
      toast.undo('Transação excluída', () => restoreTransaction(transaction));
    }
  };

  const handleConfirmDelete = (mode: 'single' | 'group') => {
    if (!deleteConfirm) return;
    const { transaction } = deleteConfirm;
    if (mode === 'single') {
      deleteTransaction(transaction.id);
      toast.undo('Transação excluída', () => restoreTransaction(transaction));
    } else if (transaction.recurrenceGroupId) {
      deleteRecurringGroup(transaction.recurrenceGroupId, transaction.date);
      toast.success('Série recorrente encerrada');
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
    toast.success('Transação atualizada');
  };

  const handleExportCSV = () => {
    const rows: string[][] = [
      ['Data', 'Descrição', 'Tipo', 'Categoria', 'Quem', 'Valor (R$)', 'Notas'],
      ...filteredTransactions.map((t) => [
        t.date,
        t.description,
        t.type === 'income' ? 'Receita' : 'Despesa',
        categories.label(t.category),
        t.person === 'person1' ? coupleProfile.person1Name : coupleProfile.person2Name,
        csvNumber(t.type === 'income' ? t.amount : -t.amount),
        t.notes ?? '',
      ]),
    ];
    downloadCSV(`transacoes-${year}-${String(month).padStart(2, '0')}.csv`, rows);
    toast.success(`Extrato de ${formatMonth(year, month)} exportado`);
  };

  const totalIncome = transactions.filter((t) => t.type === 'income').length;
  const totalExpense = transactions.filter((t) => t.type === 'expense').length;
  const hasActiveFilters =
    filterCategory !== 'all' || filterPerson !== 'all' || search.trim() !== '';

  return (
    <div className="page transactions">
      <Header title="Transações" />

      <div className="page-content">
        <MonthSelector year={year} month={month} onMonthChange={handleMonthChange} />

        {!isLoaded ? (
          <ListSkeleton />
        ) : (
          <>
            <div className="search-bar">
              <Search size={16} className="search-bar-icon" />
              <input
                type="search"
                className="search-bar-input"
                placeholder="Buscar por descrição, categoria, nota…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Buscar transações"
              />
              {search && (
                <button
                  type="button"
                  className="search-bar-clear"
                  onClick={() => setSearch('')}
                  aria-label="Limpar busca"
                >
                  <X size={14} />
                </button>
              )}
            </div>

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

            <div className="filter-row">
              <select
                className="form-select filter-select"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                aria-label="Filtrar por categoria"
              >
                <option value="all">Todas as categorias</option>
                {usedCategories.map((c) => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
              <select
                className="form-select filter-select"
                value={filterPerson}
                onChange={(e) => setFilterPerson(e.target.value as 'all' | 'person1' | 'person2')}
                aria-label="Filtrar por pessoa"
              >
                <option value="all">Vocês dois</option>
                <option value="person1">{coupleProfile.person1Name}</option>
                <option value="person2">{coupleProfile.person2Name}</option>
              </select>
              <button
                type="button"
                className="button button-outline button-export"
                onClick={handleExportCSV}
                disabled={filteredTransactions.length === 0}
                title="Exportar CSV"
              >
                <Download size={16} />
                <span>CSV</span>
              </button>
            </div>

            {filteredTransactions.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <p>
                  {hasActiveFilters
                    ? 'Nada encontrado com esses filtros'
                    : 'Nenhuma transação neste período'}
                </p>
                <small>
                  {hasActiveFilters
                    ? 'Tente ajustar a busca ou os filtros'
                    : 'Adicione uma transação para começar'}
                </small>
              </div>
            ) : (
              <div className="transactions-list">
                {groupedByDay.map((group) => (
                  <section key={group.date} className="transactions-day-group">
                    <div className="transactions-day-header">
                      <span className="transactions-day-label">{formatDayLabel(group.date)}</span>
                      <span
                        className={`transactions-day-total ${group.total >= 0 ? 'income' : 'expense'}`}
                      >
                        {group.total >= 0 ? '+' : '-'}{money(Math.abs(group.total))}
                      </span>
                    </div>
                    {group.items.map((transaction) => (
                      <TransactionItem
                        key={transaction.id}
                        transaction={transaction}
                        onDelete={handleDeleteRequest}
                        onEdit={setEditingTransaction}
                        person1Name={coupleProfile.person1Name}
                        person2Name={coupleProfile.person2Name}
                        hideDate
                      />
                    ))}
                  </section>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {editingTransaction && (
        <EditTransactionModal
          key={editingTransaction.id}
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
        <Modal
          isOpen
          onClose={() => setDeleteConfirm(null)}
          title="Excluir transação recorrente"
          className="delete-modal"
        >
          <div className="modal-body">
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
              <button
                type="button"
                className="button button-ghost"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
