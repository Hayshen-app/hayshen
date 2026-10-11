import type {
  BankAccountStatus,
  DisputeStatus,
  HoldStatus,
  MilestoneStatus,
  OrderBidStatus,
  OrderStatus,
  PaymentStatus,
  UserRole,
  UserStatus,
  VerificationStatus,
  WalletTransactionType,
  WithdrawalStatus,
} from '@/types/enums';

export const USER_ROLES: UserRole[] = ['CUSTOMER', 'CONTRACTOR', 'ADMIN', 'SUPPORT'];

export const USER_STATUSES: UserStatus[] = ['PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED'];

export const VERIFICATION_STATUSES: VerificationStatus[] = ['PENDING', 'VERIFIED', 'REJECTED'];

export const ORDER_STATUSES: OrderStatus[] = [
  'SUBMITTED',
  'ASSIGNED',
  'ACCEPTED',
  'REJECTED',
  'WORKER_ASSIGNED',
  'WAITING_CUSTOMER_CONFIRMATION',
  'CONFIRMED',
  'IN_PROGRESS',
  'DONE',
  'CANCELLED',
];

// Statuses a SUBMITTED (or REJECTED, for a re-dispatch) order can move out of
// via the manual admin dispatch action. See OrderStatus.java for the full
// lifecycle diagram.
export const DISPATCHABLE_ORDER_STATUSES: OrderStatus[] = ['SUBMITTED', 'REJECTED'];

export const WITHDRAWAL_STATUSES: WithdrawalStatus[] = ['PENDING', 'COMPLETED', 'FAILED', 'REJECTED'];

export const BANK_ACCOUNT_STATUSES: BankAccountStatus[] = ['PENDING_VERIFICATION', 'VERIFIED', 'REJECTED', 'REMOVED'];

export const DISPUTE_STATUSES: DisputeStatus[] = ['OPEN', 'RESOLVED_RELEASED', 'RESOLVED_REFUNDED'];

const ORDER_TYPE_LABELS: Record<string, string> = {
  ONE_TIME: 'One-time',
  MEDIUM_TERM: 'Medium term (Միջնաժամկետ)',
  // Legacy value, migrated to MEDIUM_TERM in V17 - kept so stale cached data still reads well.
  MID_TERM: 'Medium term (Միջնաժամկետ)',
  LONG_TERM: 'Long term (Երկարաժամկետ)',
};

export function orderTypeLabel(type?: string | null): string {
  if (!type) return '—';
  return ORDER_TYPE_LABELS[type] || humanize(type);
}

export type Tone = 'neutral' | 'info' | 'warning' | 'success' | 'danger';

const TONE_CLASSNAMES: Record<Tone, string> = {
  neutral: 'badge--neutral',
  info: 'badge--info',
  warning: 'badge--warning',
  success: 'badge--success',
  danger: 'badge--danger',
};

const USER_STATUS_TONE: Record<UserStatus, Tone> = {
  PENDING_VERIFICATION: 'warning',
  ACTIVE: 'success',
  SUSPENDED: 'danger',
};

const VERIFICATION_STATUS_TONE: Record<VerificationStatus, Tone> = {
  PENDING: 'warning',
  VERIFIED: 'success',
  REJECTED: 'danger',
};

const ORDER_STATUS_TONE: Record<OrderStatus, Tone> = {
  SUBMITTED: 'info',
  ASSIGNED: 'info',
  ACCEPTED: 'info',
  REJECTED: 'danger',
  WORKER_ASSIGNED: 'info',
  WAITING_CUSTOMER_CONFIRMATION: 'warning',
  CONFIRMED: 'success',
  IN_PROGRESS: 'info',
  DONE: 'success',
  CANCELLED: 'neutral',
};

export function toneClassName(tone: Tone): string {
  return TONE_CLASSNAMES[tone] || TONE_CLASSNAMES.neutral;
}

export function userStatusTone(status: UserStatus): Tone {
  return USER_STATUS_TONE[status] || 'neutral';
}

export function verificationStatusTone(status: VerificationStatus): Tone {
  return VERIFICATION_STATUS_TONE[status] || 'neutral';
}

