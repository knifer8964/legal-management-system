// =====================================================
// 沟通记录控制器
// =====================================================

import { Request, Response, NextFunction } from 'express';
import communicationService from '../services/communicationService';
import { success, Errors } from '../utils/responseUtil';

export class CommunicationController {
  async create(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { clientId, content, channel } = req.body;
      if (!clientId || !content || !channel) {
        return Errors.badRequest(res, '客户ID、内容、渠道为必填');
      }
      const comm = await communicationService.create(req.body, req.user!.userId);
      return success(res, comm, '记录创建成功', 201);
    } catch (err: any) { return next(err); }
  }

  async findAll(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const params = {
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 20,
        sortBy: (req.query.sortBy as string) || 'sentAt',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
        clientId: req.query.clientId ? parseInt(req.query.clientId as string) : undefined,
        matterId: req.query.matterId ? parseInt(req.query.matterId as string) : undefined,
        channel: req.query.channel as any,
        direction: req.query.direction as any,
        search: req.query.search as string,
      };
      return success(res, await communicationService.findAll(params));
    } catch (err: any) { return next(err); }
  }

  async getStats(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      return success(res, await communicationService.getStats({
        clientId: req.query.clientId ? parseInt(req.query.clientId as string) : undefined,
        matterId: req.query.matterId ? parseInt(req.query.matterId as string) : undefined,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      }));
    } catch (err: any) { return next(err); }
  }

  async findById(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return Errors.badRequest(res, '无效ID');
      const comm = await communicationService.getById(id);
      if (!comm) return Errors.notFound(res, '记录不存在');
      return success(res, comm);
    } catch (err: any) { return next(err); }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return Errors.badRequest(res, '无效ID');
      return success(res, await communicationService.update(id, req.body), '更新成功');
    } catch (err: any) { return next(err); }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return Errors.badRequest(res, '无效ID');
      await communicationService.delete(id);
      return success(res, null, '删除成功');
    } catch (err: any) { return next(err); }
  }
}

export default new CommunicationController();
