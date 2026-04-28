import React, { useState } from 'react';
import { useFinances } from '../context/FinancesContext';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, RECURRENCE_LABELS } from '../constants/categories';
import { toISODate } from '../utils/formatters';
import type { TransactionType, CategoryType, RecurrenceType } from '../types';
import { CheckCircle, RefreshCw, CreditCard } from 'lucide-react';

const INSTALLMENT_OPTIONS = [2, 3, 4, 6, 10, 12];

export const AddTransaction: React.FC = () => {
  const { addTransaction, addInstallmentTransactions, coupleProfile } = useFinances();
  const today = new Date();

  const [type, setType] = useState<TransactionType>('expense');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<CategoryType>('food');
  const [date, setDate] = useState(toISODate(today));
  const [person, setPerson] = useState<'me' | 'partner'>('me');
  const [notes, setNotes] = useState('');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none');
  const [installments, setInstallments] = useState(1);
  const [submitted, setSubmitted] = useState(false);

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setCategory(newType === 'income' ? 'salary' : 'food');
    setRecurrence('none');
    setInstallments(1);
  };

  const handleRecurrenceChange = (opt: RecurrenceType) => {
    setRecurrence(opt);
    if (opt !== 'none') setInstallments(1);
  };

  const handleInstallmentsChange = (n: number) => {
    setInstallments(n);
    if (n > 1) setRecurrence('none');
  };

  const installmentValue =
    installments > 1 && amount ? Math.round((parseFloat(amount) / installments) * 100) / 100 : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    const base = {
      description: description.trim(),
      amount: parseFloat(amount),
      type,
      category,
      date,
      person,
      notes: notes.trim() || undefined,
      recurrence: 'none' as RecurrenceType,
    };

    if (installments > 1) {
      addInstallmentTransactions(base, installments);
    } else {
      addTransaction({ ...base, recurrence });
    }

    setSubmitted(true);
    setTimeout(() => {
      setDescription('');
      setAmount('');
      setCategory(type === 'income' ? 'salary' : 'food');
      setDate(toISODate(new Date()));
      setNotes('');
      setRecurrence('none');
      setInstallments(1);
      setSubmitted(false);
    }, 1800);
  };

  const recurrenceOptions: RecurrenceType[] = ['none', 'monthly', 'semiannual', 'annual'];

  return (
    <div className="page add-transaction">
      <div className="page-header">
        <h2 className="page-header-title">Nova Transação</h2>
      </div>

      <div className="page-content">
        {submitted ? (
          <div className="success-message">
            <div className="success-icon">
              <CheckCircle size={48} />
            </div>
            <h3>Transação adicionada!</h3>
            <p>
              {installments > 1
                ? `${installments} parcelas criadas automaticamente`
                : recurrence !== 'none'
                  ? `Entradas ${RECURRENCE_LABELS[recurrence].toLowerCase()}s criadas automaticamente`
                  : 'Tudo certo por aqui'}
            </p>
          </div>
        ) : (
          <form id="add-transaction-form" className="transaction-form" onSubmit={handleSubmit}>
            {/* Tipo */}
            <div className="form-group">
              <label className="form-label">Tipo</label>
              <div className="type-selector">
                <button
                  type="button"
                  className={`type-button income ${type === 'income' ? 'active' : ''}`}
                  onClick={() => handleTypeChange('income')}
                >
                  Receita
                </button>
                <button
                  type="button"
                  className={`type-button expense ${type === 'expense' ? 'active' : ''}`}
                  onClick={() => handleTypeChange('expense')}
                >
                  Despesa
                </button>
              </div>
            </div>

            {/* Descrição */}
            <div className="form-group">
              <label htmlFor="description" className="form-label">
                Descrição *
              </label>
              <input
                id="description"
                type="text"
                className="form-input"
                placeholder="Ex: Netflix, Mercado, Aluguel…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Valor */}
            <div className="form-group">
              <label htmlFor="amount" className="form-label">
                {installments > 1 ? `Valor total (R$) *` : 'Valor (R$) *'}
              </label>
              <input
                id="amount"
                type="number"
                className="form-input"
                placeholder="0,00"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              {installmentValue !== null && (
                <p className="installment-hint">
                  {installments}x de R$ {installmentValue.toFixed(2).replace('.', ',')}
                </p>
              )}
            </div>

            {/* Categoria */}
            <div className="form-group">
              <label htmlFor="category" className="form-label">
                Categoria *
              </label>
              <select
                id="category"
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryType)}
              >
                {Object.entries(categories).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Parcelamento */}
            {type === 'expense' && (
              <div className="form-group">
                <label className="form-label">
                  <CreditCard size={14} />
                  Parcelado
                </label>
                <div className="installment-selector">
                  <button
                    type="button"
                    className={`installment-button ${installments === 1 ? 'active' : ''}`}
                    onClick={() => handleInstallmentsChange(1)}
                  >
                    À vista
                  </button>
                  {INSTALLMENT_OPTIONS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={`installment-button ${installments === n ? 'active' : ''}`}
                      onClick={() => handleInstallmentsChange(n)}
                    >
                      {n}x
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Recorrência — desabilitada quando parcelado */}
            {installments === 1 && (
              <div className="form-group">
                <label className="form-label">
                  <RefreshCw size={14} />
                  Repetição
                </label>
                <div className="recurrence-selector">
                  {recurrenceOptions.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      className={`recurrence-button ${recurrence === opt ? 'active' : ''}`}
                      onClick={() => handleRecurrenceChange(opt)}
                    >
                      {RECURRENCE_LABELS[opt]}
                    </button>
                  ))}
                </div>
                {recurrence !== 'none' && (
                  <p className="recurrence-hint">
                    {recurrence === 'monthly' && 'Lançamentos automáticos nos próximos 24 meses.'}
                    {recurrence === 'semiannual' && 'Lançamentos a cada 6 meses nos próximos 2,5 anos.'}
                    {recurrence === 'annual' && 'Lançamentos anuais nos próximos 4 anos.'}
                  </p>
                )}
              </div>
            )}

            {/* Data */}
            <div className="form-group">
              <label htmlFor="date" className="form-label">
                {installments > 1 ? 'Data da 1ª parcela *' : 'Data *'}
              </label>
              <input
                id="date"
                type="date"
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            {/* Pessoa */}
            <div className="form-group">
              <label className="form-label">Quem?</label>
              <div className="person-selector">
                <button
                  type="button"
                  className={`person-button ${person === 'me' ? 'active' : ''}`}
                  onClick={() => setPerson('me')}
                >
                  {coupleProfile.person1Name}
                </button>
                <button
                  type="button"
                  className={`person-button ${person === 'partner' ? 'active' : ''}`}
                  onClick={() => setPerson('partner')}
                >
                  {coupleProfile.person2Name}
                </button>
              </div>
            </div>

            {/* Notas */}
            <div className="form-group">
              <label htmlFor="notes" className="form-label">
                Notas (opcional)
              </label>
              <textarea
                id="notes"
                className="form-textarea"
                placeholder="Observações sobre esta transação…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

          </form>
        )}
      </div>

      {!submitted && (
        <div className="form-sticky-footer">
          <button
            type="submit"
            form="add-transaction-form"
            className="button button-primary button-large"
          >
            Adicionar Transação
          </button>
        </div>
      )}
    </div>
  );
};
