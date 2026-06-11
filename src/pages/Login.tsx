import React, { useState } from 'react';
import { Heart, Mail, Lock, LogIn, UserPlus, Moon, Sun, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { validatePassword } from '../utils/validation';

type Mode = 'signin' | 'signup' | 'forgot';

export const Login: React.FC = () => {
  const { signIn, signUp, requestPasswordReset } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [signUpDone, setSignUpDone] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setResetSent(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'signup') {
      const passwordError = validatePassword(password);
      if (passwordError) {
        setError(passwordError);
        return;
      }
    }

    setLoading(true);

    if (mode === 'forgot') {
      const { error } = await requestPasswordReset(email);
      if (error) setError(error);
      else setResetSent(true);
    } else if (mode === 'signup') {
      const { error } = await signUp(email, password);
      if (error) setError(error);
      else setSignUpDone(true);
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        if (/confirm/i.test(error)) {
          setError(
            'Você precisa confirmar seu e-mail antes de entrar. Confira sua caixa de entrada (e o spam).',
          );
        } else if (/rate limit|too many/i.test(error)) {
          setError('Muitas tentativas. Aguarde um instante e tente de novo.');
        } else {
          setError('E-mail ou senha incorretos.');
        }
      }
    }

    setLoading(false);
  };

  if (signUpDone) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-brand">
            <Heart size={32} className="login-brand-icon" />
            <h1>Couple Finances</h1>
          </div>
          <div className="login-success">
            <p>Conta criada! Verifique seu e-mail para confirmar o cadastro antes de entrar.</p>
            <button className="button button-outline" onClick={() => { switchMode('signin'); setSignUpDone(false); }}>
              Ir para o login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <button
        type="button"
        className="theme-toggle-compact login-theme-toggle"
        onClick={toggleTheme}
        aria-label={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </button>
      <div className="login-card">
        <div className="login-brand">
          <Heart size={32} className="login-brand-icon" />
          <h1>Couple Finances</h1>
          <p>
            {mode === 'forgot'
              ? 'Vamos recuperar seu acesso'
              : 'Finanças do casal, juntos'}
          </p>
        </div>

        {mode === 'forgot' && resetSent ? (
          <div className="login-success">
            <p>
              Se existir uma conta com esse e-mail, você receberá um link para
              redefinir a senha. Confira também a caixa de spam.
            </p>
            <button className="button button-outline" onClick={() => switchMode('signin')}>
              Voltar para o login
            </button>
          </div>
        ) : (
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="login-email" className="form-label">
                <Mail size={15} />
                E-mail
              </label>
              <input
                id="login-email"
                type="email"
                className="form-input"
                placeholder="vocês@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            {mode !== 'forgot' && (
              <div className="form-group">
                <label htmlFor="login-password" className="form-label">
                  <Lock size={15} />
                  Senha
                </label>
                <input
                  id="login-password"
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={mode === 'signup' ? 8 : 6}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                />
                {mode === 'signup' && (
                  <p className="form-hint">Mínimo de 8 caracteres, com letras e números.</p>
                )}
              </div>
            )}

            {error && <p className="login-error">{error}</p>}

            <button
              type="submit"
              className="button button-primary button-large"
              disabled={loading}
            >
              {loading ? (
                'Aguarde...'
              ) : mode === 'forgot' ? (
                <><KeyRound size={18} /> Enviar link de recuperação</>
              ) : mode === 'signup' ? (
                <><UserPlus size={18} /> Criar conta</>
              ) : (
                <><LogIn size={18} /> Entrar</>
              )}
            </button>
          </form>
        )}

        {mode === 'signin' && !resetSent && (
          <button className="login-forgot" onClick={() => switchMode('forgot')}>
            Esqueci minha senha
          </button>
        )}

        {!(mode === 'forgot' && resetSent) && (
          <button
            className="login-toggle"
            onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
          >
            {mode === 'signin'
              ? 'Primeiro acesso? Criar conta'
              : 'Já tem conta? Entrar'}
          </button>
        )}
      </div>
    </div>
  );
};
