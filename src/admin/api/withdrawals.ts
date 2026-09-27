import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { buildQuery, useAuthorizedRequest } from '@/admin/api/http';
import type {
  AdminWalletAdjustmentRequest,
  UpdateWithdrawalStatusRequest,
  WalletBalanceResponse,
  WalletTransactionResponse,
  WithdrawalRequestResponse,
} from '@/admin/types';
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

/** Every wallet ledger row (reserve/release/refund) an order produced - Order Details "Payments" section. */
export function useOrderPayments(orderId?: number) {
  const request = useAuthorizedRequest();
  return useQuery({
    queryKey: ['admin', 'orderPayments', orderId],
    queryFn: () => request<WalletTransactionResponse[]>(`/admin/wallet/orders/${orderId}/transactions`),
    enabled: orderId != null,
  });
}

/** A user's (contractor owner or customer) wallet balance - Company/User Details "Payments" section. */
export function useUserBalance(userId: string | number | undefined) {
  const request = useAuthorizedRequest();
  return useQuery({
    queryKey: ['admin', 'userBalance', String(userId)],
    queryFn: () => request<WalletBalanceResponse>(`/admin/wallet/users/${userId}/balance`),
    enabled: Boolean(userId),
  });
}

interface UseUserTransactionsParams {
  page?: number;
  size?: number;
}

export function useUserTransactions(
  userId: string | number | undefined,
  { page = 0, size = 20 }: UseUserTransactionsParams = {},
) {
  const request = useAuthorizedRequest();
  return useQuery({
    queryKey: ['admin', 'userTransactions', String(userId), { page, size }],
    queryFn: () =>
      request<PageResponse<WalletTransactionResponse>>(`/admin/wallet/users/${userId}/transactions${buildQuery({ page, size })}`),
    enabled: Boolean(userId),
    placeholderData: (previous) => previous,
  });
}
