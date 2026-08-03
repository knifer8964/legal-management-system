// =====================================================
// 计时收费控制器
// =====================================================

import { Request, Response, NextFunction } from 'express';
import timeEntryService from '../services/timeEntryService';
import { success, Errors } from '../utils/responseUtil';

export class TimeEntryController {
  // 开始计时
  async start(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { matterId, clientId, description } = req.body;
      if (!matterId || !clientId || !description) {
        return Errors.badRequest(res, '业务ID、客户ID、描述为必填');
      }
      return success(res, await timeEntryService.start(req.body, req.user!.userId), '计时开始', 201);
    } catch (err: any) { return next(err); }
  }

  // 停止计时
  async stop(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return Errors.badRequest(res, '无效ID');
      return success(res, await timeEntryService.stop(id), '计时已停止');
    } catch (err: any) { return next(err); }
  }

  // 当前运行的计时
  async getRunning(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const entry = await timeEntryService.getRunning(req.user!.userId);
      if (entry) {
        return success(res, entry, '有进行中的计时');
      }
      return success(res, null, '无进行中的计时');
    } catch (err: any) { return next(err); }
  }

  // 手动录入
  async createManual(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { matterId, clientId, description, startTime, endTime } = req.body;
      if (!matterId || !clientId || !description || !startTime || !endTime) {
        return Errors.badRequest(res, '业务ID、客户ID、描述、起止时间为必填');
      }
      return success(res, await timeEntryService.createManual(req.body, req.user!.userId), '录入成功', 201);
    } catch (err: any) { return next(err); }
  }

  // 列表
  async findAll(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const params = {
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 20,
        matterId: req.query.matterId ? parseInt(req.query.matterId as string) : undefined,
        clientId: req.query.clientId ? parseInt(req.query.clientId as string) : undefined,
        userId: req.query.userId ? parseInt(req.query.userId as string) : undefined,
        isBilled: req.query.isBilled !== undefined ? req.query.isBilled === 'true' : undefined,
        isBillable: req.query.isBillable !== undefined ? req.query.isBillable === 'true' : undefined,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      };
      return success(res, await timeEntryService.findAll(params));
    } catch (err: any) { return next(err); }
  }

  // 统计
  async getStats(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      return success(res, await timeEntryService.getStats({
        userId: req.query.userId ? parseInt(req.query.userId as string) : undefined,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      }));
    } catch (err: any) { return next(err); }
  }

  // 详情
  async findById(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return Errors.badRequest(res, '无效ID');
      const entry = await timeEntryService.findById(id);
      if (!entry) return Errors.notFound(res, '计时记录不存在');
      return success(res, entry);
    } catch (err: any) { return next(err); }
  }

  // 更新
  async update(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return Errors.badRequest(res, '无效ID');
      return success(res, await timeEntryService.update(id, req.body), '更新成功');
    } catch (err: any) { return next(err); }
  }

  // 删除
  async delete(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return Errors.badRequest(res, '无效ID');
      await timeEntryService.delete(id);
      return success(res, null, '删除成功');
    } catch (err: any) { return next(err); }
  }
}

export default new TimeEntryController();
