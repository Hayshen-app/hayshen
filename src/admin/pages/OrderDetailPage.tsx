import { useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Banknote, Handshake, Milestone, Receipt } from 'lucide-react';
import { useOrder, useOrderBids } from '@/admin/api/orders';
import { useOrderPayments } from '@/admin/api/withdrawals';
import DataTable from '@/admin/components/DataTable';
import StatCard from '@/admin/components/StatCard';
import StatusBadge from '@/admin/components/StatusBadge';
import DispatchModal from '@/admin/pages/DispatchModal';
import { DISPATCHABLE_ORDER_STATUSES, humanize, orderBidStatusTone, orderStatusTone } from '@/admin/utils/constants';
import { formatCurrency, formatDateTime } from '@/admin/utils/format';
import '@/admin/pages/orderDetailPage.scss';

function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading, isError, error } = useOrder(id);
  const { data: bids, isLoading: bidsLoading, isError: bidsError } = useOrderBids(id);
  const { data: payments, isLoading: paymentsLoading, isError: paymentsError } = useOrderPayments(
    order ? Number(order.id) : undefined,
  );
  const [showDispatch, setShowDispatch] = useState(false);

  const milestonesDone = order?.milestones.filter((m) => m.status === 'DONE').length ?? 0;

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

          <div className="stat-grid">
            <StatCard icon={<Banknote size={20} />} label="Agreed price" value={formatCurrency(order.finalPrice)} />
            <StatCard icon={<Handshake size={20} />} label="Bids received" value={String(bids?.length ?? 0)} />
            <StatCard
              icon={<Milestone size={20} />}
              label="Milestones done"
              value={order.milestones.length ? `${milestonesDone} / ${order.milestones.length}` : '—'}
            />
            <StatCard icon={<Receipt size={20} />} label="Payments recorded" value={String(payments?.length ?? 0)} />
          </div>

          <div className="order-detail__sections">
            <div className="card">
              <h2 className="order-detail__section-title">Order summary</h2>
              <div className="order-detail__summary-groups">
                <div>
                  <h3 className="order-detail__group-title">Customer</h3>
                  <div className="detail-grid">
                    <Detail label="Name" value={order.customerName} />
                    <Detail label="Phone" value={order.customerPhone} />
                  </div>
                </div>

                <div>
                  <h3 className="order-detail__group-title">Service</h3>
                  <div className="detail-grid">
                    <Detail label="Category" value={order.categoryName} />
                    <Detail label="Service item" value={order.serviceItemName || '—'} />
                    <Detail label="Description" value={order.description || '—'} />
                  </div>
                </div>

                <div>
                  <h3 className="order-detail__group-title">Address & schedule</h3>
                  <div className="detail-grid">
                    <Detail
                      label="Address"
                      value={[order.addressLine1, order.addressLine2].filter(Boolean).join(', ') || '—'}
                    />
                    <Detail label="City" value={order.addressCity} />
                    <Detail label="Scheduled" value={formatDateTime(order.scheduledAt)} />
                    <Detail label="Estimated delivery" value={formatDateTime(order.estimatedDeliveryAt)} />
                  </div>
                </div>

                <div>
                  <h3 className="order-detail__group-title">Assignment & pricing</h3>
                  <div className="detail-grid">
                    <Detail label="Order type" value={humanize(order.orderType)} />
                    <Detail label="Company" value={order.assignedCompanyName || 'Not assigned'} />
                    <Detail label="Worker" value={order.assignedWorkerName || 'Not assigned'} />
                    <Detail label="Customer confirmed done" value={order.customerConfirmedDone ? 'Yes' : 'No'} />
                    <Detail label="Company confirmed done" value={order.companyConfirmedDone ? 'Yes' : 'No'} />
                  </div>
                </div>
              </div>
            </div>

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
                  {
                    key: 'result',
                    header: '',
                    render: (bid) =>
                      order.assignedCompanyId === bid.companyId ? <StatusBadge status="Winner" tone="success" /> : null,
                  },
                ]}
                rows={bids}
                rowKey={(bid) => bid.id}
                isLoading={bidsLoading}
                isError={bidsError}
                errorMessage="Failed to load bids."
                emptyMessage="No bids placed on this order yet."
              />
            </div>

            {order.milestones.length > 0 && (
              <div className="card">
                <h2 className="order-detail__section-title">Payment plan (milestones)</h2>
                <p className="order-detail__section-note">
                  {milestonesDone} of {order.milestones.length} phases paid out ·{' '}
                  {formatCurrency(order.milestones.reduce((sum, m) => sum + m.amount, 0))} total across all phases
                </p>
                <DataTable
                  columns={[
                    { key: 'sequence', header: '#' },
                    { key: 'title', header: 'Phase' },
                    { key: 'amount', header: 'Amount', render: (m) => formatCurrency(m.amount) },
                    {
                      key: 'status',
                      header: 'Status',
                      render: (m) => <StatusBadge status={m.status} tone={m.status === 'DONE' ? 'success' : 'warning'} />,
                    },
                    {
                      key: 'customerConfirmedDone',
                      header: 'Customer confirmed',
                      render: (m) => (m.customerConfirmedDone ? 'Yes' : 'No'),
                    },
                    {
                      key: 'companyConfirmedDone',
                      header: 'Company confirmed',
                      render: (m) => (m.companyConfirmedDone ? 'Yes' : 'No'),
                    },
                    { key: 'createdAt', header: 'Proposed at', render: (m) => formatDateTime(m.createdAt) },
                  ]}
                  rows={order.milestones}
                  rowKey={(m) => m.id}
                  emptyMessage="No payment phases defined for this order."
                />
              </div>
            )}

            <div className="card">
              <h2 className="order-detail__section-title">Payments</h2>
              <DataTable
                columns={[
                  {
                    key: 'type',
                    header: 'Type',
                    render: (tx) => (
                      <StatusBadge status={tx.type} tone={tx.type === 'RELEASE' || tx.type === 'REFUND' ? 'success' : 'neutral'} />
                    ),
                  },
                  { key: 'ownerName', header: 'Wallet owner' },
                  {
                    key: 'amount',
                    header: 'Amount',
                    render: (tx) => (
                      <span className={tx.amount < 0 ? 'order-detail__amount--negative' : 'order-detail__amount--positive'}>
                        {tx.amount > 0 ? '+' : ''}
                        {formatCurrency(tx.amount)}
                      </span>
                    ),
                  },
                  { key: 'availableAt', header: 'Available at', render: (tx) => formatDateTime(tx.availableAt) },
                  { key: 'createdAt', header: 'Recorded at', render: (tx) => formatDateTime(tx.createdAt) },
                ]}
                rows={payments}
                rowKey={(tx) => tx.id}
                isLoading={paymentsLoading}
                isError={paymentsError}
                errorMessage="Failed to load payment history."
                emptyMessage="No wallet activity recorded for this order yet."
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
