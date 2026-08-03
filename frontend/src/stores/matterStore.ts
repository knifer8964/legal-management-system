import { create } from 'zustand';
import { matterService } from '../services/matterService';
import { Matter, CreateMatterDto, UpdateMatterDto, MatterQueryParams } from '../types/api';

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface MatterState {
  matters: Matter[];
  loading: boolean;
  pagination: Pagination;
  fetchMatters: (params?: MatterQueryParams) => Promise<void>;
  createMatter: (data: CreateMatterDto) => Promise<Matter>;
  updateMatter: (id: number, data: UpdateMatterDto) => Promise<Matter>;
  deleteMatter: (id: number) => Promise<void>;
}

export const useMatterStore = create<MatterState>((set) => ({
  matters: [],
  loading: false,
  pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 },

  fetchMatters: async (params = { page: 1, pageSize: 10 }) => {
    set({ loading: true });
    try {
      const result = await matterService.list(params);
      set({
        matters: result.data,
        pagination: result.pagination,
        loading: false,
      });
    } finally {
      set({ loading: false });
    }
  },

  createMatter: async (data) => {
    const matter = await matterService.create(data);
    set((state) => ({ matters: [matter, ...state.matters] }));
    return matter;
  },

  updateMatter: async (id, data) => {
    const matter = await matterService.update(id, data);
    set((state) => ({
      matters: state.matters.map((m) => (m.id === id ? matter : m)),
    }));
    return matter;
  },

  deleteMatter: async (id) => {
    await matterService.remove(id);
    set((state) => ({
      matters: state.matters.filter((m) => m.id !== id),
    }));
  },
}));
