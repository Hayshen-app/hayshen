import { useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Banknote, Handshake, Milestone, Receipt } from 'lucide-react';
import { useOrder, useOrderBids } from '@/admin/api/orders';
import { useOrderMilestonePlan, useOrderPayments } from '@/admin/api/withdrawals';
import DataTable from '@/admin/components/DataTable';
import ResolveDisputeModal from '@/admin/components/ResolveDisputeModal';
import { ledgerColumns } from '@/admin/components/WalletPanel';
import StatCard from '@/admin/components/StatCard';
import StatusBadge from '@/admin/components/StatusBadge';
import DispatchModal from '@/admin/pages/DispatchModal';
import {
  DISPATCHABLE_ORDER_STATUSES,
  disputeStatusTone,
  holdStatusTone,
  humanize,
  milestoneStatusLabel,
  milestoneStatusTone,
  orderBidStatusTone,
  orderStatusTone,
  orderTypeLabel,
  paymentStatusTone,
} from '@/admin/utils/constants';
import { formatCurrency, formatDate, formatDateTime } from '@/admin/utils/format';
import type { OrderMilestoneResponse } from '@/admin/types';
import '@/admin/pages/orderDetailPage.scss';

function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading, isError, error } = useOrder(id);
  const { data: bids, isLoading: bidsLoading, isError: bidsError } = useOrderBids(id);
  const { data: payments, isLoading: paymentsLoading, isError: paymentsError } = useOrderPayments(
    order ? Number(order.id) : undefined,
  );
  const {
    data: plan,
    isLoading: planLoading,
    isError: planError,
    error: planErrorDetail,
  } = useOrderMilestonePlan(order ? Number(order.id) : undefined);
  const [showDispatch, setShowDispatch] = useState(false);
  const [disputeTarget, setDisputeTarget] = useState<OrderMilestoneResponse | null>(null);

  const milestones = plan?.milestones ?? order?.milestones ?? [];
  const milestonesPaid = milestones.filter((m) => m.status === 'PAID').length;

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
              label="Milestones paid"
              value={milestones.length ? `${milestonesPaid} / ${milestones.length}` : '—'}
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
                    <Detail label="Order type" value={orderTypeLabel(order.orderType)} />
                    {(order.plannedStartDate || order.plannedEndDate) && (
                      <Detail
                        label="Planned period"
                        value={`${formatDate(order.plannedStartDate)} → ${formatDate(order.plannedEndDate)}`}
                      />
                    )}
                    <Detail label="Milestone plan" value={humanize(order.milestonePlanStatus) || '—'} />
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
                  {
                    key: 'price',
                    header: 'Price',
                    render: (bid) =>
                      bid.milestones?.length ? (
                        <details className="order-detail__bid-milestones">
                          <summary>
                            {formatCurrency(bid.price)}{' '}
                            <span className="order-detail__muted">({bid.milestones.length} milestones)</span>
                          </summary>
                          <ol>
                            {[...bid.milestones]
                              .sort((a, b) => a.sequence - b.sequence)
                              .map((m) => (
                                <li key={m.sequence}>
                                  <strong>{m.title}</strong> — {formatCurrency(m.amount)}
                                  {(m.startDate || m.dueDate) && (
                                    <div className="order-detail__muted">
                                      {formatDate(m.startDate)} → {formatDate(m.dueDate)}
                                    </div>
                                  )}
                                  {m.description && <div className="order-detail__muted">{m.description}</div>}
                                </li>
                              ))}
                          </ol>
                        </details>
                      ) : (
                        formatCurrency(bid.price)
                      ),
                  },
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

            <div className="card">
              <h2 className="order-detail__section-title">Milestones & payments</h2>
              {planLoading && <div className="table-state">Loading milestone plan…</div>}
              {planError && (
                <div className="table-state table-state--error">
                  {planErrorDetail?.message || 'Failed to load the milestone plan.'}
                </div>
              )}
              {plan && (
                <>
                  <div className="detail-grid" style={{ marginBottom: 14 }}>
                    <Detail
                      label="Plan status"
                      value={
                        <>
                          {humanize(plan.planStatus) || '—'}
                          {plan.planApprovedAt && (
                            <div className="order-detail__muted">Approved {formatDateTime(plan.planApprovedAt)}</div>
                          )}
                          {plan.planRejectionReason && (
                            <div className="order-detail__muted">Rejected: {plan.planRejectionReason}</div>
                          )}
                        </>
                      }
                    />
                    <Detail label="Plan total (estimated)" value={formatCurrency(plan.totalEstimatedAmount)} />
                    <Detail label="Paid by customer" value={formatCurrency(plan.paidAmount)} />
                    <Detail label="Remaining unpaid" value={formatCurrency(plan.remainingUnpaidAmount)} />
                    <Detail
                      label="Paid / awaiting payment / upcoming"
                      value={`${plan.completedMilestones} / ${plan.awaitingPaymentMilestones} / ${plan.upcomingMilestones}`}
                    />
                    <Detail
                      label="Payment due now"
                      value={
                        plan.nextPayableMilestoneId
                          ? `#${plan.milestones.find((m) => m.id === plan.nextPayableMilestoneId)?.sequence ?? '?'} (id ${plan.nextPayableMilestoneId})`
                          : '—'
                      }
                    />
                  </div>
                  <p className="order-detail__section-note">
                    Pay after completion: the plan total is what the live plan will cost, not money paid. The contractor
                    completes a milestone, the customer confirms it (payment due), then pays it; the payment goes into the
                    contractor's 7-day hold before becoming withdrawable.
                  </p>
                  <DataTable
                    columns={[
                      { key: 'sequence', header: '#' },
                      {
                        key: 'title',
                        header: 'Milestone',
                        render: (m) => (
                          <div>
                            <div>{m.title}</div>
                            {(m.startDate || m.dueDate) && (
                              <div className="order-detail__muted">
                                {formatDate(m.startDate)} → {formatDate(m.dueDate)}
                              </div>
                            )}
                            {m.revisionNote && <div className="order-detail__muted">Revision: {m.revisionNote}</div>}
                          </div>
                        ),
                      },
                      { key: 'amount', header: 'Amount', render: (m) => formatCurrency(m.amount) },
                      {
                        key: 'status',
                        header: 'Status',
                        render: (m) => <StatusBadge status={m.status} tone={milestoneStatusTone(m.status)} label={milestoneStatusLabel(m.status)} />,
                      },
                      {
                        key: 'payment',
                        header: 'Payment',
                        render: (m) =>
                          m.payment ? (
                            <div>
                              <StatusBadge status={m.payment.status} tone={paymentStatusTone(m.payment.status)} />
                              <div className="order-detail__muted">
                                {m.payment.providerReference || `#${m.payment.id}`} · paid {formatDateTime(m.payment.paidAt ?? m.paidAt)}
                              </div>
                            </div>
                          ) : (
                            <span className="order-detail__muted">
                              {m.status === 'ACCEPTED' ? 'Payment due' : 'Not paid'}
                            </span>
                          ),
                      },
                      {
                        key: 'hold',
                        header: 'Contractor hold',
                        render: (m) =>
                          m.hold ? (
                            <div>
                              <StatusBadge status={m.hold.status} tone={holdStatusTone(m.hold.status)} />
                              <div className="order-detail__muted">releases {formatDateTime(m.hold.releaseAt)}</div>
                            </div>
                          ) : (
                            '—'
                          ),
                      },
                      {
                        key: 'dispute',
                        header: 'Dispute',
                        render: (m) =>
                          m.dispute ? (
                            <div>
                              <StatusBadge status={m.dispute.status} tone={disputeStatusTone(m.dispute.status)} />
                              <div className="order-detail__muted">
                                Opened by {m.dispute.openedByName || (m.dispute.openedByUserId ? `user #${m.dispute.openedByUserId}` : '—')}
                                {m.dispute.openedAt && ` · ${formatDateTime(m.dispute.openedAt)}`}
                              </div>
                              {m.dispute.reason && <div className="order-detail__muted">{m.dispute.reason}</div>}
                              {m.dispute.resolutionNote && (
                                <div className="order-detail__muted">Resolution: {m.dispute.resolutionNote}</div>
                              )}
                              {m.dispute.status === 'OPEN' && (
                                <button
                                  type="button"
                                  className="btn btn--primary btn--sm"
                                  style={{ marginTop: 6 }}
                                  onClick={() => setDisputeTarget(m)}
                                >
                                  Resolve
                                </button>
                              )}
                            </div>
                          ) : (
                            '—'
                          ),
                      },
                    ]}
                    rows={plan.milestones}
                    rowKey={(m) => m.id}
                    emptyMessage="No milestones defined for this order yet."
                  />
                </>
              )}
            </div>

            <div className="card">
              <h2 className="order-detail__section-title">Ledger</h2>
              <DataTable
                columns={ledgerColumns({ showOwner: true, showOrder: false })}
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

          {showDispatch && <DispatchModal order={order} bids={bids} onClose={() => setShowDispatch(false)} />}
          {disputeTarget && (
            <ResolveDisputeModal
              orderId={order.id}
              milestoneId={disputeTarget.id}
              milestoneTitle={disputeTarget.title}
              amount={disputeTarget.amount}
              reason={disputeTarget.dispute?.reason}
              openedByName={disputeTarget.dispute?.openedByName}
              paid={disputeTarget.payment != null && disputeTarget.payment.status !== 'REFUNDED'}
              onClose={() => setDisputeTarget(null)}
            />
          )}
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
