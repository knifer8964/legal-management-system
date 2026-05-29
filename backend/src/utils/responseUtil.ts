// 公司法务智慧管理系统 - 统一响应格式工具
// 确保所有 API 返回一致的响应结构

import { Response } from 'express';

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: PaginationMeta;
}

/**
 * 成功响应
 */
export function success<T>(res: Response, data: T, message?: string, statusCode: number = 200): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };
  if (message) response.message = message;
  return res.status(statusCode).json(response);
}

/**
 * 成功响应（带分页）
 */
export function successWithPagination<T>(res: Response, data: T, pagination: PaginationMeta, message?: string): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
    pagination,
  };
  if (message) response.message = message;
  return res.json(response);
}

/**
 * 创建成功响应 (201)
 */
export function created<T>(res: Response, data: T, message?: string): Response {
  return success(res, data, message, 201);
}

/**
 * 错误响应
 */
export function error(res: Response, statusCode: number, message: string, errorCode?: string): Response {
  return res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode || `HTTP_${statusCode}`,
      message,
    },
  });
}

/**
 * 常用错误快捷方法
 */
export const Errors = {
  badRequest: (res: Response, message: string = '请求参数错误') => error(res, 400, message, 'BAD_REQUEST'),
  unauthorized: (res: Response, message: string = '未授权，请先登录') => error(res, 401, message, 'UNAUTHORIZED'),
  forbidden: (res: Response, message: string = '权限不足') => error(res, 403, message, 'FORBIDDEN'),
  notFound: (res: Response, message: string = '资源不存在') => error(res, 404, message, 'NOT_FOUND'),
  conflict: (res: Response, message: string = '资源冲突') => error(res, 409, message, 'CONFLICT'),
  internal: (res: Response, message: string = '服务器内部错误') => error(res, 500, message, 'INTERNAL_ERROR'),
};
