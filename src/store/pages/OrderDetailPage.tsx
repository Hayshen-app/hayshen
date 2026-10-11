import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Upload } from 'lucide-react';
import { useStoreApi } from '@/store/api/storeApi';
import { useMyStore } from '@/store/context/MyStoreContext';
import { Badge, Banner, Button, Card, ConfirmDialog, ErrorState, Field, FormError, InfoRow, LoadingState, Modal, PageHeader, toast } from '@/store/components/ui';
import { imageFileError } from '@/store/hooks/useLookups';
import { storeErrorMessage } from '@/store/utils/errors';
import { formatAmd, formatDateTime, formatQty, localDatePlus, localToIso, parseNumber, qtyWithUnit, roundQty, trimOrNull } from '@/store/utils/format';
import {
  DELIVERY_BADGE,
  DELIVERY_STEP_LABEL,
  HISTORY_ACTION_LABEL,
  HOLD_BADGE,
  ISSUE_LABEL,
  LIVE_DELIVERY,
  NEXT_DELIVERY_STEPS,
  ORDER_BADGE,
  PAYMENT_LABEL,
  SHIPPABLE_ORDER,
  UNIT_LABEL,
} from '@/store/utils/labels';
import type { DeliveryStepStatus, MaterialDelivery, SupplierOrderResponse } from '@/store/types';

/** Quantity per order line still free for a new delivery: accepted − quantities on live deliveries. */
function remainingToDeliver(order: SupplierOrderResponse): Record<number, number> {
  const committed: Record<number, number> = {};
  order.deliveries
    .filter((d) => LIVE_DELIVERY.includes(d.status))
    .forEach((d) => d.items.forEach((i) => (committed[i.orderItemId] = (committed[i.orderItemId] ?? 0) + i.quantity)));
  const out: Record<number, number> = {};
  order.items.forEach((i) => (out[i.id] = Math.max(0, roundQty(i.acceptedQuantity - (committed[i.id] ?? 0)))));
  return out;
}

// ------------------------------------------------------------------ schedule modal

function ScheduleDeliveryModal({ order, onClose, onDone }: { order: SupplierOrderResponse; onClose: () => void; onDone: (o: SupplierOrderResponse) => void }) {
  const api = useStoreApi();
  const remaining = remainingToDeliver(order);
  const [qty, setQty] = useState<Record<number, string>>(() =>
    Object.fromEntries(order.items.map((i) => [i.id, remaining[i.id] > 0 ? formatQty(remaining[i.id]) : '0']))
  );
  const [date, setDate] = useState(localDatePlus(1));
  const [time, setTime] = useState('10:00');
  const [contactName, setContactName] = useState(order.deliveryAddress?.contactName ?? '');
  const [contactPhone, setContactPhone] = useState(order.deliveryAddress?.contactPhone ?? '');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const items: { orderItemId: number; quantity: number }[] = [];
    for (const item of order.items) {
      const raw = (qty[item.id] ?? '').trim();
      if (!raw) continue;
      const q = parseNumber(raw);
      if (!Number.isFinite(q) || q < 0) return setError(`«${item.description}»՝ սխալ քանակ`);
      if (q > remaining[item.id] + 1e-9) {
        return setError(`«${item.description}»՝ մնացել է ոչ ավելի, քան ${qtyWithUnit(remaining[item.id], item.unit)}`);
      }
      if (q > 0) items.push({ orderItemId: item.id, quantity: roundQty(q) });
    }
    if (!items.length) return setError('Նշեք առնվազն մեկ ապրանքի քանակ');
    let scheduledAt: string | null = null;
    if (date) {
      scheduledAt = localToIso(date, time || '00:00');
      if (!scheduledAt) return setError('Սխալ ամսաթիվ կամ ժամ');
    }
    setBusy(true);
    setError(null);
    try {
      const updated = await api.scheduleDelivery(order.id, {
        scheduledAt,
        contactName: trimOrNull(contactName),
        contactPhone: trimOrNull(contactPhone),
        note: trimOrNull(note),
        items,
      });
      toast('Առաքումը պլանավորված է');
      onDone(updated);
    } catch (err) {
      setError(storeErrorMessage(err, 'Չհաջողվեց պլանավորել առաքումը'));
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Պլանավորել առաքում"
      wide
      busy={busy}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Չեղարկել
          </Button>
          <Button onClick={submit} loading={busy}>
            Պլանավորել
          </Button>
        </>
      }
    >
      <p className="st-muted-text">Կարող եք առաքել մասերով․ նշեք այս առաքման քանակները։</p>
      <div className="st-table-wrap">
        <table className="st-table">
          <thead>
            <tr>
              <th>Ապրանք</th>
              <th className="st-num">Համաձայնեցված</th>
              <th className="st-num">Մնացել է</th>
              <th className="st-num">Այս առաքմամբ</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((i) => (
              <tr key={i.id}>
                <td>{i.description}</td>
                <td className="st-num">{qtyWithUnit(i.acceptedQuantity, i.unit)}</td>
                <td className="st-num">{qtyWithUnit(remaining[i.id], i.unit)}</td>
                <td className="st-num">
                  <div className="st-cell-unit">
                    <input
                      className="st-cell-input"
                      inputMode="decimal"
                      value={qty[i.id] ?? ''}
                      onChange={(e) => setQty((p) => ({ ...p, [i.id]: e.target.value }))}
                      disabled={busy || remaining[i.id] <= 0}
                    />
                    <span>{UNIT_LABEL[i.unit]}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="st-grid st-grid--2">
        <Field label="Ամսաթիվ">
          <input type="date" value={date} min={localDatePlus(0)} onChange={(e) => setDate(e.target.value)} disabled={busy} />
        </Field>
        <Field label="Ժամ">
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} disabled={busy} />
        </Field>
        <Field label="Կոնտակտային անձ" hint="Լռելյայն՝ գնորդի նշած կոնտակտը">
          <input value={contactName} onChange={(e) => setContactName(e.target.value)} disabled={busy} maxLength={150} />
        </Field>
        <Field label="Հեռախոս">
          <input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} disabled={busy} maxLength={30} />
        </Field>
      </div>
      <Field label="Նշում">
        <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} disabled={busy} maxLength={1000} />
      </Field>
      <FormError message={error} />
    </Modal>
  );
}

