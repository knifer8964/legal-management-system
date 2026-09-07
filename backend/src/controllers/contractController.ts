// =====================================================
// 合同管理控制器 - HTTP 请求处理
// =====================================================

import { Request, Response, NextFunction } from 'express';
import contractService from '../services/contractService';
import { success, Errors } from '../utils/responseUtil';
import { ContractStatus, ContractType } from '../types/api';

export class ContractController {
  // =====================================================
  // 创建合同
  // POST /api/v1/contracts
  // =====================================================
  async create(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { title, contractType, clientId } = req.body;

      if (!title || !contractType || !clientId) {
        return Errors.badRequest(res, '合同标题、合同类型和客户ID为必填');
      }

      if (!Object.values(ContractType).includes(contractType)) {
        return Errors.badRequest(res, '合同类型无效');
      }

      return success(res, await contractService.create(req.body, req.user!.userId), '合同创建成功', 201);
    } catch (err: any) {
      return next(err);
    }
  }

  // =====================================================
  // 获取合同列表
  // GET /api/v1/contracts
  // =====================================================
  async findAll(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const params = {
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 20,
        sortBy: (req.query.sortBy as string) || 'createdAt',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
        clientId: req.query.clientId ? parseInt(req.query.clientId as string) : undefined,
        matterId: req.query.matterId ? parseInt(req.query.matterId as string) : undefined,
        contractType: req.query.contractType as ContractType | undefined,
        status: req.query.status as ContractStatus | undefined,
        search: req.query.search as string,
      };
      return success(res, await contractService.findAll(params));
    } catch (err: any) {
      return next(err);
    }
  }

  // =====================================================
  // 获取合同统计
  // GET /api/v1/contracts/stats
  // =====================================================
  async getStats(_req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      return success(res, await contractService.getStats());
    } catch (err: any) {
      return next(err);
    }
  }

  // =====================================================
  // 获取合同详情
  // GET /api/v1/contracts/:id
  // =====================================================
  async findById(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return Errors.badRequest(res, '无效的合同ID');

      const contract = await contractService.findById(id);
      if (!contract) return Errors.notFound(res, '合同不存在');

      return success(res, contract);
    } catch (err: any) {
      return next(err);
    }
  }

  // =====================================================
  // 更新合同
  // PUT /api/v1/contracts/:id
  // =====================================================
  async update(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return Errors.badRequest(res, '无效的合同ID');

      return success(res, await contractService.update(id, req.body), '合同更新成功');
    } catch (err: any) {
      return next(err);
    }
  }

  // =====================================================
  // 删除合同
  // DELETE /api/v1/contracts/:id
  // =====================================================
  async delete(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return Errors.badRequest(res, '无效的合同ID');

      await contractService.delete(id);
      return success(res, null, '合同删除成功');
    } catch (err: any) {
      return next(err);
    }
  }

  // =====================================================
  // 更新合同状态
  // PUT /api/v1/contracts/:id/status
  // =====================================================
  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return Errors.badRequest(res, '无效的合同ID');

      const { status } = req.body;
      if (!status || !Object.values(ContractStatus).includes(status)) {
        return Errors.badRequest(res, '合同状态无效');
      }

      return success(res, await contractService.updateStatus(id, req.body, req.user!.userId), '合同状态更新成功');
    } catch (err: any) {
      return next(err);
    }
  }

  // =====================================================
  // 获取合同操作时间线
  // GET /api/v1/contracts/:id/timeline
  // =====================================================
  async getTimeline(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return Errors.badRequest(res, '无效的合同ID');

      return success(res, await contractService.getTimeline(id));
    } catch (err: any) {
      return next(err);
    }
  }
}

export default new ContractController();
