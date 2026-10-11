// Mirrors of the backend materials/store DTOs (com.hayshen.backend.materials.dto, wallet.dto).
// BigDecimal -> number, OffsetDateTime -> ISO string, LocalDate -> 'YYYY-MM-DD'.

export type StoreUserRole = 'CONSTRUCTION_MATERIAL_STORE' | 'CONTRACTOR';
export type StoreMemberRole = 'OWNER' | 'ADMIN' | 'SALES_MANAGER' | 'EMPLOYEE';
export type StoreVerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';
export type MaterialStoreStatus = 'ACTIVE' | 'SUSPENDED';

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

export type MaterialQuotationStatus =
  | 'SUBMITTED'
  | 'PARTIALLY_ACCEPTED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'WITHDRAWN'
  | 'EXPIRED';

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

export type DeliveryStepStatus = 'PREPARING' | 'DISPATCHED' | 'DELIVERED' | 'FAILED' | 'CANCELED';

export type DeliveryIssueType = 'MISSING' | 'DAMAGED' | 'WRONG_ITEM' | 'QUANTITY_MISMATCH';
export type StoreHoldStatus = 'HELD' | 'BLOCKED' | 'RELEASED' | 'REVERSED';
export type PurchasingAccountType = 'CONSUMER' | 'COMPANY';
export type BankAccountStatus = 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED' | 'REMOVED';
export type WithdrawalStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REJECTED';

export interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

// ---------------------------------------------------------------- auth

export interface StoreAuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  userId: number;
  role: string;
  fullName: string;
}

export interface StoreSession {
  accessToken: string;
  refreshToken: string;
  userId: number;
  role: string;
  fullName: string;
}

// ---------------------------------------------------------------- catalog / locations

export interface RegionResponse {
  id: number;
  name: string;
  displayOrder: number;
}

export interface CategoryResponse {
  id: number;
  name: string;
  nameHy: string | null;
  description: string | null;
  parentId: number | null;
  active: boolean;
  displayOrder: number;
}

// ---------------------------------------------------------------- store

export interface LocationRequest {
  name: string;
  addressLine: string;
  city: string;
  regionId?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string | null;
  primary?: boolean | null;
}

export interface LocationResponse {
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
  verificationStatus: StoreVerificationStatus;
  verificationNote: string | null;
  verifiedAt: string | null;
  status: MaterialStoreStatus;
  operational: boolean;
  rating: number | null;
  ratingCount: number;
  deliveryRegions: RegionRef[];
  locations: LocationResponse[];
  myRole: StoreMemberRole | null;
  createdAt: string;
}

export interface StoreDetails {
  name: string;
  legalName?: string | null;
  registrationNumber: string;
  taxId: string;
  contactPerson?: string | null;
  phone: string;
  email?: string | null;
  description?: string | null;
  primaryLocation: LocationRequest;
  deliveryRegionIds?: number[];
}

export interface RegisterStoreRequest {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  store: StoreDetails;
}

export interface UpdateStoreRequest {
  name: string;
  legalName: string | null;
  registrationNumber: string;
  taxId: string;
  contactPerson: string | null;
  phone: string;
  email: string | null;
  description: string | null;
  logoUrl: string | null;
  deliveryRegionIds: number[];
}

export interface StoreSummary {
  id: number;
  name: string;
  logoUrl: string | null;
  rating: number | null;
  ratingCount: number;
  verified: boolean;
}

export interface MemberResponse {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  phone: string;
  memberRole: StoreMemberRole;
  active: boolean;
  createdAt: string;
}

export interface AddMemberRequest {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  memberRole: StoreMemberRole;
}

export interface UpdateMemberRequest {
  memberRole: StoreMemberRole;
  active?: boolean | null;
}

export interface StoreDashboardResponse {
  storeId: number;
  storeName: string;
  operational: boolean;
  openRequests: number;
  awaitingQuotationFromMe: number;
  submittedQuotations: number;
  acceptedQuotations: number;
  ordersAwaitingPayment: number;
  activeOrders: number;
  ordersInDelivery: number;
  completedOrders: number;
  availableBalance: number | null;
  heldBalance: number | null;
}

