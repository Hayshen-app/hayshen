import { Outlet } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/admin/components/Sidebar';
import '@/admin/adminTheme.scss';
import '@/admin/adminLayout.scss';

function AdminLayout() {
  const { session, logout } = useAuth();

  return (
    <div className="admin admin-shell">
      <Sidebar />
      <div className="admin-shell__main">
        <header className="admin-topbar">
          <div className="admin-topbar__identity">
            <span className="admin-topbar__name">{session?.fullName}</span>
            <span className="admin-topbar__role">{session?.role}</span>
          </div>
          <button type="button" className="btn btn--ghost btn--sm" onClick={logout}>
            <LogOut size={16} />
            Log out
          </button>
        </header>
        <main className="admin-shell__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
