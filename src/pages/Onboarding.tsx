import React, { useState } from 'react';
import { Heart, Sparkles, KeyRound, ArrowRight, LogOut } from 'lucide-react';
import { useCouple } from '../context/CoupleContext';
import { useAuth } from '../context/AuthContext';

/**
 * Primeira tela após criar a conta: criar o espaço do casal
 * ou entrar em um espaço existente com o código de convite.
 */
export const Onboarding: React.FC = () => {
  const { createCouple, joinCouple } = useCouple();
  const { signOut } = useAuth();
  const [mode, setMode] = useState<'choice' | 'join'>('choice');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setError(null);
    setLoading(true);
    const err = await createCouple();
    if (err) setError(err);
    setLoading(false);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setError(null);
    setLoading(true);
    const err = await joinCouple(code);
    if (err) setError(err);
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-card onboarding-card">
        <div className="login-brand">
          <Heart size={32} className="login-brand-icon" />
          <h1>Quase lá!</h1>
          <p>Como vocês querem começar?</p>
        </div>

        {mode === 'choice' ? (
          <div className="onboarding-options">
            <button
              type="button"
              className="onboarding-option"
              onClick={handleCreate}
              disabled={loading}
            >
              <span className="onboarding-option-icon create">
                <Sparkles size={22} />
              </span>
              <span className="onboarding-option-text">
                <strong>Criar nosso espaço</strong>
                <span>Comece agora e convide seu amor depois com um código</span>
              </span>
              <ArrowRight size={18} className="onboarding-option-arrow" />
            </button>

            <button
              type="button"
              className="onboarding-option"
              onClick={() => { setMode('join'); setError(null); }}
              disabled={loading}
            >
              <span className="onboarding-option-icon join">
                <KeyRound size={22} />
              </span>
              <span className="onboarding-option-text">
                <strong>Tenho um código de convite</strong>
                <span>Entre no espaço que seu amor já criou</span>
              </span>
              <ArrowRight size={18} className="onboarding-option-arrow" />
            </button>
          </div>
        ) : (
          <form className="login-form" onSubmit={handleJoin}>
            <div className="form-group">
              <label htmlFor="invite-code" className="form-label">
                <KeyRound size={15} />
                Código de convite
              </label>
              <input
                id="invite-code"
                type="text"
                className="form-input invite-code-input"
                placeholder="EX: A1B2C3D4"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={8}
                autoFocus
                autoComplete="off"
              />
              <p className="form-hint">
                O código aparece na aba Perfil de quem criou o espaço.
              </p>
            </div>

            <button
              type="submit"
              className="button button-primary button-large"
              disabled={loading || code.trim().length < 4}
            >
              {loading ? 'Entrando...' : 'Entrar no espaço'}
            </button>
            <button
              type="button"
              className="button button-ghost"
              onClick={() => { setMode('choice'); setError(null); }}
            >
              Voltar
            </button>
          </form>
        )}

        {error && <p className="login-error">{error}</p>}

        <button type="button" className="login-toggle onboarding-signout" onClick={signOut}>
          <LogOut size={14} />
          Sair da conta
        </button>
      </div>
    </div>
  );
};
