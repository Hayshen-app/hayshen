import { useState, type FormEvent } from 'react';
import { useCompanies } from '@/admin/api/companies';
import { useDispatchOrder } from '@/admin/api/orders';
import Modal from '@/admin/components/Modal';
import { ApiError } from '@/api/client';
import type { OrderResponse } from '@/admin/types';

function DispatchModal({ order, onClose }: { order: OrderResponse; onClose: () => void }) {
  const { data, isLoading } = useCompanies({ status: 'VERIFIED', size: 100 });
  const [companyId, setCompanyId] = useState('');
  const [error, setError] = useState('');
  const mutation = useDispatchOrder();

  const companies = data?.items || [];

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!companyId) {
      setError('Choose a company.');
      return;
    }
    setError('');
    try {
      await mutation.mutateAsync({ id: order.id, companyId: Number(companyId) });
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to dispatch this order.');
    }
  };

  return (
    <Modal title={`Dispatch order #${order.id}`} onClose={onClose}>
      {error && <div className="form-error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="dispatch-company">Verified company</label>
          <select
            id="dispatch-company"
            value={companyId}
            onChange={(event) => setCompanyId(event.target.value)}
            disabled={isLoading}
          >
            <option value="">Select a company…</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.companyName} — {company.city}
              </option>
            ))}
          </select>
          {!isLoading && companies.length === 0 && (
            <span className="field__hint">No verified companies yet — verify one under Companies first.</span>
          )}
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn--secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn--primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Dispatching…' : 'Dispatch'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default DispatchModal;
