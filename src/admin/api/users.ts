import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { buildQuery, useAuthorizedRequest } from '@/admin/api/http';
import type { UpdateUserStatusRequest, UserSummaryResponse } from '@/admin/types';
import type { PageResponse } from '@/types/api';
import type { UserRole, UserStatus } from '@/types/enums';

interface UseUsersParams {
  role?: UserRole;
  search?: string;
  page?: number;
  size?: number;
}

export function useUsers({ role, search, page = 0, size = 20 }: UseUsersParams) {
  const request = useAuthorizedRequest();
  return useQuery({
    queryKey: ['admin', 'users', { role, search, page, size }],
    queryFn: () => request<PageResponse<UserSummaryResponse>>(`/admin/users${buildQuery({ role, search, page, size })}`),
    placeholderData: (previous) => previous,
  });
}

export function useUpdateUserStatus() {
  const request = useAuthorizedRequest();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: UserStatus }) =>
      request<UserSummaryResponse>(`/admin/users/${id}/status`, {
        method: 'PUT',
        body: { status } satisfies UpdateUserStatusRequest,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}
