import http from './http';
import { User, Role, PaginationParams, PaginatedResponse, ApiResponse } from '../types/api';

// 获取用户列表
export async function getUsers(params?: PaginationParams & {
  roleId?: number;
  status?: string;
  keyword?: string;
}): Promise<PaginatedResponse<User>> {
  const resp = await http.get<ApiResponse<User[]>>('/users', params);
  // 后端返回 { success, data, pagination } — http.get 返回 response.data 即整个 body
  return {
    data: resp.data || [],
    pagination: resp.pagination || { total: 0, page: 1, pageSize: 20, totalPages: 0 }
  };
}

// 获取单个用户详情
export async function getUserById(id: number): Promise<User> {
  const resp = await http.get<ApiResponse<User>>(`/users/${id}`);
  return resp.data as User;
}

// 创建用户
export async function createUser(data: {
  username: string;
  password: string;
  realName: string;
  email?: string;
  phone?: string;
  roleId: number;
  department?: string;
  status?: string;
}): Promise<User> {
  const resp = await http.post<ApiResponse<User>>('/users', data);
  return resp.data as User;
}

// 更新用户
export async function updateUser(id: number, data: {
  realName?: string;
  email?: string;
  phone?: string;
  roleId?: number;
  department?: string;
  status?: string;
}): Promise<User> {
  const resp = await http.put<ApiResponse<User>>(`/users/${id}`, data);
  return resp.data as User;
}

// 删除/停用用户
export async function deleteUser(id: number): Promise<void> {
  await http.delete(`/users/${id}`);
}

// 重置用户密码
export async function resetUserPassword(id: number, newPassword: string): Promise<void> {
  await http.post(`/users/${id}/reset-password`, { newPassword });
}

// 获取角色列表
export async function getRoles(): Promise<Role[]> {
  const resp = await http.get<ApiResponse<Role[]>>('/users/roles');
  return resp.data as Role[];
}
