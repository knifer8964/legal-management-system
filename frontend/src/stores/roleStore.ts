import { create } from 'zustand';
import {
  getRoles, getRoleById, createRole, updateRole, deleteRole, getRoleUsers,
} from '../services/roleService';
import { Role, User } from '../types/api';

interface RoleStore {
  roles: Role[];
  loading: boolean;
  pagination: { total: number; page: number; pageSize: number; totalPages: number };

  fetchRoles: (params?: any) => Promise<void>;
  createRole: (data: any) => Promise<Role>;
  updateRole: (id: number, data: any) => Promise<Role>;
  deleteRole: (id: number) => Promise<void>;
  fetchRoleUsers: (id: number) => Promise<User[]>;
}

export const useRoleStore = create<RoleStore>((set, get) => ({
  roles: [],
  loading: false,
  pagination: { total: 0, page: 1, pageSize: 10, totalPages: 0 },

  fetchRoles: async (params) => {
    set({ loading: true });
    try {
      const result = await getRoles(params);
      set({ roles: result.data, pagination: result.pagination, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  createRole: async (data) => {
    const role = await createRole(data);
    get().fetchRoles({ page: get().pagination.page, pageSize: get().pagination.pageSize });
    return role;
  },

  updateRole: async (id, data) => {
    const role = await updateRole(id, data);
    get().fetchRoles({ page: get().pagination.page, pageSize: get().pagination.pageSize });
    return role;
  },

  deleteRole: async (id) => {
    await deleteRole(id);
    get().fetchRoles({ page: get().pagination.page, pageSize: get().pagination.pageSize });
  },

  fetchRoleUsers: async (id) => {
    return getRoleUsers(id);
  },
}));
