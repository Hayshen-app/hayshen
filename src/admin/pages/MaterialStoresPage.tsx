import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMaterialStores } from '@/admin/api/materials';
import DataTable, { type DataTableColumn } from '@/admin/components/DataTable';
import StatusBadge from '@/admin/components/StatusBadge';
import { VERIFICATION_STATUSES, humanize, verificationStatusTone } from '@/admin/utils/constants';
import { materialStoreStatusTone } from '@/admin/utils/materialsConstants';
import { formatDateTime } from '@/admin/utils/format';
import type { StoreResponse } from '@/admin/materialsTypes';
import type { VerificationStatus } from '@/types/enums';
import '@/admin/pages/materialsPages.scss';

function MaterialStoresPage() {
  const [status, setStatus] = useState<VerificationStatus | ''>('PENDING');
  const [page, setPage] = useState(0);

  const { data, isLoading, isError, error } = useMaterialStores({ status: status || undefined, page, size: 20 });

  const columns: DataTableColumn<StoreResponse>[] = [
    {
      key: 'name',
      header: 'Store',
      render: (row) => (
        <div>
          <Link to={`/admin/material-stores/${row.id}`}>{row.name}</Link>
          {row.legalName && <div className="materials__muted">{row.legalName}</div>}
          {row.companyId && <div className="materials__muted">Company store</div>}
        </div>
      ),
    },
    {
      key: 'registration',
      header: 'Reg. no / Tax ID',
      render: (row) => (
        <div>
          <div>{row.registrationNumber}</div>
          <div className="materials__muted">{row.taxId}</div>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (row) => (
        <div>
          <div className="materials__nowrap">{row.phone}</div>
          {row.email && <div className="materials__muted">{row.email}</div>}
        </div>
      ),
    },
    {
      key: 'verificationStatus',
      header: 'Verification',
      render: (row) => <StatusBadge status={row.verificationStatus} tone={verificationStatusTone(row.verificationStatus)} />,
    },
    {
      key: 'status',
      header: 'Store status',
      render: (row) => <StatusBadge status={row.status} tone={materialStoreStatusTone(row.status)} />,
    },
    {
      key: 'rating',
      header: 'Rating',
      render: (row) => (row.ratingCount > 0 && row.rating != null ? `${Number(row.rating).toFixed(2)} (${row.ratingCount})` : '—'),
    },
    { key: 'createdAt', header: 'Created', render: (row) => formatDateTime(row.createdAt) },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <Link to={`/admin/material-stores/${row.id}`} className="btn btn--secondary btn--sm">
          Review
        </Link>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Material stores</h1>
          <p>Construction material stores. Only Verified and Active stores can open the marketplace and quote.</p>
        </div>
      </div>

      <div className="filter-bar">
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as VerificationStatus | '');
            setPage(0);
          }}
        >
          <option value="">All verification statuses</option>
          {VERIFICATION_STATUSES.map((option) => (
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
        emptyMessage="No stores match this filter."
        page={data?.page ?? page}
        totalPages={data?.totalPages ?? 1}
        totalElements={data?.totalElements ?? 0}
        onPageChange={setPage}
      />
    </div>
  );
}

export default MaterialStoresPage;
