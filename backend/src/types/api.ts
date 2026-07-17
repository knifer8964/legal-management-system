// =====================================================
// 个人法务工作室管理系统 - API 类型定义
// =====================================================

import {
  ClientType,
  ClientStatus,
  MatterType,
  MatterStatus,
  FeeType,
  Priority,
  TaskStatus,
  InvoiceStatus,
  CommChannel,
  Direction,
  UserStatus,
} from '@prisma/client';

// =====================================================
// 通用类型
// =====================================================

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
}

// =====================================================
// 用户相关类型
// =====================================================

export interface User {
  id: number;
  username: string;
  realName: string;
  email: string | null;
  phone: string | null;
  roleId: number;
  department: string | null;
  status: UserStatus;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  role?: Role;
}

export interface Role {
  id: number;
  roleName: string;
  description: string | null;
  permissions: any;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// =====================================================
// 客户相关类型 (核心新增)
// =====================================================

export interface Client {
  id: number;
  clientType: ClientType;
  name: string;
  shortName: string | null;

  // 联系信息
  phone: string | null;
  email: string | null;
  wechatId: string | null;
  qq: string | null;
  address: string | null;

  // 个人客户特有
  gender: string | null;
  idNumber: string | null;
  birthDate: string | null;

  // 企业客户特有
  creditCode: string | null;
  legalRep: string | null;
  industry: string | null;
  scale: string | null;
  website: string | null;

  // 企业对接人信息
  contactName: string | null;
  contactTitle: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  contactWechat: string | null;

  // 服务配置
  servicePlan: string | null;
  monthlyFee: number | null;
  serviceStart: string | null;
  serviceEnd: string | null;

  // 标签与备注
  tags: string[] | null;
  notes: string | null;
  source: string | null;

  // 统计信息
  totalMatters: number;
  totalAmount: number;
  lastContactAt: string | null;

  status: ClientStatus;
  createdAt: string;
  updatedAt: string;

  // 关联数据
  matters?: Matter[];
  enterpriseConfig?: EnterpriseConfig;
}

export interface CreateClientDto {
  clientType: ClientType;
  name: string;
  shortName?: string;

  // 联系信息
  phone?: string;
  email?: string;
  wechatId?: string;
  qq?: string;
  address?: string;

  // 个人客户特有
  gender?: string;
  idNumber?: string;
  birthDate?: string;

  // 企业客户特有
  creditCode?: string;
  legalRep?: string;
  industry?: string;
  scale?: string;
  website?: string;

  // 企业对接人信息
  contactName?: string;
  contactTitle?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactWechat?: string;

  // 服务配置
  servicePlan?: string;
  monthlyFee?: number;
  serviceStart?: string;
  serviceEnd?: string;

  // 标签与备注
  tags?: string[];
  notes?: string;
  source?: string;
}

export interface UpdateClientDto extends Partial<CreateClientDto> {
  status?: ClientStatus;
}

export interface ClientQueryParams extends PaginationParams {
  clientType?: ClientType;
  status?: ClientStatus;
  search?: string; // 搜索: 姓名/公司名/手机/邮箱
  servicePlan?: string;
  tags?: string; // 逗号分隔的标签
}

// =====================================================
// 业务事项类型
// =====================================================

export interface Matter {
  id: number;
  matterNo: string;
  matterType: MatterType;
  title: string;
  description: string | null;

  clientId: number;
  client?: Client;

  status: MatterStatus;
  priority: Priority;

  feeType: FeeType;
  feeAmount: number | null;
  hourlyRate: number | null;
  totalAmount: number;
  paidAmount: number;

  startDate: string | null;
  deadline: string | null;
  completedAt: string | null;

  progress: number;
  nextAction: string | null;

  metadata: any;

  assigneeId: number | null;
  assignee?: User;
  createdById: number;
  createdBy?: User;

  createdAt: string;
  updatedAt: string;

