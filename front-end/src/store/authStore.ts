import { create } from 'zustand';
import { User } from '@/types/user';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  initializeFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  setTokens: (accessToken, refreshToken) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    // Set session cookie for middleware (no sensitive data, just presence flag)
    document.cookie = 'luxe_session=1; path=/; SameSite=Lax; max-age=604800';
  }
  set({ accessToken, refreshToken, isAuthenticated: true });
},

  logout: () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    // Clear session cookie
    document.cookie = 'luxe_session=; path=/; max-age=0';
  }
  set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
},

  initializeFromStorage: () => {
    if (typeof window !== 'undefined') {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      if (accessToken) {
        set({
          accessToken,
          refreshToken,
          user,
          isAuthenticated: true,
        });
      }
    }
  },
}));
