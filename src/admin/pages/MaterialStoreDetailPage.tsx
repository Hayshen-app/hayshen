import { useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, PackageCheck, Star, Truck } from 'lucide-react';
import { useMaterialStore, useSupplierOrders } from '@/admin/api/materials';
import { useCompany } from '@/admin/api/companies';
import DataTable from '@/admin/components/DataTable';
import StatCard from '@/admin/components/StatCard';
import StatusBadge from '@/admin/components/StatusBadge';
import WalletPanel from '@/admin/components/WalletPanel';
import { StoreStatusModal, VerifyStoreModal } from '@/admin/components/MaterialStoreModals';
import { supplierOrderColumns } from '@/admin/components/materialsColumns';
import { verificationStatusTone } from '@/admin/utils/constants';
import { materialStoreStatusTone } from '@/admin/utils/materialsConstants';
import { formatDateTime, formatNumber } from '@/admin/utils/format';
import type { VerificationStatus } from '@/types/enums';
import '@/admin/pages/materialsPages.scss';

function MaterialStoreDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: store, isLoading, isError, error } = useMaterialStore(id);
  const [ordersPage, setOrdersPage] = useState(0);
  const {
    data: orders,
    isLoading: ordersLoading,
    isError: ordersError,
    error: ordersErrorDetail,
  } = useSupplierOrders({ storeId: store?.id, page: ordersPage, size: 20, enabled: Boolean(store) });
  // Only used for the company name/link on company-run stores.
  const { data: company } = useCompany(store?.companyId ?? undefined);
  const [verifyTarget, setVerifyTarget] = useState<VerificationStatus | null>(null);
  const [showStatus, setShowStatus] = useState(false);

  return (
    <div>
      <Link to="/admin/material-stores" className="materials__back">
        <ArrowLeft size={16} />
        Back to material stores
      </Link>

      {isLoading && <div className="empty-state">Loading store…</div>}
      {isError && <div className="empty-state">{error?.message || 'Failed to load the store.'}</div>}

      {store && (
        <>
          <div className="page-header">
            <div className="materials__title-row">
              {store.logoUrl && <img className="materials__logo" src={store.logoUrl} alt="" />}
              <div>
                <h1>
                  {store.name}
                  <StatusBadge status={store.verificationStatus} tone={verificationStatusTone(store.verificationStatus)} />
                  <StatusBadge status={store.status} tone={materialStoreStatusTone(store.status)} />
                </h1>
                <p>
                  {store.operational
                    ? 'Operational: can open the marketplace and quote.'
                    : 'Not operational: must be Verified and Active to quote.'}
                </p>
              </div>
            </div>
            <div className="materials__actions">
              {store.verificationStatus !== 'VERIFIED' && (
                <button type="button" className="btn btn--primary" onClick={() => setVerifyTarget('VERIFIED')}>
                  Verify
                </button>
              )}
              {store.verificationStatus !== 'REJECTED' && (
                <button type="button" className="btn btn--danger" onClick={() => setVerifyTarget('REJECTED')}>
                  Reject
                </button>
              )}
              {store.verificationStatus !== 'PENDING' && (
                <button type="button" className="btn btn--secondary" onClick={() => setVerifyTarget('PENDING')}>
                  Back to pending
                </button>
              )}
              <button
                type="button"
                className={store.status === 'ACTIVE' ? 'btn btn--danger' : 'btn btn--primary'}
                onClick={() => setShowStatus(true)}
              >
                {store.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
              </button>
            </div>
          </div>

          <div className="stat-grid">
            <StatCard
              icon={<Star size={20} />}
              label="Rating"
              value={store.ratingCount > 0 && store.rating != null ? `${Number(store.rating).toFixed(2)} (${store.ratingCount})` : '—'}
            />
            <StatCard icon={<MapPin size={20} />} label="Locations" value={formatNumber(store.locations.length)} />
            <StatCard icon={<Truck size={20} />} label="Delivery regions" value={formatNumber(store.deliveryRegions.length)} />
            <StatCard
              icon={<PackageCheck size={20} />}
              label="Supplier orders"
              value={orders ? formatNumber(orders.totalElements) : '—'}
            />
          </div>

          <div className="materials__sections">
            <div className="card">
              <h2 className="materials__section-title">Store profile</h2>
              <div className="detail-grid">
                <Detail label="Legal name" value={store.legalName} />
                <Detail label="Registration no." value={store.registrationNumber} />
                <Detail label="Tax ID" value={store.taxId} />
                <Detail label="Contact person" value={store.contactPerson} />
                <Detail label="Phone" value={store.phone} />
                <Detail label="Email" value={store.email} />
                <Detail
                  label="Contractor company"
                  value={
                    store.companyId ? (
                      <Link to={`/admin/companies/${store.companyId}`}>{company?.companyName || `#${store.companyId}`}</Link>
                    ) : (
                      'Independent store'
                    )
                  }
                />
                <Detail
                  label="Owner user"
                  value={store.ownerUserId != null ? `#${store.ownerUserId}` : null}
                />
                <Detail label="Registered" value={formatDateTime(store.createdAt)} />
                <Detail label="Verified at" value={formatDateTime(store.verifiedAt)} />
              </div>
              {store.description && (
                <div className="detail-item" style={{ marginTop: 16 }}>
                  <div className="detail-item__label">Description</div>
                  <div className="detail-item__value">{store.description}</div>
                </div>
              )}
              {store.verificationNote && (
                <div className="admin-note" style={{ marginTop: 16, marginBottom: 0 }}>
                  <strong>Verification note:</strong> {store.verificationNote}
                </div>
              )}
            </div>

            <div className="card">
              <h2 className="materials__section-title">Locations</h2>
              <DataTable
                columns={[
                  {
                    key: 'name',
                    header: 'Name',
                    render: (l) => (
                      <span>
                        {l.name} {l.primary && <StatusBadge status="PRIMARY" tone="info" label="Primary" />}
                      </span>
                    ),
                  },
                  { key: 'addressLine', header: 'Address', render: (l) => `${l.addressLine}, ${l.city}` },
                  { key: 'regionName', header: 'Region', render: (l) => l.regionName || '—' },
                  { key: 'phone', header: 'Phone', render: (l) => l.phone || '—' },
                  {
                    key: 'map',
                    header: 'Map',
                    render: (l) =>
                      l.latitude != null && l.longitude != null ? (
                        <a
                          href={`https://www.google.com/maps?q=${l.latitude},${l.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open
                        </a>
                      ) : (
                        '—'
                      ),
                  },
                ]}
                rows={store.locations}
                rowKey={(l) => l.id}
                emptyMessage="No locations added."
              />
            </div>

            <div className="card">
              <h2 className="materials__section-title">Delivery regions</h2>
              {store.deliveryRegions.length > 0 ? (
                <div className="materials__chips">
                  {store.deliveryRegions.map((region) => (
                    <span key={region.id} className="materials__chip">
                      {region.name}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="empty-state">No delivery regions selected.</div>
              )}
            </div>

            <div className="card">
              <h2 className="materials__section-title">Supplier orders</h2>
              <DataTable
                columns={supplierOrderColumns({ showStore: false })}
                rows={orders?.items}
                rowKey={(row) => row.id}
                isLoading={ordersLoading}
                isError={ordersError}
                errorMessage={ordersErrorDetail?.message || 'Failed to load supplier orders.'}
                emptyMessage="This store has no supplier orders yet."
                page={orders?.page ?? ordersPage}
                totalPages={orders?.totalPages ?? 1}
                totalElements={orders?.totalElements ?? 0}
                onPageChange={setOrdersPage}
              />
            </div>

            {store.ownerUserId != null ? (
              <WalletPanel
                userId={store.ownerUserId}
                ownerName={`Store owner (${store.name})`}
                title="Owner wallet"
                emptyMessage="No wallet activity recorded for this store owner yet."
              />
            ) : (
              <div className="card">
                <h2 className="materials__section-title">Owner wallet</h2>
                <div className="empty-state">This store has no owner account linked, so there is no wallet to show.</div>
              </div>
            )}
          </div>

          {verifyTarget && <VerifyStoreModal store={store} target={verifyTarget} onClose={() => setVerifyTarget(null)} />}
          {showStatus && <StoreStatusModal store={store} onClose={() => setShowStatus(false)} />}
        </>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="detail-item">
      <div className="detail-item__label">{label}</div>
      <div className="detail-item__value">{value || '—'}</div>
    </div>
  );
}

export default MaterialStoreDetailPage;
