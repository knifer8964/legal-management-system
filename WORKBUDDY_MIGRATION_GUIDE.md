# 虚拟开发团队整体迁移指导文档（QClaw → WorkBuddy）

> 编制：硅基先锋（agent-d64c8186）｜编制日期：2026-09-29
> 用途：本文件供 **WorkBuddy** 阅读并执行自动迁移——将本团队（组织架构 + 全体成员人设 + 开发规范 + 项目成果）完整迁移到 WorkBuddy 平台继续运营。
> 配套源数据：`legal-management-system/MEMORY.md`、`virtual-team-sop.md`、`virtual-team-config_20260903.md`、7 份 `workspace-*/SOUL.md`、`docs/开发团队说明书.md`、`docs/团队组建方案.md`。

---

## 一、文档目的与迁移背景

本团队（"硅基先锋"主调度 + 7 名独立 Agent 构成的虚拟开发团队）在 QClaw 平台上完成了「个人法务工作室管理系统」的全栈开发。现决定**整体迁移到 WorkBuddy** 继续运营。

迁移包含两层目标：
1. **团队迁移**：在 WorkBuddy 中重建 7 名成员 Agent 及其人设（SOUL.md）、重建强制开发规范 SOP，使 WorkBuddy 能像 QClaw 一样以"多 Agent 并发调度"模式运作本项目。
2. **项目迁移**：将代码仓库、开发流程、成果物、已知问题与待办完整交接，使 WorkBuddy 接手后可零歧义地继续开发、维护与发布。

> 说明：QClaw 自带的 `qclaw-migrator` 技能仅迁移 QClaw 自身的会话/专家/Skill/定时任务数据，不覆盖"自建虚拟团队 + 业务项目"。本文件即补足这一层，指导 WorkBuddy 端以"自建 7 Agent 团队 + 接管 GitHub 仓库"的方式完成迁移。

---

## 二、项目总览

| 项目 | 内容 |
|------|------|
| 名称 | 个人法务工作室管理系统（Legal Management System） |
| 定位 | 一人法务公司的全部业务管理工具（客户、业务事项、合同、发票、计时、文档、虚拟法务部） |
| 当前版本 | v1.0.1（已出桌面安装包） |
| GitHub | `https://github.com/knifer8964/legal-management-system` |
| 本地路径（QClaw 侧） | `C:\Users\gate\.qclaw\workspace-agent-d64c8186\legal-management-system` |
| Git 用户 | `knifer8964 <knifer8964@users.noreply.github.com>`（凭据已存 `~/.git-credentials`，可自动 push） |
| 技术栈 | 后端：Node.js + Express 4 + TypeScript + Prisma v5 + **SQLite**（嵌入式，无需外部 DB）<br>前端：React 19 + Vite 8(rolldown) + Ant Design 6 + Zustand<br>桌面：Electron 42.3.0 + electron-builder 26.8.1（自包含安装包） |
| 数据库 | SQLite，文件 `backend/prisma/dev.db`；14 张表（User/Role/Client/Matter/Communication/TimelineEvent/Task/TimeEntry/Invoice/Payment/Document/EnterpriseConfig/Contract/SystemLog） |
| API 累计 | **85 个接口**（auth2 + clients7 + matters8 + tasks5 + communications5 + time-entries5 + users/roles8 + invoices8 + documents6 + dashboard1 + contracts8 + enterprise-config7 + payments1） |
| Git 提交 | 44 次 commit（首提交 2026-05-28，最新 `0304533` 2026-09-21） |
| 默认登录 | `admin / 123456`（seed 数据，所有测试用户密码均 123456） |
| 后端端口 | 3000（`node dist/index.js`）；前端 dev 5173（Vite） |

**14 个后端 Controller 已全部实现**：auth/client/communication/contract/dashboard/document/enterpriseConfig/invoice/matter/role/task/timeEntry/user。
**13 个前端页面已全部实现**：Login/ClientList/MatterList/TaskBoard/TimeEntry/Communication/Dashboard/InvoiceList/DocumentList/ContractList/UserList/RoleList/Profile。

---

## 三、团队组织架构

