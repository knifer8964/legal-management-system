// =====================================================
// 任务管理控制器 - HTTP 请求处理
// =====================================================

import { Request, Response, NextFunction } from 'express';
import taskService from '../services/taskService';
import { success, Errors } from '../utils/responseUtil';

export class TaskController {
  // =====================================================
  // 创建任务
  // =====================================================
  async create(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { title } = req.body;
      if (!title) return Errors.badRequest(res, '任务标题不能为空');

      const task = await taskService.create(req.body, req.user!.userId);
      return success(res, task, '任务创建成功', 201);
    } catch (err: any) {
      return next(err);
    }
  }

  // =====================================================
  // 任务列表
  // =====================================================
  async findAll(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const params = {
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 20,
        sortBy: (req.query.sortBy as string) || 'dueDate',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'asc',
        matterId: req.query.matterId ? parseInt(req.query.matterId as string) : undefined,
        userId: req.query.userId ? parseInt(req.query.userId as string) : undefined,
        status: req.query.status as any,
        priority: req.query.priority as any,
        search: req.query.search as string,
        overdue: req.query.overdue === 'true',
      };

      const result = await taskService.findAll(params);
      return success(res, result);
    } catch (err: any) {
      return next(err);
    }
  }

  // =====================================================
  // 任务统计
  // =====================================================
  async getStats(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const stats = await taskService.getStats(userId);
      return success(res, stats);
    } catch (err: any) {
      return next(err);
    }
  }

  // =====================================================
  // 任务详情
  // =====================================================
  async findById(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return Errors.badRequest(res, '无效的任务ID');

      const task = await taskService.getById(id);
      if (!task) return Errors.notFound(res, '任务不存在');

      return success(res, task);
    } catch (err: any) {
      return next(err);
    }
  }

  // =====================================================
  // 更新任务
  // =====================================================
  async update(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return Errors.badRequest(res, '无效的任务ID');

      const task = await taskService.update(id, req.body);
      return success(res, task, '任务更新成功');
    } catch (err: any) {
      return next(err);
    }
  }

  // =====================================================
  // 切换状态
  // =====================================================
  async toggleStatus(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return Errors.badRequest(res, '无效的任务ID');

      const task = await taskService.toggleStatus(id);
      return success(res, task, task.status === 'DONE' ? '任务已完成' : '任务已重新打开');
    } catch (err: any) {
      return next(err);
    }
  }

  // =====================================================
  // 删除任务
  // =====================================================
  async delete(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return Errors.badRequest(res, '无效的任务ID');

      await taskService.delete(id);
      return success(res, null, '任务删除成功');
    } catch (err: any) {
      return next(err);
    }
  }
}

export default new TaskController();
