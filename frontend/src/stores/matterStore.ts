import { create } from 'zustand';
import { matterService } from '../services/matterService';
import { Matter, MatterFormData } from '../types/api';

interface MatterState {
  matters: Matter[];
  total: number;
  loading: boolean;
  error: string | null;
  current: Matter | null;
  timeline: any[];
  fetchMatters: (params?: { page?: number; pageSize?: number; status?: string; clientId?: number }) => Promise<void>;
  fetchById: (id: number) => Promise<void>;
  fetchTimeline: (id: number) => Promise<void>;
  create: (data: MatterFormData) => Promise<Matter>;
  update: (id: number, data: Partial<MatterFormData>) => Promise<Matter>;
  updateStatus: (id: number, status: string) => Promise<Matter>;
  remove: (id: number) => Promise<void>;
  clearCurrent: () => void;
}

export const useMatterStore = create<MatterState>((set, get) => ({
  matters: [],
  total: 0,
  loading: false,
  error: null,
  current: null,
  timeline: [],

  fetchMatters: async (params) => {
    set({ loading: true, error: null });
    try {
      const res = await matterService.list(params);
      set({ matters: res.data.items, total: res.data.total, loading: false });
    } catch (e: any) {
      set({ error: e.response?.data?.error?.message || '加载业务列表失败', loading: false });
    }
  },

  fetchById: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await matterService.getById(id);
      set({ current: res.data, loading: false });
    } catch (e: any) {
      set({ error: e.response?.data?.error?.message || '加载业务详情失败', loading: false });
    }
  },

  fetchTimeline: async (id) => {
    try {
      const res = await matterService.timeline(id);
      set({ timeline: res.data });
    } catch { /* timeline 可选 */ }
  },

  create: async (data) => {
    const res = await matterService.create(data);
    get().fetchMatters({ page: 1, pageSize: 20 });
    return res.data;
  },

  update: async (id, data) => {
    const res = await matterService.update(id, data);
    set({ current: res.data });
    get().fetchMatters({ page: 1, pageSize: 20 });
    return res.data;
  },

  updateStatus: async (id, status) => {
    const res = await matterService.updateStatus(id, status);
    set({ current: res.data });
    get().fetchMatters({ page: 1, pageSize: 20 });
    return res.data;
  },

  remove: async (id) => {
    await matterService.remove(id);
    set({ current: null });
    get().fetchMatters({ page: 1, pageSize: 20 });
  },

  clearCurrent: () => set({ current: null, timeline: [] }),
}));
