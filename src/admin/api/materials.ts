import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { buildQuery, useAuthorizedRequest } from '@/admin/api/http';
import type {
  MaterialCategoryRequest,
  MaterialCategoryResponse,
  MaterialHistoryEntry,
  MaterialRequestBody,
  MaterialRequestResponse,
  MaterialRequestStatus,
  MaterialResponse,
  MaterialStoreStatus,
  ResolveMaterialDisputeRequest,
  SetStoreStatusRequest,
  StoreResponse,
  SupplierOrderResponse,
  SupplierOrderStatus,
  VerifyStoreRequest,
} from '@/admin/materialsTypes';
import type { PageResponse } from '@/types/api';
import type { VerificationStatus } from '@/types/enums';

const BASE = '/admin/materials';

/** Every materials query lives under this key prefix, so mutations can refresh them together. */
const MATERIALS_KEY = ['admin', 'materials'] as const;

// ----------------------------------------------------------------- categories

export function useMaterialCategories() {
  const request = useAuthorizedRequest();
  return useQuery({
    queryKey: [...MATERIALS_KEY, 'categories'],
    queryFn: () => request<MaterialCategoryResponse[]>(`${BASE}/categories`),
  });
}

export function useSaveMaterialCategory() {
  const request = useAuthorizedRequest();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: MaterialCategoryRequest & { id?: number }) =>
      id
        ? request<MaterialCategoryResponse>(`${BASE}/categories/${id}`, { method: 'PUT', body: payload })
        : request<MaterialCategoryResponse>(`${BASE}/categories`, { method: 'POST', body: payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...MATERIALS_KEY, 'categories'] });
      // Catalog rows carry the category name.
      queryClient.invalidateQueries({ queryKey: [...MATERIALS_KEY, 'catalog'] });
    },
  });
}

// -------------------------------------------------------------------- catalog

interface UseCatalogParams {
  categoryId?: number;
  q?: string;
  page?: number;
  size?: number;
}

export function useMaterialCatalog({ categoryId, q, page = 0, size = 20 }: UseCatalogParams = {}) {
  const request = useAuthorizedRequest();
  return useQuery({
    queryKey: [...MATERIALS_KEY, 'catalog', { categoryId, q, page, size }],
    queryFn: () =>
      request<PageResponse<MaterialResponse>>(`${BASE}/catalog${buildQuery({ categoryId, q, page, size })}`),
    placeholderData: (previous) => previous,
  });
}

export function useSaveMaterial() {
  const request = useAuthorizedRequest();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: MaterialRequestBody & { id?: number }) =>
      id
        ? request<MaterialResponse>(`${BASE}/catalog/${id}`, { method: 'PUT', body: payload })
        : request<MaterialResponse>(`${BASE}/catalog`, { method: 'POST', body: payload }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...MATERIALS_KEY, 'catalog'] }),
  });
}

// --------------------------------------------------------------------- stores

interface UseStoresParams {
  status?: VerificationStatus;
  page?: number;
  size?: number;
}

export function useMaterialStores({ status, page = 0, size = 20 }: UseStoresParams = {}) {
  const request = useAuthorizedRequest();
  return useQuery({
    queryKey: [...MATERIALS_KEY, 'stores', { status, page, size }],
    queryFn: () => request<PageResponse<StoreResponse>>(`${BASE}/stores${buildQuery({ status, page, size })}`),
    placeholderData: (previous) => previous,
  });
}

export function useMaterialStore(id: string | number | undefined) {
  const request = useAuthorizedRequest();
  return useQuery({
    queryKey: [...MATERIALS_KEY, 'store', String(id)],
    queryFn: () => request<StoreResponse>(`${BASE}/stores/${id}`),
    enabled: Boolean(id),
  });
}

function invalidateStores(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: [...MATERIALS_KEY, 'stores'] });
  queryClient.invalidateQueries({ queryKey: [...MATERIALS_KEY, 'store'] });
}

export function useVerifyMaterialStore() {
  const request = useAuthorizedRequest();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, verificationStatus, note }: VerifyStoreRequest & { id: number }) =>
      request<StoreResponse>(`${BASE}/stores/${id}/verify`, {
        method: 'PUT',
        body: { verificationStatus, note } satisfies VerifyStoreRequest,
      }),
    onSuccess: () => invalidateStores(queryClient),
  });
}

