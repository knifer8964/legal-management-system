// =====================================================
// 发票管理控制器 (M8)
// =====================================================

import { Request, Response, NextFunction } from 'express';
import invoiceService from '../services/invoiceService';
import { success, Errors } from '../utils/responseUtil';
import { InvoiceStatus } from '@prisma/client';

export class InvoiceController {
  // 创建发票
  async create(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { clientId, subtotal } = req.body;
      if (!clientId || subtotal === undefined) {
        return Errors.badRequest(res, '客户ID和小计金额为必填');
      }
      return success(res, await invoiceService.create(req.body, req.user!.userId), '发票创建成功', 201);
    } catch (err: any) { return next(err); }
  }

  // 列表
  async findAll(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const params = {
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 20,
        clientId: req.query.clientId ? parseInt(req.query.clientId as string) : undefined,
        matterId: req.query.matterId ? parseInt(req.query.matterId as string) : undefined,
        status: req.query.status as InvoiceStatus | undefined,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        search: req.query.search as string,
      };
      return success(res, await invoiceService.findAll(params));
    } catch (err: any) { return next(err); }
  }

  // 统计
  async getStats(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      return success(res, await invoiceService.getStats({
        clientId: req.query.clientId ? parseInt(req.query.clientId as string) : undefined,
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
      const invoice = await invoiceService.findById(id);
      if (!invoice) return Errors.notFound(res, '发票不存在');
      return success(res, invoice);
    } catch (err: any) { return next(err); }
  }

  // 更新
  async update(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return Errors.badRequest(res, '无效ID');
      return success(res, await invoiceService.update(id, req.body), '更新成功');
    } catch (err: any) { return next(err); }
  }

  // 删除
  async delete(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return Errors.badRequest(res, '无效ID');
      await invoiceService.delete(id);
      return success(res, null, '删除成功');
    } catch (err: any) { return next(err); }
  }

  // 关联计时记录
  async linkTimeEntries(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return Errors.badRequest(res, '无效ID');
      const { timeEntryIds } = req.body;
      if (!Array.isArray(timeEntryIds) || timeEntryIds.length === 0) {
        return Errors.badRequest(res, '请提供计时记录ID列表');
      }
      return success(res, await invoiceService.linkTimeEntries(id, timeEntryIds), '计时记录已关联');
    } catch (err: any) { return next(err); }
  }

  // 记录支付
  async recordPayment(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return Errors.badRequest(res, '无效ID');
      const { amount } = req.body;
      if (amount === undefined || amount <= 0) {
        return Errors.badRequest(res, '支付金额必须大于0');
      }
      return success(res, await invoiceService.recordPayment(id, Number(amount)), '支付记录成功');
    } catch (err: any) { return next(err); }
  }
}

export default new InvoiceController();
