import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { buildQuery, useAuthorizedRequest } from '@/admin/api/http';
import type { CompanySummaryResponse, VerifyCompanyRequest } from '@/admin/types';
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
