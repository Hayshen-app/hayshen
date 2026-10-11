import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Store as StoreIcon } from 'lucide-react';
import { useStoreAuth } from '@/store/context/StoreAuthContext';
import { Button, Field, FormError } from '@/store/components/ui';
import { storeErrorMessage } from '@/store/utils/errors';
import { EMAIL_RE } from '@/store/utils/format';

function LoginPage() {
  const { login } = useStoreAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) return setError('Մուտքագրեք ճիշտ էլ. հասցե');
    if (!password) return setError('Մուտքագրեք գաղտնաբառը');
    setBusy(true);
    setError(null);
    try {
      await login(email.trim(), password);
      navigate('/store', { replace: true });
    } catch (err) {
      setError(storeErrorMessage(err, 'Չհաջողվեց մուտք գործել'));
      setBusy(false);
    }
  };

  return (
    <div className="store-portal st-auth">
      <form className="st-auth__card" onSubmit={submit} noValidate>
        <div className="st-auth__brand">
          <StoreIcon size={28} />
          <div>
            <h1>Շինանյութի խանութ</h1>
            <p>HayShen խանութի վահանակ</p>
          </div>
        </div>
        <Field label="Էլ. հասցե" required>
          <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={busy} />
        </Field>
        <Field label="Գաղտնաբառ" required>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={busy}
          />
        </Field>
        <FormError message={error} />
        <Button type="submit" loading={busy} className="st-btn--block">
          Մուտք
        </Button>
        <p className="st-auth__alt">
          Դեռ խանութ չունե՞ք։ <Link to="/store/register">Գրանցել խանութ</Link>
        </p>
      </form>
    </div>
  );
}

export default LoginPage;
