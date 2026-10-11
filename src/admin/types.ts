import type {
  BankAccountStatus,
  DisputeResolution,
  DisputeStatus,
  HoldStatus,
  WalletStatus,
  MilestonePlanStatus,
  MilestoneStatus,
  PaymentStatus,
  WalletBucket,
  OrderBidStatus,
  OrderStatus,
  OrderType,
  UserRole,
  UserStatus,
  VehicleStatus,
  VerificationStatus,
  WalletTransactionType,
  WithdrawalStatus,
  WorkerStatus,
} from '@/types/enums';

/** Mirrors backend admin/dto/UserSummaryResponse. */
export interface UserSummaryResponse {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

export interface UpdateUserStatusRequest {
  status: UserStatus;
}

/** Mirrors backend admin/dto/CompanySummaryResponse. */
export interface CompanySummaryResponse {
  id: number;
  companyName: string;
  ownerId: number;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  city: string;
  logoUrl: string | null;
  verificationStatus: VerificationStatus;
  totalJobsCompleted: number;
  rating: number | null;
  createdAt: string;
}

export interface VerifyCompanyRequest {
  verificationStatus: VerificationStatus;
  note?: string;
}

/** Mirrors backend admin/dto/AdminDashboardResponse. */
export interface AdminDashboardResponse {
  totalCustomers: number;
  totalContractors: number;
  pendingContractorVerifications: number;
  verifiedContractors: number;
  totalOrders: number;
  ordersByStatus: Record<string, number>;
}

/** Mirrors backend admin/dto/SettingResponse. */
export interface SettingResponse {
  key: string;
  value: string;
  description: string | null;
  updatedAt: string;
}

export interface UpdateSettingRequest {
  value: string;
  description?: string;
}

/** Mirrors backend order/dto/OrderSummaryResponse. */
export interface OrderSummaryResponse {
  id: number;
  categoryName: string;
  serviceItemName: string | null;
  status: OrderStatus;
  orderType: OrderType;
  plannedStartDate: string | null;
  plannedEndDate: string | null;
  addressCity: string;
  scheduledAt: string | null;
  createdAt: string;
  customerName: string;
  assignedCompanyName: string | null;
  finalPrice: number | null;
  estimatedDeliveryAt: string | null;
}

/** Mirrors backend order/dto/OrderMilestoneResponse.PaymentInfo - the milestone's own payment. */
export interface MilestonePaymentInfo {
  id: number;
  status: PaymentStatus;
  providerReference: string | null;
  amount: number;
  fundedAt: string | null;
  settledAt: string | null;
  refundedAt: string | null;
}

/** Mirrors backend order/dto/OrderMilestoneResponse.HoldInfo - contractor 7-day hold. */
export interface MilestoneHoldInfo {
  id: number;
  status: HoldStatus;
  holdStartAt: string | null;
  releaseAt: string | null;
}

/** Mirrors backend order/dto/OrderMilestoneResponse.DisputeInfo. */
export interface MilestoneDisputeInfo {
  id: number;
  status: DisputeStatus;
  openedByUserId: number | null;
  openedByName: string | null;
  reason: string | null;
  resolutionNote: string | null;
  openedAt: string | null;
  resolvedAt: string | null;
}

/** Mirrors backend order/dto/OrderMilestoneResponse. */
export interface OrderMilestoneResponse {
  id: number;
  orderId: number;
  sequence: number;
  title: string;
  description: string | null;
  amount: number;
  currency: string;
  startDate: string | null;
  dueDate: string | null;
  status: MilestoneStatus;
  consumerApprovedAt: string | null;
  fundedAt: string | null;
  contractorCompletedAt: string | null;
  acceptedAt: string | null;
  revisionNote: string | null;
  payment: MilestonePaymentInfo | null;
  hold: MilestoneHoldInfo | null;
  dispute: MilestoneDisputeInfo | null;
  createdAt: string;
}

/**
 * Mirrors backend order/dto/MilestonePlanResponse. totalEstimatedAmount is the live plan total,
 * NOT money paid - fundedAmount is what the consumer actually paid in.
 */
export interface MilestonePlanResponse {
  orderId: number;
  orderType: OrderType;
  plannedStartDate: string | null;
  plannedEndDate: string | null;
  planStatus: MilestonePlanStatus | null;
  planRejectionReason: string | null;
  planApprovedAt: string | null;
  currency: string;
  totalEstimatedAmount: number;
  fundedAmount: number;
  remainingUnfundedAmount: number;
  completedMilestones: number;
  upcomingMilestones: number;
  nextFundableMilestoneId: number | null;
  milestones: OrderMilestoneResponse[];
}

/** Mirrors backend order/dto/MilestoneDisputeResponse - Admin Console > Disputes row. */
export interface MilestoneDisputeResponse {
  id: number;
  orderId: number;
  milestoneId: number;
  milestoneTitle: string;
  amount: number;
  openedByUserId: number;
  openedByName: string;
  reason: string;
  status: DisputeStatus;
  resolutionNote: string | null;
  openedAt: string;
  resolvedAt: string | null;
}

export interface ResolveDisputeRequest {
  resolution: DisputeResolution;
  note: string;
}

/** Mirrors backend wallet/dto/ScheduledReleaseResponse - one HELD (or dispute-BLOCKED) contractor earning. */
export interface ScheduledReleaseResponse {
  holdId: number;
  orderId: number | null;
  milestoneId: number | null;
  milestoneTitle: string | null;
  amount: number;
  currency: string;
  holdStartAt: string;
  releaseAt: string;
  status: HoldStatus;
}

/** Mirrors backend wallet/dto/WalletBalanceResponse. totalBalance = available + frozen + reserved + pendingWithdrawal. */
export interface WalletBalanceResponse {
  currency: string;
  /** FROZEN blocks withdrawals and hold releases. */
  status: WalletStatus;
  totalBalance: number;
  availableBalance: number;
  /** Contractor HELD earnings inside the 7-day hold. */
  frozenBalance: number;
  /** Consumer money locked against funded milestones. */
  reservedBalance: number;
  pendingWithdrawalBalance: number;
  scheduledReleases: ScheduledReleaseResponse[];
}

/** Mirrors backend wallet/dto/WalletTransactionResponse. amount is signed; direction is for display. */
export interface WalletTransactionResponse {
  id: number;
  ownerUserId: number;
  ownerName: string;
  type: WalletTransactionType;
  bucket: WalletBucket | null;
  direction: 'CREDIT' | 'DEBIT';
  amount: number;
  currency: string;
  orderId: number | null;
  milestoneId: number | null;
  referenceType: string | null;
  referenceId: number | null;
  description: string | null;
  createdAt: string;
}

export interface OrderStatusHistoryResponse {
  status: OrderStatus;
  note: string | null;
  changedAt: string;
}

/** Mirrors backend order/dto/OrderResponse — full order detail. */
export interface OrderResponse {
  id: number;
  customerId: number;
  customerName: string;
  customerPhone: string;
  categoryId: number;
  categoryName: string;
  serviceItemId: number | null;
  serviceItemName: string | null;
  description: string | null;
  addressLine1: string;
  addressLine2: string | null;
  addressCity: string;
  addressLatitude: number | null;
  addressLongitude: number | null;
  scheduledAt: string | null;
  status: OrderStatus;
  orderType: OrderType;
  plannedStartDate: string | null;
  plannedEndDate: string | null;
  milestonePlanStatus: MilestonePlanStatus | null;
  assignedCompanyId: number | null;
  assignedCompanyName: string | null;
  assignedWorkerId: number | null;
  assignedWorkerName: string | null;
  finalPrice: number | null;
  estimatedDeliveryAt: string | null;
  customerConfirmedDone: boolean;
  companyConfirmedDone: boolean;
  imageUrls: string[];
  rejectReason: string | null;
  cancelReason: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  history: OrderStatusHistoryResponse[];
  milestones: OrderMilestoneResponse[];
}

export interface AdminAssignOrderRequest {
  companyId: number;
  /** Required by the backend for a ONE_TIME order with no accepted offer - becomes its single milestone's amount. */
  agreedPrice?: number;
}

/** One milestone of a per-milestone priced bid (MEDIUM_TERM / LONG_TERM orders). */
export interface OrderBidMilestoneResponse {
  sequence: number;
  title: string;
  description: string | null;
  amount: number;
  startDate: string | null;
  dueDate: string | null;
}

/** Mirrors backend order/dto/OrderBidResponse. For multi-stage orders price = sum of milestones. */
export interface OrderBidResponse {
  id: number;
  orderId: number;
  companyId: number;
  companyName: string;
  companyRating: number | null;
  companyRatingCount: number;
  price: number;
  estimatedDeliveryAt: string;
  note: string | null;
  status: OrderBidStatus;
  /** Empty for ONE_TIME orders. */
  milestones: OrderBidMilestoneResponse[];
  createdAt: string;
  updatedAt: string;
}

/** Mirrors backend catalog/dto/CategoryResponse. */
export interface CategoryResponse {
  id: number;
  name: string;
  description: string | null;
  iconUrl: string | null;
  active: boolean;
  displayOrder: number;
}

export interface CategoryRequest {
  name: string;
  description?: string;
  iconUrl?: string;
  active?: boolean;
  displayOrder?: number;
}

/** Mirrors backend catalog/dto/ServiceItemResponse. */
export interface ServiceItemResponse {
  id: number;
  categoryId: number;
  categoryName: string;
  name: string;
  description: string | null;
  active: boolean;
}

export interface ServiceItemRequest {
  categoryId: number;
  name: string;
  description?: string;
  active?: boolean;
}

/** Mirrors backend wallet/dto/WithdrawalRequestResponse (admin variant, with the full payout details). */
export interface WithdrawalRequestResponse {
  id: number;
  ownerUserId: number;
  ownerName: string;
  amount: number;
  currency: string;
  bankAccountId: number | null;
  bankName: string | null;
  /** Masked number, e.g. "**** 1234". */
  bankAccountNumber: string;
  accountHolderName: string | null;
  fullAccountNumber: string | null;
  status: WithdrawalStatus;
  payoutReference: string | null;
  failureReason: string | null;
  adminNote: string | null;
  requestedAt: string;
  processedAt: string | null;
}

/** COMPLETED requires payoutReference (the real bank transfer reference); FAILED/REJECTED require reason. */
export type UpdateWithdrawalStatusRequest =
  | { status: 'COMPLETED'; payoutReference: string; adminNote?: string }
  | { status: 'FAILED' | 'REJECTED'; reason: string; adminNote?: string };

/** Payment HayShen actually received (bank transfer, POS...). Idempotent per externalReference. */
export interface AdminDepositRequest {
  ownerUserId: number;
  amount: number;
  externalReference: string;
  note?: string;
}

/** Compensating correction to AVAILABLE balance; amount is signed, note is mandatory. */
export interface AdminWalletAdjustmentRequest {
  ownerUserId: number;
  amount: number;
  note: string;
}

/** Mirrors backend wallet/dto/BankAccountResponse (admin variant: full accountNumber + owner). */
export interface BankAccountResponse {
  id: number;
  userId: number;
  userName: string;
  holderName: string;
  bankName: string;
  maskedNumber: string;
  accountNumber: string | null;
  status: BankAccountStatus;
  rejectionReason: string | null;
  verifiedAt: string | null;
  createdAt: string;
}

/** Mirrors backend contractor/dto/WorkerResponse — Admin Console > Company Details. */
export interface WorkerResponse {
  id: number;
  fullName: string;
  phone: string | null;
  title: string | null;
  photoUrl: string | null;
  status: WorkerStatus;
  addressLine1: string | null;
  addressLine2: string | null;
  addressCity: string | null;
  addressLatitude: number | null;
  addressLongitude: number | null;
  rating: number | null;
  ratingCount: number;
}

/** Mirrors backend contractor/dto/VehicleResponse — Admin Console > Company Details. */
export interface VehicleResponse {
  id: number;
  plateNumber: string | null;
  vehicleModelId: number | null;
  vehicleModelName: string | null;
  type: string | null;
  capacity: string | null;
  imageUrls: string[];
  status: VehicleStatus;
  addressLine1: string | null;
  addressLine2: string | null;
  addressCity: string | null;
  addressLatitude: number | null;
  addressLongitude: number | null;
}
