import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { buildQuery, useAuthorizedRequest } from '@/admin/api/http';
import type { AdminAssignOrderRequest, OrderResponse, OrderSummaryResponse } from '@/admin/types';
import type { PageResponse } from '@/types/api';
import type { OrderStatus } from '@/types/enums';

interface UseOrdersParams {
  status?: OrderStatus;
  page?: number;
  size?: number;
}

export function useOrders({ status, page = 0, size = 20 }: UseOrdersParams = {}) {
  const request = useAuthorizedRequest();
  return useQuery({
    queryKey: ['admin', 'orders', { status, page, size }],
    queryFn: () => request<PageResponse<OrderSummaryResponse>>(`/admin/orders${buildQuery({ status, page, size })}`),
    placeholderData: (previous) => previous,
  });
}

export function useOrder(id: string | number | undefined) {
  const request = useAuthorizedRequest();
  return useQuery({
    queryKey: ['admin', 'order', String(id)],
    queryFn: () => request<OrderResponse>(`/admin/orders/${id}`),
    enabled: Boolean(id),
  });
}

interface DispatchOrderParams extends AdminAssignOrderRequest {
  id: number;
}

export function useDispatchOrder() {
  const request = useAuthorizedRequest();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, companyId }: DispatchOrderParams) =>
      request<OrderResponse>(`/admin/orders/${id}/dispatch`, {
        method: 'PUT',
        body: { companyId } satisfies AdminAssignOrderRequest,
      }),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'order', String(id)] });
    },
  });
}