// ------------------------------------------------------------------ delivery status modal

function DeliveryStatusModal({
  delivery,
  status,
  onClose,
  onDone,
}: {
  delivery: MaterialDelivery;
  status: DeliveryStepStatus;
  onClose: () => void;
  onDone: (o: SupplierOrderResponse) => void;
}) {
  const api = useStoreApi();
  const [recipientName, setRecipientName] = useState(delivery.contactName ?? '');
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const delivered = status === 'DELIVERED';
  const needsReason = status === 'FAILED' || status === 'CANCELED';
  const simple = status === 'PREPARING' || status === 'DISPATCHED';

  const submit = async () => {
    if (delivered && !recipientName.trim()) return setError('Նշեք ստացողի անունը');
    if (needsReason && !note.trim()) return setError('Նշեք պատճառը');
    setBusy(true);
    setError(null);
    try {
      let proofOfDeliveryUrl: string | null = null;
      if (delivered && file) proofOfDeliveryUrl = await api.upload('delivery-proofs', file);
      const updated = await api.updateDelivery(delivery.id, {
        status,
        recipientName: delivered ? recipientName.trim() : null,
        proofOfDeliveryUrl,
        note: trimOrNull(note),
      });
      toast('Առաքման կարգավիճակը թարմացված է');
      onDone(updated);
    } catch (err) {
      setError(storeErrorMessage(err, 'Չհաջողվեց թարմացնել առաքումը'));
      setBusy(false);
    }
  };

  const title = delivered
    ? 'Նշել առաքված'
    : status === 'FAILED'
      ? 'Առաքումը ձախողվեց'
      : status === 'CANCELED'
        ? 'Չեղարկել առաքումը'
        : DELIVERY_STEP_LABEL[status];

  return (
    <Modal
      title={title}
      busy={busy}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Փակել
          </Button>
          <Button variant={needsReason ? 'danger' : 'primary'} onClick={submit} loading={busy}>
            Հաստատել
          </Button>
        </>
      }
    >
      {simple && (
        <p className="st-muted-text">
          {status === 'DISPATCHED'
            ? 'Նշե՞լ, որ ապրանքները ճանապարհին են։ Գնորդը կստանա ծանուցում։'
            : 'Նշե՞լ, որ առաքումը պատրաստվում է։'}
        </p>
      )}
      {delivered && (
        <>
          <p className="st-muted-text">Գնորդը կստանա ծանուցում և պետք է հաստատի ստացված քանակները։ Վճարումը կփոխանցվի հաստատումից հետո։</p>
          <Field label="Ստացողի անունը" required>
            <input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} disabled={busy} maxLength={150} />
          </Field>
          <Field label="Առաքման լուսանկար (ըստ ցանկության)" hint="JPG/PNG, մինչև 10 ՄԲ">
            <input
              type="file"
              accept="image/*"
              disabled={busy}
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                const msg = f ? imageFileError(f) : null;
                setError(msg);
                setFile(msg ? null : f);
              }}
            />
          </Field>
        </>
      )}
      {(needsReason || delivered || simple) && (
        <Field label={needsReason ? 'Պատճառ' : 'Նշում'} required={needsReason}>
          <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} disabled={busy} maxLength={1000} />
        </Field>
      )}
      {busy && delivered && file && <p className="st-muted-text">Լուսանկարը վերբեռնվում է…</p>}
      <FormError message={error} />
    </Modal>
  );
}

