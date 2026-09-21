import type { UserRole, UserStatus } from '@/types/enums';

/** Mirrors backend AuthResponse. */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  userId: number;
  role: UserRole;
  fullName: string;
}

/** The subset of AuthResponse persisted client-side as the active session. */
export interface Session {
  accessToken: string;
  refreshToken: string;
  userId: number;
  role: UserRole;
  fullName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterCustomerRequest {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

export interface RegisterContractorRequest extends RegisterCustomerRequest {
  companyName: string;
  businessType?: string;
  city?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

/** Mirrors backend UserProfileResponse, returned by GET /auth/me. */
export interface UserProfileResponse {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl: string | null;
  notificationsEnabled: boolean;
  rating: number | null;
  ratingCount: number;
  createdAt: string;
}
