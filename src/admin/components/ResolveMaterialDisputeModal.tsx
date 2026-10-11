import { useState } from 'react';
import { useResolveMaterialDispute } from '@/admin/api/materials';
import Modal from '@/admin/components/Modal';
import { apiErrorMessage } from '@/admin/utils/errors';
import { formatCurrency, formatDateTime } from '@/admin/utils/format';
import type { MaterialDisputeInfo, SupplierOrderResponse } from '@/admin/materialsTypes';
import '@/admin/pages/materialsPages.scss';

const toCents = (value: number) => Math.round(value * 100);

/**
 * What the admin is splitting, mirroring MaterialOrderService.resolveDispute:
 * - payment RESERVED (buyer has not accepted yet): the whole order total is still the buyer's reserved money;
 *   the refund goes back to the buyer, the rest is settled to the store and enters the store hold.
 * - otherwise (already settled): only the store's held earnings (amount − reversed) are left to decide;
 *   the refund is reversed out of the hold, the rest stays in the hold and is released when it ends.
 */
export function disputeMoneyContext(order: SupplierOrderResponse) {
  if (order.paymentStatus === 'RESERVED') {
    return { mode: 'RESERVED' as const, max: Number(order.totalAmount) };
  }
  if (order.storeHold) {
    const remaining = Number(order.storeHold.amount) - Number(order.storeHold.reversedAmount ?? 0);
    return { mode: 'HELD' as const, max: Math.max(0, remaining) };
  }
  return { mode: 'NONE' as const, max: 0 };
}

interface ResolveMaterialDisputeModalProps {
  order: SupplierOrderResponse;
  dispute: MaterialDisputeInfo;
  onClose: () => void;
}

