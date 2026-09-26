import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { buildQuery, useAuthorizedRequest } from '@/admin/api/http';
import type { AdminWalletAdjustmentRequest, UpdateWithdrawalStatusRequest, WithdrawalRequestResponse } from '@/admin/types';
import type { PageResponse } from '@/types/api';
import type { WithdrawalStatus } from '@/types/enums';

interface UseWithdrawalsParams {
  status?: WithdrawalStatus;
  page?: number;
  size?: number;
}

export function useWithdrawals({ status, page = 0, size = 20 }: UseWithdrawalsParams = {}) {
  const request = useAuthorizedRequest();
  return useQuery({
    queryKey: ['admin', 'withdrawals', { status, page, size }],
    queryFn: () =>
      request<PageResponse<WithdrawalRequestResponse>>(`/admin/wallet/withdrawals${buildQuery({ status, page, size })}`),
    placeholderData: (previous) => previous,
  });
}

interface UpdateWithdrawalParams extends UpdateWithdrawalStatusRequest {
  id: number;
}

export function useUpdateWithdrawal() {
  const request = useAuthorizedRequest();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, adminNote }: UpdateWithdrawalParams) =>
      request<WithdrawalRequestResponse>(`/admin/wallet/withdrawals/${id}`, {
        method: 'PUT',
        body: { status, adminNote } satisfies UpdateWithdrawalStatusRequest,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'withdrawals'] }),
  });
}

export function useAdjustWallet() {
  const request = useAuthorizedRequest();
  return useMutation({
    mutationFn: (body: AdminWalletAdjustmentRequest) =>
      request<void>('/admin/wallet/adjustments', { method: 'POST', body }),
  });
}
