import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { buildQuery, useAuthorizedRequest } from '@/admin/api/http';
import type { MilestoneDisputeResponse, OrderMilestoneResponse, ResolveDisputeRequest } from '@/admin/types';
import type { PageResponse } from '@/types/api';
import type { DisputeStatus } from '@/types/enums';

interface UseDisputesParams {
  status?: DisputeStatus;
  page?: number;
  size?: number;
}

export function useDisputes({ status, page = 0, size = 20 }: UseDisputesParams = {}) {
  const request = useAuthorizedRequest();
  return useQuery({
    queryKey: ['admin', 'disputes', { status, page, size }],
    queryFn: () => request<PageResponse<MilestoneDisputeResponse>>(`/admin/disputes${buildQuery({ status, page, size })}`),
    placeholderData: (previous) => previous,
  });
}

interface ResolveDisputeParams extends ResolveDisputeRequest {
  milestoneId: number;
  orderId: number;
}

export function useResolveDispute() {
  const request = useAuthorizedRequest();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ milestoneId, resolution, note }: ResolveDisputeParams) =>
      request<OrderMilestoneResponse>(`/admin/milestones/${milestoneId}/dispute/resolve`, {
        method: 'POST',
        body: { resolution, note } satisfies ResolveDisputeRequest,
      }),
    onSuccess: (_data, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'disputes'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'orderMilestones', orderId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'orderPayments', orderId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'order', String(orderId)] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'userBalance'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'userTransactions'] });
    },
  });
}
