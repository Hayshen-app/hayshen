import type {
  BankAccountStatus,
  DeliveryIssueType,
  DeliveryStepStatus,
  MaterialDeliveryStatus,
  MaterialPaymentStatus,
  MaterialQuotationStatus,
  MaterialRequestStatus,
  MaterialUnit,
  StoreHoldStatus,
  StoreMemberRole,
  StoreVerificationStatus,
  SupplierOrderStatus,
  WithdrawalStatus,
} from '@/store/types';

export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';
export interface BadgeDef {
  label: string;
  tone: Tone;
}

// ------------------------------------------------------------------ roles

export const MEMBER_ROLE_LABEL: Record<StoreMemberRole, string> = {
  OWNER: 'Սեփականատեր',
  ADMIN: 'Ադմինիստրատոր',
  SALES_MANAGER: 'Վաճառքի մենեջեր',
  EMPLOYEE: 'Աշխատակից',
};

export const MEMBER_ROLE_DESCRIPTION: Record<StoreMemberRole, string> = {
  OWNER: 'Ամբողջական հասանելիություն, այդ թվում դրամապանակ և դուրսբերումներ',
  ADMIN: 'Խանութի տվյալներ, հասցեներ, թիմ, գնային առաջարկներ, պատվերներ և առաքումներ (առանց դրամապանակի)',
  SALES_MANAGER: 'Հարցումներ, գնային առաջարկներ, պատվերների չեղարկում, պատվերների կատարում և առաքումներ',
  EMPLOYEE: 'Միայն պատվերների կատարում և առաքումներ',
};

export interface StorePermissions {
  manage: boolean; // profile, locations, members
  quote: boolean; // quote, withdraw quotations, cancel orders
  fulfil: boolean; // preparing, deliveries
  wallet: boolean; // wallet, withdrawals, bank accounts
}

/** Mirrors the backend role sets (MANAGERS / SALES / ANY_MEMBER / OWNER); the server enforces them too. */
export function storeCan(role: StoreMemberRole | null | undefined): StorePermissions {
  return {
    manage: role === 'OWNER' || role === 'ADMIN',
    quote: role === 'OWNER' || role === 'ADMIN' || role === 'SALES_MANAGER',
    fulfil: role != null,
    wallet: role === 'OWNER',
  };
}

// --------------------------------------------------------------- statuses

export const VERIFICATION_BADGE: Record<StoreVerificationStatus, BadgeDef> = {
  PENDING: { label: 'Ստուգման մեջ', tone: 'warning' },
  VERIFIED: { label: 'Հաստատված', tone: 'success' },
  REJECTED: { label: 'Մերժված', tone: 'danger' },
};

export const REQUEST_STATUS_LABEL: Record<MaterialRequestStatus, string> = {
  DRAFT: 'Սևագիր',
  PENDING_APPROVAL: 'Սպասում է հաստատման',
  CHANGES_REQUESTED: 'Պահանջվել են փոփոխություններ',
  APPROVED: 'Հաստատված',
  OPEN_FOR_QUOTES: 'Ընդունում է առաջարկներ',
  QUOTES_RECEIVED: 'Առաջարկներ են ստացվել',
  PARTIALLY_AWARDED: 'Մասնակի ընտրված',
  AWARDED: 'Մատակարարներն ընտրված են',
  IN_PROGRESS: 'Ընթացքում',
  COMPLETED: 'Ավարտված',
  CANCELED: 'Չեղարկված',
  EXPIRED: 'Ժամկետանց',
};

export const QUOTABLE_REQUEST_STATUSES: MaterialRequestStatus[] = ['OPEN_FOR_QUOTES', 'QUOTES_RECEIVED', 'PARTIALLY_AWARDED'];

export const QUOTATION_BADGE: Record<MaterialQuotationStatus, BadgeDef> = {
  SUBMITTED: { label: 'Ուղարկված', tone: 'info' },
  PARTIALLY_ACCEPTED: { label: 'Մասնակի ընդունված', tone: 'success' },
  ACCEPTED: { label: 'Ընդունված', tone: 'success' },
  REJECTED: { label: 'Մերժված', tone: 'danger' },
  WITHDRAWN: { label: 'Հետ կանչված', tone: 'neutral' },
  EXPIRED: { label: 'Ժամկետանց', tone: 'neutral' },
};

