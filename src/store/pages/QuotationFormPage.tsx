import { Fragment, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ChevronDown, ChevronRight } from 'lucide-react';
import { useStoreApi } from '@/store/api/storeApi';
import { Banner, Button, Card, EmptyState, ErrorState, Field, FormError, LoadingState, PageHeader, toast } from '@/store/components/ui';
import { errorCode, messageForCode, storeErrorMessage } from '@/store/utils/errors';
import {
  formatAmd,
  formatQty,
  isoToLocalDate,
  localDatePlus,
  localToIso,
  parseNumber,
  qtyWithUnit,
  roundMoney,
  roundQty,
  trimOrNull,
} from '@/store/utils/format';
import { AVAILABILITY_OPTIONS, QUOTABLE_REQUEST_STATUSES, UNIT_LABEL } from '@/store/utils/labels';
import type { MarketplaceRequest, MaterialRequestItem, QuotationItemInput, QuotationResponse, SubmitQuotationInput } from '@/store/types';

interface Line {
  item: MaterialRequestItem;
  canSupply: boolean | null; // null = not answered yet
  unitPrice: string;
  quantity: string;
  brand: string;
  offeredName: string;
  offeredSpecification: string;
  substitute: boolean;
  substitutionDetails: string;
  availability: string;
  expectedDeliveryDate: string;
  warranty: string;
  notes: string;
  expanded: boolean;
}

interface LineErrors {
  canSupply?: string;
  unitPrice?: string;
  quantity?: string;
  substitutionDetails?: string;
}

const amountText = (v: number | null | undefined) => (v == null ? '' : String(v));

function newLine(item: MaterialRequestItem, existing?: QuotationResponse['items'][number]): Line {
  return {
    item,
    canSupply: existing ? existing.canSupply : null,
    unitPrice: amountText(existing?.unitPrice),
    quantity: formatQty(existing?.quantity ?? item.quantity),
    brand: existing?.brand ?? '',
    offeredName: existing?.offeredName ?? '',
    offeredSpecification: existing?.offeredSpecification ?? '',
    substitute: existing?.substitute ?? false,
    substitutionDetails: existing?.substitutionDetails ?? '',
    availability: existing?.availability ?? '',
    expectedDeliveryDate: existing?.expectedDeliveryDate ?? '',
    warranty: existing?.warranty ?? '',
    notes: existing?.notes ?? '',
    expanded: Boolean(existing?.substitute || existing?.warranty || existing?.notes || existing?.offeredSpecification),
  };
}

function lineTotal(line: Line): number | null {
  if (line.canSupply !== true) return null;
  const price = parseNumber(line.unitPrice);
  const qty = parseNumber(line.quantity);
  if (!Number.isFinite(price) || !Number.isFinite(qty)) return null;
  return roundMoney(price * qty);
}

const optionalAmount = (text: string) => (text.trim() ? parseNumber(text) : 0);

