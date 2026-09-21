/** Mirrors backend ApiResponse<T> — the uniform envelope every endpoint returns. */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string | null;
}

/** Mirrors backend PageResponse<T> — the flattened pagination envelope. */
export interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}
