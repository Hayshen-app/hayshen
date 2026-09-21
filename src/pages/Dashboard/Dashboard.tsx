import { useEffect, useState } from 'react';
import '@/pages/Dashboard/dashboard.scss';
import { useAuth } from '@/context/AuthContext';
import { fetchMe } from '@/api/auth';
import { ApiError } from '@/api/client';

function Dashboard() {
  const { session, logout } = useAuth();
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    if (!session) return undefined;

    let cancelled = false;
    fetchMe(session.accessToken)
      .then(() => {
        if (!cancelled) setStatus('connected');
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus(err instanceof ApiError ? err.message : 'Կապի սխալ');
      });
    return () => {
      cancelled = true;
    };
  }, [session]);

  if (!session) {
    return null;
  }

  return (
    <div className="dashboard">
      <div className="dashboard__card">
        <h1>Բարի գալուստ, {session.fullName}</h1>
        <span className="dashboard__role">{session.role}</span>
        <p className="dashboard__status">
          {status === 'checking' && 'Ստուգվում է կապը backend-ի հետ...'}
          {status === 'connected' && '✓ Հաշիվը հաստատված է backend-ի կողմից (/auth/me)'}
          {status !== 'checking' && status !== 'connected' && `Սխալ. ${status}`}
        </p>
        <button className="dashboard__logout" type="button" onClick={logout}>
          Դուրս գալ
        </button>
      </div>
    </div>
  );
}

export default Dashboard;
