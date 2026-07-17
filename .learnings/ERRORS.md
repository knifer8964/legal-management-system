# Errors

Command failures and integration errors.

---

## 2026-07-17

### error: MySQL 连接失败 (P1001)
- 错误: `Can't reach database server at 127.0.0.1:3306`
- 原因: MySQL 未启动（系统休眠后自动停止）
- 解决: `Start-Process mysqld.exe --defaults-file=C:\my.ini`
- 预防: 启动脚本中加入 MySQL 启动逻辑

### error: Git push 凭证错误
- 错误: `could not read Username for 'https://github.com'`
- 原因: credential.helper 未配置为 store
- 解决: `git config credential.helper store` + `~/.git-credentials`
- 预防: 项目初始化时配置

### error: tsx.cmd 后台进程路径解析失败
- 错误: tsx 在后台启动时找不到正确路径
- 解决: 改用 `tsc` 编译 + `node dist/index.js` 直接运行
- 预防: 优先使用编译后 JavaScript 启动
