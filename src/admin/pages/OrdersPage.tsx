import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '@/admin/api/orders';
import DataTable, { type DataTableColumn } from '@/admin/components/DataTable';
import StatusBadge from '@/admin/components/StatusBadge';
import { ORDER_STATUSES, humanize, orderStatusTone } from '@/admin/utils/constants';
import { formatCurrency, formatDateTime } from '@/admin/utils/format';
import type { OrderSummaryResponse } from '@/admin/types';
import type { OrderStatus } from '@/types/enums';

function OrdersPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const [page, setPage] = useState(0);

  const { data, isLoading, isError, error } = useOrders({ status: status || undefined, page, size: 20 });

  const columns: DataTableColumn<OrderSummaryResponse>[] = [
    { key: 'id', header: 'ID', render: (row) => `#${row.id}` },
    {
      key: 'service',
      header: 'Category / Service',
      render: (row) => (
        <div>
          <div>{row.categoryName}</div>
          {row.serviceItemName && <div style={{ color: '#888', fontSize: 12 }}>{row.serviceItemName}</div>}
        </div>
      ),
    },
    { key: 'customerName', header: 'Customer' },
    { key: 'assignedCompanyName', header: 'Company', render: (row) => row.assignedCompanyName || '—' },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} tone={orderStatusTone(row.status)} /> },
    { key: 'addressCity', header: 'City' },
    { key: 'scheduledAt', header: 'Scheduled', render: (row) => formatDateTime(row.scheduledAt) },
    { key: 'finalPrice', header: 'Price', render: (row) => formatCurrency(row.finalPrice) },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <button type="button" className="btn btn--secondary btn--sm" onClick={() => navigate(`/admin/orders/${row.id}`)}>
          View
        </button>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Orders</h1>
          <p>Monitor orders and manually dispatch new submissions.</p>
        </div>
      </div>

      <div className="filter-bar">
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as OrderStatus | '');
            setPage(0);
          }}
        >
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((option) => (
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
        emptyMessage="No orders match this filter."
        page={data?.page ?? page}
        totalPages={data?.totalPages ?? 1}
        totalElements={data?.totalElements ?? 0}
        onPageChange={setPage}
      />
    </div>
  );
}

export default OrdersPage;
