import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useStoreApi } from '@/store/api/storeApi';
import { Badge, Card, Column, DataTable, ErrorState, LoadingState, PageHeader, Pagination } from '@/store/components/ui';
import { storeErrorMessage } from '@/store/utils/errors';
import { formatAmd, formatDateTime } from '@/store/utils/format';
import { DELIVERY_BADGE, ORDER_BADGE } from '@/store/utils/labels';
import type { SupplierOrderResponse, SupplierOrderStatus } from '@/store/types';

const FILTERS: { value: string; label: string; statuses?: SupplierOrderStatus[] }[] = [
  { value: 'ALL', label: 'Բոլորը' },
  { value: 'AWAITING', label: 'Սպասում են վճարման', statuses: ['AWAITING_PAYMENT'] },
  { value: 'ACTIVE', label: 'Ակտիվ', statuses: ['FUNDED', 'PREPARING'] },
  { value: 'DELIVERY', label: 'Առաքման մեջ', statuses: ['DISPATCHED', 'PARTIALLY_DELIVERED', 'DELIVERED'] },
  { value: 'COMPLETED', label: 'Ավարտված', statuses: ['COMPLETED'] },
  { value: 'DISPUTED', label: 'Վեճ', statuses: ['DISPUTED'] },
  { value: 'CANCELED', label: 'Չեղարկված', statuses: ['CANCELED'] },
];

function OrdersPage() {
  const api = useStoreApi();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('ALL');
  const [page, setPage] = useState(0);
  const statuses = FILTERS.find((f) => f.value === filter)?.statuses;

  const list = useQuery({
    queryKey: ['store', 'orders', filter, page],
    queryFn: () => api.orders(statuses, page),
    placeholderData: keepPreviousData,
  });

  const columns: Column<SupplierOrderResponse>[] = [
    {
      key: 'number',
      header: 'Պատվեր',
      render: (o) => (
        <div>
          <strong>{o.number}</strong>
          <div className="st-muted-text">{o.requestNumber}</div>
        </div>
      ),
    },
    { key: 'title', header: 'Հարցում', render: (o) => o.requestTitle },
    { key: 'buyer', header: 'Գնորդ', render: (o) => o.buyerName ?? '—' },
    { key: 'items', header: 'Տողեր', render: (o) => o.items.length },
    { key: 'total', header: 'Գումար', render: (o) => formatAmd(o.totalAmount), className: 'st-num' },
    { key: 'status', header: 'Կարգավիճակ', render: (o) => <Badge def={ORDER_BADGE[o.status]} /> },
    { key: 'delivery', header: 'Առաքում', render: (o) => <Badge def={DELIVERY_BADGE[o.deliveryStatus]} /> },
    { key: 'created', header: 'Ստեղծված', render: (o) => formatDateTime(o.createdAt) },
  ];

  return (
    <>
      <PageHeader title="Պատվերներ" subtitle="Գնորդների ընտրած և վճարած պատվերները" />
      <div className="st-tabs" role="tablist">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            role="tab"
            aria-selected={filter === f.value}
            className={`st-tab${filter === f.value ? ' st-tab--active' : ''}`}
            onClick={() => {
              setFilter(f.value);
              setPage(0);
            }}
          >
            {f.label}
          </button>
        ))}
      </div>
      <Card>
        {list.isPending ? (
          <LoadingState />
        ) : list.isError ? (
          <ErrorState message={storeErrorMessage(list.error, 'Չհաջողվեց բեռնել պատվերները')} onRetry={() => list.refetch()} />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={list.data.items}
              rowKey={(o) => o.id}
              onRowClick={(o) => navigate(`/store/orders/${o.id}`)}
              emptyText="Պատվերներ չկան"
            />
            <Pagination
              page={list.data.page}
              totalPages={list.data.totalPages}
              totalElements={list.data.totalElements}
              onChange={setPage}
              disabled={list.isFetching}
            />
          </>
        )}
      </Card>
    </>
  );
}

export default OrdersPage;
