import { useState } from 'react';
import { Link } from 'react-router-dom';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { useStoreApi } from '@/store/api/storeApi';
import { useMyStore } from '@/store/context/MyStoreContext';
import { Badge, Button, Card, Column, ConfirmDialog, DataTable, ErrorState, LoadingState, PageHeader, Pagination, toast } from '@/store/components/ui';
import { storeErrorMessage } from '@/store/utils/errors';
import { formatAmd, formatDateTime } from '@/store/utils/format';
import { QUOTATION_BADGE } from '@/store/utils/labels';
import type { MaterialQuotationStatus, QuotationResponse } from '@/store/types';

const FILTERS: { value: string; label: string; statuses?: MaterialQuotationStatus[] }[] = [
  { value: 'ALL', label: 'Բոլորը' },
  { value: 'SUBMITTED', label: 'Ուղարկված', statuses: ['SUBMITTED'] },
  { value: 'ACCEPTED', label: 'Ընդունված', statuses: ['ACCEPTED', 'PARTIALLY_ACCEPTED'] },
  { value: 'REJECTED', label: 'Մերժված', statuses: ['REJECTED'] },
  { value: 'EXPIRED', label: 'Ժամկետանց', statuses: ['EXPIRED'] },
  { value: 'WITHDRAWN', label: 'Հետ կանչված', statuses: ['WITHDRAWN'] },
];

function QuotationsPage() {
  const api = useStoreApi();
  const queryClient = useQueryClient();
  const { can } = useMyStore();
  const [filter, setFilter] = useState('ALL');
  const [page, setPage] = useState(0);
  const [withdrawing, setWithdrawing] = useState<QuotationResponse | null>(null);
  const statuses = FILTERS.find((f) => f.value === filter)?.statuses;

  const list = useQuery({
    queryKey: ['store', 'quotations', filter, page],
    queryFn: () => api.quotations(statuses, page),
    placeholderData: keepPreviousData,
  });

  const columns: Column<QuotationResponse>[] = [
    {
      key: 'request',
      header: 'Հարցում',
      render: (q) => (
        <div>
          <Link to={`/store/requests/${q.requestId}`}>
            <strong>{q.requestTitle}</strong>
          </Link>
          <div className="st-muted-text">{q.requestNumber}</div>
        </div>
      ),
    },
    { key: 'status', header: 'Կարգավիճակ', render: (q) => <Badge def={QUOTATION_BADGE[q.status]} /> },
    {
      key: 'items',
      header: 'Ապրանքներ',
      render: (q) => `${q.suppliedItems}/${q.requestedItems}${q.coversAllItems ? ' (բոլորը)' : ''}`,
    },
    { key: 'total', header: 'Գումար', render: (q) => formatAmd(q.totalAmount), className: 'st-num' },
    {
      key: 'valid',
      header: 'Վավեր է մինչև',
      render: (q) => (
        <span className={q.expired ? 'st-error-text' : undefined}>{formatDateTime(q.validUntil)}</span>
      ),
    },
    { key: 'rev', header: 'Տարբերակ', render: (q) => q.revision },
    { key: 'updated', header: 'Թարմացված', render: (q) => formatDateTime(q.updatedAt ?? q.submittedAt) },
    {
      key: 'actions',
      header: '',
      render: (q) =>
        q.status === 'SUBMITTED' && can.quote ? (
          <div className="st-row">
            <Link to={`/store/requests/${q.requestId}/quote`} className="st-btn st-btn--secondary st-btn--sm">
              Թարմացնել
            </Link>
            <Button variant="danger" size="sm" onClick={() => setWithdrawing(q)}>
              Հետ կանչել
            </Button>
          </div>
        ) : null,
    },
  ];

  return (
    <>
      <PageHeader title="Իմ առաջարկները" subtitle="Ուղարկված գնային առաջարկները և դրանց կարգավիճակը" />
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
          <ErrorState message={storeErrorMessage(list.error, 'Չհաջողվեց բեռնել առաջարկները')} onRetry={() => list.refetch()} />
        ) : (
          <>
            <DataTable columns={columns} rows={list.data.items} rowKey={(q) => q.id} emptyText="Առաջարկներ չկան" />
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
      {withdrawing && (
        <ConfirmDialog
          title="Հետ կանչե՞լ առաջարկը"
          message={`${withdrawing.requestNumber} · ${formatAmd(withdrawing.totalAmount)}։ Գնորդն այլևս չի կարողանա ընտրել այս առաջարկը։`}
          confirmLabel="Հետ կանչել"
          danger
          onClose={() => setWithdrawing(null)}
          onConfirm={async () => {
            try {
              await api.withdrawQuotation(withdrawing.id);
            } catch (err) {
              throw new Error(storeErrorMessage(err, 'Չհաջողվեց հետ կանչել առաջարկը'));
            }
            toast('Առաջարկը հետ է կանչված');
            queryClient.invalidateQueries({ queryKey: ['store'] });
          }}
        />
      )}
    </>
  );
}

export default QuotationsPage;
