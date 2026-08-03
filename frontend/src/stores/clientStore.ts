import { create } from 'zustand';
import { clientService } from '../services/clientService';
import { Client, ClientFormData } from '../types/api';

interface ClientState {
  clients: Client[];
  total: number;
  loading: boolean;
  error: string | null;
  current: Client | null;
  fetchClients: (params?: { page?: number; pageSize?: number; keyword?: string }) => Promise<void>;
  fetchById: (id: number) => Promise<void>;
  create: (data: ClientFormData) => Promise<Client>;
  update: (id: number, data: Partial<ClientFormData>) => Promise<Client>;
  remove: (id: number) => Promise<void>;
  clearCurrent: () => void;
}

export const useClientStore = create<ClientState>((set, get) => ({
  clients: [],
  total: 0,
  loading: false,
  error: null,
  current: null,

  fetchClients: async (params) => {
    set({ loading: true, error: null });
    try {
      const res = await clientService.list(params);
      set({ clients: res.data.items, total: res.data.total, loading: false });
    } catch (e: any) {
      set({ error: e.response?.data?.error?.message || '加载客户列表失败', loading: false });
    }
  },

  fetchById: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await clientService.getById(id);
      set({ current: res.data, loading: false });
    } catch (e: any) {
      set({ error: e.response?.data?.error?.message || '加载客户详情失败', loading: false });
    }
  },

  create: async (data) => {
    const res = await clientService.create(data);
    get().fetchClients({ page: 1, pageSize: 20 });
    return res.data;
  },

  update: async (id, data) => {
    const res = await clientService.update(id, data);
    set({ current: res.data });
    get().fetchClients({ page: 1, pageSize: 20 });
    return res.data;
  },

  remove: async (id) => {
    await clientService.remove(id);
    set({ current: null });
    get().fetchClients({ page: 1, pageSize: 20 });
  },

  clearCurrent: () => set({ current: null }),
}));
