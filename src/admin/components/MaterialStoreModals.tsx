import { useState } from 'react';
import { useSetMaterialStoreStatus, useVerifyMaterialStore } from '@/admin/api/materials';
import Modal from '@/admin/components/Modal';
import { apiErrorMessage } from '@/admin/utils/errors';
import type { StoreResponse } from '@/admin/materialsTypes';
import type { VerificationStatus } from '@/types/enums';

const VERIFY_COPY: Record<VerificationStatus, { title: string; action: string; effect: string; danger: boolean }> = {
  VERIFIED: {
    title: 'Verify store',
    action: 'Verify',
    effect:
      'The store becomes visible to buyers and, while it is also Active, can open the materials marketplace, submit quotations and receive supplier orders.',
    danger: false,
  },
  REJECTED: {
    title: 'Reject store',
    action: 'Reject',
    effect:
      'The store can no longer open the marketplace or quote. Existing supplier orders are not cancelled. The note is shown to the store so it can fix its details.',
    danger: true,
  },
  PENDING: {
    title: 'Move back to pending',
    action: 'Move to pending',
    effect: 'The store stops operating until it is reviewed again (same effect as not verified yet).',
    danger: true,
  },
};

interface VerifyStoreModalProps {
  store: StoreResponse;
  target: VerificationStatus;
  onClose: () => void;
}

/** Confirmation for Verify / Reject / Back to pending (PUT stores/{id}/verify). A note is required to reject. */
export function VerifyStoreModal({ store, target, onClose }: VerifyStoreModalProps) {
  const copy = VERIFY_COPY[target];
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const mutation = useVerifyMaterialStore();

  const handleConfirm = async () => {
    setError('');
    if (target === 'REJECTED' && !note.trim()) {
      setError('Add a note explaining why the store is rejected.');
      return;
    }
    try {
      await mutation.mutateAsync({ id: store.id, verificationStatus: target, note: note.trim() || undefined });
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to update verification.'));
    }
  };

  return (
    <Modal title={`${copy.title} — ${store.name}`} onClose={onClose}>
      <div className="detail-grid payout-details">
        <div className="detail-item">
          <div className="detail-item__label">Registration no.</div>
          <div className="detail-item__value">{store.registrationNumber}</div>
        </div>
        <div className="detail-item">
          <div className="detail-item__label">Tax ID</div>
          <div className="detail-item__value">{store.taxId}</div>
        </div>
        {store.legalName && (
          <div className="detail-item">
            <div className="detail-item__label">Legal name</div>
            <div className="detail-item__value">{store.legalName}</div>
          </div>
        )}
      </div>
      <div className="admin-note">{copy.effect}</div>
      {error && <div className="form-error">{error}</div>}
      <div className="field">
        <label htmlFor="store-verify-note">{target === 'REJECTED' ? 'Reason (required)' : 'Note (optional)'}</label>
        <textarea
          id="store-verify-note"
          maxLength={1000}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Shared with the store"
        />
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn--secondary" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className={copy.danger ? 'btn btn--danger' : 'btn btn--primary'}
          disabled={mutation.isPending}
          onClick={handleConfirm}
        >
          {mutation.isPending ? 'Saving…' : copy.action}
        </button>
      </div>
    </Modal>
  );
}

/** Confirmation for Suspend / Activate (PUT stores/{id}/status). */
export function StoreStatusModal({ store, onClose }: { store: StoreResponse; onClose: () => void }) {
  const suspending = store.status === 'ACTIVE';
  const [error, setError] = useState('');
  const mutation = useSetMaterialStoreStatus();

  const handleConfirm = async () => {
    setError('');
    try {
      await mutation.mutateAsync({ id: store.id, status: suspending ? 'SUSPENDED' : 'ACTIVE' });
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to update the store status.'));
    }
  };

  return (
    <Modal title={`${suspending ? 'Suspend' : 'Activate'} — ${store.name}`} onClose={onClose}>
      <div className="admin-note">
        {suspending
          ? 'A suspended store cannot open the marketplace, quote or be awarded new orders. Supplier orders already in progress are not cancelled automatically.'
          : store.verificationStatus === 'VERIFIED'
            ? 'The store becomes operational again: it can open the marketplace and quote.'
            : `The store becomes Active, but it stays non-operational until it is verified (currently ${store.verificationStatus.toLowerCase()}).`}
      </div>
      {error && <div className="form-error">{error}</div>}
      <div className="form-actions">
        <button type="button" className="btn btn--secondary" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className={suspending ? 'btn btn--danger' : 'btn btn--primary'}
          disabled={mutation.isPending}
          onClick={handleConfirm}
        >
          {mutation.isPending ? 'Saving…' : suspending ? 'Suspend store' : 'Activate store'}
        </button>
      </div>
    </Modal>
  );
}
