import { create } from 'zustand';
import { contractService } from '../services/contractService';
import {
  Contract, CreateContractDto, UpdateContractDto, ContractQueryParams,
  ContractStatusUpdateDto, ContractTimelineEvent,
} from '../types/api';

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface ContractState {
  contracts: Contract[];
  loading: boolean;
  pagination: Pagination;
  fetchContracts: (params?: ContractQueryParams) => Promise<void>;
  createContract: (data: CreateContractDto) => Promise<Contract>;
  updateContract: (id: number, data: UpdateContractDto) => Promise<Contract>;
  deleteContract: (id: number) => Promise<void>;
  updateStatus: (id: number, data: ContractStatusUpdateDto) => Promise<Contract>;
  fetchTimeline: (id: number) => Promise<ContractTimelineEvent[]>;
}

export const useContractStore = create<ContractState>((set) => ({
  contracts: [],
  loading: false,
  pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 },

  fetchContracts: async (params = { page: 1, pageSize: 10 }) => {
    set({ loading: true });
    try {
      const result = await contractService.list(params);
      set({
        contracts: result.data,
        pagination: result.pagination,
        loading: false,
      });
    } finally {
      set({ loading: false });
    }
  },

  createContract: async (data) => {
    const contract = await contractService.create(data);
    set((state) => ({ contracts: [contract, ...state.contracts] }));
    return contract;
  },

  updateContract: async (id, data) => {
    const contract = await contractService.update(id, data);
    set((state) => ({
      contracts: state.contracts.map((c) => (c.id === id ? contract : c)),
    }));
    return contract;
  },

  deleteContract: async (id) => {
    await contractService.remove(id);
    set((state) => ({
      contracts: state.contracts.filter((c) => c.id !== id),
    }));
  },

  updateStatus: async (id, data) => {
    const contract = await contractService.updateStatus(id, data);
    set((state) => ({
      contracts: state.contracts.map((c) => (c.id === id ? contract : c)),
    }));
    return contract;
  },

  fetchTimeline: async (id) => {
    return contractService.getTimeline(id);
  },
}));
