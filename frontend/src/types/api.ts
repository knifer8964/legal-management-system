// =====================================================
// 前端 API 类型定义 — 与后端 M1-M5 Schema 对齐
// =====================================================

// =====================================================
// 通用类型
// =====================================================

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

// =====================================================
// 认证
// =====================================================

export interface User {
  id: number;
  username: string;
  name: string;
  role: string;
  permissions?: string[];
  avatar?: string | null;
  email?: string | null;
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

export interface Client {
  id: number;
  name: string;
  type: 'PERSONAL' | 'COMPANY';
  contact: string;
  phone: string;
  email: string | null;
  address: string | null;
  company: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    matters: number;
  };
}

export interface ClientFormData {
  name: string;
  type: 'PERSONAL' | 'COMPANY';
  contact: string;
  phone: string;
  email?: string;
  address?: string;
  company?: string;
  notes?: string;
}

// =====================================================
// 业务事项 (Matter)
// =====================================================

export type MatterType = 'LITIGATION' | 'CONTRACT_REVIEW' | 'LEGAL_ADVICE' | 'CORPORATE' | 'IP' | 'OTHER';
export type MatterStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type MatterPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface Matter {
  id: number;
  matterNo: string;
  matterType: MatterType;
  title: string;
  description: string | null;
  status: MatterStatus;
  priority: MatterPriority;
  clientId: number;
  client: Client;
  feeType: string;
  feeAmount: number | null;
  hourlyRate: number | null;
  startDate: string | null;
  deadline: string | null;
  progress: number;
  totalAmount: number;
  assigneeId: number | null;
  assignee: User | null;
  createdById: number;
  createdBy: User | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    tasks: number;
    timeEntries: number;
    invoices: number;
  };
}

export interface MatterFormData {
  matterType: MatterType;
  title: string;
  description?: string;
  clientId: number;
  status?: MatterStatus;
  priority?: MatterPriority;
  feeType: string;
  feeAmount?: number;
  hourlyRate?: number;
  startDate?: string;
  deadline?: string;
  assigneeId?: number;
}

// =====================================================
// 任务 (Task)
// =====================================================

export type TaskStatus = 'TODO' | 'DONE';
export type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface Task {
  id: number;
  matterId: number;
  matter: { id: number; title: string; matterNo: string };
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  assigneeId: number | null;
  assignee: User | null;
  createdById: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskFormData {
  matterId: number;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  assigneeId?: number;
}

// =====================================================
// 沟通记录 (Communication)
// =====================================================

export type CommunicationType = 'PHONE' | 'EMAIL' | 'WECHAT' | 'MEETING' | 'OTHER';
export type CommunicationDirection = 'INBOUND' | 'OUTBOUND';

export interface Communication {
  id: number;
  matterId: number | null;
  matter: { id: number; title: string; matterNo: string } | null;
  clientId: number;
  client: Client;
  type: CommunicationType;
  direction: CommunicationDirection;
  subject: string;
  content: string | null;
  contactPerson: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  createdById: number;
  createdBy: User | null;
  createdAt: string;
  updatedAt: string;
}

export interface CommunicationFormData {
  matterId?: number;
  clientId: number;
  type: CommunicationType;
  direction: CommunicationDirection;
  subject: string;
  content?: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
}

// =====================================================
// 计时条目 (TimeEntry)
// =====================================================

export interface TimeEntry {
  id: number;
  matterId: number;
  matter: { id: number; title: string; matterNo: string };
  clientId: number;
  client: Client;
  description: string;
  startTime: string;
  endTime: string | null;
  duration: number;
  hourlyRate: number;
  amount: number;
  isBillable: boolean;
  isBilled: boolean;
  userId: number;
  user: User | null;
  createdAt: string;
  updatedAt: string;
}

export interface TimeEntryFormData {
  matterId: number;
  clientId: number;
  description: string;
  startTime?: string;
  endTime?: string;
  isBillable?: boolean;
}

// =====================================================
// Dashboard 统计
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

// =====================================================
// 通用分页参数
// =====================================================

export interface PaginationParams {
  page: number;
  pageSize: number;
  keyword?: string;
}
