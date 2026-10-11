import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useUserBalance, useUserTransactions } from '@/admin/api/withdrawals';
import DataTable, { type DataTableColumn } from '@/admin/components/DataTable';
import StatusBadge from '@/admin/components/StatusBadge';
import { AdjustWalletModal, RecordDepositModal, WalletStatusModal } from '@/admin/components/WalletModals';
import { holdStatusTone, humanize, walletTransactionTone } from '@/admin/utils/constants';
import { formatCurrency, formatDateTime } from '@/admin/utils/format';
import type { ScheduledReleaseResponse, WalletTransactionResponse } from '@/admin/types';
import type { WalletStatus } from '@/types/enums';
import '@/admin/components/walletPanel.scss';

/** Ledger row columns shared by the Order, Company and User wallet views. */
export function ledgerColumns({ showOwner = false, showOrder = true }: { showOwner?: boolean; showOrder?: boolean } = {}) {
  const columns: DataTableColumn<WalletTransactionResponse>[] = [
    {
      key: 'type',
      header: 'Type',
      render: (tx) => <StatusBadge status={tx.type} tone={walletTransactionTone(tx.type)} />,
    },
  ];
  if (showOwner) columns.push({ key: 'ownerName', header: 'Wallet owner' });
  columns.push(
    { key: 'bucket', header: 'Bucket', render: (tx) => humanize(tx.bucket) || '—' },
    {
      key: 'amount',
      header: 'Amount',
      render: (tx) => (
        <span className={tx.amount < 0 ? 'wallet-panel__amount--negative' : 'wallet-panel__amount--positive'}>
          {tx.direction === 'CREDIT' ? '+' : ''}
          {formatCurrency(tx.amount)}
        </span>
      ),
    },
  );
  if (showOrder) {
    columns.push({
      key: 'orderId',
      header: 'Order',
      render: (tx) => (tx.orderId ? <Link to={`/admin/orders/${tx.orderId}`}>#{tx.orderId}</Link> : '—'),
    });
  }
  columns.push(
    { key: 'milestoneId', header: 'Milestone', render: (tx) => (tx.milestoneId ? `#${tx.milestoneId}` : '—') },
    { key: 'description', header: 'Description', render: (tx) => tx.description || '—' },
    { key: 'createdAt', header: 'Recorded at', render: (tx) => formatDateTime(tx.createdAt) },
  );
  return columns;
}

const releaseColumns: DataTableColumn<ScheduledReleaseResponse>[] = [
  {
    key: 'orderId',
    header: 'Order',
    render: (r) => (r.orderId ? <Link to={`/admin/orders/${r.orderId}`}>#{r.orderId}</Link> : '—'),
  },
  { key: 'milestoneTitle', header: 'Milestone', render: (r) => r.milestoneTitle || '—' },
  { key: 'amount', header: 'Amount', render: (r) => formatCurrency(r.amount) },
  { key: 'holdStartAt', header: 'Held since', render: (r) => formatDateTime(r.holdStartAt) },
  { key: 'releaseAt', header: 'Releases at', render: (r) => formatDateTime(r.releaseAt) },
  { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} tone={holdStatusTone(r.status)} /> },
];

interface WalletPanelProps {
  userId: number;
  ownerName: string;
  /** Section heading - e.g. "Payments". */
  title?: string;
  emptyMessage?: string;
}

/**
 * HAYSHEN WALLET overview for one user (customer or contractor owner): balance buckets, contractor
 * scheduled hold releases, ledger, plus admin money actions (record deposit, correction, freeze).
 */
function WalletPanel({ userId, ownerName, title = 'Payments', emptyMessage = 'No wallet activity recorded yet.' }: WalletPanelProps) {
  const { data: balance, isLoading: balanceLoading, isError: balanceError, error } = useUserBalance(userId);
  const [page, setPage] = useState(0);
  const { data: transactions, isLoading, isError } = useUserTransactions(userId, { page });
  const [modal, setModal] = useState<'deposit' | 'adjust' | WalletStatus | null>(null);
  const owner = { id: userId, name: ownerName };

  return (
    <div className="card wallet-panel">
      <div className="wallet-panel__header">
        <h2 className="wallet-panel__title">
          {title}{' '}
          {balance?.status && (
            <StatusBadge status={balance.status} tone={balance.status === 'FROZEN' ? 'danger' : 'success'} />
          )}
        </h2>
        <div className="wallet-panel__actions">
          <button type="button" className="btn btn--primary btn--sm" onClick={() => setModal('deposit')}>
            Record received payment
          </button>
          <button type="button" className="btn btn--secondary btn--sm" onClick={() => setModal('adjust')}>
            Balance correction
          </button>
          {balance?.status === 'ACTIVE' && (
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setModal('FROZEN')}>
              Freeze wallet
            </button>
          )}
          {balance?.status === 'FROZEN' && (
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setModal('ACTIVE')}>
              Unfreeze wallet
            </button>
          )}
        </div>
      </div>

      {balanceLoading && <div className="table-state">Loading balance…</div>}
      {balanceError && <div className="table-state table-state--error">{error?.message || 'Failed to load balance.'}</div>}
      {balance && (
        <div className="detail-grid wallet-panel__balances">
          <div className="detail-item">
            <div className="detail-item__label">Wallet status</div>
            <div className="detail-item__value">
              {balance.status === 'FROZEN' ? 'Frozen - withdrawals and hold releases blocked' : 'Active'}
            </div>
          </div>
          <Amount label="Available (withdrawable)" value={balance.availableBalance} strong />
          <Amount label="Frozen - 7-day hold (Սառեցված)" value={balance.frozenBalance} />
          <Amount label="Reserved for funded milestones" value={balance.reservedBalance} />
          <Amount label="Pending withdrawal" value={balance.pendingWithdrawalBalance} />
          <Amount label="Total" value={balance.totalBalance} />
        </div>
      )}

      {balance && balance.scheduledReleases?.length > 0 && (
        <>
          <h3 className="wallet-panel__subtitle">Scheduled hold releases</h3>
          <DataTable columns={releaseColumns} rows={balance.scheduledReleases} rowKey={(r) => r.holdId} />
        </>
      )}

      <h3 className="wallet-panel__subtitle">Ledger</h3>
      <DataTable
        columns={ledgerColumns()}
        rows={transactions?.items}
        rowKey={(tx) => tx.id}
        isLoading={isLoading}
        isError={isError}
        errorMessage="Failed to load payment history."
        emptyMessage={emptyMessage}
        page={transactions?.page ?? page}
        totalPages={transactions?.totalPages ?? 1}
        totalElements={transactions?.totalElements ?? 0}
        onPageChange={setPage}
      />

      {modal === 'deposit' && <RecordDepositModal owner={owner} onClose={() => setModal(null)} />}
      {modal === 'adjust' && <AdjustWalletModal owner={owner} onClose={() => setModal(null)} />}
      {(modal === 'FROZEN' || modal === 'ACTIVE') && (
        <WalletStatusModal owner={owner} status={modal} onClose={() => setModal(null)} />
      )}
    </div>
  );
}

function Amount({ label, value, strong }: { label: string; value: number | null | undefined; strong?: boolean }) {
  return (
    <div className="detail-item">
      <div className="detail-item__label">{label}</div>
      <div className="detail-item__value" style={strong ? { fontWeight: 700 } : undefined}>
        {formatCurrency(value ?? null)}
      </div>
    </div>
  );
}

export default WalletPanel;
