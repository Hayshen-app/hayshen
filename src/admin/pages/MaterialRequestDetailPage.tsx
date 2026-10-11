import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import {
  useMaterialRequest,
  useMaterialRequestAudit,
  useMaterialRequestSupplierOrders,
} from '@/admin/api/materials';
import DataTable from '@/admin/components/DataTable';
import StatusBadge from '@/admin/components/StatusBadge';
import { supplierOrderColumns } from '@/admin/components/materialsColumns';
import { humanize } from '@/admin/utils/constants';
import {
  formatQuantity,
  materialRequestStatusTone,
  purchasingAccountLabel,
} from '@/admin/utils/materialsConstants';
import { formatCurrency, formatDate, formatDateTime } from '@/admin/utils/format';
import '@/admin/pages/materialsPages.scss';

function MaterialRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: request, isLoading, isError, error } = useMaterialRequest(id);
  const { data: audit, isLoading: auditLoading, isError: auditError, error: auditErr } = useMaterialRequestAudit(id);
  const orders = useMaterialRequestSupplierOrders(id);

  return (
    <div>
      <Link to="/admin/material-requests" className="materials__back">
        <ArrowLeft size={16} />
        Back to material requests
      </Link>

      {isLoading && <div className="empty-state">Loading request…</div>}
      {isError && <div className="empty-state">{error?.message || 'Failed to load the request.'}</div>}

      {request && (
        <>
          <div className="page-header">
            <div>
              <h1>
                {request.number}
                <StatusBadge status={request.status} tone={materialRequestStatusTone(request.status)} />
              </h1>
              <p>{request.title}</p>
            </div>
          </div>

          <div className="materials__sections">
            <div className="card">
              <h2 className="materials__section-title">Summary</h2>
              <div className="detail-grid">
                <Detail label="Buyer" value={request.buyer?.name} />
                <Detail
                  label="Paying account"
                  value={`${purchasingAccountLabel(request.purchasingAccountType)}${request.buyerCompany ? ` · ${request.buyerCompany.name}` : ''}`}
                />
                <Detail label="Origin" value={humanize(request.origin)} />
                <Detail
                  label="Proposed by"
                  value={
                    request.proposedByCompany ? (
                      <Link to={`/admin/companies/${request.proposedByCompany.id}`}>{request.proposedByCompany.name}</Link>
                    ) : null
                  }
                />
                <Detail
                  label="Project order"
                  value={
                    request.projectOrderId ? (
                      <Link to={`/admin/orders/${request.projectOrderId}`}>#{request.projectOrderId}</Link>
                    ) : null
                  }
                />
                <Detail label="Milestone" value={request.milestone?.name} />
                <Detail label="Estimated total" value={formatCurrency(request.estimatedTotal)} />
                <Detail label="Quotations" value={String(request.quotationCount)} />
                <Detail label="Supplier selection delegated" value={request.supplierSelectionDelegated ? 'Yes' : 'No'} />
                <Detail label="Preferred delivery" value={formatDate(request.preferredDeliveryDate)} />
                <Detail label="Created" value={formatDateTime(request.createdAt)} />
                <Detail label="Published" value={formatDateTime(request.publishedAt)} />
                <Detail label="Expires" value={formatDateTime(request.expiresAt)} />
                {request.completedAt && <Detail label="Completed" value={formatDateTime(request.completedAt)} />}
                {request.canceledAt && (
                  <Detail
                    label="Canceled"
                    value={`${formatDateTime(request.canceledAt)}${request.cancelReason ? ` · ${request.cancelReason}` : ''}`}
                  />
                )}
              </div>
              {request.delivery && (
                <div className="detail-item" style={{ marginTop: 16 }}>
                  <div className="detail-item__label">Delivery</div>
                  <div className="detail-item__value">
                    {[request.delivery.addressLine, request.delivery.city, request.delivery.regionName].filter(Boolean).join(', ') ||
                      '—'}
                    {(request.delivery.contactName || request.delivery.contactPhone) && (
                      <div className="materials__muted">
                        {[request.delivery.contactName, request.delivery.contactPhone].filter(Boolean).join(' · ')}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {request.notes && (
                <div className="detail-item" style={{ marginTop: 16 }}>
                  <div className="detail-item__label">Notes</div>
                  <div className="detail-item__value">{request.notes}</div>
                </div>
              )}
              {request.changeRequestNote && (
                <div className="admin-note" style={{ marginTop: 16, marginBottom: 0 }}>
                  <strong>Changes requested by the consumer:</strong> {request.changeRequestNote}
                </div>
              )}
            </div>

            <div className="card">
              <h2 className="materials__section-title">Items</h2>
              <DataTable
                columns={[
                  { key: 'sequence', header: '#' },
                  {
                    key: 'name',
                    header: 'Material',
                    render: (item) => (
                      <div>
                        <div>{item.name || item.categoryName}</div>
                        <div className="materials__muted">
                          {[item.categoryName, item.brand, item.specification, item.grade, item.dimensions]
                            .filter(Boolean)
                            .join(' · ')}
                        </div>
                        {item.notes && <div className="materials__muted">{item.notes}</div>}
                      </div>
                    ),
                  },
                  { key: 'quantity', header: 'Quantity', render: (item) => formatQuantity(item.quantity, item.unit) },
                  { key: 'awarded', header: 'Awarded', render: (item) => formatQuantity(item.awardedQuantity, item.unit) },
                  { key: 'remaining', header: 'Remaining', render: (item) => formatQuantity(item.remainingQuantity, item.unit) },
                  {
                    key: 'estimate',
                    header: 'Estimate',
                    render: (item) => (item.estimatedTotal != null ? formatCurrency(item.estimatedTotal) : '—'),
                  },
                  { key: 'milestoneTitle', header: 'Milestone', render: (item) => item.milestoneTitle || '—' },
                ]}
                rows={request.items}
                rowKey={(item) => item.id}
                emptyMessage="No items."
              />
            </div>

            {request.attachments?.length > 0 && (
              <div className="card">
                <h2 className="materials__section-title">Attachments</h2>
                <ul>
                  {request.attachments.map((a) => (
                    <li key={a.id}>
                      <a href={a.fileUrl} target="_blank" rel="noreferrer">
                        {a.fileName || a.fileUrl}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="card">
              <h2 className="materials__section-title">Supplier orders</h2>
              <DataTable
                columns={supplierOrderColumns({ showRequest: false })}
                rows={orders.data}
                rowKey={(row) => row.id}
                isLoading={orders.isLoading}
                isError={orders.isError}
                errorMessage={orders.error?.message || 'Failed to load supplier orders.'}
                emptyMessage="No supplier orders for this request yet."
              />
            </div>
          </div>
        </>
      )}

      <div className="card" style={{ marginTop: 16 }}>
        <h2 className="materials__section-title">Audit trail</h2>
        {auditLoading && <div className="empty-state">Loading audit…</div>}
        {auditError && <div className="empty-state">{auditErr?.message || 'Failed to load the audit trail.'}</div>}
        {audit && audit.length === 0 && <div className="empty-state">No audit entries recorded.</div>}
        {audit && audit.length > 0 && (
          <ul className="materials__timeline">
            {audit.map((entry, index) => (
              <li key={`${entry.at}-${index}`}>
                <div className="materials__timeline-head">
                  <span>{entry.action}</span>
                  <span className="materials__timeline-time">
                    {formatDateTime(entry.at)}
                    {entry.actorUserId ? ` · user #${entry.actorUserId}` : ' · system'}
                  </span>
                </div>
                {entry.details && <div className="materials__timeline-note">{entry.details}</div>}
              </li>
            ))}
          </ul>
        )}
      </div>
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

export default MaterialRequestDetailPage;
