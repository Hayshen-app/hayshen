export type UserRole = 'CUSTOMER' | 'CONTRACTOR' | 'ADMIN' | 'SUPPORT';

export type UserStatus = 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED';

export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export type OrderStatus =
  | 'SUBMITTED'
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'WORKER_ASSIGNED'
  | 'WAITING_CUSTOMER_CONFIRMATION'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'DONE'
  | 'CANCELLED';

export type OrderBidStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

// V17: PAID was renamed to COMPLETED (only with a real bank payout reference); FAILED returns the money.
export type WithdrawalStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REJECTED';

export type WalletTransactionType =
  | 'DEPOSIT'
  | 'MILESTONE_PAID'
  // Legacy (pre-pay-after-completion) milestone funding.
  | 'MILESTONE_FUNDED'
  | 'MILESTONE_SETTLED'
  | 'EARNING_HELD'
  | 'HOLD_RELEASED'
  | 'RESERVATION_REFUNDED'
  | 'EARNING_REVERSED'
  | 'WITHDRAWAL_RESERVED'
  | 'WITHDRAWAL_COMPLETED'
  | 'WITHDRAWAL_RELEASED'
  | 'ADJUSTMENT'
  | 'LEGACY_RESERVE_MIGRATED'
  | 'LEGACY_RESERVE_RETURNED'
  // Legacy (pre-V17) ledger rows.
  | 'RESERVE'
  | 'RELEASE'
  | 'REFUND';

/** Ledger bucket a wallet row moves money in/out of. */
export type WalletBucket = 'AVAILABLE' | 'RESERVED' | 'HELD' | 'PENDING_WITHDRAWAL';

export type WalletStatus = 'ACTIVE' | 'FROZEN';

// Picked on Create Order. MEDIUM_TERM (ends within 3 months of the start) / LONG_TERM orders are
// split into milestones the consumer funds one at a time. The backend still accepts legacy MID_TERM.
export type OrderType = 'ONE_TIME' | 'MEDIUM_TERM' | 'LONG_TERM';

export type MilestonePlanStatus = 'DRAFT' | 'PROPOSED' | 'APPROVED' | 'REJECTED';

// Pay after completion: APPROVED -> COMPLETED (contractor done) -> ACCEPTED (customer confirmed,
// payment due) -> PAID (final; earnings enter the 7-day hold). FUNDED is legacy only (pre-paid).
export type MilestoneStatus =
  | 'DRAFT'
  | 'PROPOSED'
  | 'APPROVED'
  | 'FUNDED'
  | 'COMPLETED'
  | 'REVISION_REQUESTED'
  | 'ACCEPTED'
  | 'PAID'
  | 'DISPUTED'
  | 'REFUNDED'
  | 'CANCELLED'
  | 'SUPERSEDED';

/** A milestone's own payment record (null until paid). CONFIRMED is legacy pre-funding. */
export type PaymentStatus = 'CONFIRMED' | 'SETTLED' | 'REFUNDED';

/** Contractor 7-day hold on an accepted milestone's earnings. */
export type HoldStatus = 'HELD' | 'BLOCKED' | 'RELEASED' | 'REVERSED';

export type DisputeStatus = 'OPEN' | 'RESOLVED_RELEASED' | 'RESOLVED_REFUNDED';

export type DisputeResolution = 'RELEASE_TO_CONTRACTOR' | 'REFUND_TO_CONSUMER';

export type BankAccountStatus = 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED' | 'REMOVED';

export type WorkerStatus = 'ACTIVE' | 'INACTIVE';

export type VehicleStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
