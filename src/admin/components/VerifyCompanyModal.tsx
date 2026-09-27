import { useState, type FormEvent } from 'react';
import { useVerifyCompany } from '@/admin/api/companies';
import Modal from '@/admin/components/Modal';
import CompanyLogo from '@/admin/components/CompanyLogo';
import { VERIFICATION_STATUSES, humanize } from '@/admin/utils/constants';
import { ApiError } from '@/api/client';
import type { CompanySummaryResponse } from '@/admin/types';
import type { VerificationStatus } from '@/types/enums';

interface VerifyCompanyModalProps {
  company: CompanySummaryResponse;
  onClose: () => void;
}

/** Shared by the Companies list ("Review" row action) and Company Details page. */
function VerifyCompanyModal({ company, onClose }: VerifyCompanyModalProps) {
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>(company.verificationStatus);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const mutation = useVerifyCompany();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    try {
      await mutation.mutateAsync({ id: company.id, verificationStatus, note: note || undefined });
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update verification.');
    }
  };

  return (
    <Modal title={company.companyName} onClose={onClose}>
      <div style={{ marginBottom: 18 }}>
        <CompanyLogo logoUrl={company.logoUrl} size="lg" />
      </div>
      <div className="detail-grid" style={{ marginBottom: 18 }}>
        <div className="detail-item">
          <div className="detail-item__label">Owner</div>
          <div className="detail-item__value">{company.ownerName}</div>
        </div>
        <div className="detail-item">
          <div className="detail-item__label">Contact</div>
          <div className="detail-item__value">
            {company.ownerEmail} · {company.ownerPhone}
          </div>
        </div>
        <div className="detail-item">
          <div className="detail-item__label">City</div>
          <div className="detail-item__value">{company.city}</div>
        </div>
        <div className="detail-item">
          <div className="detail-item__label">Jobs completed</div>
          <div className="detail-item__value">{company.totalJobsCompleted}</div>
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="verify-status">Verification status</label>
          <select
            id="verify-status"
            value={verificationStatus}
            onChange={(event) => setVerificationStatus(event.target.value as VerificationStatus)}
          >
            {VERIFICATION_STATUSES.map((option) => (
              <option key={option} value={option}>
                {humanize(option)}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="verify-note">Note (optional)</label>
          <textarea
            id="verify-note"
            maxLength={1000}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Reason shared with the contractor, if any"
          />
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn--secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn--primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default VerifyCompanyModal;
