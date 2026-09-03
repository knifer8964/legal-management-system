import httpService from './http';
import {
  EnterpriseConfig, CreateEnterpriseConfigDto, UpdateEnterpriseConfigDto,
  EnterpriseMember, ApiResponse,
} from '../types/api';

class EnterpriseConfigService {
  async getByClient(clientId: number) {
    const res = await httpService.get<ApiResponse<EnterpriseConfig>>(`/clients/${clientId}/enterprise-config`);
    return res.data!;
  }

  async create(clientId: number, data: Omit<CreateEnterpriseConfigDto, 'clientId'>) {
    const res = await httpService.post<ApiResponse<EnterpriseConfig>>(
      `/clients/${clientId}/enterprise-config`,
      data,
    );
    return res.data!;
  }

  async update(id: number, data: UpdateEnterpriseConfigDto) {
    const res = await httpService.put<ApiResponse<EnterpriseConfig>>(`/enterprise-configs/${id}`, data);
    return res.data!;
  }

  async remove(id: number) {
    const res = await httpService.delete<ApiResponse<null>>(`/enterprise-configs/${id}`);
    return res.data!;
  }

  async getMembers(clientId: number) {
    const res = await httpService.get<ApiResponse<EnterpriseMember[]>>(
      `/clients/${clientId}/enterprise-config/members`,
    );
    return res.data!;
  }

  async addMember(clientId: number, member: EnterpriseMember) {
    const res = await httpService.post<ApiResponse<EnterpriseMember[]>>(
      `/clients/${clientId}/enterprise-config/members`,
      member,
    );
    return res.data!;
  }

  async removeMember(clientId: number, index: number) {
    const res = await httpService.delete<ApiResponse<EnterpriseMember[]>>(
      `/clients/${clientId}/enterprise-config/members/${index}`,
    );
    return res.data!;
  }
}

export const enterpriseConfigService = new EnterpriseConfigService();
