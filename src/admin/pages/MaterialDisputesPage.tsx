import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMaterialDisputes } from '@/admin/api/materials';
import DataTable, { type DataTableColumn } from '@/admin/components/DataTable';
import StatusBadge from '@/admin/components/StatusBadge';
import ResolveMaterialDisputeModal, { disputeMoneyContext } from '@/admin/components/ResolveMaterialDisputeModal';
import { materialPaymentStatusTone, purchasingAccountLabel } from '@/admin/utils/materialsConstants';
import { formatCurrency, formatDateTime } from '@/admin/utils/format';
import type { MaterialDisputeInfo, SupplierOrderResponse } from '@/admin/materialsTypes';
import '@/admin/pages/materialsPages.scss';

const openDispute = (order: SupplierOrderResponse): MaterialDisputeInfo | undefined =>
  order.disputes?.find((d) => d.status === 'OPEN');

function MaterialDisputesPage() {
  const [page, setPage] = useState(0);
  const [target, setTarget] = useState<{ order: SupplierOrderResponse; dispute: MaterialDisputeInfo } | null>(null);

  const { data, isLoading, isError, error } = useMaterialDisputes({ page, size: 20 });

  const columns: DataTableColumn<SupplierOrderResponse>[] = [
    {
      key: 'number',
      header: 'Supplier order',
      render: (row) => (
        <div>
          <Link to={`/admin/supplier-orders/${row.id}`} className="materials__nowrap">
            {row.number}
          </Link>
          <div className="materials__muted">{row.requestNumber}</div>
        </div>
      ),
    },
    {
      key: 'store',
      header: 'Store',
      render: (row) => (row.store ? <Link to={`/admin/material-stores/${row.store.id}`}>{row.store.name}</Link> : '—'),
    },
    {
      key: 'buyer',
      header: 'Buyer',
      render: (row) => (
        <div>
          <div>{row.buyerName}</div>
          <div className="materials__muted">{purchasingAccountLabel(row.purchasingAccountType)}</div>
        </div>
      ),
    },
    {
      key: 'reason',
      header: 'Reason',
      render: (row) => {
        const dispute = openDispute(row);
        return dispute ? (
          <div>
            <div>{dispute.reason}</div>
            <div className="materials__muted">
              {dispute.openedByName || '—'} · {formatDateTime(dispute.openedAt)}
            </div>
          </div>
        ) : (
          '—'
        );
      },
    },
    {
      key: 'money',
      header: 'At stake',
      render: (row) => {
        const { mode, max } = disputeMoneyContext(row);
        return (
          <div className="materials__nowrap">
            <div>{formatCurrency(max)}</div>
            <div className="materials__muted">
              {mode === 'RESERVED' ? 'Reserved from buyer' : mode === 'HELD' ? 'In store hold' : 'Nothing held'}
            </div>
          </div>
        );
      },
    },
    {
      key: 'paymentStatus',
      header: 'Payment',
      render: (row) => <StatusBadge status={row.paymentStatus} tone={materialPaymentStatusTone(row.paymentStatus)} />,
    },
    { key: 'total', header: 'Order total', render: (row) => formatCurrency(row.totalAmount) },
    {
      key: 'actions',
      header: '',
      render: (row) => {
        const dispute = openDispute(row);
        return dispute ? (
          <button type="button" className="btn btn--primary btn--sm" onClick={() => setTarget({ order: row, dispute })}>
            Resolve
          </button>
        ) : null;
      },
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Material disputes</h1>
          <p>
            Supplier orders with an open dispute, oldest first. Before the buyer accepts, the whole order total is still
            reserved in the buyer&rsquo;s wallet; after settlement only the store&rsquo;s held earnings can be refunded
            (the hold stays blocked until you decide).
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={data?.items}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        isError={isError}
        errorMessage={error?.message}
        emptyMessage="No open material disputes."
        page={data?.page ?? page}
        totalPages={data?.totalPages ?? 1}
        totalElements={data?.totalElements ?? 0}
        onPageChange={setPage}
      />

      {target && (
        <ResolveMaterialDisputeModal order={target.order} dispute={target.dispute} onClose={() => setTarget(null)} />
      )}
    </div>
  );
}

export default MaterialDisputesPage;
