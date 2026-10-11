import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, ClipboardList, Clock, FileText, Hourglass, Package, Truck, Wallet } from 'lucide-react';
import { useStoreApi } from '@/store/api/storeApi';
import { useMyStore } from '@/store/context/MyStoreContext';
import { Badge, Card, Column, DataTable, ErrorState, LoadingState, PageHeader, StatCard } from '@/store/components/ui';
import { storeErrorMessage } from '@/store/utils/errors';
import { formatAmd, formatDateTime } from '@/store/utils/format';
import { ORDER_BADGE } from '@/store/utils/labels';
import type { SupplierOrderResponse } from '@/store/types';

function DashboardPage() {
  const api = useStoreApi();
  const navigate = useNavigate();
  const { store, can } = useMyStore();
  const dashboard = useQuery({ queryKey: ['store', 'dashboard'], queryFn: api.dashboard });
  const recent = useQuery({ queryKey: ['store', 'orders', 'recent'], queryFn: () => api.orders(undefined, 0, 5) });

  const d = dashboard.data;
  const showBalances = (store.myRole === 'OWNER' || store.myRole === 'ADMIN') && d && d.availableBalance != null;

  const columns: Column<SupplierOrderResponse>[] = [
    { key: 'number', header: 'Պատվեր', render: (o) => <strong>{o.number}</strong> },
    { key: 'title', header: 'Հարցում', render: (o) => o.requestTitle },
    { key: 'buyer', header: 'Գնորդ', render: (o) => o.buyerName ?? '—' },
    { key: 'total', header: 'Գումար', render: (o) => formatAmd(o.totalAmount), className: 'st-num' },
    { key: 'status', header: 'Կարգավիճակ', render: (o) => <Badge def={ORDER_BADGE[o.status]} /> },
    { key: 'created', header: 'Ստեղծված', render: (o) => formatDateTime(o.createdAt) },
  ];

  return (
    <>
      <PageHeader title="Վահանակ" subtitle={`Բարի գալուստ, ${store.name}`} />
      {dashboard.isPending ? (
        <LoadingState />
      ) : dashboard.isError ? (
        <ErrorState message={storeErrorMessage(dashboard.error, 'Չհաջողվեց բեռնել վահանակը')} onRetry={() => dashboard.refetch()} />
      ) : (
        <>
          <div className="st-stats">
            <StatCard
              icon={<ClipboardList size={20} />}
              label="Բաց հարցումներ"
              value={d.operational ? d.openRequests : '—'}
              hint={d.operational ? undefined : 'Հասանելի կլինի հաստատումից հետո'}
              to={d.operational ? <Link to="/store/requests">Դիտել</Link> : undefined}
            />
            <StatCard icon={<Hourglass size={20} />} label="Սպասում են իմ առաջարկին" value={d.operational ? d.awaitingQuotationFromMe : '—'} />
            <StatCard icon={<FileText size={20} />} label="Ուղարկված առաջարկներ" value={d.submittedQuotations} />
            <StatCard icon={<CheckCircle2 size={20} />} label="Ընդունված առաջարկներ" value={d.acceptedQuotations} />
            <StatCard icon={<Clock size={20} />} label="Սպասում են վճարման" value={d.ordersAwaitingPayment} />
            <StatCard icon={<Package size={20} />} label="Ակտիվ պատվերներ" value={d.activeOrders} />
            <StatCard icon={<Truck size={20} />} label="Առաքման մեջ" value={d.ordersInDelivery} />
            <StatCard icon={<CheckCircle2 size={20} />} label="Ավարտված պատվերներ" value={d.completedOrders} />
          </div>
          {showBalances && (
            <div className="st-stats st-stats--2">
              <StatCard
                icon={<Wallet size={20} />}
                label="Հասանելի մնացորդ"
                value={formatAmd(d.availableBalance)}
                to={can.wallet ? <Link to="/store/wallet">Դրամապանակ</Link> : undefined}
              />
              <StatCard icon={<Hourglass size={20} />} label="Պահման ժամկետում" value={formatAmd(d.heldBalance)} />
            </div>
          )}
        </>
      )}

      <Card title="Վերջին պատվերները" actions={<Link to="/store/orders">Բոլորը</Link>}>
        {recent.isPending ? (
          <LoadingState />
        ) : recent.isError ? (
          <ErrorState message={storeErrorMessage(recent.error, 'Չհաջողվեց բեռնել պատվերները')} onRetry={() => recent.refetch()} />
        ) : (
          <DataTable
            columns={columns}
            rows={recent.data.items}
            rowKey={(o) => o.id}
            onRowClick={(o) => navigate(`/store/orders/${o.id}`)}
            emptyText="Պատվերներ դեռ չկան։ Ընդունված գնային առաջարկները կդառնան պատվերներ։"
          />
        )}
      </Card>
    </>
  );
}

export default DashboardPage;
