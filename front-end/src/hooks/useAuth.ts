import { useAuthStore } from '@/store/authStore';
import { User } from '@/types/user';

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setUser = useAuthStore((state) => state.setUser);
  const setTokens = useAuthStore((state) => state.setTokens);
  const logout = useAuthStore((state) => state.logout);
  const initializeFromStorage = useAuthStore((state) => state.initializeFromStorage);

  const login = (accessToken: string, refreshToken: string, userData: User) => {
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
