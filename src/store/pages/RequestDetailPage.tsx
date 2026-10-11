import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Lock, Paperclip, ShieldAlert } from 'lucide-react';
import { useStoreApi } from '@/store/api/storeApi';
import { useMyStore } from '@/store/context/MyStoreContext';
import { Badge, Banner, Card, EmptyState, ErrorState, InfoRow, LoadingState, PageHeader } from '@/store/components/ui';
import { errorCode, storeErrorMessage } from '@/store/utils/errors';
import { formatAmd, formatDate, formatDateTime, qtyWithUnit } from '@/store/utils/format';
import { QUOTABLE_REQUEST_STATUSES, QUOTATION_BADGE, REQUEST_STATUS_LABEL } from '@/store/utils/labels';

const BackLink = () => (
  <Link to="/store/requests" className="st-back">
    <ArrowLeft size={16} /> Հարցումներ
  </Link>
);

function RequestDetailPage() {
  const { id } = useParams();
  const requestId = Number(id);
  const api = useStoreApi();
  const { can } = useMyStore();
  const query = useQuery({
    queryKey: ['store', 'request', requestId],
    queryFn: () => api.marketplaceRequest(requestId),
    enabled: Number.isFinite(requestId),
    retry: (count, err) => count < 1 && errorCode(err) == null,
  });

  if (query.isPending) return <LoadingState />;
  if (query.isError) {
    if (errorCode(query.error) === 'STORE_NOT_VERIFIED') {
      return (
        <>
          <BackLink />
          <EmptyState icon={<ShieldAlert size={28} />} title="Հարցումները դեռ հասանելի չեն" text={storeErrorMessage(query.error)} />
        </>
      );
    }
    return (
      <>
        <BackLink />
        <ErrorState message={storeErrorMessage(query.error, 'Չհաջողվեց բեռնել հարցումը')} onRetry={() => query.refetch()} />
      </>
    );
  }

  const r = query.data;
  const my = r.myQuotation;
  const open = QUOTABLE_REQUEST_STATUSES.includes(r.status);
  const locked = my != null && my.status !== 'SUBMITTED' && my.status !== 'WITHDRAWN' && my.status !== 'EXPIRED';
  const canQuote = can.quote && open && !locked;
  const quoteLabel = my && my.status === 'SUBMITTED' ? 'Թարմացնել առաջարկը' : 'Ուղարկել գնային առաջարկ';
  const items = [...r.items].sort((a, b) => a.sequence - b.sequence);

  return (
    <>
      <PageHeader
        back={<BackLink />}
        title={r.title}
        subtitle={`${r.number} · ${REQUEST_STATUS_LABEL[r.status]}`}
        actions={
          canQuote ? (
            <Link to={`/store/requests/${r.id}/quote`} className="st-btn st-btn--primary">
              {quoteLabel}
            </Link>
          ) : null
        }
      />

      {!open && <Banner tone="neutral" title="Հարցումն այլևս չի ընդունում գնային առաջարկներ" />}
      {locked && (
        <Banner tone="info" title="Առաջարկը կողպված է">
          Գնորդն ընդունել է Ձեր առաջարկը (ամբողջությամբ կամ մասնակի)․ համաձայնեցված գներն այլևս չեն փոխվում։
        </Banner>
      )}
      {!can.quote && open && (
        <Banner tone="neutral">Ձեր դերը չի թույլատրում ուղարկել գնային առաջարկներ։ Դիմեք սեփականատիրոջը կամ վաճառքի մենեջերին։</Banner>
      )}

      <div className="st-grid st-grid--side">
        <div>
          <Card title={`Ապրանքներ (${items.length})`}>
            <div className="st-table-wrap">
              <table className="st-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Անվանում</th>
                    <th className="st-num">Քանակ</th>
                    <th>Տեխ. բնութագիր</th>
                    <th>Նշումներ</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((i, idx) => (
                    <tr key={i.id}>
                      <td>{idx + 1}</td>
                      <td>
                        <strong>{i.name || i.categoryName}</strong>
                        <div className="st-muted-text">{i.categoryName}</div>
                        {i.referenceImageUrl && (
                          <a href={i.referenceImageUrl} target="_blank" rel="noreferrer">
                            <img src={i.referenceImageUrl} alt="" className="st-thumb" />
                          </a>
                        )}
                      </td>
                      <td className="st-num">
                        {qtyWithUnit(i.quantity, i.unit)}
                        {i.remainingQuantity != null && i.remainingQuantity < i.quantity && (
                          <div className="st-muted-text">մնացել է՝ {qtyWithUnit(i.remainingQuantity, i.unit)}</div>
                        )}
                      </td>
                      <td>
                        {[
                          i.specification,
                          i.grade && `Մակնիշ/դաս՝ ${i.grade}`,
                          i.dimensions && `Չափեր՝ ${i.dimensions}`,
                          i.brand && `Բրենդ՝ ${i.brand}`,
                        ]
                          .filter(Boolean)
                          .map((t) => (
                            <div key={String(t)}>{t}</div>
                          ))}
                        {!i.specification && !i.grade && !i.dimensions && !i.brand && '—'}
                      </td>
                      <td>{i.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          {r.notes && (
            <Card title="Գնորդի նշումներ">
              <p className="st-pre">{r.notes}</p>
            </Card>
          )}
          {r.attachments.length > 0 && (
            <Card title="Կցված ֆայլեր">
              <ul className="st-list">
                {r.attachments.map((a) => (
                  <li key={a.id}>
                    <a href={a.fileUrl} target="_blank" rel="noreferrer">
                      <Paperclip size={14} /> {a.fileName || 'Ֆայլ'}
                    </a>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <div>
          <Card title="Առաքում">
            <InfoRow label="Քաղաք" value={r.deliveryCity || '—'} />
            <InfoRow label="Մարզ" value={r.deliveryRegionName || '—'} />
            <InfoRow label="Ցանկալի ամսաթիվ" value={formatDate(r.preferredDeliveryDate)} />
            <InfoRow label="Գնորդ" value={r.purchasingAccountType === 'COMPANY' ? 'Շինարարական ընկերություն' : 'Անհատ'} />
            <InfoRow label="Հրապարակված" value={formatDateTime(r.publishedAt)} />
            <InfoRow label="Ավարտվում է" value={formatDateTime(r.expiresAt)} />
          </Card>
          <Card title="Գնորդի կոնտակտներ">
            {r.contactRevealed ? (
              <>
                <InfoRow label="Գնորդ" value={r.buyerName || '—'} />
                <InfoRow label="Հասցե" value={[r.delivery?.addressLine, r.delivery?.city].filter(Boolean).join(', ') || '—'} />
                <InfoRow label="Կոնտակտ" value={r.delivery?.contactName || '—'} />
                <InfoRow
                  label="Հեռախոս"
                  value={r.delivery?.contactPhone ? <a href={`tel:${r.delivery.contactPhone}`}>{r.delivery.contactPhone}</a> : '—'}
                />
              </>
            ) : (
              <p className="st-muted-text">
                <Lock size={14} /> Գնորդի անունը, հեռախոսը և ճշգրիտ հասցեն կբացվեն, երբ գնորդը ընտրի Ձեր առաջարկը։
              </p>
            )}
          </Card>
          <Card title="Իմ առաջարկը">
            {my ? (
              <>
                <InfoRow label="Կարգավիճակ" value={<Badge def={QUOTATION_BADGE[my.status]} />} />
                <InfoRow label="Ընդհանուր գումար" value={formatAmd(my.totalAmount)} strong />
                <InfoRow label="Վավեր է մինչև" value={formatDateTime(my.validUntil)} />
                <InfoRow label="Տարբերակ" value={my.revision} />
              </>
            ) : (
              <p className="st-muted-text">Դեռ առաջարկ չեք ուղարկել։</p>
            )}
            {canQuote && (
              <Link to={`/store/requests/${r.id}/quote`} className="st-btn st-btn--primary st-btn--block" style={{ marginTop: 12 }}>
                {quoteLabel}
              </Link>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

export default RequestDetailPage;
