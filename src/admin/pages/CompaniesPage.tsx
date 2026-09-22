import { useState, type FormEvent } from 'react';
import { useCompanies, useVerifyCompany } from '@/admin/api/companies';
import DataTable, { type DataTableColumn } from '@/admin/components/DataTable';
import StatusBadge from '@/admin/components/StatusBadge';
import Modal from '@/admin/components/Modal';
import { VERIFICATION_STATUSES, humanize, verificationStatusTone } from '@/admin/utils/constants';
import { formatDateTime } from '@/admin/utils/format';
import { ApiError } from '@/api/client';
import type { CompanySummaryResponse } from '@/admin/types';
import type { VerificationStatus } from '@/types/enums';
import '@/admin/pages/companiesPage.scss';

function CompanyLogo({ logoUrl, size = 'sm' }: { logoUrl: string | null; size?: 'sm' | 'lg' }) {
  if (!logoUrl) {
    return (
      <div className={`company-logo company-logo--placeholder${size === 'lg' ? ' company-logo--large' : ''}`}>
        No logo
      </div>
    );
  }
  return (
    <img
      className={`company-logo${size === 'lg' ? ' company-logo--large' : ''}`}
      src={logoUrl}
      alt="Logo"
    />
  );
}

function CompaniesPage() {
  const [status, setStatus] = useState<VerificationStatus | ''>('');
  const [page, setPage] = useState(0);
  const [target, setTarget] = useState<CompanySummaryResponse | null>(null);

  const { data, isLoading, isError, error } = useCompanies({ status: status || undefined, page, size: 20 });

  const columns: DataTableColumn<CompanySummaryResponse>[] = [
    { key: 'logoUrl', header: 'Logo', render: (row) => <CompanyLogo logoUrl={row.logoUrl} /> },
    { key: 'companyName', header: 'Company' },
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

      {target && <VerifyModal company={target} onClose={() => setTarget(null)} />}
    </div>
  );
}

function VerifyModal({ company, onClose }: { company: CompanySummaryResponse; onClose: () => void }) {
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>(company.verificationStatus);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const mutation = useVerifyCompany();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    try {
      await mutation.mutateAsync({ id: company.id, verificationStatus, note: note || undefined });
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update verification.');
    }
  };

  return (
    <Modal title={company.companyName} onClose={onClose}>
      <div style={{ marginBottom: 18 }}>
        <CompanyLogo logoUrl={company.logoUrl} size="lg" />
      </div>
      <div className="detail-grid" style={{ marginBottom: 18 }}>
        <div className="detail-item">
          <div className="detail-item__label">Owner</div>
          <div className="detail-item__value">{company.ownerName}</div>
        </div>
        <div className="detail-item">
          <div className="detail-item__label">Contact</div>
          <div className="detail-item__value">
            {company.ownerEmail} · {company.ownerPhone}
          </div>
        </div>
        <div className="detail-item">
          <div className="detail-item__label">City</div>
          <div className="detail-item__value">{company.city}</div>
        </div>
        <div className="detail-item">
          <div className="detail-item__label">Jobs completed</div>
          <div className="detail-item__value">{company.totalJobsCompleted}</div>
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="verify-status">Verification status</label>
          <select
            id="verify-status"
            value={verificationStatus}
            onChange={(event) => setVerificationStatus(event.target.value as VerificationStatus)}
          >
            {VERIFICATION_STATUSES.map((option) => (
              <option key={option} value={option}>
                {humanize(option)}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="verify-note">Note (optional)</label>
          <textarea
            id="verify-note"
            maxLength={1000}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Reason shared with the contractor, if any"
          />
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn--secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn--primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default CompaniesPage;
