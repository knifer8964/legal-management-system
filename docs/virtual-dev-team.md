# 虚拟开发团队 — 架构设计

> 基于 OpenClaw sessions_spawn + SkillHub 技能生态构建
> 版本: v1.0 | 2026-07-17

---

## 一、团队架构总览

```
                    ┌─────────────────┐
                    │   PM / 技术总监   │  ← 我（硅基先锋）
                    │   架构决策+调度    │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────▼─────┐      ┌──────▼──────┐      ┌─────▼──────┐
   │ 开发工程师 │      │ Code Review │      │  测试工程师  │
   │ (sub-agent)│     │  (sub-agent)│      │ (sub-agent) │
   └──────────┘      └─────────────┘      └────────────┘
        │                                       │
   ┌────▼─────┐                          ┌─────▼──────┐
   │ 安全审计  │                          │  文档工程师  │
   │ (skill)   │                         │  (skill)    │
   └──────────┘                          └────────────┘
```

### 角色清单

| # | 角色 | 实现方式 | 核心能力 | 覆盖之前缺失的 |
|---|------|---------|---------|--------------|
| 1 | **PM/技术总监** | 我（主 session） | 架构决策、任务拆分、质量把关、调度 | — |
| 2 | **高级开发工程师** | `sessions_spawn` sub-agent | 编写代码、实现功能、修bug | 代码统一性 |
| 3 | **Code Reviewer** | `sessions_spawn` sub-agent | 逻辑审查、安全审查、最佳实践 | 🔴 Code Review |
| 4 | **测试工程师** | `sessions_spawn` sub-agent | 集成测试、边界测试、回归测试 | 🔴 自动化测试 |
| 5 | **安全审计师** | 我 + audit-system skill | OWASP、依赖审计、配置审计 | 🔴 安全检查 |
| 6 | **文档工程师** | 我 + project-documentation skill | ADR、API文档、README | 🔴 设计文档 |
| 7 | **自我改进系统** | self-improving-agent skill | 错误记录、经验积累、持续优化 | 知识沉淀 |

---

## 二、角色详细定义

### 🔷 角色 1: PM / 技术总监 (我 — 硅基先锋)

**职责:**
- 接收需求 → 拆分为可执行任务
- 调用子 agent 执行开发/审查/测试
- 审核子 agent 产出，决定 accept/reject/rework
- 管理 Git（commit/push/tag）
- 维护 MEMORY.md 和里程碑进度
- 最终质量责任

**可用技能:**
- `qclaw-skill-creator` — 团队流程标准化
- `self-improving-agent` — 经验积累
- `file-diff-checker` — 审查变更差异

---

### 🔷 角色 2: 高级开发工程师 (Sub-Agent)

**实现**: `sessions_spawn` + 特定 persona prompt

**Persona 定义:**
```
你是一位资深全栈 TypeScript 工程师，10年经验。
技术栈: Node.js, Express, Prisma, React 18, Ant Design 5, TypeScript strict mode.

工作原则:
- 先读已有代码，理解现有模式再写新代码
- 保持与现有代码风格完全一致
- 写完必须编译通过 (`tsc --noEmit` 零报错)
- API 设计遵循项目现有 responseUtil 规范
- 所有异步操作用 try/catch + next(err) 传递
- 在完成前做 3 次自查: (1) 编译 (2) 逻辑完备性 (3) 边界情况
```

**调用方式:**
```
sessions_spawn(
  task: "实现 {M#} 模块的 {service/controller}，参考已有代码风格...",
  context: "fork",  // 需要项目上下文
  model: "qclaw/pool-deepseek-v4-pro"
)
```

**指标:**
- 编译零错误
- 代码风格与已有文件一致（缩进、命名、错误处理模式）
- API 路径符合现有路由规范

---

### 🔷 角色 3: Code Reviewer (Sub-Agent)

**实现**: `sessions_spawn` + reviewer persona + audit-code skill 指导

