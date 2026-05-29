import request from '../utils/request';
import { DashboardStats, ContractStats, CaseStats } from '../types/api';

// 获取仪表盘统计数据
export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await request.get('/api/v1/dashboard/stats');
  return response.data;
}

// 获取合同统计详情
export async function getContractStats(): Promise<ContractStats> {
  const response = await request.get('/api/v1/dashboard/contracts/stats');
  return response.data;
}

// 获取案件统计详情
export async function getCaseStats(): Promise<CaseStats> {
  const response = await request.get('/api/v1/dashboard/cases/stats');
  return response.data;
}
