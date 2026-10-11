import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { buildQuery, useAuthorizedRequest } from '@/admin/api/http';
import type { BankAccountResponse } from '@/admin/types';
import type { PageResponse } from '@/types/api';
import type { BankAccountStatus } from '@/types/enums';

interface UseBankAccountsParams {
  status?: BankAccountStatus;
  page?: number;
  size?: number;
}

/** Payout bank accounts awaiting (or past) admin verification. Includes the full account number. */
export function useBankAccounts({ status, page = 0, size = 20 }: UseBankAccountsParams = {}) {
  const request = useAuthorizedRequest();
  return useQuery({
    queryKey: ['admin', 'bankAccounts', { status, page, size }],
    queryFn: () => request<PageResponse<BankAccountResponse>>(`/admin/bank-accounts${buildQuery({ status, page, size })}`),
    placeholderData: (previous) => previous,
  });
}

export function useVerifyBankAccount() {
  const request = useAuthorizedRequest();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => request<BankAccountResponse>(`/admin/bank-accounts/${id}/verify`, { method: 'PUT' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'bankAccounts'] }),
  });
}

export function useRejectBankAccount() {
  const request = useAuthorizedRequest();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      request<BankAccountResponse>(`/admin/bank-accounts/${id}/reject`, { method: 'PUT', body: { reason } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'bankAccounts'] }),
  });
}
