# 个人法务工作室管理系统 (Legal Management System)

## 项目概述

面向独立执业律师、法务顾问、自由法务工作者的**一人公司运营工具**。帮助法务高效管理个人+企业客户、业务事项、沟通记录、计时收费、发票、文档等全部业务流程。

**不是 SaaS 平台，而是个人工具**——类比"美团商家版"而非"美团"。

## 技术栈

### 后端
- **运行时**: Node.js 20+
- **框架**: Express 4 + TypeScript 5
- **ORM**: Prisma 5.22 (MySQL 8.4)
- **缓存**: Redis (ioredis，可选，降级为内存)
- **认证**: JWT + bcrypt

### 前端
- **框架**: React 19 + TypeScript
- **构建**: Vite 8 (rolldown)
- **UI**: Ant Design 5
- **状态管理**: Zustand
- **路由**: React Router 6
- **图表**: Recharts

### 桌面端
- **Electron**: 打包为桌面应用，本地启动后端服务

## 核心功能模块

| 模块 | 状态 | 说明 |
|------|------|------|
| 客户管理 | ✅ | 个人/企业客户档案、关联业务、统计 |
| 业务事项 | ✅ | 10 类事项（诉讼/仲裁/调解/咨询/合规/合同审查/合同起草/培训/文书代写/其他）|
| 沟通记录 | ✅ | 8 渠道沟通记录、双向标记、关联客户/业务 |
| 任务管理 | ✅ | 任务 CRUD、优先级、截止日期、看板视图 |
| 计时收费 | ✅ | 开始/停止计时、费率、可计费标记、发票关联 |
| 发票管理 | ✅ | 自动编号、金额计算、付款记录、状态流转 |
| 文档管理 | ✅ | 文档元数据、分类、关联客户/业务 |
| 用户管理 | ✅ | 用户 CRUD、RBAC 权限、角色管理 |
| Dashboard | ✅ | 聚合统计、图表可视化、逾期提醒 |
| 虚拟法务部 | 📋 预留 | EnterpriseConfig 数据模型已就位，API/前端待开发 |
| OA/ERP 对接 | 📋 预留 | 预留字段已就位，接口待开发 |

## API 接口 (61+)

| 路由 | 接口数 | 说明 |
|------|--------|------|
| /api/v1/auth | 5 | 登录/登出/刷新/个人信息/改密 |
| /api/v1/clients | 7 | 客户 CRUD + 统计 + 关联业务 |
| /api/v1/matters | 9 | 业务 CRUD + 编号查询 + 统计 + 时间线 + 状态更新 |
| /api/v1/tasks | 7 | 任务 CRUD + 统计 + 切换状态 |
| /api/v1/communications | 6 | 沟通记录 CRUD + 统计 |
| /api/v1/time-entries | 9 | 计时 CRUD + 统计 + 开始/停止/手动录入 |
| /api/v1/users | 8 | 用户 CRUD + 角色列表 + 重置密码 |
| /api/v1/invoices | 8 | 发票 CRUD + 统计 + 关联计时 + 付款记录 |
| /api/v1/documents | 6 | 文档 CRUD + 统计 |
| /api/v1/dashboard | 1 | 聚合统计概览 |

## 快速开始

### 环境要求
- Node.js >= 20
- MySQL >= 8.0
- Redis (可选)

### 安装
```bash
# 后端
cd backend
npm install
cp .env.template .env  # 编辑数据库配置
npx prisma migrate dev
npx prisma db seed
npm run dev

# 前端
cd frontend
npm install
npm run dev
```

### 默认账号
| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | 123456 | 管理员 |
| lawyer1 | 123456 | 法务 |
| assistant1 | 123456 | 助理 |

### 访问地址
- 前端: http://localhost:5173
- 后端 API: http://localhost:3000/api/v1

### 桌面端
```bash
cd frontend
npm run dev:electron   # 开发模式
npm run build:win      # Windows 打包
```

## 项目结构
```
legal-management-system/
├── backend/
│   ├── prisma/schema.prisma    # 13 模型 + 11 枚举
│   ├── src/
│   │   ├── controllers/        # 10 控制器
│   │   ├── services/           # 10 服务层
│   │   ├── routes/             # 11 路由模块
│   │   ├── middleware/         # 认证 + 权限 + 限流
│   │   └── utils/              # 工具函数
│   └── .env
├── frontend/
│   ├── electron/               # Electron 主进程
│   ├── src/
│   │   ├── pages/              # 11 页面
│   │   ├── stores/             # 9 Zustand store
│   │   ├── services/           # 10 API service
│   │   ├── types/api.ts        # 类型定义
│   │   └── layouts/AppLayout.tsx
│   └── package.json
├── scripts/                    # 测试与工具脚本
└── docs/                       # 文档
```

## 开发路线图

### 已完成 (M1-M10)
- ✅ M1: 数据库 Schema 重构
- ✅ M2: 客户管理 API
- ✅ M3: 业务事项 API
- ✅ M4: 任务管理 API
- ✅ M5: 沟通记录 & 计时收费
- ✅ M6: 前端 6 核心页面
- ✅ M7: 用户管理与权限
- ✅ M8: 发票管理
- ✅ M9: 文档管理
- ✅ M10: Dashboard 增强（聚合接口+图表）
- ✅ 安全审计 + Code Review 整改

### 计划中
- 📋 M11: 文件上传（物理上传/下载端点）
- 📋 M12: 详情页（客户/业务详情含关联标签页）
- 📋 M13: 搜索 & 筛选增强
- 📋 M14: 导出（PDF/Excel）
- 📋 M15: 通知系统
- 📋 M16: 报表 & 分析
- 📋 M17: 事务 + 并发安全
- 📋 M18: Electron 桌面端完善
- 📋 M19: 邮件集成
- 📋 M20: 微信/企业IM 集成
- 📋 虚拟法务部（企业客户专属工作空间）
- 📋 OA/ERP 对接

## 许可证

MIT License

## 作者

硅基先锋 - AI 辅助开发
