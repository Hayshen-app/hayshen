import { useState, type ReactNode } from 'react';
import { useUpdateWithdrawal, useWithdrawals } from '@/admin/api/withdrawals';
import DataTable, { type DataTableColumn } from '@/admin/components/DataTable';
import StatusBadge from '@/admin/components/StatusBadge';
import Modal from '@/admin/components/Modal';
import { AdjustWalletModal, RecordDepositModal } from '@/admin/components/WalletModals';
import { WITHDRAWAL_STATUSES, humanize, withdrawalStatusTone } from '@/admin/utils/constants';
import { apiErrorMessage } from '@/admin/utils/errors';
import { formatCurrency, formatDateTime } from '@/admin/utils/format';
import type { WithdrawalRequestResponse } from '@/admin/types';
import type { WithdrawalStatus } from '@/types/enums';

type Decision = 'COMPLETED' | 'FAILED' | 'REJECTED';

function WithdrawalsPage() {
  const [status, setStatus] = useState<WithdrawalStatus | ''>('PENDING');
  const [page, setPage] = useState(0);
  const [target, setTarget] = useState<WithdrawalRequestResponse | null>(null);
  const [walletModal, setWalletModal] = useState<'deposit' | 'adjust' | null>(null);

  const { data, isLoading, isError, error } = useWithdrawals({ status: status || undefined, page, size: 20 });

  const columns: DataTableColumn<WithdrawalRequestResponse>[] = [
    { key: 'ownerName', header: 'Owner', render: (row) => <>{row.ownerName} <span className="field__hint">#{row.ownerUserId}</span></> },
    { key: 'amount', header: 'Amount', render: (row) => formatCurrency(row.amount) },
    {
      key: 'bank',
      header: 'Payout account',
      render: (row) => (
        <div>
          <div>{row.bankName || '—'}</div>
          <div className="field__hint">
            {row.accountHolderName || '—'} · {row.status === 'PENDING' ? row.fullAccountNumber || row.bankAccountNumber : row.bankAccountNumber}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} tone={withdrawalStatusTone(row.status)} />,
    },
    {
      key: 'outcome',
      header: 'Payout ref / reason',
      render: (row) => row.payoutReference || row.failureReason || '—',
    },
    { key: 'requestedAt', header: 'Requested', render: (row) => formatDateTime(row.requestedAt) },
    { key: 'processedAt', header: 'Processed', render: (row) => formatDateTime(row.processedAt) },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <button type="button" className="btn btn--secondary btn--sm" onClick={() => setTarget(row)}>
          {row.status === 'PENDING' ? 'Process' : 'Details'}
        </button>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Withdrawals</h1>
          <p>
            Requests to move HAYSHEN WALLET funds to the user's verified bank account. There is no payout integration:
            wire the money from the bank first, then mark the request paid with the bank's transfer reference.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn--primary" onClick={() => setWalletModal('deposit')}>
            Record received payment
          </button>
          <button type="button" className="btn btn--secondary" onClick={() => setWalletModal('adjust')}>
            Balance correction
          </button>
        </div>
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
      {walletModal === 'deposit' && <RecordDepositModal onClose={() => setWalletModal(null)} />}
      {walletModal === 'adjust' && <AdjustWalletModal onClose={() => setWalletModal(null)} />}
    </div>
  );
}

function ProcessWithdrawalModal({ withdrawal, onClose }: { withdrawal: WithdrawalRequestResponse; onClose: () => void }) {
  const isPending = withdrawal.status === 'PENDING';
  const [decision, setDecision] = useState<Decision>('COMPLETED');
  const [payoutReference, setPayoutReference] = useState('');
  const [reason, setReason] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [error, setError] = useState('');
  const mutation = useUpdateWithdrawal();

  const handleSubmit = async () => {
    setError('');
    const note = adminNote.trim() || undefined;
    try {
      if (decision === 'COMPLETED') {
        if (!payoutReference.trim()) {
          setError("Enter the bank's transfer reference. Only mark paid after the money has actually been sent.");
          return;
        }
        await mutation.mutateAsync({
          id: withdrawal.id,
          ownerUserId: withdrawal.ownerUserId,
          status: 'COMPLETED',
          payoutReference: payoutReference.trim(),
          adminNote: note,
        });
      } else {
        if (!reason.trim()) {
          setError('A reason is required - it is shown to the user.');
          return;
        }
        await mutation.mutateAsync({
          id: withdrawal.id,
          ownerUserId: withdrawal.ownerUserId,
          status: decision,
          reason: reason.trim(),
          adminNote: note,
        });
      }
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to update the withdrawal.'));
    }
  };

  return (
    <Modal title={`Withdrawal #${withdrawal.id} — ${withdrawal.ownerName}`} onClose={onClose} wide>
      <div className="detail-grid payout-details">
        <Detail label="Amount" value={<strong>{formatCurrency(withdrawal.amount)}</strong>} />
        <Detail label="Status" value={<StatusBadge status={withdrawal.status} tone={withdrawalStatusTone(withdrawal.status)} />} />
        <Detail label="Bank" value={withdrawal.bankName || '—'} />
        <Detail label="Account holder" value={withdrawal.accountHolderName || '—'} />
        <Detail
          label="Account number"
          value={<span className="payout-details__account">{withdrawal.fullAccountNumber || withdrawal.bankAccountNumber}</span>}
        />
        <Detail label="Owner user id" value={`#${withdrawal.ownerUserId}`} />
        <Detail label="Requested" value={formatDateTime(withdrawal.requestedAt)} />
        {!isPending && <Detail label="Processed" value={formatDateTime(withdrawal.processedAt)} />}
        {withdrawal.payoutReference && <Detail label="Payout reference" value={withdrawal.payoutReference} />}
        {withdrawal.failureReason && <Detail label="Reason" value={withdrawal.failureReason} />}
        {withdrawal.adminNote && <Detail label="Admin note" value={withdrawal.adminNote} />}
      </div>

      {!isPending ? (
        <div className="form-actions">
          <button type="button" className="btn btn--secondary" onClick={onClose}>
            Close
          </button>
        </div>
      ) : (
        <>
          {error && <div className="form-error">{error}</div>}
          <div className="field">
            <label htmlFor="withdrawal-decision">Outcome</label>
            <select id="withdrawal-decision" value={decision} onChange={(event) => setDecision(event.target.value as Decision)}>
              <option value="COMPLETED">Paid - money was transferred</option>
              <option value="FAILED">Failed - the bank transfer bounced / failed</option>
              <option value="REJECTED">Rejected - will not be paid</option>
            </select>
            <span className="field__hint">
              {decision === 'COMPLETED'
                ? 'The amount leaves the wallet permanently.'
                : 'The amount goes back to the user’s available balance.'}
            </span>
          </div>

          {decision === 'COMPLETED' ? (
            <div className="field">
              <label htmlFor="withdrawal-payout-ref">Bank transfer reference</label>
              <input
                id="withdrawal-payout-ref"
                maxLength={120}
                value={payoutReference}
                onChange={(event) => setPayoutReference(event.target.value)}
                placeholder="Reference from the bank's payment confirmation"
              />
            </div>
          ) : (
            <div className="field">
              <label htmlFor="withdrawal-reason">Reason (shown to the user)</label>
              <textarea
                id="withdrawal-reason"
                maxLength={500}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
            </div>
          )}

          <div className="field">
            <label htmlFor="withdrawal-note">Internal note (optional)</label>
            <textarea id="withdrawal-note" maxLength={500} value={adminNote} onChange={(event) => setAdminNote(event.target.value)} />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn--secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className={decision === 'COMPLETED' ? 'btn btn--primary' : 'btn btn--danger'}
              disabled={mutation.isPending}
              onClick={handleSubmit}
            >
              {mutation.isPending
                ? 'Saving…'
                : decision === 'COMPLETED'
                  ? 'Mark paid'
                  : decision === 'FAILED'
                    ? 'Mark failed'
                    : 'Reject'}
            </button>
          </div>
        </>
      )}
    </Modal>
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

export default WithdrawalsPage;
