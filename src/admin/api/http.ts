import { useCallback } from 'react';
import { apiRequest, ApiError } from '@/api/client';
import * as authApi from '@/api/auth';
import { useAuth } from '@/context/AuthContext';

interface RequestOptions {
  method?: string;
  body?: unknown;
}

/**
 * Admin API calls share the customer/contractor login session (same JWT), just
 * gated by role. This hook adds a one-time refresh-and-retry on 401 so an
 * expired access token doesn't force a re-login while the refresh token is
 * still valid.
 */
export function useAuthorizedRequest() {
  const { session, applySession, logout } = useAuth();

  return useCallback(
    async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
      if (!session?.accessToken) {
        throw new ApiError('Not authenticated', { status: 401 });
      }

      try {
        return await apiRequest<T>(path, { ...options, token: session.accessToken });
      } catch (err) {
        const isAuthError = err instanceof ApiError && err.status === 401;
        if (!isAuthError || !session.refreshToken) {
          throw err;
        }

        try {
          const refreshed = await authApi.refreshToken({ refreshToken: session.refreshToken });
          applySession(refreshed);
          return await apiRequest<T>(path, { ...options, token: refreshed.accessToken });
        } catch {
          logout();
          throw err;
        }
      }
    },
    [session, applySession, logout]
  );
}

export function buildQuery(params: Record<string, string | number | boolean | undefined | null> = {}): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  });
  const query = search.toString();
  return query ? `?${query}` : '';
}
