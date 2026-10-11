import { useState } from 'react';
import { useSupplierOrders } from '@/admin/api/materials';
import DataTable from '@/admin/components/DataTable';
import { supplierOrderColumns } from '@/admin/components/materialsColumns';
import { humanize } from '@/admin/utils/constants';
import { SUPPLIER_ORDER_STATUSES } from '@/admin/utils/materialsConstants';
import type { SupplierOrderStatus } from '@/admin/materialsTypes';
import '@/admin/pages/materialsPages.scss';

function SupplierOrdersPage() {
  const [status, setStatus] = useState<SupplierOrderStatus | ''>('');
  const [page, setPage] = useState(0);

  const { data, isLoading, isError, error } = useSupplierOrders({ status: status || undefined, page, size: 20 });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Supplier orders</h1>
          <p>
            One store&rsquo;s share of an awarded material request (MPO-…). Buyers fund them from the HAYSHEN WALLET;
            the store is paid into its hold once the buyer accepts the delivery.
          </p>
        </div>
      </div>

      <div className="filter-bar">
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as SupplierOrderStatus | '');
            setPage(0);
          }}
        >
          <option value="">All statuses</option>
          {SUPPLIER_ORDER_STATUSES.map((option) => (
            <option key={option} value={option}>
              {humanize(option)}
            </option>
          ))}
        </select>
      </div>

      <DataTable
        columns={supplierOrderColumns()}
        rows={data?.items}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        isError={isError}
        errorMessage={error?.message}
        emptyMessage="No supplier orders match this filter."
        page={data?.page ?? page}
        totalPages={data?.totalPages ?? 1}
        totalElements={data?.totalElements ?? 0}
        onPageChange={setPage}
      />
    </div>
  );
}

export default SupplierOrdersPage;
