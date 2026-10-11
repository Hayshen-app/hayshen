import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Building2,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { useStoreAuth } from '@/store/context/StoreAuthContext';
import { useMyStore } from '@/store/context/MyStoreContext';
import { Badge, Banner, ConfirmDialog, ToastHost } from '@/store/components/ui';
import { MEMBER_ROLE_LABEL, VERIFICATION_BADGE } from '@/store/utils/labels';

function VerificationBanner() {
  const { store } = useMyStore();
  if (store.status === 'SUSPENDED') {
    return (
      <Banner tone="danger" title="Խանութը կասեցված է">
        HayShen-ը կասեցրել է խանութի գործունեությունը։ Այս ընթացքում հարցումները և գնային առաջարկները հասանելի չեն։ Կապվեք
        աջակցման ծառայության հետ։
      </Banner>
    );
  }
  if (store.verificationStatus === 'PENDING') {
    return (
      <Banner tone="warning" title="Խանութը ստուգման մեջ է">
        HayShen-ը ստուգում է խանութի տվյալները։ Հաստատումից հետո կկարողանաք տեսնել գնորդների հարցումները և ուղարկել գնային
        առաջարկներ։
      </Banner>
    );
  }
  if (store.verificationStatus === 'REJECTED') {
    return (
      <Banner tone="danger" title="Խանութի հաստատումը մերժվել է">
        {store.verificationNote ? <>Պատճառը՝ {store.verificationNote}։ </> : null}
        Ուղղեք տվյալները «Խանութի տվյալներ» բաժնում կամ կապվեք աջակցման ծառայության հետ։
      </Banner>
    );
  }
  return null;
}

function StoreLayout() {
  const { session, logout } = useStoreAuth();
  const { store, can } = useMyStore();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  useEffect(() => setMenuOpen(false), [location.pathname]);

  const nav = [
    { to: '/store', label: 'Վահանակ', icon: <LayoutDashboard size={18} />, end: true, show: true },
    { to: '/store/requests', label: 'Հարցումներ', icon: <ClipboardList size={18} />, show: true },
    { to: '/store/quotations', label: 'Իմ առաջարկները', icon: <FileText size={18} />, show: true },
    { to: '/store/orders', label: 'Պատվերներ', icon: <Package size={18} />, show: true },
    { to: '/store/wallet', label: 'Դրամապանակ', icon: <Wallet size={18} />, show: can.wallet },
    { to: '/store/profile', label: 'Խանութի տվյալներ', icon: <Building2 size={18} />, show: true },
    { to: '/store/team', label: 'Թիմ', icon: <Users size={18} />, show: can.manage },
  ].filter((n) => n.show);

  return (
    <div className="store-portal st-shell">
      <aside className={`st-sidebar${menuOpen ? ' st-sidebar--open' : ''}`}>
        <div className="st-sidebar__brand">
          {store.logoUrl ? (
            <img src={store.logoUrl} alt="" className="st-sidebar__logo" />
          ) : (
            <span className="st-sidebar__logo st-sidebar__logo--placeholder">{store.name.charAt(0).toUpperCase()}</span>
          )}
          <div className="st-sidebar__brand-text">
            <strong title={store.name}>{store.name}</strong>
            <span>Շինանյութի խանութ</span>
          </div>
          <button type="button" className="st-sidebar__close" onClick={() => setMenuOpen(false)} aria-label="Փակել ընտրացանկը">
            <X size={20} />
          </button>
        </div>
        <nav className="st-sidebar__nav">
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `st-nav-link${isActive ? ' st-nav-link--active' : ''}`}>
              {n.icon}
              <span>{n.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      {menuOpen && <div className="st-sidebar-backdrop" onClick={() => setMenuOpen(false)} />}

      <div className="st-shell__main">
        <header className="st-topbar">
          <button type="button" className="st-topbar__menu" onClick={() => setMenuOpen(true)} aria-label="Ընտրացանկ">
            <Menu size={22} />
          </button>
          <div className="st-topbar__store">
            <strong>{store.name}</strong>
            <Badge def={store.status === 'SUSPENDED' ? { label: 'Կասեցված', tone: 'danger' } : VERIFICATION_BADGE[store.verificationStatus]} />
          </div>
          <div className="st-topbar__user">
            <span className="st-topbar__avatar">{session?.fullName?.trim().charAt(0).toUpperCase() || '?'}</span>
            <div className="st-topbar__who">
              <span className="st-topbar__name">{session?.fullName}</span>
              <span className="st-topbar__role">{store.myRole ? MEMBER_ROLE_LABEL[store.myRole] : ''}</span>
            </div>
            <button type="button" className="st-btn st-btn--ghost st-btn--sm" onClick={() => setConfirmLogout(true)}>
              <LogOut size={16} />
              <span className="st-hide-sm">Ելք</span>
            </button>
          </div>
        </header>
        <main className="st-shell__content">
          <VerificationBanner />
          <Outlet />
        </main>
      </div>
      <ToastHost />
      {confirmLogout && (
        <ConfirmDialog
          title="Ելք համակարգից"
          message="Համոզվա՞ծ եք, որ ցանկանում եք դուրս գալ։"
          confirmLabel="Ելք"
          danger
          onConfirm={logout}
          onClose={() => setConfirmLogout(false)}
        />
      )}
    </div>
  );
}

export default StoreLayout;
