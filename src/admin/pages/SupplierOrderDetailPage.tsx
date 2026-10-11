import { useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Banknote, Lock, Package, Truck } from 'lucide-react';
import { useSupplierOrder } from '@/admin/api/materials';
import DataTable from '@/admin/components/DataTable';
import StatCard from '@/admin/components/StatCard';
import StatusBadge from '@/admin/components/StatusBadge';
import ResolveMaterialDisputeModal from '@/admin/components/ResolveMaterialDisputeModal';
import { holdStatusTone, humanize } from '@/admin/utils/constants';
import {
  deliveryIssueLabel,
  formatQuantity,
  materialDeliveryStatusTone,
  materialDisputeStatusTone,
  materialPaymentStatusLabel,
  materialPaymentStatusTone,
  purchasingAccountLabel,
  supplierOrderStatusTone,
} from '@/admin/utils/materialsConstants';
import { formatCurrency, formatDateTime } from '@/admin/utils/format';
import type { MaterialDisputeInfo } from '@/admin/materialsTypes';
import '@/admin/pages/materialsPages.scss';

function SupplierOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading, isError, error } = useSupplierOrder(id);
  const [resolving, setResolving] = useState<MaterialDisputeInfo | null>(null);

  const holdRemaining = order?.storeHold
    ? Number(order.storeHold.amount) - Number(order.storeHold.reversedAmount ?? 0)
    : null;

  return (
    <div>
      <Link to="/admin/supplier-orders" className="materials__back">
        <ArrowLeft size={16} />
        Back to supplier orders
      </Link>

      {isLoading && <div className="empty-state">Loading supplier order…</div>}
      {isError && <div className="empty-state">{error?.message || 'Failed to load the supplier order.'}</div>}

      {order && (
        <>
          <div className="page-header">
            <div>
              <h1>
                {order.number}
                <StatusBadge status={order.status} tone={supplierOrderStatusTone(order.status)} />
              </h1>
              <p>
                <Link to={`/admin/material-requests/${order.requestId}`}>{order.requestNumber}</Link> · {order.requestTitle}
              </p>
            </div>
          </div>

          <div className="stat-grid">
            <StatCard icon={<Banknote size={20} />} label="Order total" value={formatCurrency(order.totalAmount)} />
            <StatCard
              icon={<Package size={20} />}
              label="Payment"
              value={materialPaymentStatusLabel(order.paymentStatus)}
            />
            <StatCard icon={<Truck size={20} />} label="Delivery" value={humanize(order.deliveryStatus)} />
            <StatCard
              icon={<Lock size={20} />}
              label="Store hold"
              value={order.storeHold ? `${humanize(order.storeHold.status)} · ${formatCurrency(holdRemaining)}` : '—'}
            />
          </div>

          <div className="materials__sections">
            <div className="card">
              <h2 className="materials__section-title">Parties</h2>
              <div className="detail-grid">
                <Detail
                  label="Store"
                  value={order.store ? <Link to={`/admin/material-stores/${order.store.id}`}>{order.store.name}</Link> : null}
                />
                <Detail
                  label="Buyer"
                  value={`${order.buyerName} (${purchasingAccountLabel(order.purchasingAccountType)}, user #${order.buyerUserId})`}
                />
                <Detail
                  label="Project order"
                  value={order.projectOrderId ? <Link to={`/admin/orders/${order.projectOrderId}`}>#{order.projectOrderId}</Link> : null}
                />
                <Detail
                  label="Delivery address"
                  value={
                    order.deliveryAddress
                      ? [order.deliveryAddress.addressLine, order.deliveryAddress.city, order.deliveryAddress.regionName]
                          .filter(Boolean)
                          .join(', ')
                      : null
                  }
                />
                <Detail
                  label="Delivery contact"
                  value={
                    order.deliveryAddress
                      ? [order.deliveryAddress.contactName, order.deliveryAddress.contactPhone].filter(Boolean).join(' · ')
                      : null
                  }
                />
                <Detail label="Created" value={formatDateTime(order.createdAt)} />
                <Detail label="Funded" value={formatDateTime(order.fundedAt)} />
                <Detail label="Completed" value={formatDateTime(order.completedAt)} />
                {order.canceledAt && (
                  <Detail
                    label="Canceled"
                    value={`${formatDateTime(order.canceledAt)}${order.cancelReason ? ` · ${order.cancelReason}` : ''}`}
                  />
                )}
                {order.buyerRating != null && (
                  <Detail
                    label="Buyer review"
                    value={`${order.buyerRating}/5${order.buyerReview ? ` · ${order.buyerReview}` : ''}`}
                  />
                )}
              </div>
            </div>

            {order.disputes.length > 0 && (
              <div className="card">
                <h2 className="materials__section-title">Disputes</h2>
                <DataTable
                  columns={[
                    {
                      key: 'status',
                      header: 'Status',
                      render: (d) => <StatusBadge status={d.status} tone={materialDisputeStatusTone(d.status)} />,
                    },
                    {
                      key: 'reason',
                      header: 'Reason',
                      render: (d) => (
                        <div>
                          <div>{d.reason}</div>
                          <div className="materials__muted">
                            {d.openedByName || '—'} · {formatDateTime(d.openedAt)}
                          </div>
                        </div>
                      ),
                    },
                    {
                      key: 'resolution',
                      header: 'Resolution',
                      render: (d) =>
                        d.status === 'RESOLVED' ? (
                          <div>
                            <div>Refunded {formatCurrency(d.refundAmount)}</div>
                            {d.resolutionNote && <div className="materials__muted">{d.resolutionNote}</div>}
                            <div className="materials__muted">{formatDateTime(d.resolvedAt)}</div>
                          </div>
                        ) : (
                          '—'
                        ),
                    },
                    {
                      key: 'actions',
                      header: '',
                      render: (d) =>
                        d.status === 'OPEN' ? (
                          <button type="button" className="btn btn--primary btn--sm" onClick={() => setResolving(d)}>
                            Resolve
                          </button>
                        ) : null,
                    },
                  ]}
                  rows={order.disputes}
                  rowKey={(d) => d.id}
                />
              </div>
            )}

            <div className="card">
              <h2 className="materials__section-title">Items</h2>
              <p className="materials__section-note">
                Agreed prices are locked from the accepted quotation. The buyer pays only for what was received.
              </p>
              <DataTable
                columns={[
                  {
                    key: 'description',
                    header: 'Item',
                    render: (item) => (
                      <div>
                        <div>{item.description}</div>
                        {item.milestoneTitle && <div className="materials__muted">Milestone: {item.milestoneTitle}</div>}
                        {item.issueType && (
                          <div className="materials__issue">
                            {deliveryIssueLabel(item.issueType)}
                            {item.issueNote ? ` — ${item.issueNote}` : ''}
                          </div>
                        )}
                      </div>
                    ),
                  },
                  { key: 'accepted', header: 'Ordered', render: (item) => formatQuantity(item.acceptedQuantity, item.unit) },
                  {
                    key: 'agreedUnitPrice',
                    header: 'Unit price',
                    render: (item) => <span className="materials__nowrap">{formatCurrency(item.agreedUnitPrice)}</span>,
                  },
                  {
                    key: 'totalPrice',
                    header: 'Line total',
                    render: (item) => <span className="materials__nowrap">{formatCurrency(item.totalPrice)}</span>,
                  },
                  { key: 'delivered', header: 'Delivered', render: (item) => formatQuantity(item.deliveredQuantity, item.unit) },
                  {
                    key: 'received',
                    header: 'Received',
                    render: (item) => {
                      const short =
                        item.receivedQuantity != null &&
                        item.deliveredQuantity != null &&
                        Number(item.receivedQuantity) < Number(item.deliveredQuantity);
                      return (
                        <span className={short ? 'materials__issue' : undefined}>
                          {formatQuantity(item.receivedQuantity, item.unit)}
                        </span>
                      );
                    },
                  },
                ]}
                rows={order.items}
                rowKey={(item) => item.id}
                emptyMessage="No items."
              />
            </div>

            <div className="card">
              <h2 className="materials__section-title">Totals</h2>
              <dl className="materials__totals">
                <dt>Goods subtotal</dt>
                <dd>{formatCurrency(order.subtotal)}</dd>
                <dt>Delivery fee</dt>
                <dd>{formatCurrency(order.deliveryFee)}</dd>
                <dt>Tax</dt>
                <dd>{formatCurrency(order.taxAmount)}</dd>
                <dt>Discount</dt>
                <dd>−{formatCurrency(order.discountAmount)}</dd>
                <dt className="is-total">Total</dt>
                <dd className="is-total">{formatCurrency(order.totalAmount)}</dd>
              </dl>
            </div>

            <div className="card">
              <h2 className="materials__section-title">Payment (buyer wallet)</h2>
              {order.payment ? (
                <div className="detail-grid">
                  <Detail
                    label="Status"
                    value={
                      <StatusBadge
                        status={order.payment.status}
                        tone={materialPaymentStatusTone(order.payment.status)}
                        label={materialPaymentStatusLabel(order.payment.status, true)}
                      />
                    }
                  />
                  <Detail label="Reserved amount" value={formatCurrency(order.payment.amount)} />
                  <Detail label="Goods / delivery" value={`${formatCurrency(order.payment.goodsAmount)} / ${formatCurrency(order.payment.deliveryFee)}`} />
                  <Detail label="Settled to store" value={formatCurrency(order.payment.settledAmount)} />
                  <Detail label="Refunded to buyer" value={formatCurrency(order.payment.refundedAmount)} />
                  <Detail label="Reserved at" value={formatDateTime(order.payment.reservedAt)} />
                  <Detail label="Settled at" value={formatDateTime(order.payment.settledAt)} />
                  <Detail label="Refunded at" value={formatDateTime(order.payment.refundedAt)} />
                </div>
              ) : (
                <div className="empty-state">Not funded yet - nothing is reserved.</div>
              )}
            </div>

            <div className="card">
              <h2 className="materials__section-title">Store hold (store owner wallet)</h2>
              {order.storeHold ? (
                <div className="detail-grid">
                  <Detail
                    label="Status"
                    value={<StatusBadge status={order.storeHold.status} tone={holdStatusTone(order.storeHold.status)} />}
                  />
                  <Detail label="Held amount" value={formatCurrency(order.storeHold.amount)} />
                  <Detail label="Reversed (refunded to buyer)" value={formatCurrency(order.storeHold.reversedAmount ?? 0)} />
                  <Detail label="Remaining" value={formatCurrency(holdRemaining)} />
                  <Detail label="Hold started" value={formatDateTime(order.storeHold.holdStartAt)} />
                  <Detail label="Release date" value={formatDateTime(order.storeHold.releaseAt)} />
                  <Detail label="Released at" value={formatDateTime(order.storeHold.releasedAt)} />
                </div>
              ) : (
                <div className="empty-state">
                  No store hold yet - it starts when the buyer accepts the delivery (or a dispute is resolved).
                </div>
              )}
              {order.storeHold?.status === 'BLOCKED' && (
                <div className="admin-note" style={{ marginTop: 16, marginBottom: 0 }}>
                  The hold is blocked by an open dispute and won&rsquo;t be released until it is resolved.
                </div>
              )}
            </div>

            <div className="card">
              <h2 className="materials__section-title">Deliveries</h2>
              {order.deliveries.length === 0 ? (
                <div className="empty-state">No deliveries scheduled.</div>
              ) : (
                <ul className="materials__timeline">
                  {order.deliveries.map((delivery) => (
                    <li key={delivery.id}>
                      <div className="materials__timeline-head">
                        <span>Delivery #{delivery.id}</span>
                        <StatusBadge status={delivery.status} tone={materialDeliveryStatusTone(delivery.status)} />
                        {delivery.proofOfDeliveryUrl && (
                          <a href={delivery.proofOfDeliveryUrl} target="_blank" rel="noreferrer">
                            Proof of delivery
                          </a>
                        )}
                      </div>
                      <div className="materials__timeline-note">
                        Scheduled {formatDateTime(delivery.scheduledAt)} · Dispatched {formatDateTime(delivery.dispatchedAt)}{' '}
                        · Delivered {formatDateTime(delivery.deliveredAt)}
                      </div>
                      <div className="materials__timeline-note">
                        {delivery.items.map((i) => `${i.description} × ${formatQuantity(i.quantity)}`).join('; ')}
                      </div>
                      {(delivery.recipientName || delivery.contactName || delivery.contactPhone) && (
                        <div className="materials__timeline-note">
                          {delivery.recipientName && `Received by ${delivery.recipientName}`}
                          {delivery.recipientName && (delivery.contactName || delivery.contactPhone) && ' · '}
                          {[delivery.contactName, delivery.contactPhone].filter(Boolean).join(' ')}
                        </div>
                      )}
                      {delivery.note && <div className="materials__timeline-note">{delivery.note}</div>}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="card">
              <h2 className="materials__section-title">History</h2>
              {order.history.length === 0 ? (
                <div className="empty-state">No history recorded.</div>
              ) : (
                <ul className="materials__timeline">
                  {order.history.map((entry, index) => (
                    <li key={`${entry.at}-${index}`}>
                      <div className="materials__timeline-head">
                        <span>{humanize(entry.action)}</span>
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

          {resolving && <ResolveMaterialDisputeModal order={order} dispute={resolving} onClose={() => setResolving(null)} />}
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

export default SupplierOrderDetailPage;
