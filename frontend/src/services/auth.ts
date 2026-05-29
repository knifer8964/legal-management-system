import httpService from './http';
import { LoginRequest, LoginResponse, User } from '../types/api';

class AuthService {
  public async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await httpService.post<LoginResponse>('/auth/login', data);
    if (response.data.success) {
      const { token, user } = response.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      return response.data.data;
    }
    throw new Error(response.data.message || '登录失败');
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
      return JSON.parse(userStr);
    }
    return null;
  }

  public isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

const authService = new AuthService();
export default authService;
