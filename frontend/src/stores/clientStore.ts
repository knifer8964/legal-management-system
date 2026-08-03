import { create } from 'zustand';
import { clientService } from '../services/clientService';
import { Client, CreateClientDto, UpdateClientDto, ClientQueryParams } from '../types/api';

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface ClientState {
  clients: Client[];
  loading: boolean;
  pagination: Pagination;
  fetchClients: (params?: ClientQueryParams) => Promise<void>;
  createClient: (data: CreateClientDto) => Promise<Client>;
  updateClient: (id: number, data: UpdateClientDto) => Promise<Client>;
  deleteClient: (id: number) => Promise<void>;
}

export const useClientStore = create<ClientState>((set) => ({
  clients: [],
  loading: false,
  pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 },

  fetchClients: async (params = { page: 1, pageSize: 10 }) => {
    set({ loading: true });
    try {
      const result = await clientService.list(params);
      set({
        clients: result.data,
        pagination: result.pagination,
        loading: false,
      });
    } finally {
      set({ loading: false });
    }
  },

  createClient: async (data) => {
    const client = await clientService.create(data);
    set((state) => ({ clients: [client, ...state.clients] }));
    return client;
  },

  updateClient: async (id, data) => {
    const client = await clientService.update(id, data);
    set((state) => ({
      clients: state.clients.map((c) => (c.id === id ? client : c)),
    }));
    return client;
  },

  deleteClient: async (id) => {
    await clientService.remove(id);
    set((state) => ({
      clients: state.clients.filter((c) => c.id !== id),
    }));
  },
}));
