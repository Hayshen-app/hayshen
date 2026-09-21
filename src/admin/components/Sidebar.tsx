import type { ComponentType } from 'react';
import { NavLink } from 'react-router-dom';
import { Building2, ClipboardList, LayoutDashboard, Layers, Settings, Users, type LucideProps } from 'lucide-react';
import '@/admin/components/sidebar.scss';

interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<LucideProps>;
  end?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/companies', label: 'Companies', icon: Building2 },
  { to: '/admin/orders', label: 'Orders', icon: ClipboardList },
  { to: '/admin/categories', label: 'Categories', icon: Layers },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

function Sidebar() {
  return (
    <nav className="admin-sidebar">
      <div className="admin-sidebar__brand">HayShen Admin</div>
      <ul>
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink to={to} end={end} className={({ isActive }) => (isActive ? 'is-active' : undefined)}>
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default Sidebar;
