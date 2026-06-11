import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Lock, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { validatePassword } from '../utils/validation';

/**
 * Página aberta pelo link de recuperação enviado por e-mail.
 * O Supabase autentica pelo token da URL; aqui o usuário define a nova senha.
 */
export const ResetPassword: React.FC = () => {
  const { user, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (password !== confirm) {
      setError('As senhas não conferem.');
      return;
    }

    setLoading(true);
    const { error } = await updatePassword(password);
    setLoading(false);
    if (error) setError(error);
    else setDone(true);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <Heart size={32} className="login-brand-icon" />
          <h1>Nova senha</h1>
          <p>Escolha uma senha forte para vocês</p>
        </div>

        {!user ? (
          <div className="login-success">
            <p>
              Link inválido ou expirado. Solicite um novo link de recuperação na
              tela de login.
            </p>
            <button className="button button-outline" onClick={() => navigate('/')}>
              Ir para o login
            </button>
          </div>
        ) : done ? (
          <div className="login-success">
            <Check size={32} className="login-success-icon" />
            <p>Senha alterada com sucesso!</p>
            <button className="button button-primary" onClick={() => navigate('/')}>
              Ir para o app
            </button>
          </div>
        ) : (
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="new-password" className="form-label">
                <Lock size={15} />
                Nova senha
              </label>
              <input
                id="new-password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                autoFocus
              />
              <p className="form-hint">Mínimo de 8 caracteres, com letras e números.</p>
            </div>

            <div className="form-group">
              <label htmlFor="confirm-password" className="form-label">
                <Lock size={15} />
                Confirmar senha
              </label>
              <input
                id="confirm-password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>

            {error && <p className="login-error">{error}</p>}

            <button type="submit" className="button button-primary button-large" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar nova senha'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
