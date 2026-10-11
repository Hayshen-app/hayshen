import { Link } from 'react-router-dom';
import { Building2, ClipboardList, ShieldCheck, Clock3, Scale, Store, Truck, Users } from 'lucide-react';
import { useDashboard } from '@/admin/api/dashboard';
import { useMaterialDisputes, useMaterialStores, useSupplierOrders } from '@/admin/api/materials';
import StatCard from '@/admin/components/StatCard';
import { humanize, orderStatusTone } from '@/admin/utils/constants';
import { formatNumber } from '@/admin/utils/format';
import type { OrderStatus } from '@/types/enums';
import '@/admin/pages/dashboardPage.scss';

function DashboardPage() {
  const { data, isLoading, isError, error } = useDashboard();

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Platform overview across customers, contractors, and orders.</p>
        </div>
      </div>

      {isLoading && <div className="empty-state">Loading dashboard…</div>}
      {isError && <div className="empty-state">{error?.message || 'Failed to load the dashboard.'}</div>}

      {data && (
        <>
          <div className="stat-grid">
            <StatCard icon={<Users size={20} />} label="Customers" value={formatNumber(data.totalCustomers)} />
            <StatCard icon={<Building2 size={20} />} label="Contractors" value={formatNumber(data.totalContractors)} />
            <StatCard
              icon={<Clock3 size={20} />}
              label="Pending Verifications"
              value={formatNumber(data.pendingContractorVerifications)}
            />
            <StatCard
              icon={<ShieldCheck size={20} />}
              label="Verified Contractors"
              value={formatNumber(data.verifiedContractors)}
            />
            <StatCard icon={<ClipboardList size={20} />} label="Total Orders" value={formatNumber(data.totalOrders)} />
          </div>

          <div className="card">
            <h2 className="dashboard-section-title">Orders by status</h2>
            <OrdersByStatus ordersByStatus={data.ordersByStatus} />
          </div>
        </>
      )}

      <MaterialsCounters />
    </div>
  );
}

/** Materials marketplace counters from the list endpoints' totalElements (size 1 keeps them cheap). */
function MaterialsCounters() {
  const pendingStores = useMaterialStores({ status: 'PENDING', size: 1 });
  const disputes = useMaterialDisputes({ size: 1 });
  const awaitingPayment = useSupplierOrders({ status: 'AWAITING_PAYMENT', size: 1 });
  const count = (query: { data?: { totalElements: number }; isError: boolean }) =>
    query.isError ? '—' : formatNumber(query.data?.totalElements ?? null);

  return (
    <div style={{ marginTop: 24 }}>
      <h2 className="dashboard-section-title">Materials</h2>
      <div className="stat-grid">
        <Link to="/admin/material-stores">
          <StatCard icon={<Store size={20} />} label="Stores to verify" value={count(pendingStores)} />
        </Link>
        <Link to="/admin/material-disputes">
          <StatCard icon={<Scale size={20} />} label="Open material disputes" value={count(disputes)} />
        </Link>
        <Link to="/admin/supplier-orders">
          <StatCard icon={<Truck size={20} />} label="Supplier orders awaiting payment" value={count(awaitingPayment)} />
        </Link>
      </div>
    </div>
  );
}

function OrdersByStatus({ ordersByStatus }: { ordersByStatus: Record<string, number> }) {
  const entries = Object.entries(ordersByStatus || {});
  const max = Math.max(1, ...entries.map(([, count]) => count));

  if (entries.length === 0) {
    return <div className="empty-state">No orders yet.</div>;
  }

  return (
    <div className="status-bars">
      {entries.map(([status, count]) => (
        <div className="status-bars__row" key={status}>
          <span className="status-bars__label">{humanize(status)}</span>
          <div className="status-bars__track">
            <div
              className={`status-bars__fill status-bars__fill--${orderStatusTone(status as OrderStatus)}`}
              style={{ width: `${(count / max) * 100}%` }}
            />
          </div>
          <span className="status-bars__count">{count}</span>
        </div>
      ))}
    </div>
  );
}

export default DashboardPage;
