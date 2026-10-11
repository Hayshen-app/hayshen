import { humanize, type Tone } from '@/admin/utils/constants';
import type {
  DeliveryIssueType,
  MaterialDeliveryStatus,
  MaterialDisputeStatus,
  MaterialPaymentStatus,
  MaterialRequestStatus,
  MaterialStoreStatus,
  MaterialUnit,
  PurchasingAccountType,
  SupplierOrderStatus,
} from '@/admin/materialsTypes';

export const MATERIAL_UNITS: MaterialUnit[] = [
  'PIECE',
  'KILOGRAM',
  'TON',
  'METER',
  'SQUARE_METER',
  'CUBIC_METER',
  'BAG',
  'LITER',
  'PACKAGE',
];

const MATERIAL_UNIT_LABEL: Record<MaterialUnit, string> = {
  PIECE: 'Piece (pcs)',
  KILOGRAM: 'Kilogram (kg)',
  TON: 'Ton (t)',
  METER: 'Meter (m)',
  SQUARE_METER: 'Square meter (m²)',
  CUBIC_METER: 'Cubic meter (m³)',
  BAG: 'Bag',
  LITER: 'Liter (l)',
  PACKAGE: 'Package',
};

const MATERIAL_UNIT_SHORT: Record<MaterialUnit, string> = {
  PIECE: 'pcs',
  KILOGRAM: 'kg',
  TON: 't',
  METER: 'm',
  SQUARE_METER: 'm²',
  CUBIC_METER: 'm³',
  BAG: 'bag',
  LITER: 'l',
  PACKAGE: 'pkg',
};

export function materialUnitLabel(unit?: MaterialUnit | null): string {
  if (!unit) return '—';
  return MATERIAL_UNIT_LABEL[unit] || humanize(unit);
}

export function materialUnitShort(unit?: MaterialUnit | null): string {
  if (!unit) return '';
  return MATERIAL_UNIT_SHORT[unit] || humanize(unit);
}

export function formatQuantity(value: number | null | undefined, unit?: MaterialUnit | null): string {
  if (value === null || value === undefined) return '—';
  const amount = Number(value).toLocaleString('en-US', { maximumFractionDigits: 3 });
  return unit ? `${amount} ${materialUnitShort(unit)}` : amount;
}

export const MATERIAL_STORE_STATUSES: MaterialStoreStatus[] = ['ACTIVE', 'SUSPENDED'];

export function materialStoreStatusTone(status: MaterialStoreStatus): Tone {
  return status === 'ACTIVE' ? 'success' : 'danger';
}

export const MATERIAL_REQUEST_STATUSES: MaterialRequestStatus[] = [
  'DRAFT',
  'PENDING_APPROVAL',
  'CHANGES_REQUESTED',
  'APPROVED',
  'OPEN_FOR_QUOTES',
  'QUOTES_RECEIVED',
  'PARTIALLY_AWARDED',
  'AWARDED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELED',
  'EXPIRED',
];

const MATERIAL_REQUEST_STATUS_TONE: Record<MaterialRequestStatus, Tone> = {
  DRAFT: 'neutral',
  PENDING_APPROVAL: 'warning',
  CHANGES_REQUESTED: 'warning',
  APPROVED: 'info',
  OPEN_FOR_QUOTES: 'info',
  QUOTES_RECEIVED: 'info',
  PARTIALLY_AWARDED: 'warning',
  AWARDED: 'success',
  IN_PROGRESS: 'info',
  COMPLETED: 'success',
  CANCELED: 'neutral',
  EXPIRED: 'neutral',
};

export function materialRequestStatusTone(status: MaterialRequestStatus): Tone {
  return MATERIAL_REQUEST_STATUS_TONE[status] || 'neutral';
}

export const SUPPLIER_ORDER_STATUSES: SupplierOrderStatus[] = [
  'AWAITING_PAYMENT',
  'FUNDED',
  'PREPARING',
  'DISPATCHED',
  'PARTIALLY_DELIVERED',
  'DELIVERED',
  'COMPLETED',
  'DISPUTED',
  'CANCELED',
];

const SUPPLIER_ORDER_STATUS_TONE: Record<SupplierOrderStatus, Tone> = {
  AWAITING_PAYMENT: 'warning',
  FUNDED: 'info',
  PREPARING: 'info',
  DISPATCHED: 'info',
  PARTIALLY_DELIVERED: 'warning',
  DELIVERED: 'info',
  COMPLETED: 'success',
  DISPUTED: 'danger',
  CANCELED: 'neutral',
};

export function supplierOrderStatusTone(status: SupplierOrderStatus): Tone {
  return SUPPLIER_ORDER_STATUS_TONE[status] || 'neutral';
}

const MATERIAL_PAYMENT_STATUS_TONE: Record<MaterialPaymentStatus, Tone> = {
  UNPAID: 'warning',
  RESERVED: 'info',
  SETTLED: 'success',
  PARTIALLY_REFUNDED: 'warning',
  REFUNDED: 'neutral',
};

const MATERIAL_PAYMENT_STATUS_LABEL: Partial<Record<MaterialPaymentStatus, string>> = {
  RESERVED: 'Reserved (buyer funds locked)',
};

export function materialPaymentStatusTone(status: MaterialPaymentStatus): Tone {
  return MATERIAL_PAYMENT_STATUS_TONE[status] || 'neutral';
}

export function materialPaymentStatusLabel(status: MaterialPaymentStatus, long = false): string {
  return (long && MATERIAL_PAYMENT_STATUS_LABEL[status]) || humanize(status);
}

const MATERIAL_DELIVERY_STATUS_TONE: Record<MaterialDeliveryStatus, Tone> = {
  NOT_SCHEDULED: 'neutral',
  SCHEDULED: 'info',
  PREPARING: 'info',
  DISPATCHED: 'info',
  DELIVERED: 'success',
  PARTIALLY_DELIVERED: 'warning',
  ACCEPTED: 'success',
  FAILED: 'danger',
  CANCELED: 'neutral',
};

export function materialDeliveryStatusTone(status: MaterialDeliveryStatus): Tone {
  return MATERIAL_DELIVERY_STATUS_TONE[status] || 'neutral';
}

export function materialDisputeStatusTone(status: MaterialDisputeStatus): Tone {
  return status === 'OPEN' ? 'danger' : 'success';
}

export function deliveryIssueLabel(issue?: DeliveryIssueType | null): string {
  return issue ? humanize(issue) : '';
}

export function purchasingAccountLabel(type?: PurchasingAccountType | null): string {
  if (type === 'COMPANY') return 'Company';
  if (type === 'CONSUMER') return 'Consumer';
  return '—';
}
