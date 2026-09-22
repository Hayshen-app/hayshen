import type { OrderBidStatus, OrderStatus, UserRole, UserStatus, VerificationStatus } from '@/types/enums';

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
  addressCity: string;
  scheduledAt: string | null;
  createdAt: string;
  customerName: string;
  assignedCompanyName: string | null;
  finalPrice: number | null;
  estimatedDeliveryAt: string | null;
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
}

export interface AdminAssignOrderRequest {
  companyId: number;
}

/** Mirrors backend order/dto/OrderBidResponse. */
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