// ---------------------------------------------------------------- marketplace

export interface MaterialRequestItem {
  id: number;
  sequence: number;
  categoryId: number;
  categoryName: string | null;
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
  awardedQuantity: number | null;
  remainingQuantity: number | null;
}

export interface AttachmentResponse {
  id: number;
  fileUrl: string;
  fileName: string | null;
}

export interface DeliveryAddress {
  addressLine: string | null;
  city: string | null;
  regionId: number | null;
  regionName: string | null;
  latitude: number | null;
  longitude: number | null;
  contactName: string | null;
  contactPhone: string | null;
}

export interface MyQuotationRef {
  id: number;
  status: MaterialQuotationStatus;
  totalAmount: number;
  validUntil: string;
  revision: number;
}

export interface MarketplaceRequest {
  id: number;
  number: string;
  title: string;
  status: MaterialRequestStatus;
  purchasingAccountType: PurchasingAccountType;
  notes: string | null;
  deliveryCity: string | null;
  deliveryRegionId: number | null;
  deliveryRegionName: string | null;
  preferredDeliveryDate: string | null;
  publishedAt: string | null;
  expiresAt: string | null;
  items: MaterialRequestItem[];
  attachments: AttachmentResponse[];
  contactRevealed: boolean;
  buyerName: string | null;
  delivery: DeliveryAddress | null;
  myQuotation: MyQuotationRef | null;
}

export interface MarketplaceFilters {
  categoryId?: number | null;
  regionId?: number | null;
  minQuantity?: number | null;
  deliveryFrom?: string | null;
  deliveryTo?: string | null;
  page?: number;
  size?: number;
}

// ---------------------------------------------------------------- quotations

export interface QuotationItemInput {
  requestItemId: number;
  canSupply: boolean;
  unitPrice?: number | null;
  quantity?: number | null;
  proposedMaterialId?: number | null;
  offeredName?: string | null;
  offeredSpecification?: string | null;
  brand?: string | null;
  substitute: boolean;
  substitutionDetails?: string | null;
  availability?: string | null;
  expectedDeliveryDate?: string | null;
  warranty?: string | null;
  notes?: string | null;
}

export interface SubmitQuotationInput {
  validUntil: string;
  deliveryFee: number;
  taxAmount?: number | null;
  discountAmount?: number | null;
  expectedDeliveryDate?: string | null;
  notes?: string | null;
  items: QuotationItemInput[];
}

export interface QuotationItemResponse {
  id: number;
  requestItemId: number;
  requestedName: string | null;
  requestedQuantity: number;
  unit: MaterialUnit;
  canSupply: boolean;
  offeredName: string | null;
  offeredSpecification: string | null;
  brand: string | null;
  substitute: boolean;
  substitutionDetails: string | null;
  unitPrice: number | null;
  quantity: number | null;
  lineTotal: number | null;
  availability: string | null;
  expectedDeliveryDate: string | null;
  warranty: string | null;
  notes: string | null;
  awardedQuantity: number | null;
}

export interface QuotationResponse {
  id: number;
  requestId: number;
  requestNumber: string;
  requestTitle: string;
  store: StoreSummary | null;
  status: MaterialQuotationStatus;
  subtotal: number;
  deliveryFee: number;
  taxAmount: number | null;
  discountAmount: number | null;
  totalAmount: number;
  validUntil: string;
  expired: boolean;
  expectedDeliveryDate: string | null;
  notes: string | null;
  revision: number;
  submittedAt: string | null;
  updatedAt: string | null;
  suppliedItems: number;
  requestedItems: number;
  coversAllItems: boolean;
  items: QuotationItemResponse[];
}

// ---------------------------------------------------------------- supplier orders

export interface OrderItemResponse {
  id: number;
  requestItemId: number | null;
  description: string;
  unit: MaterialUnit;
  acceptedQuantity: number;
  agreedUnitPrice: number;
  totalPrice: number;
  deliveredQuantity: number;
  receivedQuantity: number | null;
  issueType: DeliveryIssueType | null;
  issueNote: string | null;
  milestoneId: number | null;
  milestoneTitle: string | null;
}

