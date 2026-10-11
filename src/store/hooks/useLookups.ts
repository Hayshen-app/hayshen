import { useQuery } from '@tanstack/react-query';
import { fetchCategories, fetchRegions } from '@/store/api/storeApi';

const HOUR = 60 * 60 * 1000;

export function useRegions() {
  return useQuery({ queryKey: ['store-lookup', 'regions'], queryFn: fetchRegions, staleTime: HOUR });
}

export function useCategories() {
  return useQuery({ queryKey: ['store-lookup', 'categories'], queryFn: fetchCategories, staleTime: HOUR });
}

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/** Armenian validation message for an image picked for upload, or null when fine. */
export function imageFileError(file: File): string | null {
  if (!file.type.startsWith('image/')) return 'Ընտրեք նկար (JPG, PNG, WEBP)';
  if (file.size > MAX_IMAGE_BYTES) return 'Նկարի չափը չպետք է գերազանցի 10 ՄԲ-ը';
  return null;
}
