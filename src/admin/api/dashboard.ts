import { useQuery } from '@tanstack/react-query';
import { useAuthorizedRequest } from '@/admin/api/http';
import type { AdminDashboardResponse } from '@/admin/types';

export function useDashboard() {
  const request = useAuthorizedRequest();
  return useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => request<AdminDashboardResponse>('/admin/dashboard'),
  });
}
