# Learnings

Corrections, insights, and knowledge gaps captured during development.

**Categories**: correction | insight | knowledge_gap | best_practice

---

## 2026-07-17

### insight: MySQL 连接会因为系统休眠断开
- 每次恢复开发前需检查 MySQL 是否运行
- 解决方案: `法务系统-启动.bat` 已包含 MySQL 启动逻辑

### insight: PowerShell 环境变量污染导致乱码
- 现象: `'锟藉彉閲忔敞鍏ワ細'` 乱码
- 绕过: 使用 `.bat` 文件 + `cmd.exe /c` 启动
- 未根治, 后续需查 PowerShell profile

### best_practice: 里程碑即同步
- 每个 Milestone 完成后: 测试 → commit → push → 日志 → 更新 MEMORY.md
- 这是不可跳过的刚性流程

### best_practice: 凭据存储
- Git 凭据存储在 `~/.git-credentials`
- credential.helper 设为 store 确保自动认证
- PAT (Personal Access Token) 替代密码

### knowledge_gap: 并发竞态条件
- M5 计时收费 `stop()` 没有数据库行级锁
- 两个并发请求可能同时 stop 同一条记录
- 后续需评估是否需要 `SELECT ... FOR UPDATE`

### knowledge_gap: API 限流
- 当前没有 rate limiting
- 生产环境需要 express-rate-limit 中间件

### knowledge_gap: JWT Secret 管理
- 当前硬编码在 backend/.env
- 生产环境应使用环境变量或密钥管理服务