function ResolveMaterialDisputeModal({ order, dispute, onClose }: ResolveMaterialDisputeModalProps) {
  const { mode, max } = disputeMoneyContext(order);
  const [refund, setRefund] = useState('');
  const [note, setNote] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const mutation = useResolveMaterialDispute();

  const refundValue = refund.trim() === '' ? NaN : Number(refund);
  const valid = Number.isFinite(refundValue) && refundValue >= 0 && toCents(refundValue) <= toCents(max);
  const toStore = valid ? (toCents(max) - toCents(refundValue)) / 100 : null;

  const handleContinue = () => {
    setError('');
    if (!Number.isFinite(refundValue) || refundValue < 0) {
      setError('Enter the amount to refund to the buyer (0 or more).');
      return;
    }
    if (Math.abs(refundValue * 100 - toCents(refundValue)) > 1e-6) {
      setError('Use at most two decimals.');
      return;
    }
    if (toCents(refundValue) > toCents(max)) {
      setError(`The refund can't exceed ${formatCurrency(max)}.`);
      return;
    }
    if (!note.trim()) {
      setError('A resolution note is required (it is sent to the buyer and the store).');
      return;
    }
    setConfirming(true);
  };

  const handleConfirm = async () => {
    setError('');
    try {
      await mutation.mutateAsync({ disputeId: dispute.id, refundToBuyer: toCents(refundValue) / 100, note: note.trim() });
      onClose();
    } catch (err) {
      setConfirming(false);
      setError(apiErrorMessage(err, 'Failed to resolve the dispute.'));
    }
  };

  const explanation =
    mode === 'RESERVED' ? (
      <>
        The buyer has not accepted the delivery yet, so the full order total ({formatCurrency(max)}) is still reserved in
        the buyer&rsquo;s wallet. The refund goes back to the buyer&rsquo;s available balance; the rest is settled to the
        store and enters the store hold (<code>materials.store_hold_days</code>) before it becomes withdrawable.
      </>
    ) : (
      <>
        The order was already settled. The store&rsquo;s earnings still held are {formatCurrency(max)}. The refund is
        reversed out of the store hold and credited to the buyer&rsquo;s available balance; the rest stays in the
        store&rsquo;s hold and is released when the hold ends.
      </>
    );

  return (
    <Modal title={`Resolve dispute — ${order.number}`} onClose={onClose}>
      <div className="detail-grid payout-details">
        <div className="detail-item">
          <div className="detail-item__label">Store</div>
          <div className="detail-item__value">{order.store?.name}</div>
        </div>
        <div className="detail-item">
          <div className="detail-item__label">Buyer</div>
          <div className="detail-item__value">{order.buyerName}</div>
        </div>
        <div className="detail-item">
          <div className="detail-item__label">Order total</div>
          <div className="detail-item__value">{formatCurrency(order.totalAmount)}</div>
        </div>
        <div className="detail-item">
          <div className="detail-item__label">Opened by</div>
          <div className="detail-item__value">
            {dispute.openedByName || '—'} · {formatDateTime(dispute.openedAt)}
          </div>
        </div>
        <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
          <div className="detail-item__label">Reason</div>
          <div className="detail-item__value">{dispute.reason}</div>
        </div>
      </div>

      <div className="materials__split">
        <div className="materials__split-cell">
          <span className="field__hint">{mode === 'RESERVED' ? 'Reserved from buyer' : 'Store hold remaining'}</span>
          <strong>{formatCurrency(max)}</strong>
        </div>
        {mode === 'HELD' && order.storeHold && (
          <div className="materials__split-cell">
            <span className="field__hint">Hold status</span>
            <strong>
              {order.storeHold.status} · release {formatDateTime(order.storeHold.releaseAt)}
            </strong>
          </div>
        )}
      </div>

      {mode === 'NONE' ? (
        <>
          <div className="form-error">
            Nothing is left to decide: the payment is {order.paymentStatus.toLowerCase().replace(/_/g, ' ')} and there
            are no held store earnings. The API will reject a resolution.
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn--secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="admin-note">{explanation}</div>
          {error && <div className="form-error">{error}</div>}

          {confirming ? (
            <>
              <div className="admin-note">
                <strong>Confirm resolution</strong>
                <div style={{ marginTop: 6 }}>
                  Buyer receives <strong>{formatCurrency(refundValue)}</strong> back to the available balance.
                </div>
                <div>
                  Store gets <strong>{formatCurrency(toStore)}</strong>{' '}
                  {mode === 'RESERVED' ? '(settled into the store hold).' : '(stays in the store hold).'}
                </div>
                <div style={{ marginTop: 6 }}>The order becomes Completed. This cannot be undone from the console.</div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn--secondary" onClick={() => setConfirming(false)}>
                  Back
                </button>
                <button
                  type="button"
                  className={refundValue > 0 ? 'btn btn--danger' : 'btn btn--primary'}
                  disabled={mutation.isPending}
                  onClick={handleConfirm}
                >
                  {mutation.isPending ? 'Saving…' : 'Confirm resolution'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="field">
                <label htmlFor="material-dispute-refund">Refund to buyer (AMD)</label>
                <input
                  id="material-dispute-refund"
                  type="number"
                  min={0}
                  max={max}
                  step="0.01"
                  inputMode="decimal"
                  value={refund}
                  onChange={(event) => setRefund(event.target.value)}
                />
                <div className="materials__quick">
                  <button type="button" className="btn btn--secondary btn--sm" onClick={() => setRefund(String(max))}>
                    Full refund to buyer
                  </button>
                  <button type="button" className="btn btn--secondary btn--sm" onClick={() => setRefund('0')}>
                    Pay store in full
                  </button>
                </div>
                <span className="field__hint">
                  {valid
                    ? `Buyer gets ${formatCurrency(refundValue)} · store gets ${formatCurrency(toStore)}`
                    : `Between 0 and ${formatCurrency(max)}.`}
                </span>
              </div>
              <div className="field">
                <label htmlFor="material-dispute-note">Resolution note</label>
                <textarea
                  id="material-dispute-note"
                  maxLength={1000}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Sent to the buyer and the store"
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn--secondary" onClick={onClose}>
                  Cancel
                </button>
                <button type="button" className="btn btn--primary" onClick={handleContinue}>
                  Continue
                </button>
              </div>
            </>
          )}
        </>
      )}
    </Modal>
  );
}

export default ResolveMaterialDisputeModal;
