// 公司法务智慧管理系统 - 类型定义
// 功能: 定义所有 TypeScript 接口和类型

// ===== 用户与权限模块 =====

export interface User {
  id: number
  username: string
  realName: string
  email: string | null
  phone: string | null
  roleId: number
  department: string | null
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED'
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

export interface Role {
  id: number
  roleName: string
  description: string | null
  permissions: Record<string, any> | null
  createdAt: string
  updatedAt: string
}

// ===== 合同管理模块 =====

export interface Contract {
  id: number
  contractNo: string
  title: string
  partyA: string
  partyB: string
  contractType: string | null
  amount: number | null
  signDate: string | null
  effectiveDate: string | null
  expiryDate: string | null
  status: ContractStatus
  content: string | null
  filePath: string | null
  createdBy: number
  createdAt: string
  updatedAt: string
}

export type ContractStatus =
  | 'DRAFT'
  | 'REVIEWING'
  | 'SIGNED'
  | 'EXECUTING'
  | 'COMPLETED'
  | 'TERMINATED'

export interface ContractApproval {
  id: number
  contractId: number
  approverId: number
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  comment: string | null
  approvedAt: string | null
  createdAt: string
}

// ===== 案件管理模块 =====

export interface CaseItem {
  id: number
  caseNo: string
  title: string
  caseType: CaseType
  plaintiff: string | null
  defendant: string | null
  court: string | null
  filingDate: string | null
  status: CaseStatus
  description: string | null
  createdBy: number
  assignedTo: number | null
  createdAt: string
  updatedAt: string
}

export type CaseType = 'CIVIL' | 'ADMINISTRATIVE' | 'CRIMINAL' | 'ARBITRATION'

export type CaseStatus = 'PENDING' | 'TRIAL' | 'APPEAL' | 'ENFORCEMENT' | 'CLOSED'

// ===== AI Agent 模块 =====

export interface Agent {
  id: number
  agentName: string
  agentType: 'HUMAN' | 'AI' | 'EXPERT'
  apiEndpoint: string | null
  capabilities: Record<string, any> | null
  status: 'ACTIVE' | 'INACTIVE' | 'BUSY'
  ownerId: number
  createdAt: string
  updatedAt: string
}

// ===== 任务管理模块 =====

export interface Task {
  id: number
  taskType: string
  title: string
  description: string | null
  assignerId: number
  assigneeId: number
  assigneeType: 'HUMAN' | 'AI'
  priority: Priority
  status: TaskStatus
  taskData: Record<string, any> | null
  result: Record<string, any> | null
  dueDate: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED'

// ===== 服务产品与订单模块 =====

export interface ServiceProduct {
  id: number
  name: string
  description: string | null
  price: number
  pricingUnit: PricingUnit
  category: string | null
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

export interface Order {
  id: number
  orderNo: string
  customerName: string
  customerPhone: string | null
  customerEmail: string | null
  productId: number
  amount: number
  status: OrderStatus
  paymentMethod: string | null
  paidAt: string | null
  assignedAgentId: number | null
  createdAt: string
}

export type PricingUnit = 'PER_HOUR' | 'PER_CASE' | 'PER_MONTH'

export type OrderStatus = 'PENDING' | 'PAID' | 'PROCESSING' | 'COMPLETED' | 'REFUNDED' | 'CANCELLED'

// ===== API 响应类型 =====

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
