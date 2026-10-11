import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMaterialRequests } from '@/admin/api/materials';
import DataTable, { type DataTableColumn } from '@/admin/components/DataTable';
import StatusBadge from '@/admin/components/StatusBadge';
import { humanize } from '@/admin/utils/constants';
import {
  MATERIAL_REQUEST_STATUSES,
  materialRequestStatusTone,
  purchasingAccountLabel,
} from '@/admin/utils/materialsConstants';
import { formatDateTime } from '@/admin/utils/format';
import type { MaterialRequestResponse, MaterialRequestStatus } from '@/admin/materialsTypes';
import '@/admin/pages/materialsPages.scss';

function MaterialRequestsPage() {
  const [status, setStatus] = useState<MaterialRequestStatus | ''>('');
  const [page, setPage] = useState(0);

  const { data, isLoading, isError, error } = useMaterialRequests({ status: status || undefined, page, size: 20 });

  const columns: DataTableColumn<MaterialRequestResponse>[] = [
    {
      key: 'number',
      header: 'Request',
      render: (row) => (
        <div>
          <Link to={`/admin/material-requests/${row.id}`} className="materials__nowrap">
            {row.number}
          </Link>
          <div className="materials__muted">{row.title}</div>
        </div>
      ),
    },
    {
      key: 'buyer',
      header: 'Buyer',
      render: (row) => (
        <div>
          <div>{row.buyerCompany?.name || row.buyer?.name || '—'}</div>
          <div className="materials__muted">{purchasingAccountLabel(row.purchasingAccountType)}</div>
        </div>
      ),
    },
    {
      key: 'proposedBy',
      header: 'Proposed by',
      render: (row) =>
        row.proposedByCompany ? (
          <Link to={`/admin/companies/${row.proposedByCompany.id}`}>{row.proposedByCompany.name}</Link>
        ) : (
          '—'
        ),
    },
    {
      key: 'projectOrderId',
      header: 'Project order',
      render: (row) => (row.projectOrderId ? <Link to={`/admin/orders/${row.projectOrderId}`}>#{row.projectOrderId}</Link> : '—'),
    },
    { key: 'items', header: 'Items', render: (row) => row.items?.length ?? 0 },
    { key: 'quotationCount', header: 'Quotes' },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} tone={materialRequestStatusTone(row.status)} />,
    },
    {
      key: 'dates',
      header: 'Published / expires',
      render: (row) => (
        <div className="materials__nowrap">
          <div>{formatDateTime(row.publishedAt)}</div>
          <div className="materials__muted">{row.expiresAt ? `Expires ${formatDateTime(row.expiresAt)}` : '—'}</div>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Material requests</h1>
          <p>Buyer requests for construction materials (MAT-…), direct or proposed by a contractor inside an order.</p>
        </div>
      </div>

      <div className="filter-bar">
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as MaterialRequestStatus | '');
            setPage(0);
          }}
        >
          <option value="">All statuses</option>
          {MATERIAL_REQUEST_STATUSES.map((option) => (
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
        emptyMessage="No material requests match this filter."
        page={data?.page ?? page}
        totalPages={data?.totalPages ?? 1}
        totalElements={data?.totalElements ?? 0}
        onPageChange={setPage}
      />
    </div>
  );
}

export default MaterialRequestsPage;
