// =====================================================
// 业务事项控制器 - HTTP 请求处理
// =====================================================

import { Request, Response, NextFunction } from 'express';
import matterService from '../services/matterService';
import { success, Errors } from '../utils/responseUtil';
import { CreateMatterDto, MatterQueryParams } from '../types/api';

export class MatterController {
  // =====================================================
  // 创建业务事项
  // =====================================================
  async create(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const data: CreateMatterDto = req.body;

      if (!data.matterType || !data.title || !data.clientId || !data.feeType) {
        return Errors.badRequest(res, '业务类型、标题、客户ID和费用类型为必填');
      }

      const matter = await matterService.create(data, req.user!.userId);
      return success(res, matter, '业务创建成功', 201);
    } catch (err: any) {
      return next(err);
    }
  }

  // =====================================================
  // 获取业务列表
  // =====================================================
  async findAll(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const params: MatterQueryParams = {
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 20,
        sortBy: (req.query.sortBy as string) || 'createdAt',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
        clientId: req.query.clientId ? parseInt(req.query.clientId as string) : undefined,
        matterType: req.query.matterType as any,
        status: req.query.status as any,
        priority: req.query.priority as any,
        assigneeId: req.query.assigneeId ? parseInt(req.query.assigneeId as string) : undefined,
        search: req.query.search as string,
      };

      const result = await matterService.findAll(params);
      return success(res, result);
    } catch (err: any) {
      return next(err);
    }
  }

  // =====================================================
  // 获取业务统计
  // =====================================================
  async getStats(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const assigneeId = req.query.assigneeId ? parseInt(req.query.assigneeId as string) : undefined;
      const stats = await matterService.getStats({ assigneeId });
      return success(res, stats);
    } catch (err: any) {
      return next(err);
    }
  }

  // =====================================================
  // 获取业务详情
  // =====================================================
  async findById(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return Errors.badRequest(res, '无效的业务ID');

      const matter = await matterService.getById(id);
      if (!matter) return Errors.notFound(res, '业务不存在');

      return success(res, matter);
    } catch (err: any) {
      return next(err);
    }
  }

  // =====================================================
  // 通过编号查找业务
  // =====================================================
  async findByNo(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { no } = req.params;
      // 用 findAll + search 查找
      const result = await matterService.findAll({ search: no, pageSize: 1 });
      if (result.data.length === 0) {
        return Errors.notFound(res, '业务不存在');
      }
      return success(res, result.data[0]);
    } catch (err: any) {
      return next(err);
    }
  }

  // =====================================================
  // 更新业务
  // =====================================================
  async update(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return Errors.badRequest(res, '无效的业务ID');

      const matter = await matterService.update(id, req.body, req.user!.userId);
      return success(res, matter, '业务更新成功');
    } catch (err: any) {
      return next(err);
    }
  }

  // =====================================================
  // 更新业务状态
  // =====================================================
  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return Errors.badRequest(res, '无效的业务ID');

      const { status } = req.body;
      if (!status) return Errors.badRequest(res, '状态不能为空');

      const matter = await matterService.updateStatus(id, status, req.user!.userId);
      return success(res, matter, '状态更新成功');
    } catch (err: any) {
      return next(err);
    }
  }

  // =====================================================
  // 删除业务
  // =====================================================
  async delete(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return Errors.badRequest(res, '无效的业务ID');

      await matterService.delete(id);
      return success(res, null, '业务删除成功');
    } catch (err: any) {
      return next(err);
    }
  }

  // =====================================================
  // 获取业务时间线
  // =====================================================
  async getTimeline(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const matterId = parseInt(req.params.id);
      if (isNaN(matterId)) return Errors.badRequest(res, '无效的业务ID');

      const timeline = await matterService.getTimeline(matterId);
      return success(res, timeline);
    } catch (err: any) {
      return next(err);
    }
  }
}

export default new MatterController();