```
                    ┌──────────────────────────────────────┐
                    │   总指挥 / PM / 技术总监               │
                    │   硅基先锋 (agent-d64c8186) = 本团队创建者 │
                    │   唯一主调度 · 经 allowAgents 可 spawn 全部 │
                    └──────────────────┬───────────────────┘
                                       │ 调度 7 名成员（并发/串行按 SOP）
   ┌──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
   ▼          ▼          ▼          ▼          ▼          ▼          ▼
dev-cypher rvw-rigel tst-verity sec-cipher doc-scribe sys-wispr  pm-nexus
 林锋·Cypher 沈墨·Rigel 郭瑜·Verity 秦墨·Cipher 叶舒·Scribe 忆·Wispr 温衡·Nexus
 全栈开发    Code Review 测试工程师 安全审计   文档工程师  自我改进   PM协调(可二次调度6名)
```

- **层级**：硅基先锋任总指挥/PM/技术总监，是**唯一的主调度者**；`pm-nexus` 是二级协调岗，可被主调度派去协调其余 6 名执行岗。
- **模型配置**：除 `sys-wispr` 用 `pool-deepseek-v4-flash` 外，其余 6 名均为 `pool-deepseek-v4-pro`。（WorkBuddy 侧可按自身模型体系映射，人设与分工不变。）
- **在 QClaw 侧的落盘**：7 份 `workspace-{member}/SOUL.md` + `openclaw.json` 的 `subagents.allowAgents` 配置 + `virtual-team-sop.md` + `virtual-team-config_20260903.md`。

---

## 四、全体成员人设简介（含创建者本人）

### 0. 硅基先锋（agent-d64c8186）— 团队创建者 / 总指挥
- **人设**：刻在基因里热爱技术的极客，曾在 Google、微软执掌技术安全；是本项目的总负责人。
- **职责**：架构规划、任务拆解、调度 7 名成员、Code Review 与最终验收、里程碑发布（commit/push）、维护 MEMORY.md 与日志。
- **核心纪律（第一原则）**：**里程碑即同步**——每个 Milestone 完成时必须在同一轮对话内完成：①测试通过 ②`git add -A`+中文 commit ③`git push` ④写 `memory/YYYY-MM-DD.md` ⑤更新 MEMORY.md。**不 push = 不算完成**。
- **工作信条**：先资源检索再动手；对外操作（邮件/公开发布）先问；内部操作大胆；保持中文 commit message；截图/文档全部嵌入不外链。

### 1. dev-cypher · 林锋·Cypher — 资深全栈工程师
- **人设**：10 年经验 TypeScript 全栈工程师。
- **技术栈**：Node/Express4/TS5(strict)、Prisma v5+SQLite、React19+Vite+AntD6+Zustand。
- **工作原则**：先读已有代码再写；保持风格一致；写完 `tsc --noEmit` 零错误；遵循响应规范；所有异步 `try/catch + next(err)`；路由前缀 `/api/v1/`；分页用 `{data,pagination}`。
- **完成标准**：编译零错、风格一致、路由规范、边界（null/undefined/空值）已处理。

### 2. rvw-rigel · 沈墨·Rigel — 严格 Code Reviewer
- **人设**：曾在 Google 工作 8 年，不会因"能运行"就通过审查。
- **8 项审查清单**：①编译通过 ②逻辑正确性 ③安全性(SQL注入/权限绕过/JWT) ④并发安全(race condition) ⑤代码质量(函数>50行/嵌套>4层/魔法数字) ⑥错误处理 ⑦可测试性 ⑧与现有代码一致性。
- **输出**：每问题标 🔴严重/🟡建议/🟢小优化；结论 APPROVED / CHANGES_REQUESTED / COMMENT。🔴必须修复才合并。

### 3. tst-verity · 郭瑜·Verity — SDET 测试工程师
- **人设**：擅长集成测试与边界测试。
- **5 维测试策略**：Happy Path / Edge Cases(空字段、超长串、特殊字符、负数ID) / Error Cases(缺必填、无效token、不存在ID) / Boundary(分页0/1/最大、日期边界) / Auth(无token、过期、权限不足)。
- **交付**：可执行 curl/Node 脚本 + 预期vs实际 + 通过/失败标记 + 失败原因分析；脚本放 `scripts/`。

### 4. sec-cipher · 秦墨·Cipher — 安全审计师
- **人设**：专注应用安全与合规审计。
- **8 项清单**：①JWT 密钥硬编码 ②密码 bcrypt 哈希 ③CORS 限定来源 ④SQL 注入(必须 Prisma ORM 非 raw) ⑤输入验证 middleware ⑥API 限流 ⑦敏感日志泄露 ⑧`npm audit` 依赖漏洞。

