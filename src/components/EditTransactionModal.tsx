import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import type { Transaction, TransactionType, CategoryType, RecurrenceType, PersonKey } from '../types';
import { RECURRENCE_LABELS } from '../constants/categories';
import { useCategories } from '../hooks/useCategories';
import { validateTransaction } from '../utils/validation';
import { Modal } from './Modal';
import { CurrencyInput } from './CurrencyInput';

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
  const categories = useCategories();
  const [description, setDescription] = useState(transaction.description);
  const [amount, setAmount] = useState(transaction.amount);
  const [type, setType] = useState<TransactionType>(transaction.type);
  const [category, setCategory] = useState<CategoryType>(transaction.category);
  const [date, setDate] = useState(transaction.date);
  const [person, setPerson] = useState<PersonKey>(transaction.person);
  const [notes, setNotes] = useState(transaction.notes ?? '');
  const [showGroupChoice, setShowGroupChoice] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const options = categories.optionsFor(type);

  const buildUpdates = (): Partial<Transaction> => ({
    description: description.trim(),
    amount,
    type,
    category,
    date,
    person,
    notes: notes.trim() || undefined,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateTransaction({
      description,
      amount,
      date,
      notes,
    });
    if (validationError) {
      setError(validationError);
      return;
    }
    if (transaction.recurrenceGroupId) {
      setShowGroupChoice(true);
    } else {
      onSave(buildUpdates());
    }
  };

  if (isRecurringSalary) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Salário do Perfil">
        <div className="modal-body">
          <p className="modal-info">
            Este salário é gerenciado pelo perfil do casal. Para editá-lo, acesse a aba{' '}
            <strong>Perfil</strong>.
          </p>
          <button type="button" className="button button-primary button-large" onClick={onClose}>
            Entendido
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Transação">
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
              maxLength={120}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-amount" className="form-label">Valor *</label>
            <CurrencyInput id="edit-amount" value={amount} onChange={setAmount} />
          </div>

          <div className="form-group">
            <label htmlFor="edit-category" className="form-label">Categoria *</label>
            <select
              id="edit-category"
              className="form-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {options.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.emoji} {opt.label}
                </option>
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
                className={`person-button ${person === 'person1' ? 'active' : ''}`}
                onClick={() => setPerson('person1')}
              >
                {person1Name}
              </button>
              <button
                type="button"
                className={`person-button ${person === 'person2' ? 'active' : ''}`}
                onClick={() => setPerson('person2')}
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
              maxLength={500}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {error && <p className="form-error" role="alert">{error}</p>}

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
    </Modal>
  );
};
