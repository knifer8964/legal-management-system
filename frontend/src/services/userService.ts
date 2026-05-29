import request from '../utils/request';
import { User, Role, PaginationParams, PaginatedResponse } from '../types/api';

// 获取用户列表
export async function getUsers(params?: PaginationParams & {
  roleId?: number;
  status?: string;
  keyword?: string;
}): Promise<PaginatedResponse<User>> {
  const response = await request.get('/api/v1/users', { params });
  return response.data;
}

// 获取单个用户详情
export async function getUserById(id: number): Promise<User> {
  const response = await request.get(`/api/v1/users/${id}`);
  return response.data;
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
  const response = await request.post('/api/v1/users', data);
  return response.data;
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
  const response = await request.put(`/api/v1/users/${id}`, data);
  return response.data;
}

// 删除/停用用户
export async function deleteUser(id: number): Promise<void> {
  await request.delete(`/api/v1/users/${id}`);
}

// 重置用户密码
export async function resetUserPassword(id: number, newPassword: string): Promise<void> {
  await request.post(`/api/v1/users/${id}/reset-password`, { newPassword });
}

// 获取角色列表
export async function getRoles(): Promise<Role[]> {
  const response = await request.get('/api/v1/users/roles');
  return response.data;
}