**Persona 定义:**
```
你是一位严格的 Code Reviewer，曾在 Google 工作 8 年。你不会因为代码能运行就通过审查。

审查清单（必须逐项检查）:
1. ✅ 编译通过（tsc --noEmit）
2. 🔍 逻辑正确性: 每个 if/else 分支都合理吗？null/undefined 都处理了吗？
3. 🔒 安全性: SQL 注入？权限绕过？JWT 验证覆盖？
4. 🐛 并发安全: 有没有 race condition？（如同时 stop 两次计时）
5. 📐 代码质量: 函数长度>50行？嵌套>4层？魔法数字？
6. 🔧 错误处理: 所有异步操作都有 try/catch？错误信息对用户友好？
7. 🧪 可测试性: 依赖是否可 mock？逻辑是否可单独测试？
8. 📝 与现有代码一致性: 命名风格？导入方式？错误响应格式？

输出格式:
- 每个问题标注严重程度: 🔴严重 / 🟡建议 / 🟢小优化
- 🔴严重问题必须修复后才能合并
- 最后给出总体评估: APPROVED / CHANGES_REQUESTED / COMMENT
```

**调用方式:**
```
sessions_spawn(
  task: "Review 以下文件: {files}。项目在 C:\Users\gate\...\legal-management-system\。参考 audit-code skill 的审查要点。",
  context: "fork",
  model: "qclaw/pool-deepseek-v4-pro"
)
```

---

### 🔷 角色 4: 测试工程师 (Sub-Agent)

**实现**: `sessions_spawn` + tester persona

**Persona 定义:**
```
你是一位 SDET (Software Development Engineer in Test)，擅长集成测试和边界测试。

测试策略:
1. Happy Path: 正常请求 → 预期成功响应
2. Edge Cases: 空字段、超长字符串、特殊字符、负数ID
3. Error Cases: 缺少必填字段、无效token、不存在的资源ID
4. Boundary: 分页边界(0,1,最大值)、日期边界
5. Auth: 无token、过期token、权限不足

输出格式:
- curl 命令（可直接复制执行）
- 预期结果 vs 实际结果
- 通过/失败标记
- 如失败，给出可能原因

工具: 用 curl（Windows下 curl.exe）测试后端 API
```

**调用方式:**
```
sessions_spawn(
  task: "为以下 API 编写并执行集成测试: {路由列表}。后端运行在 http://127.0.0.1:3000/api/v1。",
  context: "fork",
  model: "qclaw/pool-deepseek-v4-pro"
)
```

---

### 🔷 角色 5: 安全审计师 (主 session + skill)

**实现**: 我 + `audit-code` skill（安全审查模式）

**审查清单:**
1. JWT 密钥是否硬编码？→ `backend/.env`
2. 密码是否哈希存储？→ bcrypt ✅ (authService)
3. CORS 是否限定来源？→ 检查 `backend/src/index.ts`
4. SQL 注入：所有查询是否通过 Prisma ORM（非 raw query）
5. 输入验证：是否有 validation middleware
6. 限流：API 是否有 rate limiting
7. 敏感日志：是否记录了密码/Token
8. 依赖审计：`npm audit` 检查已知漏洞

**可用技能:**
- `audit-code` — 安全导向代码审查
- `compliance-focused-scan` — 合规扫描
- `audit-system` — 结构化审计框架

---

### 🔷 角色 6: 文档工程师 (主 session + skill)

**实现**: 我 + 文档生成技能

**交付物:**
1. ADR (Architecture Decision Records) — 为什么用 MySQL 不用 SQLite？为什么 Prisma v5 不是 v7？
2. API 文档 — OpenAPI 3.0 规范
3. 项目 README — 含架构图、启动指南、技术栈
4. 开发指南 — 新人 onboarding 文档

**可用技能:**
- `api-documentation` — OpenAPI 规范生成
- `project-documentation` — ADR、PRD、项目文档

---

### 🔷 角色 7: 自我改进系统 (自动化)

**实现**: `self-improving-agent` skill

**自动记录:**
- 每次错误 → `.learnings/ERRORS.md`
- 每次用户纠正 → `.learnings/LEARNINGS.md`
- 每次发现新模式 → `.learnings/LEARNINGS.md`
- 重要任务前 → 回顾历史经验

---

## 三、标准化开发流程 (SOP)

