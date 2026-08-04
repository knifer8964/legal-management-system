import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

class HttpService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: 'http://127.0.0.1:3000/api/v1',
      timeout: 10000,
    });

    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error.response?.status;
        if (status === 401 || status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          // 返回一个永远 pending 的 Promise，避免未处理的 rejection 继续抛到组件/ErrorBoundary
          return new Promise(() => {});
        }
        if (status === 429) {
          // 提示请求过于频繁，不抛到 ErrorBoundary
          const msg = error.response?.data?.message || '请求过于频繁，请稍后再试';
          if (typeof window !== 'undefined') {
            // eslint-disable-next-line no-alert
            window.alert(msg);
          }
          return new Promise(() => {});
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T = any>(url: string, params?: Record<string, any>, config?: AxiosRequestConfig) {
    const response = await this.client.get<T>(url, { ...config, params });
    return response.data;
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig) {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

const httpService = new HttpService();
export default httpService;
