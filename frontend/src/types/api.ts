// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
}

// 用户类型
export interface User {
  id: string;
  username: string;
  name: string;
  role: string;
  avatar?: string;
}

// 登录请求
export interface LoginRequest {
  username: string;
  password: string;
}

// 登录响应
export interface LoginResponse {
  token: string;
  user: User;
}

// 合同状态枚举
export enum ContractStatus {
  DRAFT = 'DRAFT',
  REVIEWING = 'REVIEWING',
  SIGNED = 'SIGNED',
  EXECUTING = 'EXECUTING',
  COMPLETED = 'COMPLETED',
  TERMINATED = 'TERMINATED'
}

// 合同类型
export interface Contract {
  id: string;
  contractNo: string;
  title: string;
  partyA: string;
  partyB: string;
  contractType: string;
  amount: number;
  signDate: string;
  effectiveDate: string;
  expiryDate: string;
  content: string;
  status: ContractStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// 合同列表查询参数
export interface ContractListParams {
  page: number;
  pageSize: number;
  keyword?: string;
  status?: ContractStatus;
}

// 分页响应
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// 审批请求
export interface ApproveRequest {
  status: 'APPROVED' | 'REJECTED';
  comment: string;
}

// 审批记录
export interface ApprovalRecord {
  id: string;
  contractId: string;
  approver: string;
  status: 'APPROVED' | 'REJECTED';
  comment: string;
  createdAt: string;
}