// ------------------------------------------------------------------ page

function OrderDetailPage() {
  const { id } = useParams();
  const orderId = Number(id);
  const api = useStoreApi();
  const queryClient = useQueryClient();
  const { can } = useMyStore();
  const key = ['store', 'order', orderId];
  const query = useQuery({ queryKey: key, queryFn: () => api.order(orderId), enabled: Number.isFinite(orderId) });

  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [step, setStep] = useState<{ delivery: MaterialDelivery; status: DeliveryStepStatus } | null>(null);
  const [preparingOpen, setPreparingOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const apply = (updated: SupplierOrderResponse) => {
    queryClient.setQueryData(key, updated);
    queryClient.invalidateQueries({ queryKey: ['store', 'orders'] });
    queryClient.invalidateQueries({ queryKey: ['store', 'dashboard'] });
    setScheduleOpen(false);
    setStep(null);
  };

  const back = (
    <Link to="/store/orders" className="st-back">
      <ArrowLeft size={16} /> Պատվերներ
    </Link>
  );

  if (query.isPending) return <LoadingState />;
  if (query.isError) {
    return (
      <>
        {back}
        <ErrorState message={storeErrorMessage(query.error, 'Չհաջողվեց բեռնել պատվերը')} onRetry={() => query.refetch()} />
      </>
    );
  }

  const order = query.data;
  const addr = order.deliveryAddress;
  const remaining = remainingToDeliver(order);
  const shippable = SHIPPABLE_ORDER.includes(order.status);
  const anyRemaining = Object.values(remaining).some((v) => v > 0);
  const deliveriesEditable = !['CANCELED', 'COMPLETED', 'DISPUTED'].includes(order.status);
  const shipped = order.deliveries.some((d) => d.status === 'DISPATCHED' || d.status === 'DELIVERED');
  const cancellable = can.quote && !shipped && ['AWAITING_PAYMENT', 'FUNDED', 'PREPARING'].includes(order.status);

  return (
    <>
      <PageHeader
        back={back}
        title={`Պատվեր ${order.number}`}
        subtitle={`${order.requestNumber} · ${order.requestTitle}`}
        actions={
          <>
            {order.status === 'FUNDED' && (
              <Button variant="secondary" onClick={() => setPreparingOpen(true)}>
                Սկսել պատրաստումը
              </Button>
            )}
            {shippable && anyRemaining && <Button onClick={() => setScheduleOpen(true)}>Պլանավորել առաքում</Button>}
            {cancellable && (
              <Button variant="danger" onClick={() => setCancelOpen(true)}>
                Չեղարկել պատվերը
              </Button>
            )}
          </>
        }
      />

      {order.status === 'AWAITING_PAYMENT' && (
        <Banner tone="warning" title="Սպասում է գնորդի վճարմանը">
          Մի պատրաստեք և մի ուղարկեք ապրանքները, քանի դեռ գնորդը չի վճարել։ Վճարումից հետո գումարը կպահվի HayShen-ի մոտ, և Դուք
          կստանաք ծանուցում։
        </Banner>
      )}
      {order.status === 'DISPUTED' && (
        <Banner tone="danger" title="Բաց վեճ">
          Գնորդը նշել է խնդիր։ HayShen-ի աջակցման ծառայությունը կքննի վեճը և կորոշի վճարման բաշխումը։
        </Banner>
      )}
      {order.canceledAt && (
        <Banner tone="neutral" title={`Չեղարկված՝ ${formatDateTime(order.canceledAt)}`}>
          {order.cancelReason}
        </Banner>
      )}

      <div className="st-grid st-grid--side">
        <div>
          <Card title="Ապրանքներ">
            <div className="st-table-wrap">
              <table className="st-table">
                <thead>
                  <tr>
                    <th>Ապրանք</th>
                    <th className="st-num">Քանակ</th>
                    <th className="st-num">Միավորի գին</th>
                    <th className="st-num">Գումար</th>
                    <th className="st-num">Առաքված</th>
                    <th className="st-num">Ստացված</th>
                    {shippable && <th className="st-num">Մնացել է պլանավորելու</th>}
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((i) => (
                    <tr key={i.id}>
                      <td>
                        <strong>{i.description}</strong>
                        {i.milestoneTitle && <div className="st-muted-text">Փուլ՝ {i.milestoneTitle}</div>}
                        {i.issueType && (
                          <div className="st-error-text">
                            Խնդիր՝ {ISSUE_LABEL[i.issueType]}
                            {i.issueNote ? ` · ${i.issueNote}` : ''}
                          </div>
                        )}
                      </td>
                      <td className="st-num">{qtyWithUnit(i.acceptedQuantity, i.unit)}</td>
                      <td className="st-num">{formatAmd(i.agreedUnitPrice)}</td>
                      <td className="st-num">{formatAmd(i.totalPrice)}</td>
                      <td className="st-num">{qtyWithUnit(i.deliveredQuantity, i.unit)}</td>
                      <td className="st-num">{i.receivedQuantity != null ? qtyWithUnit(i.receivedQuantity, i.unit) : '—'}</td>
                      {shippable && <td className="st-num">{qtyWithUnit(remaining[i.id], i.unit)}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="st-totals st-totals--inline">
              <div>
                <span>Ապրանքներ</span>
                <span>{formatAmd(order.subtotal)}</span>
              </div>
              <div>
                <span>+ Առաքում</span>
                <span>{formatAmd(order.deliveryFee)}</span>
              </div>
              <div>
                <span>+ Հարկ</span>
                <span>{formatAmd(order.taxAmount ?? 0)}</span>
              </div>
              <div>
                <span>− Զեղչ</span>
                <span>{formatAmd(order.discountAmount ?? 0)}</span>
              </div>
              <div className="st-totals__grand">
                <span>Ընդամենը</span>
                <span>{formatAmd(order.totalAmount)}</span>
              </div>
            </div>
          </Card>

          <Card
            title={`Առաքումներ (${order.deliveries.length})`}
            actions={
              shippable && anyRemaining ? (
                <Button size="sm" onClick={() => setScheduleOpen(true)}>
                  Նոր առաքում
                </Button>
              ) : null
            }
          >
            {order.deliveries.length === 0 && (
              <p className="st-muted-text">
                {order.status === 'AWAITING_PAYMENT' ? 'Առաքումները հասանելի կլինեն վճարումից հետո։' : 'Առաքումներ դեռ պլանավորված չեն։'}
              </p>
            )}
            {order.deliveries.map((d, idx) => {
              const steps = deliveriesEditable ? NEXT_DELIVERY_STEPS[d.status] ?? [] : [];
              return (
                <div key={d.id} className="st-delivery">
                  <div className="st-delivery__head">
                    <strong>Առաքում #{idx + 1}</strong>
                    <Badge def={DELIVERY_BADGE[d.status]} />
                  </div>
                  <div className="st-grid st-grid--2">
                    <div>
                      <InfoRow label="Պլանավորված" value={formatDateTime(d.scheduledAt)} />
                      {d.dispatchedAt && <InfoRow label="Ուղարկված" value={formatDateTime(d.dispatchedAt)} />}
                      {d.deliveredAt && <InfoRow label="Առաքված" value={formatDateTime(d.deliveredAt)} />}
                      <InfoRow label="Կոնտակտ" value={[d.contactName, d.contactPhone].filter(Boolean).join(', ') || '—'} />
                      {d.recipientName && <InfoRow label="Ստացող" value={d.recipientName} />}
                    </div>
                    <ul className="st-list">
                      {d.items.map((i) => (
                        <li key={i.orderItemId}>
                          {i.description} — {formatQty(i.quantity)}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {d.note && <p className="st-muted-text">{d.note}</p>}
                  {d.proofOfDeliveryUrl && (
                    <a href={d.proofOfDeliveryUrl} target="_blank" rel="noreferrer">
                      <img src={d.proofOfDeliveryUrl} alt="Առաքման լուսանկար" className="st-proof" />
                    </a>
                  )}
                  {steps.length > 0 && (
                    <div className="st-row st-row--wrap">
                      {steps.map((s) => (
                        <Button
                          key={s}
                          size="sm"
                          variant={s === 'FAILED' || s === 'CANCELED' ? 'danger' : s === 'DELIVERED' ? 'primary' : 'secondary'}
                          onClick={() => setStep({ delivery: d, status: s })}
                        >
                          {s === 'DELIVERED' && <Upload size={14} />}
                          {DELIVERY_STEP_LABEL[s]}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </Card>

          {order.disputes.length > 0 && (
            <Card title="Վեճեր">
              {order.disputes.map((d) => (
                <div key={d.id} className="st-delivery">
                  <div className="st-delivery__head">
                    <strong>{formatDateTime(d.openedAt)}</strong>
                    <Badge tone={d.status === 'OPEN' ? 'danger' : 'neutral'} label={d.status === 'OPEN' ? 'Բաց' : 'Լուծված'} />
                  </div>
                  <p>{d.reason}</p>
                  <p className="st-muted-text">Բացել է՝ {d.openedByName ?? '—'}</p>
                  {d.resolutionNote && <p className="st-muted-text">Որոշում՝ {d.resolutionNote}</p>}
                  {d.refundAmount != null && <p className="st-muted-text">Վերադարձ գնորդին՝ {formatAmd(d.refundAmount)}</p>}
                </div>
              ))}
            </Card>
          )}

          {order.history.length > 0 && (
            <Card title="Պատմություն">
              <ul className="st-timeline">
                {[...order.history].reverse().map((h, idx) => (
                  <li key={`${h.at}-${idx}`}>
                    <span className="st-timeline__date">{formatDateTime(h.at)}</span>
                    <span>
                      <strong>{HISTORY_ACTION_LABEL[h.action] ?? h.action}</strong>
                      {h.details ? ` · ${h.details}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <div>
          <Card title="Կարգավիճակ">
            <InfoRow label="Պատվեր" value={<Badge def={ORDER_BADGE[order.status]} />} />
            <InfoRow label="Առաքում" value={<Badge def={DELIVERY_BADGE[order.deliveryStatus]} />} />
            <InfoRow label="Ստեղծված" value={formatDateTime(order.createdAt)} />
            {order.fundedAt && <InfoRow label="Վճարված" value={formatDateTime(order.fundedAt)} />}
            {order.completedAt && <InfoRow label="Ավարտված" value={formatDateTime(order.completedAt)} />}
            {order.buyerRating != null && <InfoRow label="Գնահատական" value={`${order.buyerRating} / 5`} />}
            {order.buyerReview && <p className="st-muted-text">«{order.buyerReview}»</p>}
          </Card>

          <Card title="Գնորդ և առաքման հասցե">
            <InfoRow label="Գնորդ" value={order.buyerName ?? '—'} />
            <InfoRow label="Տեսակ" value={order.purchasingAccountType === 'COMPANY' ? 'Շինարարական ընկերություն' : 'Անհատ'} />
            <InfoRow label="Հասցե" value={[addr?.addressLine, addr?.city, addr?.regionName].filter(Boolean).join(', ') || '—'} />
            <InfoRow label="Կոնտակտ" value={addr?.contactName ?? '—'} />
            <InfoRow label="Հեռախոս" value={addr?.contactPhone ? <a href={`tel:${addr.contactPhone}`}>{addr.contactPhone}</a> : '—'} />
            {addr?.latitude != null && addr?.longitude != null && (
              <a href={`https://www.google.com/maps/search/?api=1&query=${addr.latitude},${addr.longitude}`} target="_blank" rel="noreferrer">
                Բացել քարտեզում
              </a>
            )}
          </Card>

          <Card title="Վճարում">
            <InfoRow label="Կարգավիճակ" value={PAYMENT_LABEL[order.paymentStatus] ?? order.paymentStatus} />
            {order.payment && (
              <>
                <InfoRow label="Վճարված գումար" value={formatAmd(order.payment.amount)} />
                {order.payment.settledAmount ? <InfoRow label="Փոխանցված խանութին" value={formatAmd(order.payment.settledAmount)} /> : null}
                {order.payment.refundedAmount ? <InfoRow label="Վերադարձված գնորդին" value={formatAmd(order.payment.refundedAmount)} /> : null}
              </>
            )}
            <p className="st-muted-text st-note">
              Գնորդի վճարումը պահվում է HayShen-ի մոտ։ Գումարը փոխանցվում է խանութին, երբ գնորդը հաստատում է ստացումը (վճարվում է միայն
              առաքված և ընդունված քանակը), այնուհետև անցնում է պահման ժամկետը (սահմանում է HayShen-ը, սովորաբար 3 օր)։ Խնդիրների դեպքում
              բացվում է վեճ, և գումարը չի շարժվում մինչև որոշումը։
            </p>
            {order.storeHold && (
              <>
                <InfoRow label="Պահման ժամկետ" value={<Badge def={HOLD_BADGE[order.storeHold.status]} />} />
                <InfoRow label="Գումար" value={formatAmd(order.storeHold.amount - (order.storeHold.reversedAmount ?? 0))} strong />
                <InfoRow
                  label={order.storeHold.releasedAt ? 'Հասանելի է դարձել' : 'Հասանելի կդառնա'}
                  value={order.storeHold.status === 'BLOCKED' ? 'Վեճի լուծումից հետո' : formatDateTime(order.storeHold.releasedAt ?? order.storeHold.releaseAt)}
                />
              </>
            )}
          </Card>
        </div>
      </div>

      {scheduleOpen && <ScheduleDeliveryModal order={order} onClose={() => setScheduleOpen(false)} onDone={apply} />}
      {step && <DeliveryStatusModal delivery={step.delivery} status={step.status} onClose={() => setStep(null)} onDone={apply} />}
      {preparingOpen && (
        <ConfirmDialog
          title="Սկսել պատրաստումը"
          message="Գնորդը կստանա ծանուցում, որ պատվերը պատրաստվում է։"
          onClose={() => setPreparingOpen(false)}
          onConfirm={async () => {
            try {
              apply(await api.startPreparing(order.id));
            } catch (err) {
              throw new Error(storeErrorMessage(err, 'Չհաջողվեց թարմացնել պատվերը'));
            }
            toast('Պատվերը նշված է որպես պատրաստվող');
          }}
        />
      )}
      {cancelOpen && (
        <ConfirmDialog
          title="Չեղարկե՞լ պատվերը"
          message={
            order.paymentStatus === 'RESERVED'
              ? 'Գնորդի վճարած գումարն ամբողջությամբ կվերադարձվի նրա դրամապանակ։ Գործողությունը հետ շրջել հնարավոր չէ։'
              : 'Պատվերը կչեղարկվի։ Գործողությունը հետ շրջել հնարավոր չէ։'
          }
          confirmLabel="Չեղարկել պատվերը"
          danger
          confirmDisabled={!cancelReason.trim()}
          onClose={() => {
            setCancelOpen(false);
            setCancelReason('');
          }}
          onConfirm={async () => {
            try {
              apply(await api.cancelOrder(order.id, cancelReason.trim()));
            } catch (err) {
              throw new Error(storeErrorMessage(err, 'Չհաջողվեց չեղարկել պատվերը'));
            }
            toast('Պատվերը չեղարկված է');
          }}
        >
          <Field label="Չեղարկման պատճառը" required>
            <textarea rows={3} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} maxLength={1000} />
          </Field>
        </ConfirmDialog>
      )}
    </>
  );
}

export default OrderDetailPage;
