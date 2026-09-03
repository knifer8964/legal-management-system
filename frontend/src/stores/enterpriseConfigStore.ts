import { create } from 'zustand';
import { enterpriseConfigService } from '../services/enterpriseConfigService';
import {
  EnterpriseConfig, CreateEnterpriseConfigDto, UpdateEnterpriseConfigDto, EnterpriseMember,
} from '../types/api';

interface EnterpriseConfigState {
  config: EnterpriseConfig | null;
  members: EnterpriseMember[];
  loading: boolean;
  fetchByClient: (clientId: number) => Promise<EnterpriseConfig | null>;
  createConfig: (clientId: number, data: Omit<CreateEnterpriseConfigDto, 'clientId'>) => Promise<EnterpriseConfig>;
  updateConfig: (id: number, data: UpdateEnterpriseConfigDto) => Promise<EnterpriseConfig>;
  deleteConfig: (id: number) => Promise<void>;
  fetchMembers: (clientId: number) => Promise<EnterpriseMember[]>;
  addMember: (clientId: number, member: EnterpriseMember) => Promise<EnterpriseMember[]>;
  removeMember: (clientId: number, index: number) => Promise<EnterpriseMember[]>;
}

export const useEnterpriseConfigStore = create<EnterpriseConfigState>((set) => ({
  config: null,
  members: [],
  loading: false,

  fetchByClient: async (clientId) => {
    set({ loading: true });
    try {
      const config = await enterpriseConfigService.getByClient(clientId);
      set({ config, members: config.members || [], loading: false });
      return config;
    } catch (e: any) {
      if (e.response?.status === 404) {
        set({ config: null, members: [], loading: false });
        return null;
      }
      set({ loading: false });
      throw e;
    }
  },

  createConfig: async (clientId, data) => {
    const config = await enterpriseConfigService.create(clientId, data);
    set({ config, members: config.members || [] });
    return config;
  },

  updateConfig: async (id, data) => {
    const config = await enterpriseConfigService.update(id, data);
    set({ config, members: config.members || [] });
    return config;
  },

  deleteConfig: async (id) => {
    await enterpriseConfigService.remove(id);
    set({ config: null, members: [] });
  },

  fetchMembers: async (clientId) => {
    const members = await enterpriseConfigService.getMembers(clientId);
    set({ members });
    return members;
  },

  addMember: async (clientId, member) => {
    const members = await enterpriseConfigService.addMember(clientId, member);
    set({ members });
    return members;
  },

  removeMember: async (clientId, index) => {
    const members = await enterpriseConfigService.removeMember(clientId, index);
    set({ members });
    return members;
  },
}));
