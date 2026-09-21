import { useState, type ChangeEvent, type FormEvent } from 'react';
import '@/pages/AuthPages/authPages.scss';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/api/client';

interface LoginProps {
  onSuccess?: () => void;
  onNavigateToRegister?: () => void;
}

function Login({ onSuccess, onNavigateToRegister }: LoginProps) {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: keyof typeof form) => (event: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login(form);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Անհայտ սխալ։ Փորձեք կրկին։');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="authPage" id="login">
      <div className="authPage__card">
        <h1>Մուտք գործել</h1>
        <p className="authPage__subtitle">Մուտք գործեք HayShen հաշիվ՝ պատվերները կառավարելու համար</p>

        {error && <div className="authPage__banner">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="authPage__field">
            <label htmlFor="login-email">Էլ. հասցե</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={handleChange('email')}
            />
          </div>

          <div className="authPage__field">
            <label htmlFor="login-password">Գաղտնաբառ</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={form.password}
              onChange={handleChange('password')}
            />
          </div>

          <button className="authPage__submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Մուտք...' : 'Մուտք գործել'}
          </button>
        </form>

        <p className="authPage__switch">
          Դեռ հաշիվ չունե՞ք{' '}
          <button type="button" onClick={onNavigateToRegister}>
            Գրանցվել
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;