export const ORDER_BADGE: Record<SupplierOrderStatus, BadgeDef> = {
  AWAITING_PAYMENT: { label: 'Սպասում է վճարման', tone: 'warning' },
  FUNDED: { label: 'Վճարված', tone: 'info' },
  PREPARING: { label: 'Պատրաստվում է', tone: 'info' },
  DISPATCHED: { label: 'Ճանապարհին', tone: 'info' },
  PARTIALLY_DELIVERED: { label: 'Մասնակի առաքված', tone: 'warning' },
  DELIVERED: { label: 'Առաքված', tone: 'success' },
  COMPLETED: { label: 'Ավարտված', tone: 'success' },
  DISPUTED: { label: 'Վեճ', tone: 'danger' },
  CANCELED: { label: 'Չեղարկված', tone: 'neutral' },
};

export const PAYMENT_LABEL: Record<MaterialPaymentStatus, string> = {
  UNPAID: 'Չվճարված',
  RESERVED: 'Վճարված, պահվում է HayShen-ի մոտ',
  SETTLED: 'Վճարումը փոխանցված է խանութին',
  PARTIALLY_REFUNDED: 'Մասնակի վերադարձված գնորդին',
  REFUNDED: 'Վերադարձված գնորդին',
};

export const DELIVERY_BADGE: Record<MaterialDeliveryStatus, BadgeDef> = {
  NOT_SCHEDULED: { label: 'Պլանավորված չէ', tone: 'neutral' },
  SCHEDULED: { label: 'Պլանավորված', tone: 'info' },
  PREPARING: { label: 'Պատրաստվում է', tone: 'info' },
  DISPATCHED: { label: 'Ճանապարհին', tone: 'info' },
  PARTIALLY_DELIVERED: { label: 'Մասնակի առաքված', tone: 'warning' },
  DELIVERED: { label: 'Առաքված', tone: 'success' },
  ACCEPTED: { label: 'Ընդունված գնորդի կողմից', tone: 'success' },
  FAILED: { label: 'Ձախողված', tone: 'danger' },
  CANCELED: { label: 'Չեղարկված', tone: 'neutral' },
};

export const DELIVERY_STEP_LABEL: Record<DeliveryStepStatus, string> = {
  PREPARING: 'Պատրաստվում է',
  DISPATCHED: 'Ճանապարհին է',
  DELIVERED: 'Առաքված է',
  FAILED: 'Ձախողվեց',
  CANCELED: 'Չեղարկել',
};

/** Allowed delivery transitions (mirrors MaterialOrderService.DELIVERY_TRANSITIONS). */
export const NEXT_DELIVERY_STEPS: Partial<Record<MaterialDeliveryStatus, DeliveryStepStatus[]>> = {
  SCHEDULED: ['PREPARING', 'DISPATCHED', 'DELIVERED', 'FAILED', 'CANCELED'],
  PREPARING: ['DISPATCHED', 'DELIVERED', 'FAILED', 'CANCELED'],
  DISPATCHED: ['DELIVERED', 'FAILED'],
};

/** Deliveries that hold quantity (backend LIVE_DELIVERY). */
export const LIVE_DELIVERY: MaterialDeliveryStatus[] = ['SCHEDULED', 'PREPARING', 'DISPATCHED', 'DELIVERED'];

/** Supplier order states where new deliveries may be scheduled. */
export const SHIPPABLE_ORDER: SupplierOrderStatus[] = ['FUNDED', 'PREPARING', 'DISPATCHED', 'PARTIALLY_DELIVERED'];

export const HOLD_BADGE: Record<StoreHoldStatus, BadgeDef> = {
  HELD: { label: 'Պահման ժամկետում', tone: 'warning' },
  BLOCKED: { label: 'Կասեցված (բաց վեճ)', tone: 'danger' },
  RELEASED: { label: 'Հասանելի է դարձել', tone: 'success' },
  REVERSED: { label: 'Հետկանչված', tone: 'neutral' },
};

export const ISSUE_LABEL: Record<DeliveryIssueType, string> = {
  MISSING: 'Բացակայում է',
  DAMAGED: 'Վնասված',
  WRONG_ITEM: 'Սխալ ապրանք',
  QUANTITY_MISMATCH: 'Քանակի անհամապատասխանություն',
};