  tasks?: Task[];
  timeEntries?: TimeEntry[];
  invoices?: Invoice[];
}

export interface CreateMatterDto {
  matterType: MatterType;
  title: string;
  description?: string;
  clientId: number;
  status?: MatterStatus;
  priority?: Priority;
  feeType: FeeType;
  feeAmount?: number;
  hourlyRate?: number;
  startDate?: string;
  deadline?: string;
  assigneeId?: number;
  metadata?: any;
}

export interface MatterQueryParams extends PaginationParams {
  clientId?: number;
  matterType?: MatterType;
  status?: MatterStatus;
  priority?: Priority;
  assigneeId?: number;
  search?: string;
}

// =====================================================
// 任务类型
// =====================================================

export interface Task {
  id: number;
  matterId: number | null;
  userId: number;

  title: string;
  description: string | null;

  status: TaskStatus;
  priority: Priority;

  dueDate: string | null;
  completedAt: string | null;

  reminderAt: string | null;
  isReminded: boolean;

  createdAt: string;
  updatedAt: string;

  matter?: Matter;
  user?: User;
}

export interface CreateTaskDto {
  matterId?: number;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  dueDate?: string;
  reminderAt?: string;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  dueDate?: string;
  reminderAt?: string;
  matterId?: number;
}

export interface TaskQueryParams extends PaginationParams {
  matterId?: number;
  userId?: number;
  status?: TaskStatus;
  priority?: Priority;
  search?: string;
  overdue?: boolean;
}

// =====================================================
// 时间记录类型
// =====================================================

export interface TimeEntry {
  id: number;
  matterId: number;
  userId: number;
  clientId: number;

  description: string;

  startTime: string;
  endTime: string | null;
  duration: number | null;

  hourlyRate: number;
  amount: number | null;

  isBillable: boolean;
  isBilled: boolean;
  invoiceId: number | null;

  createdAt: string;
}

// =====================================================
// 发票类型
// =====================================================

export interface Invoice {
  id: number;
  invoiceNo: string;

  clientId: number;
  client?: Client;
  matterId: number | null;
  matter?: Matter;
  createdById: number;

  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;

  status: InvoiceStatus;

  issueDate: string | null;
  dueDate: string | null;
  paidAt: string | null;

  items: any;

  notes: string | null;

  createdAt: string;
  updatedAt: string;
}

// =====================================================
// 沟通记录类型
// =====================================================

export interface Communication {
  id: number;
  clientId: number;
  matterId: number | null;
  userId: number | null;

  channel: CommChannel;
  direction: Direction;

  subject: string | null;
  content: string;
  summary: string | null;

  attachments: any;

  contactName: string | null;
  contactInfo: string | null;
  contactWechat: string | null;

  externalId: string | null;
  threadId: string | null;

  fromAddr: string | null;
  toAddrs: any;
  ccAddrs: any;

  sentAt: string;
  readAt: string | null;
  createdAt: string;
}

// =====================================================
// 企业配置类型
// =====================================================

export interface EnterpriseConfig {
  id: number;
  clientId: number;

  serviceLevel: string;
  responseTime: number;
  monthlyQuota: number;
  usedQuota: number;

  oaWebhookUrl: string | null;
  oaApiKey: string | null;
  oaApiSecret: string | null;
  dingtalkToken: string | null;
  wecomCorpId: string | null;
  wecomAgentId: string | null;
  wecomSecret: string | null;

  members: any;

  portalTitle: string | null;
  portalLogo: string | null;
  portalTheme: string | null;

  customFields: any;

  createdAt: string;
  updatedAt: string;
}

// =====================================================
// 统计数据类型
// =====================================================

export interface DashboardStats {
  totalClients: number;
  activeClients: number;
  enterpriseClients: number;
  personalClients: number;

  totalMatters: number;
  pendingMatters: number;
  inProgressMatters: number;
  completedMatters: number;

  totalRevenue: number;
  pendingPayment: number;

  upcomingTasks: number;
  overdueTasks: number;

  recentCommunications: Communication[];
  upcomingDeadlines: Matter[];
}
