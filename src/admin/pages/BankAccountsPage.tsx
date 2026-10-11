import { useState } from 'react';
import { useBankAccounts, useRejectBankAccount, useVerifyBankAccount } from '@/admin/api/bankAccounts';
import DataTable, { type DataTableColumn } from '@/admin/components/DataTable';
import StatusBadge from '@/admin/components/StatusBadge';
import Modal from '@/admin/components/Modal';
import { BANK_ACCOUNT_STATUSES, bankAccountStatusTone, humanize } from '@/admin/utils/constants';
import { apiErrorMessage } from '@/admin/utils/errors';
import { formatDateTime } from '@/admin/utils/format';
import type { BankAccountResponse } from '@/admin/types';
import type { BankAccountStatus } from '@/types/enums';

type Action = { kind: 'verify' | 'reject'; account: BankAccountResponse };

function BankAccountsPage() {
  const [status, setStatus] = useState<BankAccountStatus | ''>('PENDING_VERIFICATION');
  const [page, setPage] = useState(0);
  const [action, setAction] = useState<Action | null>(null);

  const { data, isLoading, isError, error } = useBankAccounts({ status: status || undefined, page, size: 20 });

  const columns: DataTableColumn<BankAccountResponse>[] = [
    {
      key: 'userName',
      header: 'User',
      render: (row) => (
        <>
          {row.userName} <span className="field__hint">#{row.userId}</span>
        </>
      ),
    },
    {
      key: 'holderName',
      header: 'Account holder',
      render: (row) =>
        row.holderName.trim().toLowerCase() === (row.userName || '').trim().toLowerCase() ? (
          row.holderName
        ) : (
          <>
            {row.holderName} <StatusBadge status="Name differs" tone="warning" />
          </>
        ),
    },
    { key: 'bankName', header: 'Bank' },
    {
      key: 'accountNumber',
      header: 'Account number',
      render: (row) => <span className="payout-details__account">{row.accountNumber || row.maskedNumber}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <div>
          <StatusBadge status={row.status} tone={bankAccountStatusTone(row.status)} />
          {row.rejectionReason && <div className="field__hint">{row.rejectionReason}</div>}
        </div>
      ),
    },
    { key: 'createdAt', header: 'Added', render: (row) => formatDateTime(row.createdAt) },
    { key: 'verifiedAt', header: 'Verified', render: (row) => formatDateTime(row.verifiedAt) },
    {
      key: 'actions',
      header: '',
      render: (row) =>
        row.status === 'PENDING_VERIFICATION' ? (
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="button" className="btn btn--primary btn--sm" onClick={() => setAction({ kind: 'verify', account: row })}>
              Verify
            </button>
            <button type="button" className="btn btn--danger btn--sm" onClick={() => setAction({ kind: 'reject', account: row })}>
              Reject
            </button>
          </div>
        ) : null,
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Bank accounts</h1>
          <p>
            Payout accounts users added for withdrawals. Withdrawals only go to a VERIFIED account whose holder is the
            user.
          </p>
        </div>
      </div>

      <div className="admin-note">
        Verify an account only after checking the user's bank document (statement or bank certificate) proves the
        account belongs to them and the holder name matches.
      </div>

      <div className="filter-bar">
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as BankAccountStatus | '');
            setPage(0);
          }}
        >
          <option value="">All statuses</option>
          {BANK_ACCOUNT_STATUSES.map((option) => (
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
        emptyMessage="No bank accounts match this filter."
        page={data?.page ?? page}
        totalPages={data?.totalPages ?? 1}
        totalElements={data?.totalElements ?? 0}
        onPageChange={setPage}
      />

      {action?.kind === 'verify' && <VerifyModal account={action.account} onClose={() => setAction(null)} />}
      {action?.kind === 'reject' && <RejectModal account={action.account} onClose={() => setAction(null)} />}
    </div>
  );
}

function AccountSummary({ account }: { account: BankAccountResponse }) {
  return (
    <div className="detail-grid payout-details">
      <div className="detail-item">
        <div className="detail-item__label">User</div>
        <div className="detail-item__value">
          {account.userName} (#{account.userId})
        </div>
      </div>
      <div className="detail-item">
        <div className="detail-item__label">Account holder</div>
        <div className="detail-item__value">{account.holderName}</div>
      </div>
      <div className="detail-item">
        <div className="detail-item__label">Bank</div>
        <div className="detail-item__value">{account.bankName}</div>
      </div>
      <div className="detail-item">
        <div className="detail-item__label">Account number</div>
        <div className="detail-item__value payout-details__account">{account.accountNumber || account.maskedNumber}</div>
      </div>
    </div>
  );
}

function VerifyModal({ account, onClose }: { account: BankAccountResponse; onClose: () => void }) {
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState('');
  const mutation = useVerifyBankAccount();

  const handleVerify = async () => {
    setError('');
    try {
      await mutation.mutateAsync(account.id);
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to verify the bank account.'));
    }
  };

  return (
    <Modal title="Verify bank account" onClose={onClose}>
      <AccountSummary account={account} />
      {error && <div className="form-error">{error}</div>}
      <div className="field field--checkbox">
        <label htmlFor="verify-confirm">
          I checked the user's bank document and it proves this account belongs to {account.userName}.
        </label>
        <input id="verify-confirm" type="checkbox" checked={checked} onChange={(event) => setChecked(event.target.checked)} />
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn--secondary" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="btn btn--primary" disabled={!checked || mutation.isPending} onClick={handleVerify}>
          {mutation.isPending ? 'Saving…' : 'Verify'}
        </button>
      </div>
    </Modal>
  );
}

function RejectModal({ account, onClose }: { account: BankAccountResponse; onClose: () => void }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const mutation = useRejectBankAccount();

  const handleReject = async () => {
    setError('');
    if (!reason.trim()) {
      setError('A reason is required - it is shown to the user.');
      return;
    }
    try {
      await mutation.mutateAsync({ id: account.id, reason: reason.trim() });
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to reject the bank account.'));
    }
  };

  return (
    <Modal title="Reject bank account" onClose={onClose}>
      <AccountSummary account={account} />
      {error && <div className="form-error">{error}</div>}
      <div className="field">
        <label htmlFor="reject-reason">Reason (shown to the user)</label>
        <textarea
          id="reject-reason"
          maxLength={500}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="e.g. the bank document shows a different account holder"
        />
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn--secondary" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="btn btn--danger" disabled={mutation.isPending} onClick={handleReject}>
          {mutation.isPending ? 'Saving…' : 'Reject'}
        </button>
      </div>
    </Modal>
  );
}

export default BankAccountsPage;
