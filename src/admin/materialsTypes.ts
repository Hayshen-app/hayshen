/**
 * Construction materials marketplace - admin-side types.
 * Mirrors backend com.hayshen.backend.materials.dto (CatalogDtos, StoreDtos, RequestDtos,
 * SupplierOrderDtos). Money (BigDecimal) arrives as JSON numbers, timestamps as ISO strings.
 */
import type { HoldStatus, VerificationStatus } from '@/types/enums';

export type MaterialUnit =
  | 'PIECE'
  | 'KILOGRAM'
  | 'TON'
  | 'METER'
  | 'SQUARE_METER'
  | 'CUBIC_METER'
  | 'BAG'
  | 'LITER'
  | 'PACKAGE';

export type MaterialStoreStatus = 'ACTIVE' | 'SUSPENDED';

export type StoreMemberRole = 'OWNER' | 'ADMIN' | 'SALES_MANAGER' | 'EMPLOYEE';

export type MaterialRequestStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'CHANGES_REQUESTED'
  | 'APPROVED'
  | 'OPEN_FOR_QUOTES'
  | 'QUOTES_RECEIVED'
  | 'PARTIALLY_AWARDED'
  | 'AWARDED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELED'
  | 'EXPIRED';

export type MaterialRequestOrigin = 'DIRECT' | 'CONTRACTOR_PROPOSAL';

export type PurchasingAccountType = 'CONSUMER' | 'COMPANY';

export type SupplierOrderStatus =
  | 'AWAITING_PAYMENT'
  | 'FUNDED'
  | 'PREPARING'
  | 'DISPATCHED'
  | 'PARTIALLY_DELIVERED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'DISPUTED'
  | 'CANCELED';

export type MaterialPaymentStatus = 'UNPAID' | 'RESERVED' | 'SETTLED' | 'PARTIALLY_REFUNDED' | 'REFUNDED';

export type MaterialDeliveryStatus =
  | 'NOT_SCHEDULED'
  | 'SCHEDULED'
  | 'PREPARING'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'PARTIALLY_DELIVERED'
  | 'ACCEPTED'
  | 'FAILED'
  | 'CANCELED';

export type MaterialDisputeStatus = 'OPEN' | 'RESOLVED';

export type DeliveryIssueType = 'MISSING' | 'DAMAGED' | 'WRONG_ITEM' | 'QUANTITY_MISMATCH';

// ---------------------------------------------------------------- catalog

export interface MaterialCategoryResponse {
  id: number;
  name: string;
  nameHy: string | null;
  description: string | null;
  parentId: number | null;
  active: boolean;
  displayOrder: number;
}

export interface MaterialCategoryRequest {
  name: string;
  nameHy?: string;
  description?: string;
  parentId?: number | null;
  active?: boolean;
  displayOrder?: number;
}

export interface MaterialResponse {
  id: number;
  categoryId: number;
  categoryName: string;
  name: string;
  description: string | null;
  brand: string | null;
  specification: string | null;
  grade: string | null;
  dimensions: string | null;
  defaultUnit: MaterialUnit;
  imageUrl: string | null;
  active: boolean;
}

export interface MaterialRequestBody {
  categoryId: number;
  name: string;
  description?: string;
  brand?: string;
  specification?: string;
  grade?: string;
  dimensions?: string;
  defaultUnit: MaterialUnit;
  imageUrl?: string;
  active?: boolean;
}

// ----------------------------------------------------------------- stores

export interface StoreLocationResponse {
  id: number;
  name: string;
  addressLine: string;
  city: string;
  regionId: number | null;
  regionName: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  primary: boolean;
}

export interface RegionRef {
  id: number;
  name: string;
}

export interface StoreResponse {
  id: number;
  /** Set when a contractor company runs the store (its owner is the store owner). */
  companyId: number | null;
  name: string;
  legalName: string | null;
  registrationNumber: string;
  taxId: string;
  contactPerson: string | null;
  phone: string;
  email: string | null;
  description: string | null;
  logoUrl: string | null;
  verificationStatus: VerificationStatus;
  verificationNote: string | null;
  verifiedAt: string | null;
  status: MaterialStoreStatus;
  operational: boolean;
  rating: number | null;
  ratingCount: number;
  deliveryRegions: RegionRef[];
  locations: StoreLocationResponse[];
  myRole: StoreMemberRole | null;
  /** The store owner's user id - payouts go to this user's HAYSHEN WALLET. */
  ownerUserId: number | null;
  createdAt: string;
}

export interface VerifyStoreRequest {
  verificationStatus: VerificationStatus;
  note?: string;
}

export interface SetStoreStatusRequest {
  status: MaterialStoreStatus;
}

export interface StoreSummary {
  id: number;
  name: string;
  logoUrl: string | null;
  rating: number | null;
  ratingCount: number;
  verified: boolean;
}

// --------------------------------------------------------------- requests

