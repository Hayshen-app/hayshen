import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import * as authApi from '@/api/auth';
import type { AuthResponse, LoginRequest, RegisterContractorRequest, RegisterCustomerRequest, Session } from '@/types/auth';

const STORAGE_KEY = 'hayshen.auth';

interface AuthContextValue {
  session: Session | null;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<Session>;
  registerCustomer: (payload: RegisterCustomerRequest) => Promise<Session>;
  registerContractor: (payload: RegisterContractorRequest) => Promise<Session>;
  logout: () => void;
  applySession: (authResponse: AuthResponse) => Session;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredSession(): Session | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

function writeStoredSession(session: Session | null) {
  try {
    if (session) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // localStorage unavailable (private mode, etc.) — session just won't persist.
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(readStoredSession);

  const applyAuthResponse = useCallback((authResponse: AuthResponse): Session => {
    const next: Session = {
      accessToken: authResponse.accessToken,
      refreshToken: authResponse.refreshToken,
      userId: authResponse.userId,
      role: authResponse.role,
      fullName: authResponse.fullName,
    };
    setSession(next);
    writeStoredSession(next);
    return next;
  }, []);

  const login = useCallback(
    (credentials: LoginRequest) => authApi.login(credentials).then(applyAuthResponse),
    [applyAuthResponse]
  );

  const registerCustomer = useCallback(
    (payload: RegisterCustomerRequest) => authApi.registerCustomer(payload).then(applyAuthResponse),
    [applyAuthResponse]
  );

  const registerContractor = useCallback(
    (payload: RegisterContractorRequest) => authApi.registerContractor(payload).then(applyAuthResponse),
    [applyAuthResponse]
  );

  const logout = useCallback(() => {
    setSession(null);
    writeStoredSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: Boolean(session?.accessToken),
      login,
      registerCustomer,
      registerContractor,
      logout,
      applySession: applyAuthResponse,
    }),
    [session, login, registerCustomer, registerContractor, logout, applyAuthResponse]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