export function useSetMaterialStoreStatus() {
  const request = useAuthorizedRequest();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: MaterialStoreStatus }) =>
      request<StoreResponse>(`${BASE}/stores/${id}/status`, {
        method: 'PUT',
        body: { status } satisfies SetStoreStatusRequest,
      }),
    onSuccess: () => invalidateStores(queryClient),
  });
}

// ------------------------------------------------------------------- requests

interface UseRequestsParams {
  status?: MaterialRequestStatus;
  page?: number;
  size?: number;
  enabled?: boolean;
}

export function useMaterialRequests({ status, page = 0, size = 20, enabled = true }: UseRequestsParams = {}) {
  const request = useAuthorizedRequest();
  return useQuery({
    queryKey: [...MATERIALS_KEY, 'requests', { status, page, size }],
    queryFn: () =>
      request<PageResponse<MaterialRequestResponse>>(`${BASE}/requests${buildQuery({ status, page, size })}`),
    placeholderData: (previous) => previous,
    enabled,
  });
}

export function useMaterialRequest(id: string | number | undefined) {
  const request = useAuthorizedRequest();
  return useQuery({
    queryKey: [...MATERIALS_KEY, 'request', String(id)],
    queryFn: () => request<MaterialRequestResponse>(`${BASE}/requests/${id}`),
    enabled: Boolean(id),
  });
}

export function useMaterialRequestSupplierOrders(id: string | number | undefined) {
  const request = useAuthorizedRequest();
  return useQuery({
    queryKey: [...MATERIALS_KEY, 'requestSupplierOrders', String(id)],
    queryFn: () => request<SupplierOrderResponse[]>(`${BASE}/requests/${id}/supplier-orders`),
    enabled: Boolean(id),
  });
}

export function useMaterialRequestAudit(id: string | number | undefined) {
  const request = useAuthorizedRequest();
  return useQuery({
    queryKey: [...MATERIALS_KEY, 'requestAudit', String(id)],
    queryFn: () => request<MaterialHistoryEntry[]>(`${BASE}/requests/${id}/audit`),
    enabled: Boolean(id),
  });
}

// ------------------------------------------------------------ supplier orders

interface UseSupplierOrdersParams {
  status?: SupplierOrderStatus;
  storeId?: number;
  page?: number;
  size?: number;
  enabled?: boolean;
}

export function useSupplierOrders({ status, storeId, page = 0, size = 20, enabled = true }: UseSupplierOrdersParams = {}) {
  const request = useAuthorizedRequest();
  return useQuery({
    queryKey: [...MATERIALS_KEY, 'supplierOrders', { status, storeId, page, size }],
    queryFn: () =>
      request<PageResponse<SupplierOrderResponse>>(
        `${BASE}/supplier-orders${buildQuery({ status, storeId, page, size })}`,
      ),
    placeholderData: (previous) => previous,
    enabled,
  });
}

export function useSupplierOrder(id: string | number | undefined) {
  const request = useAuthorizedRequest();
  return useQuery({
    queryKey: [...MATERIALS_KEY, 'supplierOrder', String(id)],
    queryFn: () => request<SupplierOrderResponse>(`${BASE}/supplier-orders/${id}`),
    enabled: Boolean(id),
  });
}

// ------------------------------------------------------------------- disputes

export function useMaterialDisputes({ page = 0, size = 20 }: { page?: number; size?: number } = {}) {
  const request = useAuthorizedRequest();
  return useQuery({
    queryKey: [...MATERIALS_KEY, 'disputes', { page, size }],
    queryFn: () => request<PageResponse<SupplierOrderResponse>>(`${BASE}/disputes${buildQuery({ page, size })}`),
    placeholderData: (previous) => previous,
  });
}

export function useResolveMaterialDispute() {
  const request = useAuthorizedRequest();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ disputeId, refundToBuyer, note }: ResolveMaterialDisputeRequest & { disputeId: number }) =>
      request<SupplierOrderResponse>(`${BASE}/disputes/${disputeId}/resolve`, {
        method: 'POST',
        body: { refundToBuyer, note } satisfies ResolveMaterialDisputeRequest,
      }),
    onSuccess: () => {
      // Order, request status, dispute queue and both wallets all change.
      queryClient.invalidateQueries({ queryKey: MATERIALS_KEY });
      queryClient.invalidateQueries({ queryKey: ['admin', 'userBalance'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'userTransactions'] });
    },
  });
}
