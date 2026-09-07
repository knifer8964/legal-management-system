import httpService from './http';
import {
  Contract, CreateContractDto, UpdateContractDto, ContractQueryParams,
  ContractStatusUpdateDto, ContractTimelineEvent,
  ApiResponse, PaginatedResponse,
} from '../types/api';

class ContractService {
  async list(params?: ContractQueryParams) {
    const res = await httpService.get<ApiResponse<PaginatedResponse<Contract>>>('/contracts', params);
    return res.data!;
  }

  async getById(id: number) {
    const res = await httpService.get<ApiResponse<Contract>>(`/contracts/${id}`);
    return res.data!;
  }

  async create(data: CreateContractDto) {
    const res = await httpService.post<ApiResponse<Contract>>('/contracts', data);
    return res.data!;
  }

  async update(id: number, data: UpdateContractDto) {
    const res = await httpService.put<ApiResponse<Contract>>(`/contracts/${id}`, data);
    return res.data!;
  }

  async remove(id: number) {
    const res = await httpService.delete<ApiResponse<null>>(`/contracts/${id}`);
    return res.data!;
  }

  async updateStatus(id: number, data: ContractStatusUpdateDto) {
    const res = await httpService.put<ApiResponse<Contract>>(`/contracts/${id}/status`, data);
    return res.data!;
  }

  async getTimeline(id: number) {
    const res = await httpService.get<ApiResponse<ContractTimelineEvent[]>>(`/contracts/${id}/timeline`);
    return res.data!;
  }

  async stats() {
    const res = await httpService.get<ApiResponse<{
      total: number;
      byStatus: Record<string, number>;
      byType: Record<string, number>;
      totalAmount: number;
    }>>('/contracts/stats');
    return res.data!;
  }
}

export const contractService = new ContractService();
