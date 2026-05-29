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

// ===== 业务验证 Schema =====

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

export const contractSchemas = {
  create: {
    body: Joi.object({
      contractNo: Joi.string().max(50).allow(null, ''), // 可选，不传则自动生成
      title: Joi.string().max(255).required(),
      partyA: Joi.string().max(255).required(),
      partyB: Joi.string().max(255).required(),
      contractType: Joi.string().max(50).allow(null, ''),
      amount: Joi.number().precision(2).positive().allow(null),
      signDate: Joi.date().iso().allow(null),
      effectiveDate: Joi.date().iso().allow(null),
      expiryDate: Joi.date().iso().allow(null),
      content: Joi.string().allow(null, ''),
    }),
  },
  update: {
    params: Joi.object({ id: commonSchemas.id }),
    body: Joi.object({
      title: Joi.string().max(255),
      partyA: Joi.string().max(255),
      partyB: Joi.string().max(255),
      contractType: Joi.string().max(50).allow(null, ''),
      amount: Joi.number().precision(2).positive().allow(null),
      signDate: Joi.date().iso().allow(null),
      effectiveDate: Joi.date().iso().allow(null),
      expiryDate: Joi.date().iso().allow(null),
      content: Joi.string().allow(null, ''),
      status: Joi.string().valid('DRAFT', 'REVIEWING', 'SIGNED', 'EXECUTING', 'COMPLETED', 'TERMINATED'),
    }).min(1),
  },
  list: {
    query: Joi.object({
      page: commonSchemas.page,
      pageSize: commonSchemas.pageSize,
      keyword: commonSchemas.keyword,
      status: Joi.string().valid('DRAFT', 'REVIEWING', 'SIGNED', 'EXECUTING', 'COMPLETED', 'TERMINATED'),
      contractType: Joi.string().max(50),
      sortField: commonSchemas.sortField,
      sortOrder: commonSchemas.sortOrder,
    }),
  },
  approve: {
    params: Joi.object({ id: commonSchemas.id }),
    body: Joi.object({
      status: Joi.string().valid('APPROVED', 'REJECTED').required(),
      comment: Joi.string().max(2000).allow(null, ''),
    }),
  },
};

export const caseSchemas = {
  create: {
    body: Joi.object({
      caseNo: Joi.string().max(50).required(),
      title: Joi.string().max(255).required(),
      caseType: Joi.string().valid('CIVIL', 'ADMINISTRATIVE', 'CRIMINAL', 'ARBITRATION').required(),
      plaintiff: Joi.string().allow(null, ''),
      defendant: Joi.string().allow(null, ''),
      court: Joi.string().max(255).allow(null, ''),
      filingDate: Joi.date().iso().allow(null),
      description: Joi.string().allow(null, ''),
      assignedTo: Joi.number().integer().positive().allow(null),
    }),
  },
  list: {
    query: Joi.object({
      page: commonSchemas.page,
      pageSize: commonSchemas.pageSize,
      keyword: commonSchemas.keyword,
      status: Joi.string().valid('PENDING', 'TRIAL', 'APPEAL', 'ENFORCEMENT', 'CLOSED'),
      caseType: Joi.string().valid('CIVIL', 'ADMINISTRATIVE', 'CRIMINAL', 'ARBITRATION'),
      sortField: commonSchemas.sortField,
      sortOrder: commonSchemas.sortOrder,
    }),
  },
};

export const agentSchemas = {
  create: {
    body: Joi.object({
      agentName: Joi.string().max(100).required(),
      agentType: Joi.string().valid('HUMAN', 'AI', 'EXPERT').required(),
      apiEndpoint: Joi.string().max(500).allow(null, ''),
      apiKeyEncrypted: Joi.string().max(500).allow(null, ''),
      capabilities: Joi.object().allow(null),
    }),
  },
  update: {
    params: Joi.object({ id: commonSchemas.id }),
    body: Joi.object({
      agentName: Joi.string().max(100),
      agentType: Joi.string().valid('HUMAN', 'AI', 'EXPERT'),
      apiEndpoint: Joi.string().max(500).allow(null, ''),
      apiKeyEncrypted: Joi.string().max(500).allow(null, ''),
      capabilities: Joi.object().allow(null),
      status: Joi.string().valid('ACTIVE', 'INACTIVE', 'BUSY'),
    }).min(1),
  },
};

export const knowledgeBaseSchemas = {
  create: {
    body: Joi.object({
      name: Joi.string().max(200).required(),
      description: Joi.string().allow(null, ''),
      kbType: Joi.string().valid('PRIVATE', 'TEAM', 'PUBLIC').default('PRIVATE'),
      config: Joi.object().allow(null),
    }),
  },
  uploadDocument: {
    params: Joi.object({ id: commonSchemas.id }),
  },
};

export const orderSchemas = {
  create: {
    body: Joi.object({
      customerName: Joi.string().max(100).required(),
      customerPhone: Joi.string().max(20).allow(null, ''),
      customerEmail: Joi.string().email().max(100).allow(null, ''),
      productId: Joi.number().integer().positive().required(),
      assignedAgentId: Joi.number().integer().positive().allow(null),
    }),
  },
};