export interface MaterialRequestItemResponse {
  id: number;
  sequence: number;
  categoryId: number;
  categoryName: string;
  materialId: number | null;
  name: string | null;
  specification: string | null;
  grade: string | null;
  dimensions: string | null;
  brand: string | null;
  quantity: number;
  unit: MaterialUnit;
  notes: string | null;
  referenceImageUrl: string | null;
  estimatedUnitPrice: number | null;
  estimatedTotal: number | null;
  milestoneId: number | null;
  milestoneTitle: string | null;
  awardedQuantity: number;
  remainingQuantity: number;
}

export interface PartyRef {
  id: number;
  name: string;
}

export interface MaterialDeliveryAddress {
  addressLine: string | null;
  city: string | null;
  regionId: number | null;
  regionName: string | null;
  latitude: number | null;
  longitude: number | null;
  contactName: string | null;
  contactPhone: string | null;
}

export interface MaterialRequestResponse {
  id: number;
  number: string;
  title: string;
  status: MaterialRequestStatus;
  origin: MaterialRequestOrigin;
  purchasingAccountType: PurchasingAccountType;
  buyer: PartyRef | null;
  buyerCompany: PartyRef | null;
  proposedByCompany: PartyRef | null;
  projectOrderId: number | null;
  milestone: PartyRef | null;
  notes: string | null;
  delivery: MaterialDeliveryAddress | null;
  preferredDeliveryDate: string | null;
  supplierSelectionDelegated: boolean;
  changeRequestNote: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  publishedAt: string | null;
  expiresAt: string | null;
  canceledAt: string | null;
  cancelReason: string | null;
  completedAt: string | null;
  quotationCount: number;
  estimatedTotal: number | null;
  items: MaterialRequestItemResponse[];
  attachments: { id: number; fileUrl: string; fileName: string | null }[];
  createdAt: string;
  updatedAt: string;
}

// -------------------------------------------------------- supplier orders

export interface SupplierOrderItemResponse {
  id: number;
  requestItemId: number;
  description: string;
  unit: MaterialUnit;
  acceptedQuantity: number;
  agreedUnitPrice: number;
  totalPrice: number;
  deliveredQuantity: number | null;
  receivedQuantity: number | null;
  issueType: DeliveryIssueType | null;
  issueNote: string | null;
  milestoneId: number | null;
  milestoneTitle: string | null;
}

export interface MaterialPaymentInfo {
  id: number;
  status: MaterialPaymentStatus;
  amount: number;
  goodsAmount: number;
  deliveryFee: number;
  settledAmount: number | null;
  refundedAmount: number | null;
  reservedAt: string | null;
  settledAt: string | null;
  refundedAt: string | null;
}

export interface StoreHoldInfo {
  id: number;
  status: HoldStatus;
  amount: number;
  reversedAmount: number | null;
  holdStartAt: string | null;
  releaseAt: string | null;
  releasedAt: string | null;
}

export interface MaterialDeliveryResponse {
  id: number;
  status: MaterialDeliveryStatus;
  addressLine: string | null;
  city: string | null;
  contactName: string | null;
  contactPhone: string | null;
  scheduledAt: string | null;
  dispatchedAt: string | null;
  deliveredAt: string | null;
  proofOfDeliveryUrl: string | null;
  recipientName: string | null;
  note: string | null;
  items: { orderItemId: number; description: string; quantity: number }[];
}

export interface MaterialDisputeInfo {
  id: number;
  status: MaterialDisputeStatus;
  openedByUserId: number | null;
  openedByName: string | null;
  reason: string;
  refundAmount: number | null;
  resolutionNote: string | null;
  openedAt: string;
  resolvedAt: string | null;
}

export interface MaterialHistoryEntry {
  action: string;
  actorUserId: number | null;
  details: string | null;
  at: string;
}

export interface SupplierOrderResponse {
  id: number;
  number: string;
  requestId: number;
  requestNumber: string;
  requestTitle: string;
  quotationId: number | null;
  store: StoreSummary;
  purchasingAccountType: PurchasingAccountType;
  buyerUserId: number;
  buyerName: string;
  projectOrderId: number | null;
  status: SupplierOrderStatus;
  paymentStatus: MaterialPaymentStatus;
  deliveryStatus: MaterialDeliveryStatus;
  subtotal: number;
  deliveryFee: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  deliveryAddress: MaterialDeliveryAddress | null;
  createdAt: string;
  fundedAt: string | null;
  completedAt: string | null;
  canceledAt: string | null;
  cancelReason: string | null;
  buyerRating: number | null;
  buyerReview: string | null;
  items: SupplierOrderItemResponse[];
  payment: MaterialPaymentInfo | null;
  storeHold: StoreHoldInfo | null;
  deliveries: MaterialDeliveryResponse[];
  disputes: MaterialDisputeInfo[];
  history: MaterialHistoryEntry[];
}

export interface ResolveMaterialDisputeRequest {
  refundToBuyer: number;
  note: string;
}
