import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCompanies } from '@/admin/api/companies';
import DataTable, { type DataTableColumn } from '@/admin/components/DataTable';
import StatusBadge from '@/admin/components/StatusBadge';
import CompanyLogo from '@/admin/components/CompanyLogo';
import VerifyCompanyModal from '@/admin/components/VerifyCompanyModal';
import { VERIFICATION_STATUSES, humanize, verificationStatusTone } from '@/admin/utils/constants';
import { formatDateTime } from '@/admin/utils/format';
import type { CompanySummaryResponse } from '@/admin/types';
import type { VerificationStatus } from '@/types/enums';
import '@/admin/pages/companiesPage.scss';

function CompaniesPage() {
  const [status, setStatus] = useState<VerificationStatus | ''>('');
  const [page, setPage] = useState(0);
  const [target, setTarget] = useState<CompanySummaryResponse | null>(null);

  const { data, isLoading, isError, error } = useCompanies({ status: status || undefined, page, size: 20 });

  const columns: DataTableColumn<CompanySummaryResponse>[] = [
    { key: 'logoUrl', header: 'Logo', render: (row) => <CompanyLogo logoUrl={row.logoUrl} /> },
    {
      key: 'companyName',
      header: 'Company',
      render: (row) => <Link to={`/admin/companies/${row.id}`}>{row.companyName}</Link>,
    },
    { key: 'ownerName', header: 'Owner' },
    {
      key: 'contact',
      header: 'Contact',
      render: (row) => (
        <div>
          <div>{row.ownerEmail}</div>
          <div>{row.ownerPhone}</div>
        </div>
      ),
    },
    { key: 'city', header: 'City' },
    {
      key: 'verificationStatus',
      header: 'Status',
      render: (row) => <StatusBadge status={row.verificationStatus} tone={verificationStatusTone(row.verificationStatus)} />,
    },
    { key: 'totalJobsCompleted', header: 'Jobs Done' },
    { key: 'rating', header: 'Rating', render: (row) => row.rating ?? '—' },
    { key: 'createdAt', header: 'Created', render: (row) => formatDateTime(row.createdAt) },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <button type="button" className="btn btn--secondary btn--sm" onClick={() => setTarget(row)}>
          Review
        </button>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Companies</h1>
          <p>Contractor companies awaiting or holding verification.</p>
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
          <option value="">All statuses</option>
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
        emptyMessage="No companies match this filter."
        page={data?.page ?? page}
        totalPages={data?.totalPages ?? 1}
        totalElements={data?.totalElements ?? 0}
        onPageChange={setPage}
      />

      {target && <VerifyCompanyModal company={target} onClose={() => setTarget(null)} />}
    </div>
  );
}

export default CompaniesPage;