export const UNIT_LABEL: Record<MaterialUnit, string> = {
  PIECE: 'հատ',
  KILOGRAM: 'կգ',
  TON: 'տոննա',
  METER: 'մ',
  SQUARE_METER: 'մ²',
  CUBIC_METER: 'մ³',
  BAG: 'պարկ',
  LITER: 'լ',
  PACKAGE: 'փաթեթ',
};

export const AVAILABILITY_OPTIONS: { value: string; label: string }[] = [
  { value: 'IN_STOCK', label: 'Առկա է' },
  { value: 'ON_ORDER', label: 'Պատվերով' },
  { value: 'LIMITED', label: 'Սահմանափակ' },
];

export const availabilityLabel = (value: string | null | undefined) =>
  AVAILABILITY_OPTIONS.find((o) => o.value === value)?.label ?? value ?? '—';

export const BANK_ACCOUNT_BADGE: Record<BankAccountStatus, BadgeDef> = {
  PENDING_VERIFICATION: { label: 'Սպասում է հաստատման', tone: 'warning' },
  VERIFIED: { label: 'Հաստատված', tone: 'success' },
  REJECTED: { label: 'Մերժված', tone: 'danger' },
  REMOVED: { label: 'Հեռացված', tone: 'neutral' },
};

export const WITHDRAWAL_BADGE: Record<WithdrawalStatus, BadgeDef> = {
  PENDING: { label: 'Մշակվում է', tone: 'warning' },
  COMPLETED: { label: 'Կատարված', tone: 'success' },
  FAILED: { label: 'Ձախողված', tone: 'danger' },
  REJECTED: { label: 'Մերժված', tone: 'danger' },
};

/** Ledger types of a store owner's wallet (materials + the shared wallet types). */
export const TRANSACTION_LABEL: Record<string, string> = {
  STORE_EARNING_HELD: 'Վաճառքից եկամուտ (պահման ժամկետում)',
  STORE_HOLD_RELEASED: 'Գումարը հասանելի է դարձել',
  STORE_EARNING_REVERSED: 'Եկամտի հետկանչ (վեճ)',
  HOLD_RELEASED: 'Գումարը հասանելի է դարձել',
  EARNING_HELD: 'Վաստակ (պահման ժամկետում)',
  EARNING_REVERSED: 'Վաստակի հետկանչ (վեճ)',
  WITHDRAWAL_RESERVED: 'Դուրսբերման հայտ',
  WITHDRAWAL_COMPLETED: 'Դուրսբերում',
  WITHDRAWAL_RELEASED: 'Դուրսբերման չեղարկում',
  ADJUSTMENT: 'Ճշգրտում',
  DEPOSIT: 'Համալրում',
  MILESTONE_PAID: 'Փուլի վճարում',
  MILESTONE_SETTLED: 'Փուլի վճարում',
  MATERIAL_FUNDED: 'Շինանյութի վճարում',
  MATERIAL_DELIVERY_FUNDED: 'Առաքման վճարում',
  MATERIAL_SETTLED: 'Շինանյութի վճարում',
  MATERIAL_DELIVERY_SETTLED: 'Առաքման վճարում',
  MATERIAL_REFUNDED: 'Շինանյութի վերադարձ',
};

export const BUCKET_LABEL: Record<string, string> = {
  AVAILABLE: 'Հասանելի',
  RESERVED: 'Ամրագրված',
  HELD: 'Պահման ժամկետում',
  PENDING_WITHDRAWAL: 'Դուրսբերման ընթացքում',
};

export const HISTORY_ACTION_LABEL: Record<string, string> = {
  CREATED: 'Ստեղծվել է',
  AWARDED: 'Ընտրվել է',
  FUNDED: 'Վճարվել է',
  PREPARING: 'Պատրաստվում է',
  SCHEDULED: 'Առաքումը պլանավորվել է',
  DISPATCHED: 'Ուղարկվել է',
  DELIVERED: 'Առաքվել է',
  FAILED: 'Առաքումը ձախողվել է',
  CANCELED: 'Չեղարկվել է',
  CANCELLED: 'Չեղարկվել է',
  ACCEPTED: 'Ընդունվել է գնորդի կողմից',
  DISPUTED: 'Վեճ է բացվել',
  DISPUTE_OPENED: 'Վեճ է բացվել',
  DISPUTE_RESOLVED: 'Վեճը լուծվել է',
  COMPLETED: 'Ավարտվել է',
  REVIEWED: 'Գնորդը գնահատել է',
};
