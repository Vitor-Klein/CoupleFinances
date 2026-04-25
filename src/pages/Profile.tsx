import React, { useState } from 'react';
import { User, DollarSign, Edit3, Check, Heart, TrendingUp } from 'lucide-react';
import { useFinances } from '../context/FinancesContext';
import { formatCurrency } from '../utils/formatters';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export const Profile: React.FC = () => {
  const { coupleProfile, updateCoupleProfile } = useFinances();
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ ...coupleProfile });

  const totalSalary = coupleProfile.person1Salary + coupleProfile.person2Salary;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.person1Name.trim() || !form.person2Name.trim()) {
      alert('Os nomes não podem estar vazios');
      return;
    }
    updateCoupleProfile({
      ...form,
      person1Salary: Math.max(0, form.person1Salary),
      person2Salary: Math.max(0, form.person2Salary),
    });
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleCancel = () => {
    setForm({ ...coupleProfile });
    setEditing(false);
  };

  const person1Percent =
    totalSalary > 0 ? Math.round((coupleProfile.person1Salary / totalSalary) * 100) : 50;
  const person2Percent = totalSalary > 0 ? 100 - person1Percent : 50;

  return (
    <div className="page profile-page">
      <div className="profile-header">
        <div className="profile-header-content">
          <div className="profile-header-icon">
            <Heart size={28} />
          </div>
          <div>
            <h1 className="profile-header-title">Perfil do Casal</h1>
            <p className="profile-header-subtitle">Gerencie os dados de vocês dois</p>
          </div>
        </div>
      </div>

      <div className="page-content">
        {saved && (
          <div className="profile-saved-toast">
            <Check size={16} />
            Perfil salvo com sucesso!
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
                  <span className="profile-person-role">Pessoa 1</span>
                </div>
                <div className="profile-person-salary">
                  <span className="profile-salary-label">Salário mensal</span>
                  <span className="profile-salary-value">
                    {coupleProfile.person1Salary > 0
                      ? formatCurrency(coupleProfile.person1Salary)
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
                  <span className="profile-person-role">Pessoa 2</span>
                </div>
                <div className="profile-person-salary">
                  <span className="profile-salary-label">Salário mensal</span>
                  <span className="profile-salary-value">
                    {coupleProfile.person2Salary > 0
                      ? formatCurrency(coupleProfile.person2Salary)
                      : 'Não definido'}
                  </span>
                </div>
              </div>
            </div>

            {/* Combined Income */}
            {totalSalary > 0 && (
              <div className="profile-combined-income">
                <div className="profile-combined-header">
                  <TrendingUp size={20} />
                  <span>Renda familiar mensal</span>
                </div>
                <div className="profile-combined-amount">{formatCurrency(totalSalary)}</div>
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
            )}

            {/* Info Box */}
            <div className="profile-info-box">
              <DollarSign size={20} />
              <p>
                Os salários cadastrados aqui aparecem automaticamente como receita todo mês em todas
                as telas, sem precisar lançar manualmente.
              </p>
            </div>

            <button className="button button-primary button-large" onClick={() => setEditing(true)}>
              <Edit3 size={18} />
              Editar Perfil
            </button>
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
                  Salário mensal líquido (R$)
                </label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="0,00"
                  step="0.01"
                  min="0"
                  value={form.person1Salary || ''}
                  onChange={(e) =>
                    setForm({ ...form, person1Salary: parseFloat(e.target.value) || 0 })
                  }
                />
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
                  Salário mensal líquido (R$)
                </label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="0,00"
                  step="0.01"
                  min="0"
                  value={form.person2Salary || ''}
                  onChange={(e) =>
                    setForm({ ...form, person2Salary: parseFloat(e.target.value) || 0 })
                  }
                />
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
    </div>
  );
};
