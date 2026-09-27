import { useState } from 'react';
import { useAdjustWallet, useUpdateWithdrawal, useWithdrawals } from '@/admin/api/withdrawals';
import DataTable, { type DataTableColumn } from '@/admin/components/DataTable';
import StatusBadge from '@/admin/components/StatusBadge';
import Modal from '@/admin/components/Modal';
import { WITHDRAWAL_STATUSES, humanize, withdrawalStatusTone } from '@/admin/utils/constants';
import { formatCurrency, formatDateTime } from '@/admin/utils/format';
import { ApiError } from '@/api/client';
import type { WithdrawalRequestResponse } from '@/admin/types';
import type { WithdrawalStatus } from '@/types/enums';

function WithdrawalsPage() {
  const [status, setStatus] = useState<WithdrawalStatus | ''>('PENDING');
  const [page, setPage] = useState(0);
  const [target, setTarget] = useState<WithdrawalRequestResponse | null>(null);
  const [showAdjustment, setShowAdjustment] = useState(false);

  const { data, isLoading, isError, error } = useWithdrawals({ status: status || undefined, page, size: 20 });

  const columns: DataTableColumn<WithdrawalRequestResponse>[] = [
    { key: 'ownerName', header: 'Owner' },
    { key: 'amount', header: 'Amount', render: (row) => formatCurrency(row.amount) },
    { key: 'bankAccountNumber', header: 'Bank account' },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} tone={withdrawalStatusTone(row.status)} />,
    },
    { key: 'requestedAt', header: 'Requested', render: (row) => formatDateTime(row.requestedAt) },
    { key: 'processedAt', header: 'Processed', render: (row) => formatDateTime(row.processedAt) },
    {
      key: 'actions',
      header: '',
      render: (row) =>
        row.status === 'PENDING' ? (
          <button type="button" className="btn btn--secondary btn--sm" onClick={() => setTarget(row)}>
            Process
          </button>
        ) : null,
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Withdrawals</h1>
          <p>Requests to move HAYSHEN WALLET funds to a personal bank account (v1 has no payment integration - process manually after wiring the money).</p>
        </div>
        <button type="button" className="btn btn--secondary" onClick={() => setShowAdjustment(true)}>
          Adjust wallet
        </button>
      </div>

      <div className="filter-bar">
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as WithdrawalStatus | '');
            setPage(0);
          }}
        >
          <option value="">All statuses</option>
          {WITHDRAWAL_STATUSES.map((option) => (
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
        emptyMessage="No withdrawal requests match this filter."
        page={data?.page ?? page}
        totalPages={data?.totalPages ?? 1}
        totalElements={data?.totalElements ?? 0}
        onPageChange={setPage}
      />

      {target && <ProcessWithdrawalModal withdrawal={target} onClose={() => setTarget(null)} />}
      {showAdjustment && <AdjustWalletModal onClose={() => setShowAdjustment(false)} />}
    </div>
  );
}

function AdjustWalletModal({ onClose }: { onClose: () => void }) {
  const [ownerUserId, setOwnerUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const mutation = useAdjustWallet();

  const handleSubmit = async () => {
    setError('');
    const parsedOwnerId = Number(ownerUserId);
    const parsedAmount = Number(amount);
    if (!parsedOwnerId || Number.isNaN(parsedAmount) || parsedAmount === 0) {
      setError('Enter a valid user id and a non-zero amount.');
      return;
    }
    try {
      await mutation.mutateAsync({ ownerUserId: parsedOwnerId, amount: parsedAmount, note: note || undefined });
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to adjust the wallet.');
    }
  };

  return (
    <Modal title="Adjust wallet" onClose={onClose}>
      <p style={{ color: '#666', marginBottom: 16 }}>
        Manually credit or debit a user's wallet - the only way money enters the ledger from outside the order
        lifecycle in v1. Use a positive amount to credit (e.g. a payment collected off-platform), negative to debit.
      </p>
      {error && <div className="form-error">{error}</div>}
      <div>
        <div className="field">
          <label htmlFor="adjustment-owner">User id</label>
          <input
            id="adjustment-owner"
            type="number"
            value={ownerUserId}
            onChange={(event) => setOwnerUserId(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="adjustment-amount">Amount (AMD, signed)</label>
          <input
            id="adjustment-amount"
            type="number"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="adjustment-note">Note</label>
          <textarea
            id="adjustment-note"
            maxLength={500}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="e.g. cash payment collected in person on 2026-09-26"
          />
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn--secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn--primary" disabled={mutation.isPending} onClick={handleSubmit}>
            {mutation.isPending ? 'Saving…' : 'Apply'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function ProcessWithdrawalModal({ withdrawal, onClose }: { withdrawal: WithdrawalRequestResponse; onClose: () => void }) {
  const [adminNote, setAdminNote] = useState('');
  const [error, setError] = useState('');
  const mutation = useUpdateWithdrawal();

  const handleDecision = async (decision: 'PAID' | 'REJECTED') => {
    setError('');
    try {
      await mutation.mutateAsync({ id: withdrawal.id, status: decision, adminNote: adminNote || undefined });
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update the withdrawal.');
    }
  };

  return (
    <Modal title={withdrawal.ownerName} onClose={onClose}>
      <div className="detail-grid" style={{ marginBottom: 18 }}>
        <div className="detail-item">
          <div className="detail-item__label">Amount</div>
          <div className="detail-item__value">{formatCurrency(withdrawal.amount)}</div>
        </div>
        <div className="detail-item">
          <div className="detail-item__label">Bank account</div>
          <div className="detail-item__value">{withdrawal.bankAccountNumber}</div>
        </div>
        <div className="detail-item">
          <div className="detail-item__label">Requested</div>
          <div className="detail-item__value">{formatDateTime(withdrawal.requestedAt)}</div>
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}
      <div>
        <div className="field">
          <label htmlFor="withdrawal-note">Note (optional)</label>
          <textarea
            id="withdrawal-note"
            maxLength={500}
            value={adminNote}
            onChange={(event) => setAdminNote(event.target.value)}
            placeholder="e.g. bank transfer reference, or reason for rejecting"
          />
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn--secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn--danger"
            disabled={mutation.isPending}
            onClick={() => handleDecision('REJECTED')}
          >
            Reject
          </button>
          <button
            type="button"
            className="btn btn--primary"
            disabled={mutation.isPending}
            onClick={() => handleDecision('PAID')}
          >
            {mutation.isPending ? 'Saving…' : 'Mark paid'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default WithdrawalsPage;
