import { useMemo } from 'react';
import { buildQuery, putToPresignedUrl, rawRequest } from '@/store/api/client';
import { useStoreAuth, type StoreRequestFn } from '@/store/context/StoreAuthContext';
import type {
  AddMemberRequest,
  BankAccountRequest,
  BankAccountResponse,
  CategoryResponse,
  HoldInfo,
  LocationRequest,
  LocationResponse,
  MarketplaceFilters,
  MarketplaceRequest,
  MaterialQuotationStatus,
  MemberResponse,
  PageResponse,
  PresignUploadResponse,
  QuotationResponse,
  RegionResponse,
  ScheduleDeliveryInput,
  StoreDashboardResponse,
  StoreResponse,
  SubmitQuotationInput,
  SupplierOrderResponse,
  SupplierOrderStatus,
  UpdateDeliveryInput,
  UpdateMemberRequest,
  UpdateStoreRequest,
  WalletBalanceResponse,
  WalletTransactionResponse,
  WithdrawalEligibilityResponse,
  WithdrawalRequestResponse,
} from '@/store/types';

// Public (no auth) lookups.
export const fetchRegions = () => rawRequest<RegionResponse[]>('/locations/regions');
export const fetchCategories = () => rawRequest<CategoryResponse[]>('/materials/categories');

export type UploadCategory = 'store-logos' | 'delivery-proofs';

function createStoreApi(request: StoreRequestFn) {
  const post = <T,>(path: string, body?: unknown, headers?: Record<string, string>) =>
    request<T>(path, { method: 'POST', body: body ?? {}, headers });
  const put = <T,>(path: string, body: unknown) => request<T>(path, { method: 'PUT', body });

  return {
    // profile
    profile: () => request<StoreResponse>('/stores/profile'),
    updateProfile: (body: UpdateStoreRequest) => put<StoreResponse>('/stores/profile', body),
    dashboard: () => request<StoreDashboardResponse>('/stores/dashboard'),

    // locations
    addLocation: (body: LocationRequest) => post<LocationResponse>('/stores/locations', body),
    updateLocation: (id: number, body: LocationRequest) => put<LocationResponse>(`/stores/locations/${id}`, body),
    removeLocation: (id: number) => request<void>(`/stores/locations/${id}`, { method: 'DELETE' }),

    // members
    members: () => request<MemberResponse[]>('/stores/members'),
    addMember: (body: AddMemberRequest) => post<MemberResponse>('/stores/members', body),
    updateMember: (id: number, body: UpdateMemberRequest) => put<MemberResponse>(`/stores/members/${id}`, body),

    // marketplace
    marketplace: (f: MarketplaceFilters) =>
      request<PageResponse<MarketplaceRequest>>(
        `/stores/material-requests${buildQuery({
          categoryId: f.categoryId,
          regionId: f.regionId,
          minQuantity: f.minQuantity,
          deliveryFrom: f.deliveryFrom,
          deliveryTo: f.deliveryTo,
          page: f.page ?? 0,
          size: f.size ?? 20,
        })}`
      ),
    marketplaceRequest: (id: number) => request<MarketplaceRequest>(`/stores/material-requests/${id}`),
    submitQuotation: (requestId: number, body: SubmitQuotationInput) =>
      post<QuotationResponse>(`/stores/material-requests/${requestId}/quotations`, body),

    // quotations
    quotations: (status: MaterialQuotationStatus[] | undefined, page: number, size = 20) =>
      request<PageResponse<QuotationResponse>>(`/stores/quotations${buildQuery({ status, page, size })}`),
    quotation: (id: number) => request<QuotationResponse>(`/stores/quotations/${id}`),
    withdrawQuotation: (id: number) => post<QuotationResponse>(`/stores/quotations/${id}/withdraw`),

    // orders
    orders: (status: SupplierOrderStatus[] | undefined, page: number, size = 20) =>
      request<PageResponse<SupplierOrderResponse>>(`/stores/orders${buildQuery({ status, page, size })}`),
    order: (id: number) => request<SupplierOrderResponse>(`/stores/orders/${id}`),
    startPreparing: (id: number, note?: string) =>
      post<SupplierOrderResponse>(`/stores/orders/${id}/status`, { status: 'PREPARING', note: note || null }),
    cancelOrder: (id: number, reason: string) => post<SupplierOrderResponse>(`/stores/orders/${id}/cancel`, { reason }),
    scheduleDelivery: (id: number, body: ScheduleDeliveryInput) =>
      post<SupplierOrderResponse>(`/stores/orders/${id}/deliveries`, body),
    updateDelivery: (deliveryId: number, body: UpdateDeliveryInput) =>
      post<SupplierOrderResponse>(`/stores/deliveries/${deliveryId}/status`, body),

    // wallet (OWNER)
    wallet: () => request<WalletBalanceResponse>('/stores/wallet'),
    holds: () => request<HoldInfo[]>('/stores/wallet/holds'),
    transactions: (page: number, size = 20) =>
      request<PageResponse<WalletTransactionResponse>>(`/stores/wallet/transactions${buildQuery({ page, size })}`),
    withdrawalEligibility: () => request<WithdrawalEligibilityResponse>('/stores/wallet/withdrawal-eligibility'),
    withdrawals: (page: number, size = 10) =>
      request<PageResponse<WithdrawalRequestResponse>>(`/stores/wallet/withdrawals${buildQuery({ page, size })}`),
    requestWithdrawal: (amount: number, bankAccountId: number, idempotencyKey: string) =>
      post<WithdrawalRequestResponse>('/stores/wallet/withdrawals', { amount, bankAccountId }, { 'Idempotency-Key': idempotencyKey }),
    bankAccounts: () => request<BankAccountResponse[]>('/stores/bank-accounts'),
    addBankAccount: (body: BankAccountRequest) => post<BankAccountResponse>('/stores/bank-accounts', body),
    removeBankAccount: (id: number) => request<void>(`/stores/bank-accounts/${id}`, { method: 'DELETE' }),

    // uploads: presign -> PUT bytes -> permanent fileUrl
    upload: async (category: UploadCategory, file: File): Promise<string> => {
      const contentType = file.type || 'application/octet-stream';
      const presign = await post<PresignUploadResponse>('/stores/uploads/presign', {
        category,
        fileName: file.name,
        contentType,
      });
      await putToPresignedUrl(presign.uploadUrl, file, contentType);
      return presign.fileUrl;
    },
  };
}

export type StoreApi = ReturnType<typeof createStoreApi>;

export function useStoreApi(): StoreApi {
  const { request } = useStoreAuth();
  return useMemo(() => createStoreApi(request), [request]);
}
