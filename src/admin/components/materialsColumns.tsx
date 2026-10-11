import { Link } from 'react-router-dom';
import type { DataTableColumn } from '@/admin/components/DataTable';
import StatusBadge from '@/admin/components/StatusBadge';
import {
  materialDeliveryStatusTone,
  materialPaymentStatusTone,
  purchasingAccountLabel,
  supplierOrderStatusTone,
} from '@/admin/utils/materialsConstants';
import { formatCurrency, formatDateTime } from '@/admin/utils/format';
import type { SupplierOrderResponse } from '@/admin/materialsTypes';

/** Supplier order columns shared by the Supplier orders list, Store details and Request details. */
export function supplierOrderColumns({
  showStore = true,
  showRequest = true,
}: { showStore?: boolean; showRequest?: boolean } = {}): DataTableColumn<SupplierOrderResponse>[] {
  const columns: DataTableColumn<SupplierOrderResponse>[] = [
    {
      key: 'number',
      header: 'Order',
      render: (row) => (
        <Link to={`/admin/supplier-orders/${row.id}`} className="materials__nowrap">
          {row.number}
        </Link>
      ),
    },
  ];
  if (showRequest) {
    columns.push({
      key: 'request',
      header: 'Request',
      render: (row) => (
        <div>
          <Link to={`/admin/material-requests/${row.requestId}`} className="materials__nowrap">
            {row.requestNumber}
          </Link>
          <div className="materials__muted">{row.requestTitle}</div>
        </div>
      ),
    });
  }
  if (showStore) {
    columns.push({
      key: 'store',
      header: 'Store',
      render: (row) =>
        row.store ? <Link to={`/admin/material-stores/${row.store.id}`}>{row.store.name}</Link> : '—',
    });
  }
  columns.push(
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
      key: 'totalAmount',
      header: 'Total',
      render: (row) => (
        <div className="materials__nowrap">
          <div>{formatCurrency(row.totalAmount)}</div>
          <div className="materials__muted">incl. delivery {formatCurrency(row.deliveryFee)}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <div className="materials__badges">
          <StatusBadge status={row.status} tone={supplierOrderStatusTone(row.status)} />
          <StatusBadge
            status={row.paymentStatus}
            tone={materialPaymentStatusTone(row.paymentStatus)}
            label={`Payment: ${row.paymentStatus.toLowerCase().replace(/_/g, ' ')}`}
          />
          <StatusBadge
            status={row.deliveryStatus}
            tone={materialDeliveryStatusTone(row.deliveryStatus)}
            label={`Delivery: ${row.deliveryStatus.toLowerCase().replace(/_/g, ' ')}`}
          />
        </div>
      ),
    },
    { key: 'createdAt', header: 'Created', render: (row) => formatDateTime(row.createdAt) },
  );
  return columns;
}