export function orderStatusTone(status: OrderStatus): Tone {
  return ORDER_STATUS_TONE[status] || 'neutral';
}

const ORDER_BID_STATUS_TONE: Record<OrderBidStatus, Tone> = {
  PENDING: 'warning',
  ACCEPTED: 'success',
  REJECTED: 'danger',
};

export function orderBidStatusTone(status: OrderBidStatus): Tone {
  return ORDER_BID_STATUS_TONE[status] || 'neutral';
}

const WITHDRAWAL_STATUS_TONE: Record<WithdrawalStatus, Tone> = {
  PENDING: 'warning',
  COMPLETED: 'success',
  FAILED: 'danger',
  REJECTED: 'danger',
};

export function withdrawalStatusTone(status: WithdrawalStatus): Tone {
  return WITHDRAWAL_STATUS_TONE[status] || 'neutral';
}

const BANK_ACCOUNT_STATUS_TONE: Record<BankAccountStatus, Tone> = {
  PENDING_VERIFICATION: 'warning',
  VERIFIED: 'success',
  REJECTED: 'danger',
  REMOVED: 'neutral',
};

export function bankAccountStatusTone(status: BankAccountStatus): Tone {
  return BANK_ACCOUNT_STATUS_TONE[status] || 'neutral';
}

const DISPUTE_STATUS_TONE: Record<DisputeStatus, Tone> = {
  OPEN: 'danger',
  RESOLVED_RELEASED: 'success',
  RESOLVED_REFUNDED: 'info',
};

export function disputeStatusTone(status: DisputeStatus): Tone {
  return DISPUTE_STATUS_TONE[status] || 'neutral';
}

const MILESTONE_STATUS_TONE: Record<MilestoneStatus, Tone> = {
  DRAFT: 'neutral',
  PROPOSED: 'info',
  APPROVED: 'info',
  FUNDED: 'info',
  COMPLETED: 'info',
  REVISION_REQUESTED: 'warning',
  ACCEPTED: 'warning',
  PAID: 'success',
  DISPUTED: 'danger',
  REFUNDED: 'neutral',
  CANCELLED: 'neutral',
  SUPERSEDED: 'neutral',
};

const MILESTONE_STATUS_LABEL: Partial<Record<MilestoneStatus, string>> = {
  APPROVED: 'Approved - not started',
  FUNDED: 'Funded (legacy prepaid)',
  COMPLETED: 'Done - awaiting confirmation',
  ACCEPTED: 'Confirmed - payment due',
  PAID: 'Paid',
};

export function milestoneStatusLabel(status: MilestoneStatus): string {
  return MILESTONE_STATUS_LABEL[status] || humanize(status);
}

export function milestoneStatusTone(status: MilestoneStatus): Tone {
  return MILESTONE_STATUS_TONE[status] || 'neutral';
}

const PAYMENT_STATUS_TONE: Record<PaymentStatus, Tone> = {
  CONFIRMED: 'info',
  SETTLED: 'success',
  REFUNDED: 'neutral',
};

export function paymentStatusTone(status: PaymentStatus): Tone {
  return PAYMENT_STATUS_TONE[status] || 'neutral';
}

const HOLD_STATUS_TONE: Record<HoldStatus, Tone> = {
  HELD: 'warning',
  BLOCKED: 'danger',
  RELEASED: 'success',
  REVERSED: 'neutral',
};

export function holdStatusTone(status: HoldStatus): Tone {
  return HOLD_STATUS_TONE[status] || 'neutral';
}

const POSITIVE_TRANSACTION_TYPES: WalletTransactionType[] = [
  'DEPOSIT',
  'MILESTONE_PAID',
  'HOLD_RELEASED',
  'RESERVATION_REFUNDED',
  'REFUND',
  'RELEASE',
  'WITHDRAWAL_COMPLETED',
];

export function walletTransactionTone(type: WalletTransactionType): Tone {
  if (POSITIVE_TRANSACTION_TYPES.includes(type)) return 'success';
  if (type === 'EARNING_REVERSED') return 'danger';
  if (type === 'ADJUSTMENT') return 'warning';
  return 'neutral';
}

export function humanize(value?: string | null): string {
  if (!value) return '';
  return value
    .toString()
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
