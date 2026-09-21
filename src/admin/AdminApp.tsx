import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import AdminLayout from '@/admin/AdminLayout';
import AdminLogin from '@/admin/pages/AdminLogin';
import DashboardPage from '@/admin/pages/DashboardPage';
import UsersPage from '@/admin/pages/UsersPage';
import CompaniesPage from '@/admin/pages/CompaniesPage';
import OrdersPage from '@/admin/pages/OrdersPage';
import OrderDetailPage from '@/admin/pages/OrderDetailPage';
import CategoriesPage from '@/admin/pages/CategoriesPage';
import SettingsPage from '@/admin/pages/SettingsPage';
import type { UserRole } from '@/types/enums';
import '@/admin/adminTheme.scss';

const ADMIN_ROLES: UserRole[] = ['ADMIN', 'SUPPORT'];

function RequireAdmin({ children }: { children: ReactNode }) {
  const { isAuthenticated, session, logout } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!session || !ADMIN_ROLES.includes(session.role)) {
    return (
      <div className="admin" style={{ padding: 48, textAlign: 'center' }}>
        <h1 style={{ marginBottom: 8 }}>Access denied</h1>
        <p style={{ color: '#666', marginBottom: 20 }}>
          The account you're signed in with ({session?.role}) doesn't have access to the Admin Console.
        </p>
        <button type="button" className="btn btn--secondary" onClick={logout}>
          Log out
        </button>
      </div>
    );
  }

  return <>{children}</>;
}

function AdminApp() {
  return (
    <Routes>
      <Route path="login" element={<AdminLogin />} />
      <Route
        path="/"
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="companies" element={<CompaniesPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="orders/:id" element={<OrderDetailPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}

export default AdminApp;
