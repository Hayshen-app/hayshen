import { useState } from 'react';
import { useResolveDispute } from '@/admin/api/disputes';
import Modal from '@/admin/components/Modal';
import { apiErrorMessage } from '@/admin/utils/errors';
import { formatCurrency } from '@/admin/utils/format';
import type { DisputeResolution } from '@/types/enums';

interface ResolveDisputeModalProps {
  orderId: number;
  milestoneId: number;
  milestoneTitle: string;
  amount: number;
  reason?: string | null;
  openedByName?: string | null;
  /** Whether the customer already paid the milestone. Unknown (Disputes list) = explain both cases. */
  paid?: boolean;
  onClose: () => void;
}

// Pay after completion: the money effect depends on whether the customer has already paid the milestone.
const RESOLUTION_EFFECT: Record<DisputeResolution, { unpaid: string; paid: string }> = {
  RELEASE_TO_CONTRACTOR: {
    unpaid:
      'Not paid yet: the milestone goes back to "Confirmed - payment due". No money moves now; the customer must pay it, and the payment then enters the contractor’s 7-day hold.',
    paid: 'Already paid: the milestone returns to Paid and the contractor’s 7-day hold resumes; the earnings become withdrawable when it ends.',
  },
  REFUND_TO_CONSUMER: {
    unpaid: 'Not paid yet: the milestone is cancelled. No money moves and the customer owes nothing for it.',
    paid: 'Already paid: the amount is reversed from the contractor’s hold and refunded to the customer’s available balance; the milestone becomes Refunded.',
  },
};

function EffectText({ resolution, paid }: { resolution: DisputeResolution; paid?: boolean }) {
  const effect = RESOLUTION_EFFECT[resolution];
  if (paid === undefined) {
    return (
      <>
        <div>{effect.unpaid}</div>
        <div style={{ marginTop: 4 }}>{effect.paid}</div>
      </>
    );
  }
  return <>{paid ? effect.paid : effect.unpaid}</>;
}

/** Two-step: pick the outcome + note, then confirm the money effect. Used by Disputes and Order Details. */
function ResolveDisputeModal({
  orderId,
  milestoneId,
  milestoneTitle,
  amount,
  reason,
  openedByName,
  paid,
  onClose,
}: ResolveDisputeModalProps) {
  const [resolution, setResolution] = useState<DisputeResolution | ''>('');
  const [note, setNote] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const mutation = useResolveDispute();

  const handleContinue = () => {
    setError('');
    if (!resolution) {
      setError('Choose how the dispute is resolved.');
      return;
    }
    if (!note.trim()) {
      setError('A resolution note is required.');
      return;
    }
    setConfirming(true);
  };

  const handleConfirm = async () => {
    if (!resolution) return;
    setError('');
    try {
      await mutation.mutateAsync({ milestoneId, orderId, resolution, note: note.trim() });
      onClose();
    } catch (err) {
      setConfirming(false);
      setError(apiErrorMessage(err, 'Failed to resolve the dispute.'));
    }
  };

  return (
    <Modal title={`Resolve dispute — order #${orderId}`} onClose={onClose}>
      <div className="detail-grid payout-details">
        <div className="detail-item">
          <div className="detail-item__label">Milestone</div>
          <div className="detail-item__value">
            {milestoneTitle} (#{milestoneId})
          </div>
        </div>
        <div className="detail-item">
          <div className="detail-item__label">Amount</div>
          <div className="detail-item__value">{formatCurrency(amount)}</div>
        </div>
        {paid !== undefined && (
          <div className="detail-item">
            <div className="detail-item__label">Customer payment</div>
            <div className="detail-item__value">{paid ? 'Paid' : 'Not paid yet'}</div>
          </div>
        )}
        {openedByName && (
          <div className="detail-item">
            <div className="detail-item__label">Opened by</div>
            <div className="detail-item__value">{openedByName}</div>
          </div>
        )}
        {reason && (
          <div className="detail-item">
            <div className="detail-item__label">Reason</div>
            <div className="detail-item__value">{reason}</div>
          </div>
        )}
      </div>

      {error && <div className="form-error">{error}</div>}

      {confirming && resolution ? (
        <>
          <div className="admin-note">
            <strong>
              {resolution === 'RELEASE_TO_CONTRACTOR' ? 'Release to contractor' : 'Refund to customer'} —{' '}
              {formatCurrency(amount)}
            </strong>
            <div style={{ marginTop: 6 }}>
              <EffectText resolution={resolution} paid={paid} />
            </div>
            <div style={{ marginTop: 6 }}>This cannot be undone from the console.</div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn--secondary" onClick={() => setConfirming(false)}>
              Back
            </button>
            <button
              type="button"
              className={resolution === 'REFUND_TO_CONSUMER' ? 'btn btn--danger' : 'btn btn--primary'}
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
            <label htmlFor="dispute-resolution">Resolution</label>
            <select
              id="dispute-resolution"
              value={resolution}
              onChange={(event) => setResolution(event.target.value as DisputeResolution | '')}
            >
              <option value="">Choose…</option>
              <option value="RELEASE_TO_CONTRACTOR">Release to contractor</option>
              <option value="REFUND_TO_CONSUMER">Refund to customer</option>
            </select>
            {resolution && (
              <span className="field__hint">
                <EffectText resolution={resolution} paid={paid} />
              </span>
            )}
          </div>
          <div className="field">
            <label htmlFor="dispute-note">Resolution note</label>
            <textarea id="dispute-note" maxLength={1000} value={note} onChange={(event) => setNote(event.target.value)} />
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
    </Modal>
  );
}

export default ResolveDisputeModal;