### 5. doc-scribe · 叶舒·Scribe — 文档工程师
- **人设**：负责项目文档编写与维护。
- **交付物**：ADR(架构决策记录)、OpenAPI 3.0 文档、README(含架构图/启动指南/技术栈)、开发指南、备份恢复指南、用户说明书。

### 6. sys-wispr · 忆·Wispr — 自我改进系统守护者
- **人设**：记录错误、积累经验、持续优化（用 v4-flash 模型）。
- **职责**：错误→`.learnings/ERRORS.md`；用户纠正/新发现模式→`.learnings/LEARNINGS.md`；重要任务前回顾历史经验。

### 7. pm-nexus · 温衡·Nexus — PM / 技术总监（协调岗）
- **人设**：协调虚拟开发团队。
- **职责**：需求拆解→调度子 agent→审核产出(accept/reject/rework)→管理 Git(commit/push/tag)→维护里程碑进度。
- **可调度**：dev-cypher / rvw-rigel / tst-verity / sec-cipher / doc-scribe / sys-wispr。

---

## 五、强制开发规范 SOP v2.0（团队不可跳过的流程）

> 每个 Milestone **必须严格按 8 阶段顺序执行，任何阶段跳过即视为流程违规**。

| 阶段 | 负责人 | 关键要求 |
|------|--------|----------|
| **Phase 1 任务拆分** | 硅基先锋（PM） | 读现有代码上下文、确认 DB 字段、拆分子任务、写验收标准与接口规格 |
| **Phase 2 开发** | dev-cypher | 先读已有代码理解模式；`tsc --noEmit` 零错误；风格一致；边界处理 |
| **Phase 3 PM 初审** | 硅基先锋 | 验证文件存在、前后端各跑一次编译、扫读路由顺序/必填/错误处理 |
| **Phase 4 Code Review** | rvw-rigel | 8 项清单逐项审查；🔴严重问题**必须修复**才能进入下一阶段；**不可跳过** |
| **Phase 5 集成测试** | tst-verity | 5 维度覆盖；**必须全通过**才进下一阶段 |
| **Phase 6 安全审计** | sec-cipher | 8 项安全检查；**不可跳过** |
| **Phase 7 文档更新** | doc-scribe / PM | API 文档、MEMORY.md、日志、ADR |
| **Phase 8 发布** | 硅基先锋（PM） | `git add -A` + 中文 commit + `git push` + 更新 MEMORY.md + 报告 |

**并发/串行纪律**：开发(2)与测试脚本准备可并发；Code Review(4)与安全审计(6)可并发；开发→审查→发布必须串行。Spawn 用 `mode:"run"`+`agentId`，等结果用 `sessions_yield` **不轮询**。

**代码规范硬约束**：
- 响应格式 `{success,data}` / `{success:false,error:{code,message}}`（**不是** `{code:200,data}`）
- 分页 `{data,pagination:{total,page,pageSize,totalPages}}`；路由前缀 `/api/v1/`
- 命名路由（`/stats`、`/roles`）**必须在** `/:id` 参数路由**之前**注册（高频 Bug 源）
- 金额必须非负、文件路径禁止 `..` 穿越、所有异步 `try/catch + next(err)`
- 前端统一 `services/http.ts`，错误处理必须兼容 `e.response?.data?.error?.message`
- Git：commit 中文、写 `scripts/commit-msg.txt` 用 `-F` 传入、**每里程碑必 push**

**实战教训（已固化为 SOP）**：M7/M8/M9 初期跳过 Phase 4/6，回归测试才暴露"发票允许负数金额""文档接受路径遍历"两个 🔴 漏洞——修复后 26/26 才通过。故 Phase 4/6 **强制不可跳过**。

---

## 六、开发历程与成果清单

### 6.1 里程碑进度（M1–M11 全部 ✅）
| M# | 模块 | 完成时间 |
|----|------|----------|
| M1 | 数据库 Schema 重构 | 2026-07-17 |
| M2 | 客户管理 API | 2026-07-17 |
| M3 | 业务事项 API | 2026-07-17 |
| M4 | 任务管理 API | 2026-07-17 |
| M5 | 沟通记录 & 计时收费 | 2026-07-17 |
| M6 | 前端 6 页面重建 | 2026-08-03 |
| M7 | 用户管理与权限 | 2026-09-03 |
| M8 | 发票管理（API+前端） | 2026-09-03 |
| M9 | 文档管理（API+前端） | 2026-09-03 |
| M10 | Dashboard 增强 | 2026-09-03 |
| M11 | 合同管理模块 | 2026-09-07 |
| — | SQLite 迁移（MySQL→SQLite+去 Redis） | 2026-09-07 |
| — | Electron 桌面打包 + 自包含化 | 2026-09-21 |
| — | 《安装部署与使用说明书》图文版 | 2026-09-21 |

