import { create } from 'zustand';
import { Contract, ContractListParams, ContractStatus } from '../types/api';
import contractService from '../services/contract';

interface ContractState {
  contracts: Contract[];
  currentContract: Contract | null;
  total: number;
  loading: boolean;
  error: string | null;
  
  fetchContracts: (params: ContractListParams) => Promise<void>;
  fetchContractById: (id: string) => Promise<void>;
  createContract: (data: Partial<Contract>) => Promise<Contract>;
  updateContract: (id: string, data: Partial<Contract>) => Promise<Contract>;
  submitContract: (id: string) => Promise<void>;
  approveContract: (id: string, status: 'APPROVED' | 'REJECTED', comment: string) => Promise<void>;
  clearCurrentContract: () => void;
  clearError: () => void;
}

const useContractStore = create<ContractState>((set, get) => ({
  contracts: [],
  currentContract: null,
  total: 0,
  loading: false,
  error: null,

  fetchContracts: async (params: ContractListParams) => {
    set({ loading: true, error: null });
    try {
      const result = await contractService.getContracts(params);
      set({
        contracts: result.items,
        total: result.total,
        loading: false,
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchContractById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const contract = await contractService.getContractById(id);
      set({ currentContract: contract, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createContract: async (data: Partial<Contract>) => {
    set({ loading: true, error: null });
    try {
      const contract = await contractService.createContract(data);
      set({ loading: false });
      return contract;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateContract: async (id: string, data: Partial<Contract>) => {
    set({ loading: true, error: null });
    try {
      const contract = await contractService.updateContract(id, data);
      set({ currentContract: contract, loading: false });
      return contract;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  submitContract: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await contractService.submitContract(id);
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  approveContract: async (id: string, status: 'APPROVED' | 'REJECTED', comment: string) => {
    set({ loading: true, error: null });
    try {
      await contractService.approveContract(id, { status, comment });
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  clearCurrentContract: () => {
    set({ currentContract: null });
  },

  clearError: () => {
    set({ error: null });
  },
}));

export default useContractStore;
