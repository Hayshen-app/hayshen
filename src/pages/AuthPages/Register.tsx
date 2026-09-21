import { useState, type ChangeEvent, type FormEvent } from 'react';
import '@/pages/AuthPages/authPages.scss';
import { useAuth } from '@/context/AuthContext';
import { ApiError, type FieldErrors } from '@/api/client';

interface RegisterProps {
  onSuccess?: () => void;
  onNavigateToLogin?: () => void;
}

type Role = 'customer' | 'contractor';

const initialForm = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  companyName: '',
  businessType: '',
  city: '',
};

function Register({ onSuccess, onNavigateToLogin }: RegisterProps) {
  const { registerCustomer, registerContractor } = useAuth();
  const [role, setRole] = useState<Role>('customer');
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: keyof typeof form) => (event: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setFieldErrors({});
    setIsSubmitting(true);
    try {
      if (role === 'customer') {
        await registerCustomer(form);
      } else {
        await registerContractor(form);
      }
      onSuccess?.();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setFieldErrors(err.fieldErrors || {});
      } else {
        setError('Անհայտ սխալ։ Փորձեք կրկին։');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="authPage" id="register">
      <div className="authPage__card">
        <h1>Ստեղծել հաշիվ</h1>
        <p className="authPage__subtitle">Գրանցվեք որպես պատվիրատու կամ կապալառու</p>

        <div className="authPage__roleTabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={role === 'customer'}
            className={`authPage__roleTab${role === 'customer' ? ' is-active' : ''}`}
            onClick={() => setRole('customer')}
          >
            Պատվիրատու
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={role === 'contractor'}
            className={`authPage__roleTab${role === 'contractor' ? ' is-active' : ''}`}
            onClick={() => setRole('contractor')}
          >
            Կապալառու
          </button>
        </div>

        {error && <div className="authPage__banner">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="authPage__field">
            <label htmlFor="reg-fullName">Անուն Ազգանուն</label>
            <input
              id="reg-fullName"
              required
              value={form.fullName}
              onChange={handleChange('fullName')}
            />
            {fieldErrors.fullName && (
              <span className="authPage__fieldError">{fieldErrors.fullName}</span>
            )}
          </div>

          <div className="authPage__field">
            <label htmlFor="reg-email">Էլ. հասցե</label>
            <input
              id="reg-email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={handleChange('email')}
            />
            {fieldErrors.email && <span className="authPage__fieldError">{fieldErrors.email}</span>}
          </div>

          <div className="authPage__field">
            <label htmlFor="reg-phone">Հեռախոսահամար</label>
            <input
              id="reg-phone"
              type="tel"
              autoComplete="tel"
              required
              value={form.phone}
              onChange={handleChange('phone')}
            />
            {fieldErrors.phone && <span className="authPage__fieldError">{fieldErrors.phone}</span>}
          </div>

          <div className="authPage__field">
            <label htmlFor="reg-password">Գաղտնաբառ</label>
            <input
              id="reg-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={form.password}
              onChange={handleChange('password')}
            />
            {fieldErrors.password && (
              <span className="authPage__fieldError">{fieldErrors.password}</span>
            )}
          </div>

          {role === 'contractor' && (
            <>
              <div className="authPage__field">
                <label htmlFor="reg-companyName">Ընկերության անվանում</label>
                <input
                  id="reg-companyName"
                  required
                  value={form.companyName}
                  onChange={handleChange('companyName')}
                />
                {fieldErrors.companyName && (
                  <span className="authPage__fieldError">{fieldErrors.companyName}</span>
                )}
              </div>

              <div className="authPage__field">
                <label htmlFor="reg-businessType">Գործունեության տեսակ</label>
                <input
                  id="reg-businessType"
                  value={form.businessType}
                  onChange={handleChange('businessType')}
                />
              </div>

              <div className="authPage__field">
                <label htmlFor="reg-city">Քաղաք</label>
                <input id="reg-city" value={form.city} onChange={handleChange('city')} />
              </div>
            </>
          )}

          <button className="authPage__submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Ուղարկվում է...' : 'Գրանցվել'}
          </button>
        </form>

        <p className="authPage__switch">
          Արդեն հաշիվ ունե՞ք{' '}
          <button type="button" onClick={onNavigateToLogin}>
            Մուտք գործել
          </button>
        </p>
      </div>
    </div>
  );
}

export default Register;
