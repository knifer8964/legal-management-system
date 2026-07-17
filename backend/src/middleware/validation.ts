// 公司法务智慧管理系统 - 请求验证中间件
// 功能: 基于 Joi 的请求参数校验

import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { Errors } from './errorHandler';

interface ValidationSchema {
  body?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
}

// 通用验证规则
export const commonSchemas = {
  id: Joi.number().integer().positive().required(),
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(20),
  keyword: Joi.string().allow('').max(200),
  dateRange: Joi.object({
    start: Joi.date().iso(),
    end: Joi.date().iso().greater(Joi.ref('start')),
  }),
  sortField: Joi.string().max(50),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
};

// 请求验证中间件工厂
export function validate(schema: ValidationSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const errors: Array<{ field: string; message: string }> = [];

    // 验证 body
    if (schema.body) {
      const { error, value } = schema.body.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
      });
      if (error) {
        error.details.forEach((d) => {
          errors.push({
            field: d.path.join('.'),
            message: d.message,
          });
        });
      } else {
        req.body = value;
      }
    }

    // 验证 query
    if (schema.query) {
      const { error, value } = schema.query.validate(req.query, {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
      });
      if (error) {
        error.details.forEach((d) => {
          errors.push({
            field: `query.${d.path.join('.')}`,
            message: d.message,
          });
        });
      } else {
        req.query = value as any;
      }
    }

    // 验证 params
    if (schema.params) {
      const { error, value } = schema.params.validate(req.params, {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
      });
      if (error) {
        error.details.forEach((d) => {
          errors.push({
            field: `params.${d.path.join('.')}`,
            message: d.message,
          });
        });
      } else {
        req.params = value;
      }
    }

    if (errors.length > 0) {
      return next(Errors.validationFailed(errors));
    }

    next();
  };
}

// ===== 当前系统使用的验证 Schema =====

export const authSchemas = {
  login: {
    body: Joi.object({
      username: Joi.string().alphanum().min(3).max(50).required()
        .messages({
          'string.alphanum': '用户名只能包含字母和数字',
          'string.min': '用户名至少3个字符',
          'any.required': '用户名不能为空',
        }),
      password: Joi.string().min(6).max(100).required()
        .messages({
          'string.min': '密码至少6个字符',
          'any.required': '密码不能为空',
        }),
    }),
  },
  register: {
    body: Joi.object({
      username: Joi.string().alphanum().min(3).max(50).required(),
      password: Joi.string().min(6).max(100).required(),
      realName: Joi.string().min(2).max(100).required(),
      email: Joi.string().email().allow(null, ''),
      phone: Joi.string().pattern(/^1[3-9]\d{9}$/).allow(null, ''),
      roleId: Joi.number().integer().positive().required(),
      department: Joi.string().max(100).allow(null, ''),
    }),
  },
  changePassword: {
    body: Joi.object({
      oldPassword: Joi.string().required(),
      newPassword: Joi.string().min(6).max(100).required()
        .messages({ 'string.min': '新密码至少6个字符' }),
    }),
  },
};
