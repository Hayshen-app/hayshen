import type { OrderStatus, UserRole, UserStatus, VerificationStatus } from '@/types/enums';

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

export function humanize(value?: string | null): string {
  if (!value) return '';
  return value
    .toString()
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
