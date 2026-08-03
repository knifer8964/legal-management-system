import { create } from 'zustand';
import { communicationService } from '../services/communicationService';
import { Communication, CreateCommunicationDto, UpdateCommunicationDto, CommunicationQueryParams } from '../types/api';

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface CommunicationState {
  communications: Communication[];
  loading: boolean;
  pagination: Pagination;
  fetchCommunications: (params?: CommunicationQueryParams) => Promise<void>;
  createCommunication: (data: CreateCommunicationDto) => Promise<Communication>;
  updateCommunication: (id: number, data: UpdateCommunicationDto) => Promise<Communication>;
  deleteCommunication: (id: number) => Promise<void>;
}

export const useCommunicationStore = create<CommunicationState>((set) => ({
  communications: [],
  loading: false,
  pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 },

  fetchCommunications: async (params = { page: 1, pageSize: 10 }) => {
    set({ loading: true });
    try {
      const result = await communicationService.list(params);
      set({
        communications: result.data,
        pagination: result.pagination,
        loading: false,
      });
    } finally {
      set({ loading: false });
    }
  },

  createCommunication: async (data) => {
    const item = await communicationService.create(data);
    set((state) => ({ communications: [item, ...state.communications] }));
    return item;
  },

  updateCommunication: async (id, data) => {
    const item = await communicationService.update(id, data);
    set((state) => ({
      communications: state.communications.map((c) => (c.id === id ? item : c)),
    }));
    return item;
  },

  deleteCommunication: async (id) => {
    await communicationService.remove(id);
    set((state) => ({
      communications: state.communications.filter((c) => c.id !== id),
    }));
  },
}));
