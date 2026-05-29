import { create } from 'zustand';
import { User } from '../types/api';
import authService from '../services/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
}

const useAuthStore = create<AuthState>((set) => ({
  user: authService.getCurrentUser(),
  token: authService.getToken(),
  isAuthenticated: authService.isAuthenticated(),

  login: async (username: string, password: string) => {
    try {
      const data = await authService.login({ username, password });
      set({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
      });
    } catch (error) {
      throw error;
    }
  },

  logout: () => {
    authService.logout();
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },

  checkAuth: () => {
    const user = authService.getCurrentUser();
    const token = authService.getToken();
    set({
      user,
      token,
      isAuthenticated: !!token,
    });
  },
}));

export default useAuthStore;
