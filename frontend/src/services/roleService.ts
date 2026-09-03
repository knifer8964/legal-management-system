import http from './http';
import { Role, User, PaginatedResponse, ApiResponse } from '../types/api';

// 获取角色列表（分页）
export async function getRoles(params?: {
  page?: number;
  pageSize?: number;
  keyword?: string;
}): Promise<PaginatedResponse<Role>> {
  const resp = await http.get<ApiResponse<Role[]>>('/roles', params);
  return {
    data: resp.data || [],
    pagination: resp.pagination || { total: 0, page: 1, pageSize: 20, totalPages: 0 },
  };
}

// 获取角色详情
export async function getRoleById(id: number): Promise<Role> {
  const resp = await http.get<ApiResponse<Role>>(`/roles/${id}`);
  return resp.data as Role;
}

// 创建角色
export async function createRole(data: {
  roleName: string;
  description?: string;
  permissions?: any;
}): Promise<Role> {
  const resp = await http.post<ApiResponse<Role>>('/roles', data);
  return resp.data as Role;
}

// 更新角色
export async function updateRole(id: number, data: {
  roleName?: string;
  description?: string;
  permissions?: any;
}): Promise<Role> {
  const resp = await http.put<ApiResponse<Role>>(`/roles/${id}`, data);
  return resp.data as Role;
}

// 删除角色
export async function deleteRole(id: number): Promise<void> {
  await http.delete(`/roles/${id}`);
}

// 获取角色下的用户列表
export async function getRoleUsers(id: number): Promise<User[]> {
  const resp = await http.get<ApiResponse<User[]>>(`/roles/${id}/users`);
  return resp.data as User[];
}
