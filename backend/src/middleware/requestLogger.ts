// 公司法务智慧管理系统 - 请求追踪日志中间件
// 功能: 请求ID生成、响应时间统计、请求/响应日志

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../index';

// 扩展 Request 类型
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      startTime?: number;
    }
  }
}

// 生成请求 ID 并记录开始时间
export function requestTracker(req: Request, res: Response, next: NextFunction) {
  req.requestId = uuidv4();
  req.startTime = Date.now();

  // 将请求ID写入响应头，方便前端追踪
  res.setHeader('X-Request-Id', req.requestId);

  next();
}

// 请求/响应日志中间件
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const { method, originalUrl, ip, requestId } = req;
  const userAgent = req.get('user-agent') || '';

  // 记录请求
  logger.info('→ 请求', {
    requestId,
    method,
    url: originalUrl,
    ip,
    userAgent: userAgent.substring(0, 200),
    userId: req.user?.userId,
  });

  // 捕获响应完成
  const originalEnd = res.end;
  res.end = function (this: Response, ...args: any[]) {
    const duration = Date.now() - (req.startTime || Date.now());

    // 记录响应
    logger.info('← 响应', {
      requestId,
      method,
      url: originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.userId,
    });

    // 慢请求警告（>2秒）
    if (duration > 2000) {
      logger.warn('⚠ 慢请求', {
        requestId,
        method,
        url: originalUrl,
        duration: `${duration}ms`,
        userId: req.user?.userId,
      });
    }

    (originalEnd as any).apply(res, args);
  } as any;

  next();
}

// 请求体日志（仅开发环境，脱敏）
export function requestBodyLogger(req: Request, _res: Response, next: NextFunction) {
  if (process.env.NODE_ENV === 'development' && req.body) {
    const sanitized = sanitizeBody(req.body);
    logger.debug('请求体', {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      body: sanitized,
    });
  }
  next();
}

// 脱敏处理：移除密码、令牌等敏感字段
function sanitizeBody(body: any): any {
  if (!body || typeof body !== 'object') return body;

  const sensitiveFields = ['password', 'passwordHash', 'token', 'apiKey', 'apiKeyEncrypted', 'secret'];
  const sanitized = { ...body };

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '***REDACTED***';
    }
  }

  return sanitized;
}
