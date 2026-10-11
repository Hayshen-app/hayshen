import type { ReactNode } from 'react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Store as StoreIcon } from 'lucide-react';
import { StoreAuthProvider, STORE_PORTAL_ROLES, useStoreAuth } from '@/store/context/StoreAuthContext';
import { MyStoreProvider, useMyStore } from '@/store/context/MyStoreContext';
import { useStoreApi } from '@/store/api/storeApi';
import { errorCode, storeErrorMessage } from '@/store/utils/errors';
import { Button, EmptyState, ErrorState, LoadingState } from '@/store/components/ui';
import type { StorePermissions } from '@/store/utils/labels';
import StoreLayout from '@/store/layout/StoreLayout';
import LoginPage from '@/store/pages/LoginPage';
import RegisterPage from '@/store/pages/RegisterPage';
import DashboardPage from '@/store/pages/DashboardPage';
import MarketplacePage from '@/store/pages/MarketplacePage';
import RequestDetailPage from '@/store/pages/RequestDetailPage';
import QuotationFormPage from '@/store/pages/QuotationFormPage';
import QuotationsPage from '@/store/pages/QuotationsPage';
import OrdersPage from '@/store/pages/OrdersPage';
import OrderDetailPage from '@/store/pages/OrderDetailPage';
import WalletPage from '@/store/pages/WalletPage';
import ProfilePage from '@/store/pages/ProfilePage';
import TeamPage from '@/store/pages/TeamPage';
import '@/store/storeTheme.scss';

function FullPage({ children }: { children: ReactNode }) {
  return (
    <div className="store-portal st-fullpage">
      <div className="st-fullpage__card">{children}</div>
    </div>
  );
}

/** Signed in with a store-capable role AND an active member of a store. */
function RequireStore({ children }: { children: ReactNode }) {
  const { isAuthenticated, session, logout } = useStoreAuth();
  const api = useStoreApi();
  const allowedRole = Boolean(session && STORE_PORTAL_ROLES.includes(session.role));

  const profile = useQuery({
    queryKey: ['store', 'profile'],
    queryFn: api.profile,
    enabled: isAuthenticated && allowedRole,
    retry: (count, err) => count < 1 && errorCode(err) == null,
  });

  if (!isAuthenticated) return <Navigate to="/store/login" replace />;

  if (!allowedRole) {
    return (
      <FullPage>
        <EmptyState
          icon={<StoreIcon size={28} />}
          title="Մուտքը արգելված է"
          text="Այս հաշիվը շինանյութի խանութի հաշիվ չէ։ Մուտք գործեք խանութի հաշվով։"
          action={<Button onClick={logout}>Դուրս գալ</Button>}
        />
      </FullPage>
    );
  }

  if (profile.isPending) {
    return (
      <FullPage>
        <LoadingState text="Խանութի տվյալները բեռնվում են…" />
      </FullPage>
    );
  }

  if (profile.isError) {
    if (errorCode(profile.error) === 'NOT_A_STORE_MEMBER') {
      return (
        <FullPage>
          <EmptyState
            icon={<StoreIcon size={28} />}
            title="Այս հաշիվը խանութ չունի"
            text={
              <>
                Ձեր հաշիվը կապված չէ որևէ շինանյութի խանութի հետ (կամ Ձեր անդամությունը ապաակտիվացված է)։
                Շինարարական ընկերությունները կարող են բացել խանութ HayShen Company բջջային հավելվածից։
                Կարող եք նաև գրանցել նոր խանութ առանձին հաշվով։
              </>
            }
            action={
              <div className="st-row st-row--center">
                <Link to="/store/register" className="st-btn st-btn--secondary" onClick={logout}>
                  Գրանցել խանութ
                </Link>
                <Button onClick={logout}>Դուրս գալ</Button>
              </div>
            }
          />
        </FullPage>
      );
    }
    return (
      <FullPage>
        <ErrorState message={storeErrorMessage(profile.error, 'Չհաջողվեց բեռնել խանութը')} onRetry={() => profile.refetch()} />
        <div className="st-row st-row--center" style={{ marginTop: 12 }}>
          <Button variant="ghost" onClick={logout}>
            Դուրս գալ
          </Button>
        </div>
      </FullPage>
    );
  }

  return (
    <MyStoreProvider store={profile.data} refresh={() => profile.refetch()}>
      {children}
    </MyStoreProvider>
  );
}

/** Hides a page from roles that may not use it (the server rejects them anyway). */
function RequirePermission({ permission, children }: { permission: keyof StorePermissions; children: ReactNode }) {
  const { can } = useMyStore();
  if (!can[permission]) {
    return (
      <EmptyState
        title="Հասանելի չէ"
        text="Ձեր դերը խանութում թույլ չի տալիս բացել այս բաժինը։ Դիմեք խանութի սեփականատիրոջը։"
        action={
          <Link to="/store" className="st-btn st-btn--secondary">
            Վահանակ
          </Link>
        }
      />
    );
  }
  return <>{children}</>;
}

function GuestOnly({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useStoreAuth();
  return isAuthenticated ? <Navigate to="/store" replace /> : <>{children}</>;
}

function StoreRoutes() {
  return (
    <Routes>
      <Route
        path="login"
        element={
          <GuestOnly>
            <LoginPage />
          </GuestOnly>
        }
      />
      <Route
        path="register"
        element={
          <GuestOnly>
            <RegisterPage />
          </GuestOnly>
        }
      />
      <Route
        path="/"
        element={
          <RequireStore>
            <StoreLayout />
          </RequireStore>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="requests" element={<MarketplacePage />} />
        <Route path="requests/:id" element={<RequestDetailPage />} />
        <Route
          path="requests/:id/quote"
          element={
            <RequirePermission permission="quote">
              <QuotationFormPage />
            </RequirePermission>
          }
        />
        <Route path="quotations" element={<QuotationsPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="orders/:id" element={<OrderDetailPage />} />
        <Route
          path="wallet"
          element={
            <RequirePermission permission="wallet">
              <WalletPage />
            </RequirePermission>
          }
        />
        <Route path="profile" element={<ProfilePage />} />
        <Route
          path="team"
          element={
            <RequirePermission permission="manage">
              <TeamPage />
            </RequirePermission>
          }
        />
        <Route path="*" element={<Navigate to="/store" replace />} />
      </Route>
    </Routes>
  );
}

function StoreApp() {
  return (
    <StoreAuthProvider>
      <StoreRoutes />
    </StoreAuthProvider>
  );
}

export default StoreApp;
