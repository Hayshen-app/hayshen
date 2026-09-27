import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { buildQuery, useAuthorizedRequest } from '@/admin/api/http';
import type {
  CompanySummaryResponse,
  OrderSummaryResponse,
  VehicleResponse,
  VerifyCompanyRequest,
  WorkerResponse,
} from '@/admin/types';
import type { PageResponse } from '@/types/api';
import type { VerificationStatus } from '@/types/enums';

interface UseCompaniesParams {
  status?: VerificationStatus;
  page?: number;
  size?: number;
}

export function useCompanies({ status, page = 0, size = 20 }: UseCompaniesParams = {}) {
  const request = useAuthorizedRequest();
  return useQuery({
    queryKey: ['admin', 'companies', { status, page, size }],
    queryFn: () =>
      request<PageResponse<CompanySummaryResponse>>(`/admin/companies${buildQuery({ status, page, size })}`),
    placeholderData: (previous) => previous,
  });
}

interface VerifyCompanyParams extends VerifyCompanyRequest {
  id: number;
}

export function useVerifyCompany() {
  const request = useAuthorizedRequest();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, verificationStatus, note }: VerifyCompanyParams) =>
      request<CompanySummaryResponse>(`/admin/companies/${id}/verify`, {
        method: 'PUT',
        body: { verificationStatus, note } satisfies VerifyCompanyRequest,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'companies'] }),
  });
}

export function useCompany(id: string | number | undefined) {
  const request = useAuthorizedRequest();
  return useQuery({
    queryKey: ['admin', 'company', String(id)],
    queryFn: () => request<CompanySummaryResponse>(`/admin/companies/${id}`),
    enabled: Boolean(id),
  });
}

export function useCompanyWorkers(id: string | number | undefined) {
  const request = useAuthorizedRequest();
  return useQuery({
    queryKey: ['admin', 'company', String(id), 'workers'],
    queryFn: () => request<WorkerResponse[]>(`/admin/companies/${id}/workers`),
    enabled: Boolean(id),
  });
}

export function useCompanyVehicles(id: string | number | undefined) {
  const request = useAuthorizedRequest();
  return useQuery({
    queryKey: ['admin', 'company', String(id), 'vehicles'],
    queryFn: () => request<VehicleResponse[]>(`/admin/companies/${id}/vehicles`),
    enabled: Boolean(id),
  });
}

interface UseCompanyOrdersParams {
  page?: number;
  size?: number;
}

export function useCompanyOrders(id: string | number | undefined, { page = 0, size = 20 }: UseCompanyOrdersParams = {}) {
  const request = useAuthorizedRequest();
  return useQuery({
    queryKey: ['admin', 'company', String(id), 'orders', { page, size }],
    queryFn: () =>
      request<PageResponse<OrderSummaryResponse>>(`/admin/companies/${id}/orders${buildQuery({ page, size })}`),
    enabled: Boolean(id),
    placeholderData: (previous) => previous,
  });
}
