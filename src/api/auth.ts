import { apiRequest } from '@/api/client';
import type {
  AuthResponse,
  LoginRequest,
  RefreshTokenRequest,
  RegisterContractorRequest,
  RegisterCustomerRequest,
  UserProfileResponse,
} from '@/types/auth';

export function login({ email, password }: LoginRequest) {
  return apiRequest<AuthResponse>('/auth/login', { method: 'POST', body: { email, password } });
}

export function registerCustomer({ fullName, email, phone, password }: RegisterCustomerRequest) {
  return apiRequest<AuthResponse>('/auth/register/customer', {
    method: 'POST',
    body: { fullName, email, phone, password },
  });
}

export function registerContractor({
  fullName,
  email,
  phone,
  password,
  companyName,
  businessType,
  city,
}: RegisterContractorRequest) {
  return apiRequest<AuthResponse>('/auth/register/contractor', {
    method: 'POST',
    body: { fullName, email, phone, password, companyName, businessType, city },
  });
}

export function fetchMe(token: string) {
  return apiRequest<UserProfileResponse>('/auth/me', { token });
}

export function refreshToken({ refreshToken }: RefreshTokenRequest) {
  return apiRequest<AuthResponse>('/auth/refresh', { method: 'POST', body: { refreshToken } });
}