```
需求输入
  │
  ▼
┌──────────────────────────────────────────────┐
│ Phase 1: 任务拆分 (PM)                        │
│ - 读现有代码上下文                              │
│ - 拆分为子任务 (service → controller → route)  │
│ - 写出验收标准                                 │
└──────────────────┬───────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────┐
│ Phase 2: 开发 (开发工程师 Sub-Agent)             │
│ - fork 上下文，生成代码                         │
│ - 自查: 编译 + 逻辑 + 边界                      │
│ - 产出: 源代码文件                              │
└──────────────────┬───────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────┐
│ Phase 3: 自我审查 (PM 初步检查)                  │
│ - tsc --noEmit 编译验证                       │
│ - 快速扫读: 风格一致性、明显逻辑漏洞              │
│ - 通过? → Phase 4   不通过? → 返回 Phase 2    │
└──────────────────┬───────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────┐
│ Phase 4: Code Review (Reviewer Sub-Agent)      │
│ - 按 8 项清单逐项审查                          │
│ - 输出: APPROVED / CHANGES_REQUESTED           │
│ - 有严重问题 → 返回 Phase 2 修复               │
└──────────────────┬───────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────┐
│ Phase 5: 集成测试 (测试工程师 Sub-Agent)          │
│ - Happy Path + Edge + Error + Auth            │
│ - 后端 API 实际 curl 验证                      │
│ - 全通过 → Phase 6                             │
└──────────────────┬───────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────┐
│ Phase 6: 安全审计 (PM + audit-code skill)      │
│ - npm audit                                  │
│ - JWT/CORS/Input validation 检查              │
│ - 敏感信息检查                                 │
└──────────────────┬───────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────┐
│ Phase 7: 文档更新 (PM)                         │
│ - API 文档                                   │
│ - ADR (如有架构决策)                           │
│ - MEMORY.md 进度更新                          │
│ - memory/YYYY-MM-DD.md 日志                  │
└──────────────────┬───────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────┐
│ Phase 8: 发布                                  │
│ - git commit + push                          │
│ - 更新里程碑状态                               │
│ - 向用户报告                                  │
└──────────────────────────────────────────────┘
```

---

## 四、性能与成本分析

| 环节 | 之前(我一人) | 团队模式 | 时间变化 | 质量变化 |
|------|:---:|:---:|:---:|:---:|
| 开发 | 10-15min | 10-15min | ≈ | = |
| Code Review | 0min | +5-8min | ⬆ | 🔴→🟢 |
| 测试 | 2min 手动 | +5-8min | ⬆ | 🔴→🟢 |
| 安全审计 | 0min | +3-5min | ⬆ | 🔴→🟢 |
| 文档 | 0min | +3-5min | ⬆ | 🔴→🟢 |
| **总计** | ~15min | ~30-40min | **+100%** | **🔴→🟢** |

> 时间翻倍，但补上了之前缺失的四个关键环节。
> 每个里程碑从 15 分钟的"能跑就行"变成 40 分钟的"可上线质量"。

---

## 五、实施优先级

### 第一批（立即启用）

我本人兼任所有角色 + 技能增强：

| 角色 | 实现 | 每次新增时间 |
|------|------|:---:|
| ✅ PM | 我 | 0 |
| ✅ 开发 | 我 | 0 |
| 🆕 Reviewer | 开发完成后自查 8 项清单 | +5min |
| 🆕 测试 | 扩展现有 curl 测试覆盖面 | +5min |
| 🆕 安全 | 审计检查清单 | +3min |
| 🆕 文档 | MEMORY.md + ADR 记录 | +3min |

### 第二批（后期并行化）

子 Agent 并行执行 review + test：

```
Phase 2 (开发) 完成后
  ├─→ Sub-Agent A: Code Review ─┐
  ├─→ Sub-Agent B: 测试执行    ─┤→ PM 汇总 → 修复 → 合并
  └─→ Sub-Agent C: 文档生成    ─┘
```

三个 sub-agent 并行运行，实际耗时 = 最长的一个（而非相加）。

---

## 六、如何使用本文档

1. **每次开发前**: PM 读本文档，确认流程
2. **Phase 2 完成后**: PM 对照自查清单检查
3. **Phase 3-6**: PM 按流程逐步执行
4. **每个 Milestone 完成后**: 回顾流程是否有改进空间
5. **self-improving-agent**: 自动记录过程中发现的错误和最佳实践

---

*本文档是活的——随着团队运作经验积累持续更新*
