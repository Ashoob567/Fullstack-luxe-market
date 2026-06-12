// front-end/src/hooks/useAuth.ts
import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { User } from '@/types';

// Transform raw API response (snake_case) to our User type
// Backend field names already match our updated User type,
// so this just ensures the shape is correct
function normalizeUser(raw: Record<string, unknown>): User {
  return {
    id: String(raw.id ?? ''),
    email: String(raw.email ?? ''),
    first_name: String(raw.first_name ?? ''),
    last_name: String(raw.last_name ?? ''),
    phone: raw.phone ? String(raw.phone) : null,
    is_active: Boolean(raw.is_active ?? true),
    is_verified: Boolean(raw.is_verified ?? false),
    created_at: String(raw.created_at ?? ''),
    updated_at: String(raw.updated_at ?? ''),
  };
}

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setUser = useAuthStore((state) => state.setUser);
  const setTokens = useAuthStore((state) => state.setTokens);
  const logout = useAuthStore((state) => state.logout);
  const initializeFromStorage = useAuthStore((state) => state.initializeFromStorage);

  const login = (
    accessToken: string,
    refreshToken: string,
    rawUserData: Record<string, unknown>
  ) => {
    const userData = normalizeUser(rawUserData);
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(userData));
    }
    setTokens(accessToken, refreshToken);
    setUser(userData);
  };

  return {
    user,
    isAuthenticated,
    login,
    logout,
    initializeFromStorage,
  };
}