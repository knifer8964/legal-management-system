# TypeScript 编译错误修复总结

## 任务
修复 `legal-management-system/backend` 的 TypeScript 编译错误，最终 `npx tsc --noEmit` 确认 **0 errors**。

## 修复的文件

### 路由层
| 文件 | 修复内容 |
|------|---------|
| `src/routes/agentRoutes.ts` | `authenticate`/`authorize` → `authenticateToken`/`checkPermission` |
| `src/routes/knowledgeBaseRoutes.ts` | 同上；移除未使用的 `checkPermission` import |
| `src/routes/contractRoutes.ts` | `req.file` → `(req as any).file`（Multer 类型扩展）；upload handler 加 `return` |
| `src/routes/authRoutes.ts` | 移除未使用的 `Errors` import；修复 `jwt.default.sign` → `jwt.sign`；`_req` 变量 |

### 控制器层
| 文件 | 修复内容 |
|------|---------|
| `src/controllers/authController.ts` | `UserStatus` 枚举值小写→大写 `INACTIVE`/`LOCKED`；`jwt.sign` 超时类型问题（`expiresIn: '7d'`）；catch 块加 `return res.status(500)`；jwt.verify callback 后加 `return`；async 函数末尾加 `return;` |
| `src/controllers/contractController.ts` | 所有枚举值大写 `DRAFT`/`REVIEWING`/`SIGNED`/`PENDING`/`APPROVED`/`REJECTED`；`contractStatus` 变量加 `as any`；移除未使用的 `approvals` 变量 |
| `src/controllers/agentController.ts` | TS7030: catch 块 `next(err)` → `return next(err)` |
| `src/controllers/knowledgeBaseController.ts` | TS7030 同上；移除未使用的 `filePath` 变量 |

### 中间件层
| 文件 | 修复内容 |
|------|---------|
| `src/middleware/authMiddleware.ts` | jwt.verify callback 后加 `return`；checkPermission 包装函数 catch 加 `return` |
| `src/middleware/errorHandler.ts` | `mapPrismaError` 已有的 `: AppError` 返回类型保留；unknown error 的 `res.json` 前加 `return` |
| `src/middleware/requestLogger.ts` | `(originalEnd as any).apply(res, args)` |
| `src/middleware/validation.ts` | `res` 参数 → `_res` |

### 入口和其他
| 文件 | 修复内容 |
|------|---------|
| `src/index.ts` | 移除未使用的 `NextFunction` import；health check `req` → `_req` |

### 依赖安装
```bash
npm install --save-dev @types/multer
```

## 关键技术点
- **TS7030（Not all code paths return a value）** 的根本解法不是 `Promise<void>`（async 函数不允许 void），而是：
  1. 同步函数加 `: void` 返回类型
  2. async 函数：在所有分支（包括 try 块正常结束位置）加 `return;` 语句
  3. 嵌套回调（jwt.verify）：在 `next()` 后加 `return;`
  4. catch 块：`next(err)` → `return next(err)` 或 `return res.status(500).json(...)`

## 验证结果
```
npx tsc --noEmit
EXIT: 0   ← 0 errors, 0 warnings
```