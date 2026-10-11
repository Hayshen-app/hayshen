import { ApiError } from '@/api/client';

/**
 * The API's own `message` for a failed admin call (business-rule 400/409s carry a readable
 * text), plus any per-field validation messages, falling back to a generic text.
 */
export function apiErrorMessage(err: unknown, fallback: string): string {
  if (!(err instanceof ApiError)) return fallback;
  const fields = err.fieldErrors
    ? Object.entries(err.fieldErrors as Record<string, unknown>)
        .filter(([key, value]) => key !== 'code' && typeof value === 'string')
        .map(([key, value]) => `${key}: ${value as string}`)
    : [];
  const message = err.message || fallback;
  return fields.length ? `${message} (${fields.join('; ')})` : message;
}
