# 公司法务智慧管理系统

## 项目概述

面向企业内部法务部门的**全栈智慧管理平台**，支持合同管理、案件追踪、AI Agent 协作、在线接单等核心功能。

## 技术栈

### 后端
- **运行时**: Node.js 20+
- **框架**: Express 4.x + TypeScript 5.x
- **ORM**: Prisma 5.7+ (MySQL)
- **缓存**: Redis (ioredis)
- **认证**: JWT (jsonwebtoken)

### 前端
- **框架**: React 18 + TypeScript 5.x
- **构建工具**: Vite 5.x
- **UI 组件库**: Ant Design 5.x (Pro Components)
- **状态管理**: Zustand
- **路由**: React Router DOM v6
- **HTTP 客户端**: Axios
- **图表**: Recharts

## 项目结构

```
legal-management-system/
├── backend/                 # 后端服务
│   ├── prisma/             # 数据库 Schema 和迁移
│   │   └── schema.prisma   # 数据模型定义
│   ├── src/
│   │   ├── index.ts        # Express 入口文件
│   │   ├── controllers/    # 控制器层
│   │   │   ├── authController.ts      # 认证控制器
│   │   │   └── contractController.ts  # 合同控制器
│   │   ├── routes/         # 路由定义
│   │   │   ├── index.ts    # 主路由入口
│   │   │   ├── authRoutes.ts       # 认证路由
│   │   │   └── contractRoutes.ts   # 合同路由
│   │   └── middleware/     # 中间件
│   │       └── authMiddleware.ts   # 认证中间件
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.template       # 环境变量模板
├── frontend/               # 前端应用
│   ├── src/
│   │   ├── main.tsx        # 应用入口
│   │   ├── App.tsx          # 根组件
│   │   ├── types/           # TypeScript 类型定义
│   │   │   └── index.ts
│   │   ├── utils/           # 工具函数
│   │   │   └── api.ts       # API 配置
│   │   └── styles/          # 全局样式
│   │       └── global.css
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── index.html
├── docs/                   # 项目文档
├── scripts/                # 脚本工具
└── deploy/                 # 部署配置
```

## 核心功能模块

### 1. 用户与权限管理 (RBAC)
- 用户注册/登录/修改密码
- JWT Token 认证与刷新
- 角色权限管理（管理员、法务专员、普通用户）
- 权限中间件动态检查

### 2. 合同管理 (核心模块)
- 合同 CRUD 操作
- 全生命周期状态管理（草稿→审核→签署→执行→完成/终止）
- 多级审批流程
- 合同风险检查（预留 AI 接口）

### 3. 案件管理
- 案件创建与分配
- 时间线记录
- 状态跟踪（待处理→审理→上诉→执行→结案）

### 4. AI Agent 管理
- 支持接入人类专家、AI Agent、外部专家
- 任务分配与协作
- 能力配置与状态监控

### 5. 服务产品与订单
- 服务产品发布与管理
- 在线订单接收与处理
- 支付状态跟踪

## 快速开始

### 环境要求
- Node.js >= 20.0.0
- MySQL >= 8.0
- Redis >= 7.0
- npm 或 pnpm

### 安装步骤

#### 1. 克隆项目
```bash
cd legal-management-system
```

#### 2. 后端安装
```bash
cd backend
npm install
cp .env.template .env
# 编辑 .env 文件，配置数据库连接信息
npx prisma migrate dev --name init
npm run dev
```

#### 3. 前端安装
```bash
cd frontend
npm install
npm run dev
```

#### 4. 访问系统
- 前端地址: http://localhost:5173
- 后端 API: http://localhost:3000/api/v1

## 开发规范

### 命名约定
- 文件名: camelCase (如 `authController.ts`)
- 类名: PascalCase (如 `AuthService`)
- 变量/函数: camelCase (如 `getUserById`)
- 常量: UPPER_SNAKE_CASE (如 `JWT_SECRET`)
- 数据库表名: snake_case (如 `contract_approvals`)
- API 路由: kebab-case (如 `/contract-approvals`)

### 注释规范
- 函数注释使用 JSDoc 格式
- 复杂逻辑添加行内注释
- TODO 标记未完成的功能

### Git 提交规范
- feat: 新功能
- fix: Bug 修复
- docs: 文档更新
- style: 代码格式调整
- refactor: 重构
- test: 测试相关
- chore: 构建/工具变更

## 开发路线图

### Phase 1: 框架搭建 ✅ (当前阶段)
- [x] 项目目录结构初始化
- [x] 后端框架搭建 (Express + TypeScript + Prisma)
- [x] 前端框架搭建 (React + Vite + Ant Design)
- [x] 数据库模型设计
- [x] 认证系统基础实现
- [ ] 合同管理模块完整实现
- [ ] 前端页面开发

### Phase 2: 核心功能开发
- [ ] 合同管理完整功能
- [ ] 案件管理模块
- [ ] AI Agent 集成
- [ ] 任务调度系统

### Phase 3: 业务扩展
- [ ] 服务产品与订单系统
- [ ] 在线推广页面
- [ ] 数据分析报表
- [ ] 知识库集成

### Phase 4: 优化与部署
- [ ] 性能优化
- [ ] 安全加固
- [ ] 一键部署脚本
- [ ] 用户文档编写

## 许可证

MIT License

## 作者

硅基先锋 - AI 辅助开发
