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

export type WithdrawalStatus = 'PENDING' | 'PAID' | 'REJECTED';

export type WalletTransactionType = 'RESERVE' | 'RELEASE' | 'REFUND' | 'ADJUSTMENT';

// Picked on Create Order. MID_TERM/LONG_TERM orders can be split - by either side - into
// payment phases ("milestones", see OrderMilestoneResponse).
export type OrderType = 'ONE_TIME' | 'MID_TERM' | 'LONG_TERM';

export type MilestoneStatus = 'PENDING' | 'DONE';
