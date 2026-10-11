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
  onClose: () => void;
}

const RESOLUTION_EFFECT: Record<DisputeResolution, string> = {
  RELEASE_TO_CONTRACTOR:
    'The milestone is (or stays) accepted. Its earnings go to the contractor through the normal 7-day hold, then become withdrawable.',
  REFUND_TO_CONSUMER:
    "The funded amount goes back to the customer's available balance. If the contractor already received it into their hold, it is reversed from the hold.",
};

/** Two-step: pick the outcome + note, then confirm the money effect. Used by Disputes and Order Details. */
function ResolveDisputeModal({ orderId, milestoneId, milestoneTitle, amount, reason, openedByName, onClose }: ResolveDisputeModalProps) {
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
            <div style={{ marginTop: 6 }}>{RESOLUTION_EFFECT[resolution]}</div>
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
            {resolution && <span className="field__hint">{RESOLUTION_EFFECT[resolution]}</span>}
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
