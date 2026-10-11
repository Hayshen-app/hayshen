import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ClipboardList, Truck, Users, Wallet } from 'lucide-react';
import { useCompany, useCompanyOrders, useCompanyVehicles, useCompanyWorkerHistory } from '@/admin/api/companies';
import { useUserBalance } from '@/admin/api/withdrawals';
import DataTable, { type DataTableColumn } from '@/admin/components/DataTable';
import StatCard from '@/admin/components/StatCard';
import StatusBadge from '@/admin/components/StatusBadge';
import CompanyLogo from '@/admin/components/CompanyLogo';
import VerifyCompanyModal from '@/admin/components/VerifyCompanyModal';
import WalletPanel from '@/admin/components/WalletPanel';
import WorkerHistoryPanel from '@/admin/components/WorkerHistoryPanel';
import { orderStatusTone, verificationStatusTone } from '@/admin/utils/constants';
import { formatCurrency, formatDateTime, formatNumber } from '@/admin/utils/format';
import type { VehicleResponse } from '@/admin/types';
import '@/admin/pages/companyDetailPage.scss';

function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: company, isLoading, isError, error } = useCompany(id);
  const { data: workerHistory, isLoading: workersLoading, isError: workersError } = useCompanyWorkerHistory(id);
  const { data: vehicles, isLoading: vehiclesLoading, isError: vehiclesError } = useCompanyVehicles(id);
  const [ordersPage, setOrdersPage] = useState(0);
  const { data: orders, isLoading: ordersLoading, isError: ordersError } = useCompanyOrders(id, { page: ordersPage });
  const { data: balance } = useUserBalance(company?.ownerId);
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
            <StatCard icon={<Users size={20} />} label="Workers" value={String(workerHistory?.length ?? 0)} />
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
                <Detail label="Owner user id" value={`#${company.ownerId}`} />
                <Detail label="Total wallet balance" value={formatCurrency(balance?.totalBalance ?? null)} />
                <Detail label="Frozen (7-day hold)" value={formatCurrency(balance?.frozenBalance ?? null)} />
                <Detail label="Registered" value={formatDateTime(company.createdAt)} />
              </div>
            </div>

            <div className="card">
              <h2 className="company-detail__section-title">Workers, job history and ratings</h2>
              <WorkerHistoryPanel history={workerHistory} isLoading={workersLoading} isError={workersError} />
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

            <WalletPanel
              userId={company.ownerId}
              ownerName={`${company.ownerName} (${company.companyName})`}
              emptyMessage="No wallet activity recorded for this company yet."
            />
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
