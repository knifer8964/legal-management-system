// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

// 用户类型
export interface User {
  id: number;
  username: string;
  name: string;
  role: string;
  permissions?: string[];
  avatar?: string;
  email?: string;
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
  id: number;
  contractNo: string;
  title: string;
  partyA: string;
  partyB: string;
  contractType: string;
  amount: number | null;
  signDate: string | null;
  effectiveDate: string | null;
  expiryDate: string | null;
  content: string | null;
  status: ContractStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  creator?: {
    id: number;
    realName: string;
    username: string;
  };
  approvals?: ApprovalRecord[];
}

// 通用分页参数
export interface PaginationParams {
  page: number;
  pageSize: number;
  keyword?: string;
}

// 合同列表查询参数
export interface ContractListParams extends PaginationParams {
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
  comment?: string;
}

// 仪表盘统计
export interface DashboardStats {
  totalContracts: number;
  activeContracts: number;
  pendingApprovals: number;
  totalUsers: number;
  recentContracts: Contract[];
}

export interface ContractStats {
  total: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  monthlyTrend: { month: string; count: number }[];
}

export interface CaseStats {
  total: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
}

// 用户状态枚举
export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED'
}

// 角色类型
export interface Role {
  id: number;
  name: string;
  code: string;
  description?: string;
}

// 审批记录
export interface ApprovalRecord {
  id: number;
  contractId: number;
  approverId: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  comment?: string;
  approvedAt?: string;
  approver?: {
    id: number;
    realName: string;
    email?: string;
  };
}
