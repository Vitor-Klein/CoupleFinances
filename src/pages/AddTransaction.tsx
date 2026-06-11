import React, { useState } from "react";
import { useFinances } from "../context/FinancesContext";
import { useCouple } from "../context/CoupleContext";
import { useToast } from "../context/ToastContext";
import { useCategories } from "../hooks/useCategories";
import { RECURRENCE_LABELS } from "../constants/categories";
import { toISODate, formatCurrency } from "../utils/formatters";
import { validateTransaction } from "../utils/validation";
import { CurrencyInput } from "../components/CurrencyInput";
import type { TransactionType, CategoryType, RecurrenceType, PersonKey } from "../types";
import { CheckCircle, RefreshCw, CreditCard } from "lucide-react";

const INSTALLMENT_OPTIONS = [2, 3, 4, 6, 10, 12];

export const AddTransaction: React.FC = () => {
  const { addTransaction, addInstallmentTransactions, coupleProfile } = useFinances();
  const { myPerson } = useCouple();
  const toast = useToast();
  const categories = useCategories();
  const today = new Date();

  const [type, setType] = useState<TransactionType>("expense");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState<CategoryType>("food");
  const [date, setDate] = useState(toISODate(today));
  const [person, setPerson] = useState<PersonKey>(myPerson);
  const [notes, setNotes] = useState("");
  const [recurrence, setRecurrence] = useState<RecurrenceType>("none");
  const [installments, setInstallments] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const options = categories.optionsFor(type);

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setCategory(newType === "income" ? "salary" : "food");
    setRecurrence("none");
    setInstallments(1);
  };

  const handleRecurrenceChange = (opt: RecurrenceType) => {
    setRecurrence(opt);
    if (opt !== "none") setInstallments(1);
  };

  const handleInstallmentsChange = (n: number) => {
    setInstallments(n);
    if (n > 1) setRecurrence("none");
  };

  const installmentValue =
    installments > 1 && amount > 0
      ? Math.round((amount / installments) * 100) / 100
      : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateTransaction({ description, amount, date, notes });
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }
    setError(null);

    const base = {
      description: description.trim(),
      amount,
      type,
      category,
      date,
      person,
      notes: notes.trim() || undefined,
      recurrence: "none" as RecurrenceType,
    };

    if (installments > 1) {
      addInstallmentTransactions(base, installments);
    } else {
      addTransaction({ ...base, recurrence });
    }

    setSubmitted(true);
    setTimeout(() => {
      setDescription("");
      setAmount(0);
      setCategory(type === "income" ? "salary" : "food");
      setDate(toISODate(new Date()));
      setNotes("");
      setRecurrence("none");
      setInstallments(1);
      setSubmitted(false);
    }, 1500);
  };

  const recurrenceOptions: RecurrenceType[] = [
    "none",
    "monthly",
    "semiannual",
    "annual",
  ];

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
                : recurrence !== "none"
                  ? `Entradas ${RECURRENCE_LABELS[recurrence].toLowerCase()}s criadas automaticamente`
                  : "Tudo certo por aqui"}
            </p>
          </div>
        ) : (
          <form
            id="add-transaction-form"
            className="transaction-form"
            onSubmit={handleSubmit}
          >
            {/* Tipo */}
            <div className="form-group">
              <label className="form-label">Tipo</label>
              <div className="type-selector">
                <button
                  type="button"
                  className={`type-button income ${type === "income" ? "active" : ""}`}
                  onClick={() => handleTypeChange("income")}
                >
                  Receita
                </button>
                <button
                  type="button"
                  className={`type-button expense ${type === "expense" ? "active" : ""}`}
                  onClick={() => handleTypeChange("expense")}
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
                maxLength={120}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Valor */}
            <div className="form-group">
              <label htmlFor="amount" className="form-label">
                {installments > 1 ? `Valor total *` : "Valor *"}
              </label>
              <CurrencyInput id="amount" value={amount} onChange={setAmount} />
              {installmentValue !== null && (
                <p className="installment-hint">
                  {installments}x de {formatCurrency(installmentValue)}
                </p>
              )}
            </div>

            {/* Categoria */}
            <div className="form-group">
              <label className="form-label">Categoria *</label>
              <div className="category-selector">
                {options.map((opt) => {
                  const isActive = category === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      className={`category-chip ${isActive ? "active" : ""}`}
                      style={{ "--cat-color": opt.color } as React.CSSProperties}
                      onClick={() => setCategory(opt.key)}
                      aria-pressed={isActive}
                    >
                      <span className="category-chip-emoji" aria-hidden="true">
                        {opt.emoji}
                      </span>
                      <span className="category-chip-label">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
              <p className="form-hint">
                Crie categorias personalizadas na aba <strong>Perfil</strong>.
              </p>
            </div>

            {/* Parcelamento */}
            {type === "expense" && (
              <div className="form-group">
                <label className="form-label">
                  <CreditCard size={14} />
                  Parcelado
                </label>
                <div className="installment-selector">
                  <button
                    type="button"
                    className={`installment-button ${installments === 1 ? "active" : ""}`}
                    onClick={() => handleInstallmentsChange(1)}
                  >
                    À vista
                  </button>
                  {INSTALLMENT_OPTIONS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={`installment-button ${installments === n ? "active" : ""}`}
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
                      className={`recurrence-button ${recurrence === opt ? "active" : ""}`}
                      onClick={() => handleRecurrenceChange(opt)}
                    >
                      {RECURRENCE_LABELS[opt]}
                    </button>
                  ))}
                </div>
                {recurrence !== "none" && (
                  <p className="recurrence-hint">
                    Os lançamentos são criados automaticamente e a série continua
                    para sempre — você pode encerrá-la quando quiser no Extrato.
                  </p>
                )}
              </div>
            )}

            {/* Data */}
            <div className="form-group">
              <label htmlFor="date" className="form-label">
                {installments > 1 ? "Data da 1ª parcela *" : "Data *"}
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
                  className={`person-button ${person === "person1" ? "active" : ""}`}
                  onClick={() => setPerson("person1")}
                >
                  {coupleProfile.person1Name}
                </button>
                <button
                  type="button"
                  className={`person-button ${person === "person2" ? "active" : ""}`}
                  onClick={() => setPerson("person2")}
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
                maxLength={500}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {error && <p className="form-error" role="alert">{error}</p>}
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
