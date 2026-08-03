import { create } from 'zustand';
import { communicationService } from '../services/communicationService';
import { Communication, CommunicationFormData } from '../types/api';

interface CommunicationState {
  communications: Communication[];
  total: number;
  loading: boolean;
  fetchCommunications: (params?: { page?: number; pageSize?: number; matterId?: number; clientId?: number }) => Promise<void>;
  create: (data: CommunicationFormData) => Promise<Communication>;
  remove: (id: number) => Promise<void>;
}

export const useCommunicationStore = create<CommunicationState>((set, get) => ({
  communications: [],
  total: 0,
  loading: false,

  fetchCommunications: async (params) => {
    set({ loading: true });
    try {
      const res = await communicationService.list(params);
      set({ communications: res.data.items, total: res.data.total, loading: false });
    } catch { set({ loading: false }); }
  },

  create: async (data) => {
    const res = await communicationService.create(data);
    get().fetchCommunications({ page: 1, pageSize: 20 });
    return res.data;
  },

  remove: async (id) => {
    await communicationService.remove(id);
    set((s) => ({ communications: s.communications.filter((c) => c.id !== id) }));
  },
}));