export interface PaymentInfo {
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

export interface HoldInfo {
  id: number;
  status: StoreHoldStatus;
  amount: number;
  reversedAmount: number | null;
  holdStartAt: string | null;
  releaseAt: string | null;
  releasedAt: string | null;
}

export interface DeliveryItemResponse {
  orderItemId: number;
  description: string;
  quantity: number;
}

export interface MaterialDelivery {
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
  items: DeliveryItemResponse[];
}

export interface DisputeInfo {
  id: number;
  status: 'OPEN' | 'RESOLVED';
  openedByUserId: number | null;
  openedByName: string | null;
  reason: string;
  refundAmount: number | null;
  resolutionNote: string | null;
  openedAt: string;
  resolvedAt: string | null;
}

export interface HistoryEntry {
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
  store: StoreSummary | null;
  purchasingAccountType: PurchasingAccountType;
  buyerUserId: number | null;
  buyerName: string | null;
  projectOrderId: number | null;
  status: SupplierOrderStatus;
  paymentStatus: MaterialPaymentStatus;
  deliveryStatus: MaterialDeliveryStatus;
  subtotal: number;
  deliveryFee: number;
  taxAmount: number | null;
  discountAmount: number | null;
  totalAmount: number;
  deliveryAddress: DeliveryAddress | null;
  createdAt: string;
  fundedAt: string | null;
  completedAt: string | null;
  canceledAt: string | null;
  cancelReason: string | null;
  buyerRating: number | null;
  buyerReview: string | null;
  items: OrderItemResponse[];
  payment: PaymentInfo | null;
  storeHold: HoldInfo | null;
  deliveries: MaterialDelivery[];
  disputes: DisputeInfo[];
  history: HistoryEntry[];
}

export interface ScheduleDeliveryInput {
  scheduledAt?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  note?: string | null;
  items: { orderItemId: number; quantity: number }[];
}

export interface UpdateDeliveryInput {
  status: DeliveryStepStatus;
  scheduledAt?: string | null;
  proofOfDeliveryUrl?: string | null;
  recipientName?: string | null;
  note?: string | null;
}

// ---------------------------------------------------------------- wallet

export interface ScheduledRelease {
  holdId: number;
  orderId: number | null;
  milestoneId: number | null;
  milestoneTitle: string | null;
  amount: number;
  currency: string;
  holdStartAt: string | null;
  releaseAt: string | null;
  status: StoreHoldStatus;
}

export interface WalletBalanceResponse {
  currency: string;
  status: 'ACTIVE' | 'FROZEN';
  totalBalance: number;
  availableBalance: number;
  frozenBalance: number;
  reservedBalance: number;
  pendingWithdrawalBalance: number;
  scheduledReleases: ScheduledRelease[];
}

export interface WalletTransactionResponse {
  id: number;
  type: string;
  bucket: string;
  direction: 'CREDIT' | 'DEBIT';
  amount: number;
  currency: string;
  orderId: number | null;
  description: string | null;
  createdAt: string;
}

export interface WithdrawalEligibilityResponse {
  eligible: boolean;
  reason: string | null;
  message: string | null;
  currency: string;
  availableBalance: number;
}

export interface WithdrawalRequestResponse {
  id: number;
  amount: number;
  currency: string;
  bankAccountId: number | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  status: WithdrawalStatus;
  payoutReference: string | null;
  failureReason: string | null;
  requestedAt: string;
  processedAt: string | null;
}

export interface BankAccountResponse {
  id: number;
  holderName: string;
  bankName: string;
  maskedNumber: string;
  status: BankAccountStatus;
  rejectionReason: string | null;
  verifiedAt: string | null;
  createdAt: string;
}

export interface BankAccountRequest {
  holderName: string;
  bankName: string;
  accountNumber: string;
}

export interface PresignUploadResponse {
  uploadUrl: string;
  fileUrl: string;
  key: string;
}
