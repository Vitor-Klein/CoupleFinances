import React, { useState } from 'react';
import { Header, MonthSelector } from '../components';
import { Modal } from '../components/Modal';
import { CurrencyInput } from '../components/CurrencyInput';
import { DashboardSkeleton } from '../components/Skeleton';
import { useFinances } from '../context/FinancesContext';
import { usePrivacy } from '../context/PrivacyContext';
import { useToast } from '../context/ToastContext';
import { useCategories } from '../hooks/useCategories';
import { validateAmount } from '../utils/validation';
import { formatDate } from '../utils/formatters';
import {
  Target,
  Wallet,
  Plus,
  Trash2,
  PiggyBank,
  AlertTriangle,
  CheckCircle2,
  CalendarDays,
} from 'lucide-react';
import type { Budget, Goal } from '../types';

const GOAL_EMOJIS = ['🎯', '✈️', '🏠', '🚗', '💍', '👶', '🎓', '🏖️', '💻', '🛋️', '🐶', '💰'];

export const Planning: React.FC = () => {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  const {
    budgets,
    goals,
    upsertBudget,
    deleteBudget,
    addGoal,
    updateGoal,
    deleteGoal,
    getTotalsByCategory,
    isLoaded,
  } = useFinances();
  const { money } = usePrivacy();
  const toast = useToast();
  const categories = useCategories();

  const [budgetModal, setBudgetModal] = useState<{ category: string; amount: number } | null>(null);
  const [goalModal, setGoalModal] = useState<Partial<Goal> | null>(null);
  const [contributeModal, setContributeModal] = useState<{ goal: Goal; amount: number } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<
    { kind: 'budget'; item: Budget } | { kind: 'goal'; item: Goal } | null
  >(null);

  if (!isLoaded) {
    return (
      <div className="page planning">
        <Header title="Planejamento" />
        <DashboardSkeleton />
      </div>
    );
  }

  const spentByCategory = new Map(
    getTotalsByCategory(year, month).map((c) => [c.category, c.total]),
  );

  const budgetedKeys = new Set(budgets.map((b) => b.category));
  const availableCategories = categories.expenseOptions.filter((o) => !budgetedKeys.has(o.key));

  // ---------- Handlers ----------
  const handleSaveBudget = () => {
    if (!budgetModal) return;
    const err = validateAmount(budgetModal.amount, 'limite');
    if (err) {
      toast.error(err);
      return;
    }
    upsertBudget(budgetModal.category, budgetModal.amount);
    setBudgetModal(null);
    toast.success('Orçamento salvo');
  };

  const handleSaveGoal = () => {
    if (!goalModal) return;
    const name = (goalModal.name ?? '').trim();
    if (!name) {
      toast.error('Dê um nome para a meta.');
      return;
    }
    const err = validateAmount(goalModal.targetAmount ?? 0, 'valor da meta');
    if (err) {
      toast.error(err);
      return;
    }
    if (goalModal.id) {
      updateGoal(goalModal.id, {
        name,
        emoji: goalModal.emoji ?? '🎯',
        targetAmount: goalModal.targetAmount!,
        targetDate: goalModal.targetDate || undefined,
      });
    } else {
      addGoal({
        name,
        emoji: goalModal.emoji ?? '🎯',
        targetAmount: goalModal.targetAmount!,
        savedAmount: goalModal.savedAmount ?? 0,
        targetDate: goalModal.targetDate || undefined,
      });
    }
    setGoalModal(null);
    toast.success('Meta salva');
  };

  const handleContribute = () => {
    if (!contributeModal) return;
    const err = validateAmount(contributeModal.amount);
    if (err) {
      toast.error(err);
      return;
    }
    updateGoal(contributeModal.goal.id, {
      savedAmount: contributeModal.goal.savedAmount + contributeModal.amount,
    });
    setContributeModal(null);
    toast.success(`${money(contributeModal.amount)} guardados para "${contributeModal.goal.name}"`);
  };

  const handleConfirmDelete = () => {
    if (!confirmDelete) return;
    if (confirmDelete.kind === 'budget') {
      deleteBudget(confirmDelete.item.id);
      toast.success('Orçamento removido');
    } else {
      deleteGoal(confirmDelete.item.id);
      toast.success('Meta removida');
    }
    setConfirmDelete(null);
  };

  return (
    <div className="page planning">
      <Header title="Planejamento" />

      <div className="page-content">
        {/* ============ ORÇAMENTOS ============ */}
        <section className="planning-section">
          <div className="planning-section-header">
            <div className="planning-section-title">
              <Wallet size={18} />
              <h3>Orçamentos do mês</h3>
            </div>
            <button
              type="button"
              className="button button-outline button-small"
              onClick={() => {
                if (availableCategories.length === 0) {
                  toast.info('Todas as categorias já têm orçamento.');
                  return;
                }
                setBudgetModal({ category: availableCategories[0].key, amount: 0 });
              }}
            >
              <Plus size={15} />
              Definir limite
            </button>
          </div>

          <MonthSelector year={year} month={month} onMonthChange={(y, m) => { setYear(y); setMonth(m); }} />

          {budgets.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💸</div>
              <p>Nenhum orçamento definido</p>
              <small>Defina um limite mensal por categoria e acompanhe o progresso</small>
            </div>
          ) : (
            <div className="budget-list">
              {budgets.map((budget) => {
                const spent = spentByCategory.get(budget.category) ?? 0;
                const pct = Math.min((spent / budget.amount) * 100, 100);
                const status = spent > budget.amount ? 'over' : pct >= 80 ? 'warning' : 'ok';
                return (
                  <div key={budget.id} className={`budget-card ${status}`}>
                    <div className="budget-card-top">
                      <span className="budget-category">
                        <span aria-hidden="true">{categories.emoji(budget.category)}</span>
                        {categories.label(budget.category)}
                      </span>
                      <div className="budget-actions">
                        {status === 'over' && (
                          <span className="budget-status-badge over">
                            <AlertTriangle size={12} />
                            Estourou
                          </span>
                        )}
                        {status === 'warning' && (
                          <span className="budget-status-badge warning">
                            <AlertTriangle size={12} />
                            Quase lá
                          </span>
                        )}
                        <button
                          type="button"
                          className="icon-button"
                          onClick={() => setBudgetModal({ category: budget.category, amount: budget.amount })}
                          aria-label={`Editar orçamento de ${categories.label(budget.category)}`}
                        >
                          <Wallet size={15} />
                        </button>
                        <button
                          type="button"
                          className="icon-button danger"
                          onClick={() => setConfirmDelete({ kind: 'budget', item: budget })}
                          aria-label={`Remover orçamento de ${categories.label(budget.category)}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                    <div className="budget-progress">
                      <div
                        className="budget-progress-fill"
                        style={{
                          width: `${pct}%`,
                          backgroundColor:
                            status === 'over' ? 'var(--expense)' : status === 'warning' ? 'var(--warning)' : categories.color(budget.category),
                        }}
                      />
                    </div>
                    <div className="budget-card-bottom">
                      <span>
                        {money(spent)} de {money(budget.amount)}
                      </span>
                      <span className={status === 'over' ? 'expense' : ''}>
                        {spent > budget.amount
                          ? `${money(spent - budget.amount)} acima`
                          : `${money(budget.amount - spent)} disponíveis`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ============ METAS ============ */}
        <section className="planning-section">
          <div className="planning-section-header">
            <div className="planning-section-title">
              <Target size={18} />
              <h3>Metas de vocês</h3>
            </div>
            <button
              type="button"
              className="button button-outline button-small"
              onClick={() => setGoalModal({ emoji: '🎯' })}
            >
              <Plus size={15} />
              Nova meta
            </button>
          </div>

          {goals.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🎯</div>
              <p>Nenhuma meta criada</p>
              <small>Viagem, casa nova, reserva de emergência… sonhem juntos!</small>
            </div>
          ) : (
            <div className="goals-grid">
              {goals.map((goal) => {
                const pct = Math.min((goal.savedAmount / goal.targetAmount) * 100, 100);
                const done = goal.savedAmount >= goal.targetAmount;
                return (
                  <div key={goal.id} className={`goal-card ${done ? 'done' : ''}`}>
                    <div className="goal-card-top">
                      <span className="goal-emoji" aria-hidden="true">{goal.emoji}</span>
                      <div className="goal-info">
                        <strong className="goal-name">{goal.name}</strong>
                        {goal.targetDate && (
                          <span className="goal-date">
                            <CalendarDays size={12} />
                            até {formatDate(goal.targetDate)}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        className="icon-button danger"
                        onClick={() => setConfirmDelete({ kind: 'goal', item: goal })}
                        aria-label={`Remover meta ${goal.name}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div className="goal-progress">
                      <div className="goal-progress-fill" style={{ width: `${pct}%` }} />
                    </div>

                    <div className="goal-card-bottom">
                      <span className="goal-amounts">
                        <strong>{money(goal.savedAmount)}</strong> de {money(goal.targetAmount)}
                      </span>
                      <span className="goal-pct">{pct.toFixed(0)}%</span>
                    </div>

                    {done ? (
                      <div className="goal-done-banner">
                        <CheckCircle2 size={16} />
                        Meta alcançada! 🎉
                      </div>
                    ) : (
                      <div className="goal-actions">
                        <button
                          type="button"
                          className="button button-primary button-small"
                          onClick={() => setContributeModal({ goal, amount: 0 })}
                        >
                          <PiggyBank size={15} />
                          Guardar dinheiro
                        </button>
                        <button
                          type="button"
                          className="button button-ghost button-small"
                          onClick={() => setGoalModal({ ...goal })}
                        >
                          Editar
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* ---------- Modal: orçamento ---------- */}
      {budgetModal && (
        <Modal
          isOpen
          onClose={() => setBudgetModal(null)}
          title={budgetedKeys.has(budgetModal.category) ? 'Editar orçamento' : 'Novo orçamento'}
        >
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="budget-category" className="form-label">Categoria</label>
              <select
                id="budget-category"
                className="form-select"
                value={budgetModal.category}
                onChange={(e) => setBudgetModal({ ...budgetModal, category: e.target.value })}
                disabled={budgetedKeys.has(budgetModal.category)}
              >
                {(budgetedKeys.has(budgetModal.category)
                  ? categories.expenseOptions
                  : availableCategories
                ).map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.emoji} {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="budget-amount" className="form-label">Limite mensal</label>
              <CurrencyInput
                id="budget-amount"
                value={budgetModal.amount}
                onChange={(amount) => setBudgetModal({ ...budgetModal, amount })}
                autoFocus
              />
            </div>
            <div className="modal-actions">
              <button type="button" className="button button-primary button-large" onClick={handleSaveBudget}>
                Salvar
              </button>
              <button type="button" className="button button-outline button-large" onClick={() => setBudgetModal(null)}>
                Cancelar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ---------- Modal: meta ---------- */}
      {goalModal && (
        <Modal isOpen onClose={() => setGoalModal(null)} title={goalModal.id ? 'Editar meta' : 'Nova meta'}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Ícone</label>
              <div className="emoji-selector">
                {GOAL_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className={`emoji-option ${goalModal.emoji === emoji ? 'active' : ''}`}
                    onClick={() => setGoalModal({ ...goalModal, emoji })}
                    aria-pressed={goalModal.emoji === emoji}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="goal-name" className="form-label">Nome da meta *</label>
              <input
                id="goal-name"
                type="text"
                className="form-input"
                placeholder="Ex: Viagem para a praia"
                maxLength={60}
                value={goalModal.name ?? ''}
                onChange={(e) => setGoalModal({ ...goalModal, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="goal-target" className="form-label">Quanto custa? *</label>
              <CurrencyInput
                id="goal-target"
                value={goalModal.targetAmount ?? 0}
                onChange={(targetAmount) => setGoalModal({ ...goalModal, targetAmount })}
              />
            </div>
            {!goalModal.id && (
              <div className="form-group">
                <label htmlFor="goal-saved" className="form-label">Já guardamos (opcional)</label>
                <CurrencyInput
                  id="goal-saved"
                  value={goalModal.savedAmount ?? 0}
                  onChange={(savedAmount) => setGoalModal({ ...goalModal, savedAmount })}
                />
              </div>
            )}
            <div className="form-group">
              <label htmlFor="goal-date" className="form-label">Prazo (opcional)</label>
              <input
                id="goal-date"
                type="date"
                className="form-input"
                value={goalModal.targetDate ?? ''}
                onChange={(e) => setGoalModal({ ...goalModal, targetDate: e.target.value })}
              />
            </div>
            <div className="modal-actions">
              <button type="button" className="button button-primary button-large" onClick={handleSaveGoal}>
                Salvar meta
              </button>
              <button type="button" className="button button-outline button-large" onClick={() => setGoalModal(null)}>
                Cancelar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ---------- Modal: guardar dinheiro ---------- */}
      {contributeModal && (
        <Modal
          isOpen
          onClose={() => setContributeModal(null)}
          title={`Guardar para "${contributeModal.goal.name}"`}
        >
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="contribute-amount" className="form-label">Quanto vão guardar?</label>
              <CurrencyInput
                id="contribute-amount"
                value={contributeModal.amount}
                onChange={(amount) => setContributeModal({ ...contributeModal, amount })}
                autoFocus
              />
              <p className="form-hint">
                Faltam {money(Math.max(contributeModal.goal.targetAmount - contributeModal.goal.savedAmount, 0))}{' '}
                para alcançar a meta.
              </p>
            </div>
            <div className="modal-actions">
              <button type="button" className="button button-primary button-large" onClick={handleContribute}>
                <PiggyBank size={16} />
                Guardar
              </button>
              <button type="button" className="button button-outline button-large" onClick={() => setContributeModal(null)}>
                Cancelar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ---------- Modal: confirmar exclusão ---------- */}
      {confirmDelete && (
        <Modal isOpen onClose={() => setConfirmDelete(null)} title="Confirmar remoção" className="delete-modal">
          <div className="modal-body">
            <p>
              {confirmDelete.kind === 'budget' ? (
                <>Remover o orçamento de <strong>{categories.label(confirmDelete.item.category)}</strong>?</>
              ) : (
                <>Remover a meta <strong>{confirmDelete.item.name}</strong>? O valor guardado é apenas um registro — nada some da conta de vocês.</>
              )}
            </p>
            <div className="delete-modal-actions">
              <button type="button" className="button button-danger" onClick={handleConfirmDelete}>
                Remover
              </button>
              <button type="button" className="button button-ghost" onClick={() => setConfirmDelete(null)}>
                Cancelar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
