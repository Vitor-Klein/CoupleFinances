import React, { useState } from 'react';
import { Heart, Mail, Lock, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [signUpDone, setSignUpDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (isSignUp) {
      const { error } = await signUp(email, password);
      if (error) {
        setError(error);
      } else {
        setSignUpDone(true);
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) setError('E-mail ou senha incorretos.');
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
            <button className="button button-outline" onClick={() => { setIsSignUp(false); setSignUpDone(false); }}>
              Ir para o login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <Heart size={32} className="login-brand-icon" />
          <h1>Couple Finances</h1>
          <p>Finanças do casal, juntos</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              <Mail size={15} />
              E-mail
            </label>
            <input
              type="email"
              className="form-input"
              placeholder="vocês@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <Lock size={15} />
              Senha
            </label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
            />
          </div>

          {error && <p className="login-error">{error}</p>}

          <button
            type="submit"
            className="button button-primary button-large"
            disabled={loading}
          >
            {loading ? (
              'Aguarde...'
            ) : isSignUp ? (
              <><UserPlus size={18} /> Criar conta</>
            ) : (
              <><LogIn size={18} /> Entrar</>
            )}
          </button>
        </form>

        <button
          className="login-toggle"
          onClick={() => { setIsSignUp((v) => !v); setError(null); }}
        >
          {isSignUp
            ? 'Já tem conta? Entrar'
            : 'Primeiro acesso? Criar conta'}
        </button>
      </div>
    </div>
  );
};
