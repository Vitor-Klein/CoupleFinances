import React, { useState, useEffect } from 'react';
import { X, RefreshCw } from 'lucide-react';
import type { Transaction, TransactionType, CategoryType, RecurrenceType } from '../types';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, RECURRENCE_LABELS } from '../constants/categories';

interface EditTransactionModalProps {
  transaction: Transaction;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<Transaction>, editMode?: 'single' | 'group') => void;
  isRecurringSalary: boolean;
  person1Name?: string;
  person2Name?: string;
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  transaction,
  isOpen,
  onClose,
  onSave,
  isRecurringSalary,
  person1Name = 'Eu',
  person2Name = 'Parceiro(a)',
}) => {
  const [description, setDescription] = useState(transaction.description);
  const [amount, setAmount] = useState(transaction.amount.toString());
  const [type, setType] = useState<TransactionType>(transaction.type);
  const [category, setCategory] = useState<CategoryType>(transaction.category);
  const [date, setDate] = useState(transaction.date);
  const [person, setPerson] = useState<'me' | 'partner'>(transaction.person);
  const [notes, setNotes] = useState(transaction.notes ?? '');
  const [showGroupChoice, setShowGroupChoice] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDescription(transaction.description);
      setAmount(transaction.amount.toString());
      setType(transaction.type);
      setCategory(transaction.category);
      setDate(transaction.date);
      setPerson(transaction.person);
      setNotes(transaction.notes ?? '');
      setShowGroupChoice(false);
    }
  }, [transaction, isOpen]);

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const buildUpdates = (): Partial<Transaction> => ({
    description: description.trim(),
    amount: parseFloat(amount),
    type,
    category,
    date,
    person,
    notes: notes.trim() || undefined,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }
    if (transaction.recurrenceGroupId) {
      setShowGroupChoice(true);
    } else {
      onSave(buildUpdates());
    }
  };

  if (!isOpen) return null;

  if (isRecurringSalary) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Salário do Perfil</h2>
            <button type="button" className="modal-close" onClick={onClose} aria-label="Fechar">
              <X size={24} />
            </button>
          </div>
          <div className="modal-body">
            <p className="modal-info">
              Este salário é gerenciado pelo perfil do casal. Para editá-lo, acesse a aba{' '}
              <strong>Perfil</strong>.
            </p>
            <button type="button" className="button button-primary button-large" onClick={onClose}>
              Entendido
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Editar Transação</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Fechar">
            <X size={24} />
          </button>
        </div>

        {showGroupChoice ? (
          <div className="modal-body">
            <div className="group-choice-icon">
              <RefreshCw size={32} />
            </div>
            <h3>Editar série recorrente</h3>
            <p>Esta transação faz parte de uma série. O que deseja editar?</p>
            <div className="group-choice-actions">
              <button
                type="button"
                className="button button-outline button-large"
                onClick={() => { onSave(buildUpdates(), 'single'); }}
              >
                Só esta entrada
              </button>
              <button
                type="button"
                className="button button-primary button-large"
                onClick={() => { onSave(buildUpdates(), 'group'); }}
              >
                Esta e as próximas
              </button>
              <button
                type="button"
                className="button button-ghost"
                onClick={() => setShowGroupChoice(false)}
              >
                Voltar
              </button>
            </div>
          </div>
        ) : (
          <form className="transaction-form" onSubmit={handleSubmit}>
            {transaction.recurrenceGroupId && (
              <div className="recurrence-info-banner">
                <RefreshCw size={14} />
                <span>
                  Série {RECURRENCE_LABELS[transaction.recurrence as RecurrenceType] ?? 'recorrente'} — editar pode afetar entradas futuras
                </span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Tipo</label>
              <div className="type-selector">
                <button
                  type="button"
                  className={`type-button income ${type === 'income' ? 'active' : ''}`}
                  onClick={() => { setType('income'); setCategory('salary'); }}
                >
                  Receita
                </button>
                <button
                  type="button"
                  className={`type-button expense ${type === 'expense' ? 'active' : ''}`}
                  onClick={() => { setType('expense'); setCategory('food'); }}
                >
                  Despesa
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="edit-description" className="form-label">Descrição *</label>
              <input
                id="edit-description"
                type="text"
                className="form-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-amount" className="form-label">Valor (R$) *</label>
              <input
                id="edit-amount"
                type="number"
                className="form-input"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-category" className="form-label">Categoria *</label>
              <select
                id="edit-category"
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryType)}
              >
                {Object.entries(categories).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="edit-date" className="form-label">Data *</label>
              <input
                id="edit-date"
                type="date"
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Quem?</label>
              <div className="person-selector">
                <button
                  type="button"
                  className={`person-button ${person === 'me' ? 'active' : ''}`}
                  onClick={() => setPerson('me')}
                >
                  {person1Name}
                </button>
                <button
                  type="button"
                  className={`person-button ${person === 'partner' ? 'active' : ''}`}
                  onClick={() => setPerson('partner')}
                >
                  {person2Name}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="edit-notes" className="form-label">Notas (opcional)</label>
              <textarea
                id="edit-notes"
                className="form-textarea"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            <div className="modal-actions">
              <button type="submit" className="button button-primary button-large">
                Salvar
              </button>
              <button type="button" className="button button-outline button-large" onClick={onClose}>
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
