import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ShieldAlert } from 'lucide-react';
import { useStoreApi } from '@/store/api/storeApi';
import { Badge, Button, Card, Column, DataTable, EmptyState, ErrorState, Field, LoadingState, PageHeader, Pagination } from '@/store/components/ui';
import { useCategories, useRegions } from '@/store/hooks/useLookups';
import { errorCode, storeErrorMessage } from '@/store/utils/errors';
import { formatDate, formatDateTime, parseNumber, qtyWithUnit } from '@/store/utils/format';
import { QUOTATION_BADGE } from '@/store/utils/labels';
import type { MarketplaceFilters, MarketplaceRequest } from '@/store/types';

const EMPTY_FILTERS = { categoryId: '', regionId: '', minQuantity: '', deliveryFrom: '', deliveryTo: '' };

function MarketplacePage() {
  const api = useStoreApi();
  const navigate = useNavigate();
  const categories = useCategories();
  const regions = useRegions();
  const [draft, setDraft] = useState(EMPTY_FILTERS);
  const [applied, setApplied] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(0);

  const filters: MarketplaceFilters = {
    categoryId: applied.categoryId ? Number(applied.categoryId) : null,
    regionId: applied.regionId ? Number(applied.regionId) : null,
    minQuantity: Number.isFinite(parseNumber(applied.minQuantity)) ? parseNumber(applied.minQuantity) : null,
    deliveryFrom: applied.deliveryFrom || null,
    deliveryTo: applied.deliveryTo || null,
    page,
    size: 20,
  };

  const list = useQuery({
    queryKey: ['store', 'marketplace', filters],
    queryFn: () => api.marketplace(filters),
    placeholderData: keepPreviousData,
    retry: (count, err) => count < 1 && errorCode(err) == null,
  });

  const set = (key: keyof typeof EMPTY_FILTERS) => (e: { target: { value: string } }) =>
    setDraft((prev) => ({ ...prev, [key]: e.target.value }));
  const apply = () => {
    setApplied(draft);
    setPage(0);
  };
  const reset = () => {
    setDraft(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
    setPage(0);
  };
  const hasFilters = Object.values(applied).some(Boolean);

  const columns: Column<MarketplaceRequest>[] = [
    {
      key: 'title',
      header: 'Հարցում',
      render: (r) => (
        <div>
          <strong>{r.title}</strong>
          <div className="st-muted-text">{r.number}</div>
        </div>
      ),
    },
    {
      key: 'items',
      header: 'Ապրանքներ',
      render: (r) => (
        <div className="st-items-preview">
          {r.items.slice(0, 3).map((i) => (
            <div key={i.id}>
              {i.name || i.categoryName} — {qtyWithUnit(i.quantity, i.unit)}
            </div>
          ))}
          {r.items.length > 3 && <div className="st-muted-text">+{r.items.length - 3} այլ</div>}
        </div>
      ),
    },
    { key: 'place', header: 'Վայր', render: (r) => [r.deliveryCity, r.deliveryRegionName].filter(Boolean).join(', ') || '—' },
    { key: 'date', header: 'Առաքման ամսաթիվ', render: (r) => formatDate(r.preferredDeliveryDate) },
    { key: 'expires', header: 'Ավարտվում է', render: (r) => formatDateTime(r.expiresAt) },
    {
      key: 'my',
      header: 'Իմ առաջարկը',
      render: (r) => (r.myQuotation ? <Badge def={QUOTATION_BADGE[r.myQuotation.status]} /> : <Badge tone="warning" label="Առաջարկ չկա" />),
    },
  ];

  let body;
  if (list.isPending) {
    body = <LoadingState />;
  } else if (list.isError) {
    body =
      errorCode(list.error) === 'STORE_NOT_VERIFIED' ? (
        <EmptyState
          icon={<ShieldAlert size={28} />}
          title="Հարցումները դեռ հասանելի չեն"
          text="Գնորդների հարցումները և գնային առաջարկների ուղարկումը հասանելի են միայն HayShen-ի կողմից հաստատված և ակտիվ խանութներին։ Հաստատումից հետո այստեղ կտեսնեք բաց հարցումները։"
        />
      ) : (
        <ErrorState message={storeErrorMessage(list.error, 'Չհաջողվեց բեռնել հարցումները')} onRetry={() => list.refetch()} />
      );
  } else if (list.data.items.length === 0) {
    body = (
      <EmptyState
        title={hasFilters ? 'Ֆիլտրերին համապատասխան հարցումներ չկան' : 'Այս պահին բաց հարցումներ չկան'}
        text={hasFilters ? 'Փոխեք կամ մաքրեք ֆիլտրերը։' : 'Նոր հարցումների մասին կստանաք ծանուցում։'}
      />
    );
  } else {
    body = (
      <>
        <DataTable columns={columns} rows={list.data.items} rowKey={(r) => r.id} onRowClick={(r) => navigate(`/store/requests/${r.id}`)} />
        <Pagination
          page={list.data.page}
          totalPages={list.data.totalPages}
          totalElements={list.data.totalElements}
          onChange={setPage}
          disabled={list.isFetching}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader title="Հարցումներ" subtitle="Գնորդների բաց հարցումները շինանյութերի համար" />
      <Card>
        <div className="st-filters">
          <Field label="Կատեգորիա">
            <select value={draft.categoryId} onChange={set('categoryId')}>
              <option value="">Բոլորը</option>
              {(categories.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameHy || c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Մարզ">
            <select value={draft.regionId} onChange={set('regionId')}>
              <option value="">Բոլորը</option>
              {(regions.data ?? []).map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Նվազագույն քանակ">
            <input inputMode="decimal" value={draft.minQuantity} onChange={set('minQuantity')} placeholder="օր.՝ 10" />
          </Field>
          <Field label="Առաքում՝ սկսած">
            <input type="date" value={draft.deliveryFrom} onChange={set('deliveryFrom')} />
          </Field>
          <Field label="Առաքում՝ մինչև">
            <input type="date" value={draft.deliveryTo} min={draft.deliveryFrom || undefined} onChange={set('deliveryTo')} />
          </Field>
          <div className="st-filters__actions">
            <Button onClick={apply}>Կիրառել</Button>
            <Button variant="ghost" onClick={reset} disabled={!hasFilters && !Object.values(draft).some(Boolean)}>
              Մաքրել
            </Button>
          </div>
        </div>
      </Card>
      <Card>{body}</Card>
    </>
  );
}

export default MarketplacePage;