function QuotationFormPage() {
  const { id } = useParams();
  const requestId = Number(id);
  const api = useStoreApi();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const source = useQuery({
    queryKey: ['store', 'quote-source', requestId],
    queryFn: async (): Promise<{ request: MarketplaceRequest; existing: QuotationResponse | null }> => {
      const request = await api.marketplaceRequest(requestId);
      const existing = request.myQuotation ? await api.quotation(request.myQuotation.id) : null;
      return { request, existing };
    },
    enabled: Number.isFinite(requestId),
    gcTime: 0,
    retry: (count, err) => count < 1 && errorCode(err) == null,
  });

  const [lines, setLines] = useState<Line[]>([]);
  const [deliveryFee, setDeliveryFee] = useState('0');
  const [taxAmount, setTaxAmount] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');
  const [validUntil, setValidUntil] = useState(localDatePlus(7));
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [lineErrors, setLineErrors] = useState<Record<number, LineErrors>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!source.data || initialized) return;
    const { request, existing } = source.data;
    const byItem = new Map((existing?.items ?? []).map((i) => [i.requestItemId, i]));
    setLines([...request.items].sort((a, b) => a.sequence - b.sequence).map((item) => newLine(item, byItem.get(item.id))));
    if (existing) {
      setDeliveryFee(amountText(existing.deliveryFee) || '0');
      setTaxAmount(existing.taxAmount ? amountText(existing.taxAmount) : '');
      setDiscountAmount(existing.discountAmount ? amountText(existing.discountAmount) : '');
      const until = isoToLocalDate(existing.validUntil);
      setValidUntil(until && until > localDatePlus(0) ? until : localDatePlus(7));
      setExpectedDeliveryDate(existing.expectedDeliveryDate ?? '');
      setNotes(existing.notes ?? '');
    }
    setInitialized(true);
  }, [source.data, initialized]);

  const update = (index: number, patch: Partial<Line>) => {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
    setLineErrors((prev) => (prev[index] ? { ...prev, [index]: {} } : prev));
    setFormError(null);
  };

  const totals = useMemo(() => {
    const subtotal = roundMoney(lines.reduce((sum, l) => sum + (lineTotal(l) ?? 0), 0));
    const num = (t: string) => {
      const n = parseNumber(t);
      return Number.isFinite(n) ? n : 0;
    };
    const fee = num(deliveryFee);
    const tax = num(taxAmount);
    const discount = num(discountAmount);
    return { subtotal, fee, tax, discount, total: roundMoney(subtotal + fee + tax - discount) };
  }, [lines, deliveryFee, taxAmount, discountAmount]);

  const answered = lines.filter((l) => l.canSupply !== null).length;
  const supplied = lines.filter((l) => l.canSupply === true).length;

  const validate = (): SubmitQuotationInput | null => {
    const fail = (msg: string) => {
      setFormError(msg);
      return null;
    };
    const errs: Record<number, LineErrors> = {};
    lines.forEach((l, i) => {
      const e: LineErrors = {};
      if (l.canSupply === null) e.canSupply = 'Նշեք՝ կարող եք մատակարարել, թե ոչ';
      if (l.canSupply) {
        const price = parseNumber(l.unitPrice);
        if (!Number.isFinite(price) || price <= 0) e.unitPrice = 'Մուտքագրեք միավորի գինը';
        const qty = parseNumber(l.quantity);
        if (!Number.isFinite(qty) || qty <= 0) e.quantity = 'Մուտքագրեք քանակը';
        else if (qty > l.item.quantity) e.quantity = `Ոչ ավելի, քան ${qtyWithUnit(l.item.quantity, l.item.unit)}`;
        if (l.substitute && !l.substitutionDetails.trim()) e.substitutionDetails = 'Բացատրեք, թե ինչով եք փոխարինում';
      }
      if (Object.keys(e).length) errs[i] = e;
    });
    setLineErrors(errs);
    if (Object.keys(errs).length) {
      setLines((prev) => prev.map((l, i) => (errs[i]?.substitutionDetails ? { ...l, expanded: true } : l)));
      return fail('Ստուգեք նշված տողերը։ Յուրաքանչյուր տողի համար պետք է նշել՝ կարող եք մատակարարել, թե ոչ։');
    }
    if (supplied === 0) return fail('Առաջարկը պետք է ներառի առնվազն մեկ ապրանք, որը կարող եք մատակարարել');
    const fee = parseNumber(deliveryFee || '0');
    const tax = optionalAmount(taxAmount);
    const discount = optionalAmount(discountAmount);
    if (!Number.isFinite(fee) || fee < 0) return fail('Առաքման վճարը սխալ է');
    if (!Number.isFinite(tax) || tax < 0) return fail('Հարկի գումարը սխալ է');
    if (!Number.isFinite(discount) || discount < 0) return fail('Զեղչի գումարը սխալ է');
    if (totals.total < 0) return fail('Զեղչը չի կարող գերազանցել առաջարկի գումարը');
    if (!validUntil) return fail('Նշեք առաջարկի վավերականության ժամկետը');
    const validIso = localToIso(validUntil, '23:59');
    if (!validIso || new Date(validIso) <= new Date()) return fail('Վավերականության ժամկետը պետք է լինի ապագայում');

    const items: QuotationItemInput[] = lines.map((l) =>
      l.canSupply
        ? {
            requestItemId: l.item.id,
            canSupply: true,
            unitPrice: roundMoney(parseNumber(l.unitPrice)),
            quantity: roundQty(parseNumber(l.quantity)),
            offeredName: trimOrNull(l.offeredName),
            offeredSpecification: trimOrNull(l.offeredSpecification),
            brand: trimOrNull(l.brand),
            substitute: l.substitute,
            substitutionDetails: l.substitute ? trimOrNull(l.substitutionDetails) : null,
            availability: l.availability || null,
            expectedDeliveryDate: l.expectedDeliveryDate || null,
            warranty: trimOrNull(l.warranty),
            notes: trimOrNull(l.notes),
          }
        : { requestItemId: l.item.id, canSupply: false, substitute: false, notes: trimOrNull(l.notes) }
    );
    return {
      validUntil: validIso,
      deliveryFee: roundMoney(fee),
      taxAmount: roundMoney(tax),
      discountAmount: roundMoney(discount),
      expectedDeliveryDate: expectedDeliveryDate || null,
      notes: trimOrNull(notes),
      items,
    };
  };

  const submit = async () => {
    const body = validate();
    if (!body) return;
    setSubmitting(true);
    try {
      await api.submitQuotation(requestId, body);
      queryClient.invalidateQueries({ queryKey: ['store'] });
      toast(source.data?.existing?.status === 'SUBMITTED' ? 'Առաջարկը թարմացված է' : 'Գնային առաջարկն ուղարկված է');
      navigate(`/store/requests/${requestId}`);
    } catch (err) {
      setFormError(storeErrorMessage(err, 'Չհաջողվեց ուղարկել առաջարկը'));
      setSubmitting(false);
    }
  };

  const back = (
    <Link to={`/store/requests/${requestId}`} className="st-back">
      <ArrowLeft size={16} /> Հարցում
    </Link>
  );

  if (source.isPending) return <LoadingState />;
  if (source.isError) {
    return (
      <>
        {back}
        <ErrorState message={storeErrorMessage(source.error, 'Չհաջողվեց բեռնել հարցումը')} onRetry={() => source.refetch()} />
      </>
    );
  }

  const { request, existing } = source.data;
  const revising = existing?.status === 'SUBMITTED';
  const locked = existing != null && ['ACCEPTED', 'PARTIALLY_ACCEPTED', 'REJECTED'].includes(existing.status);
  if (!QUOTABLE_REQUEST_STATUSES.includes(request.status) || locked) {
    return (
      <>
        {back}
        <EmptyState
          title={locked ? 'Առաջարկը կողպված է' : 'Հարցումն այլևս չի ընդունում առաջարկներ'}
          text={locked ? messageForCode('QUOTATION_LOCKED') : undefined}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        back={back}
        title={revising ? 'Թարմացնել գնային առաջարկը' : 'Գնային առաջարկ'}
        subtitle={`${request.number} · ${request.title}`}
      />
      {revising && (
        <Banner tone="info">
          Դուք թարմացնում եք արդեն ուղարկված առաջարկը (տարբերակ {existing?.revision})։ Գնորդը կստանա ծանուցում։
        </Banner>
      )}

      <Card title={`Ապրանքներ · պատասխանված ${answered}/${lines.length}, մատակարարվող՝ ${supplied}`}>
        <div className="st-table-wrap">
          <table className="st-table st-quote-table">
            <thead>
              <tr>
                <th />
                <th>Պահանջված ապրանք</th>
                <th>Կմատակարարե՞ք</th>
                <th className="st-num">Միավորի գին, ֏</th>
                <th className="st-num">Քանակ</th>
                <th className="st-num">Գումար</th>
                <th>Բրենդ / առաջարկվող անվանում</th>
                <th>Առկայություն</th>
                <th>Առաքման ամսաթիվ</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => {
                const e = lineErrors[i] ?? {};
                const off = l.canSupply !== true;
                const total = lineTotal(l);
                return (
                  <Fragment key={l.item.id}>
                    <tr className={`${e.canSupply ? 'st-row-error' : ''} ${l.canSupply === false ? 'st-row-muted' : ''}`}>
                      <td>
                        <button
                          type="button"
                          className="st-icon-btn"
                          onClick={() => update(i, { expanded: !l.expanded })}
                          aria-label="Լրացուցիչ դաշտեր"
                          aria-expanded={l.expanded}
                        >
                          {l.expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>
                      </td>
                      <td className="st-quote-table__name">
                        <strong>{l.item.name || l.item.categoryName}</strong>
                        <div className="st-muted-text">
                          {qtyWithUnit(l.item.quantity, l.item.unit)}
                          {[l.item.specification, l.item.grade, l.item.dimensions, l.item.brand].filter(Boolean).length > 0 &&
                            ` · ${[l.item.specification, l.item.grade, l.item.dimensions, l.item.brand].filter(Boolean).join(', ')}`}
                        </div>
                      </td>
                      <td>
                        <div className="st-segmented">
                          <button
                            type="button"
                            className={l.canSupply === true ? 'st-segmented__on' : ''}
                            onClick={() => update(i, { canSupply: true })}
                            disabled={submitting}
                          >
                            Այո
                          </button>
                          <button
                            type="button"
                            className={l.canSupply === false ? 'st-segmented__on st-segmented__on--no' : ''}
                            onClick={() => update(i, { canSupply: false })}
                            disabled={submitting}
                          >
                            Ոչ
                          </button>
                        </div>
                        {e.canSupply && <div className="st-field__error">{e.canSupply}</div>}
                      </td>
                      <td className="st-num">
                        <input
                          className={`st-cell-input${e.unitPrice ? ' st-cell-input--error' : ''}`}
                          inputMode="decimal"
                          value={l.unitPrice}
                          onChange={(ev) => update(i, { unitPrice: ev.target.value })}
                          disabled={off || submitting}
                          placeholder="0"
                          title={e.unitPrice}
                        />
                        {e.unitPrice && <div className="st-field__error">{e.unitPrice}</div>}
                      </td>
                      <td className="st-num">
                        <div className="st-cell-unit">
                          <input
                            className={`st-cell-input${e.quantity ? ' st-cell-input--error' : ''}`}
                            inputMode="decimal"
                            value={l.quantity}
                            onChange={(ev) => update(i, { quantity: ev.target.value })}
                            disabled={off || submitting}
                          />
                          <span>{UNIT_LABEL[l.item.unit]}</span>
                        </div>
                        {e.quantity && <div className="st-field__error">{e.quantity}</div>}
                      </td>
                      <td className="st-num">
                        <strong>{total == null ? '—' : formatAmd(total)}</strong>
                      </td>
                      <td>
                        <input
                          className="st-cell-input st-cell-input--text"
                          value={l.brand}
                          onChange={(ev) => update(i, { brand: ev.target.value })}
                          disabled={off || submitting}
                          placeholder="Բրենդ"
                          maxLength={120}
                        />
                        <input
                          className="st-cell-input st-cell-input--text"
                          value={l.offeredName}
                          onChange={(ev) => update(i, { offeredName: ev.target.value })}
                          disabled={off || submitting}
                          placeholder="Առաջարկվող անվանում"
                          maxLength={200}
                        />
                      </td>
                      <td>
                        <select
                          className="st-cell-input st-cell-input--text"
                          value={l.availability}
                          onChange={(ev) => update(i, { availability: ev.target.value })}
                          disabled={off || submitting}
                        >
                          <option value="">—</option>
                          {AVAILABILITY_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="date"
                          className="st-cell-input st-cell-input--text"
                          value={l.expectedDeliveryDate}
                          min={localDatePlus(0)}
                          onChange={(ev) => update(i, { expectedDeliveryDate: ev.target.value })}
                          disabled={off || submitting}
                        />
                      </td>
                    </tr>
                    {l.expanded && (
                      <tr className="st-quote-table__extra">
                        <td />
                        <td colSpan={8}>
                          <div className="st-grid st-grid--3">
                            <Field label="Տեխնիկական բնութագիր">
                              <input
                                value={l.offeredSpecification}
                                onChange={(ev) => update(i, { offeredSpecification: ev.target.value })}
                                disabled={off || submitting}
                                maxLength={500}
                              />
                            </Field>
                            <Field label="Երաշխիք">
                              <input
                                value={l.warranty}
                                onChange={(ev) => update(i, { warranty: ev.target.value })}
                                disabled={off || submitting}
                                maxLength={300}
                                placeholder="օր.՝ 12 ամիս"
                              />
                            </Field>
                            <Field label="Նշումներ">
                              <input
                                value={l.notes}
                                onChange={(ev) => update(i, { notes: ev.target.value })}
                                disabled={submitting}
                                maxLength={1000}
                              />
                            </Field>
                          </div>
                          <label className="st-check">
                            <input
                              type="checkbox"
                              checked={l.substitute}
                              onChange={(ev) => update(i, { substitute: ev.target.checked })}
                              disabled={off || submitting}
                            />
                            Առաջարկում եմ փոխարինող ապրանք (այլ բրենդ, մակնիշ կամ չափ)
                          </label>
                          {l.substitute && (
                            <Field label="Փոխարինման բացատրություն" required error={e.substitutionDetails}>
                              <textarea
                                rows={2}
                                value={l.substitutionDetails}
                                onChange={(ev) => update(i, { substitutionDetails: ev.target.value })}
                                disabled={off || submitting}
                                maxLength={1000}
                              />
                            </Field>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="st-grid st-grid--side">
        <Card title="Պայմաններ">
          <div className="st-grid st-grid--2">
            <Field label="Առաքման վճար, ֏" required>
              <input inputMode="decimal" value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)} disabled={submitting} />
            </Field>
            <Field label="Հարկ (ԱԱՀ), ֏">
              <input inputMode="decimal" value={taxAmount} onChange={(e) => setTaxAmount(e.target.value)} disabled={submitting} placeholder="0" />
            </Field>
            <Field label="Զեղչ, ֏">
              <input
                inputMode="decimal"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(e.target.value)}
                disabled={submitting}
                placeholder="0"
              />
            </Field>
            <Field label="Վավեր է մինչև" required hint="Ներառյալ նշված օրը">
              <input type="date" value={validUntil} min={localDatePlus(0)} onChange={(e) => setValidUntil(e.target.value)} disabled={submitting} />
            </Field>
            <Field label="Ակնկալվող առաքման ամսաթիվ">
              <input
                type="date"
                value={expectedDeliveryDate}
                min={localDatePlus(0)}
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                disabled={submitting}
              />
            </Field>
          </div>
          <Field label="Նշումներ գնորդի համար">
            <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} disabled={submitting} maxLength={2000} />
          </Field>
        </Card>

        <Card title="Ամփոփում" className="st-sticky">
          <div className="st-totals">
            <div>
              <span>Ապրանքներ</span>
              <span>{formatAmd(totals.subtotal)}</span>
            </div>
            <div>
              <span>+ Առաքում</span>
              <span>{formatAmd(totals.fee)}</span>
            </div>
            <div>
              <span>+ Հարկ</span>
              <span>{formatAmd(totals.tax)}</span>
            </div>
            <div>
              <span>− Զեղչ</span>
              <span>{formatAmd(totals.discount)}</span>
            </div>
            <div className="st-totals__grand">
              <span>Ընդամենը</span>
              <span>{formatAmd(totals.total)}</span>
            </div>
          </div>
          <FormError message={formError} />
          <Button onClick={submit} loading={submitting} className="st-btn--block">
            {revising ? 'Թարմացնել առաջարկը' : 'Ուղարկել առաջարկը'}
          </Button>
          <p className="st-muted-text" style={{ marginTop: 8 }}>
            Ընդունվելուց հետո համաձայնեցված գները չեն փոխվի։ Մինչ այդ կարող եք թարմացնել առաջարկը։
          </p>
        </Card>
      </div>
    </>
  );
}

export default QuotationFormPage;
