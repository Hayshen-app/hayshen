import { useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useOrder, useOrderBids } from '@/admin/api/orders';
import DataTable from '@/admin/components/DataTable';
import StatusBadge from '@/admin/components/StatusBadge';
import DispatchModal from '@/admin/pages/DispatchModal';
import { DISPATCHABLE_ORDER_STATUSES, orderBidStatusTone, orderStatusTone } from '@/admin/utils/constants';
import { formatCurrency, formatDateTime } from '@/admin/utils/format';
import '@/admin/pages/orderDetailPage.scss';

function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading, isError, error } = useOrder(id);
  const { data: bids, isLoading: bidsLoading, isError: bidsError } = useOrderBids(id);
  const [showDispatch, setShowDispatch] = useState(false);

  return (
    <div>
      <Link to="/admin/orders" className="order-detail__back">
        <ArrowLeft size={16} />
        Back to orders
      </Link>

      {isLoading && <div className="empty-state">Loading order…</div>}
      {isError && <div className="empty-state">{error?.message || 'Failed to load order.'}</div>}

      {order && (
        <>
          <div className="page-header">
            <div>
              <h1>
                Order #{order.id} <StatusBadge status={order.status} tone={orderStatusTone(order.status)} />
              </h1>
              <p>
                Created {formatDateTime(order.createdAt)} · Updated {formatDateTime(order.updatedAt)}
              </p>
            </div>
            {DISPATCHABLE_ORDER_STATUSES.includes(order.status) && (
              <button type="button" className="btn btn--primary" onClick={() => setShowDispatch(true)}>
                Dispatch to company
              </button>
            )}
          </div>

          <div className="order-detail__grid">
            <div className="card">
              <h2 className="order-detail__section-title">Customer</h2>
              <div className="detail-grid">
                <Detail label="Name" value={order.customerName} />
                <Detail label="Phone" value={order.customerPhone} />
              </div>
            </div>

            <div className="card">
              <h2 className="order-detail__section-title">Service</h2>
              <div className="detail-grid">
                <Detail label="Category" value={order.categoryName} />
                <Detail label="Service item" value={order.serviceItemName || '—'} />
                <Detail label="Description" value={order.description || '—'} />
              </div>
            </div>

            <div className="card">
              <h2 className="order-detail__section-title">Address & schedule</h2>
              <div className="detail-grid">
                <Detail label="Address" value={[order.addressLine1, order.addressLine2].filter(Boolean).join(', ') || '—'} />
                <Detail label="City" value={order.addressCity} />
                <Detail label="Scheduled" value={formatDateTime(order.scheduledAt)} />
                <Detail label="Estimated delivery" value={formatDateTime(order.estimatedDeliveryAt)} />
              </div>
            </div>

            <div className="card">
              <h2 className="order-detail__section-title">Assignment & pricing</h2>
              <div className="detail-grid">
                <Detail label="Company" value={order.assignedCompanyName || 'Not assigned'} />
                <Detail label="Worker" value={order.assignedWorkerName || 'Not assigned'} />
                <Detail label="Final price" value={formatCurrency(order.finalPrice)} />
                <Detail label="Customer confirmed done" value={order.customerConfirmedDone ? 'Yes' : 'No'} />
                <Detail label="Company confirmed done" value={order.companyConfirmedDone ? 'Yes' : 'No'} />
              </div>
            </div>

            <div className="card">
              <h2 className="order-detail__section-title">Company bids</h2>
              <DataTable
                columns={[
                  { key: 'companyName', header: 'Company' },
                  {
                    key: 'companyRating',
                    header: 'Rating',
                    render: (bid) =>
                      bid.companyRating == null ? '—' : `${bid.companyRating.toFixed(1)} (${bid.companyRatingCount})`,
                  },
                  { key: 'price', header: 'Price', render: (bid) => formatCurrency(bid.price) },
                  {
                    key: 'estimatedDeliveryAt',
                    header: 'Estimated delivery',
                    render: (bid) => formatDateTime(bid.estimatedDeliveryAt),
                  },
                  { key: 'note', header: 'Note', render: (bid) => bid.note || '—' },
                  {
                    key: 'status',
                    header: 'Status',
                    render: (bid) => <StatusBadge status={bid.status} tone={orderBidStatusTone(bid.status)} />,
                  },
                  { key: 'createdAt', header: 'Placed at', render: (bid) => formatDateTime(bid.createdAt) },
                ]}
                rows={bids}
                rowKey={(bid) => bid.id}
                isLoading={bidsLoading}
                isError={bidsError}
                errorMessage="Failed to load bids."
                emptyMessage="No bids placed on this order yet."
              />
            </div>

            {(order.rejectReason || order.cancelReason) && (
              <div className="card">
                <h2 className="order-detail__section-title">Reasons</h2>
                <div className="detail-grid">
                  {order.rejectReason && <Detail label="Reject reason" value={order.rejectReason} />}
                  {order.cancelReason && <Detail label="Cancel reason" value={order.cancelReason} />}
                  {order.cancelledAt && <Detail label="Cancelled at" value={formatDateTime(order.cancelledAt)} />}
                </div>
              </div>
            )}

            {order.imageUrls.length > 0 && (
              <div className="card">
                <h2 className="order-detail__section-title">Images</h2>
                <div className="order-detail__images">
                  {order.imageUrls.map((url) => (
                    <a key={url} href={url} target="_blank" rel="noreferrer">
                      <img src={url} alt="Order attachment" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="card">
              <h2 className="order-detail__section-title">Status history</h2>
              {order.history.length > 0 ? (
                <ul className="order-detail__timeline">
                  {order.history.map((entry, index) => (
                    <li key={`${entry.status}-${entry.changedAt}-${index}`}>
                      <StatusBadge status={entry.status} tone={orderStatusTone(entry.status)} />
                      <span className="order-detail__timeline-time">{formatDateTime(entry.changedAt)}</span>
                      {entry.note && <span className="order-detail__timeline-note">{entry.note}</span>}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="empty-state">No history recorded.</div>
              )}
            </div>
          </div>

          {showDispatch && <DispatchModal order={order} onClose={() => setShowDispatch(false)} />}
        </>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="detail-item">
      <div className="detail-item__label">{label}</div>
      <div className="detail-item__value">{value}</div>
    </div>
  );
}

export default OrderDetailPage;
