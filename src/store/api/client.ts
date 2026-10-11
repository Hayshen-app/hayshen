const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api/v1';

/**
 * Error from the store API. `code` is the backend's business-rule code (`data.code`, e.g.
 * STORE_NOT_VERIFIED); `fieldErrors` holds bean-validation messages keyed by field.
 */
export class StoreApiError extends Error {
  status: number;
  code: string | null;
  fieldErrors: Record<string, string> | null;

  constructor(
    message: string,
    { status = 0, code = null, fieldErrors = null }: { status?: number; code?: string | null; fieldErrors?: Record<string, string> | null } = {}
  ) {
    super(message);
    this.name = 'StoreApiError';
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

export type QueryValue = string | number | boolean | null | undefined | Array<string | number>;

/** Builds `?a=1&b=2`; arrays repeat the key (Spring binds them to a Set). Empty values are skipped. */
export function buildQuery(params: Record<string, QueryValue> = {}): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((v) => search.append(key, String(v)));
    } else if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  });
  const query = search.toString();
  return query ? `?${query}` : '';
}

export interface RawRequestOptions {
  method?: string;
  body?: unknown;
  token?: string;
  headers?: Record<string, string>;
}

interface Envelope<T> {
  success: boolean;
  data: T;
  message: string | null;
}

export async function rawRequest<T>(path: string, { method = 'GET', body, token, headers = {} }: RawRequestOptions = {}): Promise<T> {
  const allHeaders: Record<string, string> = { Accept: 'application/json', ...headers };
  if (body !== undefined) allHeaders['Content-Type'] = 'application/json';
  if (token) allHeaders.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: allHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new StoreApiError('Չհաջողվեց կապվել սերվերի հետ։ Ստուգեք ինտերնետ կապը։', { status: 0 });
  }

  let envelope: Envelope<T> | null = null;
  try {
    envelope = (await response.json()) as Envelope<T>;
  } catch {
    // No JSON body (e.g. 204) - fall through.
  }

  if (!response.ok || envelope?.success === false) {
    const data = envelope?.data as unknown;
    let code: string | null = null;
    let fieldErrors: Record<string, string> | null = null;
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const record = data as Record<string, unknown>;
      if (typeof record.code === 'string' && Object.keys(record).length === 1) {
        code = record.code;
      } else {
        fieldErrors = Object.fromEntries(
          Object.entries(record).filter(([, v]) => typeof v === 'string') as [string, string][]
        );
      }
    }
    throw new StoreApiError(envelope?.message || `Հարցումը ձախողվեց (${response.status})`, {
      status: response.status,
      code,
      fieldErrors,
    });
  }

  return envelope?.data as T;
}

/** PUTs the file bytes to a presigned URL (no auth header, Content-Type must match the presign). */
export async function putToPresignedUrl(uploadUrl: string, file: File, contentType: string): Promise<void> {
  let response: Response;
  try {
    response = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': contentType }, body: file });
  } catch {
    throw new StoreApiError('Չհաջողվեց վերբեռնել ֆայլը։ Ստուգեք ինտերնետ կապը։');
  }
  if (!response.ok) {
    throw new StoreApiError(`Ֆայլի վերբեռնումը ձախողվեց (${response.status})`, { status: response.status });
  }
}

export function newIdempotencyKey(): string {
  const c = typeof window !== 'undefined' ? window.crypto : undefined;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}
