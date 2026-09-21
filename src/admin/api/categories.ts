import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthorizedRequest } from '@/admin/api/http';
import type { CategoryRequest, CategoryResponse, ServiceItemRequest, ServiceItemResponse } from '@/admin/types';

export function useCategories() {
  const request = useAuthorizedRequest();
  return useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: () => request<CategoryResponse[]>('/admin/categories'),
  });
}

export function useServiceItems(categoryId: number | undefined, { enabled = true }: { enabled?: boolean } = {}) {
  const request = useAuthorizedRequest();
  return useQuery({
    queryKey: ['admin', 'categories', categoryId, 'services'],
    queryFn: () => request<ServiceItemResponse[]>(`/categories/${categoryId}/services`),
    enabled: Boolean(categoryId) && enabled,
  });
}

export function useCreateCategory() {
  const request = useAuthorizedRequest();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CategoryRequest) =>
      request<CategoryResponse>('/admin/categories', { method: 'POST', body: payload }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] }),
  });
}

interface UpdateCategoryParams extends CategoryRequest {
  id: number;
}

export function useUpdateCategory() {
  const request = useAuthorizedRequest();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateCategoryParams) =>
      request<CategoryResponse>(`/admin/categories/${id}`, { method: 'PUT', body: payload }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] }),
  });
}

export function useDeactivateCategory() {
  const request = useAuthorizedRequest();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => request<void>(`/admin/categories/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] }),
  });
}

export function useCreateServiceItem() {
  const request = useAuthorizedRequest();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ServiceItemRequest) =>
      request<ServiceItemResponse>('/admin/categories/services', { method: 'POST', body: payload }),
    onSuccess: (_data, payload) =>
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories', payload.categoryId, 'services'] }),
  });
}
