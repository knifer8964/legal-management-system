// =====================================================
// 前端 API 类型定义 — 严格对齐后端 backend/src/types/api.ts
// 来源：个人法务工作室管理系统 M1-M5 Schema
// =====================================================

// =====================================================
// 通用类型
// =====================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  pagination?: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
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

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// =====================================================
// 认证
// =====================================================

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'LOCKED';

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
// 客户 (Client)
// =====================================================

export type ClientType = 'PERSONAL' | 'COMPANY';
export type ClientStatus = 'ACTIVE' | 'INACTIVE' | 'POTENTIAL';

export interface Client {
  id: number;
  clientType: ClientType;
  name: string;
  shortName: string | null;

  phone: string | null;
  email: string | null;
  wechatId: string | null;
  qq: string | null;
  address: string | null;

  gender: string | null;
  idNumber: string | null;
  birthDate: string | null;

  creditCode: string | null;
  legalRep: string | null;
  industry: string | null;
  scale: string | null;
  website: string | null;

  contactName: string | null;
  contactTitle: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  contactWechat: string | null;

  servicePlan: string | null;
  monthlyFee: number | null;
  serviceStart: string | null;
  serviceEnd: string | null;

  tags: string[] | null;
  notes: string | null;
  source: string | null;

  totalMatters: number;
  totalAmount: number;
  lastContactAt: string | null;

  status: ClientStatus;
  createdAt: string;
  updatedAt: string;

  matters?: Matter[];
  enterpriseConfig?: EnterpriseConfig;
}

export interface CreateClientDto {
  clientType: ClientType;
  name: string;
  shortName?: string;
  phone?: string;
  email?: string;
  wechatId?: string;
  qq?: string;
  address?: string;
  gender?: string;
  idNumber?: string;
  birthDate?: string;
  creditCode?: string;
  legalRep?: string;
  industry?: string;
  scale?: string;
  website?: string;
  contactName?: string;
  contactTitle?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactWechat?: string;
  servicePlan?: string;
  monthlyFee?: number;
  serviceStart?: string;
  serviceEnd?: string;
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
  search?: string;
  servicePlan?: string;
  tags?: string;
}

// =====================================================
// 业务事项 (Matter)
// =====================================================

export type MatterType =
  | 'LITIGATION'
  | 'CONTRACT_REVIEW'
  | 'LEGAL_ADVICE'
  | 'CORPORATE'
  | 'IP'
  | 'OTHER';
export type MatterStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type FeeType = 'FIXED' | 'HOURLY' | 'RETAINER' | 'CONTINGENCY' | 'FREE';
export type Priority = 'HIGH' | 'MEDIUM' | 'LOW';

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

export interface UpdateMatterDto extends Partial<CreateMatterDto> {}

export interface MatterQueryParams extends PaginationParams {
  clientId?: number;
  matterType?: MatterType;
  status?: MatterStatus;
  priority?: Priority;
  assigneeId?: number;
  search?: string;
}

// =====================================================
// 任务 (Task)
// =====================================================

export type TaskStatus = 'TODO' | 'DONE';

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
// 沟通记录 (Communication)
// =====================================================

export type CommChannel = 'PHONE' | 'EMAIL' | 'WECHAT' | 'MEETING' | 'OTHER';
export type Direction = 'INBOUND' | 'OUTBOUND';

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

  client?: Client;
  matter?: Matter;
  user?: User;
}

export interface CreateCommunicationDto {
  clientId: number;
  matterId?: number;
  channel: CommChannel;
  direction: Direction;
  subject?: string;
  content: string;
  contactName?: string;
  contactInfo?: string;
  contactWechat?: string;
  fromAddr?: string;
  toAddrs?: string[];
  ccAddrs?: string[];
  attachments?: any;
  externalId?: string;
  threadId?: string;
  sentAt?: string;
}

export interface UpdateCommunicationDto {
  subject?: string;
  content?: string;
  summary?: string;
  contactName?: string;
  contactInfo?: string;
  contactWechat?: string;
  matterId?: number;
}

export interface CommunicationQueryParams extends PaginationParams {
  clientId?: number;
  matterId?: number;
  channel?: CommChannel;
  direction?: Direction;
  search?: string;
}

// =====================================================
// 计时记录 (TimeEntry)
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

  matter?: Matter;
  client?: Client;
  user?: User;
}

export interface CreateTimeEntryDto {
  matterId: number;
  clientId: number;
  description: string;
  hourlyRate?: number;
  isBillable?: boolean;
}

export interface UpdateTimeEntryDto {
  description?: string;
  hourlyRate?: number;
  isBillable?: boolean;
  startTime?: string;
  endTime?: string;
}

export interface TimeEntryQueryParams extends PaginationParams {
  matterId?: number;
  clientId?: number;
  userId?: number;
  isBilled?: boolean;
  isBillable?: boolean;
  startDate?: string;
  endDate?: string;
}

// =====================================================
// 发票 (Invoice)
// =====================================================

export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PAID' | 'OVERDUE' | 'CANCELLED';

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
// 企业配置 (EnterpriseConfig)
// =====================================================

export interface EnterpriseConfig {
  id: number;
  clientId: number;
  serviceMode: string | null;
  responseTime: string | null;
  contractNo: string | null;
  contractStart: string | null;
  contractEnd: string | null;
  monthlyFee: number | null;
  includedHours: number | null;
  extraHourRate: number | null;
  autoRenew: boolean;
  responsibleLawyer: string | null;
  assistant: string | null;
  createdAt: string;
  updatedAt: string;
}

// =====================================================
// Dashboard 统计（前端聚合用）
// =====================================================

export interface DashboardStats {
  totalClients: number;
  totalMatters: number;
  activeMatters: number;
  completedMatters: number;
  pendingTasks: number;
  totalTimeToday: number;
  totalBilling: number;
  recentMatters: Matter[];
  upcomingTasks: Task[];
}
