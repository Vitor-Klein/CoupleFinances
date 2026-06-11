import React, { useState } from 'react';
import {
  User,
  DollarSign,
  Edit3,
  Check,
  Heart,
  TrendingUp,
  Moon,
  Sun,
  PiggyBank,
  Copy,
  RefreshCw,
  KeyRound,
  Mail,
  LogOut,
  Trash2,
  Tags,
  Plus,
  ShieldAlert,
} from 'lucide-react';
import { useFinances } from '../context/FinancesContext';
import { useCouple } from '../context/CoupleContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { usePrivacy } from '../context/PrivacyContext';
import { Modal } from '../components/Modal';
import { CurrencyInput } from '../components/CurrencyInput';
import { CUSTOM_CATEGORY_COLORS } from '../constants/categories';
import { validatePassword } from '../utils/validation';
import type { TransactionType } from '../types';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const CATEGORY_EMOJI_OPTIONS = ['🏷️', '🐶', '💅', '🎁', '⚽', '🧸', '🍕', '✈️', '📱', '🏋️', '🎵', '🧾'];

export const Profile: React.FC = () => {
  const { coupleProfile, updateCoupleProfile, getReserveTotals, customCategories, addCustomCategory, deleteCustomCategory } =
    useFinances();
  const { couple, myPerson, partnerLinked, regenerateInviteCode } = useCouple();
  const { user, signOut, updatePassword, updateEmail, deleteAccount } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { money } = usePrivacy();
  const toast = useToast();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...coupleProfile });
  const isDark = theme === 'dark';

  const [categoryModal, setCategoryModal] = useState<{
    label: string;
    emoji: string;
    color: string;
    type: TransactionType;
  } | null>(null);

  const [passwordModal, setPasswordModal] = useState<{ password: string; confirm: string } | null>(null);
  const [emailModal, setEmailModal] = useState<{ email: string } | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ confirmText: string } | null>(null);
  const [accountBusy, setAccountBusy] = useState(false);

  const totalSalary = coupleProfile.person1Salary + coupleProfile.person2Salary;
  const reserves = getReserveTotals();

  // ---------- Perfil ----------
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.person1Name.trim() || !form.person2Name.trim()) {
      toast.error('Os nomes não podem estar vazios.');
      return;
    }
    for (const value of [form.person1Salary, form.person2Salary, form.person1Reserve, form.person2Reserve]) {
      if (value < 0 || !Number.isFinite(value)) {
        toast.error('Os valores não podem ser negativos.');
        return;
      }
    }
    updateCoupleProfile({
      ...form,
      person1Name: form.person1Name.trim(),
      person2Name: form.person2Name.trim(),
    });
    setEditing(false);
    toast.success('Perfil salvo com sucesso!');
  };

  const handleCancel = () => {
    setForm({ ...coupleProfile });
    setEditing(false);
  };

  // ---------- Convite ----------
  const handleCopyCode = async () => {
    if (!couple) return;
    try {
      await navigator.clipboard.writeText(couple.inviteCode);
      toast.success('Código copiado! Envie para seu amor 💜');
    } catch {
      toast.error('Não foi possível copiar. Anote o código manualmente.');
    }
  };

  const handleRegenerateCode = async () => {
    const code = await regenerateInviteCode();
    if (code) toast.success('Novo código gerado — o anterior foi invalidado.');
    else toast.error('Não foi possível gerar um novo código.');
  };

  // ---------- Categorias ----------
  const handleSaveCategory = () => {
    if (!categoryModal) return;
    const label = categoryModal.label.trim();
    if (!label) {
      toast.error('Dê um nome para a categoria.');
      return;
    }
    addCustomCategory({
      label,
      emoji: categoryModal.emoji,
      color: categoryModal.color,
      type: categoryModal.type,
    });
    setCategoryModal(null);
    toast.success(`Categoria "${label}" criada`);
  };

  // ---------- Conta ----------
  const handleChangePassword = async () => {
    if (!passwordModal) return;
    const err = validatePassword(passwordModal.password);
    if (err) {
      toast.error(err);
      return;
    }
    if (passwordModal.password !== passwordModal.confirm) {
      toast.error('As senhas não conferem.');
      return;
    }
    setAccountBusy(true);
    const { error } = await updatePassword(passwordModal.password);
    setAccountBusy(false);
    if (error) toast.error(error);
    else {
      toast.success('Senha alterada com sucesso!');
      setPasswordModal(null);
    }
  };

  const handleChangeEmail = async () => {
    if (!emailModal) return;
    if (!/^\S+@\S+\.\S+$/.test(emailModal.email)) {
      toast.error('Informe um e-mail válido.');
      return;
    }
    setAccountBusy(true);
    const { error } = await updateEmail(emailModal.email);
    setAccountBusy(false);
    if (error) toast.error(error);
    else {
      toast.success('Confirme a alteração no link enviado para o novo e-mail.');
      setEmailModal(null);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteModal || deleteModal.confirmText !== 'EXCLUIR') return;
    setAccountBusy(true);
    const { error } = await deleteAccount();
    setAccountBusy(false);
    if (error) toast.error(error);
    // sucesso: o signOut interno redireciona para o login
  };

  const myName = myPerson === 'person1' ? coupleProfile.person1Name : coupleProfile.person2Name;

  return (
    <div className="page profile-page">
      <div className="profile-header">
        <div className="profile-header-content">
          <div className="profile-header-icon">
            <Heart size={28} />
          </div>
          <div>
            <h1 className="profile-header-title">Perfil do Casal</h1>
            <p className="profile-header-subtitle">
              {user?.email ? `Conectado como ${myName} (${user.email})` : 'Gerencie os dados de vocês dois'}
            </p>
          </div>
        </div>
      </div>

      <div className="page-content">
        {/* ============ CONVITE DO PARCEIRO ============ */}
        {couple && (
          <div className={`invite-card ${partnerLinked ? 'linked' : ''}`}>
            {partnerLinked ? (
              <div className="invite-linked">
                <Heart size={18} fill="currentColor" />
                <p>
                  <strong>Contas conectadas!</strong> Vocês dois veem e editam os mesmos dados,
                  em tempo real.
                </p>
              </div>
            ) : (
              <>
                <div className="invite-card-header">
                  <KeyRound size={18} />
                  <h3>Convide seu amor</h3>
                </div>
                <p className="invite-card-text">
                  Seu(sua) parceiro(a) cria a própria conta, escolhe{' '}
                  <strong>"Tenho um código de convite"</strong> e digita:
                </p>
                <div className="invite-code-row">
                  <code className="invite-code">{couple.inviteCode}</code>
                  <button type="button" className="icon-button" onClick={handleCopyCode} aria-label="Copiar código">
                    <Copy size={16} />
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    onClick={handleRegenerateCode}
                    aria-label="Gerar novo código"
                    title="Gerar novo código (invalida o atual)"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {!editing ? (
          <>
            {/* Person Cards */}
            <div className="profile-person-cards">
              <div className="profile-person-card person1">
                <div className="profile-avatar person1-avatar">
                  {getInitials(coupleProfile.person1Name)}
                </div>
                <div className="profile-person-info">
                  <span className="profile-person-name">{coupleProfile.person1Name}</span>
                  <span className="profile-person-role">
                    Pessoa 1 {myPerson === 'person1' && '· você'}
                  </span>
                </div>
                <div className="profile-person-salary">
                  <span className="profile-salary-label">Salário mensal</span>
                  <span className="profile-salary-value">
                    {coupleProfile.person1Salary > 0
                      ? money(coupleProfile.person1Salary)
                      : 'Não definido'}
                  </span>
                </div>
              </div>

              <div className="profile-person-card person2">
                <div className="profile-avatar person2-avatar">
                  {getInitials(coupleProfile.person2Name)}
                </div>
                <div className="profile-person-info">
                  <span className="profile-person-name">{coupleProfile.person2Name}</span>
                  <span className="profile-person-role">
                    Pessoa 2 {myPerson === 'person2' && '· você'}
                  </span>
                </div>
                <div className="profile-person-salary">
                  <span className="profile-salary-label">Salário mensal</span>
                  <span className="profile-salary-value">
                    {coupleProfile.person2Salary > 0
                      ? money(coupleProfile.person2Salary)
                      : 'Não definido'}
                  </span>
                </div>
              </div>
            </div>

            {/* Reserve / Poupança */}
            <div className="profile-reserve-card">
              <div className="profile-reserve-header">
                <PiggyBank size={20} />
                <span>Reserva acumulada</span>
              </div>
              <div className="profile-reserve-total">{money(reserves.total)}</div>
              <div className="profile-reserve-split">
                <div className="profile-reserve-person person1">
                  <span className="profile-reserve-name">{coupleProfile.person1Name}</span>
                  <span className="profile-reserve-value">{money(reserves.person1)}</span>
                </div>
                <div className="profile-reserve-person person2">
                  <span className="profile-reserve-name">{coupleProfile.person2Name}</span>
                  <span className="profile-reserve-value">{money(reserves.person2)}</span>
                </div>
              </div>
              <p className="profile-reserve-hint">
                Toda transação com categoria <strong>Poupança</strong> é somada à reserva da pessoa
                correspondente.
              </p>
            </div>

            {/* Combined Income */}
            {totalSalary > 0 && (() => {
              const person1Percent = Math.round((coupleProfile.person1Salary / totalSalary) * 100);
              const person2Percent = 100 - person1Percent;
              return (
                <div className="profile-combined-income">
                  <div className="profile-combined-header">
                    <TrendingUp size={20} />
                    <span>Renda familiar mensal</span>
                  </div>
                  <div className="profile-combined-amount">{money(totalSalary)}</div>
                  <div className="profile-income-bar">
                    <div
                      className="profile-income-bar-person1"
                      style={{ width: `${person1Percent}%` }}
                      title={`${coupleProfile.person1Name}: ${person1Percent}%`}
                    />
                    <div
                      className="profile-income-bar-person2"
                      style={{ width: `${person2Percent}%` }}
                      title={`${coupleProfile.person2Name}: ${person2Percent}%`}
                    />
                  </div>
                  <div className="profile-income-legend">
                    <span>
                      <span className="legend-dot legend-dot-1" />
                      {coupleProfile.person1Name} ({person1Percent}%)
                    </span>
                    <span>
                      <span className="legend-dot legend-dot-2" />
                      {coupleProfile.person2Name} ({person2Percent}%)
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Info Box */}
            <div className="profile-info-box">
              <DollarSign size={20} />
              <p>
                Os salários cadastrados aqui aparecem automaticamente como receita todo mês em todas
                as telas, sem precisar lançar manualmente.
              </p>
            </div>

            <button className="button button-primary button-large" onClick={() => { setForm({ ...coupleProfile }); setEditing(true); }}>
              <Edit3 size={18} />
              Editar Perfil
            </button>

            {/* ============ CATEGORIAS CUSTOMIZADAS ============ */}
            <section className="profile-section">
              <div className="planning-section-header">
                <div className="planning-section-title">
                  <Tags size={18} />
                  <h3>Categorias personalizadas</h3>
                </div>
                <button
                  type="button"
                  className="button button-outline button-small"
                  onClick={() =>
                    setCategoryModal({ label: '', emoji: '🏷️', color: CUSTOM_CATEGORY_COLORS[0], type: 'expense' })
                  }
                >
                  <Plus size={15} />
                  Nova
                </button>
              </div>

              {customCategories.length === 0 ? (
                <p className="profile-section-empty">
                  Crie categorias do jeito de vocês — pet, beleza, academia…
                </p>
              ) : (
                <div className="custom-category-list">
                  {customCategories.map((cat) => (
                    <div key={cat.id} className="custom-category-item">
                      <span className="custom-category-dot" style={{ backgroundColor: cat.color }} />
                      <span className="custom-category-emoji" aria-hidden="true">{cat.emoji}</span>
                      <span className="custom-category-label">{cat.label}</span>
                      <span className={`custom-category-type ${cat.type}`}>
                        {cat.type === 'income' ? 'Receita' : 'Despesa'}
                      </span>
                      <button
                        type="button"
                        className="icon-button danger"
                        onClick={() => {
                          deleteCustomCategory(cat.id);
                          toast.success(`Categoria "${cat.label}" removida`);
                        }}
                        aria-label={`Remover categoria ${cat.label}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ============ APARÊNCIA ============ */}
            <button
              type="button"
              className="theme-toggle"
              onClick={toggleTheme}
              aria-pressed={isDark}
              aria-label="Alternar tema escuro"
            >
              <span className="theme-toggle-icon">
                {isDark ? <Moon size={18} /> : <Sun size={18} />}
              </span>
              <span className="theme-toggle-text">
                <span className="theme-toggle-label">
                  {isDark ? 'Modo escuro' : 'Modo claro'}
                </span>
                <span className="theme-toggle-hint">
                  {isDark
                    ? 'Toque para voltar ao tema claro'
                    : 'Toque para ativar o tema escuro'}
                </span>
              </span>
              <span className="theme-switch" aria-hidden="true">
                <span className="theme-switch-thumb" />
              </span>
            </button>

            {/* ============ CONTA ============ */}
            <section className="profile-section account-section">
              <div className="planning-section-title">
                <User size={18} />
                <h3>Minha conta</h3>
              </div>
              <div className="account-actions">
                <button
                  type="button"
                  className="account-action"
                  onClick={() => setEmailModal({ email: '' })}
                >
                  <Mail size={16} />
                  <span>Trocar e-mail</span>
                </button>
                <button
                  type="button"
                  className="account-action"
                  onClick={() => setPasswordModal({ password: '', confirm: '' })}
                >
                  <KeyRound size={16} />
                  <span>Trocar senha</span>
                </button>
                <button type="button" className="account-action" onClick={signOut}>
                  <LogOut size={16} />
                  <span>Sair da conta</span>
                </button>
                <button
                  type="button"
                  className="account-action danger"
                  onClick={() => setDeleteModal({ confirmText: '' })}
                >
                  <Trash2 size={16} />
                  <span>Excluir minha conta</span>
                </button>
              </div>
            </section>
          </>
        ) : (
          <form className="profile-edit-form" onSubmit={handleSave}>
            <div className="profile-edit-section">
              <div className="profile-edit-section-header">
                <div className="profile-avatar person1-avatar profile-avatar-sm">
                  {getInitials(form.person1Name || 'P1')}
                </div>
                <h3>Pessoa 1</h3>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <User size={15} />
                  Nome
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Seu nome"
                  value={form.person1Name}
                  onChange={(e) => setForm({ ...form, person1Name: e.target.value })}
                  maxLength={30}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <DollarSign size={15} />
                  Salário mensal líquido
                </label>
                <CurrencyInput
                  value={form.person1Salary}
                  onChange={(person1Salary) => setForm({ ...form, person1Salary })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <PiggyBank size={15} />
                  Reserva inicial
                </label>
                <CurrencyInput
                  value={form.person1Reserve}
                  onChange={(person1Reserve) => setForm({ ...form, person1Reserve })}
                />
                <p className="form-hint">
                  Valor base — lançamentos de Poupança são somados a este saldo.
                </p>
              </div>
            </div>

            <div className="profile-edit-divider">
              <Heart size={16} />
            </div>

            <div className="profile-edit-section">
              <div className="profile-edit-section-header">
                <div className="profile-avatar person2-avatar profile-avatar-sm">
                  {getInitials(form.person2Name || 'P2')}
                </div>
                <h3>Pessoa 2</h3>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <User size={15} />
                  Nome
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nome do(a) parceiro(a)"
                  value={form.person2Name}
                  onChange={(e) => setForm({ ...form, person2Name: e.target.value })}
                  maxLength={30}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <DollarSign size={15} />
                  Salário mensal líquido
                </label>
                <CurrencyInput
                  value={form.person2Salary}
                  onChange={(person2Salary) => setForm({ ...form, person2Salary })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <PiggyBank size={15} />
                  Reserva inicial
                </label>
                <CurrencyInput
                  value={form.person2Reserve}
                  onChange={(person2Reserve) => setForm({ ...form, person2Reserve })}
                />
                <p className="form-hint">
                  Valor base — lançamentos de Poupança são somados a este saldo.
                </p>
              </div>
            </div>

            <div className="profile-edit-actions">
              <button type="submit" className="button button-primary button-large">
                <Check size={18} />
                Salvar Perfil
              </button>
              <button
                type="button"
                className="button button-outline button-large"
                onClick={handleCancel}
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ---------- Modal: nova categoria ---------- */}
      {categoryModal && (
        <Modal isOpen onClose={() => setCategoryModal(null)} title="Nova categoria">
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Tipo</label>
              <div className="type-selector">
                <button
                  type="button"
                  className={`type-button income ${categoryModal.type === 'income' ? 'active' : ''}`}
                  onClick={() => setCategoryModal({ ...categoryModal, type: 'income' })}
                >
                  Receita
                </button>
                <button
                  type="button"
                  className={`type-button expense ${categoryModal.type === 'expense' ? 'active' : ''}`}
                  onClick={() => setCategoryModal({ ...categoryModal, type: 'expense' })}
                >
                  Despesa
                </button>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="category-label" className="form-label">Nome *</label>
              <input
                id="category-label"
                type="text"
                className="form-input"
                placeholder="Ex: Pet, Beleza, Academia…"
                maxLength={30}
                value={categoryModal.label}
                onChange={(e) => setCategoryModal({ ...categoryModal, label: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Ícone</label>
              <div className="emoji-selector">
                {CATEGORY_EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className={`emoji-option ${categoryModal.emoji === emoji ? 'active' : ''}`}
                    onClick={() => setCategoryModal({ ...categoryModal, emoji })}
                    aria-pressed={categoryModal.emoji === emoji}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Cor</label>
              <div className="color-selector">
                {CUSTOM_CATEGORY_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`color-option ${categoryModal.color === color ? 'active' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setCategoryModal({ ...categoryModal, color })}
                    aria-label={`Cor ${color}`}
                    aria-pressed={categoryModal.color === color}
                  />
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="button button-primary button-large" onClick={handleSaveCategory}>
                Criar categoria
              </button>
              <button type="button" className="button button-outline button-large" onClick={() => setCategoryModal(null)}>
                Cancelar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ---------- Modal: trocar senha ---------- */}
      {passwordModal && (
        <Modal isOpen onClose={() => setPasswordModal(null)} title="Trocar senha">
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="account-password" className="form-label">Nova senha</label>
              <input
                id="account-password"
                type="password"
                className="form-input"
                autoComplete="new-password"
                minLength={8}
                value={passwordModal.password}
                onChange={(e) => setPasswordModal({ ...passwordModal, password: e.target.value })}
              />
              <p className="form-hint">Mínimo de 8 caracteres, com letras e números.</p>
            </div>
            <div className="form-group">
              <label htmlFor="account-password-confirm" className="form-label">Confirmar senha</label>
              <input
                id="account-password-confirm"
                type="password"
                className="form-input"
                autoComplete="new-password"
                minLength={8}
                value={passwordModal.confirm}
                onChange={(e) => setPasswordModal({ ...passwordModal, confirm: e.target.value })}
              />
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="button button-primary button-large"
                onClick={handleChangePassword}
                disabled={accountBusy}
              >
                {accountBusy ? 'Salvando...' : 'Salvar senha'}
              </button>
              <button type="button" className="button button-outline button-large" onClick={() => setPasswordModal(null)}>
                Cancelar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ---------- Modal: trocar e-mail ---------- */}
      {emailModal && (
        <Modal isOpen onClose={() => setEmailModal(null)} title="Trocar e-mail">
          <div className="modal-body">
            <p className="modal-info">
              E-mail atual: <strong>{user?.email}</strong>
            </p>
            <div className="form-group">
              <label htmlFor="account-email" className="form-label">Novo e-mail</label>
              <input
                id="account-email"
                type="email"
                className="form-input"
                autoComplete="email"
                value={emailModal.email}
                onChange={(e) => setEmailModal({ email: e.target.value })}
              />
              <p className="form-hint">Você receberá um link de confirmação no novo endereço.</p>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="button button-primary button-large"
                onClick={handleChangeEmail}
                disabled={accountBusy}
              >
                {accountBusy ? 'Enviando...' : 'Alterar e-mail'}
              </button>
              <button type="button" className="button button-outline button-large" onClick={() => setEmailModal(null)}>
                Cancelar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ---------- Modal: excluir conta ---------- */}
      {deleteModal && (
        <Modal isOpen onClose={() => setDeleteModal(null)} title="Excluir minha conta" className="delete-modal">
          <div className="modal-body">
            <div className="delete-account-warning">
              <ShieldAlert size={20} />
              <p>
                {partnerLinked ? (
                  <>
                    Sua conta será excluída <strong>permanentemente</strong>. Os dados do casal
                    continuam com {myPerson === 'person1' ? coupleProfile.person2Name : coupleProfile.person1Name}.
                  </>
                ) : (
                  <>
                    Sua conta e <strong>todos os dados do casal</strong> (transações, metas,
                    orçamentos) serão excluídos permanentemente. Não dá para desfazer.
                  </>
                )}
              </p>
            </div>
            <div className="form-group">
              <label htmlFor="delete-confirm" className="form-label">
                Digite <strong>EXCLUIR</strong> para confirmar
              </label>
              <input
                id="delete-confirm"
                type="text"
                className="form-input"
                autoComplete="off"
                value={deleteModal.confirmText}
                onChange={(e) => setDeleteModal({ confirmText: e.target.value.toUpperCase() })}
              />
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="button button-danger button-large"
                onClick={handleDeleteAccount}
                disabled={deleteModal.confirmText !== 'EXCLUIR' || accountBusy}
              >
                {accountBusy ? 'Excluindo...' : 'Excluir definitivamente'}
              </button>
              <button type="button" className="button button-outline button-large" onClick={() => setDeleteModal(null)}>
                Cancelar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
