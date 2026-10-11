import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { rawRequest, StoreApiError, type RawRequestOptions } from '@/store/api/client';
import type { RegisterStoreRequest, StoreAuthResponse, StoreSession } from '@/store/types';

/** Separate from the public/admin session ('hayshen.auth') so the two logins never mix. */
const STORAGE_KEY = 'hayshen.store.auth';

/** Account roles allowed into the store portal (store membership is checked via /stores/profile). */
export const STORE_PORTAL_ROLES = ['CONSTRUCTION_MATERIAL_STORE', 'CONTRACTOR'];

export type StoreRequestOptions = Omit<RawRequestOptions, 'token'>;
export type StoreRequestFn = <T>(path: string, options?: StoreRequestOptions) => Promise<T>;

interface StoreAuthContextValue {
  session: StoreSession | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<StoreSession>;
  registerStore: (payload: RegisterStoreRequest) => Promise<StoreSession>;
  logout: () => void;
  request: StoreRequestFn;
}

const StoreAuthContext = createContext<StoreAuthContextValue | null>(null);

function readStoredSession(): StoreSession | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoreSession) : null;
  } catch {
    return null;
  }
}

function writeStoredSession(session: StoreSession | null) {
  try {
    if (session) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage unavailable - the session just won't persist across reloads.
  }
}

function toSession(res: StoreAuthResponse): StoreSession {
  return {
    accessToken: res.accessToken,
    refreshToken: res.refreshToken,
    userId: res.userId,
    role: res.role,
    fullName: res.fullName,
  };
}

export function StoreAuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<StoreSession | null>(readStoredSession);
  // The request function reads the latest session from a ref so concurrent queries share
  // one refresh (single-flight) and never use a stale token captured in a closure.
  const sessionRef = useRef<StoreSession | null>(session);
  const refreshPromise = useRef<Promise<StoreSession> | null>(null);

  const apply = useCallback((next: StoreSession | null) => {
    sessionRef.current = next;
    setSession(next);
    writeStoredSession(next);
  }, []);

  const logout = useCallback(() => {
    apply(null);
    queryClient.removeQueries({ queryKey: ['store'] });
  }, [apply, queryClient]);

  const refresh = useCallback((): Promise<StoreSession> => {
    if (!refreshPromise.current) {
      const current = sessionRef.current;
      if (!current?.refreshToken) return Promise.reject(new StoreApiError('Not authenticated', { status: 401 }));
      refreshPromise.current = rawRequest<StoreAuthResponse>('/auth/refresh', {
        method: 'POST',
        body: { refreshToken: current.refreshToken },
      })
        .then((res) => {
          const next = toSession(res);
          apply(next);
          return next;
        })
        .finally(() => {
          refreshPromise.current = null;
        });
    }
    return refreshPromise.current;
  }, [apply]);

  const request = useCallback<StoreRequestFn>(
    async <T,>(path: string, options: StoreRequestOptions = {}): Promise<T> => {
      const current = sessionRef.current;
      if (!current?.accessToken) {
        throw new StoreApiError('Մուտք գործեք համակարգ', { status: 401 });
      }
      try {
        return await rawRequest<T>(path, { ...options, token: current.accessToken });
      } catch (err) {
        if (!(err instanceof StoreApiError) || err.status !== 401) throw err;
        let next: StoreSession;
        try {
          next = await refresh();
        } catch {
          logout();
          throw new StoreApiError('Նիստի ժամկետն ավարտվել է։ Մուտք գործեք կրկին։', { status: 401 });
        }
        return rawRequest<T>(path, { ...options, token: next.accessToken });
      }
    },
    [refresh, logout]
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await rawRequest<StoreAuthResponse>('/auth/login', { method: 'POST', body: { email, password } });
      if (!STORE_PORTAL_ROLES.includes(res.role)) {
        throw new StoreApiError(
          'Այս հաշիվը շինանյութի խանութի հաշիվ չէ։ Խանութի վահանակ կարող են մուտք գործել միայն խանութի աշխատակիցները և խանութ ունեցող շինարարական ընկերությունները։',
          { status: 403, code: 'NOT_A_STORE_ACCOUNT' }
        );
      }
      queryClient.removeQueries({ queryKey: ['store'] });
      const next = toSession(res);
      apply(next);
      return next;
    },
    [apply, queryClient]
  );

  const registerStore = useCallback(
    async (payload: RegisterStoreRequest) => {
      const res = await rawRequest<StoreAuthResponse>('/auth/register/store', { method: 'POST', body: payload });
      queryClient.removeQueries({ queryKey: ['store'] });
      const next = toSession(res);
      apply(next);
      return next;
    },
    [apply, queryClient]
  );

  const value = useMemo<StoreAuthContextValue>(
    () => ({ session, isAuthenticated: Boolean(session?.accessToken), login, registerStore, logout, request }),
    [session, login, registerStore, logout, request]
  );

  return <StoreAuthContext.Provider value={value}>{children}</StoreAuthContext.Provider>;
}

export function useStoreAuth() {
  const ctx = useContext(StoreAuthContext);
  if (!ctx) throw new Error('useStoreAuth must be used within a StoreAuthProvider');
  return ctx;
}
