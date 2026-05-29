import request from '../utils/request';
import { ApiResponse, Contract, ContractListParams, PaginationParams, ApprovalRecord } from '../types/api';

// 合同列表
export const getContracts = async (params?: ContractListParams): Promise<ApiResponse<Contract[]>> => {
  const response = await request.get('/contracts', { params });
  return {
    success: true,
    data: response.data.data || [],
    pagination: response.data.pagination
  };
};

// 合同详情
export const getContractById = async (id: number): Promise<ApiResponse<Contract>> => {
  const response = await request.get(`/contracts/${id}`);
  return {
    success: true,
    data: response.data.data
  };
};

// 创建合同
export const createContract = async (data: Partial<Contract> & { approverIds?: number[] }): Promise<ApiResponse<Contract>> => {
  const response = await request.post('/contracts', data);
  return {
    success: true,
    data: response.data.data
  };
};

// 更新合同
export const updateContract = async (id: number, data: Partial<Contract>): Promise<ApiResponse<Contract>> => {
  const response = await request.put(`/contracts/${id}`, data);
  return {
    success: true,
    data: response.data.data
  };
};

// 删除合同
export const deleteContract = async (id: number): Promise<ApiResponse<void>> => {
  const response = await request.delete(`/contracts/${id}`);
  return {
    success: true,
    data: undefined
  };
};

// 提交审批
export const submitForApproval = async (id: number, approverIds: number[]): Promise<ApiResponse<void>> => {
  const response = await request.post(`/contracts/${id}/submit`, { approverIds });
  return {
    success: true,
    data: undefined
  };
};

// 审批操作（通过/拒绝）
export const approveContract = async (
  id: number,
  status: 'approved' | 'rejected',
  comment: string
): Promise<ApiResponse<ApprovalRecord>> => {
  const response = await request.post(`/contracts/${id}/approve`, { status, comment });
  return {
    success: true,
    data: response.data.data
  };
};

// 获取审批记录
export const getApprovalRecords = async (contractId: number): Promise<ApiResponse<ApprovalRecord[]>> => {
  const response = await request.get(`/contracts/${contractId}/approvals`);
  return {
    success: true,
    data: response.data.data || []
  };
};

// 获取审批人列表
export const getApprovers = async (): Promise<ApiResponse<any[]>> => {
  const response = await request.get('/contracts/approvers');
  return {
    success: true,
    data: response.data.data || []
  };
};

// 导出合同
export const exportContracts = async (params?: ContractListParams): Promise<Blob> => {
  const response = await request.get('/contracts/export', {
    params,
    responseType: 'blob'
  });
  return new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};

const contractService = {
  getContracts,
  getContractById,
  createContract,
  updateContract,
  deleteContract,
  submitForApproval,
  approveContract,
  getApprovalRecords,
  getApprovers,
  exportContracts
};

export default contractService;
