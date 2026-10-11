import { useState, type FormEvent } from 'react';
import { useAdjustWallet, useRecordDeposit, useSetWalletStatus } from '@/admin/api/withdrawals';
import Modal from '@/admin/components/Modal';
import { apiErrorMessage } from '@/admin/utils/errors';
import { formatCurrency } from '@/admin/utils/format';
import type { WalletStatus } from '@/types/enums';

interface WalletOwner {
  id: number;
  name: string;
}

interface WalletModalProps {
  /** Pre-selected wallet owner (from a detail page). When omitted the admin types the user id. */
  owner?: WalletOwner;
  onClose: () => void;
}

function OwnerField({ owner, value, onChange, idPrefix }: {
  owner?: WalletOwner;
  value: string;
  onChange: (value: string) => void;
  idPrefix: string;
}) {
  if (owner) {
    return (
      <div className="field">
        <label>Wallet owner</label>
        <div>
          {owner.name} <span className="field__hint">(user #{owner.id})</span>
        </div>
      </div>
    );
  }
  return (
    <div className="field">
      <label htmlFor={`${idPrefix}-owner`}>User id</label>
      <input id={`${idPrefix}-owner`} type="number" min={1} value={value} onChange={(event) => onChange(event.target.value)} />
      <span className="field__hint">The customer's or contractor owner's user id (see Users / Company details).</span>
    </div>
  );
}

/**
 * Money actually received by HayShen (bank transfer, POS...). There is no payment-provider
 * integration, so this is the only way real money enters a wallet. Idempotent per reference.
 */
export function RecordDepositModal({ owner, onClose }: WalletModalProps) {
  const [ownerUserId, setOwnerUserId] = useState(owner ? String(owner.id) : '');
  const [amount, setAmount] = useState('');
  const [externalReference, setExternalReference] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState<string | null>(null);
  const mutation = useRecordDeposit();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    const parsedOwnerId = Number(ownerUserId);
    const parsedAmount = Number(amount);
    if (!parsedOwnerId) {
      setError('Enter a valid user id.');
      return;
    }
    if (!amount || Number.isNaN(parsedAmount) || parsedAmount < 0.01) {
      setError('Enter the amount received (at least 0.01 AMD).');
      return;
    }
    if (!externalReference.trim()) {
      setError('The bank / POS reference is required.');
      return;
    }
    try {
      const balance = await mutation.mutateAsync({
        ownerUserId: parsedOwnerId,
        amount: Math.round(parsedAmount * 100) / 100,
        externalReference: externalReference.trim(),
        note: note.trim() || undefined,
      });
      setDone(`Deposit recorded. Available balance is now ${formatCurrency(balance?.availableBalance ?? null)}.`);
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to record the deposit.'));
    }
  };

  return (
    <Modal title="Record received payment" onClose={onClose}>
      <p style={{ color: '#666', marginBottom: 16 }}>
        Use only for money HayShen has <strong>actually received</strong> (bank transfer, POS terminal, etc.). It is
        credited to the user's available balance. The reference makes this safe to retry: the same reference is never
        credited twice.
      </p>
      {error && <div className="form-error">{error}</div>}
      {done ? (
        <>
          <div className="empty-state" style={{ textAlign: 'left' }}>{done}</div>
          <div className="form-actions">
            <button type="button" className="btn btn--primary" onClick={onClose}>
              Close
            </button>
          </div>
        </>
      ) : (
        <form onSubmit={handleSubmit}>
          <OwnerField owner={owner} value={ownerUserId} onChange={setOwnerUserId} idPrefix="deposit" />
          <div className="field">
            <label htmlFor="deposit-amount">Amount received (AMD)</label>
            <input
              id="deposit-amount"
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="deposit-reference">Bank / POS reference</label>
            <input
              id="deposit-reference"
              maxLength={100}
              value={externalReference}
              onChange={(event) => setExternalReference(event.target.value)}
              placeholder="e.g. transfer id from the bank statement"
            />
          </div>
          <div className="field">
            <label htmlFor="deposit-note">Note (optional)</label>
            <textarea id="deposit-note" maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn--secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : 'Record deposit'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

/** Compensating correction for a booking mistake. Not for real payments - use RecordDepositModal. */
export function AdjustWalletModal({ owner, onClose }: WalletModalProps) {
  const [ownerUserId, setOwnerUserId] = useState(owner ? String(owner.id) : '');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const mutation = useAdjustWallet();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    const parsedOwnerId = Number(ownerUserId);
    const parsedAmount = Number(amount);
    if (!parsedOwnerId || !amount || Number.isNaN(parsedAmount) || parsedAmount === 0) {
      setError('Enter a valid user id and a non-zero amount.');
      return;
    }
    if (!note.trim()) {
      setError('A note explaining the correction is required.');
      return;
    }
    try {
      await mutation.mutateAsync({
        ownerUserId: parsedOwnerId,
        amount: Math.round(parsedAmount * 100) / 100,
        note: note.trim(),
      });
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to apply the correction.'));
    }
  };

  return (
    <Modal title="Balance correction" onClose={onClose}>
      <p style={{ color: '#666', marginBottom: 16 }}>
        A compensating correction to the user's <strong>available</strong> balance, only for fixing mistakes. Positive
        credits, negative debits (it can never take the balance below zero). For money actually received, use{' '}
        <em>Record received payment</em> instead.
      </p>
      {error && <div className="form-error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <OwnerField owner={owner} value={ownerUserId} onChange={setOwnerUserId} idPrefix="adjustment" />
        <div className="field">
          <label htmlFor="adjustment-amount">Amount (AMD, signed)</label>
          <input
            id="adjustment-amount"
            type="number"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="adjustment-note">Reason for the correction</label>
          <textarea
            id="adjustment-note"
            maxLength={500}
            required
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="e.g. reverses duplicate deposit recorded on 2026-10-02 (ref 12345)"
          />
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn--secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn--primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Apply correction'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/** Freeze (blocks withdrawals and hold releases) or unfreeze a user's wallet. */
export function WalletStatusModal({ owner, status, onClose }: { owner: WalletOwner; status: WalletStatus; onClose: () => void }) {
  const [error, setError] = useState('');
  const mutation = useSetWalletStatus();
  const freezing = status === 'FROZEN';

  const handleConfirm = async () => {
    setError('');
    try {
      await mutation.mutateAsync({ userId: owner.id, status });
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to update the wallet status.'));
    }
  };

  return (
    <Modal title={freezing ? 'Freeze wallet' : 'Unfreeze wallet'} onClose={onClose}>
      <p style={{ color: '#666', marginBottom: 16 }}>
        {freezing
          ? `${owner.name} will not be able to withdraw, and their held earnings will not be released, until the wallet is unfrozen. Balances are not changed.`
          : `${owner.name}'s wallet will become active again: withdrawals are allowed and due holds are released on the next run.`}
      </p>
      {error && <div className="form-error">{error}</div>}
      <div className="form-actions">
        <button type="button" className="btn btn--secondary" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className={freezing ? 'btn btn--danger' : 'btn btn--primary'}
          disabled={mutation.isPending}
          onClick={handleConfirm}
        >
          {mutation.isPending ? 'Saving…' : freezing ? 'Freeze' : 'Unfreeze'}
        </button>
      </div>
    </Modal>
  );
}
