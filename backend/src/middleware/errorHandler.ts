// 公司法务智慧管理系统 - 统一错误处理中间件
// 功能: 捕获所有错误并返回标准化响应

import { Request, Response, NextFunction } from 'express';
import { logger } from '../index';

// 自定义业务错误类
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: any;

  constructor(statusCode: number, code: string, message: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// 预定义错误工厂
export class Errors {
  static badRequest(message: string, details?: any) {
    return new AppError(400, 'BAD_REQUEST', message, details);
  }

  static unauthorized(message: string = '未认证，请先登录') {
    return new AppError(401, 'UNAUTHORIZED', message);
  }

  static forbidden(message: string = '权限不足') {
    return new AppError(403, 'FORBIDDEN', message);
  }

  static notFound(resource: string = '资源') {
    return new AppError(404, 'NOT_FOUND', `${resource}不存在`);
  }

  static conflict(message: string) {
    return new AppError(409, 'CONFLICT', message);
  }

  static validationFailed(details: any) {
    return new AppError(422, 'VALIDATION_FAILED', '参数验证失败', details);
  }

  static internal(message: string = '服务器内部错误') {
    return new AppError(500, 'INTERNAL_ERROR', message);
  }
}

// Prisma 错误映射
function mapPrismaError(err: any): AppError {
  // P2002: 唯一约束冲突
  if (err.code === 'P2002') {
    const target = err.meta?.target?.join(', ') || '字段';
    return new AppError(409, 'CONFLICT', `${target}已存在`);
  }
  // P2025: 记录不存在
  if (err.code === 'P2025') {
    return new AppError(404, 'NOT_FOUND', '记录不存在');
  }
  // P2003: 外键约束失败
  if (err.code === 'P2003') {
    return new AppError(400, 'BAD_REQUEST', '关联记录不存在');
  }
  // P2014: 关系违规
  if (err.code === 'P2014') {
    return new AppError(400, 'BAD_REQUEST', '操作违反关联约束');
  }

  return new AppError(500, 'DB_ERROR', '数据库操作失败');
}

// 全局错误处理中间件
export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  // 已处理的业务错误
  if (err instanceof AppError) {
    logger.warn('业务错误', {
      code: err.code,
      statusCode: err.statusCode,
      message: err.message,
      path: req.path,
      method: req.method,
    });

    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details && { details: err.details }),
      },
      timestamp: new Date().toISOString(),
    });
  }

  // Prisma 错误
  if (err.name === 'PrismaClientKnownRequestError' || (err as any).code?.startsWith('P2')) {
    const appErr = mapPrismaError(err);
    logger.error('数据库错误', { error: err.message, code: (err as any).code });

    return res.status(appErr.statusCode).json({
      success: false,
      error: {
        code: appErr.code,
        message: appErr.message,
      },
      timestamp: new Date().toISOString(),
    });
  }

  // Joi 验证错误
  if ((err as any).isJoi) {
    const details = (err as any).details.map((d: any) => ({
      field: d.path.join('.'),
      message: d.message,
    }));

    logger.warn('参数验证错误', { details, path: req.path });
    return res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_FAILED',
        message: '参数验证失败',
        details,
      },
      timestamp: new Date().toISOString(),
    });
  }

  // JWT 错误
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: '令牌无效',
      },
      timestamp: new Date().toISOString(),
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: '令牌已过期',
      },
      timestamp: new Date().toISOString(),
    });
  }

  // 未知错误
  logger.error('未处理错误', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message,
    },
    timestamp: new Date().toISOString(),
  });
}

// 404 处理中间件
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `接口不存在: ${req.method} ${req.path}`,
    },
    timestamp: new Date().toISOString(),
  });
}
