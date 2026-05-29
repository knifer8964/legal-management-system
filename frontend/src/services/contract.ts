import httpService from './http';
import { Contract, ContractListParams, PaginatedResponse, ApproveRequest } from '../types/api';

class ContractService {
  public async getContracts(params: ContractListParams): Promise<PaginatedResponse<Contract>> {
    const response = await httpService.get<Contract[]>('/contracts', params);
    if (response.data.success) {
      return {
        items: response.data.data,
        total: response.data.data.length,
        page: params.page,
        pageSize: params.pageSize,
      };
    }
    throw new Error('获取合同列表失败');
  }

  public async getContractById(id: string): Promise<Contract> {
    const response = await httpService.get<Contract>(`/contracts/${id}`);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error('获取合同详情失败');
  }

  public async createContract(data: Partial<Contract>): Promise<Contract> {
    const response = await httpService.post<Contract>('/contracts', data);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error('创建合同失败');
  }

  public async updateContract(id: string, data: Partial<Contract>): Promise<Contract> {
    const response = await httpService.put<Contract>(`/contracts/${id}`, data);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error('更新合同失败');
  }

  public async submitContract(id: string): Promise<void> {
    const response = await httpService.post(`/contracts/${id}/submit`);
    if (!response.data.success) {
      throw new Error('提交审批失败');
    }
  }

  public async approveContract(id: string, data: ApproveRequest): Promise<void> {
    const response = await httpService.post(`/contracts/${id}/approve`, data);
    if (!response.data.success) {
      throw new Error('审批失败');
    }
  }

  public async uploadAttachment(id: string, file: File): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await httpService.upload(`/contracts/${id}/upload`, formData);
    if (!response.data.success) {
      throw new Error('上传附件失败');
    }
  }
}

const contractService = new ContractService();
export default contractService;