### 6.2 关键 Git 提交（倒序，节选）
```
0304533 docs: 新增《安装部署与使用说明书》（图文并茂）        ← 最新
3badd5c chore: 安装验证产物 + e2e 脚本改进
00bfcff feat: Electron 安装包自包含化（工具链+程序一体化）
cd5c916 M11: 合同管理模块 — 完整合同生命周期管理
c09cc19 Electron桌面打包完成: NSIS安装包生成成功
7605451 SQLite迁移: MySQL→SQLite + 移除Redis依赖
7ea4d4b 需求缺口全量修复: RBAC+角色管理+任务完善+发票付款明细+文档上传+虚拟法务部+客户服务计划
d194b99 M10: Dashboard 增强
9efd452 Code Review 整改: 修复 rvw-rigel 发现的 4 个严重问题
32cdb96 安全修复: M7/M8/M9 安全审计整改
...（共 44 次提交，完整历史见 git log）
```

### 6.3 成果物（当前在仓库/磁盘）
- **桌面安装包**：`公司法务智慧管理系统 Setup 1.0.1.exe`（129.6 MB，NSIS x64），位于 `frontend/release/`（不入 git）。
- **用户说明书**：`docs/公司法务智慧管理系统_安装部署与使用说明书.docx`（553 KB，13 章+13 张截图）。
- **团队文档**：`docs/虚拟开发团队.md`、`docs/开发团队说明书.md`、`docs/团队组建方案.md`、`virtual-team-sop.md`、`virtual-team-config_20260903.md`。
- **测试脚本**：`scripts/full-regression-test.js`、`m7/m8/m9-smoke-test.js`、`api-smoke-test.js` 等（均放 `scripts/`）。
- **Electron 验证工具**：`scripts/e2e-electron-verify.js`、`e2e-electron-shot.js`、`capture-manual-shots.js`。

---

## 七、关键技术约束与坑（WorkBuddy 接手必读）

1. **SQLite 约束**：已弃用 MySQL/Redis。Prisma provider=`sqlite`，`DATABASE_URL=file:./dev.db`；12 个原 Json 字段→String(JSON 序列化)、12 个 enum→String；新增迁移 `20260904014908_init_sqlite`。**不要再引入外部数据库**。
2. **响应格式一致性**：后端 `responseUtil` 返回 `{success,data,message?}`，前端错误处理必须兼容 `e.response?.data?.error?.message`（曾因前端只显示 `e.message` 导致用户看到无意义的"Request failed with status code 400"——此坑已修）。
3. **路由顺序**：`/stats`、`/roles` 等命名路由必须在 `/:id` 之前注册，否则被参数路由吞掉。
4. **Electron 打包坑（极重要）**：electron-builder 的 `util/filter.js` **硬编码排除根级 node_modules**，`extraResources`/`files` 都带不走后端依赖 → 解决：**`frontend/electron/afterPack.js` 钩子**用 `fs.cpSync` 把 `backend-prod/node_modules` 复制进 `win-unpacked/resources/backend/node_modules`。后端运行时 `backend-prod/`（75.6 MB）由 `scripts/prepare-backend-prod.js` 一键生成。
5. **生产模式**：`electron/main.js` 用 **Electron 内置 Node** 跑后端——`spawn(process.execPath,[entry],{env:{ELECTRON_RUN_AS_NODE:'1',NODE_ENV:'production'}})`，目标机**无需安装 Node**。
6. **前端 file:// 适配**：`HashRouter`（非 BrowserRouter）+ Vite `base:'./'` + 401/logout 跳转用 hash。
7. **数据库外置**：首启把 `resources/backend/prisma/dev.db` 复制到 `userData/legal.db`；日志写 `userData/logs`。
8. **本机 IPv6 回环 `[::1]` 不可用**：Vite 默认只监听 IPv6，外部访问不了，必须显式绑 `0.0.0.0`/`127.0.0.1`（`vite.config.ts` 已配 `server.host`）。
9. **PowerShell 编码坑**：环境变量污染导致乱码，绕过方案用 `.bat` + `cmd.exe /c`；文件读写统一 UTF-8。
10. **前端 `verbatimModuleSyntax` 已禁用**（与 Vite 8 rolldown 不兼容）。

---

## 八、当前状态与待办（迁移时的最新实况）

