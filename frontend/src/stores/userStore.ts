import { create } from 'zustand';
import {
  getUsers, getUserById, createUser, updateUser, deleteUser, resetUserPassword, getRoles
} from '../services/userService';
import { User, Role } from '../types/api';

interface UserStore {
  users: User[];
  roles: Role[];
  loading: boolean;
  pagination: { total: number; page: number; pageSize: number; totalPages: number };

  fetchUsers: (params?: any) => Promise<void>;
  fetchRoles: () => Promise<void>;
  createUser: (data: any) => Promise<User>;
  updateUser: (id: number, data: any) => Promise<User>;
  deleteUser: (id: number) => Promise<void>;
  resetPassword: (id: number, newPassword: string) => Promise<void>;
}

export const useUserStore = create<UserStore>((set, get) => ({
  users: [],
  roles: [],
  loading: false,
  pagination: { total: 0, page: 1, pageSize: 10, totalPages: 0 },

  fetchUsers: async (params) => {
    set({ loading: true });
    try {
      const result = await getUsers(params);
      set({ users: result.data, pagination: result.pagination, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchRoles: async () => {
    try {
      const roles = await getRoles();
      set({ roles });
    } catch { /* ignore */ }
  },

  createUser: async (data) => {
    const user = await createUser(data);
    get().fetchUsers();
    return user;
  },

  updateUser: async (id, data) => {
    const user = await updateUser(id, data);
    get().fetchUsers();
    return user;
  },

  deleteUser: async (id) => {
    await deleteUser(id);
    get().fetchUsers();
  },

  resetPassword: async (id, newPassword) => {
    await resetUserPassword(id, newPassword);
  },
}));
