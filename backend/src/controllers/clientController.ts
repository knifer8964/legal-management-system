// =====================================================
// 客户管理控制器 - HTTP 请求处理
// =====================================================

import { Request, Response, NextFunction } from 'express';
import clientService from '../services/clientService';
import { success, Errors } from '../utils/responseUtil';
import { CreateClientDto, UpdateClientDto, ClientQueryParams } from '../types/api';

export class ClientController {
  // =====================================================
  // 创建客户
  // POST /api/v1/clients
  // =====================================================
  async create(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const data: CreateClientDto = req.body;

      // 基础验证
      if (!data.clientType || !data.name) {
        return Errors.badRequest(res, '客户类型和名称不能为空');
      }

      if (!['PERSONAL', 'ENTERPRISE'].includes(data.clientType)) {
        return Errors.badRequest(res, '客户类型无效');
      }

      if (data.email && !this.isValidEmail(data.email)) {
        return Errors.badRequest(res, '邮箱格式无效');
      }

      if (data.phone && !this.isValidPhone(data.phone)) {
        return Errors.badRequest(res, '手机号格式无效');
      }

      const client = await clientService.create(data);
      return success(res, client, '客户创建成功', 201);
    } catch (err: any) {
      return next(err);
    }
  }

  // =====================================================
  // 获取客户列表
  // GET /api/v1/clients
  // =====================================================
  async findAll(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const params: ClientQueryParams = {
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 20,
        sortBy: (req.query.sortBy as string) || 'createdAt',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
        clientType: req.query.clientType as any,
        status: req.query.status as any,
        search: req.query.search as string,
        servicePlan: req.query.servicePlan as string,
        tags: req.query.tags as string,
      };

      const result = await clientService.findAll(params);
      return success(res, result);
    } catch (err: any) {
      return next(err);
    }
  }

  // =====================================================
  // 获取客户详情
  // GET /api/v1/clients/:id
  // =====================================================
  async findById(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return Errors.badRequest(res, '无效的客户ID');
      }

      const client = await clientService.getById(id);

      if (!client) {
        return Errors.notFound(res, '客户不存在');
      }

      return success(res, client);
    } catch (err: any) {
      return next(err);
    }
  }

  // =====================================================
  // 更新客户
  // PUT /api/v1/clients/:id
  // =====================================================
  async update(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return Errors.badRequest(res, '无效的客户ID');
      }

      const data: UpdateClientDto = req.body;

      // 验证
      if (data.email && !this.isValidEmail(data.email)) {
        return Errors.badRequest(res, '邮箱格式无效');
      }

      if (data.phone && !this.isValidPhone(data.phone)) {
        return Errors.badRequest(res, '手机号格式无效');
      }

      const client = await clientService.update(id, data);
      return success(res, client, '客户更新成功');
    } catch (err: any) {
      return next(err);
    }
  }

  // =====================================================
  // 删除客户
  // DELETE /api/v1/clients/:id
  // =====================================================
  async delete(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return Errors.badRequest(res, '无效的客户ID');
      }

      await clientService.delete(id);
      return success(res, null, '客户删除成功');
    } catch (err: any) {
      if (err.message.includes('无法删除')) {
        return Errors.badRequest(res, err.message);
      }
      return next(err);
    }
  }

  // =====================================================
  // 获取客户统计
  // GET /api/v1/clients/stats
  // =====================================================
  async getStats(_req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const stats = await clientService.getStats();
      return success(res, stats);
    } catch (err: any) {
      return next(err);
    }
  }

  // =====================================================
  // 获取客户业务列表
  // GET /api/v1/clients/:id/matters
  // =====================================================
  async getClientMatters(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const clientId = parseInt(req.params.id);

      if (isNaN(clientId)) {
        return Errors.badRequest(res, '无效的客户ID');
      }

      const result = await clientService.getClientMatters(clientId, {
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 20,
      });

      return success(res, result);
    } catch (err: any) {
      return next(err);
    }
  }

  // =====================================================
  // 辅助方法
  // =====================================================
  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private isValidPhone(phone: string): boolean {
    return /^1[3-9]\d{9}$/.test(phone);
  }
}

export default new ClientController();
