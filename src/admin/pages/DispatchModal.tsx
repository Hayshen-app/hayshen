import { useState, type FormEvent } from 'react';
import { useCompanies } from '@/admin/api/companies';
import { useDispatchOrder } from '@/admin/api/orders';
import Modal from '@/admin/components/Modal';
import { apiErrorMessage } from '@/admin/utils/errors';
import { formatCurrency } from '@/admin/utils/format';
import type { OrderBidResponse, OrderResponse } from '@/admin/types';

interface DispatchModalProps {
  order: OrderResponse;
  bids?: OrderBidResponse[];
  onClose: () => void;
}

function DispatchModal({ order, bids, onClose }: DispatchModalProps) {
  const { data, isLoading } = useCompanies({ status: 'VERIFIED', size: 100 });
  const [companyId, setCompanyId] = useState('');
  const [agreedPrice, setAgreedPrice] = useState('');
  const [error, setError] = useState('');
  const mutation = useDispatchOrder();

  const companies = data?.items || [];
  const selectedCompanyBid = bids?.find((bid) => String(bid.companyId) === companyId && bid.status !== 'REJECTED');
  // Backend rule: a ONE_TIME order with no price yet (no accepted offer) needs agreedPrice - it becomes its single
  // milestone's amount. An existing price is never overwritten, so the input is hidden then.
  const hasPrice = order.finalPrice != null;
  const priceRequired = order.orderType === 'ONE_TIME' && !hasPrice;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!companyId) {
      setError('Choose a company.');
      return;
    }
    const parsedPrice = agreedPrice.trim() ? Number(agreedPrice) : undefined;
    if (parsedPrice !== undefined && (Number.isNaN(parsedPrice) || parsedPrice < 0.01)) {
      setError('Enter a valid agreed price (at least 0.01 AMD) or leave it empty.');
      return;
    }
    if (priceRequired && parsedPrice === undefined) {
      setError('This one-time order has no accepted offer - enter the agreed price.');
      return;
    }
    setError('');
    try {
      await mutation.mutateAsync({
        id: order.id,
        companyId: Number(companyId),
        agreedPrice: parsedPrice === undefined ? undefined : Math.round(parsedPrice * 100) / 100,
      });
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to dispatch this order.'));
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
        {hasPrice ? (
          <p className="field__hint" style={{ marginBottom: 16 }}>
            Agreed price {formatCurrency(order.finalPrice)} (from the accepted offer) is kept.
          </p>
        ) : (
          <div className="field">
            <label htmlFor="dispatch-price">Agreed price (AMD){priceRequired ? '' : ' — optional'}</label>
            <input
              id="dispatch-price"
              type="number"
              min="0.01"
              step="0.01"
              value={agreedPrice}
              onChange={(event) => setAgreedPrice(event.target.value)}
              placeholder={selectedCompanyBid ? String(selectedCompanyBid.price) : undefined}
            />
            <span className="field__hint">
              {priceRequired
                ? 'Required: this one-time order has no accepted offer. It becomes the amount of the order’s single milestone the customer funds.'
                : 'Optional for multi-stage orders: milestone amounts come from the contractor’s plan.'}
              {selectedCompanyBid && ` This company bid ${formatCurrency(selectedCompanyBid.price)}.`}
            </span>
          </div>
        )}
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
