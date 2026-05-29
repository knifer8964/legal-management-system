import httpService from './http';
import { Contract, ContractListParams, PaginatedResponse, ApproveRequest } from '../types/api';

class ContractService {
  public async getContracts(params: ContractListParams): Promise<PaginatedResponse<Contract>> {
    const response = await httpService.get<Contract[]>('/contracts', {
      page: params.page,
      pageSize: params.pageSize,
      keyword: params.keyword,
      status: params.status,
    });
    if (response.data.success) {
      return {
        items: response.data.data,
        total: response.data.pagination?.total ?? 0,
        page: response.data.pagination?.page ?? params.page,
        pageSize: response.data.pagination?.limit ?? params.pageSize,
      };
    }
    throw new Error(response.data.message || '获取合同列表失败');
  }

  public async getContractById(id: string): Promise<Contract> {
    const response = await httpService.get<Contract>(`/contracts/${id}`);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || '获取合同详情失败');
  }

  public async createContract(data: Partial<Contract>): Promise<Contract> {
    const response = await httpService.post<Contract>('/contracts', data);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || '创建合同失败');
  }

  public async updateContract(id: string, data: Partial<Contract>): Promise<Contract> {
    const response = await httpService.put<Contract>(`/contracts/${id}`, data);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || '更新合同失败');
  }

  public async submitContract(id: string, approverIds: number[]): Promise<void> {
    const response = await httpService.post(`/contracts/${id}/submit`, { approverIds });
    if (!response.data.success) {
      throw new Error(response.data.message || '提交审批失败');
    }
  }

  public async approveContract(id: string, data: ApproveRequest): Promise<void> {
    const response = await httpService.post(`/contracts/${id}/approve`, data);
    if (!response.data.success) {
      throw new Error(response.data.message || '审批失败');
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

  public async getApprovers(): Promise<any[]> {
    const response = await httpService.get<any[]>('/contracts/approvers');
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error('获取审批人列表失败');
  }
}

const contractService = new ContractService();
export default contractService;
