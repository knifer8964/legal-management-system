import httpService from './http';
import { LoginRequest, LoginResponse, User } from '../types/api';

class AuthService {
  public async login(data: LoginRequest): Promise<LoginResponse> {
    const result = await httpService.post<{ success: boolean; message?: string; data: LoginResponse }>('/auth/login', data);
    if (result.success) {
      const { token, user } = result.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      return result.data;
    }
    throw new Error(result.message || '登录失败');
  }

  public logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }

  public getToken(): string | null {
    return localStorage.getItem('token');
  }

  public getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }

  public isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

const authService = new AuthService();
export default authService;
