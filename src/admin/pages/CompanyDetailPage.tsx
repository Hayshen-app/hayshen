import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ClipboardList, Truck, Users, Wallet } from 'lucide-react';
import { useCompany, useCompanyOrders, useCompanyVehicles, useCompanyWorkers } from '@/admin/api/companies';
import { useUserBalance, useUserTransactions } from '@/admin/api/withdrawals';
import DataTable, { type DataTableColumn } from '@/admin/components/DataTable';
import StatCard from '@/admin/components/StatCard';
import StatusBadge from '@/admin/components/StatusBadge';
import CompanyLogo from '@/admin/components/CompanyLogo';
import VerifyCompanyModal from '@/admin/components/VerifyCompanyModal';
import { orderStatusTone, verificationStatusTone } from '@/admin/utils/constants';
import { formatCurrency, formatDateTime, formatNumber } from '@/admin/utils/format';
import type { VehicleResponse, WorkerResponse } from '@/admin/types';
import '@/admin/pages/companyDetailPage.scss';

function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: company, isLoading, isError, error } = useCompany(id);
  const { data: workers, isLoading: workersLoading, isError: workersError } = useCompanyWorkers(id);
  const { data: vehicles, isLoading: vehiclesLoading, isError: vehiclesError } = useCompanyVehicles(id);
  const [ordersPage, setOrdersPage] = useState(0);
  const { data: orders, isLoading: ordersLoading, isError: ordersError } = useCompanyOrders(id, { page: ordersPage });
  const { data: balance } = useUserBalance(company?.ownerId);
  const [paymentsPage, setPaymentsPage] = useState(0);
  const {
    data: payments,
    isLoading: paymentsLoading,
    isError: paymentsError,
  } = useUserTransactions(company?.ownerId, { page: paymentsPage });
  const [showVerify, setShowVerify] = useState(false);

  return (
    <div>
      <Link to="/admin/companies" className="company-detail__back">
        <ArrowLeft size={16} />
        Back to companies
      </Link>

      {isLoading && <div className="empty-state">Loading company…</div>}
      {isError && <div className="empty-state">{error?.message || 'Failed to load company.'}</div>}

      {company && (
        <>
          <div className="page-header">
            <div className="company-detail__title-row">
              <CompanyLogo logoUrl={company.logoUrl} size="lg" />
              <div>
                <h1>
                  {company.companyName}{' '}
                  <StatusBadge status={company.verificationStatus} tone={verificationStatusTone(company.verificationStatus)} />
                </h1>
                <p>
                  {company.ownerName} · {company.ownerEmail} · {company.ownerPhone}
                </p>
              </div>
            </div>
            <button type="button" className="btn btn--primary" onClick={() => setShowVerify(true)}>
              Review verification
            </button>
          </div>

          <div className="stat-grid">
            <StatCard icon={<Users size={20} />} label="Workers" value={String(workers?.length ?? 0)} />
            <StatCard icon={<Truck size={20} />} label="Vehicles" value={String(vehicles?.length ?? 0)} />
            <StatCard icon={<ClipboardList size={20} />} label="Jobs completed" value={formatNumber(company.totalJobsCompleted)} />
            <StatCard icon={<Wallet size={20} />} label="Available balance" value={formatCurrency(balance?.availableBalance ?? null)} />
          </div>

          <div className="company-detail__sections">
            <div className="card">
              <h2 className="company-detail__section-title">Company summary</h2>
              <div className="detail-grid">
                <Detail label="City" value={company.city} />
                <Detail label="Rating" value={company.rating != null ? company.rating.toFixed(2) : '—'} />
                <Detail label="Total balance" value={formatCurrency(balance?.totalBalance ?? null)} />
                <Detail label="Available balance" value={formatCurrency(balance?.availableBalance ?? null)} />
                <Detail label="Registered" value={formatDateTime(company.createdAt)} />
              </div>
            </div>

            <div className="card">
              <h2 className="company-detail__section-title">Workers</h2>
              <DataTable
                columns={
                  [
                    { key: 'fullName', header: 'Name' },
                    { key: 'title', header: 'Title', render: (w) => w.title || '—' },
                    { key: 'phone', header: 'Phone', render: (w) => w.phone || '—' },
                    {
                      key: 'rating',
                      header: 'Rating',
                      render: (w) => (w.rating != null ? `${w.rating.toFixed(1)} (${w.ratingCount})` : '—'),
                    },
                    {
                      key: 'status',
                      header: 'Status',
                      render: (w) => <StatusBadge status={w.status} tone={w.status === 'ACTIVE' ? 'success' : 'neutral'} />,
                    },
                  ] as DataTableColumn<WorkerResponse>[]
                }
                rows={workers}
                rowKey={(w) => w.id}
                isLoading={workersLoading}
                isError={workersError}
                errorMessage="Failed to load workers."
                emptyMessage="No workers added by this company yet."
              />
            </div>

            <div className="card">
              <h2 className="company-detail__section-title">Vehicles</h2>
              <DataTable
                columns={
                  [
                    { key: 'plateNumber', header: 'Plate', render: (v) => v.plateNumber || '—' },
                    { key: 'vehicleModelName', header: 'Model', render: (v) => v.vehicleModelName || '—' },
                    { key: 'type', header: 'Type', render: (v) => v.type || '—' },
                    { key: 'capacity', header: 'Capacity', render: (v) => v.capacity || '—' },
                    {
                      key: 'status',
                      header: 'Status',
                      render: (v) => (
                        <StatusBadge
                          status={v.status}
                          tone={v.status === 'ACTIVE' ? 'success' : v.status === 'MAINTENANCE' ? 'warning' : 'neutral'}
                        />
                      ),
                    },
                  ] as DataTableColumn<VehicleResponse>[]
                }
                rows={vehicles}
                rowKey={(v) => v.id}
                isLoading={vehiclesLoading}
                isError={vehiclesError}
                errorMessage="Failed to load vehicles."
                emptyMessage="No vehicles added by this company yet."
              />
            </div>

            <div className="card">
              <h2 className="company-detail__section-title">Order history</h2>
              <DataTable
                columns={[
                  { key: 'id', header: 'ID', render: (row) => `#${row.id}` },
                  { key: 'categoryName', header: 'Category / Service', render: (row) => (
                      <div>
                        <div>{row.categoryName}</div>
                        {row.serviceItemName && <div className="company-detail__muted">{row.serviceItemName}</div>}
                      </div>
                    ) },
                  { key: 'customerName', header: 'Customer' },
                  { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} tone={orderStatusTone(row.status)} /> },
                  { key: 'addressCity', header: 'City' },
                  { key: 'scheduledAt', header: 'Scheduled', render: (row) => formatDateTime(row.scheduledAt) },
                  { key: 'finalPrice', header: 'Price', render: (row) => formatCurrency(row.finalPrice) },
                  {
                    key: 'actions',
                    header: '',
                    render: (row) => (
                      <button type="button" className="btn btn--secondary btn--sm" onClick={() => navigate(`/admin/orders/${row.id}`)}>
                        View
                      </button>
                    ),
                  },
                ]}
                rows={orders?.items}
                rowKey={(row) => row.id}
                isLoading={ordersLoading}
                isError={ordersError}
                errorMessage="Failed to load orders."
                emptyMessage="This company has no orders yet."
                page={orders?.page ?? ordersPage}
                totalPages={orders?.totalPages ?? 1}
                totalElements={orders?.totalElements ?? 0}
                onPageChange={setOrdersPage}
              />
            </div>

            <div className="card">
              <h2 className="company-detail__section-title">Payments</h2>
              <DataTable
                columns={[
                  {
                    key: 'type',
                    header: 'Type',
                    render: (tx) => (
                      <StatusBadge status={tx.type} tone={tx.type === 'RELEASE' || tx.type === 'REFUND' ? 'success' : 'neutral'} />
                    ),
                  },
                  {
                    key: 'amount',
                    header: 'Amount',
                    render: (tx) => (
                      <span className={tx.amount < 0 ? 'company-detail__amount--negative' : 'company-detail__amount--positive'}>
                        {tx.amount > 0 ? '+' : ''}
                        {formatCurrency(tx.amount)}
                      </span>
                    ),
                  },
                  { key: 'orderId', header: 'Order', render: (tx) => (tx.orderId ? `#${tx.orderId}` : '—') },
                  { key: 'availableAt', header: 'Available at', render: (tx) => formatDateTime(tx.availableAt) },
                  { key: 'createdAt', header: 'Recorded at', render: (tx) => formatDateTime(tx.createdAt) },
                ]}
                rows={payments?.items}
                rowKey={(tx) => tx.id}
                isLoading={paymentsLoading}
                isError={paymentsError}
                errorMessage="Failed to load payment history."
                emptyMessage="No wallet activity recorded for this company yet."
                page={payments?.page ?? paymentsPage}
                totalPages={payments?.totalPages ?? 1}
                totalElements={payments?.totalElements ?? 0}
                onPageChange={setPaymentsPage}
              />
            </div>
          </div>

          {showVerify && <VerifyCompanyModal company={company} onClose={() => setShowVerify(false)} />}
        </>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div className="detail-item">
      <div className="detail-item__label">{label}</div>
      <div className="detail-item__value">{value ?? '—'}</div>
    </div>
  );
}

export default CompanyDetailPage;
