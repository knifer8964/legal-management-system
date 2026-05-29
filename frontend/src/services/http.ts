import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiResponse } from '../types/api';

class HttpService {
  private instance: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = 'http://localhost:3000/api/v1';
    
    this.instance = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // 请求拦截器
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        return response;
      },
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  public get<T>(url: string, params?: any): Promise<AxiosResponse<ApiResponse<T>>> {
    return this.instance.get(url, { params });
  }

  public post<T>(url: string, data?: any): Promise<AxiosResponse<ApiResponse<T>>> {
    return this.instance.post(url, data);
  }

  public put<T>(url: string, data?: any): Promise<AxiosResponse<ApiResponse<T>>> {
    return this.instance.put(url, data);
  }

  public delete<T>(url: string, params?: any): Promise<AxiosResponse<ApiResponse<T>>> {
    return this.instance.delete(url, { params });
  }

  public upload<T>(url: string, formData: FormData): Promise<AxiosResponse<ApiResponse<T>>> {
    return this.instance.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
}

const httpService = new HttpService();
export default httpService;
