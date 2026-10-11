import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { buildQuery, useAuthorizedRequest } from '@/admin/api/http';
import type {
  AdminDepositRequest,
  AdminWalletAdjustmentRequest,
  MilestonePlanResponse,
  UpdateWithdrawalStatusRequest,
  WalletBalanceResponse,
  WalletTransactionResponse,
  WithdrawalRequestResponse,
} from '@/admin/types';
import type { PageResponse } from '@/types/api';
import type { WalletStatus, WithdrawalStatus } from '@/types/enums';

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

/** ownerUserId is only used to refresh that user's cached balance, never sent. */
type UpdateWithdrawalParams = UpdateWithdrawalStatusRequest & { id: number; ownerUserId?: number };

export function useUpdateWithdrawal() {
  const request = useAuthorizedRequest();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ownerUserId, ...body }: UpdateWithdrawalParams) => {
      void ownerUserId;
      return request<WithdrawalRequestResponse>(`/admin/wallet/withdrawals/${id}`, {
        method: 'PUT',
        body: body satisfies UpdateWithdrawalStatusRequest,
      });
    },
    onSuccess: (_data, { ownerUserId }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'withdrawals'] });
      invalidateUserWallet(queryClient, ownerUserId);
    },
  });
}

function invalidateUserWallet(queryClient: QueryClient, userId?: number | string) {
  if (userId == null) {
    queryClient.invalidateQueries({ queryKey: ['admin', 'userBalance'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'userTransactions'] });
    return;
  }
  queryClient.invalidateQueries({ queryKey: ['admin', 'userBalance', String(userId)] });
  queryClient.invalidateQueries({ queryKey: ['admin', 'userTransactions', String(userId)] });
}

/** Records a payment HayShen actually received (bank transfer / POS). Idempotent per externalReference. */
export function useRecordDeposit() {
  const request = useAuthorizedRequest();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: AdminDepositRequest) =>
      request<WalletBalanceResponse>('/admin/wallet/deposits', { method: 'POST', body }),
    onSuccess: (_data, { ownerUserId }) => invalidateUserWallet(queryClient, ownerUserId),
  });
}

/** Compensating correction to a user's available balance (note required, never overdraws). */
export function useAdjustWallet() {
  const request = useAuthorizedRequest();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: AdminWalletAdjustmentRequest) =>
      request<void>('/admin/wallet/adjustments', { method: 'POST', body }),
    onSuccess: (_data, { ownerUserId }) => invalidateUserWallet(queryClient, ownerUserId),
  });
}

/** FROZEN blocks withdrawals and hold releases for the user (e.g. compliance review). */
export function useSetWalletStatus() {
  const request = useAuthorizedRequest();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, status }: { userId: number; status: WalletStatus }) =>
      request<void>(`/admin/wallet/users/${userId}/status${buildQuery({ status })}`, { method: 'PUT' }),
    onSuccess: (_data, { userId }) => invalidateUserWallet(queryClient, userId),
  });
}

/** Milestone plan with per-milestone payment / hold / dispute - Order Details "Milestones" section. */
export function useOrderMilestonePlan(orderId?: number) {
  const request = useAuthorizedRequest();
  return useQuery({
    queryKey: ['admin', 'orderMilestones', orderId],
    queryFn: () => request<MilestonePlanResponse>(`/admin/wallet/orders/${orderId}/milestones`),
    enabled: orderId != null,
  });
}

/** Every wallet ledger row an order produced (funding, settlement, holds, refunds) - Order Details "Payments" section. */
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
