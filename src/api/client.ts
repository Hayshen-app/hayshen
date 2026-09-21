import type { ApiResponse } from '@/types/api';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api/v1';

export type FieldErrors = Record<string, string>;

export class ApiError extends Error {
  status: number;
  fieldErrors: FieldErrors | null;

  constructor(message: string, { status, fieldErrors }: { status?: number; fieldErrors?: FieldErrors | null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status ?? 0;
    this.fieldErrors = fieldErrors || null;
  }
}

interface ApiRequestOptions {
  method?: string;
  body?: unknown;
  token?: string;
}

export async function apiRequest<T>(path: string, { method = 'GET', body, token }: ApiRequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Չհաջողվեց կապվել սերվերի հետ։ Ստուգեք ինտերնետ կապը։', { status: 0 });
  }

  let envelope: ApiResponse<T> | null = null;
  try {
    envelope = await response.json();
  } catch {
    // No JSON body (e.g. 204 No Content) — fall through.
  }

  if (!response.ok || envelope?.success === false) {
    const fieldErrors =
      envelope?.data && typeof envelope.data === 'object' ? (envelope.data as unknown as FieldErrors) : null;
    throw new ApiError(envelope?.message || `Հարցումը ձախողվեց (${response.status})`, {
      status: response.status,
      fieldErrors,
    });
  }

  return envelope?.data as T;
}
