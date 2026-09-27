import type { ComponentType } from 'react';
import { NavLink } from 'react-router-dom';
import { Building2, ClipboardList, LayoutDashboard, Layers, Settings, Users, Wallet, type LucideProps } from 'lucide-react';
import '@/admin/components/sidebar.scss';

interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<LucideProps>;
  end?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true }],
  },
  {
    label: 'Marketplace',
    items: [
      { to: '/admin/companies', label: 'Companies', icon: Building2 },
      { to: '/admin/orders', label: 'Orders', icon: ClipboardList },
      { to: '/admin/categories', label: 'Categories', icon: Layers },
    ],
  },
  {
    label: 'Finance',
    items: [{ to: '/admin/withdrawals', label: 'Withdrawals', icon: Wallet }],
  },
  {
    label: 'Administration',
    items: [
      { to: '/admin/users', label: 'Users', icon: Users },
      { to: '/admin/settings', label: 'Settings', icon: Settings },
    ],
  },
];

function Sidebar() {
  return (
    <nav className="admin-sidebar">
      <div className="admin-sidebar__brand">
        <span className="admin-sidebar__mark">H</span>
        <span className="admin-sidebar__brand-text">
          <div className="admin-sidebar__brand-name">Hayshen</div>
          <div className="admin-sidebar__brand-sub">Admin Console</div>
        </span>
      </div>

      {NAV_GROUPS.map((group) => (
        <div className="admin-sidebar__group" key={group.label}>
          <div className="admin-sidebar__group-label">{group.label}</div>
          <ul>
            {group.items.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
                <NavLink to={to} end={end} className={({ isActive }) => (isActive ? 'is-active' : undefined)}>
                  <Icon size={18} />
                  <span>{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export default Sidebar;
