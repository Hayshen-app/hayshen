import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthorizedRequest } from '@/admin/api/http';
import type { SettingResponse, UpdateSettingRequest } from '@/admin/types';

export function useSettings() {
  const request = useAuthorizedRequest();
  return useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => request<SettingResponse[]>('/admin/settings'),
  });
}

interface UpsertSettingParams extends UpdateSettingRequest {
  key: string;
}

export function useUpsertSetting() {
  const request = useAuthorizedRequest();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value, description }: UpsertSettingParams) =>
      request<SettingResponse>(`/admin/settings/${encodeURIComponent(key)}`, {
        method: 'PUT',
        body: { value, description } satisfies UpdateSettingRequest,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] }),
  });
}