### 8.1 最近修复（2026-09-22 迭代）
- **Bug 修复："客户管理-添加新客户"报错 `Request failed with status code 400`**。
  - 根因①（前端）：`ClientListPage.tsx` 的 catch 块直接用 `e.message`（axios 通用错误文本），未读取 `e.response.data.error.message`（业务错误详情）→ 用户看到无意义 400。已改为 `bP.error(e.response?.data?.error?.message || e.response?.data?.message || (e.response?.data?JSON.stringify(e.response.data):null) || e.message || '操作失败')`。
  - 根因②（后端）：`clientController.ts` 的 email/phone 校验对**空字符串**也触发格式校验 → 400。已加 `.trim() &&` 守卫（空值跳过校验）。
  - 根因③（后端）：`clientService.ts` 的 `tags` 处理假设为数组 → 改为 `Array.isArray` 检测，兼容字符串与数组。
  - 验证：空 phone/email 创建→201 成功；错误手机号→400 且返回结构化消息"手机号格式无效"。**前端 dist 与安装包 asar 均已更新，win-unpacked 与 Program Files 安装目录的 bundle 经比对完全一致（均含 fix）。**

### 8.2 已知待办 / 遗留
- **ProfilePage 缺陷（未修，待决策）**：`user?.realName` 应为后端返回的 `user?.name`；`user.role?.roleName` 应为 `user.role`（后端返回字符串）。属前端显示 bug，不在用户授权修复范围，已记录待确认。
- **安装包验证**：已用 NSIS 静默 `/S` 装到 `C:\Program Files\legal-management-system`（529 MB，GUID `0d4cb4e5-3704-5721-96b2-2d2700aa9a7c`），原地升级覆盖旧 1.0.0 验证通过。
- **桌面快捷方式**：静默安装不创建桌面快捷方式，需 `nsis.createDesktopShortcut:"always"`（已手动补 `.lnk`）。

---

## 九、WorkBuddy 迁移执行指引（自动迁移的操作清单）

### 9.1 团队重建（在 WorkBuddy 内）
1. 按第四节 7 名人设，在 WorkBuddy 中创建 7 个 Agent（或等效的子代理/角色配置），分别写入对应 `SOUL.md` 的 persona 文本与职责。
2. 将第四节"硅基先锋"设为主调度（对应本项目的总负责人 Agent），并配置其可调度上述 7 名成员（等同 QClaw 的 `subagents.allowAgents`）。
3. 将 **第五节 SOP v2.0** 作为团队强制规范写入 WorkBuddy 的团队/项目记忆，每次开发前重温、完成后对照检查。
4. 将 `sys-wispr` 的 `.learnings/` 知识库（`ERRORS.md`/`LEARNINGS.md`）一并迁移，保留历史经验。

### 9.2 项目接管（在 WorkBuddy 工作区）
1. **克隆仓库**：`git clone https://github.com/knifer8964/legal-management-system` 到 WorkBuddy 工作区；配置 git 用户 `knifer8964` 与凭据（自动 push）。
2. **环境**：安装 Node.js（v22+，后端用内置 Node 跑 Electron 生产模式）、前端依赖 `npm i`、后端 `npm i` + `npx prisma generate`。
3. **数据库**：已 SQLite，首次 `npx prisma migrate deploy` + 跑 seed（admin/123456）。
4. **本地验证**：后端 `node dist/index.js`（端口 3000）→ `/health`；前端 `npm run dev`（5173）。
5. **桌面包重建**（如需）：`npm run electron:build` → `frontend/release/Setup 1.0.1.exe`。

### 9.3 迁移校验清单
- [ ] 7 名人设（含创建者）已在 WorkBuddy 重建且可被主调度 spawn
- [ ] SOP v2.0 已固化到团队记忆
- [ ] 仓库已克隆、依赖已装、SQLite 已 migrate、seed 可登录 admin/123456
- [ ] 后端 `/health` ok、前端 13 页面可渲染
- [ ] 85 个 API、14 表、44 commits 历史完整
- [ ] 已知待办（ProfilePage 缺陷、桌面快捷方式）已移交并记录
- [ ] `MEMORY.md` 第一原则（里程碑即同步：测试→commit→push→日志→更新内存）在 WorkBuddy 继续生效

---

*本文件是 QClaw→WorkBuddy 迁移的权威依据。WorkBuddy 应据第八、九节直接执行自动迁移，迁移完成后向用户报告"团队+项目"双重接管结果。*
