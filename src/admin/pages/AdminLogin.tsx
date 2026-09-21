import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/api/client';
import type { UserRole } from '@/types/enums';
import '@/admin/adminTheme.scss';
import '@/admin/pages/adminLogin.scss';

const ADMIN_ROLES: UserRole[] = ['ADMIN', 'SUPPORT'];

function AdminLogin() {
  const { login, logout, isAuthenticated, session } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated && session && ADMIN_ROLES.includes(session.role)) {
    return <Navigate to="/admin" replace />;
  }

  const handleChange = (field: keyof typeof form) => (event: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const next = await login(form);
      if (!ADMIN_ROLES.includes(next.role)) {
        logout();
        setError("This account doesn't have Admin Console access.");
        return;
      }
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin admin-login">
      <div className="admin-login__card">
        <h1>HayShen Admin Console</h1>
        <p className="admin-login__subtitle">Sign in with an ADMIN or SUPPORT account.</p>

        {error && <div className="form-error">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="admin-email">Email</label>
            <input
              id="admin-email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={handleChange('email')}
            />
          </div>

          <div className="field">
            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              value={form.password}
              onChange={handleChange('password')}
            />
          </div>

          <button className="btn btn--primary admin-login__submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;
