import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDisputes } from '@/admin/api/disputes';
import DataTable, { type DataTableColumn } from '@/admin/components/DataTable';
import StatusBadge from '@/admin/components/StatusBadge';
import ResolveDisputeModal from '@/admin/components/ResolveDisputeModal';
import { DISPUTE_STATUSES, disputeStatusTone, humanize } from '@/admin/utils/constants';
import { formatCurrency, formatDateTime } from '@/admin/utils/format';
import type { MilestoneDisputeResponse } from '@/admin/types';
import type { DisputeStatus } from '@/types/enums';

function DisputesPage() {
  const [status, setStatus] = useState<DisputeStatus | ''>('OPEN');
  const [page, setPage] = useState(0);
  const [target, setTarget] = useState<MilestoneDisputeResponse | null>(null);

  const { data, isLoading, isError, error } = useDisputes({ status: status || undefined, page, size: 20 });

  const columns: DataTableColumn<MilestoneDisputeResponse>[] = [
    { key: 'orderId', header: 'Order', render: (row) => <Link to={`/admin/orders/${row.orderId}`}>#{row.orderId}</Link> },
    {
      key: 'milestoneTitle',
      header: 'Milestone',
      render: (row) => (
        <div>
          <div>{row.milestoneTitle}</div>
          <div className="field__hint">#{row.milestoneId}</div>
        </div>
      ),
    },
    { key: 'amount', header: 'Amount', render: (row) => formatCurrency(row.amount) },
    { key: 'openedByName', header: 'Opened by' },
    { key: 'reason', header: 'Reason' },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <div>
          <StatusBadge status={row.status} tone={disputeStatusTone(row.status)} />
          {row.resolutionNote && <div className="field__hint">{row.resolutionNote}</div>}
        </div>
      ),
    },
    { key: 'openedAt', header: 'Opened', render: (row) => formatDateTime(row.openedAt) },
    { key: 'resolvedAt', header: 'Resolved', render: (row) => formatDateTime(row.resolvedAt) },
    {
      key: 'actions',
      header: '',
      render: (row) =>
        row.status === 'OPEN' ? (
          <button type="button" className="btn btn--primary btn--sm" onClick={() => setTarget(row)}>
            Resolve
          </button>
        ) : null,
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Disputes</h1>
          <p>
            Milestones disputed by the customer or the contractor. While a dispute is open the milestone's money stays
            locked (reserved, or blocked in the contractor's hold).
          </p>
        </div>
      </div>

      <div className="filter-bar">
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as DisputeStatus | '');
            setPage(0);
          }}
        >
          <option value="">All statuses</option>
          {DISPUTE_STATUSES.map((option) => (
            <option key={option} value={option}>
              {humanize(option)}
            </option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        rows={data?.items}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        isError={isError}
        errorMessage={error?.message}
        emptyMessage="No disputes match this filter."
        page={data?.page ?? page}
        totalPages={data?.totalPages ?? 1}
        totalElements={data?.totalElements ?? 0}
        onPageChange={setPage}
      />

      {target && (
        <ResolveDisputeModal
          orderId={target.orderId}
          milestoneId={target.milestoneId}
          milestoneTitle={target.milestoneTitle}
          amount={target.amount}
          reason={target.reason}
          openedByName={target.openedByName}
          onClose={() => setTarget(null)}
        />
      )}
    </div>
  );
}

export default DisputesPage;
