import { useState, type FormEvent } from 'react';
import { useUsers, useUpdateUserStatus } from '@/admin/api/users';
import DataTable, { type DataTableColumn } from '@/admin/components/DataTable';
import StatusBadge from '@/admin/components/StatusBadge';
import Modal from '@/admin/components/Modal';
import { USER_ROLES, USER_STATUSES, humanize, userStatusTone } from '@/admin/utils/constants';
import { formatDateTime } from '@/admin/utils/format';
import { ApiError } from '@/api/client';
import type { UserSummaryResponse } from '@/admin/types';
import type { UserRole, UserStatus } from '@/types/enums';

function UsersPage() {
  const [role, setRole] = useState<UserRole>('CUSTOMER');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [statusTarget, setStatusTarget] = useState<UserSummaryResponse | null>(null);

  const { data, isLoading, isError, error } = useUsers({ role, search: search || undefined, page, size: 20 });

  const columns: DataTableColumn<UserSummaryResponse>[] = [
    { key: 'fullName', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone' },
    { key: 'role', header: 'Role', render: (row) => humanize(row.role) },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} tone={userStatusTone(row.status)} /> },
    { key: 'createdAt', header: 'Created', render: (row) => formatDateTime(row.createdAt) },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <button type="button" className="btn btn--secondary btn--sm" onClick={() => setStatusTarget(row)}>
          Change status
        </button>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Users</h1>
          <p>Customer, contractor, and staff accounts.</p>
        </div>
      </div>

      <div className="filter-bar">
        <select
          value={role}
          onChange={(event) => {
            setRole(event.target.value as UserRole);
            setPage(0);
          }}
        >
          {USER_ROLES.map((option) => (
            <option key={option} value={option}>
              {humanize(option)}
            </option>
          ))}
        </select>
        <input
          type="search"
          placeholder="Search by name, email, or phone"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(0);
          }}
        />
      </div>

      <DataTable
        columns={columns}
        rows={data?.items}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        isError={isError}
        errorMessage={error?.message}
        emptyMessage="No users match this filter."
        page={data?.page ?? page}
        totalPages={data?.totalPages ?? 1}
        totalElements={data?.totalElements ?? 0}
        onPageChange={setPage}
      />

      {statusTarget && <UpdateStatusModal user={statusTarget} onClose={() => setStatusTarget(null)} />}
    </div>
  );
}

function UpdateStatusModal({ user, onClose }: { user: UserSummaryResponse; onClose: () => void }) {
  const [status, setStatus] = useState<UserStatus>(user.status);
  const [error, setError] = useState('');
  const mutation = useUpdateUserStatus();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    try {
      await mutation.mutateAsync({ id: user.id, status });
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update status.');
    }
  };

  return (
    <Modal title={`Update status — ${user.fullName}`} onClose={onClose}>
      {error && <div className="form-error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="user-status">Status</label>
          <select id="user-status" value={status} onChange={(event) => setStatus(event.target.value as UserStatus)}>
            {USER_STATUSES.map((option) => (
              <option key={option} value={option}>
                {humanize(option)}
              </option>
            ))}
          </select>
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

export default UsersPage;
